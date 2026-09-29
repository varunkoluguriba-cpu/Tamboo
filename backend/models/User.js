const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true }, // E.164, e.g. +919849004410
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  city: { type: String, default: 'Hyderabad' },
  registered: { type: Boolean, default: false }, // false until name is set (post-OTP registration screen)
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
