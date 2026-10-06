// Demo listings for testing the apps end to end. Every record it creates has a firebaseUid
// starting with "demo-", so removal only ever touches these.
//   node scripts/demo-data.js seed     — (re)creates the demo halls, tent houses, items, packages
//   node scripts/demo-data.js remove   — deletes every demo record
require('dotenv').config();
const mongoose = require('mongoose');
const Partner = require('../models/Partner');
const Hall = require('../models/Hall');
const Shop = require('../models/Shop');
const Item = require('../models/Item');
const Package = require('../models/Package');

const PER_EVENT = 'per event';
const PER_UNIT_EVENT = 'per unit / event';
const PER_SET_EVENT = 'per set / event';

const VENUES = [
  {
    key: 'hotel', businessName: 'Hotel Kohinoor Grand', ownerName: 'Rahul Mehta', area: 'Banjara Hills', phone: '+919000000011',
    halls: [
      {
        name: 'Crystal Ballroom', venueType: 'Hotel', address: 'Road No. 12, Banjara Hills, Hyderabad', seated: 350, floating: 500, sqft: 9000, parking: 120, rooms: 60,
        pricingMode: 'rent', rent: 85000, token: 5000, advancePct: 25, ac: true, crockery: true, kitchen: true,
        crockeryNote: 'Full crockery for up to 500 guests', catering: 'In-house catering only',
        amenities: 'Valet parking, Stage, Generator backup, Bridal room', blurb: 'The hotel’s flagship ballroom — a favourite for weddings and receptions.',
      },
      {
        name: 'Sapphire Terrace Hall', venueType: 'Hotel', address: 'Road No. 12, Banjara Hills, Hyderabad', seated: 150, floating: 220, sqft: 3500, parking: 60, rooms: 60,
        pricingMode: 'perPlate', platePrice: 650, minPlates: 150, rent: 0, token: 3000, advancePct: 25, ac: true, crockery: true, kitchen: true,
        crockeryNote: 'Crockery included with catering', catering: 'Both allowed',
        amenities: 'Rooftop view, Live counters', blurb: 'An intimate terrace hall — good for engagements and birthdays.',
      },
    ],
    shop: null,
  },
  {
    key: 'function', businessName: 'Sri Sai Function Hall', ownerName: 'Venkat Reddy', area: 'Kukatpally', phone: '+919000000012',
    halls: [
      {
        name: 'Sai Function Hall', venueType: 'Function Hall', address: 'Kukatpally Housing Board, Hyderabad', seated: 400, floating: 600, sqft: 7000, parking: 150, rooms: 0,
        pricingMode: 'rent', rent: 60000, token: 4000, advancePct: 25, ac: true, crockery: false, kitchen: true,
        crockeryNote: '', catering: 'Outside caterers allowed',
        amenities: 'Large parking, Power backup, Mandap space', blurb: 'Spacious function hall with a big parking area — popular for weddings.',
      },
      {
        name: 'Sai Mini Hall', venueType: 'Function Hall', address: 'Kukatpally Housing Board, Hyderabad', seated: 120, floating: 150, sqft: 2000, parking: 40, rooms: 0,
        pricingMode: 'rent', rent: 25000, token: 2000, advancePct: 25, ac: true, crockery: false, kitchen: false,
        crockeryNote: '', catering: 'Outside caterers allowed',
        amenities: 'AC, Parking', blurb: 'A compact hall for family functions and small receptions.',
      },
    ],
    shop: null,
  },
  {
    key: 'banquet', businessName: 'Royal Banquet Hall', ownerName: 'Imran Qureshi', area: 'Charminar', phone: '+919000000013',
    halls: [
      {
        name: 'Royal Banquet Hall', venueType: 'Banquet Hall', address: 'Charminar Road, Hyderabad', seated: 500, floating: 800, sqft: 10000, parking: 100, rooms: 0,
        pricingMode: 'rent', rent: 70000, token: 5000, advancePct: 25, ac: true, crockery: true, kitchen: true,
        crockeryNote: 'Crockery available on request', catering: 'Both allowed',
        amenities: 'Grand stage, Dining hall, Bridal room, Generator', blurb: 'A classic banquet with a grand stage — ideal for big weddings.',
      },
    ],
    shop: null,
  },
];

