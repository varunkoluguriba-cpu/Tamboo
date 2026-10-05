const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
  sender: { type: String, enum: ['customer', 'partner'], required: true },
  text: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
