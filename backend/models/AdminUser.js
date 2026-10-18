const mongoose = require('mongoose');

const ROLES = ['super_admin', 'support', 'operations', 'finance', 'marketing'];

const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  // The very first account (auto-created from env vars on first boot) is always
  // super_admin — everyone created afterwards via the Team page picks an explicit role.
  role: { type: String, enum: ROLES, default: 'super_admin' },
  resetTokenHash: { type: String, default: null },
  resetTokenExpiresAt: { type: Date, default: null },
}, { timestamps: true });

adminUserSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('AdminUser', adminUserSchema);
