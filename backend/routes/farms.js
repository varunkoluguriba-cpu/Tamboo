const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const { requireAuth, requireAccount } = require('../middleware/auth');
const { requirePartnerAuth } = require('../middleware/partnerAuth');
const { getClient } = require('../config/razorpay');
const { markRefundDue } = require('../lib/refunds');
const { SLOTS, checkSlot, monthAvailability, priceFor, nowMinIST } = require('../lib/farmAvailability');
const Config = require('../models/Config');
const FarmHouse = require('../models/FarmHouse');
const FarmBooking = require('../models/FarmBooking');
const PayoutEntry = require('../models/PayoutEntry');

const router = express.Router();
const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const bookingCode = () => 'FB-' + (100000 + Math.floor(Math.random() * 900000));
const FREE_CANCEL_HOURS = 2;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Lowest weekday price among the slots on offer — the "from ₹X" on listing cards.
function fromPrice(f) {
  const prices = SLOTS.filter((s) => f.slots[s] && f.slots[s].enabled).map((s) => f.slots[s].weekdayPrice).filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : null;
}

// What every customer sees. The exact address (and map pin) is shared only after booking.
function publicFarm(f, from) {
  const km = from && f.lat != null && f.lng != null ? Math.round(haversineKm(from.lat, from.lng, f.lat, f.lng) * 10) / 10 : null;
  return {
    id: f._id.toString(), name: f.name, about: f.about, area: f.area, distanceFromCityKm: f.distanceFromCityKm, km,
    photos: f.photos, slots: f.slots, maxGuests: f.maxGuests, includedGuests: f.includedGuests, extraGuestCharge: f.extraGuestCharge,
    bedrooms: f.bedrooms, acRooms: f.acRooms, beds: f.beds, bathrooms: f.bathrooms, lawnSqft: f.lawnSqft, parkingCars: f.parkingCars,
    amenities: f.amenities, poolDetails: f.poolDetails, rules: f.rules, securityDeposit: f.securityDeposit, advancePct: f.advancePct,
    addons: f.addons, fromPrice: fromPrice(f),
  };
}

function customerBooking(b, farm) {
  const showAddress = b.status === 'confirmed' || b.status === 'completed';
  return {
    id: b.id, code: b.code, farmId: String(b.farm), farmName: b.farmName, date: b.date, slot: b.slot, checkIn: b.checkIn, checkOut: b.checkOut,
    guests: b.guests, occasion: b.occasion, basePrice: b.basePrice, extraGuests: b.extraGuests, extraGuestCharge: b.extraGuestCharge,
    total: b.total, advanceAmount: b.advanceAmount, balanceAmount: b.balanceAmount, securityDeposit: b.securityDeposit, status: b.status,
    cancelledBy: b.cancelledBy, refundStatus: b.refundStatus || 'none', refundAmount: b.refundAmount || 0, createdAt: b.createdAt,
    address: showAddress && farm ? farm.address : '', lat: showAddress && farm ? farm.lat : null, lng: showAddress && farm ? farm.lng : null,
    ownerPhone: showAddress && farm && farm.partner && farm.partner.phone ? farm.partner.phone : '',
  };
}

function ownerBooking(b) {
  return {
    id: b.id, code: b.code, farmId: String(b.farm), farmName: b.farmName, customerName: b.customerName, customerPhone: b.customerPhone,
    date: b.date, slot: b.slot, checkIn: b.checkIn, checkOut: b.checkOut, guests: b.guests, occasion: b.occasion,
    total: b.total, advanceAmount: b.advanceAmount, balanceAmount: b.balanceAmount, securityDeposit: b.securityDeposit,
    commissionPct: b.commissionPct, youReceiveOnline: Math.round(b.advanceAmount * (1 - b.commissionPct / 100)),
    status: b.status, cancelledBy: b.cancelledBy, startMin: b.startMin, createdAt: b.createdAt,
  };
}

