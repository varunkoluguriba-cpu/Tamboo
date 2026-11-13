const mongoose = require('mongoose');
const { REFUND_FIELDS } = require('../lib/refunds');

// An online farm-house booking. Created only after the advance is paid (status 'confirmed').
// startMin/endMin are minutes since 1970-01-01 in India time, so overlapping stays (a Full-day
// stay vs that day's Day slot, a Night stay running into the next morning) are a simple
// interval check — see lib/farmAvailability.js.
const farmBookingSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'FarmHouse', required: true, index: true },
  farmName: { type: String, default: '' },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  date: { type: String, required: true }, // check-in date YYYY-MM-DD
  slot: { type: String, enum: ['day', 'night', 'fullDay'], required: true },
  checkIn: { type: String, default: '' }, // HH:MM snapshot
  checkOut: { type: String, default: '' },
  startMin: { type: Number, required: true, index: true },
  endMin: { type: Number, required: true, index: true },
  guests: { type: Number, default: 0 },
  occasion: { type: String, default: '' },
  // Price snapshot at booking time
  basePrice: { type: Number, default: 0 },
  extraGuests: { type: Number, default: 0 },
  extraGuestCharge: { type: Number, default: 0 },
  total: { type: Number, required: true },
  advancePct: { type: Number, default: 30 },
  advanceAmount: { type: Number, required: true }, // paid online
  balanceAmount: { type: Number, default: 0 }, // paid at the property
  securityDeposit: { type: Number, default: 0 }, // refundable, paid to owner at check-in
  commissionPct: { type: Number, default: 10 },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  // pending = advance checkout started but not paid (holds nothing); confirmed = advance paid.
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'disputed'], default: 'pending' },
  cancelledBy: { type: String, enum: ['', 'customer', 'owner', 'admin'], default: '' },
  ...REFUND_FIELDS,
}, { timestamps: true });

module.exports = mongoose.model('FarmBooking', farmBookingSchema);
