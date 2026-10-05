const express = require('express');
const { requirePartnerAuth } = require('../middleware/partnerAuth');
const Shop = require('../models/Shop');
const Item = require('../models/Item');
const Order = require('../models/Order');
const PayoutEntry = require('../models/PayoutEntry');
const Partner = require('../models/Partner');

const router = express.Router();

function nowTxt() {
  return new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
}

function serializeOrderOwn(o) {
  return {
    id: o.id,
    code: o.code,
    status: o.status,
    event: o.eventName || o.eventType || 'Event',
    customer: o.customerName,
    customerId: String(o.customer),
    phone: o.customerPhone,
    address: o.address,
    guests: o.guests,
    type: o.eventType,
    dateTxt: o.dateTxt,
    value: o.value,
    commission: o.commission,
    earn: o.earn,
    lines: o.lines,
    history: o.history,
    fromQuote: false,
  };
}

function serializeVendorPublic(shop, partner) {
  return {
    id: partner.id,
    name: partner.businessName,
    area: partner.area,
    city: partner.city,
    km: 0,
    hours: shop.hours,
    verified: true,
    rating: 0,
    reviews: 0,
    years: '',
    blurb: shop.blurb,
    delivery: shop.deliveryFee > 0 ? `₹${shop.deliveryFee}` : 'Free',
    setup: shop.setupFee > 0 ? `₹${shop.setupFee}` : 'Included',
    minOrder: '—',
    areas: (shop.areas || '').split(',').map((s) => s.trim()).filter(Boolean),
    coverPhoto: shop.coverPhoto || '',
    logoPhoto: shop.logoPhoto || '',
  };
}

function serializeItemPublic(item, vendorId) {
  return {
    id: item.id,
    name: item.name,
    cat: item.cat,
    vendorId,
    rating: 0,
    price: item.price,
    unit: item.unit,
    specs: item.specs,
    deposit: item.deposit ? `₹${item.deposit}` : '₹0',
    min: String(item.min),
    isInstant: item.instant,
    avail: { total: item.stock, reserved: 0, maint: 0, free: item.stock },
    photos: item.photos || [],
  };
}

function serializeItemOwn(item, partner) {
  return {
    id: item.id,
    name: item.name,
    cat: item.cat,
    price: item.price,
    unit: item.unit,
    stock: item.stock,
    min: item.min,
    deposit: item.deposit,
    specs: item.specs,
    instant: item.instant,
    state: item.paused ? 'PAUSED' : partner.verificationStatus === 'verified' ? 'LIVE' : 'REVIEW',
    photos: item.photos || [],
  };
}

function requireTentRole(req, res, next) {
  if (req.partner.role !== 'tent') return res.status(403).json({ error: 'Only tent-house partners have a shop' });
  next();
}

// Public: list vendors (tent partners) who are verified and have a shop page.
router.get('/', async (req, res) => {
  const shops = await Shop.find().populate({ path: 'partner', match: { role: 'tent', verificationStatus: 'verified' } });
  const live = shops.filter((s) => s.partner);
  res.json(live.map((s) => serializeVendorPublic(s, s.partner)));
});

function serializeShopOwn(shop) {
  return {
    blurb: shop.blurb, hours: shop.hours, areas: shop.areas,
    deliveryFee: shop.deliveryFee, setupFee: shop.setupFee, pickupFee: shop.pickupFee,
    coverPhoto: shop.coverPhoto || '', logoPhoto: shop.logoPhoto || '',
  };
}

router.get('/me/shop', requirePartnerAuth, requireTentRole, async (req, res) => {
  const shop = await Shop.findOne({ partner: req.partner.id });
  res.json(shop ? serializeShopOwn(shop) : null);
});

