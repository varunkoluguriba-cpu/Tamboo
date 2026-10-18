const mongoose = require('mongoose');

// Every admin action that changes real data — a record of who did what, so there's a trail
// to check if something looks wrong later (e.g. "who approved this partner?").
const auditLogSchema = new mongoose.Schema({
  who: { type: String, required: true }, // admin username
  what: { type: String, required: true }, // short action label, e.g. "Verified partner"
  target: { type: String, default: '' }, // id or name of the thing changed
  before: { type: String, default: '' },
  after: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
