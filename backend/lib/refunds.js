// Refunds are paid manually from the Razorpay dashboard for now (no refund automation).
// Whenever an action means the customer is owed money back, we record it on the order /
// booking so it shows up in the admin panel's Refunds list and the customer app can say so.

const REFUND_FIELDS = {
  refundStatus: { type: String, enum: ['none', 'pending', 'refunded'], default: 'none' },
  refundAmount: { type: Number, default: 0 },
  refundReason: { type: String, default: '' },
  refundRequestedAt: { type: Date, default: null },
  refundedAt: { type: Date, default: null },
  refundRef: { type: String, default: '' }, // Razorpay refund id / UTR the admin entered
};

// Only payments that actually went through Razorpay can be refunded; walk-ins/zero amounts can't.
function markRefundDue(doc, amount, reason) {
  const amt = Math.round(Number(amount) || 0);
  if (amt <= 0 || doc.refundStatus === 'refunded') return;
  doc.refundStatus = 'pending';
  doc.refundAmount = amt;
  doc.refundReason = reason;
  doc.refundRequestedAt = new Date();
}

module.exports = { REFUND_FIELDS, markRefundDue };
