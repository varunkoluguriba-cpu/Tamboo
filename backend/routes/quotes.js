const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requirePartnerAuth } = require('../middleware/partnerAuth');
const Quote = require('../models/Quote');
const Partner = require('../models/Partner');

const router = express.Router();

function quoteCode() {
  return 'QT-' + (5000 + Math.floor(Math.random() * 9999));
}

// Shape consumed by the partner app's QuoteScreen/OrdersScreen (QUOTES mock shape).
function serializeForVendor(q) {
  return {
    id: q.id,
    event: q.productName || q.vendorName,
    customer: q.customerName,
    customerId: String(q.customer),
    phone: q.customerPhone,
    date: q.dateTxt,
    guests: q.guests,
    need: q.need,
    isRevision: q.status === 'REVISION_REQUESTED',
    status: q.status === 'AWAITING_VENDOR' ? 'AWAITING VENDOR' : q.status === 'REVISION_REQUESTED' ? 'REVISION REQUESTED' : 'OFFER SENT',
    versions: q.versions.map((v) => ({ v: v.v, total: v.total, lines: v.lines })),
  };
}

// Shape consumed by the customer app's BookingsScreen quotes tab.
function serializeForCustomer(q) {
  const latest = q.versions[q.versions.length - 1];
  return {
    id: q.id,
    code: q.code,
    vendorName: q.vendorName,
    productName: q.productName,
    dateTxt: q.dateTxt,
    guests: q.guests,
    need: q.need,
    status: q.status,
    quotedTotal: latest ? latest.total : 0,
    versions: q.versions.map((v) => ({ v: v.v, total: v.total, note: v.note, lines: v.lines })),
  };
}

// Customer: request a custom quote from a vendor.
router.post('/', requireAuth, async (req, res) => {
  const { vendorId, vendorName, productName, dateTxt, guests, need, customerName, customerPhone } = req.body || {};
  if (!need || !need.trim()) return res.status(400).json({ error: 'Describe what you need' });

  let partner = null;
  if (vendorId) partner = await Partner.findById(vendorId).catch(() => null);

  const quote = await Quote.create({
    code: quoteCode(),
    customer: req.user.id,
    partner: partner ? partner.id : null,
    vendorName: vendorName || '',
    productName: productName || '',
    customerName: customerName || req.user.name || '',
    customerPhone: customerPhone || req.user.phone || '',
    dateTxt: dateTxt || '',
    guests: guests || 0,
    need: need.trim(),
  });
  res.status(201).json(serializeForCustomer(quote));
});

// Customer: their own quote requests.
router.get('/me', requireAuth, async (req, res) => {
  const quotes = await Quote.find({ customer: req.user.id }).sort({ createdAt: -1 });
  res.json(quotes.map(serializeForCustomer));
});

// Customer: respond to an offer — accept, decline, or ask for a revision.
router.patch('/me/:id', requireAuth, async (req, res) => {
  const quote = await Quote.findOne({ _id: req.params.id, customer: req.user.id });
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  const { action } = req.body || {};
  if (action === 'accept') quote.status = 'ACCEPTED';
  else if (action === 'decline') quote.status = 'DECLINED';
  else if (action === 'requestRevision') quote.status = 'REVISION_REQUESTED';
  else return res.status(400).json({ error: 'Invalid action' });
  await quote.save();
  res.json(serializeForCustomer(quote));
});

// Partner: quote requests addressed to them.
router.get('/vendor/me', requirePartnerAuth, async (req, res) => {
  const quotes = await Quote.find({ partner: req.partner.id }).sort({ createdAt: -1 });
  res.json(quotes.map(serializeForVendor));
});

// Partner: send a priced offer (adds a new version).
router.patch('/vendor/me/:id', requirePartnerAuth, async (req, res) => {
  const quote = await Quote.findOne({ _id: req.params.id, partner: req.partner.id });
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  const { lines, note } = req.body || {};
  if (!Array.isArray(lines) || lines.length === 0) return res.status(400).json({ error: 'Add at least one priced line' });
  const total = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const nextV = (quote.versions[quote.versions.length - 1]?.v || 0) + 1;
  quote.versions.push({ v: nextV, total, note: note || '', lines: lines.map((l) => ({ label: l.label, amount: Number(l.amount) || 0 })) });
  quote.status = 'OFFER_SENT';
  await quote.save();
  res.json(serializeForVendor(quote));
});

module.exports = router;
