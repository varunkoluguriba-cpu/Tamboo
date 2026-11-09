const mongoose = require('mongoose');

// Singleton document — platform-wide fees, editable from the admin panel instead of being
// hardcoded. Existing Order/Booking/Hall documents keep whatever % they were created with
// (snapshotted at creation time, same pattern as Hall.advancePct already used) — changing
// this only affects new orders/bookings/halls created after the change.
const SINGLETON_ID = 'platform-config';

const configSchema = new mongoose.Schema({
  _id: { type: String, default: SINGLETON_ID },
  commissionPct: { type: Number, default: 10 }, // Tamboo's cut — new rental orders and hall tokens default to this
  defaultAdvancePct: { type: Number, default: 25 }, // new halls default to this; each hall owner can still override their own
  // Event services (priest / catering / decor / music). 'off' = hidden everywhere; 'beta' = only
  // the phone numbers in serviceTesterPhones see it (so it can be tested on the live server
  // without real users seeing it); 'on' = everyone.
  servicesMode: { type: String, enum: ['off', 'beta', 'on'], default: 'off' },
  serviceTesterPhones: { type: [String], default: [] }, // E.164
  serviceFreeQuotes: { type: Number, default: 2 }, // quote requests a customer gets free before paying
  serviceQuoteFees: { // ₹ per paid quote request, by category
    priest: { type: Number, default: 49 },
    music: { type: Number, default: 69 },
    decor: { type: Number, default: 79 },
    catering: { type: Number, default: 89 },
  },
}, { timestamps: true });

configSchema.statics.SINGLETON_ID = SINGLETON_ID;
configSchema.statics.get = async function get() {
  return (await this.findById(SINGLETON_ID)) || this.create({ _id: SINGLETON_ID });
};

module.exports = mongoose.model('Config', configSchema);
