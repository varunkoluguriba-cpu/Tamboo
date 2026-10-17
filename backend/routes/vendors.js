const express = require('express');
const { requirePartnerAuth } = require('../middleware/partnerAuth');
const Shop = require('../models/Shop');
const Item = require('../models/Item');
const Order = require('../models/Order');
const PayoutEntry = require('../models/PayoutEntry');
const Partner = require('../models/Partner');
const Package = require('../models/Package');
const mongoose = require('mongoose');
const { getClient: getAnthropicClient } = require('../config/anthropic');
const { CATEGORY_IDS, UNIT_OPTIONS } = require('../data/itemCatalogOptions');
const ItemPreset = require('../models/ItemPreset');

function buildClassifyPrompt(categoryGuide) {
  return `Reply with ONLY a JSON object, no other text, no markdown fences, in exactly this shape:
{"name": "short item name, max 6 words", "cat": "one of: ${CATEGORY_IDS.map((c) => c.id).join(', ')}", "unit": "one of: ${UNIT_OPTIONS.join(', ')}", "specs": "one short sentence describing it, max 15 words"}

Category guide: ${categoryGuide}

If you cannot clearly identify an event-rental item, reply with exactly: {"error": "unclear"}`;
}

function parseClassifyResponse(message) {
  const text = (message.content || []).map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
  const jsonText = text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(jsonText);
  if (parsed.error) return null;
  const validCat = CATEGORY_IDS.some((c) => c.id === parsed.cat) ? parsed.cat : CATEGORY_IDS[0].id;
  const validUnit = UNIT_OPTIONS.includes(parsed.unit) ? parsed.unit : UNIT_OPTIONS[0];
  return {
    name: typeof parsed.name === 'string' ? parsed.name.slice(0, 80) : '',
    cat: validCat,
    unit: validUnit,
    specs: typeof parsed.specs === 'string' ? parsed.specs.slice(0, 200) : '',
  };
}

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

// Growing, shared catalog of items real vendors have already added — powers the preset
// checklist on the client. Sorted by popularity so the most commonly-added items surface
// first; a partner can still add anything not in this list via text or photo.
router.get('/item-presets', requirePartnerAuth, requireTentRole, async (req, res) => {
  const presets = await ItemPreset.find().sort({ usageCount: -1, name: 1 }).limit(300);
  res.json(presets.map((p) => ({ name: p.name, cat: p.cat, unit: p.unit, specs: p.specs })));
});

