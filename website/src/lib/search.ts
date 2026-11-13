// What the customer typed in the home search box (date as YYYY-MM-DD, guests), kept for this
// browser tab so hall / farm-house pages open with the same date and guest count filled in.
const KEY = 'tamboo-web-search';
export type Search = { date: string; guests: string };
export function getSearch(): Search {
  try { return { date: '', guests: '', ...JSON.parse(sessionStorage.getItem(KEY) || '{}') }; } catch { return { date: '', guests: '' }; }
}
export function setSearch(s: Partial<Search>) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ ...getSearch(), ...s })); } catch { /* ignore */ }
}
