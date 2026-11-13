const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // phone/firebaseUid are only present for 'phone' and 'google' accounts — sparse so
  // multiple guest accounts (neither field set) don't collide on the unique index.
  phone: { type: String, unique: true, sparse: true }, // E.164, e.g. +919849004410
  firebaseUid: { type: String, unique: true, sparse: true },
  guestId: { type: String, unique: true, sparse: true },
  authMethod: { type: String, enum: ['phone', 'google', 'guest'], default: 'phone' },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  city: { type: String, default: 'Hyderabad' },
  // Area-wise analytics (admin dashboard). `area` is what the customer picked themselves;
  // `locArea` is the locality nearest their approximate location (only if they allowed
  // location — we keep the locality and a ~1 km rounded point, never the exact spot).
  area: { type: String, default: '' },
  locArea: { type: String, default: '' },
  approxLat: { type: Number, default: null },
  approxLng: { type: Number, default: null },
  locatedAt: { type: Date, default: null },
  registered: { type: Boolean, default: false }, // false until name is set (post-OTP registration screen)
  deletedAt: { type: Date, default: null }, // set by account deletion — see lib/accountDeletion.js
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
