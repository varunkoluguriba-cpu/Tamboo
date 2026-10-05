const mongoose = require('mongoose');

const payoutEntrySchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
  type: { type: String, enum: ['credit', 'debit'], required: true }, // credit = earning added, debit = paid out
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  reference: { type: String, default: '' }, // e.g. booking/token id
}, { timestamps: true });

module.exports = mongoose.model('PayoutEntry', payoutEntrySchema);
