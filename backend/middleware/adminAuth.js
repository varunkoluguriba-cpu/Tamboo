const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const { canAccess } = require('../config/adminRoles');

async function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.kind !== 'admin') return res.status(401).json({ error: 'Invalid token' });
    const admin = await AdminUser.findById(payload.sub).select('username role');
    if (!admin) return res.status(401).json({ error: 'Invalid token' });
    req.admin = { id: admin.id, username: admin.username, role: admin.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Gate a route group behind a section key (see config/adminRoles.js) — mount after
// requireAdminAuth so req.admin.role is already set. A super_admin always passes since
// their section list includes everything.
function requireSection(section) {
  return (req, res, next) => {
    if (!canAccess(req.admin.role, section)) {
      return res.status(403).json({ error: "You don't have access to this section" });
    }
    next();
  };
}

module.exports = { requireAdminAuth, requireSection };
