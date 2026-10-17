const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const AdminUser = require('../models/AdminUser');

const router = express.Router();

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function smtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
}

function mailer() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// Creates the first admin account from the existing env values, once. After that the
// password lives hashed in the database — changing ADMIN_PASSWORD later does nothing.
async function ensureAdminUser() {
  const existing = await AdminUser.findOne({ username: 'admin' });
  if (existing || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_EMAIL) return;
  await AdminUser.create({
    username: 'admin',
    email: process.env.ADMIN_EMAIL,
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
  });
  console.log('Created initial admin account "admin"');
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Enter your username and password' });
  const admin = await AdminUser.findOne({ username: String(username).trim().toLowerCase() });
  const ok = admin && await bcrypt.compare(String(password), admin.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Incorrect username or password' });
  const token = jwt.sign({ kind: 'admin', sub: admin.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

// Always answers the same way whether or not the username exists, so this can't be used
// to discover admin usernames.
router.post('/forgot', async (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'Enter your username' });
  if (!smtpConfigured()) {
    return res.status(503).json({ error: 'Password reset email is not set up on the server yet.' });
  }
  const admin = await AdminUser.findOne({ username: String(username).trim().toLowerCase() });
  if (admin) {
    const token = crypto.randomBytes(32).toString('hex');
    admin.resetTokenHash = sha256(token);
    admin.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await admin.save();
    const link = `${process.env.ADMIN_PANEL_URL || 'http://localhost:5177'}/reset?token=${token}`;
    await mailer().sendMail({
      from: process.env.SMTP_FROM,
      to: admin.email,
      subject: 'Reset your Tamboo admin password',
      text: `Someone asked to reset the Tamboo admin password for "${admin.username}".\n\nUse this link within 30 minutes:\n${link}\n\nIf you didn't ask for this, ignore this email — your password is unchanged.`,
    });
  }
  res.json({ message: 'If that username exists, a reset link has been sent to its recovery email.' });
});

router.post('/reset', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'Missing reset details' });
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }
  const admin = await AdminUser.findOne({
    resetTokenHash: sha256(String(token)),
    resetTokenExpiresAt: { $gt: new Date() },
  });
  if (!admin) return res.status(400).json({ error: 'This reset link is invalid or has expired. Request a new one.' });
  admin.passwordHash = await bcrypt.hash(String(password), 12);
  admin.resetTokenHash = null;
  admin.resetTokenExpiresAt = null;
  await admin.save();
  res.json({ ok: true });
});

module.exports = router;
module.exports.ensureAdminUser = ensureAdminUser;
