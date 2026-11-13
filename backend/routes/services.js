const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const { requireAuth, optionalAuth, requireAccount } = require('../middleware/auth');
const { requirePartnerAuth } = require('../middleware/partnerAuth');
const { requireServices, servicesAllowedFor, SERVICE_CATEGORIES } = require('../lib/servicesGate');
const { getClient } = require('../config/razorpay');
const { normalizeDateTxt } = require('../lib/dates');
const { markRefundDue } = require('../lib/refunds');
const { sendSms } = require('../lib/sms');
const Config = require('../models/Config');
const Partner = require('../models/Partner');
const ServiceOffer = require('../models/ServiceOffer');
const ServiceRequest = require('../models/ServiceRequest');

const router = express.Router();

const NO_RESPONSE_HOURS = 24;
// Requests that use up one of the customer's free quotes. NO_RESPONSE is excluded on purpose:
// if a vendor never responds, the customer gets that free request back.
const COUNTS_AS_USED = ['NEW', 'CONTACTED', 'CLOSED'];

const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const requestCode = () => 'SR-' + (100000 + Math.floor(Math.random() * 900000));

// --- lazy 24h no-response sweep (no cron in this backend, same approach as hall advances) ---
// Claimed with an atomic status update so parallel reads can't refund the same request twice.
async function sweepNoResponse(filter) {
  const cutoff = new Date(Date.now() - NO_RESPONSE_HOURS * 3600 * 1000);
  const stale = await ServiceRequest.find({ ...filter, status: 'NEW', createdAt: { $lt: cutoff } });
  for (const r of stale) {
    const claimed = await ServiceRequest.updateOne({ _id: r._id, status: 'NEW' }, { $set: { status: 'NO_RESPONSE' } });
    if (claimed.modifiedCount === 0 || !r.fee) continue;
    const fresh = await ServiceRequest.findById(r._id);
    markRefundDue(fresh, fresh.fee, 'Vendor did not respond within 24 hours');
    await fresh.save();
  }
}

async function freeLeftFor(customerId, config) {
  const used = await ServiceRequest.countDocuments({ customer: customerId, fee: 0, status: { $in: COUNTS_AS_USED } });
  return Math.max(0, (config.serviceFreeQuotes || 0) - used);
}

function feeFor(category, config) {
  const fees = config.serviceQuoteFees || {};
  return Math.max(0, Math.round(Number(fees[category]) || 0));
}

// --- serializers ---
function publicVendor(p, offers) {
  const live = (offers || []).filter((o) => !o.paused);
  return {
    id: p.id,
    name: p.businessName,
    category: p.serviceCategory,
    area: p.area,
    city: p.city,
    traditions: p.traditions,
    languages: p.languages,
    about: p.serviceAbout,
    areas: p.serviceAreas,
    experienceYears: p.experienceYears,
    photos: p.servicePhotos,
    verified: p.verificationStatus === 'verified',
    // Cheapest live package, with its price type — a caterer's '₹299' is per plate, not total.
    ...(() => {
      const cheapest = live.slice().sort((a, b) => a.price - b.price)[0];
      return { fromPrice: cheapest ? cheapest.price : null, fromPriceType: cheapest ? cheapest.priceType : null };
    })(),
    offers: live.map(serializeOffer),
  };
}

function serializeOffer(o) {
  return { id: o.id, title: o.title, priceType: o.priceType, price: o.price, description: o.description, paused: o.paused };
}

function customerRequest(r) {
  return {
    id: r.id, code: r.code, category: r.category, vendorId: String(r.partner), vendorName: r.vendorName,
    eventDate: r.eventDate, eventType: r.eventType, guests: r.guests, area: r.area, message: r.message,
    offerTitle: r.offerTitle, fee: r.fee, status: r.status, createdAt: r.createdAt,
    refundStatus: r.refundStatus || 'none', refundAmount: r.refundAmount || 0,
  };
}

