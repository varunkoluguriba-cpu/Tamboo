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

// Booking, paying and quote requests need a real account: vendors must be able to reach the
// customer, and guests have no name or phone on record.
function requireAccount(req, res, next) {
  if (req.user && req.user.authMethod === 'guest') {
    return res.status(403).json({ error: 'Please log in with your mobile number to continue.' });
  }
  next();
}

module.exports = { requireAuth, requireAccount };
