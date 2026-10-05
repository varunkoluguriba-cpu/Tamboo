const mongoose = require('mongoose');

const quoteVersionSchema = new mongoose.Schema({
  v: { type: Number, required: true },
  total: { type: Number, required: true },
  note: { type: String, default: '' },
  lines: [{ label: { type: String, required: true }, amount: { type: Number, required: true } }],
}, { _id: false });

const quoteSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // null when the vendor isn't a real registered partner yet (mock vendor catalog).
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', default: null },
  vendorName: { type: String, default: '' },
  productName: { type: String, default: '' },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  dateTxt: { type: String, default: '' },
  guests: { type: Number, default: 0 },
  need: { type: String, required: true }, // customer's free-text requirement
  status: {
    type: String,
    enum: ['AWAITING_VENDOR', 'OFFER_SENT', 'REVISION_REQUESTED', 'ACCEPTED', 'DECLINED'],
    default: 'AWAITING_VENDOR',
  },
  versions: [quoteVersionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Quote', quoteSchema);
