const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
  name: { type: String, required: true },
  cat: { type: String, default: '' },
  price: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  stock: { type: Number, default: 0 },
  min: { type: Number, default: 1 },
  deposit: { type: Number, default: 0 },
  specs: { type: String, default: '' },
  instant: { type: Boolean, default: true },
  paused: { type: Boolean, default: false },
  // Data-URI (base64) photos — no separate object-storage service yet. Capped at 15 in the
  // route handler (16MB Mongo document limit); first photo is the cover/thumbnail.
  photos: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
