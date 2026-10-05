const express = require('express');
const { requirePartnerAuth } = require('../middleware/partnerAuth');
const { requireAuth } = require('../middleware/auth');
const Hall = require('../models/Hall');
const Partner = require('../models/Partner');
const Booking = require('../models/Booking');
const PayoutEntry = require('../models/PayoutEntry');

const VISIT_HOURS = 48;

function serializeTokenOwn(b) {
  return {
    id: b.id,
    hallId: b.hallId,
    hallName: b.hallName,
    customer: b.customerName,
    phone: b.customerPhone,
    date: b.date,
    slot: b.slot,
    guests: b.guests,
    amount: b.amount,
    finalRent: b.finalRent,
    status: b.status,
    heldAtMs: b.createdAt ? new Date(b.createdAt).getTime() : Date.now(),
    visitHours: VISIT_HOURS,
  };
}

function serializeTokenForCustomer(b) {
  return {
    id: b.id,
    hallId: b.hallId,
    hallName: b.hallName,
    date: b.date,
    slot: b.slot,
    guests: String(b.guests || ''),
    amount: b.amount,
    status: b.status,
    heldAtMs: b.createdAt ? new Date(b.createdAt).getTime() : Date.now(),
    visitHours: VISIT_HOURS,
    visited: b.status !== 'token_paid',
  };
}

const router = express.Router();

function serializePublic(hall, partner) {
  return {
    id: hall.id,
    type: hall.venueType,
    name: partner.businessName,
    verified: true,
    rating: 0,
    reviews: 0,
    km: 0,
    area: partner.area,
    city: partner.city,
    blurb: hall.blurb,
    address: hall.address,
    cap: `${hall.seated}–${hall.floating} pax`,
    ac: hall.ac,
    facts: [
      { k: 'Capacity', v: `${hall.seated}–${hall.floating} pax` },
      { k: 'Parking', v: `${hall.parking} cars` },
      { k: 'Rooms', v: `${hall.rooms}` },
      { k: 'Size', v: `${hall.sqft} sq ft` },
      { k: 'Catering', v: hall.catering || '—' },
      { k: 'Kitchen', v: hall.kitchen ? 'Available' : 'Not available' },
    ],
    hasCrockery: hall.crockery,
    amenities: hall.amenities,
    pricingMode: hall.pricingMode,
    rent: hall.rent,
    platePrice: hall.platePrice,
    minPlates: hall.minPlates,
    token: hall.token,
    partnerId: partner.id,
    phone: partner.phone,
  };
}

function serializeOwn(hall) {
  return {
    venueType: hall.venueType,
    address: hall.address,
    seated: hall.seated,
    floating: hall.floating,
    sqft: hall.sqft,
    parking: hall.parking,
    rooms: hall.rooms,
    pricingMode: hall.pricingMode,
    rent: hall.rent,
    platePrice: hall.platePrice,
    minPlates: hall.minPlates,
    token: hall.token,
    ac: hall.ac,
    crockery: hall.crockery,
    kitchen: hall.kitchen,
    crockeryNote: hall.crockeryNote,
    catering: hall.catering,
    amenities: hall.amenities,
    blurb: hall.blurb,
  };
}

// Public: list halls from verified venue partners with a published hall page.
router.get('/', async (req, res) => {
  const halls = await Hall.find().populate({ path: 'partner', match: { role: 'venue', verificationStatus: 'verified' } });
  const live = halls.filter((h) => h.partner);
  res.json(live.map((h) => serializePublic(h, h.partner)));
});

router.get('/me', requirePartnerAuth, async (req, res) => {
  if (req.partner.role !== 'venue') return res.status(403).json({ error: 'Only venue partners have a hall page' });
  const hall = await Hall.findOne({ partner: req.partner.id });
  res.json(hall ? serializeOwn(hall) : null);
});