// AI-assisted item add, text version: vendor types a name (e.g. "plastic chair") and we fill
// in category/unit/description — cheaper and faster than the photo path since there's no
// image to analyze. Checks the shared preset catalog first (instant, free, consistent with
// what past vendors called the same thing) before falling back to an AI call for anything new.
router.post('/me/items/classify-text', requirePartnerAuth, requireTentRole, async (req, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const normalizedName = ItemPreset.normalize(name);
  const existing = await ItemPreset.findOne({ normalizedName });
  if (existing) {
    return res.json({ name: existing.name, cat: existing.cat, unit: existing.unit, specs: existing.specs });
  }

  const categoryGuide = CATEGORY_IDS.map((c) => `${c.id} (${c.name})`).join(', ');
  let message;
  try {
    message = await getAnthropicClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are helping an Indian tent-house/event-rental vendor list an item for rent on a marketplace app. The vendor typed this item name: "${name.trim()}".

${buildClassifyPrompt(categoryGuide)}`,
      }],
    });
  } catch (e) {
    return res.status(502).json({ error: 'Could not classify that right now. Fill it in manually.' });
  }

  let result;
  try {
    result = parseClassifyResponse(message);
  } catch {
    return res.status(502).json({ error: 'Could not understand that. Fill it in manually.' });
  }
  if (!result) return res.status(422).json({ error: "Couldn't recognize that item. Fill it in manually." });
  if (!result.name) result.name = name.trim();
  res.json(result);
});

// AI-assisted item add, photo version: vendor snaps a photo, we identify what it probably is
// so they only have to confirm/correct the suggestion and fill in price + stock, instead of
// typing every field from scratch. Never auto-saves anything — the client always shows this
// as editable suggestions, since a wrong guess here is just mildly annoying, not a bad listing.
router.post('/me/items/analyze-photo', requirePartnerAuth, requireTentRole, async (req, res) => {
  const { imageBase64 } = req.body || {};
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }
  const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'imageBase64 must be a data URI' });
  const [, mediaType, data] = match;

  const categoryGuide = CATEGORY_IDS.map((c) => `${c.id} (${c.name})`).join(', ');
  let message;
  try {
    message = await getAnthropicClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
          {
            type: 'text',
            text: `You are helping an Indian tent-house/event-rental vendor list an item for rent on a marketplace app. Look at the photo and identify the single item shown (e.g. a plastic chair, a round banquet table, an LED par light, a shamiana/tent canopy).

${buildClassifyPrompt(categoryGuide)}`,
          },
        ],
      }],
    });
  } catch (e) {
    return res.status(502).json({ error: 'Could not analyze the photo right now. Try again or fill it in manually.' });
  }

  let result;
  try {
    result = parseClassifyResponse(message);
  } catch {
    return res.status(502).json({ error: 'Could not understand the photo. Try a clearer shot or fill it in manually.' });
  }
  if (!result) return res.status(422).json({ error: 'Could not clearly identify an item in that photo. Try a clearer shot or fill it in manually.' });
  res.json(result);
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
  ItemPreset.learnFrom({ name: name.trim(), cat, unit, specs }).catch(() => {});
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

function serializePackage(pkg, vendorName) {
  const lines = pkg.items
    .filter((l) => l.item)
    .map((l) => ({
      productId: String(l.item.id), name: l.item.name, unit: l.item.unit,
      unitPrice: l.item.price, qty: l.qty, instant: l.item.instant,
    }));
  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    vendorId: String(pkg.partner.id ?? pkg.partner),
    vendorName,
    lines,
    total: lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0),
  };
}

async function validatePackageItems(partnerId, items) {
  if (!Array.isArray(items) || items.length === 0) return { error: 'Add at least one item to the package' };
  const ids = items.map((i) => i && i.itemId);
  if (ids.some((id) => !mongoose.isValidObjectId(id))) return { error: 'Some items are invalid' };
  if (new Set(ids).size !== ids.length) return { error: 'Each item can only appear once in a package' };
  if (items.some((i) => !Number.isInteger(i.qty) || i.qty < 1)) return { error: 'Each item needs a quantity of at least 1' };
  const owned = await Item.find({ _id: { $in: ids }, partner: partnerId });
  if (owned.length !== ids.length) return { error: 'Some items are not in your shop' };
  if (owned.some((i) => !i.instant)) return { error: 'Packages can only include items that customers can book instantly' };
  return { lines: items.map((i) => ({ item: i.itemId, qty: i.qty })) };
}

// Public: packages from verified tent houses, for the customer app's home screen.
router.get('/packages', async (req, res) => {
  const pkgs = await Package.find().populate('items.item').populate('partner');
  res.json(
    pkgs
      .filter((p) => p.partner && p.partner.role === 'tent' && p.partner.verificationStatus === 'verified')
      .map((p) => serializePackage(p, p.partner.businessName)),
  );
});

router.get('/me/packages', requirePartnerAuth, requireTentRole, async (req, res) => {
  const pkgs = await Package.find({ partner: req.partner.id }).populate('items.item').sort({ createdAt: -1 });
  res.json(pkgs.map((p) => serializePackage(p, req.partner.businessName)));
});

router.post('/me/packages', requirePartnerAuth, requireTentRole, async (req, res) => {
  const { name, description, items } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Enter a package name' });
  const checked = await validatePackageItems(req.partner.id, items);
  if (checked.error) return res.status(400).json({ error: checked.error });
  const pkg = await Package.create({
    partner: req.partner.id, name: String(name).trim(), description: String(description || '').trim(), items: checked.lines,
  });
  await pkg.populate('items.item');
  res.status(201).json(serializePackage(pkg, req.partner.businessName));
});

router.put('/me/packages/:packageId', requirePartnerAuth, requireTentRole, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.packageId)) return res.status(404).json({ error: 'Package not found' });
  const pkg = await Package.findOne({ _id: req.params.packageId, partner: req.partner.id });
  if (!pkg) return res.status(404).json({ error: 'Package not found' });
  const { name, description, items } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Enter a package name' });
  const checked = await validatePackageItems(req.partner.id, items);
  if (checked.error) return res.status(400).json({ error: checked.error });
  pkg.name = String(name).trim();
  pkg.description = String(description || '').trim();
  pkg.items = checked.lines;
  await pkg.save();
  await pkg.populate('items.item');
  res.json(serializePackage(pkg, req.partner.businessName));
});

router.delete('/me/packages/:packageId', requirePartnerAuth, requireTentRole, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.packageId)) return res.status(404).json({ error: 'Package not found' });
  const result = await Package.deleteOne({ _id: req.params.packageId, partner: req.partner.id });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Package not found' });
  res.status(204).send();
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