router.put('/me/shop', requirePartnerAuth, requireTentRole, async (req, res) => {
  const { blurb, hours, areas, deliveryFee, setupFee, pickupFee, coverPhoto, logoPhoto } = req.body || {};
  const update = { blurb, hours, areas, deliveryFee, setupFee, pickupFee };
  if (typeof coverPhoto === 'string') update.coverPhoto = coverPhoto;
  if (typeof logoPhoto === 'string') update.logoPhoto = logoPhoto;
  const shop = await Shop.findOneAndUpdate(
    { partner: req.partner.id },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  res.json(serializeShopOwn(shop));
});

router.get('/me/items', requirePartnerAuth, requireTentRole, async (req, res) => {
  const items = await Item.find({ partner: req.partner.id }).sort({ createdAt: -1 });
  res.json(items.map((i) => serializeItemOwn(i, req.partner)));
});

router.post('/me/items', requirePartnerAuth, requireTentRole, async (req, res) => {
  const { name, cat, price, unit, stock, min, deposit, specs, instant, photos } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Enter an item name' });
  if (instant && !(price > 0)) return res.status(400).json({ error: 'Enter the rent amount' });
  const item = await Item.create({
    partner: req.partner.id, name: name.trim(), cat, price, unit, stock, min, deposit, specs, instant,
    photos: Array.isArray(photos) ? photos.slice(0, 15) : [],
  });
  res.status(201).json(serializeItemOwn(item, req.partner));
});

router.put('/me/items/:itemId', requirePartnerAuth, requireTentRole, async (req, res) => {
  const item = await Item.findOne({ _id: req.params.itemId, partner: req.partner.id });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const { name, cat, price, unit, stock, min, deposit, specs, instant, paused, photos } = req.body || {};
  if (name !== undefined) item.name = name.trim();
  if (cat !== undefined) item.cat = cat;
  if (price !== undefined) item.price = price;
  if (unit !== undefined) item.unit = unit;
  if (stock !== undefined) item.stock = stock;
  if (min !== undefined) item.min = min;
  if (deposit !== undefined) item.deposit = deposit;
  if (specs !== undefined) item.specs = specs;
  if (instant !== undefined) item.instant = instant;
  if (paused !== undefined) item.paused = paused;
  if (Array.isArray(photos)) item.photos = photos.slice(0, 15);
  await item.save();
  res.json(serializeItemOwn(item, req.partner));
});

router.delete('/me/items/:itemId', requirePartnerAuth, requireTentRole, async (req, res) => {
  const result = await Item.deleteOne({ _id: req.params.itemId, partner: req.partner.id });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Item not found' });
  res.status(204).send();
});

router.get('/me/orders', requirePartnerAuth, requireTentRole, async (req, res) => {
  const orders = await Order.find({ partner: req.partner.id }).sort({ createdAt: -1 });
  res.json(orders.map(serializeOrderOwn));
});

// Status transitions only (accept/decline/advance) — order contents are fixed at checkout.
// Declining a still-PENDING order reverses the payout credit auto-made at checkout, since
// the vendor is telling us they can't actually fulfil it.
router.patch('/me/orders/:orderId', requirePartnerAuth, requireTentRole, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, partner: req.partner.id });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const { status, historyLabel } = req.body || {};
  const validStatuses = ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const wasPending = order.status === 'PENDING';
  order.status = status;
  order.history.push({ label: historyLabel || status, date: nowTxt() });
  await order.save();

  if (wasPending && status === 'CANCELLED') {
    await PayoutEntry.create({
      partner: req.partner.id,
      type: 'debit',
      amount: order.earn,
      description: `Declined order ${order.code}`,
      reference: order.id,
    });
  }

  res.json(serializeOrderOwn(order));
});

// Public: single vendor detail + their items.
router.get('/:id', async (req, res) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner || partner.role !== 'tent' || partner.verificationStatus !== 'verified') {
    return res.status(404).json({ error: 'Vendor not found' });
  }
  const shop = await Shop.findOne({ partner: partner.id });
  if (!shop) return res.status(404).json({ error: 'Vendor not found' });
  res.json(serializeVendorPublic(shop, partner));
});

router.get('/:id/products', async (req, res) => {
  const items = await Item.find({ partner: req.params.id, paused: false });
  res.json(items.map((i) => serializeItemPublic(i, req.params.id)));
});

module.exports = router;
