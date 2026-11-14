// End-to-end API flow test for Tamboo. Start the backend on :4011 (PORT=4011 node server.js), then from backend/: node scripts/e2e-flows.js
// Hits a local server (latest code) on :4011 against the configured DB, Razorpay TEST mode.
// Everything it creates is tagged and deleted in the finally block.
const path = require('path');
const BACKEND = process.cwd();
require(path.join(BACKEND, 'node_modules/dotenv')).config({ path: path.join(BACKEND, '.env') });
const crypto = require('crypto');
const mongoose = require(path.join(BACKEND, 'node_modules/mongoose'));
const jwt = require(path.join(BACKEND, 'node_modules/jsonwebtoken'));
const M = (n) => require(path.join(BACKEND, 'models', n));
const [User, Partner, Hall, Booking, Order, Quote, Message, PayoutEntry, Item, Package, Shop, AdminUser] =
  ['User', 'Partner', 'Hall', 'Booking', 'Order', 'Quote', 'Message', 'PayoutEntry', 'Item', 'Package', 'Shop', 'AdminUser'].map(M);

const B = 'http://localhost:4011';
const results = [];
const created = { bookings: [], orders: [], quotes: [], items: [], packages: [], users: [], payoutRefs: [] };
let msgSince;

async function call(method, url, token, body) {
  const r = await fetch(B + url, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data };
}
async function check(name, fn) {
  try { const note = await fn(); results.push(['PASS', name, note || '']); }
  catch (e) { results.push(['FAIL', name, e.message]); }
}
function expect(cond, msg) { if (!cond) throw new Error(msg); }
const sign = (o, p) => crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${o}|${p}`).digest('hex');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  msgSince = new Date();
  const tok = (id, kind) => jwt.sign(kind ? { sub: id, kind } : { sub: id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Test customer: the Firebase test number account (create if missing)
  let cust = await User.findOne({ phone: '+919999900000' });
  if (!cust) { cust = await User.create({ phone: '+919999900000', name: 'E2E Test', registered: true }); created.users.push(cust.id); }
  const CT = tok(cust.id);

  const venue = await Partner.findOne({ role: 'venue', verificationStatus: 'verified', deletedAt: null, businessName: /GrandVenue/i })
    || await Partner.findOne({ role: 'venue', verificationStatus: 'verified', deletedAt: null });
  const VT = tok(venue.id, 'partner');
  const tentShop = await Shop.findOne().populate({ path: 'partner', match: { role: 'tent', verificationStatus: 'verified' } });
  const shops = (await Shop.find().populate('partner')).filter((s) => s.partner && s.partner.role === 'tent' && s.partner.verificationStatus === 'verified');
  const tent = shops[0].partner;
  const TT = tok(tent.id, 'partner');

  // ---------- AUTH ----------
  let guestTok;
  await check('Guest login', async () => { const r = await call('POST', '/api/auth/guest'); expect(r.status === 200 && r.data.token, JSON.stringify(r.data)); guestTok = r.data.token; created.users.push(r.data.user.id); });
  await check('Customer /me', async () => { const r = await call('GET', '/api/auth/me', CT); expect(r.status === 200 && r.data.phone === '+919999900000', JSON.stringify(r.data)); });
  await check('Customer register (name/city)', async () => { const r = await call('POST', '/api/auth/register', guestTok, { name: 'E2E Guest', city: 'Hyderabad' }); expect(r.status === 200 && r.data.user.name === 'E2E Guest', JSON.stringify(r.data)); });
  await check('Guest cannot pay or request quotes', async () => {
    const p1 = await call('POST', '/api/payments/create-order', guestTok, { hallId: 'x' });
    const p2 = await call('POST', '/api/quotes', guestTok, { need: 'x' });
    expect(p1.status === 403 && p2.status === 403, `pay ${p1.status}, quote ${p2.status}`);
  });
  await check('Bad token rejected', async () => { const r = await call('GET', '/api/auth/me', 'garbage'); expect(r.status === 401, 'got ' + r.status); });
  await check('Partner /me (venue)', async () => { const r = await call('GET', '/api/partner-auth/me', VT); expect(r.status === 200 && r.data.role === 'venue', JSON.stringify(r.data)); return venue.businessName; });
  await check('Partner /me (tent)', async () => { const r = await call('GET', '/api/partner-auth/me', TT); expect(r.status === 200 && r.data.role === 'tent', JSON.stringify(r.data)); return tent.businessName; });
  await check('Customer token cannot use partner API', async () => { const r = await call('GET', '/api/partner-auth/me', CT); expect(r.status === 401, 'got ' + r.status); });

  // ---------- PUBLIC BROWSE ----------
  let halls, hall, vendors, products;
  await check('List halls', async () => { const r = await call('GET', '/api/halls'); halls = r.data; expect(r.status === 200 && halls.length > 0, 'none'); return halls.length + ' halls'; });
  hall = halls.find((h) => String(h.partnerId || h.partner || '') === venue.id) || halls[0];
  await check('Halls with location → distance', async () => { const r = await call('GET', '/api/halls?lat=17.41&lng=78.44'); expect(r.status === 200 && r.data.some((h) => typeof h.km === 'number'), 'no km'); });
  await check('Hall detail', async () => { const r = await call('GET', '/api/halls/' + hall.id); expect(r.status === 200 && r.data.name, JSON.stringify(r.data)); return hall.name + ' (token ₹' + r.data.token + ')'; });
  await check('Hall month availability', async () => { const r = await call('GET', `/api/halls/${hall.id}/availability?month=2027-03`); expect(r.status === 200, JSON.stringify(r.data)); });
  await check('List tent houses', async () => { const r = await call('GET', '/api/vendors'); vendors = r.data; expect(r.status === 200 && vendors.length > 0, 'none'); return vendors.length + ' vendors'; });
  await check('Vendor detail', async () => { const r = await call('GET', '/api/vendors/' + tent.id); expect(r.status === 200, JSON.stringify(r.data)); });
  await check('Vendor products', async () => { const r = await call('GET', `/api/vendors/${tent.id}/products?date=15 Mar 2027`); products = r.data; expect(r.status === 200 && products.length > 0, 'no products for ' + tent.businessName); return products.length + ' items'; });
  await check('Public packages', async () => { const r = await call('GET', '/api/vendors/packages'); expect(r.status === 200 && Array.isArray(r.data), JSON.stringify(r.data)); return r.data.length + ' packages'; });
  await check('Coupon TAMBOO10 valid', async () => { const r = await call('GET', '/api/coupons/TAMBOO10', CT); expect(r.status === 200, JSON.stringify(r.data)); });
  await check('Bad coupon rejected', async () => { const r = await call('GET', '/api/coupons/NOPE123', CT); expect(r.data.valid === false, JSON.stringify(r.data)); });

  // ---------- HALL TOKEN → VISIT → CONFIRM → ADVANCE ----------
  const date = '2027-03-15', slot = 'Morning';
  let bookingId;
  await check('Hall token: create Razorpay order', async () => {
    const r = await call('POST', '/api/payments/create-order', CT, { hallId: hall.id, date, slot });
    expect(r.status === 200 && r.data.orderId && String(r.data.keyId).startsWith('rzp_test'), JSON.stringify(r.data));
    const pay = 'pay_E2E' + Date.now();
    const v = await call('POST', '/api/payments/verify', CT, {
      razorpay_order_id: r.data.orderId, razorpay_payment_id: pay, razorpay_signature: sign(r.data.orderId, pay),
      hallId: hall.id, hallName: hall.name, date, slot, guests: 200, partnerId: hall.partnerId || venue.id,
    });
    expect(v.status === 200 && v.data.verified && v.data.bookingId && !v.data.bookingConflict, JSON.stringify(v.data));
    bookingId = v.data.bookingId; created.bookings.push(bookingId); created.payoutRefs.push(bookingId);
    return '₹' + r.data.amount / 100;
  });
  await check('Forged payment signature rejected', async () => {
    const r = await call('POST', '/api/payments/verify', CT, { razorpay_order_id: 'order_x', razorpay_payment_id: 'pay_x', razorpay_signature: 'bad' });
    expect(r.data.verified === false, JSON.stringify(r.data));
  });
  await check('Same slot cannot be booked twice', async () => { const r = await call('POST', '/api/payments/create-order', CT, { hallId: hall.id, date, slot }); expect(r.status === 409, 'got ' + r.status); });
  await check('Availability shows slot taken', async () => { const r = await call('GET', `/api/halls/${hall.id}/availability?month=2027-03`); expect(JSON.stringify(r.data).includes('2027-03-15'), JSON.stringify(r.data).slice(0, 200)); });
  await check('Customer sees active token', async () => { const r = await call('GET', '/api/halls/my-token', CT); expect(r.data && r.data.id === bookingId, JSON.stringify(r.data)); });
  await check('Customer schedules visit', async () => { const r = await call('PATCH', '/api/halls/my-token/' + bookingId, CT, { action: 'scheduleVisit', visitDay: 'tomorrow', visitTime: 'evening' }); expect(r.status === 200, JSON.stringify(r.data)); });
  await check('Customer bookings history', async () => { const r = await call('GET', '/api/halls/my-tokens', CT); expect(r.data.some((b) => b.id === bookingId), 'missing'); });
  const hallOwnerTok = hall.partnerId && hall.partnerId !== venue.id ? tok(hall.partnerId, 'partner') : VT;
  await check('Partner sees pre-booking WITH customer name+phone', async () => {
    const r = await call('GET', '/api/halls/me/tokens', hallOwnerTok); const b = (r.data || []).find((x) => x.id === bookingId);
    expect(b, 'booking not in partner list'); expect(b.customer && b.phone, 'blank name/phone: ' + JSON.stringify(b));
    return b.customer + ' / ' + b.phone;
  });
  await check('Hall owner sees the date the customer plans to visit', async () => {
    const b = (await call('GET', '/api/halls/me/tokens', hallOwnerTok)).data.find((x) => x.id === bookingId);
    const tomorrowIST = new Date(Date.now() + 5.5 * 3600 * 1000 + 86400 * 1000).toISOString().slice(0, 10);
    expect(b && b.visitDate === tomorrowIST && b.visitTime === 'evening', JSON.stringify({ visitDate: b && b.visitDate, visitTime: b && b.visitTime, expected: tomorrowIST }));
  });
  await check('Partner marks visited', async () => { const r = await call('PATCH', '/api/halls/me/tokens/' + bookingId, hallOwnerTok, { action: 'visited' }); expect(r.status === 200 && r.data.status === 'visited', JSON.stringify(r.data)); });
  await check('Final rent below the token is rejected', async () => {
    const r = await call('PATCH', '/api/halls/me/tokens/' + bookingId, hallOwnerTok, { action: 'confirm', finalRent: 1000 });
    expect(r.status === 400, 'got ' + r.status);
  });
  await check('Partner confirms with final rent → advance requested', async () => { const r = await call('PATCH', '/api/halls/me/tokens/' + bookingId, hallOwnerTok, { action: 'confirm', finalRent: 100000 }); expect(r.status === 200 && r.data.status === 'awaiting_advance', JSON.stringify(r.data)); });
  await check('Customer pays advance → confirmed', async () => {
    const r = await call('POST', '/api/payments/create-advance-order', CT, { bookingId });
    expect(r.status === 200 && r.data.amount > 0, JSON.stringify(r.data));
    const pay = 'pay_E2EA' + Date.now();
    const v = await call('POST', '/api/payments/verify', CT, { razorpay_order_id: r.data.orderId, razorpay_payment_id: pay, razorpay_signature: sign(r.data.orderId, pay), advanceForBookingId: bookingId });
    expect(v.data.verified, JSON.stringify(v.data));
    const b = await Booking.findById(bookingId); expect(b.status === 'confirmed', 'status ' + b.status);
    return 'advance ₹' + r.data.amount / 100;
  });
  await check('Commission % shown to partners matches what is deducted', async () => {
    const me = (await call('GET', '/api/partner-auth/me', hallOwnerTok)).data;
    const credit = (await PayoutEntry.findOne({ reference: bookingId, type: 'credit', description: /^Token/ }).lean());
    const b = await Booking.findById(bookingId).lean();
    const expectedNet = Math.round(b.amount * (1 - me.commissionPct / 100));
    expect(typeof me.commissionPct === 'number' && credit && credit.amount === expectedNet, `shown ${me.commissionPct}%, credited ${credit && credit.amount} of ${b.amount}`);
  });
  await check('Partner payouts credited (token + advance)', async () => {
    const r = await call('GET', '/api/partner-auth/payouts', hallOwnerTok);
    const n = r.data.entries.filter((e) => e.reference === bookingId && e.type === 'credit').length;
    expect(n === 2, n + ' credits'); return 'balance ₹' + r.data.balance;
  });
  await check('Delete account blocked while booking active', async () => { const r = await call('DELETE', '/api/auth/me', CT); expect(r.status === 409, 'got ' + r.status + ' ' + JSON.stringify(r.data)); });

  // ---------- FREE-CANCEL WINDOW (2 hours) ----------
  const payToken = async (d, sl) => {
    const r = await call('POST', '/api/payments/create-order', CT, { hallId: hall.id, date: d, slot: sl });
    const pay = 'pay_E2EW' + Date.now();
    const v = await call('POST', '/api/payments/verify', CT, { razorpay_order_id: r.data.orderId, razorpay_payment_id: pay, razorpay_signature: sign(r.data.orderId, pay), hallId: hall.id, hallName: hall.name, date: d, slot: sl, guests: 50, partnerId: hall.partnerId || venue.id });
    created.bookings.push(v.data.bookingId); created.payoutRefs.push(v.data.bookingId); return v.data.bookingId;
  };
  await check('Cancel within 2h → full refund allowed', async () => {
    const id = await payToken('2027-05-10', 'Evening');
    const r = await call('PATCH', '/api/halls/my-token/' + id, CT, { action: 'cancel' }); expect(r.status === 200 && r.data.status === 'cancelled', JSON.stringify(r.data));
  });
  await check('Cancel after 2h → refused (matches policy)', async () => {
    const id = await payToken('2027-05-11', 'Evening');
    await Booking.collection.updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { createdAt: new Date(Date.now() - 3 * 3600 * 1000) } });
    const r = await call('PATCH', '/api/halls/my-token/' + id, CT, { action: 'cancel' }); expect(r.status === 400, 'got ' + r.status + ' ' + JSON.stringify(r.data));
  });
  await check('Missed advance deadline debits the partner exactly once (parallel reads)', async () => {
    const id = await payToken('2027-05-12', 'Morning');
    await Booking.collection.updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { status: 'awaiting_advance', finalRent: 100000, advanceAmount: 25000, advanceDeadlineAt: new Date(Date.now() - 60 * 1000) } });
    await Promise.all([1, 2, 3].map(() => call('GET', '/api/halls/me/tokens', hallOwnerTok)));
    const debits = await PayoutEntry.countDocuments({ reference: id, type: 'debit' });
    const b = await Booking.findById(id).lean();
    expect(debits === 1 && b.status === 'not_booked', `${debits} debits, status ${b.status}`);
  });

  // ---------- REFUNDS ----------
  const admin = await AdminUser.findOne({ role: { $in: ['owner', 'admin', 'superadmin'] } }) || await AdminUser.findOne();
  const AT = admin && jwt.sign({ sub: admin.id, kind: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  await check('Customer cancel within 2h records a full refund owed', async () => {
    const id = await payToken('2027-06-10', 'Evening');
    await call('PATCH', '/api/halls/my-token/' + id, CT, { action: 'cancel' });
    const b = await Booking.findById(id).lean();
    expect(b.refundStatus === 'pending' && b.refundAmount === b.amount, JSON.stringify({ s: b.refundStatus, amt: b.refundAmount, paid: b.amount }));
    const mine = (await call('GET', '/api/halls/my-tokens', CT)).data.find((x) => x.id === id);
    expect(mine && mine.refundStatus === 'pending', 'customer view: ' + (mine && mine.refundStatus));
  });
  await check("Hall can't host → full refund owed; not-booked → 80% owed", async () => {
    const a = await payToken('2027-06-11', 'Evening');
    await call('PATCH', '/api/halls/me/tokens/' + a, hallOwnerTok, { action: 'cantHost' });
    const b = await payToken('2027-06-12', 'Evening');
    await call('PATCH', '/api/halls/me/tokens/' + b, hallOwnerTok, { action: 'visited' });
    await call('PATCH', '/api/halls/me/tokens/' + b, hallOwnerTok, { action: 'notBooked' });
    const [ba, bb] = await Promise.all([Booking.findById(a).lean(), Booking.findById(b).lean()]);
    expect(ba.refundStatus === 'pending' && ba.refundAmount === ba.amount, 'cantHost ' + ba.refundAmount);
    expect(bb.refundStatus === 'pending' && bb.refundAmount === bb.amount - Math.round(bb.amount * 0.2), 'notBooked ' + bb.refundAmount);
  });
  await check('Admin sees pending refunds and can mark one paid', async () => {
    expect(AT, 'no admin user to test with');
    const list = (await call('GET', '/api/admin/refunds', AT)).data;
    const mine = list.find((r) => r.customerPhone === '+919999900000' && r.kind === 'booking');
    expect(mine, 'refund not listed');
    const r = await call('POST', `/api/admin/refunds/booking/${mine.id}/mark-refunded`, AT, { ref: 'rfnd_E2E' });
    expect(r.status === 200, 'mark ' + r.status);
    const b = await Booking.findById(mine.id).lean();
    expect(b.refundStatus === 'refunded' && b.refundRef === 'rfnd_E2E', b.refundStatus);
    const again = await call('POST', `/api/admin/refunds/booking/${mine.id}/mark-refunded`, AT, {});
    expect(again.status === 400, 'double-mark allowed');
  });

  // ---------- PARTNER VENUE ----------
  await check('Partner: my halls', async () => { const r = await call('GET', '/api/halls/me/halls', VT); expect(r.status === 200 && r.data.length > 0, JSON.stringify(r.data).slice(0, 200)); return r.data.length + ' halls'; });
  await check('Hall save rejects token over ₹10,000 and advance over 100%', async () => {
    const mh = (await call('GET', '/api/halls/me/halls', VT)).data[0];
    const full = (await call('GET', '/api/halls/me/halls/' + mh.id, VT)).data;
    const base = { ...full, name: full.name, seated: full.seated || 100, floating: full.floating || 100 };
    const a = await call('PUT', '/api/halls/me/halls/' + mh.id, VT, { ...base, token: 50000 });
    const b = await call('PUT', '/api/halls/me/halls/' + mh.id, VT, { ...base, token: full.token || 5000, advancePct: 150 });
    expect(a.status === 400 && b.status === 400, `token ${a.status}, advance ${b.status}`);
  });
  await check('Partner: offline booking add + remove', async () => {
    const mh = (await call('GET', '/api/halls/me/halls', VT)).data[0];
    const a = await call('POST', `/api/halls/me/halls/${mh.id}/offline-bookings`, VT, { date: '2027-04-20', slot: 'Evening' });
    expect(a.status === 200 || a.status === 201, JSON.stringify(a.data));
    const id = a.data.id || a.data._id || (a.data.booking && a.data.booking.id); if (id) created.bookings.push(id);
    const d = await call('DELETE', `/api/halls/me/halls/${mh.id}/offline-bookings/${id}`, VT); expect(d.status === 200 || d.status === 204, JSON.stringify(d.data));
  });

  // ---------- CART ORDER (tent house) ----------
  const p = products.find((x) => x.instant !== false && x.price > 0) || products[0];
  let orderId, paidTotal;
  await check('Cart: create order + pay (full)', async () => {
    const cart = { groups: [{ vendorId: tent.id, vendorName: tent.businessName, lines: [{ itemId: p.id, name: p.name, qty: 2 }] }],
      deliveryMode: 'delivery', payMode: 'full', dateTxt: '15 Mar 2027', couponCode: 'TAMBOO10', customerName: 'E2E Test', customerPhone: '+919999900000', address: 'Test address', guests: 100, eventType: 'Wedding' };
    const r = await call('POST', '/api/payments/create-order', CT, { cart }); expect(r.status === 200 && r.data.orderId, JSON.stringify(r.data));
    const pay = 'pay_E2EC' + Date.now();
    const v = await call('POST', '/api/payments/verify', CT, { razorpay_order_id: r.data.orderId, razorpay_payment_id: pay, razorpay_signature: sign(r.data.orderId, pay), cart });
    expect(v.data.verified && v.data.orders && v.data.orders.length === 1 && !v.data.orders[0].conflict, JSON.stringify(v.data));
    orderId = v.data.orders[0].id; created.orders.push(orderId); created.payoutRefs.push(orderId);
    paidTotal = r.data.amount / 100;
    expect(v.data.orders[0].total === paidTotal, `confirmation shows ₹${v.data.orders[0].total}, paid ₹${paidTotal}`);
    return `${p.name} ×2, paid ₹${r.data.amount / 100}`;
  });
  await check("Cart: charges the vendor's own delivery + setup fee", async () => {
    const before = await Shop.findOne({ partner: tent.id }).lean();
    await Shop.updateOne({ partner: tent.id }, { $set: { deliveryFee: 250, setupFee: 100, pickupFee: 50 } });
    try {
      const mk = (mode) => ({ groups: [{ vendorId: tent.id, lines: [{ itemId: p.id, name: p.name, qty: 1 }] }], deliveryMode: mode, payMode: 'full' });
      const del = (await call('POST', '/api/payments/create-order', CT, { cart: mk('delivery') })).data.amount / 100;
      const pick = (await call('POST', '/api/payments/create-order', CT, { cart: mk('pickup') })).data.amount / 100;
      expect(del - pick === 400, `delivery adds ₹${del - pick}, expected ₹400`);
      const pub = (await call('GET', '/api/vendors/' + tent.id)).data;
      expect(pub.deliveryFee === 250 && pub.setupFee === 100, 'vendor page fees ' + JSON.stringify([pub.deliveryFee, pub.setupFee]));
    } finally {
      await Shop.updateOne({ partner: tent.id }, { $set: { deliveryFee: before.deliveryFee || 0, setupFee: before.setupFee || 0, pickupFee: before.pickupFee || 0 } });
    }
  });
  await check("Cart: can't buy a paused item or one from an unverified vendor", async () => {
    const rejected = await Partner.findOne({ verificationStatus: { $ne: 'verified' }, role: 'tent' }).lean();
    const hidden = rejected && await Item.findOne({ partner: rejected._id }).lean();
    if (hidden) {
      const r = await call('POST', '/api/payments/create-order', CT, { cart: { groups: [{ vendorId: String(rejected._id), lines: [{ itemId: String(hidden._id), qty: 1 }] }], deliveryMode: 'pickup', payMode: 'full' } });
      expect(r.status === 400, 'unverified vendor item: ' + r.status);
    }
    await Item.updateOne({ _id: p.id }, { $set: { paused: true } });
    try {
      const r2 = await call('POST', '/api/payments/create-order', CT, { cart: { groups: [{ vendorId: tent.id, lines: [{ itemId: p.id, qty: 1 }] }], deliveryMode: 'pickup', payMode: 'full' } });
      expect(r2.status === 400, 'paused item: ' + r2.status);
    } finally { await Item.updateOne({ _id: p.id }, { $set: { paused: false } }); }
  });
  await check('Stock counts the same day written differently (20/12/26 vs 20 Dec 2026)', async () => {
    const it = await Item.findById(p.id).lean();
    const mk = (d, q) => ({ groups: [{ vendorId: tent.id, lines: [{ itemId: p.id, qty: q }] }], deliveryMode: 'pickup', payMode: 'full', dateTxt: d });
    // Fill the stock on one spelling of the date…
    const r1 = await call('POST', '/api/payments/create-order', CT, { cart: mk('07/01/2028', it.stock) });
    const pay = 'pay_E2EN' + Date.now();
    const v = await call('POST', '/api/payments/verify', CT, { razorpay_order_id: r1.data.orderId, razorpay_payment_id: pay, razorpay_signature: sign(r1.data.orderId, pay), cart: mk('07/01/2028', it.stock) });
    const oid = v.data.orders[0].id; created.orders.push(oid); created.payoutRefs.push(oid);
    // …then another spelling of the same day must be refused.
    const r2 = await call('POST', '/api/payments/create-order', CT, { cart: mk('7 Jan 2028', 1) });
    expect(r2.status === 409, 'same day, other spelling: ' + r2.status);
  });
  await check('Cart: tampered price ignored (server re-prices)', async () => {
    const cart = { groups: [{ vendorId: tent.id, lines: [{ itemId: p.id, name: p.name, qty: 1, unitPrice: 1 }] }], deliveryMode: 'pickup', payMode: 'full' };
    const r = await call('POST', '/api/payments/create-order', CT, { cart }); expect(r.data.amount / 100 > 1, 'charged ' + r.data.amount);
  });
  await check('Customer sees order with the amount they paid', async () => {
    const r = await call('GET', '/api/orders/me', CT); const o = r.data.find((x) => x.id === orderId);
    expect(o, 'missing'); expect(o.value === paidTotal, `shows ₹${o.value}, paid ₹${paidTotal}`);
    const ist = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: true });
    expect(o.history[0].date.includes(ist.split(' ')[0]), `history time "${o.history[0].date}" not India time (now ${ist})`);
  });
  await check('Vendor sees order', async () => { const r = await call('GET', '/api/vendors/me/orders', TT); expect(r.data.some((o) => o.id === orderId), 'missing'); });
  await check('Vendor cannot skip straight to COMPLETED', async () => { const r = await call('PATCH', '/api/vendors/me/orders/' + orderId, TT, { status: 'COMPLETED' }); expect(r.status === 409, 'got ' + r.status); });
  for (const st of ['CONFIRMED', 'PACKED']) {
    await check('Vendor order → ' + st, async () => { const r = await call('PATCH', '/api/vendors/me/orders/' + orderId, TT, { status: st }); expect(r.status === 200 && r.data.status === st, JSON.stringify(r.data)); });
  }
  await check('Out for delivery refused weeks before the event', async () => {
    const far = new Date(Date.now() + 20 * 86400000); const pad = (n) => String(n).padStart(2, '0');
    await Order.collection.updateOne({ _id: new mongoose.Types.ObjectId(orderId) }, { $set: { dateTxt: `${pad(far.getDate())}/${pad(far.getMonth() + 1)}/${far.getFullYear()}` } });
    const r = await call('PATCH', '/api/vendors/me/orders/' + orderId, TT, { status: 'OUT_FOR_DELIVERY' }); expect(r.status === 409, 'got ' + r.status);
  });
  await Order.collection.updateOne({ _id: new mongoose.Types.ObjectId(orderId) }, { $set: { dateTxt: new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10) } });
  for (const st of ['OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED']) {
    await check('Vendor order → ' + st, async () => { const r = await call('PATCH', '/api/vendors/me/orders/' + orderId, TT, { status: st }); expect(r.status === 200 && r.data.status === st, JSON.stringify(r.data)); });
  }
  await check('Completed order cannot be cancelled by vendor', async () => { const r = await call('PATCH', '/api/vendors/me/orders/' + orderId, TT, { status: 'CANCELLED' }); expect(r.status === 409, 'got ' + r.status); });

  await check('Vendor declines a paid order → full refund owed to customer', async () => {
    const cart = { groups: [{ vendorId: tent.id, vendorName: tent.businessName, lines: [{ itemId: p.id, name: p.name, qty: 1 }] }], deliveryMode: 'pickup', payMode: 'full', dateTxt: '16 Mar 2027' };
    const r = await call('POST', '/api/payments/create-order', CT, { cart });
    const pay = 'pay_E2ED' + Date.now();
    const v = await call('POST', '/api/payments/verify', CT, { razorpay_order_id: r.data.orderId, razorpay_payment_id: pay, razorpay_signature: sign(r.data.orderId, pay), cart });
    const oid = v.data.orders[0].id; created.orders.push(oid); created.payoutRefs.push(oid);
    await call('PATCH', '/api/vendors/me/orders/' + oid, TT, { status: 'CANCELLED' });
    const o = await Order.findById(oid).lean();
    expect(o.refundStatus === 'pending' && o.refundAmount === r.data.amount / 100, JSON.stringify({ s: o.refundStatus, amt: o.refundAmount, paid: r.data.amount / 100 }));
    const mine = (await call('GET', '/api/orders/me', CT)).data.find((x) => x.id === oid);
    expect(mine && mine.refundStatus === 'pending', 'customer view');
  });

  await check('Vendor cancels an accepted order → refund owed AND earnings reversed', async () => {
    const cart = { groups: [{ vendorId: tent.id, vendorName: tent.businessName, lines: [{ itemId: p.id, name: p.name, qty: 1 }] }], deliveryMode: 'pickup', payMode: 'full', dateTxt: '17 Mar 2027' };
    const r = await call('POST', '/api/payments/create-order', CT, { cart });
    const pay = 'pay_E2EC' + Date.now();
    const v = await call('POST', '/api/payments/verify', CT, { razorpay_order_id: r.data.orderId, razorpay_payment_id: pay, razorpay_signature: sign(r.data.orderId, pay), cart });
    const oid = v.data.orders[0].id; created.orders.push(oid); created.payoutRefs.push(oid);
    await call('PATCH', '/api/vendors/me/orders/' + oid, TT, { status: 'CONFIRMED' });
    const c = await call('PATCH', '/api/vendors/me/orders/' + oid, TT, { status: 'CANCELLED' });
    expect(c.status === 200, 'cancel ' + c.status);
    const o = await Order.findById(oid).lean();
    const entries = await PayoutEntry.find({ reference: oid }).lean();
    const net = entries.reduce((s2, e) => s2 + (e.type === 'credit' ? e.amount : -e.amount), 0);
    expect(o.refundStatus === 'pending' && net === 0, JSON.stringify({ refund: o.refundStatus, net, entries: entries.length }));
  });

  // ---------- QUOTES ----------
  let quoteId;
  await check('Customer requests quote', async () => { const r = await call('POST', '/api/quotes', CT, { vendorId: tent.id, vendorName: tent.businessName, need: 'E2E test: 200 chairs + shamiana', dateTxt: '15 Mar 2027', guests: 200 }); expect(r.status === 201, JSON.stringify(r.data)); quoteId = r.data.id; created.quotes.push(quoteId); });
  await check('Vendor sees quote', async () => { const r = await call('GET', '/api/quotes/vendor/me', TT); expect(r.data.some((q) => q.id === quoteId), 'missing'); });
  await check('Vendor sends offer', async () => { const r = await call('PATCH', '/api/quotes/vendor/me/' + quoteId, TT, { lines: [{ label: 'Chairs', amount: 4000 }, { label: 'Shamiana', amount: 6000 }], note: 'test' }); expect(r.status === 200 && r.data.status === 'OFFER SENT', JSON.stringify(r.data)); });
  await check('Customer asks for changes with a note → vendor sees it', async () => {
    const r = await call('PATCH', '/api/quotes/me/' + quoteId, CT, { action: 'requestRevision', note: 'Need 250 chairs instead' });
    expect(r.status === 200 && r.data.status === 'REVISION_REQUESTED', JSON.stringify(r.data));
    const v = (await call('GET', '/api/quotes/vendor/me', TT)).data.find((q) => q.id === quoteId);
    expect(v && v.isRevision && v.revisionNote === 'Need 250 chairs instead', JSON.stringify(v));
    const o = await call('PATCH', '/api/quotes/vendor/me/' + quoteId, TT, { lines: [{ label: 'Chairs', amount: 4000 }, { label: 'Shamiana', amount: 6000 }] });
    expect(o.status === 200, 'vendor re-offer ' + o.status);
  });
  await check('Customer accepts offer', async () => { const r = await call('PATCH', '/api/quotes/me/' + quoteId, CT, { action: 'accept' }); expect(r.status === 200 && r.data.status === 'ACCEPTED' && r.data.quotedTotal === 10000, JSON.stringify(r.data)); });

  await check('Vendor sees the customer accepted', async () => {
    const v = (await call('GET', '/api/quotes/vendor/me', TT)).data.find((q) => q.id === quoteId);
    expect(v && v.status === 'ACCEPTED', 'vendor sees ' + (v && v.status));
  });

  // ---------- CHAT + SUPPORT ----------
  await check('Customer → vendor chat', async () => { const r = await call('POST', '/api/messages/' + tent.id, CT, { text: 'E2E hello' }); expect(r.status < 300, JSON.stringify(r.data)); });
  await check('Vendor sees conversation + replies', async () => {
    const c = await call('GET', '/api/messages/vendor/' + cust.id, TT); expect(c.status === 200 && JSON.stringify(c.data).includes('E2E hello'), 'customer message not visible to vendor');
    const w = await call('GET', '/api/vendors/me/conversations', TT); expect(w.status === 200, 'whatsapp insights list failed');
    const r = await call('POST', '/api/messages/vendor/' + cust.id, TT, { text: 'E2E reply' }); expect(r.status < 300, JSON.stringify(r.data));
    const g = await call('GET', '/api/messages/' + tent.id, CT); expect(JSON.stringify(g.data).includes('E2E reply'), 'reply not visible to customer');
  });
  await check('Customer support chat', async () => { const r = await call('POST', '/api/messages/support/me', CT, { text: 'E2E support' }); expect(r.status < 300, JSON.stringify(r.data)); const g = await call('GET', '/api/messages/support/me', CT); expect(JSON.stringify(g.data).includes('E2E support'), 'missing'); });
  await check('Partner support chat', async () => { const r = await call('POST', '/api/messages/support/vendor/me', TT, { text: 'E2E partner support' }); expect(r.status < 300, JSON.stringify(r.data)); });

  // ---------- PARTNER TENT ----------
  await check('Vendor: shop profile', async () => { const r = await call('GET', '/api/vendors/me/shop', TT); expect(r.status === 200, JSON.stringify(r.data)); });
  await check('Vendor: item presets', async () => { const r = await call('GET', '/api/vendors/item-presets', TT); expect(r.status === 200 && r.data.length > 0, 'none'); return r.data.length + ' presets'; });
  await check('Vendor: my items', async () => { const r = await call('GET', '/api/vendors/me/items', TT); expect(r.status === 200, JSON.stringify(r.data)); return r.data.length + ' items'; });
  let newItem;
  await check('Vendor: add item', async () => { const r = await call('POST', '/api/vendors/me/items', TT, { name: 'E2E Test Chair', cat: 'Chairs & Tables', price: 20, unit: '/ chair / day', stock: 50, instant: true }); expect(r.status === 201, JSON.stringify(r.data)); newItem = r.data; created.items.push(r.data.id); });
  await check('Vendor: item with 0 stock is rejected', async () => {
    const r = await call('POST', '/api/vendors/me/items', TT, { name: 'E2E Zero Stock', cat: 'seat', price: 20, unit: 'per unit / day', stock: 0, instant: true });
    if (r.data && r.data.id) created.items.push(r.data.id);
    expect(r.status === 400, 'got ' + r.status);
  });
  await check('Vendor: pause item', async () => { const r = await call('PUT', '/api/vendors/me/items/' + newItem.id, TT, { paused: true }); expect(r.status === 200, JSON.stringify(r.data)); });
  await check('Vendor: market price suggestion', async () => { const r = await call('GET', '/api/vendors/me/items/market-price?cat=' + encodeURIComponent('Chairs & Tables') + '&unit=' + encodeURIComponent('/ chair / day'), TT); expect(r.status === 200, JSON.stringify(r.data)); });
  await check('Vendor: create + delete package', async () => {
    const it = (await call('GET', '/api/vendors/me/items', TT)).data.find((i) => i.instant && !i.paused);
    expect(it, 'no instant item to package');
    const r = await call('POST', '/api/vendors/me/packages', TT, { name: 'E2E Package', description: 'test', items: [{ itemId: it.id, qty: 2 }] });
    expect(r.status === 201 || r.status === 200, JSON.stringify(r.data)); created.packages.push(r.data.id);
    const d = await call('DELETE', '/api/vendors/me/packages/' + r.data.id, TT); expect(d.status < 300, JSON.stringify(d.data));
  });
  await check('Vendor: delete item', async () => { const r = await call('DELETE', '/api/vendors/me/items/' + newItem.id, TT); expect(r.status < 300, JSON.stringify(r.data)); });
  await check('AI: classify item name', async () => { const r = await call('POST', '/api/vendors/me/items/classify-text', TT, { name: 'Desert Cooler' }); expect(r.status === 200, JSON.stringify(r.data)); return JSON.stringify(r.data).slice(0, 80); });

  // ---------- EVENT SERVICES (feature-switched) ----------
  const Config = M('Config'), ServiceOffer = M('ServiceOffer'), ServiceRequest = M('ServiceRequest');
  const cfg0 = (await Config.get()).toObject();
  const svc = [];
  try {
    const mkSvc = async (cat, name, phone) => {
      const p = await Partner.create({ phone, firebaseUid: 'e2e-svc-' + Date.now() + cat, role: 'service', serviceCategory: cat, businessName: name, ownerName: 'E2E', registered: true, verificationStatus: 'verified', area: 'Ameerpet' });
      svc.push(p.id); return { p, tok: tok(p.id, 'partner') };
    };
    await Config.updateOne({ _id: Config.SINGLETON_ID }, { $set: { servicesMode: 'off' } });
    const A = await mkSvc('priest', 'E2E Pandit', '+919999911101');
    const Bv = await mkSvc('music', 'E2E Sannayi', '+919999911102');
    await ServiceRequest.deleteMany({ customer: cust._id });

    await check('Services OFF: hidden from customers', async () => {
      const c = await call('GET', '/api/services/config', CT); const l = await call('GET', '/api/services', CT);
      expect(c.data.enabled === false && l.status === 404, `config ${JSON.stringify(c.data)}, list ${l.status}`);
    });
    await check('Services OFF: cannot sign up as event service', async () => {
      const r = await call('POST', '/api/partner-auth/register', A.tok, { role: 'service', serviceCategory: 'priest', businessName: 'E2E Pandit', ownerName: 'E2E' });
      expect(r.status === 400, 'got ' + r.status);
    });

    await Config.updateOne({ _id: Config.SINGLETON_ID }, { $set: { servicesMode: 'beta', serviceTesterPhones: ['+919999900000', '+919999911101', '+919999911102'], serviceFreeQuotes: 1, 'serviceQuoteFees.music': 69 } });
    await check('Services BETA: tester sees it, others do not', async () => {
      const c = await call('GET', '/api/services/config', CT); const g = await call('GET', '/api/services/config', guestTok);
      expect(c.data.enabled === true && c.data.freeLeft === 1 && g.data.enabled === false, `tester ${JSON.stringify(c.data)}, guest ${JSON.stringify(g.data)}`);
    });
    let offer;
    await check('Service vendor adds a package', async () => {
      const bad = await call('POST', '/api/services/vendor/me/offers', A.tok, { title: 'E2E pooja', price: 0 });
      const r = await call('POST', '/api/services/vendor/me/offers', A.tok, { title: 'E2E Satyanarayana pooja', priceType: 'from', price: 2100, description: 'E2E' });
      expect(bad.status === 400 && r.status === 200 && r.data.price === 2100, `bad ${bad.status}, ok ${JSON.stringify(r.data)}`); offer = r.data;
    });
    await check('Customer sees service vendors by category', async () => {
      const r = await call('GET', '/api/services?category=priest', CT); const v = (r.data || []).find((x) => x.id === A.p.id);
      expect(v && v.fromPrice === 2100, JSON.stringify(r.data).slice(0, 200));
    });
    await check('Tent partner cannot use the service-vendor API', async () => { const r = await call('GET', '/api/services/vendor/me/requests', TT); expect(r.status === 404 || r.status === 403, 'got ' + r.status); });

    let reqA, reqB;
    await check('Quote request needs consent to share number', async () => {
      const r = await call('POST', '/api/services/requests', CT, { partnerId: A.p.id, eventDate: '20/03/2027', consent: false }); expect(r.status === 400, 'got ' + r.status);
    });
    await check('1st quote request is free and reaches the vendor', async () => {
      const r = await call('POST', '/api/services/requests', CT, { partnerId: A.p.id, eventDate: '20/03/2027', eventType: 'Wedding', guests: 200, message: 'E2E need a pandit', offerId: offer.id, consent: true });
      expect(r.status === 200 && r.data.payment === null && r.data.request.fee === 0 && r.data.request.status === 'NEW', JSON.stringify(r.data)); reqA = r.data.request;
      const v = await call('GET', '/api/services/vendor/me/requests', A.tok);
      expect(v.data.some((x) => x.id === reqA.id && x.customerPhone === '+919999900000' && x.offerTitle === 'E2E Satyanarayana pooja'), JSON.stringify(v.data).slice(0, 200));
    });
    await check('Asking the same vendor again is blocked', async () => {
      const r = await call('POST', '/api/services/requests', CT, { partnerId: A.p.id, eventDate: '20/03/2027', consent: true }); expect(r.status === 409, 'got ' + r.status);
    });
    await check('After the free quota, a request needs the fee', async () => {
      const r = await call('POST', '/api/services/requests', CT, { partnerId: Bv.p.id, eventDate: '21/03/2027', message: 'E2E sannayi', consent: true });
      expect(r.status === 200 && r.data.payment && r.data.payment.amount === 6900 && r.data.request.status === 'PENDING_PAYMENT', JSON.stringify(r.data)); reqB = r.data;
      const v = await call('GET', '/api/services/vendor/me/requests', Bv.tok);
      expect(v.data.length === 0, 'vendor saw an unpaid request');
    });
    await check('Paying the fee sends the request to the vendor', async () => {
      const pay = 'pay_E2ES' + Date.now();
      const bad = await call('POST', `/api/services/requests/${reqB.request.id}/verify`, CT, { razorpay_order_id: reqB.payment.orderId, razorpay_payment_id: pay, razorpay_signature: 'nope' });
      const r = await call('POST', `/api/services/requests/${reqB.request.id}/verify`, CT, { razorpay_order_id: reqB.payment.orderId, razorpay_payment_id: pay, razorpay_signature: sign(reqB.payment.orderId, pay) });
      const v = await call('GET', '/api/services/vendor/me/requests', Bv.tok);
      expect(bad.data.verified === false && r.data.verified === true && v.data.length === 1, `bad ${JSON.stringify(bad.data)}, ok ${JSON.stringify(r.data)}, vendor ${v.data.length}`);
    });
    await check('Vendor marks contacted, then done', async () => {
      const early = await call('PATCH', '/api/services/vendor/me/requests/' + reqA.id, A.tok, { action: 'closed' });
      const c = await call('PATCH', '/api/services/vendor/me/requests/' + reqA.id, A.tok, { action: 'contacted' });
      const d = await call('PATCH', '/api/services/vendor/me/requests/' + reqA.id, A.tok, { action: 'closed' });
      expect(early.status === 400 && c.data.status === 'CONTACTED' && d.data.status === 'CLOSED', `early ${early.status}, ${c.data.status}, ${d.data.status}`);
    });
    await check('No response in 24h: paid fee refunded once (parallel reads)', async () => {
      await ServiceRequest.collection.updateOne({ _id: new mongoose.Types.ObjectId(reqB.request.id) }, { $set: { createdAt: new Date(Date.now() - 25 * 3600 * 1000) } });
      await Promise.all([1, 2, 3].map(() => call('GET', '/api/services/requests/me', CT)));
      const r = await ServiceRequest.findById(reqB.request.id).lean();
      expect(r.status === 'NO_RESPONSE' && r.refundStatus === 'pending' && r.refundAmount === 69, `${r.status} ${r.refundStatus} ${r.refundAmount}`);
    });
    await check('Refund shows in admin Refunds list', async () => {
      const admin = await AdminUser.findOne({ role: 'super_admin' }) || await AdminUser.findOne();
      const r = await call('GET', '/api/admin/refunds', jwt.sign({ sub: admin.id, kind: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' }));
      expect(r.status === 200 && r.data.some((x) => x.kind === 'service' && x.id === reqB.request.id), `status ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
    });
    await check('Unanswered free request is given back', async () => {
      await ServiceRequest.deleteMany({ _id: reqA.id });
      const r1 = await call('POST', '/api/services/requests', CT, { partnerId: A.p.id, eventDate: '22/03/2027', message: 'E2E again', consent: true });
      await ServiceRequest.collection.updateOne({ _id: new mongoose.Types.ObjectId(r1.data.request.id) }, { $set: { createdAt: new Date(Date.now() - 25 * 3600 * 1000) } });
      const c = await call('GET', '/api/services/config', CT);
      expect(r1.data.request.fee === 0 && c.data.freeLeft === 1, `fee ${r1.data.request.fee}, freeLeft ${c.data.freeLeft}`);
    });
  } finally {
    await ServiceRequest.deleteMany({ $or: [{ partner: { $in: svc } }, { customer: cust._id, message: /^E2E/ }] });
    await ServiceOffer.deleteMany({ partner: { $in: svc } });
    await Partner.deleteMany({ _id: { $in: svc } });
    await Config.updateOne({ _id: Config.SINGLETON_ID }, { $set: { servicesMode: cfg0.servicesMode || 'off', serviceTesterPhones: cfg0.serviceTesterPhones || [], serviceFreeQuotes: cfg0.serviceFreeQuotes ?? 2, serviceQuoteFees: cfg0.serviceQuoteFees || { priest: 49, music: 69, decor: 79, catering: 89 } } });
  }

  // ---------- FARM HOUSES (online booking per slot) ----------
  {
    const FarmHouse = M('FarmHouse'), FarmBooking = M('FarmBooking');
    const fp = await Partner.create({ phone: '+919999911201', firebaseUid: 'e2e-farm-' + Date.now(), role: 'farm', businessName: 'E2E Farms', ownerName: 'E2E', registered: true, verificationStatus: 'verified', area: 'Moinabad' });
    const FT = tok(fp.id, 'partner');
    const ymd = (days) => new Date(Date.now() + 330 * 60000 + days * 86400000).toISOString().slice(0, 10);
    const D = ymd(20); // check-in date ~3 weeks out
    let farm, fb;
    try {
      await check('Farm: other roles cannot list farm houses', async () => {
        const r = await call('POST', '/api/farms/me/farms', VT, { name: 'Nope' }); expect(r.status === 403, 'got ' + r.status);
      });
      await check('Farm: must offer a priced stay type', async () => {
        const r = await call('POST', '/api/farms/me/farms', FT, { name: 'E2E Green Acres', slots: { day: { enabled: true, weekdayPrice: 0 } } });
        expect(r.status === 400, JSON.stringify(r.data));
      });
      await check('Farm: owner lists a farm house', async () => {
        const r = await call('POST', '/api/farms/me/farms', FT, {
          name: 'E2E Green Acres', about: 'Test', address: 'Plot 1, secret road', lat: 17.33, lng: 78.27, maxGuests: 40, includedGuests: 20, extraGuestCharge: 300,
          bedrooms: 3, amenities: ['pool', 'lawn', 'bogus'], securityDeposit: 5000, advancePct: 30,
          slots: { day: { enabled: true, start: '09:00', end: '18:00', weekdayPrice: 10000, weekendPrice: 15000 }, night: { enabled: true, start: '19:00', end: '09:00', weekdayPrice: 12000 }, fullDay: { enabled: true, start: '11:00', end: '10:00', weekdayPrice: 20000 } },
          rules: { alcoholAllowed: true, musicTill: '22:00' },
        });
        farm = r.data;
        expect(r.status === 200 && farm.amenities.join() === 'pool,lawn' && farm.fromPrice === 10000, JSON.stringify(r.data).slice(0, 200));
      });
      await check('Farm: public list hides the exact address', async () => {
        const r = await call('GET', '/api/farms?lat=17.40&lng=78.40');
        const f = (r.data || []).find((x) => x.id === farm.id);
        expect(r.status === 200 && f && f.address === undefined && typeof f.km === 'number', JSON.stringify(f).slice(0, 200));
      });
      await check('Farm: quote adds extra guests', async () => {
        const r = await call('POST', `/api/farms/${farm.id}/quote`, null, { date: D, slot: 'day', guests: 25 });
        const base = [0, 6].includes(new Date(D + 'T00:00:00Z').getUTCDay()) ? 15000 : 10000;
        expect(r.status === 200 && r.data.basePrice === base && r.data.extraGuestCharge === 1500 && r.data.advanceAmount === Math.round((base + 1500) * 0.3), JSON.stringify(r.data));
        return `₹${r.data.total}, advance ₹${r.data.advanceAmount}`;
      });
      await check('Farm: over max guests refused', async () => {
        const r = await call('POST', `/api/farms/${farm.id}/quote`, null, { date: D, slot: 'day', guests: 41 }); expect(r.status === 409, JSON.stringify(r.data));
      });
      await check('Farm: guest cannot book', async () => {
        const r = await call('POST', `/api/farms/${farm.id}/book`, guestTok, { date: D, slot: 'fullDay', guests: 10 }); expect(r.status === 403 || r.status === 401, 'got ' + r.status);
      });
      await check('Farm: book Full day → pay advance → confirmed', async () => {
        const r = await call('POST', `/api/farms/${farm.id}/book`, CT, { date: D, slot: 'fullDay', guests: 10, occasion: 'Birthday' });
        expect(r.status === 200 && r.data.payment.orderId && r.data.booking.address === '', JSON.stringify(r.data).slice(0, 200));
        fb = r.data.booking;
        const pid = 'pay_e2e_farm_' + Date.now();
        const bad = await call('POST', `/api/farms/bookings/${fb.id}/verify`, CT, { razorpay_order_id: r.data.payment.orderId, razorpay_payment_id: pid, razorpay_signature: 'x' });
        expect(bad.data.verified === false, 'bad signature accepted');
        const v = await call('POST', `/api/farms/bookings/${fb.id}/verify`, CT, { razorpay_order_id: r.data.payment.orderId, razorpay_payment_id: pid, razorpay_signature: sign(r.data.payment.orderId, pid) });
        expect(v.data.verified && v.data.booking.status === 'confirmed' && v.data.booking.address === 'Plot 1, secret road' && v.data.booking.ownerPhone === '+919999911201', JSON.stringify(v.data).slice(0, 300));
        const credit = await PayoutEntry.findOne({ reference: fb.id, type: 'credit' });
        expect(credit && credit.amount === Math.round(fb.advanceAmount * 0.9), 'credit ' + (credit && credit.amount));
        return `${fb.code} advance ₹${fb.advanceAmount}`;
      });
      await check('Farm: Full day blocks that Day, Night and next morning', async () => {
        const next = new Date(Date.parse(D + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
        const day = await call('POST', `/api/farms/${farm.id}/quote`, null, { date: D, slot: 'day', guests: 5 });
        const night = await call('POST', `/api/farms/${farm.id}/quote`, null, { date: D, slot: 'night', guests: 5 });
        const nextDay = await call('POST', `/api/farms/${farm.id}/quote`, null, { date: next, slot: 'day', guests: 5 });
        const nextNight = await call('POST', `/api/farms/${farm.id}/quote`, null, { date: next, slot: 'night', guests: 5 });
        expect(day.status === 409 && night.status === 409 && nextDay.status === 409 && nextNight.status === 200, `${day.status} ${night.status} ${nextDay.status} ${nextNight.status}`);
      });
      await check('Farm: calendar shows booked / free', async () => {
        const r = await call('GET', `/api/farms/${farm.id}/availability?month=${D.slice(0, 7)}`);
        expect(r.status === 200 && r.data[D].fullDay === 'booked' && r.data[D].day === 'booked', JSON.stringify(r.data[D]));
      });
      await check('Farm: owner sees the booking with customer phone', async () => {
        const r = await call('GET', '/api/farms/me/bookings', FT);
        const b = (r.data || []).find((x) => x.id === fb.id);
        expect(b && b.customerPhone === '+919999900000' && b.youReceiveOnline === Math.round(fb.advanceAmount * 0.9), JSON.stringify(b));
      });
      await check('Farm: owner closed dates cannot be booked', async () => {
        const d2 = ymd(40);
        await call('PUT', `/api/farms/me/farms/${farm.id}/blocked-dates`, FT, { dates: [d2] });
        const r = await call('POST', `/api/farms/${farm.id}/quote`, null, { date: d2, slot: 'day', guests: 5 });
        await call('PUT', `/api/farms/me/farms/${farm.id}/blocked-dates`, FT, { dates: [] });
        expect(r.status === 409, 'got ' + r.status);
      });
      await check('Farm: cannot complete before check-in', async () => {
        const r = await call('PATCH', `/api/farms/me/bookings/${fb.id}`, FT, { action: 'complete' }); expect(r.status === 400, 'got ' + r.status);
      });
      await check('Farm: account deletion blocked by upcoming stay', async () => {
        const r = await call('DELETE', '/api/partner-auth/me', FT); expect(r.status === 400 || r.status === 409, `got ${r.status} ${JSON.stringify(r.data)}`);
      });
      await check('Farm: customer cancels within 2h → full refund, owner debited', async () => {
        const r = await call('POST', `/api/farms/bookings/${fb.id}/cancel`, CT);
        const debit = await PayoutEntry.findOne({ reference: fb.id, type: 'debit' });
        expect(r.status === 200 && r.data.refundPct === 100 && r.data.booking.refundStatus === 'pending' && r.data.booking.refundAmount === fb.advanceAmount && r.data.booking.address === '', JSON.stringify(r.data).slice(0, 300));
        expect(debit && debit.amount === Math.round(fb.advanceAmount * 0.9), 'debit ' + (debit && debit.amount));
        const again = await call('POST', `/api/farms/bookings/${fb.id}/cancel`, CT); expect(again.status === 400, 'double cancel ' + again.status);
      });
      await check('Farm: cancelled stay frees the slot', async () => {
        const r = await call('POST', `/api/farms/${farm.id}/quote`, null, { date: D, slot: 'day', guests: 5 }); expect(r.status === 200, 'got ' + r.status);
      });
      await check('Farm: refund policy 7d / 72h / late', async () => {
        const { customerRefundPct } = require(path.join(BACKEND, 'routes/farms'));
        const { nowMinIST } = require(path.join(BACKEND, 'lib/farmAvailability'));
        const old = new Date(Date.now() - 5 * 3600000);
        const pct = (h) => customerRefundPct({ createdAt: old, startMin: nowMinIST() + h * 60 });
        expect(pct(8 * 24) === 100 && pct(100) === 50 && pct(24) === 0 && customerRefundPct({ createdAt: new Date(), startMin: nowMinIST() + 60 }) === 100, `${pct(8 * 24)} ${pct(100)} ${pct(24)}`);
      });
      await check('Admin: farm listings, bookings, refund queue', async () => {
        const admin = await AdminUser.findOne({ role: 'super_admin' }) || await AdminUser.findOne();
        const AT = jwt.sign({ sub: admin.id, kind: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const l = await call('GET', '/api/admin/farms', AT), b = await call('GET', '/api/admin/farm-bookings', AT), rf = await call('GET', '/api/admin/refunds', AT);
        const rfList = Array.isArray(rf.data) ? rf.data : rf.data.rows || rf.data.refunds || [];
        expect(l.data.some((x) => x.id === farm.id) && b.data.some((x) => x.id === fb.id) && rfList.some((x) => x.kind === 'farm' && x.id === fb.id), `${l.status} ${b.status} ${rf.status} ${JSON.stringify(rf.data).slice(0, 120)}`);
      });
    } finally {
      const ids = (await FarmBooking.find({ partner: fp._id })).map((b) => b.id);
      await PayoutEntry.deleteMany({ reference: { $in: ids } });
      await FarmBooking.deleteMany({ partner: fp._id });
      await FarmHouse.deleteMany({ partner: fp._id });
      await Partner.deleteOne({ _id: fp._id });
    }
  }

  // ---------- GOOGLE SIGN-IN: CONTACT NUMBER BEFORE BOOKING ----------
  {
    const g = await User.create({ firebaseUid: 'e2e-google-' + Date.now(), authMethod: 'google', name: 'E2E Google', email: 'e2e@example.com', registered: true });
    created.users.push(g.id);
    const GT = tok(g.id);
    await check('Google user without a number is asked for one before booking', async () => {
      const r = await call('POST', '/api/payments/create-order', GT, { hallId: hall.id });
      expect(r.status === 400 && r.data.code === 'PHONE_REQUIRED', `${r.status} ${JSON.stringify(r.data)}`);
    });
    await check('Contact number: invalid rejected, valid saved (no OTP)', async () => {
      const bad = await call('PUT', '/api/auth/me/contact-phone', GT, { phone: '12345' });
      const ok = await call('PUT', '/api/auth/me/contact-phone', GT, { phone: '98765 43210' });
      expect(bad.status === 400 && ok.status === 200 && ok.data.user.phone === '+919876543210' && ok.data.user.phoneVerified === false, JSON.stringify(ok.data));
    });
    await check('Phone-login users cannot overwrite their verified number', async () => {
      const r = await call('PUT', '/api/auth/me/contact-phone', CT, { phone: '9876543210' }); expect(r.status === 400, 'got ' + r.status);
    });
    await check('Google user with a contact number can book', async () => {
      const r = await call('POST', '/api/payments/create-order', GT, { hallId: hall.id }); expect(r.status === 200 && r.data.orderId, JSON.stringify(r.data));
    });
  }

  // ---------- AREA ANALYTICS ----------
  const custBefore = await User.findById(cust._id).lean();
  try {
    await check('Localities list for the area picker', async () => {
      const r = await call('GET', '/api/auth/localities'); expect(r.status === 200 && r.data.includes('Dilsukhnagar') && r.data.includes('HITEC City'), String(r.data).slice(0, 80));
    });
    await check('Customer area: only listed areas accepted', async () => {
      const bad = await call('PUT', '/api/auth/me/area', CT, { area: 'Mars' });
      const ok = await call('PUT', '/api/auth/me/area', CT, { area: 'Dilsukhnagar' });
      expect(bad.status === 400 && ok.status === 200 && ok.data.area === 'Dilsukhnagar', `bad ${bad.status}, ok ${JSON.stringify(ok.data)}`);
    });
    await check('Location is rounded (~1 km) and mapped to a locality', async () => {
      const r = await call('PUT', '/api/auth/me/location', CT, { lat: 17.448312, lng: 78.391487 });
      const u = await User.findById(cust._id).lean();
      expect(r.status === 200 && u.approxLat === 17.45 && u.approxLng === 78.39 && u.locArea === 'Madhapur', JSON.stringify({ lat: u.approxLat, lng: u.approxLng, area: u.locArea }));
    });
    await check('Admin area analytics counts the customer in their area', async () => {
      const admin = await AdminUser.findOne({ role: 'super_admin' }) || await AdminUser.findOne();
      const r = await call('GET', '/api/admin/analytics/areas', jwt.sign({ sub: admin.id, kind: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' }));
      const row = (r.data.rows || []).find((x) => x.area === 'Dilsukhnagar');
      expect(r.status === 200 && row && row.customers >= 1 && row.customersAreaPicked >= 1, `status ${r.status} row ${JSON.stringify(row)}`);
    });
  } finally {
    await User.updateOne({ _id: cust._id }, { $set: { area: custBefore.area || '', locArea: custBefore.locArea || '', approxLat: custBefore.approxLat ?? null, approxLng: custBefore.approxLng ?? null, locatedAt: custBefore.locatedAt ?? null } });
  }

  // ---------- DELETE ACCOUNT ----------
  await check('Guest deletes account', async () => { const r = await call('DELETE', '/api/auth/me', guestTok); expect(r.status === 200, JSON.stringify(r.data)); const m = await call('GET', '/api/auth/me', guestTok); expect(m.status === 401, 'still valid'); });

  // ---------- CLEANUP ----------
  try {
    await Booking.deleteMany({ _id: { $in: created.bookings } });
    await Order.deleteMany({ _id: { $in: created.orders } });
    await Quote.deleteMany({ _id: { $in: created.quotes } });
    await Item.deleteMany({ _id: { $in: created.items } });
    await Package.deleteMany({ _id: { $in: created.packages } });
    await PayoutEntry.deleteMany({ reference: { $in: created.payoutRefs } });
    await Message.deleteMany({ createdAt: { $gte: msgSince }, text: /^E2E/ });
    // Adding an item teaches the shared 'common items' list — remove what the test taught it.
    await M('ItemPreset').deleteMany({ name: /^E2E/i });
    await User.deleteMany({ _id: { $in: created.users } });
    results.push(['INFO', 'Cleanup', 'all test records removed']);
  } catch (e) { results.push(['FAIL', 'Cleanup', e.message]); }

  const pass = results.filter((r) => r[0] === 'PASS').length, fail = results.filter((r) => r[0] === 'FAIL').length;
  for (const r of results) console.log(r[0].padEnd(5), r[1].padEnd(52), r[2]);
  console.log(`\n${pass} passed, ${fail} failed`);
  await mongoose.disconnect();
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
