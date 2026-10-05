const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requirePartnerAuth } = require('../middleware/partnerAuth');
const Message = require('../models/Message');
const Partner = require('../models/Partner');

const router = express.Router();

function serialize(m) {
  return { id: m.id, sender: m.sender, text: m.text, at: m.createdAt };
}

// --- Tamboo Support (routes registered before the generic `/:partnerId` ones below,
// so "support" in the URL is never mistaken for a partner id). ---

// Customer's own support thread with Tamboo.
router.get('/support/me', requireAuth, async (req, res) => {
  const messages = await Message.find({ kind: 'support', customer: req.user.id }).sort({ createdAt: 1 });
  res.json(messages.map(serialize));
});

router.post('/support/me', requireAuth, async (req, res) => {
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'Message is empty' });
  const message = await Message.create({ kind: 'support', customer: req.user.id, sender: 'customer', text: text.trim() });
  res.status(201).json(serialize(message));
});

// Partner's own support thread with Tamboo.
router.get('/support/vendor/me', requirePartnerAuth, async (req, res) => {
  const messages = await Message.find({ kind: 'support', partner: req.partner.id }).sort({ createdAt: 1 });
  res.json(messages.map(serialize));
});

router.post('/support/vendor/me', requirePartnerAuth, async (req, res) => {
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'Message is empty' });
  const message = await Message.create({ kind: 'support', partner: req.partner.id, sender: 'partner', text: text.trim() });
  res.status(201).json(serialize(message));
});

// --- Customer <-> vendor chat ---

router.get('/vendor/:customerId', requirePartnerAuth, async (req, res) => {
  const messages = await Message.find({ kind: 'vendor', customer: req.params.customerId, partner: req.partner.id }).sort({ createdAt: 1 });
  res.json(messages.map(serialize));
});

router.post('/vendor/:customerId', requirePartnerAuth, async (req, res) => {
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'Message is empty' });
  const message = await Message.create({ kind: 'vendor', customer: req.params.customerId, partner: req.partner.id, sender: 'partner', text: text.trim() });
  res.status(201).json(serialize(message));
});

// Customer: thread with one vendor. Kept last since `:partnerId` would otherwise
// swallow the more specific routes above.
router.get('/:partnerId', requireAuth, async (req, res) => {
  const messages = await Message.find({ kind: 'vendor', customer: req.user.id, partner: req.params.partnerId }).sort({ createdAt: 1 });
  res.json(messages.map(serialize));
});

router.post('/:partnerId', requireAuth, async (req, res) => {
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'Message is empty' });
  const partner = await Partner.findById(req.params.partnerId).catch(() => null);
  if (!partner) return res.status(404).json({ error: 'Vendor not found' });
  const message = await Message.create({ kind: 'vendor', customer: req.user.id, partner: partner.id, sender: 'customer', text: text.trim() });
  res.status(201).json(serialize(message));
});

module.exports = router;
