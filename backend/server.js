require('dotenv').config();
require('express-async-errors');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const paymentsRoutes = require('./routes/payments');
const partnerAuthRoutes = require('./routes/partnerAuth');
const adminAuthRoutes = require('./routes/adminAuth');
const adminRoutes = require('./routes/admin');
const hallsRoutes = require('./routes/halls');
const vendorsRoutes = require('./routes/vendors');
const quotesRoutes = require('./routes/quotes');
const messagesRoutes = require('./routes/messages');
const ordersRoutes = require('./routes/orders');

const app = express();
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

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(process.env.PORT || 4001, () => console.log('Tamboo backend running on port ' + (process.env.PORT || 4001)));
  })
  .catch((err) => console.error('MongoDB connection failed:', err.message));
