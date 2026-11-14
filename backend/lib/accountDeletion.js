const FarmBooking = require('../models/FarmBooking');
const FarmHouse = require('../models/FarmHouse');
const { nowMinIST } = require('./farmAvailability');
const { slotHoldFilter } = require('./hallAvailability');
const admin = require('../config/firebaseAdmin');
const Booking = require('../models/Booking');
const Order = require('../models/Order');
const Hall = require('../models/Hall');
const Item = require('../models/Item');
const PayoutEntry = require('../models/PayoutEntry');

// Account deletion (Play Store requirement). We anonymise rather than hard-delete: bookings,
// orders and payout entries are financial records we have to keep, and they still point at
// the User/Partner doc. Personal fields are wiped, the Firebase login is removed so the same
// phone/Google account can sign up fresh later, and the old JWT stops working because
// login identifiers no longer match anything.

const ACTIVE_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY'];

function todayStr() {
  return new Date().toISOString().slice(0, 10); // Booking.date is YYYY-MM-DD
}

async function removeFirebaseUser(uid) {
  if (!uid || uid.startsWith('deleted_')) return;
  try {
    await admin.auth().deleteUser(uid);
  } catch (err) {
    // Already gone on Firebase's side is fine — anything else shouldn't block deletion.
    if (err.code !== 'auth/user-not-found') console.error('Firebase deleteUser failed', err.code);
  }
}

// Returns an error message if the customer has something in progress, else null.
async function customerBlocker(userId) {
  const booking = await Booking.exists({
    customer: userId,
    ...slotHoldFilter(),
    date: { $gte: todayStr() },
  });
  if (booking) return 'You have an upcoming hall booking. Please complete or cancel it before deleting your account.';
  const order = await Order.exists({ customer: userId, status: { $in: ACTIVE_ORDER_STATUSES } });
  if (order) return 'You have an order in progress. Please wait until it is completed before deleting your account.';
  const farm = await FarmBooking.exists({ customer: userId, status: 'confirmed', startMin: { $gt: nowMinIST() } });
  if (farm) return 'You have an upcoming farm-house booking. Please cancel it before deleting your account.';
  return null;
}

async function partnerBlocker(partnerId) {
  const booking = await Booking.exists({
    partner: partnerId,
    ...slotHoldFilter(),
    date: { $gte: todayStr() },
  });
  if (booking) return 'You have upcoming bookings. Please complete or cancel them before deleting your account.';
  const order = await Order.exists({ partner: partnerId, status: { $in: ACTIVE_ORDER_STATUSES } });
  if (order) return 'You have orders in progress. Please complete them before deleting your account.';
  const farm = await FarmBooking.exists({ partner: partnerId, status: 'confirmed', startMin: { $gt: nowMinIST() } });
  if (farm) return 'You have upcoming farm-house bookings. Please cancel or complete them before deleting your account.';
  // Deleting wipes the bank account, so money still owed to the partner could never be paid out.
  const entries = await PayoutEntry.find({ partner: partnerId }, 'type amount').lean();
  const owed = entries.reduce((sum, e) => sum + (e.type === 'credit' ? e.amount : -e.amount), 0);
  if (owed > 0) return `Tamboo still owes you ₹${owed.toLocaleString('en-IN')}. It will be paid in the next weekly payout — you can delete your account after that, or contact Tamboo Support.`;
  return null;
}

async function deleteCustomer(user) {
  await removeFirebaseUser(user.firebaseUid);
  user.phone = undefined;
  user.contactPhone = '';
  user.firebaseUid = undefined;
  user.guestId = undefined;
  user.name = 'Deleted user';
  user.email = '';
  user.area = '';
  user.locArea = '';
  user.approxLat = null;
  user.approxLng = null;
  user.locatedAt = null;
  user.registered = false;
  user.deletedAt = new Date();
  await user.save();
}

async function deletePartner(partner) {
  await removeFirebaseUser(partner.firebaseUid);
  partner.phone = undefined;
  partner.firebaseUid = `deleted_${partner.id}`; // required + unique on the schema
  partner.email = '';
  partner.ownerName = '';
  partner.businessName = 'Deleted partner';
  partner.taxId = '';
  partner.bankAccount = '';
  partner.registrationPhotos = [];
  // Every public listing (halls, shops, items) is gated on verificationStatus === 'verified'.
  partner.verificationStatus = 'rejected';
  partner.registered = false;
  partner.deletedAt = new Date();
  await partner.save();
  await FarmHouse.updateMany({ partner: partner._id }, { $set: { published: false } });
  await Item.updateMany({ partner: partner.id }, { paused: true });
  await Hall.updateMany({ partner: partner.id }, { $set: { photos: [] } });
}

module.exports = { customerBlocker, partnerBlocker, deleteCustomer, deletePartner };
