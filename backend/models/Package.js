const mongoose = require('mongoose');

// A named bundle of one tent house's own items. Priced by summing the items at their
// normal rates, so adding a package to the cart always matches the package total.
const packageSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  items: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    qty: { type: Number, required: true, min: 1 },
    _id: false,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);
