// Transactional SMS via MSG91's Flow API. Indian DLT rules mean every SMS must use a template
// pre-approved on the DLT portal, so this only sends when both the auth key and the template id
// are configured (Render env vars). Until then it logs and reports `skipped` — callers must
// never depend on an SMS having gone out (vendors also see every request in the partner app).
const FLOW_URL = 'https://control.msg91.com/api/v5/flow/';

const TEMPLATES = {
  // DLT template text (to register): "New Tamboo enquiry: ##name## (##phone##) needs ##service## on ##date##. Open the Tamboo Partner app or call them. -TAMBOO"
  serviceLead: process.env.MSG91_LEAD_TEMPLATE_ID,
};

async function sendSms(phoneE164, templateKey, vars) {
  const templateId = TEMPLATES[templateKey];
  const authKey = process.env.MSG91_AUTH_KEY;
  const mobile = String(phoneE164 || '').replace(/^\+/, '');
  if (!authKey || !templateId) {
    console.log(`[sms] skipped (not configured): ${templateKey} → ${mobile}`);
    return { sent: false, skipped: true };
  }
  if (!/^91\d{10}$/.test(mobile)) return { sent: false, error: 'not an Indian mobile number' };
  try {
    const res = await fetch(FLOW_URL, {
      method: 'POST',
      headers: { authkey: authKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: templateId, short_url: '0', recipients: [{ mobiles: mobile, ...vars }] }),
    });
    if (!res.ok) return { sent: false, error: `MSG91 HTTP ${res.status}` };
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err.message };
  }
}

module.exports = { sendSms };
