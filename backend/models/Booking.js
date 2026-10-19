const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Null only for 'offline' bookings (see `source` below) — a walk-in/phone booking the
  // partner marked themselves never has a real Tamboo customer behind it.
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // null until hall/venue listings are backed by real Partner records — see catalog.ts's optional partnerId
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', default: null },
  hallId: { type: String, required: true },
  hallName: { type: String, required: true },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  date: { type: String, required: true },
  slot: { type: String, required: true },
  guests: { type: Number, default: 0 },
  // When the customer picks a day/time on the "schedule your visit" card — purely informational
  // for now (no partner-side notification yet), but persisted so it survives app restarts
  // instead of just flashing a confirmation and vanishing.
  visitDay: { type: String, default: '' },
  visitTime: { type: String, default: '' },
  amount: { type: Number, required: true }, // token amount paid, in rupees — 0 for 'offline' bookings
  finalRent: { type: Number, default: 0 }, // agreed by partner once the customer visits in person
  commissionPct: { type: Number, default: 10 },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  // 'online' = a real customer paid through the app (the normal case). 'offline' = the
  // partner manually blocked this slot for a walk-in/phone booking that never touched
  // Tamboo — created via the hall-owner "mark as booked" or register-photo-import flows,
  // no real customer/payment behind it. Both count the same for availability/conflict
  // checks (see lib/hallAvailability.js's ACTIVE_BOOKING_STATUSES).
  source: { type: String, enum: ['online', 'offline'], default: 'online' },
  // Advance payment — collected through Razorpay once the partner sets finalRent, replacing
  // what used to be a partner-typed "confirmed" flag with a real second payment. Snapshotted
  // from the Hall's advancePct at the moment the partner sets the rent, so a later change to
  // the hall's default doesn't retroactively alter an in-flight booking's deadline/amount.
  advancePct: { type: Number, default: 25 },
  advanceAmount: { type: Number, default: 0 },
  advanceDeadlineAt: { type: Date, default: null },
  advanceRazorpayOrderId: { type: String, default: '' },
  advanceRazorpayPaymentId: { type: String, default: '' },
  status: {
    type: String,
    enum: ['token_paid', 'visited', 'awaiting_advance', 'confirmed', 'not_booked', 'cancelled', 'disputed'],
    default: 'token_paid',
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