function vendorRequest(r) {
  return {
    id: r.id, code: r.code, category: r.category, customerName: r.customerName, customerPhone: r.customerPhone,
    eventDate: r.eventDate, eventType: r.eventType, guests: r.guests, area: r.area, message: r.message,
    offerTitle: r.offerTitle, status: r.status, createdAt: r.createdAt, contactedAt: r.contactedAt,
  };
}

async function notifyVendor(request, partner) {
  const sms = await sendSms(partner.phone, 'serviceLead', {
    name: request.customerName, phone: request.customerPhone, service: request.category, date: request.eventDate,
  });
  request.notifiedAt = new Date();
  request.smsSent = !!sms.sent;
  await request.save();
}

// ================= customer side =================

// What the customer app needs to decide whether to show Services at all, and the fee to show.
// Signed-out visitors (the public website) see services too once they're switched on for everyone.
router.get('/config', optionalAuth, async (req, res) => {
  const config = await Config.get();
  if (!servicesAllowedFor(config, req.user ? req.user.phone : '')) return res.json({ enabled: false });
  const member = req.user && req.user.authMethod !== 'guest';
  if (member) await sweepNoResponse({ customer: req.user._id });
  res.json({
    enabled: true,
    categories: SERVICE_CATEGORIES,
    freeQuotes: config.serviceFreeQuotes,
    freeLeft: member ? await freeLeftFor(req.user._id, config) : config.serviceFreeQuotes,
    fees: Object.fromEntries(SERVICE_CATEGORIES.map((c) => [c, feeFor(c, config)])),
    noResponseHours: NO_RESPONSE_HOURS,
  });
});

router.get('/', optionalAuth, requireServices, async (req, res) => {
  const category = String(req.query.category || '');
  if (category && !SERVICE_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Unknown category' });
  const vendors = await Partner.find({
    role: 'service', verificationStatus: 'verified', deletedAt: null, registered: true,
    ...(category ? { serviceCategory: category } : {}),
  }).sort({ createdAt: -1 });
  const offers = await ServiceOffer.find({ partner: { $in: vendors.map((v) => v._id) } });
  res.json(vendors.map((v) => {
    const vo = publicVendor(v, offers.filter((o) => String(o.partner) === v.id));
    return { ...vo, photos: vo.photos.slice(0, 1), offers: undefined };
  }));
});

router.get('/requests/me', requireAuth, requireServices, async (req, res) => {
  await sweepNoResponse({ customer: req.user._id });
  const list = await ServiceRequest.find({ customer: req.user._id, status: { $ne: 'PENDING_PAYMENT' } }).sort({ createdAt: -1 });
  res.json(list.map(customerRequest));
});

router.post('/requests', requireAuth, requireAccount, requireServices, async (req, res) => {
  const { partnerId, eventDate, eventType, guests, area, message, offerId, consent } = req.body || {};
  if (consent !== true) return res.status(400).json({ error: 'Please agree to share your number with the vendor' });
  if (!isId(partnerId)) return res.status(400).json({ error: 'Vendor not found' });
  const date = normalizeDateTxt(String(eventDate || ''));
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return res.status(400).json({ error: 'Pick your event date' });
  const partner = await Partner.findById(partnerId);
  if (!partner || partner.role !== 'service' || partner.verificationStatus !== 'verified' || partner.deletedAt) {
    return res.status(404).json({ error: 'Vendor not found' });
  }
  const phone = req.user.phone || '';
  if (!phone) return res.status(400).json({ error: 'Add your mobile number to your account first, so the vendor can call you' });

  // One open request per vendor: asking the same vendor twice shouldn't use up another quote.
  const open = await ServiceRequest.findOne({ customer: req.user._id, partner: partner._id, status: { $in: ['NEW', 'CONTACTED'] } });
  if (open) return res.status(409).json({ error: 'You have already asked this vendor. They will call you.' });
  // An abandoned checkout for the same vendor is replaced, not left lying around.
  await ServiceRequest.deleteMany({ customer: req.user._id, partner: partner._id, status: 'PENDING_PAYMENT' });

  let offerTitle = '';
  if (offerId && isId(offerId)) {
    const offer = await ServiceOffer.findOne({ _id: offerId, partner: partner._id, paused: false });
    if (offer) offerTitle = offer.title;
  }

  const config = req.servicesConfig;
  await sweepNoResponse({ customer: req.user._id });
  const free = (await freeLeftFor(req.user._id, config)) > 0;
  const fee = free ? 0 : feeFor(partner.serviceCategory, config);

  const request = await ServiceRequest.create({
    code: requestCode(),
    customer: req.user._id, partner: partner._id, category: partner.serviceCategory, vendorName: partner.businessName,
    customerName: req.user.name || '', customerPhone: phone,
    eventDate: date, eventType: String(eventType || '').slice(0, 40), guests: Math.max(0, Math.round(Number(guests) || 0)),
    area: String(area || '').slice(0, 120), message: String(message || '').slice(0, 1000), offerTitle,
    consentAt: new Date(), fee, status: fee > 0 ? 'PENDING_PAYMENT' : 'NEW',
  });

  if (fee === 0) {
    await notifyVendor(request, partner);
    return res.json({ request: customerRequest(request), payment: null });
  }
  try {
    const order = await getClient().orders.create({ amount: fee * 100, currency: 'INR', receipt: request.code });
    request.razorpayOrderId = order.id;
    await request.save();
    res.json({ request: customerRequest(request), payment: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID } });
  } catch (err) {
    await ServiceRequest.deleteOne({ _id: request._id });
    res.status(502).json({ error: 'Could not start the payment. Please try again.' });
  }
});