const TENTS = [
  {
    key: 'sai-tent', businessName: 'Sai Tent House', ownerName: 'Srinivas', area: 'Secunderabad', phone: '+919000000021',
    shop: { blurb: 'Shamiana, seating, tables and lighting for weddings and functions.', areas: 'Secunderabad, Kukatpally, Ameerpet' },
    items: [
      { key: 'shamiana', name: 'Premium Shamiana (40×60 ft)', cat: 'tent', price: 8500, unit: PER_UNIT_EVENT, stock: 6, min: 1, deposit: 2000, specs: 'Waterproof canopy, decorative fall ceiling, side walls included.' },
      { key: 'chairs', name: 'Banquet Chairs, Steel Padded', cat: 'seat', price: 25, unit: PER_UNIT_EVENT, stock: 400, min: 20, deposit: 50, specs: 'Padded steel chairs with cushion seat.' },
      { key: 'tables', name: 'Round Banquet Tables (6 seater)', cat: 'table', price: 150, unit: PER_UNIT_EVENT, stock: 60, min: 5, deposit: 200, specs: 'Round tables with cloth covers.' },
      { key: 'lights', name: 'LED Tent Lighting Set', cat: 'light', price: 3500, unit: PER_SET_EVENT, stock: 4, min: 1, deposit: 1000, specs: 'LED string and flood lights for the whole tent.' },
    ],
    packages: [{ name: 'Wedding Essentials', description: 'Shamiana, seating for 200, 30 tables and lighting — the full wedding tent setup.', lines: [['shamiana', 1], ['chairs', 200], ['tables', 30], ['lights', 1]] }],
  },
  {
    key: 'balaji-decor', businessName: 'Balaji Decorators', ownerName: 'Ravi Kumar', area: 'LB Nagar', phone: '+919000000022',
    shop: { blurb: 'Stage, mandap and entrance décor, designed to your theme.', areas: 'LB Nagar, Dilsukhnagar, Malakpet' },
    items: [
      { key: 'backdrop', name: 'Floral Stage Backdrop', cat: 'decor', price: 6000, unit: PER_EVENT, stock: 3, min: 1, deposit: 1500, specs: 'Fresh-look floral backdrop for the main stage.' },
      { key: 'arch', name: 'Entrance Arch Décor', cat: 'decor', price: 2500, unit: PER_EVENT, stock: 5, min: 1, deposit: 500, specs: 'Decorated entrance arch with lights.' },
      { key: 'mandap', name: 'Traditional Mandap Décor', cat: 'decor', price: 12000, unit: PER_EVENT, stock: 2, min: 1, deposit: 3000, specs: 'Traditional mandap décor with drapes and flowers.' },
    ],
    packages: [{ name: 'Stage & Mandap Décor', description: 'Stage backdrop, two entrance arches and a traditional mandap.', lines: [['backdrop', 1], ['arch', 2], ['mandap', 1]] }],
  },
  {
    key: 'sound-light', businessName: 'Hyderabad Sound & Light', ownerName: 'Faisal Ahmed', area: 'Mehdipatnam', phone: '+919000000023',
    shop: { blurb: 'DJ sound, wireless mics and stage lighting for parties and events.', areas: 'Mehdipatnam, Tolichowki, Banjara Hills' },
    items: [
      { key: 'dj', name: 'DJ Sound System (5 kW)', cat: 'av', price: 7000, unit: PER_EVENT, stock: 2, min: 1, deposit: 3000, specs: 'Full DJ sound system with two speakers, mixer and stands.' },
      { key: 'mic', name: 'Wireless Mic Set', cat: 'av', price: 800, unit: PER_EVENT, stock: 6, min: 1, deposit: 500, specs: 'Two wireless handheld mics with receiver.' },
      { key: 'par', name: 'Stage Lighting Par Cans (set of 8)', cat: 'light', price: 2000, unit: PER_SET_EVENT, stock: 4, min: 1, deposit: 800, specs: 'Eight colour par lights with DMX controller.' },
    ],
    packages: [{ name: 'DJ Night Kit', description: 'DJ sound system, two wireless mics and a stage lighting set.', lines: [['dj', 1], ['mic', 2], ['par', 1]] }],
  },
  {
    key: 'annapurna', businessName: 'Annapurna Catering Vessels', ownerName: 'Lakshmi', area: 'Dilsukhnagar', phone: '+919000000024',
    shop: { blurb: 'Cooking vessels, chafing dishes and serving sets for home and hall events.', areas: 'Dilsukhnagar, LB Nagar, Kothapet' },
    items: [
      { key: 'combo', name: 'Deksha & Bogana Combo (100 pax)', cat: 'kitchen', price: 3200, unit: PER_EVENT, stock: 10, min: 1, deposit: 1500, specs: 'Full cooking vessel set for up to 100 guests.' },
      { key: 'chafing', name: 'Chafing Dish Set (6 pcs)', cat: 'crockery', price: 900, unit: PER_SET_EVENT, stock: 12, min: 1, deposit: 300, specs: 'Six chafing dishes with fuel holders.' },
      { key: 'platters', name: 'Serving Platters Set (50 pcs)', cat: 'crockery', price: 1200, unit: PER_SET_EVENT, stock: 8, min: 1, deposit: 400, specs: 'Stainless steel serving platters and bowls.' },
    ],
    packages: [{ name: 'Birthday Starter', description: 'Cooking combo for 100 guests, two chafing sets and a platter set.', lines: [['combo', 1], ['chafing', 2], ['platters', 1]] }],
  },
];

