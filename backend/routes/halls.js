const express = require('express');
const mongoose = require('mongoose');
const { requirePartnerAuth } = require('../middleware/partnerAuth');
const { requireAuth } = require('../middleware/auth');
const Hall = require('../models/Hall');
const Partner = require('../models/Partner');
const Booking = require('../models/Booking');
const PayoutEntry = require('../models/PayoutEntry');
const { getMonthAvailability, isSlotTaken } = require('../lib/hallAvailability');
const { getClient: getAnthropicClient } = require('../config/anthropic');
const Config = require('../models/Config');
const User = require('../models/User');

const VISIT_HOURS = 48;

function serializeTokenOwn(b) {
  return {
    id: b.id,
    hallId: b.hallId,
    hallName: b.hallName,
    customer: b.customerName,
    customerId: b.customer ? String(b.customer) : null,
    phone: b.customerPhone,
    date: b.date,
    slot: b.slot,
    guests: b.guests,
    amount: b.amount,
    finalRent: b.finalRent,
    advancePct: b.advancePct,
    advanceAmount: b.advanceAmount,
    advanceDeadlineAtMs: b.advanceDeadlineAt ? new Date(b.advanceDeadlineAt).getTime() : null,
    status: b.status,
    source: b.source || 'online',
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
    visitDay: b.visitDay || null,
    visitTime: b.visitTime || null,
    amount: b.amount,
    finalRent: b.finalRent,
    advancePct: b.advancePct,
    advanceAmount: b.advanceAmount,
    advanceDeadlineAtMs: b.advanceDeadlineAt ? new Date(b.advanceDeadlineAt).getTime() : null,
    status: b.status,
    heldAtMs: b.createdAt ? new Date(b.createdAt).getTime() : Date.now(),
    visitHours: VISIT_HOURS,
    visited: b.status !== 'token_paid',
  };
}

// Lazy expiry: there's no cron/worker in this backend, so an `awaiting_advance` booking
// whose deadline has passed is only actually flipped the next time it's read here — same
// approach the client already uses for the (purely client-computed) visit-window expiry.
// Forfeiture mirrors the existing `notBooked` rule: the customer had their chance to pay
// and didn't, so the partner keeps 20% of the token same as a no-show.
async function sweepExpiredAdvance(booking) {
  if (booking.status !== 'awaiting_advance') return booking;
  if (!booking.advanceDeadlineAt || booking.advanceDeadlineAt > new Date()) return booking;

  booking.status = 'not_booked';
  if (booking.partner) {
    const originalNet = Math.round(booking.amount * (1 - booking.commissionPct / 100));
    const keep = Math.round(booking.amount * 0.2);
    const debit = originalNet - keep;
    if (debit > 0) {
      await PayoutEntry.create({
        partner: booking.partner, type: 'debit', amount: debit,
        description: `Advance not paid in time — ${booking.hallName}`, reference: booking.id,
      });
    }
  }
  await booking.save();
  return booking;
}

const router = express.Router();

// Straight-line distance in km between two lat/lng points — good enough for "X km away"
// sorting/display, not meant to match real driving distance.
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function serializePublic(hall, partner, fromLat, fromLng) {
  const km = (fromLat != null && fromLng != null && hall.lat != null && hall.lng != null)
    ? Math.round(haversineKm(fromLat, fromLng, hall.lat, hall.lng) * 10) / 10
    : null;
  return {
    id: hall.id,
    type: hall.venueType,
    name: hall.name || partner.businessName,
    hotelName: partner.businessName,
    verified: true,
    rating: 0,
    reviews: 0,
    km,
    lat: hall.lat,
    lng: hall.lng,
    area: partner.area,
    city: partner.city,
    blurb: hall.blurb,
    address: hall.address,
    photos: hall.photos || [],
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
    advancePct: hall.advancePct,
    partnerId: partner.id,
    phone: partner.phone,
  };
}

function serializeOwn(hall) {
  return {
    id: hall.id,
    name: hall.name,
    venueType: hall.venueType,
    address: hall.address,
    lat: hall.lat,
    lng: hall.lng,
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
    advancePct: hall.advancePct,
    ac: hall.ac,
    crockery: hall.crockery,
    kitchen: hall.kitchen,
    crockeryNote: hall.crockeryNote,
    catering: hall.catering,
    amenities: hall.amenities,
    blurb: hall.blurb,
    photos: hall.photos || [],
    blockedDates: hall.blockedDates || [],
  };
}

