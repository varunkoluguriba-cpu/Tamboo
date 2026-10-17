const Item = require('../models/Item');
const Order = require('../models/Order');

// Statuses that represent a real, still-active claim on stock.
const ACTIVE_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];

// Checks whether ordering `qty` of `itemId` for event date `dateTxt` is actually possible.
// Two layers, both real but deliberately modest in what they claim to guarantee:
//   1. Hard ceiling — a single order can never claim more units than the vendor's total
//      declared stock, full stop, regardless of date. Always reliable.
//   2. Best-effort same-date check — sums qty already committed in other still-active orders
//      whose dateTxt string exactly matches this one, and rejects if the total would exceed
//      stock. This is weaker than it looks: `event.date` is a free-text field (no real date
//      picker yet), so two orders for the same real date but typed differently ("25/10/2026"
//      vs "25 Oct 2026") won't be caught. A full fix needs event.date to become a real
//      structured date across the app — flagged separately, not attempted here. This layer
//      still catches the common case since the app's own placeholder nudges everyone toward
//      the same DD/MM/YYYY shape.
async function checkItemStock(itemId, qty, dateTxt) {
  const item = await Item.findById(itemId).select('stock name').lean();
  if (!item) return { ok: false, reason: 'Item not found' };
  if (!(qty > 0)) return { ok: false, reason: 'Invalid quantity' };

  if (qty > item.stock) {
    return { ok: false, reason: `Only ${item.stock} of "${item.name}" in stock (requested ${qty})` };
  }

  if (dateTxt) {
    const orders = await Order.find({
      'lines.itemId': itemId,
      dateTxt,
      status: { $in: ACTIVE_ORDER_STATUSES },
    }).select('lines').lean();

    let committed = 0;
    orders.forEach((o) => {
      o.lines.forEach((l) => {
        if (l.itemId && String(l.itemId) === String(itemId)) committed += l.qty;
      });
    });

    if (committed + qty > item.stock) {
      const left = Math.max(0, item.stock - committed);
      return { ok: false, reason: `Only ${left} of "${item.name}" left for that date` };
    }
  }

  return { ok: true, reason: null };
}

module.exports = { ACTIVE_ORDER_STATUSES, checkItemStock };
