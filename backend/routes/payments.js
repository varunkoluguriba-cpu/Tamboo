const crypto = require('crypto');
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getClient } = require('../config/razorpay');
const Booking = require('../models/Booking');
const Hall = require('../models/Hall');
const Order = require('../models/Order');
const Partner = require('../models/Partner');
const PayoutEntry = require('../models/PayoutEntry');
const { isSlotTaken } = require('../lib/hallAvailability');
const { checkItemStock } = require('../lib/itemAvailability');
const { priceCartGroups, getCouponDiscountPct, computeTotals, DELIVERY_FEE_PER_VENDOR } = require('../lib/cartPricing');
const Config = require('../models/Config');

function orderCode() {
  return 'TB-' + (250000 + Math.floor(Math.random() * 9999));
}

function nowTxt() {
  return new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
}

const router = express.Router();

// The amount actually charged is always derived server-side here — from the real Hall.token
// or by re-pricing the cart against the real Item catalog — never trusted from the client.
// A tampered request (modified app, intercepted call) can no longer pay less than the real
// price; see lib/cartPricing.js for the cart-side recompute.
router.post('/create-order', requireAuth, async (req, res) => {
  const { hallId, date, slot, cart } = req.body;

  if (hallId) {
    const hall = await Hall.findById(hallId).select('token').lean();
    if (!hall) return res.status(404).json({ error: 'Hall not found' });
    // Hall-booking payments carry date/slot — reject before any money moves if the slot's
    // already taken, so the common case never even opens the Razorpay checkout sheet.
    if (date && slot) {
      const { taken, reason } = await isSlotTaken(hallId, date, slot);
      if (taken) return res.status(409).json({ error: reason });
    }
    const order = await getClient().orders.create({
      amount: Math.round(hall.token * 100),
      currency: 'INR',
      receipt: `tamboo_${Date.now()}`,
    });
    return res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  }

  if (cart && Array.isArray(cart.groups)) {
    const priced = await priceCartGroups(cart.groups);
    if (priced.error) return res.status(400).json({ error: priced.error });

    // Reject before payment if any line would outsell the vendor's stock.
    for (const g of priced.groups) {
      for (const l of g.lines) {
        const { ok, reason } = await checkItemStock(l.itemId, l.qty, cart.dateTxt);
        if (!ok) return res.status(409).json({ error: reason });
      }
    }

    let discountPct = 0;
    if (cart.couponCode) {
      discountPct = await getCouponDiscountPct(cart.couponCode);
      if (discountPct == null) return res.status(400).json({ error: 'Invalid or expired coupon code' });
    }

    const totals = computeTotals({
      subtotal: priced.subtotal,
      deliveryMode: cart.deliveryMode,
      vendorCount: priced.groups.length,
      discountPct,
    });
    const due = cart.payMode === 'advance' ? Math.round(totals.total * 0.3) : totals.total;

    const order = await getClient().orders.create({
      amount: Math.round(due * 100),
      currency: 'INR',
      receipt: `tamboo_${Date.now()}`,
    });
    return res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  }

  return res.status(400).json({ error: 'Nothing to pay for' });
});

// Advance payment on an existing hall pre-booking — the amount is server-owned (read from
// the booking itself, never trusted from the client) so the customer can't under-pay by
// tampering with the request. Only valid while the partner's advance request is still open.
router.post('/create-advance-order', requireAuth, async (req, res) => {
  const { bookingId } = req.body || {};
  const booking = await Booking.findOne({ _id: bookingId, customer: req.user.id });
  if (!booking) return res.status(404).json({ error: 'Pre-booking not found' });
  if (booking.status !== 'awaiting_advance') {
    return res.status(400).json({ error: 'No advance payment is pending on this booking' });
  }
  if (booking.advanceDeadlineAt && booking.advanceDeadlineAt < new Date()) {
    return res.status(400).json({ error: 'The advance payment window has expired' });
  }
  const order = await getClient().orders.create({
    amount: Math.round(booking.advanceAmount * 100),
    currency: 'INR',
    receipt: `tamboo_adv_${Date.now()}`,
  });
  res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
});