// Public: list halls from verified venue partners with a published hall page. ?lat=&lng=
// (the customer's own current location) are optional — when present, each hall's `km` is a
// real straight-line distance instead of null.
router.get('/', async (req, res) => {
  const fromLat = req.query.lat !== undefined ? Number(req.query.lat) : null;
  const fromLng = req.query.lng !== undefined ? Number(req.query.lng) : null;
  const halls = await Hall.find().populate({ path: 'partner', match: { role: 'venue', verificationStatus: 'verified' } });
  const live = halls.filter((h) => h.partner);
  res.json(live.map((h) => serializePublic(h, h.partner, fromLat, fromLng)));
});

// Venue partners can list several halls under one property (e.g. a hotel with 3-4 halls).
function requireVenue(req, res, next) {
  if (req.partner.role !== 'venue') return res.status(403).json({ error: 'Only venue partners have halls' });
  next();
}

function parseHallBody(body, defaultAdvancePct) {
  const {
    name, venueType, address, lat, lng, seated, floating, sqft, parking, rooms, pricingMode, rent, platePrice, minPlates, token, advancePct,
    ac, crockery, kitchen, crockeryNote, catering, amenities, blurb, photos,
  } = body || {};
  if (!name || !String(name).trim()) return { error: 'Enter the hall name' };
  if (!(seated > 0) || !(floating > 0)) return { error: 'Enter seating and floating capacity' };
  if (pricingMode === 'perPlate' && !(platePrice > 0)) return { error: 'Enter the price per plate' };
  if (pricingMode !== 'perPlate' && !(rent > 0)) return { error: 'Enter the hall rent' };

  const update = {
    name: String(name).trim(), venueType, address,
    lat: typeof lat === 'number' ? lat : null,
    lng: typeof lng === 'number' ? lng : null,
    seated, floating, sqft, parking, rooms,
    pricingMode: pricingMode === 'perPlate' ? 'perPlate' : 'rent',
    rent, platePrice, minPlates, token,
    advancePct: advancePct > 0 && advancePct <= 100 ? advancePct : defaultAdvancePct,
    ac, crockery, kitchen, crockeryNote, catering, amenities, blurb,
  };
  if (Array.isArray(photos)) update.photos = photos.slice(0, 15);
  return { update };
}

// Partner: all halls under their property, oldest first.
router.get('/me/halls', requirePartnerAuth, requireVenue, async (req, res) => {
  const halls = await Hall.find({ partner: req.partner.id }).sort({ createdAt: 1 });
  res.json(halls.map(serializeOwn));
});

router.post('/me/halls', requirePartnerAuth, requireVenue, async (req, res) => {
  const { defaultAdvancePct } = await Config.get();
  const parsed = parseHallBody(req.body, defaultAdvancePct);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const hall = await Hall.create({ ...parsed.update, partner: req.partner.id });
  res.status(201).json(serializeOwn(hall));
});

router.get('/me/halls/:hallId', requirePartnerAuth, requireVenue, async (req, res) => {
  const hall = await Hall.findOne({ _id: req.params.hallId, partner: req.partner.id });
  if (!hall) return res.status(404).json({ error: 'Hall not found' });
  res.json(serializeOwn(hall));
});

router.put('/me/halls/:hallId', requirePartnerAuth, requireVenue, async (req, res) => {
  const { defaultAdvancePct } = await Config.get();
  const parsed = parseHallBody(req.body, defaultAdvancePct);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const hall = await Hall.findOneAndUpdate(
    { _id: req.params.hallId, partner: req.partner.id },
    parsed.update,
    { new: true },
  );
  if (!hall) return res.status(404).json({ error: 'Hall not found' });
  res.json(serializeOwn(hall));
});

// Refused while the hall still has an open booking, so no customer is left holding a dead hold.
router.delete('/me/halls/:hallId', requirePartnerAuth, requireVenue, async (req, res) => {
  const hall = await Hall.findOne({ _id: req.params.hallId, partner: req.partner.id });
  if (!hall) return res.status(404).json({ error: 'Hall not found' });
  const openBookings = await Booking.countDocuments({
    hallId: String(hall.id),
    status: { $in: ['token_paid', 'visited', 'awaiting_advance'] },
  });
  if (openBookings > 0) {
    return res.status(409).json({ error: 'This hall has open pre-bookings. Resolve them before deleting it.' });
  }
  await hall.deleteOne();
  res.status(204).send();
});

