// Mirrors partner-app/src/data/catalog.ts's CATEGORY_OPTIONS/UNIT_OPTIONS so the AI photo
// classifier (server-side) and the manual item form (client-side) always agree on the same
// taxonomy. Keep these two lists in sync if either changes.
const CATEGORY_IDS = [
  { id: 'tent', name: 'Tent & Structures' },
  { id: 'seat', name: 'Seating' },
  { id: 'table', name: 'Tables' },
  { id: 'kitchen', name: 'Kitchen & Utensils' },
  { id: 'crockery', name: 'Crockery & Serving' },
  { id: 'floor', name: 'Flooring & Comfort' },
  { id: 'stage', name: 'Stage & Infrastructure' },
  { id: 'light', name: 'Lighting & Electrical' },
  { id: 'decor', name: 'Decor' },
  { id: 'av', name: 'Sound & AV' },
  { id: 'staff', name: 'Staff & Services' },
];

const UNIT_OPTIONS = ['per unit / day', 'per unit / event', 'per event', 'per set / event'];

module.exports = { CATEGORY_IDS, UNIT_OPTIONS };
