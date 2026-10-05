// Mock catalog data shared by Browse, Vendor and Product screens until the
// backend exposes real vendor/product/inventory endpoints.

export type Product = {
  id: string;
  name: string;
  cat: string;
  vendorId: string;
  rating: number;
  price: number;
  unit: string;
  specs: string;
  deposit: string;
  min: string;
  isInstant: boolean;
  avail: { total: number; reserved: number; maint: number; free: number };
  photos?: string[];
};

export type Vendor = {
  id: string;
  name: string;
  area: string;
  city: string;
  km: number;
  hours: string;
  verified: boolean;
  rating: number;
  reviews: number;
  years: string;
  blurb: string;
  delivery: string;
  setup: string;
  minOrder: string;
  areas: string[];
};

export type Review = {
  vendorId: string;
  by: string;
  stars: number;
  text: string;
  date: string;
};

export const VENDORS: Vendor[] = [
  {
    id: 'v1',
    name: 'Sai Tent House',
    area: 'Ameerpet',
    city: 'Hyderabad',
    km: 3.2,
    hours: '7 AM – 9 PM',
    verified: true,
    rating: 4.7,
    reviews: 210,
    years: '12 yrs',
    blurb: 'Family-run tent house serving weddings and functions across Hyderabad since 2012. Shamiana, mandap, chairs, crockery and vessels for any size event.',
    delivery: 'Free within 8 km',
    setup: 'Included',
    minOrder: '₹3,000',
    areas: ['Ameerpet', 'SR Nagar', 'Punjagutta'],
  },
  {
    id: 'v2',
    name: 'Balaji Decorators',
    area: 'Kukatpally',
    city: 'Hyderabad',
    km: 5.6,
    hours: '8 AM – 10 PM',
    verified: true,
    rating: 4.5,
    reviews: 128,
    years: '8 yrs',
    blurb: 'Chairs, tables, lighting and stage decor with same-day setup. Trusted by 100+ event planners in Kukatpally and Miyapur.',
    delivery: '₹500 flat',
    setup: 'Included',
    minOrder: '₹2,000',
    areas: ['Kukatpally', 'Miyapur', 'KPHB'],
  },
  {
    id: 'v3',
    name: 'Hyderabad Sound & Light',
    area: 'Begumpet',
    city: 'Hyderabad',
    km: 6.9,
    hours: '9 AM – 9 PM',
    verified: false,
    rating: 4.3,
    reviews: 64,
    years: '5 yrs',
    blurb: 'Professional DJ, PA systems and stage lighting for weddings, corporate events and birthdays.',
    delivery: '₹800 flat',
    setup: 'Included',
    minOrder: '₹5,000',
    areas: ['Begumpet', 'Somajiguda', 'Banjara Hills'],
  },
];

export const PRODUCTS: Product[] = [
  {
    id: 'i1',
    name: 'Premium Shamiana (40×60 ft)',
    cat: 'Shamiana & Tents',
    vendorId: 'v1',
    rating: 4.7,
    price: 8500,
    unit: '/ day',
    specs: 'Waterproof canopy, decorative fall ceiling, side wall panels included. Setup and pickup handled by the vendor team.',
    deposit: '₹2,000 refundable',
    min: '1 unit',
    isInstant: true,
    avail: { total: 6, reserved: 3, maint: 1, free: 2 },
  },
  {
    id: 'i2',
    name: 'Banquet Chairs, Steel Padded',
    cat: 'Chairs & Tables',
    vendorId: 'v2',
    rating: 4.5,
    price: 18,
    unit: '/ chair / day',
    specs: 'Cushioned steel banquet chairs, white cover option available. Stacked and delivered on pallets.',
    deposit: '₹1,000 refundable',
    min: '50 chairs',
    isInstant: true,
    avail: { total: 500, reserved: 180, maint: 20, free: 300 },
  },
  {
    id: 'i3',
    name: 'LED Stage Lighting Set',
    cat: 'Lighting',
    vendorId: 'v3',
    rating: 4.3,
    price: 6000,
    unit: '/ day',
    specs: 'Par LED wash lights, moving heads and a basic DMX controller. Technician included for setup.',
    deposit: '₹3,000 refundable',
    min: '1 set',
    isInstant: true,
    avail: { total: 4, reserved: 3, maint: 0, free: 1 },
  },
  {
    id: 'i4',
    name: 'Deksha & Bogana Combo (100 pax)',
    cat: 'Crockery & Vessels',
    vendorId: 'v1',
    rating: 4.6,
    price: 3200,
    unit: '/ day',
    specs: 'Full cooking vessel set for up to 100 guests — deksha, bogana, ladles and serving trays.',
    deposit: '₹1,500 refundable',
    min: '1 set',
    isInstant: true,
    avail: { total: 10, reserved: 4, maint: 1, free: 5 },
  },
  {
    id: 'i5',
    name: 'DJ & PA System, 2000W',
    cat: 'Sound & DJ',
    vendorId: 'v3',
    rating: 4.2,
    price: 9500,
    unit: '/ day',
    specs: '2000W PA system with wireless mics and a resident DJ for up to 6 hours.',
    deposit: '₹4,000 refundable',
    min: '1 set',
    isInstant: true,
    avail: { total: 3, reserved: 1, maint: 0, free: 2 },
  },
  {
    id: 'i6',
    name: 'Marigold Stage Backdrop',
    cat: 'Decor',
    vendorId: 'v2',
    rating: 4.6,
    price: 4200,
    unit: '/ setup',
    specs: 'Fresh marigold and rose backdrop with LED name board. Design varies by season and availability.',
    deposit: '₹1,000 refundable',
    min: '1 setup',
    isInstant: true,
    avail: { total: 5, reserved: 2, maint: 0, free: 3 },
  },
  {
    id: 'i7',
    name: 'Custom Mandap Design',
    cat: 'Decor',
    vendorId: 'v1',
    rating: 4.8,
    price: 0,
    unit: '',
    specs: 'Bespoke mandap built to your theme and budget. Needs a site visit, so the vendor sends a price quote before booking.',
    deposit: '—',
    min: '—',
    isInstant: false,
    avail: { total: 0, reserved: 0, maint: 0, free: 0 },
  },
];

