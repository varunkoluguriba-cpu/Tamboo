const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, unique: true },
  blurb: { type: String, default: '' },
  hours: { type: String, default: '8 AM – 8 PM' },
  areas: { type: String, default: '' }, // comma-separated
  deliveryFee: { type: Number, default: 0 },
  setupFee: { type: Number, default: 0 },
  pickupFee: { type: Number, default: 0 },
  // Data-URI (base64) images — no separate object-storage service yet.
  coverPhoto: { type: String, default: '' },
  logoPhoto: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
