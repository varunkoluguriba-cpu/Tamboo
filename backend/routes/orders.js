const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Order = require('../models/Order');

const router = express.Router();

// Commission/earn are Tamboo's internal economics with the vendor — not shown to the customer.
function serializeOrderForCustomer(o) {
  return {
    id: o.id,
    code: o.code,
    status: o.status,
    vendorName: o.vendorName,
    eventName: o.eventName,
    eventType: o.eventType,
    dateTxt: o.dateTxt,
    address: o.address,
    guests: o.guests,
    lines: o.lines,
    value: o.value,
    history: o.history,
    createdAtMs: o.createdAt ? new Date(o.createdAt).getTime() : Date.now(),
  };
}

// Customer: every rental-item order they've ever placed, newest first.
router.get('/me', requireAuth, async (req, res) => {
  const orders = await Order.find({ customer: req.user.id }).sort({ createdAt: -1 });
  res.json(orders.map(serializeOrderForCustomer));
});

module.exports = router;
