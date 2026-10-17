const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Canonical stored/transmitted format for booking dates — must match the backend's
// Hall.blockedDates format exactly so availability checks can compare them directly.
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Display-only formatting for an ISO 'YYYY-MM-DD' booking date — e.g. "14 Oct 2026".
// Falls back to the raw string if it isn't in the expected ISO shape (defensive against
// any already-saved bookings from before this format was made canonical).
export function formatBookingDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const monthIdx = Number(mo) - 1;
  if (monthIdx < 0 || monthIdx > 11) return iso;
  return `${Number(d)} ${MONTH_ABBR[monthIdx]} ${y}`;
}
