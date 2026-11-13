require('dotenv').config();
require('express-async-errors');
const path = require('path');
const Shop = require('./models/Shop');
const FarmHouse = require('./models/FarmHouse');
const Hall = require('./models/Hall');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const paymentsRoutes = require('./routes/payments');
const partnerAuthRoutes = require('./routes/partnerAuth');
const adminAuthRoutes = require('./routes/adminAuth');
const { ensureAdminUser } = require('./routes/adminAuth');
const adminRoutes = require('./routes/admin');
const hallsRoutes = require('./routes/halls');
const vendorsRoutes = require('./routes/vendors');
const quotesRoutes = require('./routes/quotes');
const messagesRoutes = require('./routes/messages');
const ordersRoutes = require('./routes/orders');
const siteContentRoutes = require('./routes/siteContent');
const couponsRoutes = require('./routes/coupons');
const whatsappRoutes = require('./routes/whatsapp');
const servicesRoutes = require('./routes/services');
const { router: farmsRoutes } = require('./routes/farms');

const app = express();
// Render sits behind a proxy: trust its X-Forwarded-For so req.ip is the real client IP
// (used by the admin login throttle).
app.set('trust proxy', 1);
app.use(cors());
// Raised from the 100kb default — photo uploads are sent as base64 data URIs in JSON bodies
// (no separate file-storage service yet, see Hall/Item/Shop/Partner `photos` fields).
app.use(express.json({ limit: '15mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/partner-auth', partnerAuthRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/halls', hallsRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/farms', farmsRoutes);

// Admin panel (built single-page app, see admin-panel/) served from this same server at /admin,
// so it needs no separate hosting. Every API call it makes still requires an admin login.
const ADMIN_DIST = path.join(__dirname, 'admin-dist');
app.use('/admin', (req, res, next) => { res.set('X-Robots-Tag', 'noindex, nofollow'); next(); });
app.use('/admin', express.static(ADMIN_DIST, { index: false, maxAge: '1h' }));
app.get(['/admin', '/admin/*'], (req, res) => res.sendFile(path.join(ADMIN_DIST, 'index.html')));

// Search engines: index the customer website only — never the admin panel, the API or anyone's
// own bookings/account/cart. The sitemap lists every live hall, farm house and rental vendor.
app.get('/robots.txt', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(['User-agent: *', 'Disallow: /admin', 'Disallow: /api/', 'Disallow: /bookings', 'Disallow: /account', 'Disallow: /cart', '', `Sitemap: ${base}/sitemap.xml`, ''].join('\n'));
});
app.get('/sitemap.xml', async (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const [halls, farms, shops] = await Promise.all([
    Hall.find().populate({ path: 'partner', match: { role: 'venue', verificationStatus: 'verified' }, select: '_id' }).select('_id updatedAt partner').lean(),
    FarmHouse.find({ published: true }).populate({ path: 'partner', match: { role: 'farm', verificationStatus: 'verified', deletedAt: null }, select: '_id' }).select('_id updatedAt partner').lean(),
    Shop.find().populate({ path: 'partner', match: { role: 'tent', verificationStatus: 'verified' }, select: '_id' }).select('partner updatedAt').lean(),
  ]);
  const urls = ['/', '/halls', '/farm-houses', '/rentals', '/services', ...['wedding', 'birthday', 'house-party', 'pooja', 'corporate'].map((o) => `/occasions/${o}`)].map((u) => ({ loc: u }))
    .concat(halls.filter((h) => h.partner).map((h) => ({ loc: `/halls/${h._id}`, mod: h.updatedAt })))
    .concat(farms.filter((f) => f.partner).map((f) => ({ loc: `/farm-houses/${f._id}`, mod: f.updatedAt })))
    .concat(shops.filter((s) => s.partner).map((s) => ({ loc: `/rentals/${s.partner._id}`, mod: s.updatedAt })));
  const xml = urls.map((u) => `  <url><loc>${base}${u.loc}</loc>${u.mod ? `<lastmod>${new Date(u.mod).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>\n`);
});

// Customer website (built single-page app, see website/) at the root of the same server, so the
// site and its API share one origin. Any non-API path falls back to the site's index.html so
// links like /halls/:id open directly.
const WEB_DIST = path.join(__dirname, 'web-dist');
app.use(express.static(WEB_DIST, { index: false, maxAge: '1h' }));
app.get(/^\/(?!api\/|admin\/?|health$).*/, (req, res, next) => {
  if (!fs.existsSync(path.join(WEB_DIST, 'index.html'))) return next();
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(WEB_DIST, 'index.html'));
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    ensureAdminUser().catch((err) => console.error('Admin account setup failed:', err.message));
    app.listen(process.env.PORT || 4001, () => console.log('Tamboo backend running on port ' + (process.env.PORT || 4001)));
  })
  .catch((err) => console.error('MongoDB connection failed:', err.message));
