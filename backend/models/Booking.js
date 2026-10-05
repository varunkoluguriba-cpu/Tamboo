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
  finalRent: { type: Number, default: 0 }, // agreed by partner once the customer confirms in person
  commissionPct: { type: Number, default: 10 },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String, required: true },
  status: {
    type: String,
    enum: ['token_paid', 'visited', 'confirmed', 'not_booked', 'cancelled', 'disputed'],
    default: 'token_paid',
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
