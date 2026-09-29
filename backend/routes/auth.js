const express = require('express');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function issueToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '90d' });
}

function serialize(user) {
  return { id: user.id, phone: user.phone, name: user.name, email: user.email, city: user.city, registered: user.registered };
}

// Client verifies OTP with Firebase directly (see src/services/firebaseAuth.ts), then sends
// the resulting Firebase ID token here. We verify it server-side and issue our own session JWT —
// the app never trusts a phone number the client claims without Firebase's signature on it.
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

  let user = await User.findOne({ firebaseUid: decoded.uid });
  if (!user) {
    user = await User.create({ phone: decoded.phone_number, firebaseUid: decoded.uid });
  }
  res.json({ token: issueToken(user), user: serialize(user) });
});

router.post('/register', requireAuth, async (req, res) => {
  const { name, email, city } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  req.user.name = name.trim();
  if (email) req.user.email = email.trim();
  if (city) req.user.city = city;
  req.user.registered = true;
  await req.user.save();
  res.json({ user: serialize(req.user) });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json(serialize(req.user));
});

module.exports = router;
