const crypto = require('crypto');
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getClient } = require('../config/razorpay');

const router = express.Router();

// TODO: once real Booking/Order models exist, compute `amount` here from the
// stored order instead of trusting the client — for now the cart pricing
// itself is still client-side mock data, so this is a matched limitation.
router.post('/create-order', requireAuth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount (in rupees) is required' });
  }
  const order = await getClient().orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: `tamboo_${Date.now()}`,
  });
  res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
});

router.post('/verify', requireAuth, (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' });
  }
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  const verified = expected === razorpay_signature;
  res.json({ verified });
});

module.exports = router;