router.post('/verify', requireAuth, async (req, res) => {
  const {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    hallId, hallName, date, slot, guests, partnerId, customerName, customerPhone,
    cart, advanceForBookingId,
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

  if (advanceForBookingId) {
    const booking = await Booking.findOne({ _id: advanceForBookingId, customer: req.user.id });
    if (!booking || booking.status !== 'awaiting_advance') {
      return res.status(400).json({ error: 'This advance request is no longer open' });
    }
    booking.status = 'confirmed';
    booking.advanceRazorpayOrderId = razorpay_order_id;
    booking.advanceRazorpayPaymentId = razorpay_payment_id;
    await booking.save();

    if (booking.partner) {
      const net = Math.round(booking.advanceAmount * (1 - booking.commissionPct / 100));
      await PayoutEntry.create({
        partner: booking.partner,
        type: 'credit',
        amount: net,
        description: `Advance — ${booking.hallName}`,
        reference: booking.id,
      });
    }
    return res.json({ verified: true, bookingId: booking.id });
  }

  // Booking context is optional so /verify still works for any future non-hall-token
  // payment; when it's present (the hall pre-booking flow) we persist the booking and,
  // if the hall is linked to a real registered partner, auto-credit their payout ledger.
  // Fetched once per request, not cached across requests — so an admin's commission-%
  // change via the Fees settings page takes effect on the very next order, not after a
  // server restart.
  const { commissionPct: DEFAULT_COMMISSION_PCT } = await Config.get();

  let bookingId;
  let bookingConflict = false;
  if (hallId && hallName && date && slot) {
    let partner = null;
    if (partnerId) partner = await Partner.findById(partnerId).catch(() => null);

    // Amount is re-derived from the real Hall record here too — never trusted from the
    // client — so it always matches what create-order actually charged via Razorpay.
    const hall = await Hall.findById(hallId).select('token').lean();
    const amount = hall ? hall.token : 0;

    // Re-check right before creating the booking — the /create-order check already caught
    // the common case, but payment can take a minute or two in the Razorpay sheet, so this
    // closes the narrow race where someone else grabs the same slot in between. The payment
    // itself has already been captured by this point and we don't have refund automation
    // yet (see payout-ledger TODO), so a real clash here is recorded as 'disputed' — same
    // status the dispute flow already uses — rather than silently double-booking the slot
    // or losing track of the customer's money. Needs manual resolution by Tamboo/the partner.
    const { taken } = await isSlotTaken(hallId, date, slot);
    bookingConflict = taken;

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
      status: bookingConflict ? 'disputed' : 'token_paid',
    });
    bookingId = booking.id;

    if (partner && !bookingConflict) {
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
    // Prices re-derived from the real Item catalog here too — see lib/cartPricing.js —
    // so a vendor's recorded order value/commission/payout always reflects real prices,
    // never whatever the client's cart payload claimed.
    const priced = await priceCartGroups(cart.groups);
    if (priced.error) return res.status(400).json({ error: priced.error });
    const deliveryFeePerGroup = cart.deliveryMode === 'delivery' ? DELIVERY_FEE_PER_VENDOR : 0;

    orders = [];
    for (const g of priced.groups) {
      let partner = null;
      if (g.vendorId) partner = await Partner.findById(g.vendorId).catch(() => null);

      // Re-check stock right before creating the order — the /create-order check already
      // caught the common case, but this closes the narrow race where another order for the
      // same item+date snuck in during payment. Payment's already captured by this point and
      // there's no refund automation yet, so a real clash here is recorded as 'DISPUTED'
      // (same principle as the hall-booking conflict handling) rather than silently oversold.
      let lineConflict = false;
      for (const l of g.lines) {
        const { ok } = await checkItemStock(l.itemId, l.qty, cart.dateTxt);
        if (!ok) { lineConflict = true; break; }
      }

      const value = Math.round(g.subtotal + deliveryFeePerGroup);
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
        lines: g.lines.map((l) => ({ itemId: l.itemId, name: l.name, qty: l.qty, unitPrice: l.unitPrice })),
        value,
        commissionPct: DEFAULT_COMMISSION_PCT,
        commission,
        earn: value - commission,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: lineConflict ? 'DISPUTED' : 'PENDING',
        history: [{ label: lineConflict ? 'Order placed — stock conflict, needs review' : 'Order placed', date: nowTxt() }],
      });
      orders.push({ id: order.id, code: order.code, vendor: g.vendorName || '', total: value, conflict: lineConflict });

      if (partner && cart.payMode === 'full' && !lineConflict) {
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

  res.json({ verified: true, orders, bookingId, bookingConflict });
});

module.exports = router;