// Refund share of the advance when the customer cancels (owner cancelling = always 100%).
function customerRefundPct(b) {
  const hoursSinceBooking = (Date.now() - new Date(b.createdAt).getTime()) / 3600000;
  if (hoursSinceBooking <= FREE_CANCEL_HOURS) return 100;
  const hoursToCheckIn = (b.startMin - nowMinIST()) / 60;
  if (hoursToCheckIn >= 7 * 24) return 100;
  if (hoursToCheckIn >= 72) return 50;
  return 0;
}

async function cancelBooking(b, by, pct, reason) {
  const claimed = await FarmBooking.updateOne({ _id: b._id, status: 'confirmed' }, { $set: { status: 'cancelled', cancelledBy: by } });
  if (claimed.modifiedCount === 0) return null;
  const fresh = await FarmBooking.findById(b._id);
  const refund = Math.round((fresh.advanceAmount * pct) / 100);
  if (refund > 0) {
    markRefundDue(fresh, refund, reason);
    await fresh.save();
    // The owner was credited the advance minus commission; take back the refunded share.
    const debit = Math.round(refund * (1 - fresh.commissionPct / 100));
    if (debit > 0) await PayoutEntry.create({ partner: fresh.partner, type: 'debit', amount: debit, description: `Farm booking cancelled — ${fresh.farmName}`, reference: fresh.id });
  }
  return fresh;
}

// ======================= public =======================

router.get('/amenities', (req, res) => res.json(FarmHouse.AMENITIES));

router.get('/', async (req, res) => {
  const from = req.query.lat !== undefined && req.query.lng !== undefined ? { lat: Number(req.query.lat), lng: Number(req.query.lng) } : null;
  const farms = await FarmHouse.find({ published: true }).populate({ path: 'partner', match: { role: 'farm', verificationStatus: 'verified', deletedAt: null }, select: '_id' });
  const list = farms.filter((f) => f.partner).map((f) => publicFarm(f, from && Number.isFinite(from.lat) ? from : null));
  res.json(list.map((f) => ({ ...f, photos: f.photos.slice(0, 1) })));
});

router.get('/bookings/me', requireAuth, async (req, res) => {
  const list = await FarmBooking.find({ customer: req.user._id, status: { $ne: 'pending' } }).sort({ startMin: -1 });
  const farms = await FarmHouse.find({ _id: { $in: list.map((b) => b.farm) } }).populate('partner', 'phone');
  const byId = new Map(farms.map((f) => [f.id, f]));
  res.json(list.map((b) => customerBooking(b, byId.get(String(b.farm)))));
});

router.post('/bookings/:id/verify', requireAuth, requireAccount, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Booking not found' });
  const b = await FarmBooking.findOne({ _id: req.params.id, customer: req.user._id });
  if (!b) return res.status(404).json({ error: 'Booking not found' });
  if (b.status !== 'pending') return res.json({ verified: true, booking: customerBooking(b) });
  if (!razorpay_order_id || razorpay_order_id !== b.razorpayOrderId || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Payment details missing' });
  }
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (expected !== razorpay_signature) return res.json({ verified: false });

  // Payment is captured. Re-check the slot (someone may have paid for an overlapping stay while
  // this customer was in the payment sheet) — a clash is kept as 'disputed' with a full refund due.
  const again = await checkSlot(b.farm, b.date, b.slot, b.guests, { excludeBookingId: b._id });
  b.razorpayPaymentId = razorpay_payment_id;
  if (!again.ok) {
    b.status = 'disputed';
    markRefundDue(b, b.advanceAmount, `Slot no longer available after payment: ${again.reason}`);
    await b.save();
    return res.json({ verified: true, conflict: true, booking: customerBooking(b) });
  }
  b.status = 'confirmed';
  await b.save();
  await PayoutEntry.create({ partner: b.partner, type: 'credit', amount: Math.round(b.advanceAmount * (1 - b.commissionPct / 100)), description: `Farm booking advance — ${b.farmName}`, reference: b.id });
  const farm = await FarmHouse.findById(b.farm).populate('partner', 'phone');
  res.json({ verified: true, booking: customerBooking(b, farm) });
});

