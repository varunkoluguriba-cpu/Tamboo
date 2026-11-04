const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Display-only formatting for an ISO 'YYYY-MM-DD' booking date — e.g. "14 Oct 2026".
// Falls back to the raw string if it isn't in the expected ISO shape (defensive against
// any already-saved bookings from before this format was made canonical on the customer side).
export function formatBookingDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const monthIdx = Number(mo) - 1;
  if (monthIdx < 0 || monthIdx > 11) return iso;
  return `${Number(d)} ${MONTH_ABBR[monthIdx]} ${y}`;
}

// '+919999900001' → '+91 99999 00001' (Indian numbers); anything else shown as-is.
export const prettyPhone = (p: string) => (/^\+91\d{10}$/.test(p || '') ? `+91 ${p.slice(3, 8)} ${p.slice(8)}` : p);
