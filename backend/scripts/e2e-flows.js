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
const [User, Partner, Hall, Booking, Order, Quote, Message, PayoutEntry, Item, Package, Shop] =
  ['User', 'Partner', 'Hall', 'Booking', 'Order', 'Quote', 'Message', 'PayoutEntry', 'Item', 'Package', 'Shop'].map(M);

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
    await Shop.updateOne({ partner: tent.id }, { $set: { deliveryFee: 250, setupFee: 100 } });
    try {
      const mk = (mode) => ({ groups: [{ vendorId: tent.id, lines: [{ itemId: p.id, name: p.name, qty: 1 }] }], deliveryMode: mode, payMode: 'full' });
      const del = (await call('POST', '/api/payments/create-order', CT, { cart: mk('delivery') })).data.amount / 100;
      const pick = (await call('POST', '/api/payments/create-order', CT, { cart: mk('pickup') })).data.amount / 100;
      expect(del - pick === 350, `delivery adds ₹${del - pick}, expected ₹350`);
      const pub = (await call('GET', '/api/vendors/' + tent.id)).data;
      expect(pub.deliveryFee === 250 && pub.setupFee === 100, 'vendor page fees ' + JSON.stringify([pub.deliveryFee, pub.setupFee]));
    } finally {
      await Shop.updateOne({ partner: tent.id }, { $set: { deliveryFee: before.deliveryFee || 0, setupFee: before.setupFee || 0 } });
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
  for (const st of ['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED']) {
    await check('Vendor order → ' + st, async () => { const r = await call('PATCH', '/api/vendors/me/orders/' + orderId, TT, { status: st }); expect(r.status === 200 && r.data.status === st, JSON.stringify(r.data)); });
  }

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
