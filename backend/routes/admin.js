const express = require('express');
const bcrypt = require('bcryptjs');
const { requireAdminAuth, requireSection } = require('../middleware/adminAuth');
const { sectionsFor } = require('../config/adminRoles');
const AdminUser = require('../models/AdminUser');
const Partner = require('../models/Partner');
const PayoutEntry = require('../models/PayoutEntry');
const Booking = require('../models/Booking');
const Order = require('../models/Order');
const Message = require('../models/Message');
const User = require('../models/User');
const Hall = require('../models/Hall');
const Item = require('../models/Item');
const Quote = require('../models/Quote');
const Package = require('../models/Package');
const Config = require('../models/Config');
const Coupon = require('../models/Coupon');
const AuditLog = require('../models/AuditLog');

const router = express.Router();
router.use(requireAdminAuth);

// Every mutating route below calls this after a successful change — keeps a trail of who
// did what, for when something needs explaining later (e.g. "who approved this partner?").
function audit(req, what, target, before, after) {
  AuditLog.create({ who: req.admin.username, what, target, before: String(before ?? ''), after: String(after ?? '') }).catch(() => {});
}

// GET /dashboard and GET /me are intentionally open to every authenticated admin regardless
// of role — the dashboard is the universal landing page (frontend hides cards the role can't
// act on), and /me is how the frontend discovers the role in the first place. Everything else
// below is gated to the role's permitted sections (see config/adminRoles.js) — router.use with
// a path prefix covers that path and everything nested under it (e.g. '/partners' also covers
// '/partners/:id/payouts').
router.get('/me', (req, res) => {
  res.json({ username: req.admin.username, role: req.admin.role, sections: sectionsFor(req.admin.role) });
});

router.use('/partners', requireSection('partners'));
router.use('/users', requireSection('customers'));
router.use('/halls', requireSection('halls'));
router.use('/items', requireSection('items'));
router.use('/quotes', requireSection('quotes'));
router.use('/packages', requireSection('packages'));
router.use('/bookings', requireSection('bookings'));
router.use('/orders', requireSection('bookings'));
router.use('/hall-bookings', requireSection('bookings'));
router.use('/disputes', requireSection('disputes'));
router.use('/support', requireSection('support'));
router.use('/config', requireSection('settings'));
router.use('/coupons', requireSection('settings'));
router.use('/audit', requireSection('audit'));
router.use('/team', requireSection('team'));

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
  const before = partner.verificationStatus;
  partner.verificationStatus = verificationStatus;
  await partner.save();
  audit(req, 'Changed partner verification status', partner.businessName || partner.id, before, verificationStatus);
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
  audit(req, type === 'credit' ? 'Added earning' : 'Recorded payout', partner.businessName || partner.id, '', `₹${amount}${description ? ' — ' + description : ''}`);
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

// --- Dashboard overview: the panel's home screen, a few key counts instead of opening
// straight into the Partners list with no context. ---
router.get('/dashboard', async (req, res) => {
  const [
    totalUsers, totalPartners, pendingVerification, totalHalls, totalItems,
    disputedOrders, disputedBookings, bookings, orders,
  ] = await Promise.all([
    User.countDocuments({ registered: true }),
    Partner.countDocuments({ registered: true }),
    Partner.countDocuments({ registered: true, verificationStatus: 'pending' }),
    Hall.countDocuments(),
    Item.countDocuments(),
    Order.countDocuments({ status: 'DISPUTED' }),
    Booking.countDocuments({ status: 'disputed' }),
    Booking.find().select('amount commissionPct'),
    Order.find().select('value commission'),
  ]);
  const bookingCollected = bookings.reduce((sum, b) => sum + b.amount, 0);
  const bookingCommission = bookings.reduce((sum, b) => sum + Math.round(b.amount * (b.commissionPct / 100)), 0);
  const orderCollected = orders.reduce((sum, o) => sum + o.value, 0);
  const orderCommission = orders.reduce((sum, o) => sum + o.commission, 0);
  res.json({
    totalUsers,
    totalPartners,
    pendingVerification,
    totalHalls,
    totalItems,
    disputedCount: disputedOrders + disputedBookings,
    totalCollected: bookingCollected + orderCollected,
    totalCommission: bookingCommission + orderCommission,
  });
});

