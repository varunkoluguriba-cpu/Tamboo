const Item = require('../models/Item');
const Coupon = require('../models/Coupon');

const DELIVERY_FEE_PER_VENDOR = 300;
const PLATFORM_FEE_PCT = 0.02;
const TAX_PCT = 0.05;

// Re-derives every line's price server-side from the real Item catalog — a client's cart
// payload is only ever used for itemId/qty/vendor grouping here, never for unitPrice or
// subtotal, so a tampered request (modified app, intercepted call) can't under-pay for real
// items. See routes/payments.js for how this plugs into create-order/verify.
async function priceCartGroups(rawGroups) {
  const groups = [];
  for (const g of rawGroups || []) {
    const lines = [];
    let subtotal = 0;
    for (const l of g.lines || []) {
      if (!l.itemId) return { error: `"${l.name || 'An item'}" could not be priced — missing item reference` };
      const item = await Item.findById(l.itemId).select('name price').lean();
      if (!item) return { error: `"${l.name || 'An item'}" is no longer available` };
      const qty = Number(l.qty) || 0;
      if (!(qty > 0)) return { error: `Invalid quantity for "${item.name}"` };
      const total = Math.round(item.price * qty);
      lines.push({ itemId: l.itemId, name: item.name, qty, unitPrice: item.price, total });
      subtotal += total;
    }
    groups.push({ vendorId: g.vendorId || null, vendorName: g.vendorName || '', lines, subtotal });
  }
  return { groups, subtotal: groups.reduce((sum, g) => sum + g.subtotal, 0) };
}

// Real lookup against the admin-managed Coupon collection — replaces the customer app's old
// hardcoded client-side coupon map, which had no connection to what admins actually create.
// Returns null when the code doesn't match an active coupon (caller decides how to handle).
async function getCouponDiscountPct(code) {
  if (!code) return 0;
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase(), active: true }).lean();
  return coupon ? coupon.discountPct : null;
}

// Mirrors customer-app's CartContext pricing formula exactly, but fed the server-verified
// subtotal and a real coupon discount instead of the client's own claimed numbers.
function computeTotals({ subtotal, deliveryMode, vendorCount, discountPct }) {
  const delivery = deliveryMode === 'delivery' ? vendorCount * DELIVERY_FEE_PER_VENDOR : 0;
  const platformFee = Math.round(subtotal * PLATFORM_FEE_PCT);
  const discount = discountPct ? Math.round(subtotal * (discountPct / 100)) : 0;
  const tax = Math.round((subtotal - discount) * TAX_PCT);
  const total = subtotal - discount + delivery + platformFee + tax;
  return { subtotal, delivery, platformFee, discount, tax, total };
}

module.exports = { priceCartGroups, getCouponDiscountPct, computeTotals, DELIVERY_FEE_PER_VENDOR };
