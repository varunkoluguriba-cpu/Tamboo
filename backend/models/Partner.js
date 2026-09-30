const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true }, // E.164
  firebaseUid: { type: String, required: true, unique: true },
  role: { type: String, enum: ['tent', 'venue'], default: 'tent' },
  businessName: { type: String, default: '' },
  ownerName: { type: String, default: '' },
  city: { type: String, default: 'Hyderabad' },
  area: { type: String, default: '' },
  venueType: { type: String, default: '' }, // role: venue — Function Hall / Banquet Hall / Marriage Hall / Hotel
  categories: { type: [String], default: [] }, // role: tent — category ids rented out
  taxId: { type: String, default: '' }, // GSTIN or PAN
  bankAccount: { type: String, default: '' }, // account number or UPI ID
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  registered: { type: Boolean, default: false }, // false until the registration form is submitted
}, { timestamps: true });

module.exports = mongoose.model('Partner', partnerSchema);