// --- Disputes: every disputed order or hall booking, in one place, so the team doesn't have
// to go digging through the full bookings list to find the handful that need attention. ---
router.get('/disputes', async (req, res) => {
  const [orders, bookings] = await Promise.all([
    Order.find({ status: 'DISPUTED' }).sort({ updatedAt: -1 }).populate('partner', 'businessName'),
    Booking.find({ status: 'disputed' }).sort({ updatedAt: -1 }).populate('partner', 'businessName'),
  ]);
  res.json({
    orders: orders.map((o) => ({
      id: o.id, kind: 'order', code: o.code, vendorName: o.vendorName, customerName: o.customerName,
      customerPhone: o.customerPhone, value: o.value, dateTxt: o.dateTxt,
      partner: o.partner ? { id: o.partner.id, businessName: o.partner.businessName } : null,
      updatedAt: o.updatedAt,
    })),
    bookings: bookings.map((b) => ({
      id: b.id, kind: 'booking', hallName: b.hallName, customerName: b.customerName,
      customerPhone: b.customerPhone, amount: b.amount, date: b.date, slot: b.slot,
      partner: b.partner ? { id: b.partner.id, businessName: b.partner.businessName } : null,
      updatedAt: b.updatedAt,
    })),
  });
});

// --- Customers ---
function serializeUser(u) {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    authMethod: u.authMethod,
    city: u.city,
    registered: u.registered,
    createdAt: u.createdAt,
  };
}

router.get('/users', async (req, res) => {
  const users = await User.find({ registered: true }).sort({ createdAt: -1 });
  res.json(users.map(serializeUser));
});

router.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const [orders, bookings, quotes] = await Promise.all([
    Order.find({ customer: user.id }).sort({ createdAt: -1 }).select('code vendorName value status createdAt'),
    Booking.find({ customer: user.id }).sort({ createdAt: -1 }).select('hallName amount status date slot createdAt'),
    Quote.find({ customer: user.id }).sort({ createdAt: -1 }).select('code vendorName status createdAt'),
  ]);
  res.json({ ...serializeUser(user), orders, bookings, quotes });
});

// --- Halls ---
function serializeHall(h) {
  return {
    id: h.id,
    name: h.name,
    venueType: h.venueType,
    address: h.address,
    seated: h.seated,
    floating: h.floating,
    pricingMode: h.pricingMode,
    rent: h.rent,
    platePrice: h.platePrice,
    token: h.token,
    photos: h.photos,
    partner: h.partner && h.partner.businessName ? { id: h.partner.id, businessName: h.partner.businessName, verificationStatus: h.partner.verificationStatus } : null,
    createdAt: h.createdAt,
  };
}

router.get('/halls', async (req, res) => {
  const halls = await Hall.find().sort({ createdAt: -1 }).populate('partner', 'businessName verificationStatus');
  res.json(halls.map(serializeHall));
});

router.get('/halls/:id', async (req, res) => {
  const hall = await Hall.findById(req.params.id).populate('partner', 'businessName verificationStatus');
  if (!hall) return res.status(404).json({ error: 'Hall not found' });
  res.json(serializeHall(hall));
});

// --- Items ---
function serializeItem(i) {
  return {
    id: i.id,
    name: i.name,
    cat: i.cat,
    price: i.price,
    unit: i.unit,
    stock: i.stock,
    paused: i.paused,
    photos: i.photos,
    partner: i.partner && i.partner.businessName ? { id: i.partner.id, businessName: i.partner.businessName, verificationStatus: i.partner.verificationStatus } : null,
    createdAt: i.createdAt,
  };
}

router.get('/items', async (req, res) => {
  const items = await Item.find().sort({ createdAt: -1 }).populate('partner', 'businessName verificationStatus');
  res.json(items.map(serializeItem));
});

router.get('/items/:id', async (req, res) => {
  const item = await Item.findById(req.params.id).populate('partner', 'businessName verificationStatus');
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(serializeItem(item));
});

// --- Quotes ---
router.get('/quotes', async (req, res) => {
  const quotes = await Quote.find().sort({ createdAt: -1 }).populate('partner', 'businessName');
  res.json(quotes.map((q) => ({
    id: q.id,
    code: q.code,
    vendorName: q.vendorName,
    productName: q.productName,
    customerName: q.customerName,
    customerPhone: q.customerPhone,
    dateTxt: q.dateTxt,
    guests: q.guests,
    need: q.need,
    status: q.status,
    latestTotal: q.versions.length ? q.versions[q.versions.length - 1].total : null,
    partner: q.partner ? { id: q.partner.id, businessName: q.partner.businessName } : null,
    createdAt: q.createdAt,
  })));
});

// --- Packages ---
router.get('/packages', async (req, res) => {
  const packages = await Package.find().sort({ createdAt: -1 }).populate('partner', 'businessName').populate('items.item', 'name price');
  res.json(packages.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    items: p.items.map((it) => ({ name: it.item ? it.item.name : '(deleted item)', price: it.item ? it.item.price : 0, qty: it.qty })),
    partner: p.partner ? { id: p.partner.id, businessName: p.partner.businessName } : null,
    createdAt: p.createdAt,
  })));
});

