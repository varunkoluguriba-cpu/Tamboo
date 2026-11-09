import type { LangStrings } from '../i18n';

// Hall types and catering options are stored in English (customers' filters match on them);
// these show them in the partner's language.
export function venueTypeText(v: string, t: LangStrings): string {
  return ({ 'Function Hall': t.pVtFunction, 'Banquet Hall': t.pVtBanquet, 'Marriage Hall': t.pVtMarriage, Hotel: t.pVtHotel } as Record<string, string>)[v] || v;
}
export function cateringText(c: string, t: LangStrings): string {
  return ({ 'In-house catering only': t.pCatInHouse, 'Outside caterers allowed': t.pCatOutside, 'Both allowed': t.pCatBoth } as Record<string, string>)[c] || c;
}