router.post('/bookings/:id/cancel', requireAuth, async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Booking not found' });
  const b = await FarmBooking.findOne({ _id: req.params.id, customer: req.user._id });
  if (!b || b.status !== 'confirmed') return res.status(400).json({ error: 'This booking can no longer be cancelled' });
  if (b.startMin <= nowMinIST()) return res.status(400).json({ error: 'This stay has already started' });
  const pct = customerRefundPct(b);
  const done = await cancelBooking(b, 'customer', pct, `Customer cancelled (${pct}% of advance back)`);
  if (!done) return res.status(400).json({ error: 'This booking can no longer be cancelled' });
  res.json({ booking: customerBooking(done), refundPct: pct });
});

// ======================= owner (farm partner) =======================

function requireFarmRole(req, res, next) {
  if (req.partner.role !== 'farm') return res.status(403).json({ error: 'Only farm-house partners can do this' });
  next();
}
const owner = [requirePartnerAuth, requireFarmRole];

function farmFields(b) {
  const num = (v, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n <= max ? n : null; };
  const out = {};
  if (b.name !== undefined) { const n = String(b.name).trim(); if (n.length < 3) return { error: 'Enter the farm house name' }; out.name = n.slice(0, 80); }
  for (const k of ['about', 'area', 'address', 'poolDetails']) if (b[k] !== undefined) out[k] = String(b[k]).trim().slice(0, k === 'about' ? 1500 : 200);
  for (const [k, max] of [['maxGuests', 5000], ['includedGuests', 5000], ['extraGuestCharge', 100000], ['bedrooms', 100], ['acRooms', 100], ['beds', 200], ['bathrooms', 100], ['lawnSqft', 10000000], ['parkingCars', 1000], ['securityDeposit', 1000000], ['distanceFromCityKm', 500]]) {
    if (b[k] !== undefined) { const n = num(b[k], max); if (n == null) return { error: `Check the value for ${k}` }; out[k] = n; }
  }
  if (b.advancePct !== undefined) { const n = num(b.advancePct, 100); if (n == null || n < 10) return { error: 'Advance must be 10–100%' }; out.advancePct = n; }
  if (b.lat !== undefined && b.lng !== undefined) { out.lat = b.lat === null ? null : Number(b.lat); out.lng = b.lng === null ? null : Number(b.lng); }
  if (Array.isArray(b.amenities)) out.amenities = b.amenities.filter((a) => FarmHouse.AMENITIES.includes(a));
  if (Array.isArray(b.photos)) out.photos = b.photos.filter((p) => typeof p === 'string' && p.startsWith('data:image/')).slice(0, 15);
  if (Array.isArray(b.addons)) out.addons = b.addons.map((a) => ({ name: String(a.name || '').trim().slice(0, 60), price: num(a.price, 1000000) || 0 })).filter((a) => a.name).slice(0, 15);
  if (b.rules && typeof b.rules === 'object') {
    const r = b.rules;
    out.rules = {
      eventsAllowed: !!r.eventsAllowed, alcoholAllowed: !!r.alcoholAllowed, outsideFoodAllowed: !!r.outsideFoodAllowed, djAllowed: !!r.djAllowed,
      petsAllowed: !!r.petsAllowed, smokingOutdoorOnly: r.smokingOutdoorOnly !== false, minAge: num(r.minAge, 99) ?? 18,
      musicTill: /^\d{1,2}:\d{2}$/.test(r.musicTill || '') ? r.musicTill : '', other: String(r.other || '').slice(0, 500),
    };
  }
  if (b.slots && typeof b.slots === 'object') {
    out.slots = {};
    for (const s of SLOTS) {
      const c = b.slots[s] || {};
      const time = (t, d) => (/^\d{1,2}:\d{2}$/.test(t || '') ? t : d);
      out.slots[s] = { enabled: !!c.enabled, start: time(c.start, '09:00'), end: time(c.end, '18:00'), weekdayPrice: num(c.weekdayPrice, 10000000) || 0, weekendPrice: num(c.weekendPrice, 10000000) || 0 };
      if (out.slots[s].enabled && out.slots[s].weekdayPrice <= 0) return { error: 'Enter a price for every stay type you offer' };
    }
    if (!SLOTS.some((s) => out.slots[s].enabled)) return { error: 'Offer at least one stay type (Day, Night or Full day)' };
  }
  if (out.includedGuests !== undefined && out.maxGuests !== undefined && out.maxGuests > 0 && out.includedGuests > out.maxGuests) return { error: 'Guests included in the price can’t be more than the maximum' };
  return out;
}

