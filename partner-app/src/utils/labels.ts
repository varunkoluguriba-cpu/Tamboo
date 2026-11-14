import type { LangStrings } from '../i18n';

// Hall types and catering options are stored in English (customers' filters match on them);
// these show them in the partner's language.
export function venueTypeText(v: string, t: LangStrings): string {
  return ({ 'Function Hall': t.pVtFunction, 'Banquet Hall': t.pVtBanquet, 'Marriage Hall': t.pVtMarriage, Hotel: t.pVtHotel } as Record<string, string>)[v] || v;
}
export function cateringText(c: string, t: LangStrings): string {
  return ({ 'In-house catering only': t.pCatInHouse, 'Outside caterers allowed': t.pCatOutside, 'Both allowed': t.pCatBoth } as Record<string, string>)[c] || c;
}

// Hall booking slots are stored in English ('Morning' / 'Evening' / 'FullDay').
export function hallSlotText(slot: string, t: LangStrings): string {
  return ({ Morning: t.visitMorning, Evening: t.visitEvening, FullDay: t.registerPhotoFullDay } as Record<string, string>)[slot] || slot;
}

// Earnings entries are written by the server in English ("Token — Laxmi Convention"); show the
// known kinds in the partner's language. Anything else (e.g. a note typed by admin) is shown as-is.
export function ledgerText(desc: string, t: LangStrings): string {
  const kinds: Array<[string, string]> = [
    ['Token', t.ledgerToken], ['Advance', t.ledgerAdvance], ['Advance not paid in time', t.ledgerAdvanceLate],
    ['Not booked', t.ledgerNotBooked], ["Hall couldn't host", t.ledgerHallCouldnt], ['Customer cancelled', t.ledgerCustCancelled],
    ['Farm booking cancelled', t.ledgerFarmCancelled], ['Farm booking advance', t.ledgerFarmAdvance],
  ];
  const m = /^(.+?) — (.*)$/.exec(desc);
  const kind = m && kinds.find(([en]) => en === m[1]);
  if (m && kind) return `${kind[1]} — ${m[2]}`;
  const order = /^(Declined order|Cancelled order|Order) (TB-\w+)(.*)$/.exec(desc);
  if (order) {
    const kind = ({ Order: t.ledgerOrder, 'Declined order': t.ledgerDeclined, 'Cancelled order': t.ledgerCancelled } as Record<string, string>)[order[1]];
    return kind.replace('{code}', order[2]) + order[3];
  }
  return desc;
}
