const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || user.deletedAt) return res.status(401).json({ error: 'Account no longer exists' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Like requireAuth, but signed-out visitors (e.g. the public website) pass through with no
// req.user. A bad or expired token is treated as signed out rather than rejected.
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (user && !user.deletedAt) req.user = user;
  } catch { /* signed out */ }
  next();
}

// Booking, paying and quote requests need a real account: vendors must be able to reach the
// customer, and guests have no name or phone on record.
function requireAccount(req, res, next) {
  if (req.user && req.user.authMethod === 'guest') {
    return res.status(403).json({ error: 'Please log in with your mobile number to continue.' });
  }
  next();
}

// Bookings and quote requests need a number the owner/vendor can call. Google sign-ins add one
// once (PUT /api/auth/me/contact-phone); the apps open that prompt on code PHONE_REQUIRED.
function requirePhone(req, res, next) {
  if (req.user && !req.user.contactNumber()) {
    return res.status(400).json({ error: 'Add your mobile number so the owner can reach you about this booking.', code: 'PHONE_REQUIRED' });
  }
  next();
}

module.exports = { requireAuth, optionalAuth, requireAccount, requirePhone };
