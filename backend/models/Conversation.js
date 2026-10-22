const mongoose = require('mongoose');

// One thread per WhatsApp phone number talking to Tamboo's WhatsApp Business number.
// `from: 'them'` is the partner/customer on the other end; `from: 'us'` is anything Tamboo's
// number replied with (templates, acks) — kept for summary context, not routed anywhere yet.
const messageSchema = new mongoose.Schema({
  from: { type: String, enum: ['them', 'us'], required: true },
  text: { type: String, default: '' },
  waMessageId: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, index: true }, // E.164, the other party's number
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', default: null, index: true },
  messages: { type: [messageSchema], default: [] },
  // AI-generated MOM (minutes-of-meeting) style summary — re-generated as the thread grows.
  summary: { type: String, default: '' },
  actionItems: { type: [String], default: [] },
  summarizedAt: { type: Date, default: null },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
