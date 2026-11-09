const mongoose = require('mongoose');
const { REFUND_FIELDS } = require('../lib/refunds');

// A customer asking a service vendor for a quote. The vendor gets the customer's name and
// phone (customer consents first) and calls them; price is agreed off-app. The first few
// requests are free (Config.serviceFreeQuotes), after that a small fee is paid via Razorpay.
const serviceRequestSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
  category: { type: String, required: true },
  vendorName: { type: String, default: '' },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  eventDate: { type: String, default: '' }, // DD/MM/YYYY
  eventType: { type: String, default: '' },
  guests: { type: Number, default: 0 },
  area: { type: String, default: '' },
  message: { type: String, default: '' },
  offerTitle: { type: String, default: '' }, // package the customer asked about, if any
  consentAt: { type: Date, required: true }, // when the customer agreed to share their number
  fee: { type: Number, default: 0 }, // 0 = one of the free requests
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  // PENDING_PAYMENT: fee not paid yet (vendor doesn't see it). NEW: vendor notified.
  // CONTACTED: vendor says they called. CLOSED: done. NO_RESPONSE: vendor didn't respond in
  // 24h — a free request is given back, a paid one is refunded.
  status: { type: String, enum: ['PENDING_PAYMENT', 'NEW', 'CONTACTED', 'CLOSED', 'NO_RESPONSE'], default: 'NEW' },
  notifiedAt: { type: Date, default: null },
  contactedAt: { type: Date, default: null },
  smsSent: { type: Boolean, default: false },
  ...REFUND_FIELDS,
}, { timestamps: true });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