// --- Order detail + status actions ---
router.get('/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id).populate('partner', 'businessName phone').populate('customer', 'name phone');
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
router.patch('/orders/:id', async (req, res) => {
  const { status } = req.body || {};
  if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const before = order.status;
  order.status = status;
  order.history.push({ label: `Admin set status to ${status}`, date: new Date().toISOString() });
  await order.save();
  audit(req, 'Changed order status', order.code, before, status);
  res.json(order);
});

// --- Hall booking detail + status actions ---
router.get('/hall-bookings/:id', async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('partner', 'businessName phone').populate('customer', 'name phone');
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

const BOOKING_STATUSES = ['token_paid', 'visited', 'awaiting_advance', 'confirmed', 'not_booked', 'cancelled', 'disputed'];
router.patch('/hall-bookings/:id', async (req, res) => {
  const { status } = req.body || {};
  if (!BOOKING_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const before = booking.status;
  booking.status = status;
  await booking.save();
  audit(req, 'Changed hall booking status', booking.hallName, before, status);
  res.json(booking);
});

// --- Fees (Config) ---
router.get('/config', async (req, res) => {
  res.json(await Config.get());
});

router.put('/config', async (req, res) => {
  const { commissionPct, defaultAdvancePct } = req.body || {};
  if (typeof commissionPct !== 'number' || commissionPct < 0 || commissionPct > 100) {
    return res.status(400).json({ error: 'commissionPct must be 0-100' });
  }
  if (typeof defaultAdvancePct !== 'number' || defaultAdvancePct < 0 || defaultAdvancePct > 100) {
    return res.status(400).json({ error: 'defaultAdvancePct must be 0-100' });
  }
  const before = await Config.get();
  const updated = await Config.findByIdAndUpdate(
    Config.SINGLETON_ID,
    { commissionPct, defaultAdvancePct },
    { new: true, upsert: true },
  );
  audit(req, 'Updated platform fees', 'Config', `commission ${before.commissionPct}%, advance ${before.defaultAdvancePct}%`, `commission ${commissionPct}%, advance ${defaultAdvancePct}%`);
  res.json(updated);
});

// --- Coupons ---
router.get('/coupons', async (req, res) => {
  res.json(await Coupon.find().sort({ createdAt: -1 }));
});

router.post('/coupons', async (req, res) => {
  const { code, description, discountPct } = req.body || {};
  if (!code || !String(code).trim()) return res.status(400).json({ error: 'code is required' });
  if (!discountPct || discountPct < 1 || discountPct > 100) return res.status(400).json({ error: 'discountPct must be 1-100' });
  try {
    const coupon = await Coupon.create({ code: String(code).trim(), description: description || '', discountPct });
    audit(req, 'Created coupon', coupon.code, '', `${discountPct}% off`);
    res.status(201).json(coupon);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'A coupon with that code already exists' });
    throw e;
  }
});

router.patch('/coupons/:id', async (req, res) => {
  const { active } = req.body || {};
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
  coupon.active = !!active;
  await coupon.save();
  audit(req, coupon.active ? 'Activated coupon' : 'Deactivated coupon', coupon.code, '', '');
  res.json(coupon);
});

// --- Audit log ---
router.get('/audit', async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
  res.json(logs);
});

// --- Team: super_admin-only management of other admin accounts + their roles ---
router.get('/team', async (req, res) => {
  const admins = await AdminUser.find().select('username email role createdAt').sort({ createdAt: 1 });
  res.json(admins);
});

router.post('/team', async (req, res) => {
  const { username, email, password, role } = req.body || {};
  if (!username || !String(username).trim()) return res.status(400).json({ error: 'username is required' });
  if (!email || !String(email).trim()) return res.status(400).json({ error: 'email is required' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!AdminUser.ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await AdminUser.create({ username: String(username).trim().toLowerCase(), email: String(email).trim(), passwordHash, role });
    audit(req, 'Created team account', admin.username, '', role);
    res.status(201).json({ id: admin.id, username: admin.username, email: admin.email, role: admin.role, createdAt: admin.createdAt });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'That username is already taken' });
    throw e;
  }
});

router.delete('/team/:id', async (req, res) => {
  if (req.params.id === req.admin.id) return res.status(400).json({ error: "You can't remove your own account" });
  const admin = await AdminUser.findById(req.params.id);
  if (!admin) return res.status(404).json({ error: 'Account not found' });
  await admin.deleteOne();
  audit(req, 'Removed team account', admin.username, admin.role, '');
  res.json({ ok: true });
});

module.exports = router;
