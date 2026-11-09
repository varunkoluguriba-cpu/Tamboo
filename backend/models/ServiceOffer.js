const mongoose = require('mongoose');

// A package a service vendor offers (e.g. "Veg wedding menu", "Satyanarayana pooja",
// "Stage + entrance decor"). Shown on their page; the actual price is agreed on the phone.
const serviceOfferSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
  title: { type: String, required: true },
  // fixed = flat price; perPlate = catering per plate; from = starting price ("from ₹X")
  priceType: { type: String, enum: ['fixed', 'perPlate', 'from'], default: 'from' },
  price: { type: Number, required: true, min: 1 },
  description: { type: String, default: '' },
  paused: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ServiceOffer', serviceOfferSchema);
