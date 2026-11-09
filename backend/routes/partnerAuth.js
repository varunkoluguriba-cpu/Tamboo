const express = require('express');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebaseAdmin');
const Partner = require('../models/Partner');
const Config = require('../models/Config');
const PayoutEntry = require('../models/PayoutEntry');
const { requirePartnerAuth } = require('../middleware/partnerAuth');
const { partnerBlocker, deletePartner } = require('../lib/accountDeletion');
const { servicesAllowedFor, SERVICE_CATEGORIES } = require('../lib/servicesGate');

const router = express.Router();

function issueToken(partner) {
  return jwt.sign({ sub: partner.id, kind: 'partner' }, process.env.JWT_SECRET, { expiresIn: '90d' });
}

function serialize(p) {
  return {
    id: p.id,
    phone: p.phone,
    authMethod: p.authMethod,
    role: p.role,
    businessName: p.businessName,
    ownerName: p.ownerName,
    city: p.city,
    area: p.area,
    venueType: p.venueType,
    categories: p.categories,
    taxId: p.taxId,
    bankAccount: p.bankAccount,
    verificationStatus: p.verificationStatus,
    registered: p.registered,
    serviceCategory: p.serviceCategory,
    traditions: p.traditions,
    languages: p.languages,
  };
}

// Everything the app gets about the signed-in partner, plus live platform settings: the
// commission % (so the app's text always matches payouts) and whether event services are on
// for this partner (the 'Event service' sign-up option and screens depend on it).
async function withPlatform(p) {
  const config = await Config.get();
  return { ...serialize(p), commissionPct: config.commissionPct, servicesEnabled: servicesAllowedFor(config, p.phone) };
}

router.post('/verify', async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken) return res.status(400).json({ error: 'idToken required' });

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired verification. Please request a new OTP.' });
  }
  if (!decoded.phone_number) return res.status(400).json({ error: 'No phone number on this credential' });

  try {
    let partner = await Partner.findOne({ firebaseUid: decoded.uid });
    if (!partner) {
      partner = await Partner.create({ phone: decoded.phone_number, firebaseUid: decoded.uid, authMethod: 'phone' });
    }
    res.json({ token: issueToken(partner), partner: await withPlatform(partner) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google Sign-In: same Firebase ID token verification as phone, just no phone number on
// the credential. Partner still goes through the same mandatory /register step afterwards.
router.post('/google', async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken) return res.status(400).json({ error: 'idToken required' });

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired sign-in. Please try again.' });
  }

  try {
    let partner = await Partner.findOne({ firebaseUid: decoded.uid });
    if (!partner) {
      partner = await Partner.create({
        firebaseUid: decoded.uid,
        authMethod: 'google',
        email: decoded.email || '',
        ownerName: decoded.name || '',
      });
    }
    res.json({ token: issueToken(partner), partner: await withPlatform(partner) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', requirePartnerAuth, async (req, res) => {
  const { role, businessName, ownerName, city, area, venueType, categories, taxId, bankAccount, photos, serviceCategory, traditions, languages } = req.body || {};
  if (role && !['tent', 'venue', 'service'].includes(role)) return res.status(400).json({ error: 'Pick your business type' });
  if (role === 'service') {
    if (!servicesAllowedFor(await Config.get(), req.partner.phone)) return res.status(400).json({ error: 'Event services are not open yet' });
    if (!SERVICE_CATEGORIES.includes(serviceCategory)) return res.status(400).json({ error: 'Pick the service you offer' });
  }
  if (!businessName || businessName.trim().length < 3) return res.status(400).json({ error: 'Enter your business name' });
  if (!ownerName || !ownerName.trim()) return res.status(400).json({ error: 'Enter the owner name' });

  const p = req.partner;
  if (role) p.role = role;
  p.businessName = businessName.trim();
  p.ownerName = ownerName.trim();
  if (city) p.city = city;
  if (area) p.area = area;
  if (venueType) p.venueType = venueType;
  if (Array.isArray(categories)) p.categories = categories;
  if (role === 'service') {
    p.serviceCategory = serviceCategory;
    if (Array.isArray(traditions)) p.traditions = traditions.map(String).slice(0, 10);
    if (Array.isArray(languages)) p.languages = languages.map(String).slice(0, 10);
  }
  if (taxId) p.taxId = taxId.trim().toUpperCase();
  if (bankAccount) p.bankAccount = bankAccount.trim();
  if (Array.isArray(photos)) p.registrationPhotos = photos.slice(0, 3);
  p.registered = true;
  await p.save();
  res.json({ partner: await withPlatform(p) });
});

router.get('/me', requirePartnerAuth, async (req, res) => {
  res.json(await withPlatform(req.partner));
});

router.get('/payouts', requirePartnerAuth, async (req, res) => {
  const entries = await PayoutEntry.find({ partner: req.partner.id }).sort({ createdAt: -1 });
  const balance = entries.reduce((sum, e) => sum + (e.type === 'credit' ? e.amount : -e.amount), 0);
  res.json({ balance, entries });
});

// Play Store requires in-app account deletion. Refuses while a booking/order is in flight.
router.delete('/me', requirePartnerAuth, async (req, res) => {
  try {
    const blocker = await partnerBlocker(req.partner._id);
    if (blocker) return res.status(409).json({ error: blocker });
    await deletePartner(req.partner);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete account. Please try again.' });
  }
});

module.exports = router;