const DEMO_PREFIX = 'demo-';

async function remove() {
  const partners = await Partner.find({ firebaseUid: { $regex: `^${DEMO_PREFIX}` } });
  const ids = partners.map((p) => p._id);
  await Package.deleteMany({ partner: { $in: ids } });
  await Item.deleteMany({ partner: { $in: ids } });
  await Shop.deleteMany({ partner: { $in: ids } });
  await Hall.deleteMany({ partner: { $in: ids } });
  await Partner.deleteMany({ _id: { $in: ids } });
  return partners.length;
}

async function makePartner(p, uidKey, role) {
  return Partner.create({
    firebaseUid: `${DEMO_PREFIX}${uidKey}`, phone: p.phone, authMethod: 'phone', role,
    businessName: p.businessName, ownerName: p.ownerName, city: 'Hyderabad', area: p.area,
    verificationStatus: 'verified', registered: true,
  });
}

async function seed() {
  const removed = await remove();
  if (removed) console.log(`Cleared ${removed} previous demo partners`);

  for (const v of VENUES) {
    const partner = await makePartner(v, `venue-${v.key}`, 'venue');
    for (const h of v.halls) {
      await Hall.create({ ...h, partner: partner.id, photos: [] });
    }
    console.log(`Venue: ${v.businessName} — ${v.halls.length} hall(s)`);
  }

  for (const tent of TENTS) {
    const partner = await makePartner(tent, `tent-${tent.key}`, 'tent');
    await Shop.create({ partner: partner.id, ...tent.shop, hours: '9 AM – 9 PM' });
    const byKey = {};
    for (const it of tent.items) {
      const { key, ...fields } = it;
      byKey[key] = await Item.create({ ...fields, partner: partner.id, instant: true, paused: false, photos: [] });
    }
    for (const pkg of tent.packages) {
      await Package.create({
        partner: partner.id, name: pkg.name, description: pkg.description,
        items: pkg.lines.map(([key, qty]) => ({ item: byKey[key].id, qty })),
      });
    }
    console.log(`Tent house: ${tent.businessName} — ${tent.items.length} items, ${tent.packages.length} package(s)`);
  }
}

(async () => {
  const cmd = process.argv[2];
  if (!['seed', 'remove'].includes(cmd)) {
    console.error('Usage: node scripts/demo-data.js seed | remove');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  if (cmd === 'seed') await seed();
  else console.log(`Removed ${await remove()} demo partners and all their records`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