// Partner: replace the full set of dates they've manually blocked off for this hall
// (maintenance, a private function) — a simple full-replace matching the calendar's toggle UX.
router.put('/me/halls/:hallId/blocked-dates', requirePartnerAuth, requireVenue, async (req, res) => {
  const { dates } = req.body || {};
  if (!Array.isArray(dates)) return res.status(400).json({ error: 'dates must be an array' });
  const hall = await Hall.findOneAndUpdate(
    { _id: req.params.hallId, partner: req.partner.id },
    { blockedDates: dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(0, 1000) },
    { new: true },
  );
  if (!hall) return res.status(404).json({ error: 'Hall not found' });
  res.json({ blockedDates: hall.blockedDates });
});

// Partner: mark a specific date+slot as booked (a walk-in/phone booking that never went
// through the app) — the "mark as booked" quick action. Creates a real Booking record with
// no customer behind it, so it blocks the slot for online customers exactly like a real
// booking does, via the same availability/conflict checks in lib/hallAvailability.js.
router.post('/me/halls/:hallId/offline-bookings', requirePartnerAuth, requireVenue, async (req, res) => {
  const { date, slot } = req.body || {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  if (slot !== 'Morning' && slot !== 'Evening') return res.status(400).json({ error: 'slot must be Morning or Evening' });

  const hall = await Hall.findOne({ _id: req.params.hallId, partner: req.partner.id });
  if (!hall) return res.status(404).json({ error: 'Hall not found' });

  const { taken, reason } = await isSlotTaken(req.params.hallId, date, slot);
  if (taken) return res.status(409).json({ error: reason });

  const booking = await Booking.create({
    partner: req.partner.id,
    hallId: req.params.hallId,
    hallName: hall.name,
    customerName: 'Walk-in',
    date, slot,
    amount: 0,
    status: 'confirmed',
    source: 'offline',
  });
  res.status(201).json(serializeTokenOwn(booking));
});

// Partner: undo a "mark as booked" — only ever removes offline (walk-in) entries, never a
// real customer's booking, so this can't be used to silently erase someone's paid token.
router.delete('/me/halls/:hallId/offline-bookings/:bookingId', requirePartnerAuth, requireVenue, async (req, res) => {
  const result = await Booking.deleteOne({
    _id: req.params.bookingId,
    hallId: req.params.hallId,
    partner: req.partner.id,
    source: 'offline',
  });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Offline booking not found' });
  res.status(204).send();
});

// Partner: read a photo of their paper booking register/calendar and extract which dates
// in the given month look booked — returns the list for the owner to review and correct in
// the app before anything is saved (same "AI suggests, human confirms" pattern as the item
// photo-classify flow). Nothing is written to the database by this route.
router.post('/me/halls/:hallId/register-photo', requirePartnerAuth, requireVenue, async (req, res) => {
  const { imageBase64, month } = req.body || {};
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }
  if (!/^\d{4}-\d{2}$/.test(month || '')) {
    return res.status(400).json({ error: 'month must be YYYY-MM' });
  }
  const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'imageBase64 must be a data URI' });
  const [, mediaType, data] = match;

  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  let message;
  try {
    message = await getAnthropicClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
          {
            type: 'text',
            text: `You are reading a photo of an Indian event-hall owner's handwritten paper booking register or calendar page, covering the month ${month} (which has ${daysInMonth} days). Find every date in this month that appears marked as booked — circled, ticked, or has a customer name/note written against it.

For each booked date you find, report the day number (1-${daysInMonth}) and, only if clearly indicated, which half of the day: "Morning", "Evening", or "FullDay" if the whole day is taken or the photo doesn't distinguish. If you genuinely cannot read the photo (too blurry, not a calendar/register at all), return {"error": "unclear"}.

Return ONLY strict JSON, no other text: {"days": [{"day": <number>, "slot": "Morning"|"Evening"|"FullDay"}]}`,
          },
        ],
      }],
    });
  } catch (e) {
    return res.status(502).json({ error: 'Could not read the photo right now. Try again.' });
  }

  let parsed;
  try {
    const text = (message.content || []).map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
    const jsonText = text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    parsed = JSON.parse(jsonText);
  } catch {
    return res.status(502).json({ error: 'Could not understand that photo. Try a clearer shot.' });
  }
  if (parsed.error || !Array.isArray(parsed.days)) {
    return res.status(422).json({ error: 'Could not clearly read any booked dates in that photo. Try a clearer shot.' });
  }

  const seen = new Set();
  const dates = [];
  parsed.days.forEach((d) => {
    const day = Number(d.day);
    if (!Number.isInteger(day) || day < 1 || day > daysInMonth) return;
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;
    const slot = d.slot === 'Morning' || d.slot === 'Evening' ? d.slot : 'FullDay';
    const key = `${dateStr}-${slot}`;
    if (seen.has(key)) return;
    seen.add(key);
    dates.push({ date: dateStr, slot });
  });
  res.json({ dates });
});

