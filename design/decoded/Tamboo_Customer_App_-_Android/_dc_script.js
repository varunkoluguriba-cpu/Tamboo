
const DEF_EV = { name: 'Sangeet Night', type: 'Wedding', date: '2026-10-05', setup: '14:00', start: '18:00', end: '23:30', pickup: '2026-10-06', guests: 150, venue: 'Outdoor', address: 'Villa 14, Aparna Sarovar, Nallagandla, Hyderabad', cats: ['tent', 'seat', 'table'], budget: '₹40k – ₹60k', notes: '' };
const ME = 'Anjali Sharma';
const DEF = () => ({ splashOn: true, screen: 'intro', stack: [], intro: 0, lang: 'en', device: 'ios', phone: '', otp: '', err: '', reg: { name: '', email: '', city: 'Hyderabad' }, registered: false,
  ev: { ...DEF_EV }, q: '', cat: '', sort: 'relevance', verifiedOnly: false, instantOnly: false, resTab: 'items', vendorId: 'v1', productId: 'p2', qty: {},
  cart: [], coupon: '', couponApplied: '', delivery: 'setup', agree: true, payMode: 'full', payMethod: 'upi', holdEnds: 0, payFor: null, lastOrder: [],
  bookingId: 'TM-240917', bTab: 'active', modal: null, cancelReason: '', stars: 0, reviewText: '', dType: 'Late delivery', dDesc: '', chatText: '',
  sheet: false, intent: 'both', homeMode: 'rentals', venueId: 'h1', tokenId: null, vType: '', vAc: false, vCrockery: false, vOutside: false, vSort: 'distance', vSlot: 'Full day', tkAgree: false, visitDay: '', visitTime: '11:00 AM', langSheet: false, quoteVendor: 'v2', quoteNeed: '', toast: '', addrs: ['Villa 14, Aparna Sarovar, Nallagandla, Hyderabad', 'Flat 302, My Home Avatar, Narsingi, Hyderabad'], newAddr: '', notif: { push: true, sms: true, wa: false } });

class Component extends DCLogic {
  state = { ...DEF(), ready: false, now: Date.now() };
  scrollRef = React.createRef();
  phoneRef = React.createRef();
  componentDidMount() {
    this.st0 = setTimeout(() => this.setState({ splashOn: false }), 1800);
    const init = () => {
      if (!window.TM || !window.UI18N) return setTimeout(init, 40);
      this.unsub = TM.subscribe(() => this.forceUpdate());
      let sv = null; try { sv = JSON.parse(localStorage.getItem('utsaviyana_cust_ui') || 'null'); } catch (e) { }
      if (sv && sv.screen === 'pay') sv.screen = 'cart';
      this.setState({ ...(sv || {}), ready: true });
    };
    init();
    const tr = () => { const el = document.querySelector('[data-ut-phone]'); if (!window.UTX || !el || !this.state.ready) return setTimeout(tr, 100); this.trOn = true; UTX.attach(el, (x) => this.setState({ trStatus: x })); UTX.setLang(this.state.lang); };
    tr();
    this.tick = setInterval(() => {
      if (['token', 'tokenDone', 'home'].includes(this.state.screen) || (this.state.screen === 'bookings' && this.state.bTab === 'halls')) return this.setState({ now: Date.now() });
      if (this.state.screen !== 'pay') return;
      if (this.state.holdEnds && Date.now() > this.state.holdEnds) { this.setState({ screen: 'cart', holdEnds: 0 }); this.flash('Hold expired. The items were released back to the vendor.'); }
      else this.setState({ now: Date.now() });
    }, 1000);
  }
  componentWillUnmount() { this.unsub && this.unsub(); clearInterval(this.tick); }
  componentDidUpdate() {
    const st = this.state; const ps = this._ps || {}; this._ps = { ...st };
    if (ps.screen !== st.screen && this.scrollRef.current) this.scrollRef.current.scrollTop = 0;
    if (ps.lang !== st.lang && window.UTX && this.trOn) UTX.setLang(st.lang);
    if (st.ready) { const { screen, stack, lang, device, ev, cart, bookingId, registered, reg, addrs, intent, homeMode, venueId, tokenId } = st; localStorage.setItem('utsaviyana_cust_ui', JSON.stringify({ screen: screen === 'tokenPay' ? 'venue' : screen, stack, lang, device, ev, cart, bookingId, registered, reg, addrs, intent, homeMode, venueId, tokenId })); }
  }
  flash(msg) { clearTimeout(this.tt); this.setState({ toast: msg }); this.tt = setTimeout(() => this.setState({ toast: '' }), 2800); }
  go(screen, extra) { this.setState(s => ({ stack: [...s.stack, s.screen], screen, modal: null, sheet: false, ...(extra || {}) })); }
  tab(screen, extra) { this.setState({ screen, stack: [], modal: null, sheet: false, ...(extra || {}) }); }
  back() { this.setState(s => { const st = [...s.stack]; const p = st.pop() || 'home'; return { screen: p, stack: st, modal: null }; }); }
  setEv(k, v) { this.setState(s => ({ ev: { ...s.ev, [k]: v } })); }
  now() { return new Date().toTimeString().slice(0, 5); }

  placeOrder(pr) {
    const st = this.state; const T = TM;
    if (st.payFor) {
      let bid;
      T.update(s => {
        const q = s.quotes.find(x => x.id === st.payFor); const ver = q.versions[q.versions.length - 1];
        bid = 'UT-' + (250100 + s.bookings.length);
        q.status = 'ACCEPTED'; q.booking = bid;
        const paid = st.payMode === 'full' ? ver.total : Math.round(ver.total * 0.3);
        s.bookings.unshift({ id: bid, v: q.v, customer: ME, phone: '+91 •••• 4410', event: q.event, type: st.ev.type, date: q.date, guests: q.guests, address: st.ev.address, lines: [], quoteTotal: ver.total, quoteLines: ver.lines, status: 'CONFIRMED', paid: st.payMode === 'full' ? 'FULL' : 'ADVANCE', paidAmount: paid, created: T.TODAY, history: [['CONFIRMED', T.TODAY + ' ' + this.now()]], snap: { subtotal: ver.total, delivery: 0, setup: 0, pickup: 0, discount: 0, platformFee: 0, tax: 0, deposit: 0, total: ver.total } });
        s.customerBookings.unshift(bid);
        s.notifications.push({ to: 'vendor', v: q.v, text: `Quote ${q.id} accepted: booking ${bid} confirmed`, at: T.TODAY + ' ' + this.now() });
      });
      this.setState({ lastOrder: [bid], payFor: null, holdEnds: 0 }); this.tab('confirm'); return;
    }
    const live = T.load();
    for (const [pid, q] of st.cart) { const a = T.available(live, pid, st.ev.date); if (q > a.free) { this.flash(`Only ${a.free} × ${T.prod(pid).name} left for your date. Someone just booked them. Please update your cart.`); this.tab('cart'); return; } }
    const byV = {}; st.cart.forEach(l => { const v = T.prod(l[0]).v; (byV[v] = byV[v] || []).push(l); });
    const ids = [];
    T.update(s => {
      const base = 250100 + s.bookings.length; const vs = Object.keys(byV);
      vs.forEach((v, i) => {
        const id = 'UT-' + base + (vs.length > 1 ? '-' + String.fromCharCode(65 + i) : '');
        const snap = T.price(s, byV[v], { coupon: i === 0 ? st.couponApplied : '', noSetup: st.delivery === 'drop' });
        const paid = st.payMode === 'full' ? snap.total : Math.round(snap.total * 0.3);
        s.bookings.unshift({ id, v, customer: ME, phone: '+91 •••• 4410', event: st.ev.name, type: st.ev.type, date: st.ev.date, guests: +st.ev.guests, address: st.ev.address, lines: byV[v], status: 'PENDING', paid: st.payMode === 'full' ? 'FULL' : 'ADVANCE', paidAmount: paid, created: T.TODAY, history: [['PENDING', T.TODAY + ' ' + this.now()]], snap, delivery: st.delivery, notes: st.ev.notes });
        s.customerBookings.unshift(id); ids.push(id);
        s.notifications.push({ to: 'vendor', v, text: `New booking ${id}: ${st.ev.name}, ${T.fmtShort(st.ev.date)}`, at: T.TODAY + ' ' + this.now() });
      });
    });
    this.setState({ lastOrder: ids, cart: [], couponApplied: '', coupon: '', holdEnds: 0 }); this.tab('confirm');
  }

