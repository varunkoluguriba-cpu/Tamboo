const express = require('express');
const Conversation = require('../models/Conversation');
const Partner = require('../models/Partner');
const { getConfig } = require('../config/whatsapp');
const { summarizeConversation } = require('../lib/whatsappSummarize');

const router = express.Router();

// One-time handshake Meta does when you first configure the webhook URL in the Meta App
// Dashboard (WhatsApp > Configuration > Webhook). Must echo back hub.challenge verbatim if
// hub.verify_token matches what we set when registering the webhook.
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const { verifyToken } = getConfig();
  if (mode === 'subscribe' && verifyToken && token === verifyToken) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Incoming-message webhook — Meta POSTs here for every message sent to Tamboo's WhatsApp
// Business number. Acks immediately (Meta retries aggressively on anything but a fast 200),
// then stores the message and re-summarizes once the thread's had enough turns to be worth it.
router.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const change = req.body?.entry?.[0]?.changes?.[0]?.value;
    const incoming = change?.messages?.[0];
    if (!incoming || incoming.type !== 'text') return;

    const phone = `+${incoming.from}`;
    const text = incoming.text?.body || '';
    const partner = await Partner.findOne({ phone }).select('_id');

    let convo = await Conversation.findOne({ phone });
    if (!convo) convo = new Conversation({ phone, partner: partner ? partner._id : null });
    else if (!convo.partner && partner) convo.partner = partner._id;

    convo.messages.push({
      from: 'them',
      text,
      waMessageId: incoming.id || '',
      timestamp: incoming.timestamp ? new Date(Number(incoming.timestamp) * 1000) : new Date(),
    });
    convo.lastMessageAt = new Date();
    await convo.save();

    // Re-summarize every 4 new messages rather than every single one — keeps the Claude
    // call count (and cost) down while still keeping the summary reasonably fresh.
    if (convo.messages.length % 4 === 0) {
      summarizeConversation(convo).catch((e) => console.error('WhatsApp summarize failed:', e.message));
    }
  } catch (e) {
    console.error('WhatsApp webhook processing failed:', e.message);
  }
});

module.exports = router;
