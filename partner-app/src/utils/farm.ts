import type { LangStrings } from '../i18n';

// Farm-house shapes from /api/farms/me/* and the labels the partner sees for them.
export type SlotKey = 'day' | 'night' | 'fullDay';
export const SLOT_KEYS: SlotKey[] = ['day', 'night', 'fullDay'];
export type FarmSlot = { enabled: boolean; start: string; end: string; weekdayPrice: number; weekendPrice: number };
export type FarmRules = {
  eventsAllowed: boolean; alcoholAllowed: boolean; outsideFoodAllowed: boolean; djAllowed: boolean;
  petsAllowed: boolean; smokingOutdoorOnly: boolean; musicTill: string; minAge: number; other: string;
};
export type MyFarm = {
  id: string; name: string; about: string; area: string; address: string; lat: number | null; lng: number | null;
  distanceFromCityKm: number; photos: string[]; slots: Record<SlotKey, FarmSlot>;
  maxGuests: number; includedGuests: number; extraGuestCharge: number; bedrooms: number; acRooms: number; beds: number;
  bathrooms: number; lawnSqft: number; parkingCars: number; amenities: string[]; poolDetails: string; rules: FarmRules;
  securityDeposit: number; advancePct: number; addons: Array<{ name: string; price: number }>; blockedDates: string[];
  published: boolean; fromPrice: number | null;
};
export type FarmBookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'disputed';
export type OwnerFarmBooking = {
  id: string; code: string; farmId: string; farmName: string; customerName: string; customerPhone: string;
  date: string; slot: SlotKey; checkIn: string; checkOut: string; guests: number; occasion: string;
  total: number; advanceAmount: number; balanceAmount: number; securityDeposit: number; commissionPct: number;
  youReceiveOnline: number; status: FarmBookingStatus; cancelledBy: '' | 'customer' | 'owner' | 'admin'; startMin: number; createdAt: string;
};

// Same order as the server's FarmHouse.AMENITIES.
export const AMENITIES: Array<{ code: string; key: keyof LangStrings }> = [
  { code: 'pool', key: 'pfAmPool' }, { code: 'kidsPool', key: 'pfAmKidsPool' }, { code: 'lawn', key: 'pfAmLawn' },
  { code: 'garden', key: 'pfAmGarden' }, { code: 'playArea', key: 'pfAmPlayArea' }, { code: 'boxCricket', key: 'pfAmBoxCricket' },
  { code: 'volleyball', key: 'pfAmVolleyball' }, { code: 'indoorGames', key: 'pfAmIndoorGames' }, { code: 'bonfire', key: 'pfAmBonfire' },
  { code: 'barbecue', key: 'pfAmBarbecue' }, { code: 'kitchen', key: 'pfAmKitchen' }, { code: 'cook', key: 'pfAmCook' },
  { code: 'caretaker', key: 'pfAmCaretaker' }, { code: 'powerBackup', key: 'pfAmPowerBackup' }, { code: 'wifi', key: 'pfAmWifi' },
  { code: 'projector', key: 'pfAmProjector' }, { code: 'musicSystem', key: 'pfAmMusicSystem' }, { code: 'ac', key: 'pfAmAc' },
  { code: 'geyser', key: 'pfAmGeyser' }, { code: 'parking', key: 'pfAmParking' }, { code: 'cctv', key: 'pfAmCctv' },
  { code: 'firstAid', key: 'pfAmFirstAid' },
];

export const slotLabel = (s: SlotKey, t: LangStrings) => ({ day: t.pfSlotDay, night: t.pfSlotNight, fullDay: t.pfSlotFullDay })[s];

// 'HH:MM' (24 h) → '9:30 AM', in a left-to-right isolate so it never shows as 'AM 9:30' in Urdu.
export function time12(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  if (!m) return hhmm || '';
  const h = Number(m[1]);
  return `\u2066${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}\u2069`;
}

// Occasions are stored in English (the customer picks from chips); show them in the owner's language.
export function occasionText(o: string, t: LangStrings): string {
  return ({ Wedding: t.psOccWedding, Reception: t.psOccReception, Birthday: t.psOccBirthday, 'House party': t.psOccHouseParty, Corporate: t.psOccCorporate } as Record<string, string>)[o] || o;
}
export const toMin = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};
export const fromMin = (min: number) => {
  const v = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
};
// Check-out at or before check-in means the next day.
export const endsNextDay = (s: FarmSlot) => toMin(s.end) <= toMin(s.start);

// '2026-12-05' → '5 December 2026' in the partner's language.
export function farmDate(ymd: string, t: LangStrings): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || '');
  if (!m) return ymd;
  const months = t.pfMonths.split(',');
  return `${Number(m[3])} ${months[Number(m[2]) - 1] || m[2]} ${m[1]}`;
}

// Minutes since 1970 in India time — compares with a booking's startMin.
export const nowMinIST = () => Math.floor(Date.now() / 60000) + 330;