router.get('/me/farms', ...owner, async (req, res) => {
  res.json((await FarmHouse.find({ partner: req.partner._id }).sort({ createdAt: 1 })).map((f) => ({ ...publicFarm(f), address: f.address, lat: f.lat, lng: f.lng, blockedDates: f.blockedDates, published: f.published })));
});

router.post('/me/farms', ...owner, async (req, res) => {
  const f = farmFields(req.body || {});
  if (f.error) return res.status(400).json({ error: f.error });
  if (!f.name) return res.status(400).json({ error: 'Enter the farm house name' });
  if ((await FarmHouse.countDocuments({ partner: req.partner._id })) >= 10) return res.status(400).json({ error: 'You can list up to 10 farm houses' });
  const farm = await FarmHouse.create({ partner: req.partner._id, area: req.partner.area, ...f, ...(typeof req.body.published === 'boolean' ? { published: req.body.published } : {}) });
  res.json({ ...publicFarm(farm), address: farm.address, lat: farm.lat, lng: farm.lng, blockedDates: farm.blockedDates, published: farm.published });
});

router.put('/me/farms/:id', ...owner, async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Farm house not found' });
  const farm = await FarmHouse.findOne({ _id: req.params.id, partner: req.partner._id });
  if (!farm) return res.status(404).json({ error: 'Farm house not found' });
  const f = farmFields(req.body || {});
  if (f.error) return res.status(400).json({ error: f.error });
  Object.assign(farm, f);
  if (typeof req.body.published === 'boolean') farm.published = req.body.published;
  await farm.save();
  res.json({ ...publicFarm(farm), address: farm.address, lat: farm.lat, lng: farm.lng, blockedDates: farm.blockedDates, published: farm.published });
});

router.put('/me/farms/:id/blocked-dates', ...owner, async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Farm house not found' });
  const dates = Array.isArray((req.body || {}).dates) ? req.body.dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(0, 400) : null;
  if (!dates) return res.status(400).json({ error: 'dates required' });
  const farm = await FarmHouse.findOneAndUpdate({ _id: req.params.id, partner: req.partner._id }, { $set: { blockedDates: [...new Set(dates)] } }, { new: true });
  if (!farm) return res.status(404).json({ error: 'Farm house not found' });
  res.json({ blockedDates: farm.blockedDates });
});

router.get('/me/farms/:id/availability', ...owner, async (req, res) => {
  if (!isId(req.params.id) || !/^\d{4}-\d{2}$/.test(req.query.month || '')) return res.status(400).json({ error: 'month=YYYY-MM required' });
  const farm = await FarmHouse.findOne({ _id: req.params.id, partner: req.partner._id }).lean();
  if (!farm) return res.status(404).json({ error: 'Farm house not found' });
  res.json(await monthAvailability(farm, req.query.month));
});

router.get('/me/bookings', ...owner, async (req, res) => {
  const list = await FarmBooking.find({ partner: req.partner._id, status: { $ne: 'pending' } }).sort({ startMin: 1 });
  res.json(list.map(ownerBooking));
});

