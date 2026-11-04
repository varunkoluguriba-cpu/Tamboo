import type { LangStrings } from '../i18n';
import type { RemoteHallBooking } from '../navigation/types';

// Human wording for backend status codes, so screens never show raw values like
// "TOKEN_PAID" or "OUT_FOR_DELIVERY".

// Some older labels are all-caps badge text ("HELD") — use sentence case when shown in text.
const sentence = (s: string) => (/^[A-Z\s]+$/.test(s) ? s.charAt(0) + s.slice(1).toLowerCase() : s);

export function hallStatusText(b: Pick<RemoteHallBooking, 'status' | 'heldAtMs' | 'visitHours'>, t: LangStrings): string {
  return sentence(hallStatusRaw(b, t));
}

function hallStatusRaw(b: Pick<RemoteHallBooking, 'status' | 'heldAtMs' | 'visitHours'>, t: LangStrings): string {
  switch (b.status) {
    case 'token_paid':
      return Date.now() > b.heldAtMs + b.visitHours * 3600 * 1000 ? t.tokenStatusExpired : t.tokenStatusHeld;
    case 'visited': return t.tokenStatusVisited;
    case 'awaiting_advance': return t.tokenStatusAwaitingAdvance;
    case 'confirmed': return t.tokenStatusConfirmed;
    case 'cancelled': return t.statusCancelled;
    case 'not_booked': return t.statusNotBooked;
    case 'disputed': return t.statusUnderReview;
    default: return b.status;
  }
}

export function orderStatusText(status: string, t: LangStrings): string {
  return sentence(orderStatusRaw(status, t));
}

function orderStatusRaw(status: string, t: LangStrings): string {
  switch (status) {
    case 'PENDING': return t.statusAwaitingVendor;
    case 'CONFIRMED': return t.tokenStatusConfirmed;
    case 'PACKED': return t.statusPacked;
    case 'OUT_FOR_DELIVERY': return t.statusOutForDelivery;
    case 'DELIVERED': return t.statusDelivered;
    case 'COMPLETED': return t.statusCompleted;
    case 'CANCELLED': return t.statusCancelled;
    case 'DISPUTED': return t.statusUnderReview;
    default: return status;
  }
}

// "2026-11-20" → "20 Nov 2026"; anything that isn't an ISO date is shown as typed.
export function prettyDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return s;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function quoteStatusText(status: string, t: LangStrings): string {
  switch (status) {
    case 'AWAITING_VENDOR': return t.statusAwaitingVendor;
    case 'OFFER_SENT': return t.statusOfferReceived;
    case 'REVISION_REQUESTED': return t.statusRevisionRequested;
    case 'ACCEPTED': return t.statusAccepted;
    case 'DECLINED': return t.statusDeclined;
    default: return status;
  }
}

// "Refund of ₹4,000 in 5–7 days" / "Refunded ₹4,000" — or '' when nothing is owed.
export function refundText(d: { refundStatus?: string; refundAmount?: number }, t: LangStrings): string {
  if (!d.refundAmount || !d.refundStatus || d.refundStatus === 'none') return '';
  const amt = `₹${d.refundAmount.toLocaleString('en-IN')}`;
  return d.refundStatus === 'refunded' ? t.refundDone.replace('{amount}', amt) : t.refundPending.replace('{amount}', amt);
}
