const express = require('express');
const { requireAdminAuth } = require('../middleware/adminAuth');
const Partner = require('../models/Partner');
const PayoutEntry = require('../models/PayoutEntry');
const Booking = require('../models/Booking');
const Order = require('../models/Order');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();
router.use(requireAdminAuth);

function serializePartner(p) {
  return {
    id: p.id,
    phone: p.phone,
    role: p.role,
    businessName: p.businessName,
    ownerName: p.ownerName,
    city: p.city,
    area: p.area,
    venueType: p.venueType,
    categories: p.categories,
    verificationStatus: p.verificationStatus,
    registered: p.registered,
    createdAt: p.createdAt,
  };
}

async function balanceFor(partnerId) {
  const entries = await PayoutEntry.find({ partner: partnerId });
  return entries.reduce((sum, e) => sum + (e.type === 'credit' ? e.amount : -e.amount), 0);
}

router.get('/partners', async (req, res) => {
  const { status } = req.query;
  const filter = { registered: true };
  if (status) filter.verificationStatus = status;
  const partners = await Partner.find(filter).sort({ createdAt: -1 });
  res.json(partners.map(serializePartner));
});

router.get('/partners/:id', async (req, res) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });
  res.json(serializePartner(partner));
});

router.patch('/partners/:id', async (req, res) => {
  const { verificationStatus } = req.body || {};
  if (!['pending', 'verified', 'rejected'].includes(verificationStatus)) {
    return res.status(400).json({ error: 'Invalid verificationStatus' });
  }
  const partner = await Partner.findById(req.params.id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });
  partner.verificationStatus = verificationStatus;
  await partner.save();
  res.json(serializePartner(partner));
});

router.get('/partners/:id/payouts', async (req, res) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });
  const entries = await PayoutEntry.find({ partner: partner.id }).sort({ createdAt: -1 });
  const balance = entries.reduce((sum, e) => sum + (e.type === 'credit' ? e.amount : -e.amount), 0);
  res.json({ balance, entries });
});

router.post('/partners/:id/payouts', async (req, res) => {
  const { type, amount, description, reference } = req.body || {};
  if (!['credit', 'debit'].includes(type)) return res.status(400).json({ error: 'type must be credit or debit' });
  if (!amount || typeof amount !== 'number' || amount <= 0) return res.status(400).json({ error: 'amount must be a positive number' });
  const partner = await Partner.findById(req.params.id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });

  if (type === 'debit') {
    const current = await balanceFor(partner.id);
    if (amount > current) return res.status(400).json({ error: `Cannot pay out more than the current balance (₹${current})` });
  }

  const entry = await PayoutEntry.create({
    partner: partner.id,
    type,
    amount,
    description: description || '',
    reference: reference || '',
  });
  res.status(201).json(entry);
});

router.get('/bookings', async (req, res) => {
  const [bookings, orders] = await Promise.all([
    Booking.find().sort({ createdAt: -1 }).populate('partner', 'businessName role'),
    Order.find().sort({ createdAt: -1 }).populate('partner', 'businessName role'),
  ]);
  const bookingCollected = bookings.reduce((sum, b) => sum + b.amount, 0);
  const bookingCommission = bookings.reduce((sum, b) => sum + Math.round(b.amount * (b.commissionPct / 100)), 0);
  const orderCollected = orders.reduce((sum, o) => sum + o.value, 0);
  const orderCommission = orders.reduce((sum, o) => sum + o.commission, 0);

  res.json({
    totalCollected: bookingCollected + orderCollected,
    totalCommission: bookingCommission + orderCommission,
    bookings: bookings.map((b) => ({
      id: b.id,
      hallName: b.hallName,
      date: b.date,
      slot: b.slot,
      guests: b.guests,
      amount: b.amount,
      commissionPct: b.commissionPct,
      commission: Math.round(b.amount * (b.commissionPct / 100)),
      status: b.status,
      partner: b.partner ? { id: b.partner.id, businessName: b.partner.businessName } : null,
      createdAt: b.createdAt,
    })),
    orders: orders.map((o) => ({
      id: o.id,
      code: o.code,
      vendorName: o.vendorName,
      eventName: o.eventName,
      dateTxt: o.dateTxt,
      guests: o.guests,
      value: o.value,
      commissionPct: o.commissionPct,
      commission: o.commission,
      status: o.status,
      partner: o.partner ? { id: o.partner.id, businessName: o.partner.businessName } : null,
      createdAt: o.createdAt,
    })),
  });
});

// Support inbox: every open thread (one per customer or partner who has messaged Tamboo),
// newest activity first, with a preview so the team can triage without opening each one.
router.get('/support', async (req, res) => {
  const messages = await Message.find({ kind: 'support' }).sort({ createdAt: -1 });
  const threads = new Map(); // key: `customer:<id>` or `partner:<id>`
  for (const m of messages) {
    const type = m.customer ? 'customer' : 'partner';
    const id = String(m.customer || m.partner);
    const key = `${type}:${id}`;
    if (!threads.has(key)) {
      threads.set(key, { type, id, lastMessage: m.text, lastSender: m.sender, lastAt: m.createdAt, unread: m.sender !== 'admin' });
    }
  }
  const list = Array.from(threads.values());
  const [users, partners] = await Promise.all([
    User.find({ _id: { $in: list.filter((t) => t.type === 'customer').map((t) => t.id) } }),
    Partner.find({ _id: { $in: list.filter((t) => t.type === 'partner').map((t) => t.id) } }),
  ]);
  const nameById = new Map([
    ...users.map((u) => [u.id, u.name || u.phone]),
    ...partners.map((p) => [p.id, p.businessName || p.phone]),
  ]);
  res.json(list.map((t) => ({ ...t, name: nameById.get(t.id) || t.id })).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt)));
});

router.get('/support/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  if (type !== 'customer' && type !== 'partner') return res.status(400).json({ error: 'Invalid thread type' });
  const filter = { kind: 'support', [type]: id };
  const messages = await Message.find(filter).sort({ createdAt: 1 });
  res.json(messages.map((m) => ({ id: m.id, sender: m.sender, text: m.text, at: m.createdAt })));
});

router.post('/support/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const { text } = req.body || {};
  if (type !== 'customer' && type !== 'partner') return res.status(400).json({ error: 'Invalid thread type' });
  if (!text || !text.trim()) return res.status(400).json({ error: 'Message is empty' });
  const message = await Message.create({ kind: 'support', [type]: id, sender: 'admin', text: text.trim() });
  res.status(201).json({ id: message.id, sender: message.sender, text: message.text, at: message.createdAt });
});

module.exports = router;
