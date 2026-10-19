const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getCouponDiscountPct } = require('../lib/cartPricing');

const router = express.Router();

// Lets the cart screen preview a real discount before checkout, against the same
// admin-managed Coupon collection that create-order/verify re-check server-side.
router.get('/:code', requireAuth, async (req, res) => {
  const discountPct = await getCouponDiscountPct(req.params.code);
  if (discountPct == null) return res.json({ valid: false });
  res.json({ valid: true, discountPct });
});

module.exports = router;
