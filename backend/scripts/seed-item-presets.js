// One-off seed for the ItemPreset catalog — gives the preset checklist a reasonable starting
// point before any real vendor has added items. Run with: node scripts/seed-item-presets.js
require('dotenv').config();
const mongoose = require('mongoose');
const ItemPreset = require('../models/ItemPreset');

const SEED = [
  // tent
  { name: 'Shamiana (20x30 ft)', cat: 'tent', unit: 'per unit / event', specs: 'Standard cloth canopy for small gatherings.' },
  { name: 'Shamiana (40x60 ft)', cat: 'tent', unit: 'per unit / event', specs: 'Large cloth canopy for weddings and big events.' },
  { name: 'German Hangar Tent', cat: 'tent', unit: 'per unit / event', specs: 'Clear-span frame tent, weatherproof.' },
  { name: 'Marquee Tent', cat: 'tent', unit: 'per unit / event', specs: 'Peaked-roof decorative tent.' },
  // seat
  { name: 'Plastic Chair', cat: 'seat', unit: 'per unit / event', specs: 'Standard white plastic banquet chair.' },
  { name: 'Steel Folding Chair', cat: 'seat', unit: 'per unit / event', specs: 'Foldable steel-frame chair.' },
  { name: 'Napoleon Chair', cat: 'seat', unit: 'per unit / event', specs: 'Decorative gold/silver banquet chair.' },
  { name: 'Sofa Chair', cat: 'seat', unit: 'per unit / event', specs: 'Single-seat cushioned sofa chair for stage/lounge.' },
  // table
  { name: 'Round Banquet Table (6 seater)', cat: 'table', unit: 'per unit / event', specs: 'Round table seating up to 6 guests.' },
  { name: 'Round Banquet Table (10 seater)', cat: 'table', unit: 'per unit / event', specs: 'Round table seating up to 10 guests.' },
  { name: 'Rectangular Table', cat: 'table', unit: 'per unit / event', specs: 'Standard rectangular buffet/seating table.' },
  { name: 'Cocktail Table', cat: 'table', unit: 'per unit / event', specs: 'Tall standing table for cocktail-style events.' },
  // kitchen
  { name: 'Commercial LPG Gas Stove', cat: 'kitchen', unit: 'per unit / event', specs: 'Heavy-duty burner for bulk cooking.' },
  { name: 'Cooking Vessels Set', cat: 'kitchen', unit: 'per set / event', specs: 'Large-capacity pots and pans for catering.' },
  { name: 'Water Can / Dispenser', cat: 'kitchen', unit: 'per unit / event', specs: 'Drinking water can with dispenser stand.' },
  // crockery
  { name: 'Serving Spoons Set', cat: 'crockery', unit: 'per set / event', specs: 'Assorted serving spoons for buffet.' },
  { name: 'Water Glasses', cat: 'crockery', unit: 'per unit / event', specs: 'Standard drinking glass.' },
  // floor
  { name: 'Carpet Flooring', cat: 'floor', unit: 'per unit / event', specs: 'Roll-out carpet for tent flooring, per sq ft panel.' },
  { name: 'Wooden Flooring Panels', cat: 'floor', unit: 'per unit / event', specs: 'Raised wooden deck flooring panel.' },
  { name: 'Mattress / Gaddi Seating', cat: 'floor', unit: 'per unit / event', specs: 'Traditional floor-seating mattress with cover.' },
  // stage
  { name: 'Wooden Stage Platform', cat: 'stage', unit: 'per unit / event', specs: 'Raised wooden stage module.' },
  { name: 'Mandap Structure', cat: 'stage', unit: 'per unit / event', specs: 'Decorative wedding mandap frame.' },
  { name: 'Crowd Barricade', cat: 'stage', unit: 'per unit / event', specs: 'Metal barricade for crowd/queue control.' },
  // light
  { name: 'LED Par Light', cat: 'light', unit: 'per unit / event', specs: 'Stage/decor LED wash light.' },
  { name: 'Decorative String Lights', cat: 'light', unit: 'per set / event', specs: 'Warm-white fairy lights for decor.' },
  { name: 'Diesel Generator', cat: 'light', unit: 'per unit / event', specs: 'Backup power generator, specify kVA.' },
  { name: 'Chandelier', cat: 'light', unit: 'per unit / event', specs: 'Decorative hanging chandelier light.' },
  // decor
  { name: 'Flower Decoration (Basic)', cat: 'decor', unit: 'per event', specs: 'Entrance/stage flower decoration package.' },
  { name: 'Backdrop Curtain', cat: 'decor', unit: 'per unit / event', specs: 'Stage or photo-booth backdrop drape.' },
  { name: 'Balloon Decoration', cat: 'decor', unit: 'per event', specs: 'Balloon arch/decoration package.' },
  // av
  { name: 'PA Sound System', cat: 'av', unit: 'per unit / event', specs: 'Speaker and amplifier setup for announcements/music.' },
  { name: 'DJ Setup', cat: 'av', unit: 'per event', specs: 'DJ console, speakers and lighting package.' },
  { name: 'Projector & Screen', cat: 'av', unit: 'per unit / event', specs: 'Projector with screen for presentations/visuals.' },
  { name: 'Wireless Microphone', cat: 'av', unit: 'per unit / event', specs: 'Handheld or collar wireless mic.' },
  // staff
  { name: 'Waiter Service', cat: 'staff', unit: 'per unit / event', specs: 'Per-staff waiter/serving help for the event.' },
  { name: 'Setup & Dismantling Crew', cat: 'staff', unit: 'per event', specs: 'Labour team for tent/furniture setup and pickup.' },

  // --- Batch 2: sourced from a real Hyderabad tent house's cash bill + handwritten
  // inventory list, 2026-10-14. Telugu item names kept as given by the vendor.
  { name: 'Iron Table', cat: 'table', unit: 'per unit / event', specs: 'Sturdy iron-frame table for catering or decor use.' },
  { name: 'Hot Dishes (Copper)', cat: 'crockery', unit: 'per unit / event', specs: 'Copper hot-case serving dish for hot food.' },
  { name: 'Plates (100 Nos.)', cat: 'crockery', unit: 'per set / event', specs: 'Steel dinner plates, bundle of 100.' },
  { name: 'Curry Bowls', cat: 'crockery', unit: 'per unit / event', specs: 'Small bowl for serving curry or side dishes.' },
  { name: 'Sweet Bowls (100 Nos.)', cat: 'crockery', unit: 'per set / event', specs: 'Small bowl for serving sweets, bundle of 100.' },
  { name: 'Dinner Spoons (100 Nos.)', cat: 'crockery', unit: 'per set / event', specs: 'Dinner spoon, bundle of 100.' },
  { name: 'Carpets Each', cat: 'floor', unit: 'per unit / event', specs: 'Floor carpet, priced per piece.' },
  { name: 'Coffee Flask', cat: 'kitchen', unit: 'per unit / event', specs: 'Insulated flask for serving coffee or tea.' },
  { name: 'Maharaja Chairs (Brass)', cat: 'seat', unit: 'per unit / event', specs: 'Ornate brass-finish throne-style chair for stage or VIP seating.' },
  { name: 'Quarter Plates (100 Nos.)', cat: 'crockery', unit: 'per set / event', specs: 'Small quarter-size plate, bundle of 100.' },
  { name: 'Green Carpet', cat: 'floor', unit: 'per unit / event', specs: 'Green floor carpet runner.' },
  { name: 'Frill', cat: 'decor', unit: 'per unit / event', specs: 'Decorative frill trim for stage or tent edges.' },
  { name: 'White Cloth', cat: 'decor', unit: 'per unit / event', specs: 'Plain white cloth drape for tables or tents.' },
  { name: 'Banquet Chairs', cat: 'seat', unit: 'per unit / event', specs: 'Standard banquet chair for guest seating.' },
  { name: 'Cot', cat: 'decor', unit: 'per unit / event', specs: 'Wooden or metal cot provided for the event.' },
  { name: 'Steel Tub', cat: 'kitchen', unit: 'per unit / event', specs: 'Large steel tub or basin for bulk food prep or storage.' },
  { name: 'Chowkey (1 ft)', cat: 'stage', unit: 'per unit / event', specs: '4-legged wooden stand used as a stage support, 1 ft height.' },
  { name: 'Chowkey (2.5 ft)', cat: 'stage', unit: 'per unit / event', specs: '4-legged wooden stand used as a stage support, 2.5 ft height.' },
  { name: 'Chowkey Cloth', cat: 'decor', unit: 'per unit / event', specs: 'Cloth cover for a chowkey stage stand.' },
  { name: 'Canopy', cat: 'tent', unit: 'per unit / event', specs: 'Decorative canopy covering.' },
  { name: 'Sofa', cat: 'seat', unit: 'per unit / event', specs: 'Cushioned sofa seating.' },
  { name: 'Side Wall', cat: 'tent', unit: 'per unit / event', specs: 'Side wall panel for tent enclosure.' },
  { name: 'Deewan Sofa', cat: 'seat', unit: 'per unit / event', specs: 'Diwan-style long sofa seating.' },

  { name: 'Pelli Peeta', cat: 'decor', unit: 'per unit / event', specs: 'Ceremonial wedding stool/platform for the bride and groom.' },
  { name: 'Vidi Peetalu', cat: 'decor', unit: 'per unit / event', specs: 'Extra ceremonial peetas used alongside the main Pelli Peeta.' },
  { name: 'Homa Gundam', cat: 'decor', unit: 'per unit / event', specs: 'Havan/homam fire-pit vessel for ritual ceremonies.' },
  { name: 'Pavu Kollu', cat: 'decor', unit: 'per unit / event', specs: 'Wooden sandals worn by the groom during the wedding ceremony.' },
  { name: 'Boganalu', cat: 'kitchen', unit: 'per unit / event', specs: 'Large cooking/serving vessel used for bulk catering.' },
  { name: 'Lagaan', cat: 'kitchen', unit: 'per unit / event', specs: 'Cooking utensil used for bulk catering.' },
  { name: 'Deksha', cat: 'kitchen', unit: 'per unit / event', specs: 'Cooking utensil used for bulk catering.' },
  { name: 'Steel Drum', cat: 'kitchen', unit: 'per unit / event', specs: 'Large steel storage drum for bulk supplies.' },
  { name: 'Idli Pathra', cat: 'kitchen', unit: 'per unit / event', specs: 'Idli steamer plate/vessel.' },
  { name: 'Sweet Kisthilu', cat: 'crockery', unit: 'per unit / event', specs: 'Container used for serving sweets.' },
  { name: 'Kadai', cat: 'kitchen', unit: 'per unit / event', specs: 'Large wok/deep frying pan for bulk cooking.' },
  { name: 'Jilebi Kadai', cat: 'kitchen', unit: 'per unit / event', specs: 'Specialised kadai/pan used for making jalebi.' },
  { name: 'Dosa Penam', cat: 'kitchen', unit: 'per unit / event', specs: 'Flat griddle/tawa used for making dosa.' },
  { name: 'Besan (Serving Dish)', cat: 'crockery', unit: 'per unit / event', specs: 'Serving dish used for food service.' },
  { name: 'Round Spoons', cat: 'crockery', unit: 'per set / event', specs: 'Round-head serving spoons.' },
  { name: 'Curry Spoons', cat: 'crockery', unit: 'per set / event', specs: 'Spoons used for serving curry.' },
  { name: 'Buckets', cat: 'kitchen', unit: 'per unit / event', specs: 'Bucket used for water or bulk storage.' },
  { name: 'Belan', cat: 'kitchen', unit: 'per unit / event', specs: 'Rolling pin for bulk dough preparation.' },
  { name: 'Jugs', cat: 'crockery', unit: 'per unit / event', specs: 'Jug used for serving water or beverages.' },
  { name: 'Silver Muthalu', cat: 'crockery', unit: 'per unit / event', specs: 'Silver lids used to cover large serving vessels.' },
  { name: 'Cutting Peetalu', cat: 'kitchen', unit: 'per unit / event', specs: 'Low wooden stool/board used as a cutting surface for bulk food prep.' },
  { name: 'Kurpi', cat: 'kitchen', unit: 'per unit / event', specs: 'Flat-bladed scraper tool used for bulk cooking.' },
  { name: 'Serving Trays', cat: 'crockery', unit: 'per unit / event', specs: 'Tray used for serving food.' },
  { name: 'Jaaralu', cat: 'kitchen', unit: 'per unit / event', specs: 'Long-handled mesh skimmer/strainer ladle used for deep-frying.' },
  { name: 'Grinder', cat: 'kitchen', unit: 'per unit / event', specs: 'Grinder used for bulk food preparation.' },
  { name: 'Rollu & Rokkalu', cat: 'kitchen', unit: 'per set / event', specs: 'Traditional stone mortar and pestle set.' },
  { name: 'Kabgir', cat: 'kitchen', unit: 'per unit / event', specs: 'Long-handled flat scraper/spatula used for stirring large cooking vessels.' },
  { name: 'Table (4 ft)', cat: 'table', unit: 'per unit / event', specs: 'Utility table, 4 ft size.' },
  { name: 'Table (6 ft)', cat: 'table', unit: 'per unit / event', specs: 'Utility table, 6 ft size.' },

  { name: 'Shamiana (9x18 ft)', cat: 'tent', unit: 'per unit / event', specs: 'Cloth canopy tent, 9x18 ft.' },
  { name: 'Shamiana (12x24 ft)', cat: 'tent', unit: 'per unit / event', specs: 'Cloth canopy tent, 12x24 ft.' },
  { name: 'Shamiana (18x36 ft)', cat: 'tent', unit: 'per unit / event', specs: 'Cloth canopy tent, 18x36 ft.' },
  { name: 'Shamiana (12x36 ft)', cat: 'tent', unit: 'per unit / event', specs: 'Cloth canopy tent, 12x36 ft.' },
  { name: 'Center Pole Tent (36x36 ft)', cat: 'tent', unit: 'per unit / event', specs: 'Large center-pole tent, 36x36 ft.' },
  { name: 'Center Pole Tent (54x54 ft)', cat: 'tent', unit: 'per unit / event', specs: 'Large center-pole tent, 54x54 ft.' },
  { name: 'Side Frames', cat: 'tent', unit: 'per unit / event', specs: 'Structural side framing used to set up tent walls.' },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  let created = 0;
  for (const item of SEED) {
    const normalizedName = ItemPreset.normalize(item.name);
    const res = await ItemPreset.findOneAndUpdate(
      { normalizedName },
      { $setOnInsert: { ...item, normalizedName, usageCount: 1 } },
      { upsert: true, new: false },
    );
    if (!res) created += 1;
  }
  console.log(`Seeded ${created} new presets (${SEED.length} total in seed list).`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
