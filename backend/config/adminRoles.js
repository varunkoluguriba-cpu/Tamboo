// Single source of truth for what each admin role can see/do — used by both the backend's
// per-route authorization check and the frontend (via GET /api/admin/me) to decide what to
// show in the sidebar. Add a new role here and it's enforced everywhere automatically.
//
// 'dashboard' isn't listed as a section anyone needs explicitly — every role can open it,
// it just shows fewer stat cards depending on which other sections that role has.
const ROLE_SECTIONS = {
  super_admin: ['partners', 'customers', 'halls', 'items', 'quotes', 'packages', 'bookings', 'disputes', 'support', 'site-content', 'settings', 'audit', 'team'],
  support: ['support', 'customers', 'partners', 'bookings', 'disputes'],
  operations: ['partners', 'halls', 'items', 'quotes', 'packages', 'disputes'],
  finance: ['partners', 'bookings', 'settings'],
  marketing: ['site-content'],
};

function sectionsFor(role) {
  return ROLE_SECTIONS[role] || [];
}

function canAccess(role, section) {
  return sectionsFor(role).includes(section);
}

module.exports = { ROLE_SECTIONS, sectionsFor, canAccess };
