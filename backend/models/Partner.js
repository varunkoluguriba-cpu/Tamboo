const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  // Not required: a Google-signed-up partner has no phone until they add one. Sparse so
  // multiple such partners don't collide on a shared empty value.
  phone: { type: String, unique: true, sparse: true }, // E.164
  firebaseUid: { type: String, required: true, unique: true },
  authMethod: { type: String, enum: ['phone', 'google'], default: 'phone' },
  email: { type: String, default: '' },
  role: { type: String, enum: ['tent', 'venue', 'service', 'farm'], default: 'tent' },
  businessName: { type: String, default: '' },
  ownerName: { type: String, default: '' },
  city: { type: String, default: 'Hyderabad' },
  area: { type: String, default: '' },
  venueType: { type: String, default: '' }, // role: venue — Function Hall / Banquet Hall / Marriage Hall / Hotel
  categories: { type: [String], default: [] }, // role: tent — category ids rented out
  // role: service — see routes/services.js
  serviceCategory: { type: String, enum: ['', 'priest', 'catering', 'decor', 'music'], default: '' },
  traditions: { type: [String], default: [] }, // e.g. Hindu, Muslim, Christian — mainly for priests
  languages: { type: [String], default: [] }, // languages they perform/serve in
  serviceAbout: { type: String, default: '' },
  serviceAreas: { type: [String], default: [] },
  experienceYears: { type: Number, default: 0 },
  servicePhotos: { type: [String], default: [] }, // data-URI photos of their work, max 6
  taxId: { type: String, default: '' }, // GSTIN or PAN
  bankAccount: { type: String, default: '' }, // account number or UPI ID
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  registered: { type: Boolean, default: false }, // false until the registration form is submitted
  // Data-URI (base64) photos submitted at registration time, for Tamboo's review team.
  registrationPhotos: { type: [String], default: [] },
  deletedAt: { type: Date, default: null }, // set by account deletion — see lib/accountDeletion.js
}, { timestamps: true });

module.exports = mongoose.model('Partner', partnerSchema);
