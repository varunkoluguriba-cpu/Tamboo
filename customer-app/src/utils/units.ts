import type { LangStrings } from '../i18n';

// Item units are stored in English ('per unit / event') — show them in the user's language.
// Anything we don't recognise (older or custom units) is shown as-is.
export function unitText(unit: string, t: LangStrings): string {
  switch (unit) {
    case 'per unit / day': return t.unitPerUnitDay;
    case 'per unit / event': return t.unitPerUnitEvent;
    case 'per event': return t.unitPerEvent;
    case 'per set / event': return t.unitPerSetEvent;
    default: return unit;
  }
}

// Hall types and the 'pax' capacity suffix also arrive in English from the server.
export function hallTypeText(type: string, t: LangStrings): string {
  switch ((type || '').toLowerCase()) {
    case 'function hall': return t.hallTypeFunction;
    case 'banquet hall': return t.hallTypeBanquet;
    case 'marriage hall': return t.hallTypeMarriage;
    case 'hotel': return t.hallTypeHotel;
    default: return type;
  }
}

export function paxText(s: string, t: LangStrings): string {
  return (s || '').replace(/ pax$/, ` ${t.paxUnit}`);
}

// Item category codes (tent / seat / table / …) as the customer sees them — same labels as the
// Search category chips.
export function itemCategoryText(cat: string, t: LangStrings): string {
  const map: Record<string, string> = {
    tent: t.browseCatTents, seat: t.browseCatChairs, table: t.browseCatChairs, crockery: t.browseCatCrockery,
    light: t.browseCatLighting, av: t.browseCatSound, decor: t.browseCatDecor, kitchen: t.browseCatKitchen,
    floor: t.browseCatFlooring, stage: t.browseCatStage, staff: t.browseCatStaff,
  };
  return map[cat] || cat;
}
