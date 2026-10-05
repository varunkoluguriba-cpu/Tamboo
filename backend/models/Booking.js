const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // null until hall/venue listings are backed by real Partner records — see catalog.ts's optional partnerId
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', default: null },
  hallId: { type: String, required: true },
  hallName: { type: String, required: true },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  date: { type: String, required: true },
  slot: { type: String, required: true },
  guests: { type: Number, default: 0 },
  amount: { type: Number, required: true }, // token amount paid, in rupees
  finalRent: { type: Number, default: 0 }, // agreed by partner once the customer visits in person
  commissionPct: { type: Number, default: 10 },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String, required: true },
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
