// WhatsApp Cloud API (Meta) config. Needs a Meta Business Account + a verified WhatsApp
// Business Platform app, set up at developers.facebook.com — see
// docs/whatsapp-setup.md for the exact steps. Not usable until that exists; routes/whatsapp.js
// degrades gracefully (sends but doesn't crash) when these are unset.
function getConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  };
}

function isConfigured() {
  const c = getConfig();
  return !!(c.accessToken && c.phoneNumberId && c.verifyToken);
}

module.exports = { getConfig, isConfigured };