export type Hall = {
  id: string;
  type: string;
  name: string;
  verified: boolean;
  rating: number;
  reviews: number;
  km: number;
  area: string;
  city: string;
  blurb: string;
  address: string;
  cap: string;
  ac: boolean;
  facts: Array<{ k: string; v: string }>;
  hasCrockery: boolean;
  amenities: string;
  // 'rent' (default): hall charges a flat rent, catering billed separately.
  // 'perPlate': hall is complimentary once a minimum plate count is met; the owner
  // charges per plate instead. Owner's choice — mock halls are 'rent' by default.
  pricingMode?: 'rent' | 'perPlate';
  rent: number;
  platePrice?: number;
  minPlates?: number;
  token: number;
  // Present once this hall is backed by a real registered Partner account — lets a
  // token payment auto-credit that partner's payout ledger. Undefined for mock halls.
  partnerId?: string;
  phone?: string;
  photos?: string[];
};

export const HALLS: Hall[] = [
  {
    id: 'h1',
    type: 'Marriage hall',
    name: 'Sri Kalyana Mandapam',
    verified: true,
    rating: 4.6,
    reviews: 184,
    km: 2.1,
    area: 'Ameerpet',
    city: 'Hyderabad',
    blurb: 'A traditional marriage hall with a large main hall and separate dining area, popular for South Indian weddings and receptions.',
    address: '4-6-12, Ameerpet Main Road, Hyderabad, Telangana 500016',
    cap: '500–800 pax',
    ac: true,
    facts: [
      { k: 'Capacity', v: '500–800 pax' },
      { k: 'Parking', v: '150 cars' },
      { k: 'Stage', v: 'Included' },
      { k: 'Catering', v: 'Outside allowed' },
      { k: 'Decoration', v: 'Outside allowed' },
      { k: 'Music curfew', v: '10:30 PM' },
      { k: 'Advance notice', v: '7 days' },
      { k: 'Cancellation', v: 'Flexible' },
    ],
    hasCrockery: false,
    amenities: 'AC halls, dressing rooms, elevator, power backup, valet parking',
    rent: 85000,
    token: 5000,
  },
  {
    id: 'h2',
    type: 'Banquet hall',
    name: 'The Grand Banquet',
    verified: true,
    rating: 4.8,
    reviews: 231,
    km: 4.8,
    area: 'Gachibowli',
    city: 'Hyderabad',
    blurb: 'A modern banquet hall with in-house catering and decor teams, ideal for receptions, birthdays and corporate events.',
    address: 'Plot 22, Financial District, Gachibowli, Hyderabad, Telangana 500032',
    cap: '200–350 pax',
    ac: true,
    facts: [
      { k: 'Capacity', v: '200–350 pax' },
      { k: 'Parking', v: '80 cars' },
      { k: 'Stage', v: 'Included' },
      { k: 'Catering', v: 'In-house only' },
      { k: 'Decoration', v: 'In-house preferred' },
      { k: 'Music curfew', v: '11:00 PM' },
      { k: 'Advance notice', v: '3 days' },
      { k: 'Cancellation', v: 'Moderate' },
    ],
    hasCrockery: true,
    amenities: 'AC hall, in-house catering, DJ console, bridal suite, generator backup',
    rent: 120000,
    token: 8000,
  },
];

export function getHall(id: string): Hall | undefined {
  return HALLS.find((h) => h.id === id);
}

export const REVIEWS: Review[] = [
  { vendorId: 'v1', by: 'Priya K.', stars: 5, text: 'Shamiana and vessels were exactly as shown, setup was done well before our guests arrived.', date: '3 weeks ago' },
  { vendorId: 'v1', by: 'Ravi Teja', stars: 4, text: 'Good quality, slightly late pickup the next day but they apologised and waived the extra charge.', date: '2 months ago' },
  { vendorId: 'v2', by: 'Anitha Reddy', stars: 5, text: 'Chairs were spotless and the stage backdrop looked even better than the photos.', date: '1 month ago' },
  { vendorId: 'v2', by: 'Karthik M.', stars: 4, text: 'Reliable and on time. Would book again for our next event.', date: '5 weeks ago' },
  { vendorId: 'v3', by: 'Sandhya P.', stars: 4, text: 'DJ kept the crowd going all night, sound quality was great for the price.', date: '2 weeks ago' },
];

export function getVendor(id: string): Vendor | undefined {
  return VENDORS.find((v) => v.id === id);
}

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function productsByVendor(vendorId: string): Product[] {
  return PRODUCTS.filter((p) => p.vendorId === vendorId);
}

export function reviewsByVendor(vendorId: string): Review[] {
  return REVIEWS.filter((r) => r.vendorId === vendorId);
}

export function availBadge(p: Product): { label: string; ok: boolean } {
  if (!p.isInstant) return { label: 'Quote only', ok: true };
  if (p.avail.free <= 0) return { label: 'Sold out', ok: false };
  if (p.avail.free <= 2) return { label: `Only ${p.avail.free} left`, ok: false };
  return { label: 'In stock', ok: true };
}