router.post('/requests/:id/verify', requireAuth, requireAccount, requireServices, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Request not found' });
  const request = await ServiceRequest.findOne({ _id: req.params.id, customer: req.user._id });
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.status !== 'PENDING_PAYMENT') return res.json({ verified: true, request: customerRequest(request) });
  if (!razorpay_order_id || razorpay_order_id !== request.razorpayOrderId || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Payment details missing' });
  }
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (expected !== razorpay_signature) return res.json({ verified: false });
  request.razorpayPaymentId = razorpay_payment_id;
  request.status = 'NEW';
  await request.save();
  const partner = await Partner.findById(request.partner);
  if (partner) await notifyVendor(request, partner);
  res.json({ verified: true, request: customerRequest(request) });
});

// ================= vendor (service partner) side =================
// Declared before '/:id' so 'vendor' isn't read as a vendor id.

function requireServiceRole(req, res, next) {
  if (req.partner.role !== 'service') return res.status(403).json({ error: 'Only event-service partners can do this' });
  next();
}
const vendorAuth = [requirePartnerAuth, requireServices, requireServiceRole];

router.get('/vendor/me/requests', ...vendorAuth, async (req, res) => {
  await sweepNoResponse({ partner: req.partner._id });
  const list = await ServiceRequest.find({ partner: req.partner._id, status: { $ne: 'PENDING_PAYMENT' } }).sort({ createdAt: -1 });
  res.json(list.map(vendorRequest));
});

router.patch('/vendor/me/requests/:id', ...vendorAuth, async (req, res) => {
  const { action } = req.body || {};
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Request not found' });
  const r = await ServiceRequest.findOne({ _id: req.params.id, partner: req.partner._id });
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (action === 'contacted') {
    if (!['NEW', 'NO_RESPONSE'].includes(r.status)) return res.status(400).json({ error: 'Already marked' });
    // Responding late still counts — but a refund already owed to the customer stays owed.
    r.status = 'CONTACTED';
    r.contactedAt = new Date();
  } else if (action === 'closed') {
    if (r.status !== 'CONTACTED') return res.status(400).json({ error: 'Call the customer first' });
    r.status = 'CLOSED';
  } else {
    return res.status(400).json({ error: 'Unknown action' });
  }
  await r.save();
  res.json(vendorRequest(r));
});

