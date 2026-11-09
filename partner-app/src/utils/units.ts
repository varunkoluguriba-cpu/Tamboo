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