  renderVals() {
    const st = this.state, T = window.TM, U = window.UI18N;
    if (!T || !U || !st.ready) return { frame: { w: 412, h: 866, r: 56, ir: 46 }, is: {} };
    const s = T.load(), c = s.config, ev = st.ev, t = U.t(st.lang);
    const I = T.iconSet(React, 20), Is = T.iconSet(React, 15), Ib = T.iconSet(React, 26);
    const SCR = ['intro', 'lang', 'login', 'otp', 'register', 'home', 'event', 'browse', 'vendor', 'product', 'cart', 'checkout', 'pay', 'confirm', 'bookings', 'booking', 'chat', 'quote', 'notifs', 'profile', 'venues', 'venue', 'tokenPay', 'tokenDone', 'token'];
    const is = {}; SCR.forEach(k => is[k] = st.screen === k);
    const self = this;
    const chip = (on) => on ? { bg: 'linear-gradient(135deg,#4d0013,#e75480)', color: '#fff', border: 'transparent' } : { bg: '#fff', color: '#1e1b2e', border: '#f0e3ea' };
    const ios = false;
    const frame = ios ? { w: 412, h: 866, r: 58, ir: 48, time: '9:41', notchW: 120, notchH: 34, notchTop: 8 } : { w: 412, h: 866, r: 40, ir: 30, time: '12:30', notchW: 14, notchH: 14, notchTop: 14 };
    const vOK = (id) => s.vendorStatus[id] === 'VERIFIED';
    const catName = (id) => (T.CATEGORIES.find(x => x.id === id) || {}).name;
    const suggested = (p) => { const g = +ev.guests || 0; if (p.cat === 'seat' && p.unit.includes('unit')) return Math.max(p.min, g); if (p.cat === 'table') return Math.max(p.min, Math.ceil(g / 8)); if (p.cat === 'crockery') return Math.max(p.min, g); return p.min; };
    const qtyOf = (p) => st.qty[p.id] ?? suggested(p);
    const cartCount = st.cart.length;

    const itemRow = (p) => {
      const v = T.vendor(p.v), a = T.available(s, p.id, ev.date);
      return { id: p.id, img: T.photo(p.id), name: p.name, vendor: v.name, price: T.inr(p.price), unit: p.unit, rating: v.rating, cat: catName(p.cat),
        avail: !p.instant ? 'Custom quote' : a.free > 0 ? `${a.free.toLocaleString('en-IN')} free on ${T.fmtShort(ev.date)}` : `Booked out on ${T.fmtShort(ev.date)}`,
        availBg: !p.instant ? '#f3eefd' : a.free > 0 ? '#e8f7f0' : '#fdecec', availColor: !p.instant ? '#6d28d9' : a.free > 0 ? '#047857' : '#b91c1c',
        open: () => self.go('product', { productId: p.id }) };
    };
    // browse
    const ql = st.q.trim().toLowerCase();
    let prods = T.PRODUCTS.filter(p => (!st.cat || p.cat === st.cat) && (!ql || (p.name + ' ' + T.vendor(p.v).name + ' ' + catName(p.cat)).toLowerCase().includes(ql)) && (!st.verifiedOnly || vOK(p.v)) && (!st.instantOnly || p.instant));
    const sorters = { relevance: (a, b) => T.available(s, b.id, ev.date).free - T.available(s, a.id, ev.date).free, price: (a, b) => a.price - b.price, rating: (a, b) => T.vendor(b.v).rating - T.vendor(a.v).rating, distance: (a, b) => T.vendor(a.v).km - T.vendor(b.v).km };
    prods = prods.slice().sort(sorters[st.sort]);
    let vends = T.VENDORS.filter(v => (!ql || (v.name + ' ' + v.area).toLowerCase().includes(ql)) && (!st.verifiedOnly || vOK(v.id)) && (!st.cat || T.PRODUCTS.some(p => p.v === v.id && p.cat === st.cat)));
    vends = vends.slice().sort(st.sort === 'rating' ? (a, b) => b.rating - a.rating : (a, b) => a.km - b.km);
    const vendorRow = (v) => ({ id: v.id, img: T.photo(v.id), name: v.name, area: v.area, rating: v.rating, reviews: v.reviews, km: v.km + ' km', verified: vOK(v.id), years: v.years + ' yrs', initials: v.name.split(' ').map(w => w[0]).slice(0, 2).join(''), open: () => self.go('vendor', { vendorId: v.id }) });

    // vendor + product
    const V = T.vendor(st.vendorId);
    const P = T.prod(st.productId), PV = T.vendor(P.v), PA = T.available(s, P.id, ev.date), pq = qtyOf(P);
    const step = P.min >= 50 ? 10 : 1;
    const canAdd = P.instant && pq >= P.min && pq <= PA.free;
    // cart
    const pr = T.price(s, st.cart, { coupon: st.couponApplied, noSetup: st.delivery === 'drop' });
    const groups = pr.vids.map(vid => ({ vendor: T.vendor(vid).name, lines: st.cart.filter(l => T.prod(l[0]).v === vid).map(([pid, q]) => { const p = T.prod(pid), a = T.available(s, pid, ev.date); return { name: p.name, qty: q, unit: p.unit, total: T.inr(p.price * q), warn: q > a.free ? `Only ${a.free} free on your date` : '',
      inc: () => self.setState(x => ({ cart: x.cart.map(l => l[0] === pid ? [pid, l[1] + (p.min >= 50 ? 10 : 1)] : l) })),
      dec: () => self.setState(x => ({ cart: x.cart.map(l => l[0] === pid ? [pid, Math.max(p.min, l[1] - (p.min >= 50 ? 10 : 1))] : l) })),
      remove: () => self.setState(x => ({ cart: x.cart.filter(l => l[0] !== pid) })) }; }) }));
    const bd = (p) => [['Rental subtotal', p.subtotal], ['Delivery', p.delivery], ['Setup', p.setup], ['Pickup', p.pickup], ['Discount', -p.discount], [`Platform fee (${c.platformFee}%)`, p.platformFee], [`GST (${c.gst}%)`, p.tax], ['Refundable deposit', p.deposit]].filter(r => r[1]).map(([label, v]) => ({ label, value: (v < 0 ? '− ' : '') + T.inr(Math.abs(v)) }));
    // pay
    const quote = st.payFor ? s.quotes.find(x => x.id === st.payFor) : null;
    const qv = quote ? quote.versions[quote.versions.length - 1] : null;
    const payTotal = quote ? qv.total : pr.total;
    const due = st.payMode === 'full' ? payTotal : Math.round(payTotal * 0.3);
    const left = Math.max(0, Math.floor(((st.holdEnds || 0) - st.now) / 1000));
    // bookings
    const mine = s.bookings.filter(b => s.customerBookings.includes(b.id));
    const snapOf = (b) => b.snap || T.price(s, b.lines);
    const bRow = (b) => ({ id: b.id, event: b.event, vendor: T.vendor(b.v).name, date: T.fmtShort(b.date), status: T.STATUS_LABEL[b.status] || b.status, total: T.inr(snapOf(b).total),
      sBg: b.status === 'CANCELLED' ? '#f4f4f5' : b.status === 'DISPUTED' ? '#fdecec' : b.status === 'COMPLETED' ? '#e8f7f0' : b.status === 'PENDING' ? '#fff4e5' : '#fdeef3',
      sColor: b.status === 'CANCELLED' ? '#52525b' : b.status === 'DISPUTED' ? '#b91c1c' : b.status === 'COMPLETED' ? '#047857' : b.status === 'PENDING' ? '#b45309' : '#a0133f',
      open: () => self.go('booking', { bookingId: b.id }) });
    const activeB = mine.filter(b => !['COMPLETED', 'CANCELLED'].includes(b.status));
    const pastB = mine.filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status));
    const myQuotes = s.quotes.filter(q => q.customer === ME).map(q => { const lv = q.versions[q.versions.length - 1]; return { id: q.id, vendor: T.vendor(q.v).name, event: q.event, date: T.fmtShort(q.date), need: q.need,
      status: { REQUESTED: 'Waiting for vendor', QUOTED: 'Quote received', ACCEPTED: 'Accepted', REJECTED: 'Declined', REVISION: 'Revision requested' }[q.status] || q.status,
      hasOffer: q.status === 'QUOTED', total: lv ? T.inr(lv.total) : '', version: lv ? 'v' + lv.v : '', note: lv ? lv.note : '', lines: lv ? lv.lines.map(l => ({ label: l.label, amount: T.inr(l.amount) })) : [],
      accept: () => self.go('pay', { payFor: q.id, holdEnds: Date.now() + c.holdMin * 60000, payMode: 'advance' }),
      reject: () => { T.update(x => { x.quotes.find(y => y.id === q.id).status = 'REJECTED'; }); self.flash('Quote declined'); },
      revise: () => { T.update(x => { x.quotes.find(y => y.id === q.id).status = 'REVISION'; x.notifications.push({ to: 'vendor', v: q.v, text: `Revision requested on ${q.id}`, at: T.TODAY }); }); self.flash('Revision request sent to vendor'); } }; });
    // booking detail
    const B = s.bookings.find(b => b.id === st.bookingId) || mine[0];
    let bd2 = {}, timeline = [], bItems = [], refund = {};
    if (B) {
      const sn = snapOf(B), steps = ['PENDING', ...T.FLOW];
      const hist = {}; (B.history || []).forEach(([k, at]) => hist[k] = at);
      let cur = steps.indexOf(B.status); if (cur < 0) { const hs = (B.history || []).map(h => steps.indexOf(h[0])).filter(i => i >= 0); cur = hs.length ? Math.max(...hs) : 0; }
      timeline = steps.map((k, i) => ({ label: T.STATUS_LABEL[k], time: hist[k] || '', dotBg: i < cur ? '#e75480' : i === cur ? 'linear-gradient(135deg,#4d0013,#e75480)' : '#fff', dotBorder: i <= cur ? 'transparent' : '#e9d9e1', color: i <= cur ? '#1e1b2e' : '#a39cb4', weight: i === cur ? 800 : 600, line: i < cur ? '#e75480' : '#efe3e9', last: i === steps.length - 1 }));
      bItems = B.lines.length ? B.lines.map(([pid, q]) => ({ name: T.prod(pid).name, qty: q.toLocaleString('en-IN') + ' × ' + T.inr(T.prod(pid).price), total: T.inr(T.prod(pid).price * q) })) : (B.quoteLines || []).map(l => ({ name: l.label, qty: 'Quoted', total: T.inr(l.amount) }));
      const paid = B.paidAmount ?? (B.paid === 'FULL' ? sn.total : B.paid === 'ADVANCE' ? Math.round(sn.total * 0.3) : 0);
      const daysTo = Math.round((new Date(B.date) - new Date(T.TODAY)) / 864e5);
      const fee = B.status === 'PENDING' || daysTo >= c.cancelFreeDays ? 0 : Math.round(Math.max(0, paid - Math.min(paid, sn.deposit)) * c.cancelFeePct / 100);
      refund = { paid: T.inr(paid), fee: T.inr(fee), refund: T.inr(paid - fee), rule: B.status === 'PENDING' ? 'The vendor hasn’t accepted yet, so you get a full refund.' : daysTo >= c.cancelFreeDays ? `Your event is ${daysTo} days away, more than ${c.cancelFreeDays} days, so cancelling is free.` : `Your event is ${daysTo} days away, less than ${c.cancelFreeDays} days, so a ${c.cancelFeePct}% fee applies to the rental amount.`, amt: paid - fee };
      bd2 = { id: B.id, event: B.event, type: B.type, date: T.fmtDate(B.date), guests: B.guests, address: B.address, vendor: T.vendor(B.v).name, vendorArea: T.vendor(B.v).area, status: T.STATUS_LABEL[B.status], total: T.inr(sn.total), paid: T.inr(paid), paidLabel: B.paid === 'FULL' ? 'Paid in full' : B.paid === 'ADVANCE' ? 'Advance paid (30%)' : 'Unpaid', breakdown: bd(sn),
        canCancel: ['PENDING', 'CONFIRMED', 'PREPARING'].includes(B.status), canReview: B.status === 'COMPLETED' && !B.reviewed, reviewed: !!B.reviewed, canDispute: !['CANCELLED', 'DISPUTED', 'PENDING'].includes(B.status),
        cancelled: B.status === 'CANCELLED', disputed: B.status === 'DISPUTED', refundNote: B.refund != null ? `Refund of ${T.inr(B.refund)} started. It reaches your original payment method in 5–7 days.` : '' };
    }
    const chats = (B && s.chats[B.id]) || [];
    const msgs = chats.map(m => ({ t: m.t, at: m.at, mine: m.from === 'customer', notMine: m.from !== 'customer' }));
    const notifs = s.notifications.filter(n => n.to === 'customer').slice().reverse().map(n => ({ text: n.text, at: n.at, open: () => n.booking && self.go('booking', { bookingId: n.booking }) }));
    const upcoming = activeB[0];

    // halls & venues
    const vh = c.tokenVisitHours || 48;
    const hOK = (id) => s.vendorStatus[id] === 'VERIFIED';
    const g = +ev.guests || 0;
    const fmtTs = (ms) => new Date(ms).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    const mapUrl = (x) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(x.name + ', ' + x.address);
    const hallRow = (x) => { const a = T.venueFree(s, x.id, ev.date, st.vSlot); const fits = !g || x.floating >= g;
      return { id: x.id, img: T.photo(x.id), name: x.name, type: x.type, area: x.area, km: x.km + ' km', rating: x.rating, token: T.inr(x.token), cap: x.seated + ' seated · ' + x.floating + ' floating', acTxt: x.ac ? 'AC' : 'Non-AC',
        crTxt: x.crockery ? 'Crockery included' : 'No crockery', crBg: x.crockery ? '#e8f7f0' : '#fff7e6', crColor: x.crockery ? '#047857' : '#8a5a00',
        avail: !fits ? 'Too small for ' + g : a.free ? 'Free on ' + T.fmtShort(ev.date) : 'Taken on ' + T.fmtShort(ev.date), aBg: !fits ? '#f3f4f6' : a.free ? '#e8f7f0' : '#fdecec', aColor: !fits ? '#6b7280' : a.free ? '#047857' : '#b91c1c',
        open: () => self.go('venue', { venueId: x.id, hCalOff: Math.max(0, (new Date(ev.date + 'T00:00').getFullYear() - 2026) * 12 + new Date(ev.date + 'T00:00').getMonth() - 8) }) }; };
    let halls = T.VENUES.filter(x => hOK(x.id) && (!st.vType || x.type === st.vType) && (!st.vAc || x.ac) && (!st.vCrockery || x.crockery) && (!st.vOutside || /outside/i.test(x.catering)) && (!g || x.floating >= g));
    halls = halls.slice().sort({ distance: (a, b) => a.km - b.km, price: (a, b) => a.rent - b.rent, rating: (a, b) => b.rating - a.rating, capacity: (a, b) => b.floating - a.floating }[st.vSort]);
    const Hx = T.venue(st.venueId), Ha = T.venueFree(s, Hx.id, ev.date, st.vSlot), Hfits = !g || Hx.floating >= g;
    const H = { ...Hx, img: T.photo(Hx.id), verified: hOK(Hx.id), km: Hx.km + ' km', rent: T.inr(Hx.rent), token: T.inr(Hx.token), mapUrl: mapUrl(Hx), noCrockery: !Hx.crockery, crBg: Hx.crockery ? '#e8f7f0' : '#fff7e6',
      facts: [['Seating', Hx.seated + ' guests'], ['Floating', Hx.floating + ' guests'], ['Hall size', Hx.sqft.toLocaleString('en-IN') + ' sq ft'], ['Air conditioning', Hx.ac ? 'Yes, AC' : 'Non-AC'], ['Parking', Hx.parking + ' cars'], ['Rooms', Hx.rooms ? Hx.rooms + ' rooms' : 'None'], ['Crockery', Hx.crockery ? 'Included' : 'Not available', Hx.crockery ? '#047857' : '#b45309'], ['Kitchen', Hx.kitchen ? 'Available' : 'No kitchen'], ['Catering', Hx.catering], ['Decor', Hx.decor]].map(([k, v, color]) => ({ k, v, color: color || '#1e1b2e' })),
      availTxt: !Hfits ? 'This hall holds up to ' + Hx.floating + ' guests. You entered ' + g + '.' : Ha.blocked ? 'The hall is closed on this date.' : Ha.taken ? 'Already pre-booked for this date and slot. Try another slot or date.' : 'Available on ' + T.fmtDate(ev.date) + ' · ' + st.vSlot,
      aBg: Hfits && Ha.free ? '#e8f7f0' : '#fdecec', aColor: Hfits && Ha.free ? '#047857' : '#b91c1c', canPay: Hfits && Ha.free, payOp: Hfits && Ha.free ? 1 : .45 };
    const tkRow = (tk) => { const hv = T.venue(tk.h), stt = T.tokenStatus(tk, s), col = T.TOKEN_COLOR[stt], vb = T.visitBy(tk, s);
      return { id: tk.id, hall: hv.name, event: tk.event, date: T.fmtShort(tk.date), slot: tk.slot, guests: tk.guests, amount: T.inr(tk.amount), status: T.TOKEN_LABEL[stt], sBg: col[0], sColor: col[1], isActive: stt === 'ACTIVE', left: T.leftTxt(vb - T.nowTs()), visitBy: fmtTs(vb), mapUrl: mapUrl(hv), noCrockery: !hv.crockery,
        visitTxt: tk.visit ? 'Visit booked: ' + T.fmtShort(tk.visit.date) + ', ' + tk.visit.time : 'Visit not scheduled yet. Tap to pick a time.', visitBtn: tk.visit ? 'Change visit time' : 'Confirm visit time',
        note: { ACTIVE: tk.visit ? 'Visit booked for ' + T.fmtShort(tk.visit.date) + ' at ' + tk.visit.time + '. ' + hv.owner + ' has been told.' : 'Pick a visit time so the hall owner can meet you.', VISITED: 'You visited the hall. The owner will confirm the final price and booking.', CONVERTED: 'Booking confirmed' + (tk.finalRent ? ' at ' + T.inr(tk.finalRent) + ' rent. Your ' + T.inr(tk.amount) + ' token is adjusted in it.' : '.') + ' Pay the balance directly at the hall.', EXPIRED: 'You didn’t visit within ' + vh + ' hours, so the token expired and the date was released.', CANCELLED: 'The hall cancelled, so your full ' + T.inr(tk.amount) + ' is being refunded in 5–7 days.', CUST_CANCELLED: 'You cancelled within ' + (c.cancelWindowMin / 60) + ' hours of paying. Full ' + T.inr(tk.amount) + ' refund started, 5–7 days.', NOT_BOOKED: 'You visited and chose not to book. ' + T.inr(tk.amount * c.noBookRefundPct / 100) + ' (' + c.noBookRefundPct + '%) is being refunded in 5–7 days.', CLAIM: 'You reported that the hall didn’t match its listing. Support will check within ' + c.disputeSlaH + ' hours. If confirmed, you get the full token back.', CLAIM_REFUNDED: 'Support confirmed the listing issue. Full ' + T.inr(tk.amount) + ' refund started, 5–7 days.' }[stt],
        isVisited: stt === 'VISITED', canCancel: stt === 'ACTIVE' && T.nowTs() - new Date(tk.paidAt).getTime() < c.cancelWindowMin * 6e4, cancelLeft: Math.max(0, Math.ceil((new Date(tk.paidAt).getTime() + c.cancelWindowMin * 6e4 - T.nowTs()) / 6e4)) + ' min left', partRefund: T.inr(tk.amount * c.noBookRefundPct / 100),
        open: () => self.go('token', { tokenId: tk.id, visitDay: tk.visit ? tk.visit.date : '', visitTime: tk.visit ? tk.visit.time : '11:00 AM' }) }; };
    const myTk = (s.tokens || []).filter(tk => tk.customer === ME).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
    const actTk = myTk.find(tk => T.tokenStatus(tk, s) === 'ACTIVE');
    myTk.filter(tk => T.tokenStatus(tk, s) === 'ACTIVE').forEach(tk => { const lf = T.visitBy(tk, s) - T.nowTs(); if (lf < 24 * 36e5) notifs.unshift({ text: 'Reminder: visit ' + T.venue(tk.h).name + ' soon. ' + T.leftTxt(lf) + ', then your token expires. (Sent by SMS & WhatsApp too)', at: lf < 4 * 36e5 ? '4-hour reminder' : '24-hour reminder', open: () => self.go('token', { tokenId: tk.id }) }); });
    const updTkC = (fn, msg, vmsg) => { T.update(x => { const k = x.tokens.find(y => y.id === TKo.id); const was = k.status; fn(k, x); x.notifications.push({ to: 'vendor', v: k.h, text: k.id + ': ' + vmsg, at: T.TODAY + ' ' + self.now() }); x.audit.unshift({ at: T.TODAY + ' ' + self.now(), who: ME + ' (Customer)', what: msg, target: k.id, before: was, after: k.status }); }); self.flash(msg); };
    const TKo = (s.tokens || []).find(x => x.id === st.tokenId) || myTk[0];
    const TK = TKo ? tkRow(TKo) : {};
    const vbTk = TKo ? T.visitBy(TKo, s) : 0;
    const visitDayOpts = [0, 1, 2].map(n => T.addDays(n)).filter(dd => new Date(dd + 'T09:00').getTime() < vbTk);
    const intentDefs = [['rentals', 'Tent house & rentals', 'Shamiana, chairs, vessels, decor', 'tent'], ['venues', 'Function halls & venues', 'Banquet, marriage hall, hotel', 'home'], ['both', 'Both', 'Hall plus everything for it', 'grid']];
    const langTiles = U.LANGS.map(([code, native, en]) => ({ pickClose: () => self.setState({ lang: code, langSheet: false }), native, en, full: U.full(code), sel: st.lang === code, bg: st.lang === code ? 'linear-gradient(135deg,#4d0013,#e75480)' : '#fff', color: st.lang === code ? '#fff' : '#1e1b2e', sub: st.lang === code ? 'rgba(255,255,255,.8)' : '#8a8499', pick: () => self.setState({ lang: code }) }));
    const tabDefs = [['home', 'home', t.home], ['browse', 'search', t.search], ['bookings', 'calendar', t.bookings], ['cart', 'cart', t.cart], ['profile', 'user', t.profile]];
    const tabs = tabDefs.map(([sc, ic, label]) => ({ label, icon: I[ic], color: st.screen === sc ? '#a0133f' : '#9b94ad', badge: sc === 'cart' && cartCount ? String(cartCount) : sc === 'bookings' && activeB.length ? String(activeB.length) : '', go: () => self.tab(sc) }));
    const jumpDefs = [['intro', 'Welcome'], ['lang', 'Looking for + language'], ['venues', 'Halls & venues'], ['venue', 'Hall details'], ['tokenPay', 'Pay token'], ['token', 'Pre-booking & visit'], ['login', 'Login / OTP'], ['register', 'Registration'], ['home', 'Home dashboard'], ['event', 'Event builder'], ['browse', 'Search & filters'], ['vendor', 'Vendor profile'], ['product', 'Product & availability'], ['cart', 'Cart'], ['checkout', 'Checkout'], ['pay', 'Payment'], ['bookings', 'Bookings & quotes'], ['booking', 'Booking tracking'], ['chat', 'Chat'], ['quote', 'Quote request'], ['notifs', 'Notifications'], ['profile', 'Profile']];
    const jumps = jumpDefs.map(([sc, label]) => ({ label, bg: st.screen === sc ? '#fdeef3' : 'transparent', color: st.screen === sc ? '#a0133f' : '#1e1b2e', weight: st.screen === sc ? 700 : 500, go: () => {
      const ex = {}; if ((sc === 'cart' || sc === 'checkout' || sc === 'pay') && !st.cart.length) ex.cart = [['p2', 150], ['p3', 19], ['p1', 1]];
      if (sc === 'pay') { ex.holdEnds = Date.now() + c.holdMin * 60000; ex.payFor = null; }
      if (sc === 'booking' && !B) ex.bookingId = mine[0] && mine[0].id;
      if (sc === 'token') ex.tokenId = (myTk[0] || {}).id; if (sc === 'tokenPay') ex.tkAgree = false; if (sc === 'venues' || sc === 'venue') ex.homeMode = 'venues';
      self.tab(sc, ex); } }));

    const cats = T.CATEGORIES.map((x, i) => ({ n: String(i + 1).padStart(2, '0'), name: x.name, ex: x.ex, sel: ev.cats.includes(x.id), ...chip(ev.cats.includes(x.id)),
      open: () => self.go('browse', { cat: x.id, q: '' }), toggle: () => self.setEv('cats', ev.cats.includes(x.id) ? ev.cats.filter(y => y !== x.id) : [...ev.cats, x.id]) }));
    const evTypes = T.EVENT_TYPES.map(e => ({ label: e, ...chip(ev.type === e), pick: () => self.setEv('type', e), start: () => { self.setEv('type', e); self.go('event'); } }));
    const pkgs = T.PACKAGES.map(k => ({ id: k.id, img: T.photo(k.id), name: k.name, vendor: T.vendor(k.v).name, price: T.inr(k.price), items: k.items.map(([pid, q]) => q + ' × ' + T.prod(pid).name.split(' (')[0]).join(' · '),
      add: () => { self.setState({ cart: k.items.map(x => [...x]) }); self.flash(`${k.name} added to cart`); self.tab('cart'); } }));
    const ET = (k) => (e) => self.setEv(k, e.target.value);

    return {
      is, t, I, Is, Ib, frame, dir: U.RTL.includes(st.lang) ? 'rtl' : 'ltr', scrollRef: this.scrollRef, toast: st.toast, lang: st.lang,
      notFull: false, langName: U.name(st.lang)[2], trBusy: st.trStatus === 'busy' && st.lang !== 'en', phoneRef: this.phoneRef,
      showTabs: ['home', 'browse', 'bookings', 'cart', 'profile'].includes(st.screen),
      devices: [['ios', 'iPhone'], ['android', 'Android']].map(([k, l]) => ({ label: l, ...chip(st.device === k), pick: () => self.setState({ device: k }) })),
      langOptions: U.LANGS.map(([code, native, en]) => ({ code, label: `${native} · ${en}` })),
      pickLangSelect: (e) => self.setState({ lang: e.target.value }),
      jumps, tabs, back: () => self.back(),
      resetAll: () => { T.reset(); localStorage.removeItem('utsaviyana_cust_ui'); self.setState({ ...DEF(), ready: true, splashOn: false }); },
      splashOn: st.splashOn !== false, dismissSplash: () => self.setState({ splashOn: false }),
      // intro
      introSlides: [[t.w1T, t.w1B, 'tent'], [t.w2T, t.w2B, 'calendar'], [t.w3T, t.w3B, 'truck']].map(([title, body, ic], i) => ({ title, body, icon: T.icon(React, ic, 54, 1.5), show: st.intro === i })),
      dots: [0, 1, 2].map(i => ({ w: st.intro === i ? '22px' : '6px', bg: st.intro === i ? '#e75480' : '#ecdde5' })),
      introNext: () => st.intro < 2 ? self.setState({ intro: st.intro + 1 }) : self.tab('lang'), introSkip: () => self.tab('lang'), introLast: st.intro === 2, introNotLast: st.intro < 2,
      langTiles, langCont: () => self.tab('login'),
      intents: intentDefs.map(([k, label, desc, ic]) => ({ label, desc, icon: T.icon(React, ic, 24, 1.5), bg: st.intent === k ? 'linear-gradient(135deg,#4d0013,#e75480)' : '#fff', color: st.intent === k ? '#fff' : '#1e1b2e', sub: st.intent === k ? 'rgba(255,255,255,.85)' : '#8a8499', border: st.intent === k ? 'transparent' : '#f0e3ea', pick: () => self.setState({ intent: k, homeMode: k === 'venues' ? 'venues' : 'rentals' }) })),
      langSheet: st.langSheet, openLangSheet: () => self.setState({ langSheet: true }), closeLangSheet: () => self.setState({ langSheet: false }), langShort: U.name(st.lang)[1],
      homeModes: [['rentals', 'Rentals', 'tent'], ['venues', 'Halls & venues', 'home']].map(([k, l, ic]) => ({ label: l, icon: T.icon(React, ic, 16, 1.8), ...chip(st.homeMode === k), pick: () => self.setState({ homeMode: k }) })),
      homeRentals: st.homeMode !== 'venues', homeVenues: st.homeMode === 'venues', visitHours: vh,
      hasMyToken: !!actTk, myToken: actTk ? tkRow(actTk) : {},
      vTypeTiles: T.VENUE_TYPES.map(ty => ({ label: ty + 's', count: T.VENUES.filter(x => x.type === ty && hOK(x.id)).length + ' on Tamboo', open: () => self.go('venues', { vType: ty }) })),
      nearHalls: T.VENUES.filter(x => hOK(x.id)).sort((a, b) => a.km - b.km).slice(0, 3).map(hallRow),
      openVenues: () => self.go('venues', { vType: '' }),
      slotChips: T.SLOTS.map(sl => ({ label: sl, ...chip(st.vSlot === sl), pick: () => self.setState({ vSlot: sl }) })),
      vTypeChips: [['', 'All types'], ...T.VENUE_TYPES.map(x => [x, x])].map(([k, l]) => ({ label: l, ...chip(st.vType === k), pick: () => self.setState({ vType: k }) })),
      vToggles: [['vAc', 'AC only'], ['vCrockery', 'Crockery included'], ['vOutside', 'Outside caterers allowed']].map(([k, l]) => ({ label: l, ...chip(st[k]), pick: () => self.setState({ [k]: !st[k] }) })),
      vSorts: [['distance', 'Nearest'], ['price', 'Lowest rent'], ['rating', 'Top rated'], ['capacity', 'Biggest']].map(([k, l]) => ({ label: l, ...chip(st.vSort === k), pick: () => self.setState({ vSort: k }) })),
      venueList: halls.map(hallRow), noVenues: !halls.length, city: st.reg.city || 'Hyderabad', venueCount: halls.length + ' halls in ' + (st.reg.city || 'Hyderabad') + ' for ' + (g || 'any number of') + ' guests on ' + T.fmtShort(ev.date),
      ...(() => { const off = st.hCalOff || 0, b0 = new Date(T.TODAY + 'T00:00'), m = new Date(b0.getFullYear(), b0.getMonth() + off, 1);
        const isoD = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
        const lead = (m.getDay() + 6) % 7, dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(), [MO, EV] = T.SLOTS;
        const col = (a, past) => past ? ['#eee8ec', '#b8b2c4'] : a.blocked ? ['#1e1b2e', '#fff'] : a.free ? ['#34b37a', '#fff'] : ['#e35d6a', '#fff'];
        const days = Array.from({ length: lead }, () => ({ vis: 'hidden', n: '', op: 1, border: 'transparent', am: '#fff', pm: '#fff', amT: '#fff', pmT: '#fff', aria: '', pick: () => { } }));
        for (let i = 1; i <= dim; i++) { const dd = isoD(new Date(m.getFullYear(), m.getMonth(), i)), past = dd < T.TODAY, a1 = T.venueFree(s, Hx.id, dd, MO), a2 = T.venueFree(s, Hx.id, dd, EV), [am, amT] = col(a1, past), [pm, pmT] = col(a2, past);
          days.push({ vis: 'visible', n: i, op: past ? .5 : 1, border: dd === ev.date ? '#e75480' : '#f3e6ec', am, amT, pm, pmT, aria: i + ' ' + m.toLocaleDateString('en-IN', { month: 'long' }) + ': morning ' + (a1.free ? 'free' : 'booked') + ', evening ' + (a2.free ? 'free' : 'booked'), pick: () => past ? self.flash('That date has passed') : self.setEv('date', dd) }); }
        const st2 = (sl) => { const a = T.venueFree(s, Hx.id, ev.date, sl); return a.blocked ? ['Closed', '#6b7280'] : a.free ? ['Available', '#047857'] : ['Booked', '#b91c1c']; };
        return { hDays: days, hCalTitle: m.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), hCalPrevOp: off > 0 ? 1 : .35,
          hCalPrev: () => off > 0 && self.setState({ hCalOff: off - 1 }), hCalNext: () => self.setState({ hCalOff: off + 1 }),
          hSel: [[MO, 'Morning · ' + T.fmtShort(ev.date)], [EV, 'Evening · ' + T.fmtShort(ev.date)]].map(([sl, label]) => { const [state, color] = st2(sl), on = st.vSlot === sl; return { label, state, color, bg: on ? '#fdeef3' : '#fff', border: on ? '#e75480' : '#f0e3ea', pick: () => self.setState({ vSlot: sl }) }; }) }; })(),
      H, rentCrockery: () => self.go('browse', { cat: 'crockery', q: '', homeMode: 'rentals' }),
      startToken: () => { if (!H.canPay) return self.flash(H.availTxt); self.go('tokenPay', { tkAgree: false }); },
      tkSum: { date: T.fmtDate(ev.date), slot: st.vSlot, visitBy: fmtTs(T.nowTs() + vh * 36e5) },
      tkAgreeBg: st.tkAgree ? 'linear-gradient(135deg,#4d0013,#e75480)' : '#e8e1ea', toggleTkAgree: () => self.setState({ tkAgree: !st.tkAgree }),
      payToken: () => { if (!st.tkAgree) return self.flash('Please accept the token rules to continue'); if (!H.canPay) return self.flash('This slot was just taken. Pick another.');
        const d = new Date(T.nowTs()), paidAt = T.TODAY + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); let id;
        T.update(x => { x.tokens = x.tokens || []; id = 'TK-' + (5030 + x.tokens.length); x.tokens.unshift({ id, h: Hx.id, customer: ME, phone: '+91 •••• 4410', event: ev.name, type: ev.type, date: ev.date, slot: st.vSlot, guests: g, amount: Hx.token, paidAt, visit: null, status: 'ACTIVE' });
          x.notifications.push({ to: 'vendor', v: Hx.id, text: 'New pre-booking ' + id + ': ' + ev.name + ' on ' + T.fmtShort(ev.date) + ', token ' + T.inr(Hx.token) + ' paid', at: T.TODAY + ' ' + self.now() });
          x.audit.unshift({ at: T.TODAY + ' ' + self.now(), who: ME + ' (Customer)', what: 'Hall token paid ' + T.inr(Hx.token), target: id + ' · ' + Hx.name, before: '—', after: 'ACTIVE' }); });
        self.tab('tokenDone', { tokenId: id }); },
      TK, goHome: () => self.tab('home'),
      visitDays: visitDayOpts.map(dd => ({ label: dd === T.TODAY ? 'Today' : T.fmtShort(dd), ...chip(st.visitDay === dd), pick: () => self.setState({ visitDay: dd }) })),
      visitTimes: ['11:00 AM', '1:00 PM', '4:00 PM', '6:30 PM'].map(tm => ({ label: tm, ...chip(st.visitTime === tm), pick: () => self.setState({ visitTime: tm }) })),
      saveVisit: () => { if (!st.visitDay) return self.flash('Pick a day for the visit'); T.update(x => { const k = x.tokens.find(y => y.id === TKo.id); k.visit = { date: st.visitDay, time: st.visitTime }; x.notifications.push({ to: 'vendor', v: k.h, text: k.id + ': customer will visit on ' + T.fmtShort(st.visitDay) + ' at ' + st.visitTime, at: T.TODAY + ' ' + self.now() }); }); self.flash('Visit confirmed. The hall owner has been told.'); },
      cancelTk: () => updTkC(k => { k.status = 'CUST_CANCELLED'; k.refund = k.amount; }, 'Cancelled. Full refund started', 'customer cancelled within the free window. Date released.'),
      notBookTk: () => updTkC(k => { k.status = 'NOT_BOOKED'; k.refund = Math.round(k.amount * c.noBookRefundPct / 100); }, 'Noted. ' + c.noBookRefundPct + '% refund started', 'customer visited and decided not to book. Your share: ' + c.noBookHallPct + '% of the token.'),
      claimTk: () => updTkC((k, x) => { k.status = 'CLAIM'; x.disputes.unshift({ id: 'D-' + (312 + x.disputes.length), token: k.id, booking: k.id, by: 'Customer', type: 'Hall didn’t match listing', amount: k.amount, desc: 'Reported after visiting ' + T.venue(k.h).name + ': hall didn’t match its photos or details.', status: 'OPEN', opened: T.TODAY }); }, 'Reported. Support will review within ' + c.disputeSlaH + ' hours', 'customer reported the hall didn’t match the listing. Tamboo support will review.'),
      refundPolicy: ['Cancel within ' + (c.cancelWindowMin / 60) + ' hours of paying: full refund', 'Visit and book: token is adjusted in your rent', 'Visit and don’t book: ' + c.noBookRefundPct + '% refunded', 'Hall doesn’t match its listing: full refund after support checks', 'Don’t visit within ' + vh + ' hours: token expires, no refund', 'Hall cancels: full refund'],
      callHall: () => self.flash('Calling ' + (TKo ? T.venue(TKo.h).owner : 'the hall') + ' via masked number'),
      showHalls: st.bTab === 'halls', myTokens: myTk.map(tkRow), noTokens: !myTk.length,
      // auth
      phone: st.phone, otp: st.otp, err: st.err, reg: st.reg,
      setPhone: (e) => self.setState({ phone: e.target.value.replace(/\D/g, '').slice(0, 10), err: '' }),
      setOtp: (e) => self.setState({ otp: e.target.value.replace(/\D/g, '').slice(0, 4), err: '' }),
      otpBoxes: [0, 1, 2, 3].map(i => ({ d: st.otp[i] || '', border: st.otp.length === i ? '#e75480' : '#f0e3ea' })),
      sendOtp: () => st.phone.length === 10 ? self.go('otp', { otp: '' }) : self.setState({ err: 'Enter a valid 10-digit mobile number' }),
      verifyOtp: () => st.otp === '1234' ? (st.registered ? self.tab('home') : self.tab('register')) : self.setState({ err: 'Incorrect OTP. Use 1234 in this demo.' }),
      resend: () => self.flash('OTP resent to +91 ' + st.phone),
      phoneMasked: '+91 ' + (st.phone || '98490 04410'),
      setReg: (k) => (e) => self.setState({ reg: { ...st.reg, [k]: e.target.value }, err: '' }),
      regName: (e) => self.setState({ reg: { ...st.reg, name: e.target.value }, err: '' }), regEmail: (e) => self.setState({ reg: { ...st.reg, email: e.target.value } }), regCity: (e) => self.setState({ reg: { ...st.reg, city: e.target.value } }),
      createAcc: () => st.reg.name.trim().length < 2 ? self.setState({ err: 'Please enter your name' }) : (self.setState({ registered: true }), self.tab('home'), self.flash('Welcome to Tamboo, ' + st.reg.name.split(' ')[0] + '!')),
      guest: () => self.tab('home'),
      // home
      firstName: (st.reg.name || ME).split(' ')[0], initials: (st.reg.name || ME).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
      area: (st.ev.address.split(',').slice(-2, -1)[0] || 'Gachibowli').trim() + ', Hyderabad',
      evDate: T.fmtShort(ev.date), ev, evTypes, cats, pkgs, cartCount,
      hasUpcoming: !!upcoming, up: upcoming ? bRow(upcoming) : {}, quoteCount: myQuotes.filter(q => q.hasOffer).length, activeCount: activeB.length,
      nearby: T.VENDORS.slice().sort((a, b) => a.km - b.km).slice(0, 3).map(vendorRow),
      openEvent: () => self.go('event'), openSearch: () => self.go('browse', { cat: '', q: '' }), openNotifs: () => self.go('notifs'), openProfile: () => self.tab('profile'), openQuotes: () => self.tab('bookings', { bTab: 'quotes' }), openBookings: () => self.tab('bookings', { bTab: 'active' }),
      hasNotif: notifs.length > 0, openSheet: () => self.setState({ sheet: true }), closeSheet: () => self.setState({ sheet: false }), sheet: st.sheet,
      addrList: st.addrs.map(a => ({ a, sel: a === ev.address, pick: () => { self.setEv('address', a); self.setState({ sheet: false }); } })),
      // event builder
      evSet: { name: ET('name'), date: ET('date'), setup: ET('setup'), start: ET('start'), end: ET('end'), pickup: ET('pickup'), guests: ET('guests'), address: ET('address'), budget: ET('budget'), notes: ET('notes') },
      venues: ['Outdoor', 'Hall', 'Terrace', 'Home'].map(v => ({ label: v, ...chip(ev.venue === v), pick: () => self.setEv('venue', v) })),
      saveEvent: () => { self.flash('Event saved. Availability now uses ' + T.fmtShort(ev.date)); self.back(); },
      findVendors: () => self.go('browse', { cat: ev.cats[0] || '', q: '' }),
      // browse
      q: st.q, setQ: (e) => self.setState({ q: e.target.value }),
      catChips: [{ id: '', name: 'All' }, ...T.CATEGORIES].map(x => ({ label: x.name, ...chip(st.cat === x.id), pick: () => self.setState({ cat: x.id }) })),
      sorts: [['relevance', 'Relevance'], ['distance', 'Distance'], ['price', 'Price'], ['rating', 'Rating']].map(([k, l]) => ({ label: l, ...chip(st.sort === k), pick: () => self.setState({ sort: k }) })),
      toggles: [['verifiedOnly', 'Verified only'], ['instantOnly', 'Instant book']].map(([k, l]) => ({ label: l, ...chip(st[k]), pick: () => self.setState({ [k]: !st[k] }) })),
      resTabs: [['items', `Items (${prods.length})`], ['vendors', `Vendors (${vends.length})`]].map(([k, l]) => ({ label: l, ...chip(st.resTab === k), pick: () => self.setState({ resTab: k }) })),
      showItems: st.resTab === 'items', showVendors: st.resTab === 'vendors', items: prods.map(itemRow), vendors: vends.map(vendorRow), noResults: st.resTab === 'items' ? !prods.length : !vends.length,
      // vendor
      V: { ...V, img: T.photo(V.id), verified: vOK(V.id), initials: V.name.split(' ').map(w => w[0]).slice(0, 2).join(''), areas: V.areas, delivery: T.inr(V.delivery), setup: V.setup ? T.inr(V.setup) : 'Not offered', minOrder: T.inr(V.minOrder) },
      vItems: T.PRODUCTS.filter(p => p.v === V.id).map(itemRow),
      vReviews: s.reviews.filter(r => r.v === V.id).map(r => ({ ...r, starsTxt: '★★★★★'.slice(0, r.stars) + '☆☆☆☆☆'.slice(0, 5 - r.stars), date: T.fmtShort(r.date) })),
      requestQuote: () => self.go('quote', { quoteVendor: V.id }), chatVendor: () => self.flash('You can chat once you have a booking or quote with this vendor'),
      // product
      P: { ...P, img: T.photo(P.id), price: T.inr(P.price), deposit: P.deposit ? T.inr(P.deposit) : 'None', cat: catName(P.cat), vendor: PV.name, rating: PV.rating, verified: vOK(PV.id), minTxt: P.min + ' min' },
      PA: { total: PA.total.toLocaleString('en-IN'), reserved: PA.reserved.toLocaleString('en-IN'), maint: (PA.maint + PA.damaged).toLocaleString('en-IN'), free: PA.free.toLocaleString('en-IN'), blocked: PA.blocked, pct: Math.round(PA.free / Math.max(1, PA.total) * 100) + '%' },
      pq, pqTotal: T.inr(P.price * pq), canAdd, cantAdd: !canAdd, isInstant: P.instant, isQuote: !P.instant,
      pqWarn: !P.instant ? '' : pq > PA.free ? `Only ${PA.free} available on ${T.fmtShort(ev.date)}. Lower the quantity or change the date.` : pq < P.min ? `Minimum ${P.min} per booking` : '',
      pInc: () => self.setState(x => ({ qty: { ...x.qty, [P.id]: pq + step } })), pDec: () => self.setState(x => ({ qty: { ...x.qty, [P.id]: Math.max(P.min, pq - step) } })),
      setPq: (e) => self.setState(x => ({ qty: { ...x.qty, [P.id]: Math.max(0, parseInt(e.target.value || '0', 10)) } })),
      addCart: () => { if (!canAdd) return; self.setState(x => { const ex = x.cart.find(l => l[0] === P.id); return { cart: ex ? x.cart.map(l => l[0] === P.id ? [P.id, pq] : l) : [...x.cart, [P.id, pq]] }; }); self.flash(`Added ${pq} × ${P.name}`); },
      openPV: () => self.go('vendor', { vendorId: P.v }), quoteThis: () => self.go('quote', { quoteVendor: P.v, quoteNeed: P.name + ' ×' + pq }),
      // cart
      groups, cartEmpty: !st.cart.length, cartHas: st.cart.length > 0, multi: pr.vids.length > 1, subOrders: pr.vids.length,
      breakdown: bd(pr), total: T.inr(pr.total), coupon: st.coupon, couponApplied: st.couponApplied,
      setCoupon: (e) => self.setState({ coupon: e.target.value }),
      applyCoupon: () => { if (st.coupon.trim().toUpperCase() === c.coupon && pr.subtotal + pr.delivery + pr.setup + pr.pickup >= 5000) { self.setState({ couponApplied: c.coupon }); self.flash(`${c.coupon} applied: ${T.inr(c.couponOff)} off`); } else self.flash('That coupon isn’t valid for this cart'); },
      couponHint: `Try ${c.coupon} for ${T.inr(c.couponOff)} off`,
      toCheckout: () => { if (groups.some(g => g.lines.some(l => l.warn))) return self.flash('Some items exceed availability. Adjust quantities first.'); self.go('checkout'); },
      // checkout
      deliveryOpts: [['setup', 'Delivery + setup'], ['drop', 'Delivery only']].map(([k, l]) => ({ label: l, ...chip(st.delivery === k), pick: () => self.setState({ delivery: k }) })),
      agree: st.agree, agreeBg: st.agree ? 'linear-gradient(135deg,#4d0013,#e75480)' : '#e8e1ea', toggleAgree: () => self.setState({ agree: !st.agree }),
      policy: `Free cancellation up to ${c.cancelFreeDays} days before the event. After that, ${c.cancelFeePct}% of the rental amount is charged. Your deposit is refunded after pickup inspection.`,
      toPay: () => st.agree ? self.go('pay', { holdEnds: Date.now() + c.holdMin * 60000, payFor: null }) : self.flash('Please accept the policies to continue'),
      // pay
      payTitle: quote ? `Quote ${quote.id} · ${qv ? 'v' + qv.v : ''}` : `${st.cart.length} items · ${pr.vids.length} vendor${pr.vids.length > 1 ? 's' : ''}`,
      payTotal: T.inr(payTotal), due: T.inr(due), holdLeft: String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0'),
      payModes: [['full', 'Pay in full'], ['advance', '30% advance']].map(([k, l]) => ({ label: l, ...chip(st.payMode === k), pick: () => self.setState({ payMode: k }) })),
      methods: [['upi', 'UPI', 'GPay, PhonePe, Paytm'], ['card', 'Card', 'Visa, Mastercard, RuPay'], ['nb', 'Netbanking', 'All major banks']].map(([k, l, sub]) => ({ label: l, sub, sel: st.payMethod === k, ring: st.payMethod === k ? '#e75480' : '#f0e3ea', dot: st.payMethod === k ? '#e75480' : '#fff', pick: () => self.setState({ payMethod: k }) })),
      paySuccess: () => self.placeOrder(pr), payFail: () => self.flash('Payment failed. No money was taken. Your items stay held until the timer runs out.'),
      // confirm
      lastOrder: st.lastOrder.map(id => { const b = s.bookings.find(x => x.id === id); return b ? { id, vendor: T.vendor(b.v).name, status: T.STATUS_LABEL[b.status], total: T.inr(snapOf(b).total), open: () => self.tab('booking', { bookingId: id }) } : { id }; }),
      confirmSplit: st.lastOrder.length > 1,
      // bookings
      bTabs: [['active', 'Active'], ['halls', 'Halls'], ['past', 'Past'], ['quotes', 'Quotes']].map(([k, l]) => ({ label: l, ...chip(st.bTab === k), pick: () => self.setState({ bTab: k }) })),
      showActive: st.bTab === 'active', showPast: st.bTab === 'past', showQuotes: st.bTab === 'quotes',
      activeList: activeB.map(bRow), pastList: pastB.map(bRow), quoteList: myQuotes, noActive: !activeB.length, noPast: !pastB.length, noQuotes: !myQuotes.length,
      newQuote: () => self.go('quote', { quoteVendor: 'v2' }),
      // booking detail
      B: bd2, timeline, bItems, refund, hasB: !!B,
      modalCancel: st.modal === 'cancel', modalReview: st.modal === 'review', modalDispute: st.modal === 'dispute', anyModal: !!st.modal,
      openCancel: () => self.setState({ modal: 'cancel', cancelReason: '' }), openReview: () => self.setState({ modal: 'review', stars: 0, reviewText: '' }), openDispute: () => self.setState({ modal: 'dispute', dDesc: '' }), closeModal: () => self.setState({ modal: null }), stop: (e) => e.stopPropagation(),
      reasons: ['Event postponed', 'Found another vendor', 'Budget changed', 'Booked by mistake', 'Other'].map(r => ({ label: r, sel: st.cancelReason === r, ring: st.cancelReason === r ? '#e75480' : '#f0e3ea', dot: st.cancelReason === r ? '#e75480' : '#fff', pick: () => self.setState({ cancelReason: r }) })),
      confirmCancel: () => { if (!st.cancelReason) return self.flash('Choose a reason'); T.update(x => { const b = x.bookings.find(y => y.id === B.id); b.status = 'CANCELLED'; b.refund = refund.amt; b.cancelReason = st.cancelReason; b.history.push(['CANCELLED', T.TODAY + ' ' + self.now()]); x.notifications.push({ to: 'vendor', v: b.v, text: `${b.id} cancelled by customer: ${st.cancelReason}`, at: T.TODAY }); x.audit.unshift({ at: T.TODAY + ' ' + self.now(), who: ME + ' (Customer)', what: 'Booking cancelled · refund ' + T.inr(refund.amt), target: b.id, before: 'ACTIVE', after: 'CANCELLED' }); }); self.setState({ modal: null }); self.flash('Booking cancelled. Refund started.'); },
      starBtns: [1, 2, 3, 4, 5].map(n => ({ ch: n <= st.stars ? '★' : '☆', pick: () => self.setState({ stars: n }) })), reviewText: st.reviewText, setReview: (e) => self.setState({ reviewText: e.target.value }),
      submitReview: () => { if (!st.stars) return self.flash('Tap a star rating'); T.update(x => { x.reviews.unshift({ v: B.v, by: (st.reg.name || ME).split(' ')[0] + ' ' + ((st.reg.name || ME).split(' ')[1] || '')[0] + '.', stars: st.stars, text: st.reviewText || 'Great service.', date: T.TODAY }); x.bookings.find(y => y.id === B.id).reviewed = true; }); self.setState({ modal: null }); self.flash('Thanks! Your review is live.'); },
      dTypes: ['Late delivery', 'Wrong item', 'Quantity shortage', 'Damaged condition', 'Setup incomplete', 'Vendor did not arrive', 'Refund not received'].map(d => ({ label: d, ...chip(st.dType === d), pick: () => self.setState({ dType: d }) })),
      dDesc: st.dDesc, setDDesc: (e) => self.setState({ dDesc: e.target.value }),
      submitDispute: () => { if (st.dDesc.trim().length < 5) return self.flash('Describe the issue briefly'); T.update(x => { x.disputes.unshift({ id: 'D-' + (312 + x.disputes.length), booking: B.id, by: 'Customer', type: st.dType, amount: 0, desc: st.dDesc, status: 'OPEN', opened: T.TODAY }); const b = x.bookings.find(y => y.id === B.id); b.history.push(['DISPUTED', T.TODAY + ' ' + self.now()]); b.prevStatus = b.status; b.status = 'DISPUTED'; }); self.setState({ modal: null }); self.flash(`Issue raised. Support will respond within ${c.disputeSlaH} hours.`); },
      openChat: () => self.go('chat'), invoice: () => self.flash('Invoice PDF downloaded (demo)'),
      // chat
      msgs, noMsgs: !msgs.length, chatText: st.chatText, chatVendor2: B ? T.vendor(B.v).name : '', setChat: (e) => self.setState({ chatText: e.target.value }),
      sendChat: () => { const tx = st.chatText.trim(); if (!tx || !B) return; T.update(x => { (x.chats[B.id] = x.chats[B.id] || []).push({ from: 'customer', t: tx, at: self.now() }); }); self.setState({ chatText: '' }); setTimeout(() => T.update(x => { x.chats[B.id].push({ from: 'vendor', t: 'Noted 👍 Our team will take care of it.', at: self.now() }); }), 1600); },
      chatKey: (e) => { if (e.key === 'Enter') e.target.blur(), setTimeout(() => self.renderVals().sendChat(), 0); },
      // quote
      quoteVendors: T.VENDORS.map(v => ({ label: v.name, ...chip(st.quoteVendor === v.id), pick: () => self.setState({ quoteVendor: v.id }) })).concat([{ label: 'Match me with vendors', ...chip(st.quoteVendor === 'match'), pick: () => self.setState({ quoteVendor: 'match' }) }]),
      quoteNeed: st.quoteNeed, setQuoteNeed: (e) => self.setState({ quoteNeed: e.target.value }),
      submitQuote: () => { if (st.quoteNeed.trim().length < 4) return self.flash('Tell the vendor what you need'); const targets = st.quoteVendor === 'match' ? T.VENDORS.filter(v => vOK(v.id)).slice(0, 3).map(v => v.id) : [st.quoteVendor]; T.update(x => { targets.forEach(v => { const id = 'Q-' + (1183 + x.quotes.length); x.quotes.unshift({ id, v, customer: ME, event: ev.name, date: ev.date, guests: +ev.guests, need: st.quoteNeed, status: 'REQUESTED', versions: [], created: T.TODAY }); x.notifications.push({ to: 'vendor', v, text: `New quote request ${id}: ${ev.name}`, at: T.TODAY }); }); }); self.setState({ quoteNeed: '' }); self.tab('bookings', { bTab: 'quotes' }); self.flash(`Quote request sent to ${targets.length} vendor${targets.length > 1 ? 's' : ''}. Quotes usually arrive within ${c.quoteExpiryH / 2} hours.`); },
      // notifs & profile
      notifs, noNotifs: !notifs.length,
      addrs: st.addrs.map(a => ({ a, remove: () => self.setState(x => ({ addrs: x.addrs.filter(y => y !== a) })) })), newAddr: st.newAddr, setNewAddr: (e) => self.setState({ newAddr: e.target.value }),
      addAddr: () => st.newAddr.trim() && self.setState(x => ({ addrs: [...x.addrs, x.newAddr.trim()], newAddr: '' })),
      notifToggles: [['push', 'Push notifications'], ['sms', 'SMS updates'], ['wa', 'WhatsApp updates']].map(([k, l]) => ({ label: l, bg: st.notif[k] ? 'linear-gradient(135deg,#4d0013,#e75480)' : '#e8e1ea', knob: st.notif[k] ? '21px' : '3px', flip: () => self.setState(x => ({ notif: { ...x.notif, [k]: !x.notif[k] } })) })),
      payHistory: mine.map(b => ({ id: b.id, event: b.event, amount: T.inr(b.paidAmount ?? snapOf(b).total), status: b.status === 'CANCELLED' ? 'Refunded' : 'Paid' })),
      userName: st.reg.name || ME, userPhone: '+91 ' + (st.phone || '98490 04410'), openLang: () => self.go('lang'), logout: () => self.tab('login', { otp: '' }),
      help: () => self.flash('Support: help@utsaviyana.in · 1800-123-4567'),
    };
  }
}
