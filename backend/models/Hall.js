const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, unique: true },
  venueType: { type: String, default: '' },
  address: { type: String, default: '' },
  seated: { type: Number, default: 0 },
  floating: { type: Number, default: 0 },
  sqft: { type: Number, default: 0 },
  parking: { type: Number, default: 0 },
  rooms: { type: Number, default: 0 },
  // How the owner charges for the hall itself — some banquet halls charge a flat rent
  // for the space; others charge only per-plate for catering and give the hall for
  // free once a minimum guest count (plates) is guaranteed. Owner's choice.
  pricingMode: { type: String, enum: ['rent', 'perPlate'], default: 'rent' },
  rent: { type: Number, default: 0 },
  platePrice: { type: Number, default: 0 },
  minPlates: { type: Number, default: 0 },
  token: { type: Number, default: 0 },
  // % of finalRent the customer must pay as a real advance (via Razorpay) before a
  // booking counts as confirmed — partner-adjustable, defaults to the platform norm.
  advancePct: { type: Number, default: 25 },
  ac: { type: Boolean, default: true },
  crockery: { type: Boolean, default: false },
  kitchen: { type: Boolean, default: false },
  crockeryNote: { type: String, default: '' },
  catering: { type: String, default: '' },
  amenities: { type: String, default: '' },
  blurb: { type: String, default: '' },
  // Data-URI strings (base64) — no separate object-storage service yet, see server.js's
  // raised JSON body limit. Open gallery, capped at 15 in the route handler (16MB Mongo
  // document limit) — partners are encouraged to show before/after decoration, stage,
  // chairs, parking, kitchen, dining area etc. First photo is the cover/hero image.
  photos: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Hall', hallSchema);
