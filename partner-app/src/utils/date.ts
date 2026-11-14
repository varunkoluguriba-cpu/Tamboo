import type { LangStrings } from '../i18n';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Month name in the partner's language. Short English names are 3 letters ("Sep"); Telugu, Hindi
// and Urdu month names have no common short form, so those stay full.
export function monthName(idx: number, t?: LangStrings, short = false): string {
  const full = t?.pfMonths.split(',')[idx];
  if (!full) return MONTH_ABBR[idx] || '';
  return short && /^[A-Za-z]/.test(full) ? full.slice(0, 3) : full;
}

// Display-only formatting for an ISO 'YYYY-MM-DD' booking date (or a DD/MM/YYYY order date) — e.g. "14 Oct 2026".
// Falls back to the raw string if it isn't in the expected ISO shape (defensive against
// any already-saved bookings from before this format was made canonical on the customer side).
export function formatBookingDate(iso: string, t?: LangStrings): string {
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(iso); // order dates are stored DD/MM/YYYY
  const m = dmy ? [iso, dmy[3], dmy[2], dmy[1]] : /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const monthIdx = Number(mo) - 1;
  if (monthIdx < 0 || monthIdx > 11) return iso;
  return `${Number(d)} ${monthName(monthIdx, t, true)} ${y}`;
}

// '+919999900000' → '+91 99999 00000' (Indian numbers); anything else shown as-is. Wrapped in
// left-to-right isolate marks so it never displays reversed inside Urdu (right-to-left) text.
export const prettyPhone = (p: string) => {
  const s = /^\+91\d{10}$/.test(p || '') ? `+91 ${p.slice(3, 8)} ${p.slice(8)}` : p || '';
  return s ? `\u2066${s}\u2069` : s;
};

// Day + short month for a date tile, from any stored order date: 'DD/MM/YYYY' (the canonical
// format), ISO 'YYYY-MM-DD', or older free text like '13 Dec'. Unknown shapes show as-is.
export function dateTileParts(txt: string): { day: string; mon: string } {
  const s = (txt || '').trim();
  let m = /^(\d{1,2})\/(\d{1,2})\/\d{4}$/.exec(s);
  if (m && MONTH_ABBR[Number(m[2]) - 1]) return { day: String(Number(m[1])), mon: MONTH_ABBR[Number(m[2]) - 1] };
  m = /^\d{4}-(\d{2})-(\d{2})$/.exec(s);
  if (m && MONTH_ABBR[Number(m[1]) - 1]) return { day: String(Number(m[2])), mon: MONTH_ABBR[Number(m[1]) - 1] };
  const [day = '', mon = ''] = s.split(' ');
  return { day, mon };
}
