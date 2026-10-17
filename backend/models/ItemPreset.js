const mongoose = require('mongoose');

// A shared, growing catalog of known rental items, built up from what real vendors add.
// Every time any tent-house partner saves an item, we upsert it here — so the preset
// checklist and the text/photo classifiers both get smarter as more vendors onboard,
// instead of staying frozen at whatever list we seeded on day one.
const itemPresetSchema = new mongoose.Schema({
  normalizedName: { type: String, required: true, unique: true, index: true }, // lowercase, trimmed — the match key
  name: { type: String, required: true },
  cat: { type: String, required: true },
  unit: { type: String, required: true },
  specs: { type: String, default: '' },
  usageCount: { type: Number, default: 1 },
}, { timestamps: true });

function normalize(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

itemPresetSchema.statics.normalize = normalize;

// Records that a vendor used this item (whether picked from the list, typed, or photographed),
// creating the preset if it's new or bumping its popularity if it already exists.
itemPresetSchema.statics.learnFrom = async function learnFrom({ name, cat, unit, specs }) {
  if (!name || !cat || !unit) return;
  const normalizedName = normalize(name);
  if (!normalizedName) return;
  await this.findOneAndUpdate(
    { normalizedName },
    { $setOnInsert: { name: name.trim(), cat, unit, specs: specs || '' }, $inc: { usageCount: 1 } },
    { upsert: true },
  );
};

module.exports = mongoose.model('ItemPreset', itemPresetSchema);
