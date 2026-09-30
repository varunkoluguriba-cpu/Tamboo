const jwt = require('jsonwebtoken');
const Partner = require('../models/Partner');

async function requirePartnerAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.kind !== 'partner') return res.status(401).json({ error: 'Invalid token' });
    const partner = await Partner.findById(payload.sub);
    if (!partner) return res.status(401).json({ error: 'Account no longer exists' });
    req.partner = partner;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requirePartnerAuth };