router.patch('/me/bookings/:id', ...owner, async (req, res) => {
  const { action } = req.body || {};
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Booking not found' });
  const b = await FarmBooking.findOne({ _id: req.params.id, partner: req.partner._id });
  if (!b) return res.status(404).json({ error: 'Booking not found' });
  if (action === 'complete') {
    if (b.status !== 'confirmed') return res.status(400).json({ error: 'Only confirmed bookings can be completed' });
    if (b.startMin > nowMinIST()) return res.status(400).json({ error: 'The stay hasn’t started yet' });
    b.status = 'completed';
    await b.save();
    return res.json(ownerBooking(b));
  }
  if (action === 'cancel') {
    if (b.status !== 'confirmed') return res.status(400).json({ error: 'This booking can’t be cancelled' });
    const done = await cancelBooking(b, 'owner', 100, 'Farm house owner cancelled (full refund)');
    if (!done) return res.status(400).json({ error: 'This booking can’t be cancelled' });
    return res.json(ownerBooking(done));
  }
  res.status(400).json({ error: 'Unknown action' });
});

// ======================= public, by id (last so the routes above win) =======================

router.get('/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Farm house not found' });
  const f = await FarmHouse.findOne({ _id: req.params.id, published: true }).populate({ path: 'partner', match: { role: 'farm', verificationStatus: 'verified', deletedAt: null }, select: '_id' });
  if (!f || !f.partner) return res.status(404).json({ error: 'Farm house not found' });
  res.json(publicFarm(f));
});

router.get('/:id/availability', async (req, res) => {
  if (!isId(req.params.id) || !/^\d{4}-\d{2}$/.test(req.query.month || '')) return res.status(400).json({ error: 'month=YYYY-MM required' });
  const f = await FarmHouse.findOne({ _id: req.params.id, published: true }).lean();
  if (!f) return res.status(404).json({ error: 'Farm house not found' });
  res.json(await monthAvailability(f, req.query.month));
});

// Price for a date/stay/guests, before paying (the same numbers the booking will use).
router.post('/:id/quote', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Farm house not found' });
  const { date, slot, guests } = req.body || {};
  const c = await checkSlot(req.params.id, date, slot, guests);
  if (!c.ok) return res.status(409).json({ error: c.reason });
  res.json({ ...c.price, checkIn: c.farm.slots[slot].start, checkOut: c.farm.slots[slot].end, securityDeposit: c.farm.securityDeposit, advancePct: c.farm.advancePct });
});

router.post('/:id/book', requireAuth, requireAccount, async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Farm house not found' });
  const { date, slot, guests, occasion } = req.body || {};
  const farm = await FarmHouse.findOne({ _id: req.params.id, published: true }).populate('partner', 'role verificationStatus deletedAt');
  if (!farm || !farm.partner || farm.partner.role !== 'farm' || farm.partner.verificationStatus !== 'verified' || farm.partner.deletedAt) {
    return res.status(404).json({ error: 'Farm house not found' });
  }
  const c = await checkSlot(farm.toObject(), date, slot, guests);
  if (!c.ok) return res.status(409).json({ error: c.reason });
  // An abandoned checkout for the same customer/farm is replaced, not left lying around.
  await FarmBooking.deleteMany({ customer: req.user._id, farm: farm._id, status: 'pending' });
  const { commissionPct } = await Config.get();
  const b = await FarmBooking.create({
    code: bookingCode(), customer: req.user._id, partner: farm.partner._id, farm: farm._id, farmName: farm.name,
    customerName: req.user.name || '', customerPhone: req.user.phone || '', date, slot,
    checkIn: farm.slots[slot].start, checkOut: farm.slots[slot].end, startMin: c.interval.startMin, endMin: c.interval.endMin,
    guests: c.guests, occasion: String(occasion || '').slice(0, 40), ...c.price, advancePct: farm.advancePct,
    securityDeposit: farm.securityDeposit, commissionPct, status: 'pending',
  });
  try {
    const order = await getClient().orders.create({ amount: b.advanceAmount * 100, currency: 'INR', receipt: b.code });
    b.razorpayOrderId = order.id;
    await b.save();
    res.json({ booking: customerBooking(b), payment: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID } });
  } catch (err) {
    await FarmBooking.deleteOne({ _id: b._id });
    res.status(502).json({ error: 'Could not start the payment. Please try again.' });
  }
});

module.exports = { router, priceFor, customerRefundPct };
