const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

async function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.kind !== 'admin') return res.status(401).json({ error: 'Invalid token' });
    const admin = await AdminUser.findById(payload.sub).select('username');
    if (!admin) return res.status(401).json({ error: 'Invalid token' });
    req.admin = { id: admin.id, username: admin.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAdminAuth };
