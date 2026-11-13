import type { LangStrings } from '../i18n';

// Farm-house shapes from /api/farms (public) and /api/farms/bookings/me, plus display helpers.
export type SlotKey = 'day' | 'night' | 'fullDay';
export const SLOT_KEYS: SlotKey[] = ['day', 'night', 'fullDay'];
export type FarmSlot = { enabled: boolean; start: string; end: string; weekdayPrice: number; weekendPrice: number };
export type Farm = {
  id: string; name: string; about: string; area: string; distanceFromCityKm: number; km: number | null; photos: string[];
  slots: Record<SlotKey, FarmSlot>; maxGuests: number; includedGuests: number; extraGuestCharge: number;
  bedrooms: number; acRooms: number; beds: number; bathrooms: number; lawnSqft: number; parkingCars: number;
  amenities: string[]; poolDetails: string;
  rules: { eventsAllowed: boolean; alcoholAllowed: boolean; outsideFoodAllowed: boolean; djAllowed: boolean; petsAllowed: boolean; smokingOutdoorOnly: boolean; musicTill: string; minAge: number; other: string };
  securityDeposit: number; advancePct: number; addons: Array<{ name: string; price: number }>; fromPrice: number | null;
};
export type FarmQuote = {
  basePrice: number; extraGuests: number; extraGuestCharge: number; total: number; advanceAmount: number; balanceAmount: number;
  checkIn: string; checkOut: string; securityDeposit: number; advancePct: number;
};
export type MyFarmBooking = {
  id: string; code: string; farmId: string; farmName: string; date: string; slot: SlotKey; checkIn: string; checkOut: string;
  guests: number; occasion: string; basePrice: number; extraGuests: number; extraGuestCharge: number; total: number;
  advanceAmount: number; balanceAmount: number; securityDeposit: number; status: 'confirmed' | 'completed' | 'cancelled' | 'disputed';
  cancelledBy: '' | 'customer' | 'owner' | 'admin'; refundStatus: 'none' | 'pending' | 'refunded'; refundAmount: number; refundPctNow: number;
  address: string; lat: number | null; lng: number | null; ownerPhone: string; createdAt: string;
};

export const AMENITY_KEYS: Record<string, keyof LangStrings> = {
  pool: 'cfAmPool', kidsPool: 'cfAmKidsPool', lawn: 'cfAmLawn', garden: 'cfAmGarden', playArea: 'cfAmPlayArea', boxCricket: 'cfAmBoxCricket',
  volleyball: 'cfAmVolleyball', indoorGames: 'cfAmIndoorGames', bonfire: 'cfAmBonfire', barbecue: 'cfAmBarbecue', kitchen: 'cfAmKitchen',
  cook: 'cfAmCook', caretaker: 'cfAmCaretaker', powerBackup: 'cfAmPowerBackup', wifi: 'cfAmWifi', projector: 'cfAmProjector',
  musicSystem: 'cfAmMusicSystem', ac: 'cfAmAc', geyser: 'cfAmGeyser', parking: 'cfAmParking', cctv: 'cfAmCctv', firstAid: 'cfAmFirstAid',
};

export const slotLabel = (s: SlotKey, t: LangStrings) => ({ day: t.cfSlotDay, night: t.cfSlotNight, fullDay: t.cfSlotFullDay })[s];
export const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

// 'HH:MM' (24 h) → '9:30 AM', isolated left-to-right so it never reads 'AM 9:30' in Urdu.
export function time12(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  if (!m) return hhmm || '';
  const h = Number(m[1]);
  return `⁦${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}⁩`;
}
// '9:00 AM – 6:00 PM' as one left-to-right unit, so Urdu never swaps the two ends.
export const timeRange = (start: string, end: string) => `\u2066${time12(start).replace(/[\u2066\u2069]/g, '')} – ${time12(end).replace(/[\u2066\u2069]/g, '')}\u2069`;
const toMin = (hhmm: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : 0; };
export const endsNextDay = (start: string, end: string) => toMin(end) <= toMin(start);

// '2026-12-05' → '5 December 2026' in the customer's language.
export function farmDate(ymd: string, t: LangStrings): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || '');
  if (!m) return ymd;
  return `${Number(m[3])} ${t.cfMonths.split(',')[Number(m[2]) - 1] || m[2]} ${m[1]}`;
}
