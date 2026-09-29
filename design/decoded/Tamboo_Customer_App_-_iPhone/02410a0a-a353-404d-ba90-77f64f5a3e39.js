// Tamboo shared prototype data, pricing engine, availability engine and cross-app store (localStorage).
(function () {
  const ICONS = {
    home: ['p:M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'p:M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    search: ['c:11,11,8', 'p:m21 21-4.3-4.3'],
    calendar: ['r:3,4,18,18,2', 'p:M16 2v4M8 2v4M3 10h18'],
    cart: ['c:8,21,1', 'c:19,21,1', 'p:M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12'],
    user: ['p:M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'c:12,7,4'],
    users: ['p:M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'c:9,7,4', 'p:M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'],
    package: ['p:M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', 'p:M3.3 7 12 12l8.7-5M12 22V12'],
    pin: ['p:M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0', 'c:12,10,3'],
    left: ['p:m15 18-6-6 6-6'], right: ['p:m9 18 6-6-6-6'], down: ['p:m6 9 6 6 6-6'],
    plus: ['p:M5 12h14M12 5v14'], minus: ['p:M5 12h14'], check: ['p:M20 6 9 17l-5-5'], x: ['p:M18 6 6 18M6 6l12 12'],
    star: ['g:12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'],
    bell: ['p:M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'p:M10.3 21a1.94 1.94 0 0 0 3.4 0'],
    chat: ['p:M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
    shield: ['p:M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'p:m9 12 2 2 4-4'],
    truck: ['p:M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2', 'p:M15 18H9', 'p:M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14', 'c:17,18,2', 'c:7,18,2'],
    file: ['p:M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'p:M14 2v4a2 2 0 0 0 2 2h4', 'p:M16 13H8M16 17H8M10 9H8'],
    filter: ['p:M3 6h18M7 12h10M10 18h4'],
    tent: ['p:M3.5 21 14 3M20.5 21 10 3M15.5 21 12 15l-3.5 6M2 21h20'],
    clock: ['c:12,12,10', 'p:M12 6v6l4 2'],
    grid: ['r:3,3,7,9,0', 'r:14,3,7,5,0', 'r:14,12,7,9,0', 'r:3,16,7,5,0'],
    wallet: ['p:M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1', 'p:M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4'],
    alert: ['p:m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'p:M12 9v4M12 17h.01'],
    sliders: ['p:M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4'],
    camera: ['p:M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z', 'c:12,13,3'],
    send: ['p:m22 2-7 20-4-9-9-4ZM22 2 11 13'],
    arrow: ['p:M5 12h14m-7-7 7 7-7 7'],
    tagi: ['p:M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z', 'c:7.5,7.5,.5'],
    card: ['r:2,5,20,14,2', 'p:M2 10h20'],
    list: ['p:M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'],
    more: ['c:12,12,1', 'c:19,12,1', 'c:5,12,1'],
    logout: ['p:M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'],
    upload: ['p:M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12'],
    refresh: ['p:M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5'],
    wifi: ['p:M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.859a10 10 0 0 1 14 0M8.5 16.429a5 5 0 0 1 7 0'],
    lock: ['r:3,11,18,11,2', 'p:M7 11V7a5 5 0 0 1 10 0v4'],
  };
  function icon(React, name, size, sw) {
    const s = size || 20, parts = ICONS[name] || [];
    const kids = parts.map((d, i) => {
      const [t, v] = [d.slice(0, 2), d.slice(2)];
      if (t === 'p:') return React.createElement('path', { key: i, d: v });
      if (t === 'g:') return React.createElement('polygon', { key: i, points: v });
      const n = v.split(',').map(Number);
      if (t === 'c:') return React.createElement('circle', { key: i, cx: n[0], cy: n[1], r: n[2] });
      return React.createElement('rect', { key: i, x: n[0], y: n[1], width: n[2], height: n[3], rx: n[4] });
    });
    return React.createElement('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: sw || 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', style: { display: 'block', flex: 'none' } }, kids);
  }
  function iconSet(React, size) { const o = {}; Object.keys(ICONS).forEach(k => o[k] = icon(React, k, size)); return o; }

  const EVENT_TYPES = ['Wedding', 'Birthday', 'Engagement', 'Reception', 'Housewarming', 'Pooja', 'Religious Event', 'Corporate', 'Community Event', 'Funeral', 'Custom Event'];
  const CATEGORIES = [
    { id: 'tent', name: 'Tent & Structures', ex: 'Shamiana, German tent, pandal' },
    { id: 'seat', name: 'Seating', ex: 'Chairs, sofas, Maharaja sofa' },
    { id: 'table', name: 'Tables', ex: 'Round, buffet, cocktail' },
    { id: 'kitchen', name: 'Kitchen & Utensils', ex: 'Deksha, bogana, khabgir, burners' },
    { id: 'crockery', name: 'Crockery & Serving', ex: 'Plates, glasses, trays' },
    { id: 'floor', name: 'Flooring & Comfort', ex: 'Carpet, fans, coolers' },
    { id: 'stage', name: 'Stage & Infrastructure', ex: 'Stage, podium, barricades' },
    { id: 'light', name: 'Lighting & Electrical', ex: 'Decor lights, generators' },
    { id: 'decor', name: 'Decor', ex: 'Floral, balloon, entrance' },
    { id: 'av', name: 'Sound & AV', ex: 'Speakers, mics, LED wall' },
    { id: 'staff', name: 'Staff & Services', ex: 'Setup crew, waiters' },
  ];
  const VENDORS = [
    { id: 'v1', name: 'Sri Lakshmi Tent House', city: 'Hyderabad', area: 'Kukatpally', rating: 4.7, reviews: 218, years: 22, km: 3.2, verified: true, delivery: 600, setup: 1200, pickup: 400, minOrder: 5000, lead: 2, areas: ['Kukatpally', 'Miyapur', 'KPHB', 'Gachibowli'], hours: '8 AM – 9 PM', blurb: 'Wedding and function infrastructure across West Hyderabad since 2004. Own fleet of 3 trucks and a 14-person setup crew.' },
    { id: 'v2', name: 'Royal Shamiana & Decor', city: 'Hyderabad', area: 'Jubilee Hills', rating: 4.5, reviews: 141, years: 12, km: 5.8, verified: true, delivery: 800, setup: 1500, pickup: 500, minOrder: 8000, lead: 3, areas: ['Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'Shamshabad'], hours: '9 AM – 8 PM', blurb: 'Premium German tents, stage and floral decor for receptions and corporate events.' },
    { id: 'v4', name: 'Sonic Light & Sound', city: 'Hyderabad', area: 'Madhapur', rating: 4.3, reviews: 64, years: 7, km: 7.1, verified: false, delivery: 500, setup: 800, pickup: 300, minOrder: 3000, lead: 2, areas: ['Madhapur', 'Kondapur', 'Gachibowli', 'HITEC City'], hours: '10 AM – 10 PM', blurb: 'DJ, speakers, LED walls and decorative lighting.' },
  ];
  const PRODUCTS = [
    { id: 'p1', v: 'v1', cat: 'tent', name: 'Waterproof Shamiana 40×60 ft', unit: 'per event', price: 18000, deposit: 5000, stock: 6, maint: 1, min: 1, instant: true, specs: 'Waterproof canvas, steel poles, side walls included. Covers ~250 seated guests.' },
    { id: 'p2', v: 'v1', cat: 'seat', name: 'Plastic Chair (white)', unit: 'per unit / day', price: 12, deposit: 0, stock: 500, maint: 20, min: 50, instant: true, specs: 'Stackable, with backrest. Covers optional at ₹5/unit.' },
    { id: 'p3', v: 'v1', cat: 'table', name: 'Round Table 5 ft', unit: 'per unit / day', price: 150, deposit: 0, stock: 50, maint: 2, min: 5, instant: true, specs: 'Seats 8. Linen cloth included.' },
    { id: 'p4', v: 'v1', cat: 'floor', name: 'Air Cooler (Jumbo)', unit: 'per unit / day', price: 900, deposit: 1000, stock: 20, maint: 1, min: 1, instant: true, specs: '120 L tank, 3-speed. Extension board included.' },
    { id: 'p5', v: 'v2', cat: 'tent', name: 'German Hangar Tent 60×100 ft', unit: 'per event', price: 85000, deposit: 25000, stock: 2, maint: 0, min: 1, instant: false, specs: 'Aluminium frame, PVC roof, rated for wind and rain. Requires site survey.' },
    { id: 'p6', v: 'v2', cat: 'seat', name: 'Maharaja Sofa Set', unit: 'per event', price: 6500, deposit: 3000, stock: 4, maint: 0, min: 1, instant: true, specs: 'Carved gold-finish sofa with 2 side chairs, for stage.' },
    { id: 'p7', v: 'v2', cat: 'stage', name: 'Stage Platform 16×24 ft', unit: 'per event', price: 14000, deposit: 4000, stock: 3, maint: 0, min: 1, instant: true, specs: '3 ft height, carpeted, with steps and skirting.' },
    { id: 'p8', v: 'v1', cat: 'kitchen', name: 'Deksha (Degchi) – Large', unit: 'per unit / event', price: 350, deposit: 1000, stock: 30, maint: 1, min: 1, instant: true, specs: 'Heavy aluminium deksha with lid. Cooks rice or biryani for ~150 guests.' },
    { id: 'p9', v: 'v1', cat: 'crockery', name: 'Steel Thali Set', unit: 'per unit / event', price: 18, deposit: 0, stock: 2000, maint: 50, min: 100, instant: true, specs: 'Thali, 3 katori, glass, spoon.' },
    { id: 'p10', v: 'v1', cat: 'kitchen', name: 'Commercial Gas Burner (Bhatti)', unit: 'per unit / event', price: 700, deposit: 1500, stock: 12, maint: 0, min: 1, instant: true, specs: 'Double-ring. Cylinder not included.' },
    { id: 'p13', v: 'v1', cat: 'kitchen', name: 'Bogana (Handi) – Medium', unit: 'per unit / event', price: 150, deposit: 500, stock: 40, maint: 2, min: 1, instant: true, specs: 'Brass-finish bogana for curries and dal, ~60 guests each.' },
    { id: 'p14', v: 'v1', cat: 'kitchen', name: 'Khabgir & Serving Spoon Set', unit: 'per set / event', price: 120, deposit: 0, stock: 25, maint: 1, min: 1, instant: true, specs: 'Large khabgir (slotted ladle), 2 kadchi, 4 serving spoons.' },
    { id: 'p15', v: 'v2', cat: 'kitchen', name: 'Deksha (Degchi) – Extra Large', unit: 'per unit / event', price: 550, deposit: 1500, stock: 12, maint: 0, min: 1, instant: true, specs: 'For biryani dum, ~300 guests. Lid and cloth seal included.' },
    { id: 'p11', v: 'v4', cat: 'av', name: 'DJ Sound System 5 kW', unit: 'per event', price: 12000, deposit: 5000, stock: 3, maint: 0, min: 1, instant: false, specs: 'Line array, mixer, 2 cordless mics, operator for 6 hrs.' },
    { id: 'p12', v: 'v4', cat: 'light', name: 'Fairy Light String (50 m)', unit: 'per unit / event', price: 450, deposit: 0, stock: 80, maint: 5, min: 4, instant: true, specs: 'Warm white LED, weatherproof.' },
  ];
  const PACKAGES = [
    { id: 'k1', v: 'v1', name: '250-Guest Wedding Basic', price: 42000, items: [['p1', 1], ['p2', 250], ['p3', 30], ['p4', 6]] },
    { id: 'k2', v: 'v1', name: 'Community Kitchen – 500', price: 12500, items: [['p8', 4], ['p13', 6], ['p14', 2], ['p9', 500], ['p10', 4]] },
  ];
  const VENUE_TYPES = ['Function Hall', 'Banquet Hall', 'Marriage Hall', 'Hotel'];
  const SLOTS = ['Morning (7 AM – 3 PM)', 'Evening (5 PM – 12 AM)', 'Full day'];
  const VENUES = [
    { id: 'h1', owner: 'Srinivas Rao', phone: '+91 98490 •••45', name: 'Sri Venkateswara Function Hall', type: 'Function Hall', area: 'Kukatpally', address: 'Plot 42, KPHB Phase 3, Kukatpally, Hyderabad 500072', km: 2.8, rating: 4.6, reviews: 312, seated: 500, floating: 800, sqft: 9000, ac: true, parking: 120, rooms: 4, crockery: true, crockeryNote: 'Steel plates, glasses and serving vessels for 500 guests included in rent', kitchen: true, catering: 'Outside caterers allowed', decor: 'Outside decorators allowed', rent: 85000, token: 10000, amenities: 'Bridal room, Generator backup, Lift, Valet parking', blurb: 'Popular family function hall near KPHB metro. Weddings, receptions, sangeet and birthday functions since 2009.' },
    { id: 'h2', owner: 'Farhan Ali', phone: '+91 99080 •••17', name: 'Grand Nawab Banquets', type: 'Banquet Hall', area: 'Banjara Hills', address: 'Road No. 12, Banjara Hills, Hyderabad 500034', km: 6.4, rating: 4.8, reviews: 189, seated: 350, floating: 600, sqft: 7000, ac: true, parking: 80, rooms: 2, crockery: true, crockeryNote: 'Fine china and cutlery, only with in-house catering', kitchen: true, catering: 'In-house catering only', decor: 'In-house decor, outside allowed with fee', rent: 150000, token: 10000, amenities: 'Central AC, Chandeliers, Valet parking, Green room', blurb: 'Premium AC banquet with in-house Hyderabadi catering. Ideal for receptions and walimas.' },
    { id: 'h3', owner: 'Deccan Pearl Hotels Pvt Ltd', phone: '+91 40 •••• 7788', name: 'Hotel Deccan Pearl – Crystal Ballroom', type: 'Hotel', area: 'HITEC City', address: 'Plot 7, HITEC City Main Road, Madhapur, Hyderabad 500081', km: 7.9, rating: 4.5, reviews: 96, seated: 250, floating: 400, sqft: 5000, ac: true, parking: 60, rooms: 40, crockery: true, crockeryNote: 'Full hotel service: crockery, cutlery and waiters', kitchen: true, catering: 'In-house catering only', decor: 'Outside decorators allowed', rent: 120000, token: 10000, amenities: '40 guest rooms, Pool, Lift, Valet parking', blurb: 'Pillar-less ballroom with 40 rooms for outstation guests. Corporate and wedding events.' },
    { id: 'h4', owner: 'Laxmi Narayana', phone: '+91 94410 •••63', name: 'Laxmi Garden Marriage Hall', type: 'Marriage Hall', area: 'LB Nagar', address: 'Sagar Ring Road, LB Nagar, Hyderabad 500074', km: 12.5, rating: 4.2, reviews: 241, seated: 1000, floating: 1500, sqft: 18000, ac: false, parking: 200, rooms: 6, crockery: false, crockeryNote: 'No crockery or cooking vessels. Rent them from a tent house on Tamboo', kitchen: true, catering: 'Outside caterers allowed', decor: 'Outside decorators allowed', rent: 60000, token: 5000, amenities: 'Open lawn, Generator backup, 6 rooms, Big kitchen', blurb: 'Large hall with lawn for big weddings and community functions. Bring your own tent house and caterer.' },
  ];
  const STATUSES = ['PENDING', 'HOLD', 'CONFIRMED', 'PREPARING', 'LOADED', 'OUT_FOR_DELIVERY', 'ARRIVED', 'SETUP_IN_PROGRESS', 'SETUP_COMPLETED', 'EVENT_ACTIVE', 'PICKUP_SCHEDULED', 'PICKED_UP', 'INSPECTION', 'COMPLETED'];
  const FLOW = ['CONFIRMED', 'PREPARING', 'LOADED', 'OUT_FOR_DELIVERY', 'ARRIVED', 'SETUP_IN_PROGRESS', 'SETUP_COMPLETED', 'EVENT_ACTIVE', 'PICKUP_SCHEDULED', 'PICKED_UP', 'INSPECTION', 'COMPLETED'];
  const STATUS_LABEL = { PENDING: 'Awaiting vendor', HOLD: 'On hold', CONFIRMED: 'Confirmed', PREPARING: 'Preparing', LOADED: 'Loaded', OUT_FOR_DELIVERY: 'Out for delivery', ARRIVED: 'Arrived at venue', SETUP_IN_PROGRESS: 'Setup in progress', SETUP_COMPLETED: 'Setup completed', EVENT_ACTIVE: 'Event active', PICKUP_SCHEDULED: 'Pickup scheduled', PICKED_UP: 'Picked up', INSPECTION: 'Return inspection', COMPLETED: 'Completed', CANCELLED: 'Cancelled', DISPUTED: 'Disputed' };

  const DEFAULT_CONFIG = { tokenVisitHours: 48, venueCommission: 5, maxToken: 10000, cancelWindowMin: 120, noBookRefundPct: 80, noBookHallPct: 15, commission: 10, platformFee: 2, gst: 18, holdMin: 15, quoteExpiryH: 48, leadDays: 1, maxAdvanceDays: 365, cancelFreeDays: 7, cancelFeePct: 25, reviewWindowDays: 14, disputeSlaH: 24, coupon: 'FIRST500', couponOff: 500 };
  const TODAY_ = '2026-09-28';
  const iso = (d) => d.toISOString().slice(0, 10);
  const addDays = (n) => { const d = new Date('2026-09-28T09:00:00'); d.setDate(d.getDate() + n); return iso(d); };

  function seed() {
    return {
      config: { ...DEFAULT_CONFIG },
      vendorStatus: { v1: 'VERIFIED', v2: 'VERIFIED', v4: 'PENDING', h1: 'VERIFIED', h2: 'VERIFIED', h3: 'VERIFIED', h4: 'VERIFIED' },
      venueEdits: {},
      tokens: [
        { id: 'TK-5012', h: 'h1', customer: 'Anjali Sharma', phone: '+91 •••• 4410', event: 'Riya & Karan Wedding', type: 'Wedding', date: addDays(40), slot: 'Full day', guests: 450, amount: 10000, paidAt: addDays(-1) + 'T11:20', visit: { date: addDays(1), time: '11:00 AM' }, status: 'ACTIVE' },
        { id: 'TK-5020', h: 'h1', customer: 'Mohammed Imran', phone: '+91 •••• 3321', event: 'Walima Dinner', type: 'Reception', date: addDays(25), slot: 'Evening (5 PM – 12 AM)', guests: 400, amount: 10000, paidAt: addDays(0) + 'T08:05', visit: null, status: 'ACTIVE' },
        { id: 'TK-4990', h: 'h2', customer: 'Rahul Verma', phone: '+91 •••• 9087', event: 'Engagement', type: 'Engagement', date: addDays(18), slot: 'Evening (5 PM – 12 AM)', guests: 250, amount: 10000, paidAt: addDays(-4) + 'T16:40', visit: null, status: 'ACTIVE' },
        { id: 'TK-4981', h: 'h1', customer: 'Anjali Sharma', phone: '+91 •••• 4410', event: 'Aarav’s Naming Ceremony', type: 'Custom Event', date: addDays(20), slot: 'Morning (7 AM – 3 PM)', guests: 150, amount: 10000, paidAt: addDays(-2) + 'T09:00', visit: { date: addDays(-1), time: '4:00 PM' }, status: 'VISITED' },
        { id: 'TK-4975', h: 'h1', customer: 'Sneha Patil', phone: '+91 •••• 6654', event: 'Sneha & Arjun Reception', type: 'Reception', date: addDays(14), slot: 'Evening (5 PM – 12 AM)', guests: 480, amount: 10000, paidAt: addDays(-6) + 'T10:00', visit: { date: addDays(-5), time: '5:00 PM' }, status: 'CONVERTED', finalRent: 82000 },
      ],
      applicants: [
        { id: 'a1', name: 'Mehta Tent & Caterers', owner: 'Rakesh Mehta', city: 'Hyderabad', phone: '+91 98490 •••12', cats: 'Tents, Seating', docs: 'GSTIN, PAN, Shop Act', submitted: addDays(-2), status: 'PENDING' },
        { id: 'a2', name: 'Balaji Light House', owner: 'Suresh Kumawat', city: 'Warangal', phone: '+91 94410 •••88', cats: 'Lighting, Generators', docs: 'PAN, Udyam', submitted: addDays(-1), status: 'PENDING' },
      ],
      inventory: {},
      blocks: [{ v: 'v1', date: addDays(9), reason: 'Truck maintenance' }],
      bookings: [
        { id: 'TM-240917', v: 'v1', customer: 'Anjali Sharma', phone: '+91 •••• 4410', event: 'Riya & Karan Sangeet', type: 'Engagement', date: addDays(4), guests: 200, address: 'Villa 14, Aparna Sarovar, Nallagandla, Hyderabad', lines: [['p1', 1], ['p2', 200], ['p3', 25]], status: 'CONFIRMED', paid: 'ADVANCE', created: addDays(-6), history: [['PENDING', addDays(-6)], ['CONFIRMED', addDays(-6)]] },
        { id: 'TM-240921', v: 'v1', customer: 'Vikram Reddy', phone: '+91 •••• 7702', event: 'Griha Pravesh', type: 'Housewarming', date: addDays(1), guests: 120, address: '22 Road No. 3, KPHB Colony, Hyderabad', lines: [['p2', 120], ['p3', 15], ['p4', 4]], status: 'PREPARING', paid: 'FULL', created: addDays(-9), history: [['PENDING', addDays(-9)], ['CONFIRMED', addDays(-9)], ['PREPARING', addDays(0)]] },
        { id: 'TM-240902', v: 'v1', customer: 'Anjali Sharma', phone: '+91 •••• 4410', event: 'Aarav turns 5', type: 'Birthday', date: addDays(-5), guests: 60, address: 'Flat 302, My Home Avatar, Narsingi, Hyderabad', lines: [['p2', 60], ['p3', 8]], status: 'COMPLETED', paid: 'FULL', created: addDays(-20), history: [['CONFIRMED', addDays(-20)], ['COMPLETED', addDays(-4)]] },
        { id: 'TM-240925', v: 'v1', customer: 'Pradeep Goud', phone: '+91 •••• 5521', event: 'Bonalu Seva', type: 'Religious Event', date: addDays(6), guests: 300, address: 'Community Hall, Miyapur', lines: [['p1', 1], ['p2', 300]], status: 'PENDING', paid: 'NONE', created: addDays(0), history: [['PENDING', addDays(0)]] },
        { id: 'TM-240911', v: 'v2', customer: 'Kavya Agarwal', phone: '+91 •••• 3308', event: 'Wedding Reception', type: 'Reception', date: addDays(12), guests: 450, address: 'Farm 7, Shamshabad', lines: [['p6', 1], ['p7', 1]], status: 'CONFIRMED', paid: 'ADVANCE', created: addDays(-3), history: [['CONFIRMED', addDays(-3)]] },
        { id: 'TM-240899', v: 'v1', customer: 'Gurudwara Committee', phone: '+91 •••• 9012', event: 'Langar Seva', type: 'Community Event', date: addDays(-2), guests: 800, address: 'Gurudwara Sahib, Secunderabad', lines: [['p8', 5], ['p13', 8], ['p9', 800]], status: 'DISPUTED', paid: 'FULL', created: addDays(-15), history: [['CONFIRMED', addDays(-15)], ['PICKED_UP', addDays(-1)], ['DISPUTED', addDays(-1)]] },
      ],
      quotes: [
        { id: 'Q-1190', v: 'v1', customer: 'Sunitha Rao', event: 'Satyanarayana Pooja & Lunch', date: addDays(10), guests: 180, need: 'Shamiana for 180, 180 chairs, 4 deksha and 6 bogana for cooking, serving spoons', status: 'REQUESTED', versions: [], created: addDays(0) },
        { id: 'Q-1182', v: 'v2', customer: 'Anjali Sharma', event: 'Riya & Karan Wedding', date: addDays(40), guests: 600, need: 'German hangar tent, stage, 600 banquet chairs, lighting', status: 'QUOTED', versions: [{ v: 1, lines: [{ label: 'German hangar tent 60×100 ft', amount: 85000 }, { label: 'Stage 16×24 ft with skirting', amount: 14000 }, { label: '600 banquet chairs with covers', amount: 21000 }, { label: 'Delivery, setup & pickup', amount: 9500 }], total: 129500, note: 'Includes site survey. Valid for 48 hours.', at: addDays(0) }], created: addDays(-1) },
      ],
      disputes: [
        { id: 'D-311', booking: 'TM-240899', by: 'Vendor', type: 'Customer damage claim', amount: 3500, desc: '42 thalis missing, 2 deksha dented on return.', status: 'OPEN', opened: addDays(-1) },
      ],
      chats: { 'TM-240917': [{ from: 'vendor', t: 'Namaste! We will arrive for setup at 2 PM on the event date.', at: '10:12' }, { from: 'customer', t: 'Perfect. Please bring 20 extra chairs covers.', at: '10:15' }] },
      reviews: [
        { v: 'v1', by: 'Neha J.', stars: 5, text: 'Setup finished an hour early and the crew cleaned up after pickup.', date: addDays(-3) },
        { v: 'v1', by: 'Arun P.', stars: 4, text: 'Good tent quality. Delivery was 30 min late.', date: addDays(-30) },
        { v: 'v2', by: 'Kritika S.', stars: 5, text: 'The stage and sofa looked exactly like the photos.', date: addDays(-12) },
      ],
      coupons: [{ code: 'FIRST500', off: 500, min: 5000, uses: 214, active: true }, { code: 'DIWALI10', off: 10, pct: true, min: 10000, uses: 0, active: false }],
      audit: [
        { at: addDays(-1) + ' 18:42', who: 'varun@tamboo (Admin)', what: 'Commission override', target: 'v2 Royal Shamiana', before: '10%', after: '9%' },
        { at: addDays(-2) + ' 11:05', who: 'system', what: 'Hold expired → inventory released', target: 'HOLD-8812', before: 'HOLD', after: 'RELEASED' },
      ],
      notifications: [],
      customerBookings: ['TM-240917', 'TM-240902'],
    };
  }
  const KEY = 'utsaviyana_proto_v7';
  // Venues: seed + owner edits. Tokens expire if not visited within config.tokenVisitHours.
  const venue = (id) => { const s = load(); const b = VENUES.find(v => v.id === id) || VENUES[0]; const e = (s.venueEdits || {})[id]; const r = e ? { ...b, ...e } : { ...b }; r.token = Math.min(r.token, s.config.maxToken || 10000); return r; };
  const allVenues = () => VENUES.map(v => venue(v.id));
  const nowTs = () => { const d = new Date(); return new Date(TODAY_ + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0')).getTime(); };
  const visitBy = (tk, s) => new Date(tk.paidAt).getTime() + ((s || load()).config.tokenVisitHours || 48) * 36e5;
  const tokenStatus = (tk, s) => tk.status === 'ACTIVE' && nowTs() > visitBy(tk, s) ? 'EXPIRED' : tk.status;
  const TOKEN_LABEL = { ACTIVE: 'Pre-booked · visit pending', VISITED: 'Visited · awaiting confirmation', CONVERTED: 'Booking confirmed', EXPIRED: 'Expired · token forfeited', CANCELLED: 'Hall cancelled · full refund', CUST_CANCELLED: 'Cancelled · full refund', NOT_BOOKED: 'Visited, not booked · partial refund', CLAIM: 'Listing issue · under review', CLAIM_REFUNDED: 'Listing issue · full refund' };
  const TOKEN_COLOR = { ACTIVE: ['#fff7e6', '#8a5a00'], VISITED: ['#f3eefd', '#5b21b6'], CONVERTED: ['#e8f7f0', '#047857'], EXPIRED: ['#f3f4f6', '#6b7280'], CANCELLED: ['#f3f4f6', '#6b7280'], CUST_CANCELLED: ['#f3f4f6', '#6b7280'], NOT_BOOKED: ['#f3f4f6', '#6b7280'], CLAIM: ['#fdecec', '#b91c1c'], CLAIM_REFUNDED: ['#f3f4f6', '#6b7280'] };
  const slotClash = (a, b) => a === b || a === 'Full day' || b === 'Full day';
  function venueFree(s, hid, date, slot, excludeId) {
    const blocked = (s.blocks || []).some(x => x.v === hid && x.date === date);
    const taken = (s.tokens || []).find(t => t.id !== excludeId && t.h === hid && t.date === date && slotClash(t.slot, slot) && ['ACTIVE', 'VISITED', 'CONVERTED'].includes(tokenStatus(t, s)));
    return { free: !blocked && !taken, blocked, taken };
  }
  const leftTxt = (ms) => { if (ms <= 0) return 'Expired'; const h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4); return h + 'h ' + String(m).padStart(2, '0') + 'm left to visit'; };
  function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.config) return s; } catch (e) { } const s = seed(); save(s); return s; }
  let _pc = null;
  window.addEventListener('storage', (e) => { if (!e.key || e.key === KEY) _pc = null; });
  function save(s) { _pc = null; localStorage.setItem(KEY, JSON.stringify(s)); window.dispatchEvent(new Event('tm-store')); }
  function update(fn) { const s = load(); fn(s); save(s); return s; }
  function reset() { save(seed()); }
  function subscribe(cb) { const h = (e) => { if (!e.key || e.key === KEY) cb(); }; window.addEventListener('storage', h); window.addEventListener('tm-store', h); return () => { window.removeEventListener('storage', h); window.removeEventListener('tm-store', h); }; }

  // Merged catalogue: seed items + vendor edits + vendor-added items. state: LIVE | PAUSED | REVIEW.
  function allProducts() { if (_pc) return _pc; const s = load(); const ed = s.itemEdits || {}; _pc = [...PRODUCTS.map(p => ({ ...p, ...(ed[p.id] || {}) })), ...(s.customItems || [])].filter(p => !p.deleted); return _pc; }
  const liveProducts = () => allProducts().filter(p => (p.state || 'LIVE') === 'LIVE');
  const prod = (id) => allProducts().find(p => p.id === id) || PRODUCTS.find(p => p.id === id);
  const vendorFull = (id) => { const b = VENDORS.find(v => v.id === id) || VENDORS[0]; const e = (load().vendorEdits || {})[id]; return e ? { ...b, ...e } : b; };
  const vendor = vendorFull;
  const allCategories = () => [...CATEGORIES, ...((load().customCats) || [])];
  function inv(s, pid) { const p = prod(pid), o = (s.inventory || {})[pid] || {}; return { total: o.total ?? p.stock, maint: o.maint ?? p.maint, damaged: o.damaged ?? 0 }; }
  const ACTIVE = (b) => !['CANCELLED', 'COMPLETED'].includes(b.status);
  // Availability for a date window (event day with 1-day setup/pickup buffers).
  function available(s, pid, date, excludeId) {
    const i = inv(s, pid); const t = new Date(date).getTime(), day = 864e5;
    let reserved = 0;
    s.bookings.forEach(b => { if (b.id === excludeId || !ACTIVE(b)) return; if (Math.abs(new Date(b.date).getTime() - t) <= day) b.lines.forEach(([id, q]) => { if (id === pid) reserved += q; }); });
    const p = prod(pid); const blocked = (s.blocks || []).some(x => x.v === p.v && x.date === date);
    return { ...i, reserved, blocked, free: blocked ? 0 : Math.max(0, i.total - i.maint - i.damaged - reserved) };
  }
  function price(s, lines, opts) {
    opts = opts || {}; const c = s.config; const vids = [...new Set(lines.map(([id]) => prod(id).v))];
    const subtotal = lines.reduce((a, [id, q]) => a + prod(id).price * q, 0);
    const delivery = vids.reduce((a, v) => a + vendor(v).delivery, 0);
    const setup = opts.noSetup ? 0 : vids.reduce((a, v) => a + vendor(v).setup, 0);
    const pickup = vids.reduce((a, v) => a + vendor(v).pickup, 0);
    const vendorCharges = subtotal + delivery + setup + pickup;
    const discount = opts.coupon && opts.coupon.toUpperCase() === c.coupon && vendorCharges >= 5000 ? c.couponOff : 0;
    const platformFee = Math.round((vendorCharges - discount) * c.platformFee / 100);
    const tax = Math.round((vendorCharges - discount + platformFee) * c.gst / 100);
    const deposit = lines.reduce((a, [id, q]) => a + (prod(id).deposit ? prod(id).deposit * (prod(id).unit.startsWith('per event') || prod(id).unit.includes('set') ? q : 1) : 0), 0);
    const total = vendorCharges - discount + platformFee + tax + deposit;
    const commission = Math.round((vendorCharges - discount) * c.commission / 100);
    return { subtotal, delivery, setup, pickup, discount, platformFee, tax, deposit, total, commission, vendorPayable: vendorCharges - discount - commission, vids };
  }
  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtShort = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  const PHOTOS = {"p1":{"src":"https://images.unsplash.com/photo-1744891470493-44321ef136a2?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by Anubhav Event Productions on Unsplash","href":"https://unsplash.com/@anubhaveventproductions"},"p2":{"src":"https://images.unsplash.com/photo-1601482441062-b9f13131f33a?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by Vaibhav Nagare on Unsplash","href":"https://unsplash.com/@vaibhavnagare"},"p3":{"src":"https://images.unsplash.com/photo-1772127822514-682aeffcc0d3?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by Vidit Goswami on Unsplash","href":"https://unsplash.com/@viditgoswami"},"p5":{"src":"https://images.unsplash.com/photo-1772127822525-7eda37383b9f?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by Vidit Goswami on Unsplash","href":"https://unsplash.com/@viditgoswami"},"p8":{"src":"https://images.unsplash.com/photo-1523039031846-6b3f39302cb8?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by Nicolas Gras on Unsplash","href":"https://unsplash.com/@armgd"},"p9":{"src":"https://images.unsplash.com/photo-1586969593928-1c87c1f9c2ef?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by henry perks on Unsplash","href":"https://unsplash.com/@hjkp"},"p10":{"src":"https://images.unsplash.com/photo-1656711781745-ba68661d06b7?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by David Mendoza on Unsplash","href":"https://unsplash.com/@mendoza_nz"},"v1":{"src":"https://images.unsplash.com/photo-1744805624890-9931ebb50428?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by iKshana Productions on Unsplash","href":"https://unsplash.com/@ikshanaproductions"},"v2":{"src":"https://images.unsplash.com/photo-1744891471118-f74c0453cd21?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by Anubhav Event Productions on Unsplash","href":"https://unsplash.com/@anubhaveventproductions"},"k1":{"src":"https://images.unsplash.com/photo-1772127822562-a898d9f5733c?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by Vidit Goswami on Unsplash","href":"https://unsplash.com/@viditgoswami"},"k2":{"src":"https://images.unsplash.com/photo-1523039031846-6b3f39302cb8?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by Nicolas Gras on Unsplash","href":"https://unsplash.com/@armgd"},"p6":{"src":"https://images.unsplash.com/photo-1761472606347-bfebc5a3e546?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by ghost rider on Unsplash","href":"https://unsplash.com/@theconceivable"},"p7":{"src":"https://images.unsplash.com/photo-1744805624954-a6686543c3ff?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by iKshana Productions on Unsplash","href":"https://unsplash.com/@ikshanaproductions"},"h1":{"src":"https://images.unsplash.com/photo-1738217383996-9947554e9f28?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by Finn on Unsplash","href":"https://unsplash.com/@finn_staygold"},"h2":{"src":"https://images.unsplash.com/photo-1687213280116-234f93b15b44?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by Natilyn Hicks Photography on Unsplash","href":"https://unsplash.com/@natilyn"},"h3":{"src":"https://images.unsplash.com/photo-1762765684673-d22ece602b10?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by Adrien Olichon on Unsplash","href":"https://unsplash.com/@adrienolichon"},"h4":{"src":"https://images.unsplash.com/photo-1772127822562-a898d9f5733c?fm=jpg&q=60&w=1200&auto=format&fit=crop","credit":"Photo by Vidit Goswami on Unsplash","href":"https://unsplash.com/@viditgoswami"}};
  const photo = (id) => PHOTOS[id] || { src: '', credit: '', href: '' };
  window.TM = { VENUE_TYPES, SLOTS, venue, allVenues, nowTs, visitBy, tokenStatus, TOKEN_LABEL, TOKEN_COLOR, venueFree, leftTxt, PHOTOS, photo, icon, iconSet, EVENT_TYPES, PACKAGES, allProducts, liveProducts, allCategories, BASE_PRODUCTS: PRODUCTS, STATUSES, FLOW, STATUS_LABEL, DEFAULT_CONFIG, load, save, update, reset, subscribe, prod, vendor, inv, available, price, inr, fmtDate, fmtShort, addDays, TODAY: '2026-09-28' };
  Object.defineProperty(window.TM, 'PRODUCTS', { get: liveProducts });
  Object.defineProperty(window.TM, 'CATEGORIES', { get: allCategories });
  Object.defineProperty(window.TM, 'VENDORS', { get: () => VENDORS.map(v => vendorFull(v.id)) });
  Object.defineProperty(window.TM, 'VENUES', { get: allVenues });
})();