router.get('/vendor/me/offers', ...vendorAuth, async (req, res) => {
  res.json((await ServiceOffer.find({ partner: req.partner._id }).sort({ createdAt: 1 })).map(serializeOffer));
});

function offerFields(body) {
  const title = String((body || {}).title || '').trim();
  const price = Math.round(Number((body || {}).price));
  const priceType = ['fixed', 'perPlate', 'from'].includes(body.priceType) ? body.priceType : 'from';
  if (title.length < 3) return { error: 'Enter a package name' };
  if (!Number.isFinite(price) || price < 1 || price > 10000000) return { error: 'Enter a valid price' };
  return { title: title.slice(0, 80), price, priceType, description: String(body.description || '').trim().slice(0, 600) };
}

router.post('/vendor/me/offers', ...vendorAuth, async (req, res) => {
  const f = offerFields(req.body);
  if (f.error) return res.status(400).json({ error: f.error });
  if ((await ServiceOffer.countDocuments({ partner: req.partner._id })) >= 20) return res.status(400).json({ error: 'You can add up to 20 packages' });
  res.json(serializeOffer(await ServiceOffer.create({ partner: req.partner._id, ...f })));
});

router.patch('/vendor/me/offers/:id', ...vendorAuth, async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Package not found' });
  const o = await ServiceOffer.findOne({ _id: req.params.id, partner: req.partner._id });
  if (!o) return res.status(404).json({ error: 'Package not found' });
  if (typeof req.body.paused === 'boolean' && Object.keys(req.body).length === 1) {
    o.paused = req.body.paused;
  } else {
    const f = offerFields(req.body);
    if (f.error) return res.status(400).json({ error: f.error });
    Object.assign(o, f);
    if (typeof req.body.paused === 'boolean') o.paused = req.body.paused;
  }
  await o.save();
  res.json(serializeOffer(o));
});

router.delete('/vendor/me/offers/:id', ...vendorAuth, async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Package not found' });
  await ServiceOffer.deleteOne({ _id: req.params.id, partner: req.partner._id });
  res.json({ ok: true });
});

router.put('/vendor/me/profile', ...vendorAuth, async (req, res) => {
  const b = req.body || {};
  const p = req.partner;
  const list = (v, max) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, max) : undefined);
  if (b.serviceCategory !== undefined) {
    if (!SERVICE_CATEGORIES.includes(b.serviceCategory)) return res.status(400).json({ error: 'Pick your service' });
    p.serviceCategory = b.serviceCategory;
  }
  if (list(b.traditions, 10)) p.traditions = list(b.traditions, 10);
  if (list(b.languages, 10)) p.languages = list(b.languages, 10);
  if (list(b.serviceAreas, 20)) p.serviceAreas = list(b.serviceAreas, 20);
  if (b.serviceAbout !== undefined) p.serviceAbout = String(b.serviceAbout).trim().slice(0, 1000);
  if (b.experienceYears !== undefined) {
    const y = Math.round(Number(b.experienceYears));
    if (!Number.isFinite(y) || y < 0 || y > 80) return res.status(400).json({ error: 'Enter years of experience (0–80)' });
    p.experienceYears = y;
  }
  if (Array.isArray(b.servicePhotos)) p.servicePhotos = b.servicePhotos.filter((x) => typeof x === 'string' && x.startsWith('data:image/')).slice(0, 6);
  await p.save();
  res.json(publicVendor(p, await ServiceOffer.find({ partner: p._id })));
});

router.get('/vendor/me/profile', ...vendorAuth, async (req, res) => {
  res.json(publicVendor(req.partner, await ServiceOffer.find({ partner: req.partner._id })));
});

// Public vendor page — last, so the routes above win.
router.get('/:id', optionalAuth, requireServices, async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ error: 'Vendor not found' });
  const p = await Partner.findOne({ _id: req.params.id, role: 'service', verificationStatus: 'verified', deletedAt: null });
  if (!p) return res.status(404).json({ error: 'Vendor not found' });
  res.json(publicVendor(p, await ServiceOffer.find({ partner: p._id })));
});

module.exports = router;
