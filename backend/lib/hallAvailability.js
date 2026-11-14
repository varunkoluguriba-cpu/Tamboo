const Hall = require('../models/Hall');
const Booking = require('../models/Booking');

// Statuses that represent a real hold on a slot — matches the "active" set already used
// by routes/halls.js's /my-token endpoint. Anything else (not_booked, cancelled, disputed)
// has released the slot.
const ACTIVE_BOOKING_STATUSES = ['token_paid', 'visited', 'awaiting_advance', 'confirmed'];

// Customers must visit within this many hours of paying the token.
const VISIT_HOURS = 48;

// Bookings that actually hold their slot right now. An unvisited token holds it only during the
// visit window — after that the pre-booking has lapsed (the owner keeps the token) and the date
// is free for other customers again.
function slotHoldFilter(now = Date.now()) {
  return {
    $or: [
      { status: { $in: ['visited', 'awaiting_advance', 'confirmed'] } },
      { status: 'token_paid', createdAt: { $gt: new Date(now - VISIT_HOURS * 3600 * 1000) } },
    ],
  };
}

const tokenExpired = (booking, now = Date.now()) =>
  booking.status === 'token_paid' && now - new Date(booking.createdAt).getTime() > VISIT_HOURS * 3600 * 1000;

// Single date+slot check used right before taking payment and again right before creating
// the booking record, so a slot can never be sold twice — one query each, cheap enough to
// run twice per booking attempt.
async function isSlotTaken(hallId, date, slot) {
  const hall = await Hall.findById(hallId).select('blockedDates').lean();
  if (!hall) return { taken: true, reason: 'Hall not found' };
  if (hall.blockedDates.includes(date)) {
    return { taken: true, reason: 'This date is not available for this hall' };
  }
  const clash = await Booking.exists({
    hallId: String(hallId),
    date,
    slot,
    ...slotHoldFilter(),
  });
  if (clash) return { taken: true, reason: 'This slot was just booked by someone else' };
  return { taken: false, reason: null };
}

// Whole-month view for the customer app's calendar — one Hall read and one Booking query
// covering every day in the month, rather than 30+ round trips.
async function getMonthAvailability(hallId, month) {
  const hall = await Hall.findById(hallId).select('blockedDates').lean();
  if (!hall) return null;

  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const dateStrs = Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);

  const bookings = await Booking.find({
    hallId: String(hallId),
    date: { $in: dateStrs },
    ...slotHoldFilter(),
  }).select('date slot').lean();

  const bookedByDate = {};
  bookings.forEach((b) => {
    if (!bookedByDate[b.date]) bookedByDate[b.date] = new Set();
    bookedByDate[b.date].add(b.slot);
  });

  const blockedSet = new Set(hall.blockedDates || []);
  const result = {};
  dateStrs.forEach((d) => {
    if (blockedSet.has(d)) {
      result[d] = { morning: 'closed', evening: 'closed' };
    } else {
      const slots = bookedByDate[d] || new Set();
      result[d] = {
        morning: slots.has('Morning') ? 'booked' : 'free',
        evening: slots.has('Evening') ? 'booked' : 'free',
      };
    }
  });
  return result;
}

module.exports = { ACTIVE_BOOKING_STATUSES, VISIT_HOURS, slotHoldFilter, tokenExpired, isSlotTaken, getMonthAvailability };