// Partner: confirm the (owner-reviewed, possibly edited) list of dates from a register-photo
// read and actually create the offline bookings — only ever adds new blocks, same as the
// single "mark as booked" action, never removes anything. Skips any date+slot that's already
// taken instead of failing the whole batch, and reports back what happened to each.
router.post('/me/halls/:hallId/register-photo/confirm', requirePartnerAuth, requireVenue, async (req, res) => {
  const { dates } = req.body || {};
  if (!Array.isArray(dates) || dates.length === 0) {
    return res.status(400).json({ error: 'dates must be a non-empty array' });
  }
  const hall = await Hall.findOne({ _id: req.params.hallId, partner: req.partner.id });
  if (!hall) return res.status(404).json({ error: 'Hall not found' });

  const results = [];
  for (const entry of dates.slice(0, 62)) { // up to a 31-day FullDay month, each as 2 slots
    const { date, slot } = entry || {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) { results.push({ date, slot, ok: false, reason: 'Invalid date' }); continue; }
    const slotsToBook = slot === 'FullDay' ? ['Morning', 'Evening'] : [slot];
    for (const s of slotsToBook) {
      if (s !== 'Morning' && s !== 'Evening') { results.push({ date, slot: s, ok: false, reason: 'Invalid slot' }); continue; }
      const { taken, reason } = await isSlotTaken(req.params.hallId, date, s);
      if (taken) { results.push({ date, slot: s, ok: false, reason }); continue; }
      await Booking.create({
        partner: req.partner.id, hallId: req.params.hallId, hallName: hall.name,
        customerName: 'Walk-in', date, slot: s, amount: 0, status: 'confirmed', source: 'offline',
      });
      results.push({ date, slot: s, ok: true, reason: null });
    }
  }
  res.json({ results });
});

// Partner: list this hall's real pre-bookings (tokens), newest first.
router.get('/me/tokens', requirePartnerAuth, async (req, res) => {
  if (req.partner.role !== 'venue') return res.status(403).json({ error: 'Only venue partners have pre-bookings' });
  const bookings = await Booking.find({ partner: req.partner.id }).sort({ createdAt: -1 });
  await Promise.all(bookings.map(sweepExpiredAdvance));

  // Backfill customerName/customerPhone for bookings whose snapshot came out blank (e.g. the
  // customer hadn't finished their profile at booking time) — permanent fix, not just masked
  // for this response, so the admin panel and anywhere else reading these fields picks it up.
  const missingInfo = bookings.filter((b) => (!b.customerName || !b.customerPhone) && b.customer);
  if (missingInfo.length > 0) {
    const users = await User.find({ _id: { $in: missingInfo.map((b) => b.customer) } }).select('name phone').lean();
    const userById = new Map(users.map((u) => [String(u._id), u]));
    await Promise.all(missingInfo.map((b) => {
      const user = userById.get(String(b.customer));
      if (!user) return null;
      let changed = false;
      if (!b.customerName && user.name) { b.customerName = user.name; changed = true; }
      if (!b.customerPhone && user.phone) { b.customerPhone = user.phone; changed = true; }
      return changed ? b.save() : null;
    }));
  }

  res.json(bookings.map(serializeTokenOwn));
});

