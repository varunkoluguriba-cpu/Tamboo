const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // kind 'vendor': a customer<->partner conversation — both customer and partner are set.
  // kind 'support': a thread with Tamboo itself — exactly one of customer/partner is set
  // (whichever side raised the issue), the other stays null.
  kind: { type: String, enum: ['vendor', 'support'], default: 'vendor', index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', default: null, index: true },
  sender: { type: String, enum: ['customer', 'partner', 'admin'], required: true },
  text: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
