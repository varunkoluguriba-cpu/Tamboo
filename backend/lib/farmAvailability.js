const FarmHouse = require('../models/FarmHouse');
const FarmBooking = require('../models/FarmBooking');

// Farm-house stays as time intervals (minutes since 1970-01-01, India time), so any two stays
// can be compared the same way: a Full-day stay (11:00 → 10:00 next day) overlaps that date's
// Day and Night slots and the next date's Day slot; a Night stay runs into the next morning.

const SLOTS = ['day', 'night', 'fullDay'];
const ACTIVE = ['confirmed', 'disputed'];
const IST_OFFSET_MIN = 330;

const toMin = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const dayIndex = (ymd) => Math.floor(Date.UTC(...ymd.split('-').map((x, i) => Number(x) - (i === 1 ? 1 : 0))) / 86400000);
const isYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

function slotInterval(slotCfg, date) {
  const s = toMin(slotCfg.start), e = toMin(slotCfg.end);
  if (s == null || e == null) return null;
  const base = dayIndex(date) * 1440;
  return { startMin: base + s, endMin: base + (e <= s ? 1440 + e : e) };
}

// Saturday or Sunday check-in → weekend price.
const isWeekend = (date) => [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay());

function priceFor(farm, slot, date, guests) {
  const cfg = farm.slots[slot];
  const base = isWeekend(date) && cfg.weekendPrice > 0 ? cfg.weekendPrice : cfg.weekdayPrice;
  const extraGuests = Math.max(0, guests - (farm.includedGuests || guests));
  const extra = extraGuests * (farm.extraGuestCharge || 0);
  const total = base + extra;
  const advanceAmount = Math.round((total * (farm.advancePct || 30)) / 100);
  return { basePrice: base, extraGuests, extraGuestCharge: extra, total, advanceAmount, balanceAmount: total - advanceAmount };
}

const nowMinIST = () => Math.floor(Date.now() / 60000) + IST_OFFSET_MIN;

// Full check before taking money (and again right before creating the booking).
async function checkSlot(farmOrId, date, slot, guests, { excludeBookingId } = {}) {
  const farm = farmOrId && farmOrId.slots ? farmOrId : await FarmHouse.findById(farmOrId).lean();
  if (!farm || !farm.published) return { ok: false, reason: 'Farm house not found' };
  if (!SLOTS.includes(slot) || !farm.slots[slot] || !farm.slots[slot].enabled) return { ok: false, reason: 'This stay type is not offered here' };
  if (!isYmd(date)) return { ok: false, reason: 'Pick a valid date' };
  const iv = slotInterval(farm.slots[slot], date);
  if (!iv) return { ok: false, reason: 'This stay type is not set up yet' };
  if (iv.startMin <= nowMinIST()) return { ok: false, reason: 'This date has already passed' };
  if ((farm.blockedDates || []).includes(date)) return { ok: false, reason: 'The owner has closed this date' };
  const g = Math.round(Number(guests) || 0);
  if (g < 1) return { ok: false, reason: 'Enter the number of guests' };
  if (farm.maxGuests && g > farm.maxGuests) return { ok: false, reason: `This farm house allows up to ${farm.maxGuests} guests` };
  const price = priceFor(farm, slot, date, g);
  if (price.total <= 0) return { ok: false, reason: 'The owner has not set a price for this stay yet' };
  const clash = await FarmBooking.exists({
    farm: farm._id, status: { $in: ACTIVE }, startMin: { $lt: iv.endMin }, endMin: { $gt: iv.startMin },
    ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {}),
  });
  if (clash) return { ok: false, reason: 'Already booked for this time — try another date or stay type' };
  return { ok: true, farm, interval: iv, price, guests: g };
}

// Month view for calendars: per date, each offered slot is free / booked / closed / past.
async function monthAvailability(farm, month) {
  const [y, m] = month.split('-').map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dates = Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
  const first = dayIndex(dates[0]) * 1440, last = (dayIndex(dates[days - 1]) + 2) * 1440;
  const bookings = await FarmBooking.find({ farm: farm._id, status: { $in: ACTIVE }, startMin: { $lt: last }, endMin: { $gt: first - 1440 } })
    .select('startMin endMin').lean();
  const now = nowMinIST();
  const blocked = new Set(farm.blockedDates || []);
  const out = {};
  for (const d of dates) {
    out[d] = {};
    for (const s of SLOTS) {
      const cfg = farm.slots[s];
      if (!cfg || !cfg.enabled) continue;
      const iv = slotInterval(cfg, d);
      if (!iv) continue;
      out[d][s] = iv.startMin <= now ? 'past'
        : blocked.has(d) ? 'closed'
          : bookings.some((b) => b.startMin < iv.endMin && b.endMin > iv.startMin) ? 'booked' : 'free';
    }
  }
  return out;
}

module.exports = { SLOTS, ACTIVE, slotInterval, priceFor, checkSlot, monthAvailability, isWeekend, nowMinIST };