// Partner actions on a pre-booking. Token money was already credited to the partner in full
// (minus commission) at payment time, so these transitions only touch the payout ledger when
// the published refund policy says the partner should end up with less than that:
//  - visited: no money changes hands, just a status update so the partner can see progress.
//  - confirm: partner sets the rent agreed in person; this does NOT confirm the booking by
//    itself any more — it starts a real advance-payment request (see payments.js's
//    /create-advance-order + /verify) that the customer must pay within advanceDeadlineAt for
//    the booking to actually reach 'confirmed'. See sweepExpiredAdvance for the missed-deadline case.
//  - notBooked: customer visited but decided not to book — partner keeps 20% of the token,
//    customer gets 80% back, so we debit the partner down from their original 90% net credit.
//  - cantHost: partner can't actually host this date — customer gets a full refund, so the
//    original credit is fully reversed.
router.patch('/me/tokens/:id', requirePartnerAuth, async (req, res) => {
  if (req.partner.role !== 'venue') return res.status(403).json({ error: 'Only venue partners have pre-bookings' });
  const booking = await Booking.findOne({ _id: req.params.id, partner: req.partner.id });
  if (!booking) return res.status(404).json({ error: 'Pre-booking not found' });
  await sweepExpiredAdvance(booking);

  const { action, finalRent } = req.body || {};
  const originalNet = Math.round(booking.amount * (1 - booking.commissionPct / 100));

  if (action === 'visited') {
    booking.status = 'visited';
  } else if (action === 'confirm') {
    if (!(finalRent > 0)) return res.status(400).json({ error: 'Enter the final rent' });
    const hall = mongoose.isValidObjectId(booking.hallId)
      ? await Hall.findOne({ _id: booking.hallId, partner: req.partner.id })
      : null;
    const advancePct = hall?.advancePct > 0 ? hall.advancePct : (await Config.get()).defaultAdvancePct;
    booking.status = 'awaiting_advance';
    booking.finalRent = finalRent;
    booking.advancePct = advancePct;
    booking.advanceAmount = Math.round(finalRent * (advancePct / 100));
    booking.advanceDeadlineAt = new Date(Date.now() + 24 * 3600 * 1000);
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
    status: { $in: ['token_paid', 'visited', 'awaiting_advance', 'confirmed'] },
  }).sort({ createdAt: -1 });
  if (booking) await sweepExpiredAdvance(booking);
  res.json(booking && booking.status !== 'not_booked' ? serializeTokenForCustomer(booking) : null);
});

// Customer: every hall pre-booking they've ever made, newest first — for the Bookings
// history tab (unlike /my-token above, which is just the single current active one).
router.get('/my-tokens', requireAuth, async (req, res) => {
  const bookings = await Booking.find({ customer: req.user.id }).sort({ createdAt: -1 });
  await Promise.all(bookings.map(sweepExpiredAdvance));
  res.json(bookings.map(serializeTokenForCustomer));
});

// Customer actions on their own pre-booking.
//  - cancel: within the cancellation window, full refund — partner's credit is reversed.
//  - notBooking: customer opts out after visiting — same 80/20 split as the partner-initiated version.
//  - dispute: hall didn't match the listing — flagged for Tamboo to review manually, no automatic refund.
router.patch('/my-token/:id', requireAuth, async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.user.id });
  if (!booking) return res.status(404).json({ error: 'Pre-booking not found' });
  await sweepExpiredAdvance(booking);

  const { action } = req.body || {};
  const originalNet = Math.round(booking.amount * (1 - booking.commissionPct / 100));

  if (action === 'scheduleVisit') {
    const { visitDay, visitTime } = req.body || {};
    const VALID_DAYS = ['today', 'tomorrow', 'dayAfter'];
    const VALID_TIMES = ['morning', 'afternoon', 'evening', 'night'];
    if (!VALID_DAYS.includes(visitDay) || !VALID_TIMES.includes(visitTime)) {
      return res.status(400).json({ error: 'Invalid visit day/time' });
    }
    booking.visitDay = visitDay;
    booking.visitTime = visitTime;
  } else if (action === 'cancel') {
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

// Public: real Morning/Evening availability for a whole month, computed from this hall's
// blocked dates plus its active bookings — replaces what used to be client-side fake data.
router.get('/:id/availability', async (req, res) => {
  const { month } = req.query;
  if (!/^\d{4}-\d{2}$/.test(month || '')) {
    return res.status(400).json({ error: 'month must be YYYY-MM' });
  }
  const result = await getMonthAvailability(req.params.id, month);
  if (!result) return res.status(404).json({ error: 'Hall not found' });
  res.json(result);
});

module.exports = router;
