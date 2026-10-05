const crypto = require('crypto');
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getClient } = require('../config/razorpay');
const Booking = require('../models/Booking');
const Order = require('../models/Order');
const Partner = require('../models/Partner');
const PayoutEntry = require('../models/PayoutEntry');

const DEFAULT_COMMISSION_PCT = 10;

function orderCode() {
  return 'TB-' + (250000 + Math.floor(Math.random() * 9999));
}

function nowTxt() {
  return new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
}

const router = express.Router();

// TODO: hall/venue pricing is still client-side mock data (no real Hall model yet),
// so `amount` is trusted from the client here and again in /verify — revisit once
// halls are backed by a real, server-owned listing.
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

router.post('/verify', requireAuth, async (req, res) => {
  const {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    hallId, hallName, date, slot, guests, amount, partnerId, customerName, customerPhone,
    cart,
  } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' });
  }
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  const verified = expected === razorpay_signature;
  if (!verified) return res.json({ verified: false });

  // Booking context is optional so /verify still works for any future non-hall-token
  // payment; when it's present (the hall pre-booking flow) we persist the booking and,
  // if the hall is linked to a real registered partner, auto-credit their payout ledger.
  let bookingId;
  if (hallId && hallName && date && slot && typeof amount === 'number') {
    let partner = null;
    if (partnerId) partner = await Partner.findById(partnerId).catch(() => null);

    const booking = await Booking.create({
      customer: req.user.id,
      partner: partner ? partner.id : null,
      hallId, hallName, date, slot,
      customerName: customerName || req.user.name || '',
      customerPhone: customerPhone || req.user.phone || '',
      guests: guests || 0,
      amount,
      commissionPct: DEFAULT_COMMISSION_PCT,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
    bookingId = booking.id;

    if (partner) {
      const net = Math.round(amount * (1 - DEFAULT_COMMISSION_PCT / 100));
      await PayoutEntry.create({
        partner: partner.id,
        type: 'credit',
        amount: net,
        description: `Token — ${hallName}`,
        reference: booking.id,
      });
    }
  }

  // Cart checkout: one Razorpay payment covers every vendor group at once. We split it
  // back into one Order per vendor here, each carrying the shared event address/date so
  // every vendor's Orders tab has everything they need with zero further coordination —
  // Tamboo doesn't run its own delivery, so complete, unambiguous per-vendor info is the
  // whole job. Payout is only auto-credited when the group's vendor is a real registered
  // partner and the customer paid in full (advance/partial payments are reconciled manually).
  let orders;
  if (cart && Array.isArray(cart.groups)) {
    orders = [];
    for (const g of cart.groups) {
      let partner = null;
      if (g.vendorId) partner = await Partner.findById(g.vendorId).catch(() => null);

      const value = Math.round((g.subtotal || 0) + (g.deliveryFee || 0));
      const commission = Math.round(value * (DEFAULT_COMMISSION_PCT / 100));
      const order = await Order.create({
        code: orderCode(),
        customer: req.user.id,
        partner: partner ? partner.id : null,
        vendorName: g.vendorName || '',
        customerName: cart.customerName || '',
        customerPhone: cart.customerPhone || '',
        eventType: cart.eventType || '',
        eventName: cart.eventName || '',
        dateTxt: cart.dateTxt || '',
        address: cart.address || '',
        guests: cart.guests || 0,
        lines: (g.lines || []).map((l) => ({ name: l.name, qty: l.qty, unitPrice: l.unitPrice })),
        value,
        commissionPct: DEFAULT_COMMISSION_PCT,
        commission,
        earn: value - commission,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        history: [{ label: 'Order placed', date: nowTxt() }],
      });
      orders.push({ id: order.id, code: order.code, vendor: g.vendorName || '', total: value });

      if (partner && cart.payMode === 'full') {
        await PayoutEntry.create({
          partner: partner.id,
          type: 'credit',
          amount: order.earn,
          description: `Order ${order.code} — ${g.vendorName || 'rental items'}`,
          reference: order.id,
        });
      }
    }
  }

  res.json({ verified: true, orders, bookingId });
});

module.exports = router;
