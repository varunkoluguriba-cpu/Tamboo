const mongoose = require('mongoose');

// A farm house listed by a 'farm' partner. Unlike halls (token → visit → rent), farm houses are
// booked and paid online directly, per slot: Day, Night or Full day (24h). Each slot has its own
// times and weekday/weekend price; overlapping stays are blocked by lib/farmAvailability.js.
const slotSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  start: { type: String, default: '09:00' }, // HH:MM check-in
  end: { type: String, default: '18:00' }, // HH:MM check-out (earlier than start = next day)
  weekdayPrice: { type: Number, default: 0 },
  weekendPrice: { type: Number, default: 0 }, // Saturday & Sunday check-ins
}, { _id: false });

const farmHouseSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
  name: { type: String, default: '' },
  about: { type: String, default: '' },
  area: { type: String, default: '' }, // locality, e.g. Moinabad / Shankarpally
  address: { type: String, default: '' }, // shared with the customer only after booking
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  distanceFromCityKm: { type: Number, default: 0 },
  photos: { type: [String], default: [] }, // data URIs, max 15; first is the cover

  slots: {
    day: { type: slotSchema, default: () => ({ enabled: true, start: '09:00', end: '18:00' }) },
    night: { type: slotSchema, default: () => ({ enabled: false, start: '19:00', end: '09:00' }) },
    fullDay: { type: slotSchema, default: () => ({ enabled: false, start: '11:00', end: '10:00' }) },
  },

  // Guests & stay
  maxGuests: { type: Number, default: 0 },
  includedGuests: { type: Number, default: 0 }, // price covers this many; more pay extraGuestCharge each
  extraGuestCharge: { type: Number, default: 0 },
  bedrooms: { type: Number, default: 0 },
  acRooms: { type: Number, default: 0 },
  beds: { type: Number, default: 0 },
  bathrooms: { type: Number, default: 0 },
  lawnSqft: { type: Number, default: 0 },
  parkingCars: { type: Number, default: 0 },

  // Amenities — codes, translated in the apps (see FARM_AMENITIES)
  amenities: { type: [String], default: [] },
  poolDetails: { type: String, default: '' }, // e.g. "30 × 15 ft, 4 ft deep, kids' pool"

  // House rules
  rules: {
    eventsAllowed: { type: Boolean, default: true },
    alcoholAllowed: { type: Boolean, default: false },
    outsideFoodAllowed: { type: Boolean, default: true },
    djAllowed: { type: Boolean, default: false },
    musicTill: { type: String, default: '' }, // HH:MM outdoor music cut-off, '' = no limit given
    petsAllowed: { type: Boolean, default: false },
    smokingOutdoorOnly: { type: Boolean, default: true },
    minAge: { type: Number, default: 18 },
    other: { type: String, default: '' },
  },

  // Money
  securityDeposit: { type: Number, default: 0 }, // refundable, paid to the owner at check-in
  advancePct: { type: Number, default: 30 }, // paid online to confirm; rest at the property
  addons: { type: [{ name: String, price: Number }], default: [] }, // e.g. projector ₹1,000

  blockedDates: { type: [String], default: [] }, // 'YYYY-MM-DD' — owner's own closures
  published: { type: Boolean, default: true },
}, { timestamps: true });

const FARM_AMENITIES = [
  'pool', 'kidsPool', 'lawn', 'garden', 'playArea', 'boxCricket', 'volleyball', 'indoorGames',
  'bonfire', 'barbecue', 'kitchen', 'cook', 'caretaker', 'powerBackup', 'wifi', 'projector',
  'musicSystem', 'ac', 'geyser', 'parking', 'cctv', 'firstAid',
];

farmHouseSchema.statics.AMENITIES = FARM_AMENITIES;
module.exports = mongoose.model('FarmHouse', farmHouseSchema);
