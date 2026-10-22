const { getClient: getAnthropicClient } = require('../config/anthropic');

// Produces a MOM-style (minutes-of-meeting) summary of a WhatsApp thread: a short recap plus
// concrete action items, the way someone would jot notes after a call. Uses Sonnet rather than
// the Haiku used for item classification — this is a lower-frequency, higher-value synthesis
// task (once per conversation lull, not per keystroke) where summary quality matters more than
// shaving a few hundred ms of latency.
async function summarizeConversation(convo) {
  const transcript = convo.messages
    .slice(-40) // most recent 40 turns is plenty of context without ballooning the prompt
    .map((m) => `${m.from === 'them' ? 'Them' : 'Tamboo'}: ${m.text}`)
    .join('\n');

  const prompt = `This is a WhatsApp conversation between a Tamboo business contact (a tent-house/rental vendor or a customer) and Tamboo. Summarize it like meeting minutes, in the context of event/wedding rental bookings in India.

Reply with ONLY a JSON object, no other text, no markdown fences, in exactly this shape:
{"summary": "2-3 sentence recap of what was discussed", "actionItems": ["short actionable item", "..."]}

If nothing actionable came up, return an empty actionItems array. Keep each action item under 15 words.

Conversation:
${transcript}`;

  const message = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-5-5',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content || []).map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
  const jsonText = text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(jsonText);

  convo.summary = typeof parsed.summary === 'string' ? parsed.summary.slice(0, 600) : '';
  convo.actionItems = Array.isArray(parsed.actionItems) ? parsed.actionItems.slice(0, 10).map((a) => String(a).slice(0, 150)) : [];
  convo.summarizedAt = new Date();
  await convo.save();
  return convo;
}

module.exports = { summarizeConversation };
