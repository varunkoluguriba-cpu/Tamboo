const mongoose = require('mongoose');

const orderLineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
}, { _id: false });

const historyEntrySchema = new mongoose.Schema({
  label: { type: String, required: true },
  date: { type: String, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // null when the vendor isn't a real registered partner yet (mock vendor checkout) — see Booking/Hall for the same pattern.
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', default: null },
  vendorName: { type: String, default: '' },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  eventType: { type: String, default: '' },
  eventName: { type: String, default: '' },
  dateTxt: { type: String, default: '' },
  address: { type: String, default: '' },
  guests: { type: Number, default: 0 },
  lines: [orderLineSchema],
  value: { type: Number, required: true }, // what the customer pays this vendor (subtotal + delivery share)
  commissionPct: { type: Number, default: 10 },
  commission: { type: Number, required: true },
  earn: { type: Number, required: true }, // value - commission
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED'],
    default: 'PENDING',
  },
  history: [historyEntrySchema],
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