router.put('/me', requirePartnerAuth, async (req, res) => {
  if (req.partner.role !== 'venue') return res.status(403).json({ error: 'Only venue partners have a hall page' });
  const {
    venueType, address, seated, floating, sqft, parking, rooms, pricingMode, rent, platePrice, minPlates, token,
    ac, crockery, kitchen, crockeryNote, catering, amenities, blurb,
  } = req.body || {};
  if (!(seated > 0) || !(floating > 0)) return res.status(400).json({ error: 'Enter seating and floating capacity' });
  if (pricingMode === 'perPlate' && !(platePrice > 0)) return res.status(400).json({ error: 'Enter the price per plate' });
  if (pricingMode !== 'perPlate' && !(rent > 0)) return res.status(400).json({ error: 'Enter the hall rent' });

  const hall = await Hall.findOneAndUpdate(
    { partner: req.partner.id },
    {
      venueType, address, seated, floating, sqft, parking, rooms,
      pricingMode: pricingMode === 'perPlate' ? 'perPlate' : 'rent',
      rent, platePrice, minPlates, token,
      ac, crockery, kitchen, crockeryNote, catering, amenities, blurb,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  res.json(serializeOwn(hall));
});

// Partner: list this hall's real pre-bookings (tokens), newest first.
router.get('/me/tokens', requirePartnerAuth, async (req, res) => {
  if (req.partner.role !== 'venue') return res.status(403).json({ error: 'Only venue partners have pre-bookings' });
  const bookings = await Booking.find({ partner: req.partner.id }).sort({ createdAt: -1 });
  res.json(bookings.map(serializeTokenOwn));
});

// Partner actions on a pre-booking. Token money was already credited to the partner in full
// (minus commission) at payment time, so these transitions only touch the payout ledger when
// the published refund policy says the partner should end up with less than that:
//  - visited: no money changes hands, just a status update so the partner can see progress.
//  - confirm: customer is renting the hall; the token is treated as already settled, and the
//    balance of `finalRent` is collected by the partner directly at the hall (outside Tamboo).
//  - notBooked: customer visited but decided not to book — partner keeps 20% of the token,
//    customer gets 80% back, so we debit the partner down from their original 90% net credit.
//  - cantHost: partner can't actually host this date — customer gets a full refund, so the
//    original credit is fully reversed.
router.patch('/me/tokens/:id', requirePartnerAuth, async (req, res) => {
  if (req.partner.role !== 'venue') return res.status(403).json({ error: 'Only venue partners have pre-bookings' });
  const booking = await Booking.findOne({ _id: req.params.id, partner: req.partner.id });
  if (!booking) return res.status(404).json({ error: 'Pre-booking not found' });

  const { action, finalRent } = req.body || {};
  const originalNet = Math.round(booking.amount * (1 - booking.commissionPct / 100));

  if (action === 'visited') {
    booking.status = 'visited';
  } else if (action === 'confirm') {
    if (!(finalRent > 0)) return res.status(400).json({ error: 'Enter the final rent' });
    booking.status = 'confirmed';
    booking.finalRent = finalRent;
  } else if (action === 'notBooked') {
    booking.status = 'not_booked';
    const keep = Math.round(booking.amount * 0.2);
    const debit = originalNet - keep;
    if (debit > 0) {
      await PayoutEntry.create({
        partner: req.partner.id, type: 'debit', amount: debit,
        description: `Not booked — ${booking.hallName}`, reference: booking.id,
      });
    }
  } else if (action === 'cantHost') {
    booking.status = 'cancelled';
    if (originalNet > 0) {
      await PayoutEntry.create({
        partner: req.partner.id, type: 'debit', amount: originalNet,
        description: `Hall couldn't host — ${booking.hallName}`, reference: booking.id,
      });
    }
  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }

  await booking.save();
  res.json(serializeTokenOwn(booking));
});

// Customer: their single most recent active pre-booking (if any), so it survives app restarts.
router.get('/my-token', requireAuth, async (req, res) => {
  const booking = await Booking.findOne({
    customer: req.user.id,
    status: { $in: ['token_paid', 'visited'] },
  }).sort({ createdAt: -1 });
  res.json(booking ? serializeTokenForCustomer(booking) : null);
});

// Customer actions on their own pre-booking.
//  - cancel: within the cancellation window, full refund — partner's credit is reversed.
//  - notBooking: customer opts out after visiting — same 80/20 split as the partner-initiated version.
//  - dispute: hall didn't match the listing — flagged for Tamboo to review manually, no automatic refund.
router.patch('/my-token/:id', requireAuth, async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.user.id });
  if (!booking) return res.status(404).json({ error: 'Pre-booking not found' });

  const { action } = req.body || {};
  const originalNet = Math.round(booking.amount * (1 - booking.commissionPct / 100));

  if (action === 'cancel') {
    booking.status = 'cancelled';
    if (booking.partner && originalNet > 0) {
      await PayoutEntry.create({
        partner: booking.partner, type: 'debit', amount: originalNet,
        description: `Customer cancelled — ${booking.hallName}`, reference: booking.id,
      });
    }
  } else if (action === 'notBooking') {
    booking.status = 'not_booked';
    if (booking.partner) {
      const keep = Math.round(booking.amount * 0.2);
      const debit = originalNet - keep;
      if (debit > 0) {
        await PayoutEntry.create({
          partner: booking.partner, type: 'debit', amount: debit,
          description: `Not booked — ${booking.hallName}`, reference: booking.id,
        });
      }
    }
  } else if (action === 'dispute') {
    booking.status = 'disputed';
  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }

  await booking.save();
  res.json(serializeTokenForCustomer(booking));
});

// Public: single hall detail — only if its partner is verified.
router.get('/:id', async (req, res) => {
  const hall = await Hall.findById(req.params.id).populate('partner');
  if (!hall || !hall.partner || hall.partner.role !== 'venue' || hall.partner.verificationStatus !== 'verified') {
    return res.status(404).json({ error: 'Hall not found' });
  }
  res.json(serializePublic(hall, hall.partner));
});

module.exports = router;
