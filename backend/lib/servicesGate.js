const Config = require('../models/Config');

const SERVICE_CATEGORIES = ['priest', 'catering', 'decor', 'music'];

// Whether event services are visible to this phone number. 'beta' lets us test on the live
// server with the tester numbers only, while every real customer/vendor still sees nothing.
function servicesAllowedFor(config, phone) {
  if (config.servicesMode === 'on') return true;
  if (config.servicesMode === 'beta') return !!phone && (config.serviceTesterPhones || []).includes(phone);
  return false;
}

// Express middleware — 404s (as if the feature didn't exist) unless services are on for the
// signed-in customer (req.user) or partner (req.partner).
async function requireServices(req, res, next) {
  const config = await Config.get();
  const phone = (req.user && req.user.phone) || (req.partner && req.partner.phone) || '';
  if (!servicesAllowedFor(config, phone)) return res.status(404).json({ error: 'Not found' });
  req.servicesConfig = config;
  next();
}

module.exports = { SERVICE_CATEGORIES, servicesAllowedFor, requireServices };
