const express = require('express');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebaseAdmin');
const Partner = require('../models/Partner');
const PayoutEntry = require('../models/PayoutEntry');
const { requirePartnerAuth } = require('../middleware/partnerAuth');

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
  };
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
    res.json({ token: issueToken(partner), partner: serialize(partner) });
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
    res.json({ token: issueToken(partner), partner: serialize(partner) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', requirePartnerAuth, async (req, res) => {
  const { role, businessName, ownerName, city, area, venueType, categories, taxId, bankAccount, photos } = req.body || {};
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
  if (taxId) p.taxId = taxId.trim().toUpperCase();
  if (bankAccount) p.bankAccount = bankAccount.trim();
  if (Array.isArray(photos)) p.registrationPhotos = photos.slice(0, 3);
  p.registered = true;
  await p.save();
  res.json({ partner: serialize(p) });
});

router.get('/me', requirePartnerAuth, async (req, res) => {
  res.json(serialize(req.partner));
});

router.get('/payouts', requirePartnerAuth, async (req, res) => {
  const entries = await PayoutEntry.find({ partner: req.partner.id }).sort({ createdAt: -1 });
  const balance = entries.reduce((sum, e) => sum + (e.type === 'credit' ? e.amount : -e.amount), 0);
  res.json({ balance, entries });
});

module.exports = router;
