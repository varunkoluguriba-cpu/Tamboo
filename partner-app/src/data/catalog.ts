// Mock partner-side data until the backend exposes real listings/orders/tokens endpoints.

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export type Order = {
  id: string;
  status: OrderStatus;
  event: string;
  customer: string;
  phone: string;
  address: string;
  guests: number;
  type: string;
  dateTxt: string;
  value: number;
  commission: number;
  earn: number;
  lines: Array<{ name: string; qty: number }>;
  history: Array<{ label: string; date: string }>;
  fromQuote: boolean;
};

export const ORDER_PROGRESSION: OrderStatus[] = ['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];
export const NEXT_LABEL: Record<OrderStatus, string> = {
  PENDING: '',
  CONFIRMED: 'Mark as packed',
  PACKED: 'Mark out for delivery',
  OUT_FOR_DELIVERY: 'Mark delivered',
  DELIVERED: 'Mark completed',
  COMPLETED: '',
  CANCELLED: '',
  DISPUTED: '',
};

export const ORDERS: Order[] = [
  {
    id: 'UT-250211',
    status: 'PENDING',
    event: 'Ananya Birthday',
    customer: 'Ananya Reddy',
    phone: '+91 90001 23456',
    address: '12-3-45, Kukatpally, Hyderabad, Telangana 500072',
    guests: 80,
    type: 'Birthday',
    dateTxt: '28 Oct 2026',
    value: 9500,
    commission: 950,
    earn: 8550,
    lines: [
      { name: 'Banquet Chairs, Steel Padded', qty: 80 },
      { name: 'Marigold Stage Backdrop', qty: 1 },
    ],
    history: [['Order placed', '24 Sep, 11:20 AM']].map(([label, date]) => ({ label, date })),
    fromQuote: false,
  },
  {
    id: 'UT-250142',
    status: 'CONFIRMED',
    event: 'Priya & Karthik Wedding',
    customer: 'Priya Sharma',
    phone: '+91 98490 44100',
    address: '4-6-12, Ameerpet, Hyderabad, Telangana 500016',
    guests: 300,
    type: 'Wedding',
    dateTxt: '12 Nov 2026',
    value: 42000,
    commission: 4200,
    earn: 37800,
    lines: [
      { name: 'Premium Shamiana (40×60 ft)', qty: 1 },
      { name: 'Deksha & Bogana Combo (100 pax)', qty: 3 },
    ],
    history: [
      { label: 'Order placed', date: '18 Sep, 4:05 PM' },
      { label: 'Accepted', date: '18 Sep, 5:40 PM' },
    ],
    fromQuote: false,
  },
  {
    id: 'UT-249981',
    status: 'COMPLETED',
    event: 'Office Diwali Party',
    customer: 'Karthik Menon',
    phone: '+91 90008 88221',
    address: 'Hitech City, Hyderabad, Telangana 500081',
    guests: 150,
    type: 'Corporate',
    dateTxt: '2 Nov 2025',
    value: 12300,
    commission: 1230,
    earn: 11070,
    lines: [{ name: 'LED Stage Lighting Set', qty: 2 }],
    history: [
      { label: 'Order placed', date: '28 Oct, 2:10 PM' },
      { label: 'Delivered', date: '2 Nov, 9:00 AM' },
      { label: 'Completed', date: '4 Nov, 6:30 PM' },
    ],
    fromQuote: false,
  },
];

export type QuoteStatus = 'AWAITING VENDOR' | 'OFFER SENT' | 'REVISION REQUESTED';

export type QuoteVersion = { v: number; total: number; lines: Array<{ label: string; amount: number }> };

export type Quote = {
  id: string;
  event: string;
  customer: string;
  customerId?: string;
  date: string;
  guests: number;
  need: string;
  isRevision: boolean;
  status: QuoteStatus;
  versions: QuoteVersion[];
};

export const QUOTES: Quote[] = [
  {
    id: 'QT-5521',
    event: 'Custom Mandap Design',
    customer: 'Priya Sharma',
    date: '12 Nov 2026',
    guests: 300,
    need: 'Traditional South Indian mandap with floral drapes, budget ₹25,000',
    isRevision: false,
    status: 'AWAITING VENDOR',
    versions: [],
  },
  {
    id: 'QT-5498',
    event: 'Corporate Stage Setup',
    customer: 'Karthik Menon',
    date: '5 Dec 2026',
    guests: 300,
    need: 'Stage + lighting + sound for 300 guests',
    isRevision: true,
    status: 'REVISION REQUESTED',
    versions: [
      {
        v: 1,
        total: 34500,
        lines: [
          { label: 'Stage & backdrop', amount: 18000 },
          { label: 'Lighting rig', amount: 9000 },
          { label: 'Sound system', amount: 7500 },
        ],
      },
    ],
  },
];

export type ItemState = 'LIVE' | 'REVIEW' | 'PAUSED';

export type MyItem = {
  id: string;
  name: string;
  cat: string;
  price: number;
  unit: string;
  stock: number;
  min: number;
  deposit: number;
  specs: string;
  instant: boolean;
  state: ItemState;
};

export const MY_ITEMS: MyItem[] = [
  { id: 'i1', name: 'Premium Shamiana (40×60 ft)', cat: 'tent', price: 8500, unit: '/ day', stock: 6, min: 1, deposit: 2000, specs: 'Waterproof canopy, decorative fall ceiling, side wall panels included.', instant: true, state: 'LIVE' },
  { id: 'i4', name: 'Deksha & Bogana Combo (100 pax)', cat: 'kitchen', price: 3200, unit: '/ day', stock: 10, min: 1, deposit: 1500, specs: 'Full cooking vessel set for up to 100 guests.', instant: true, state: 'LIVE' },
  { id: 'i7', name: 'Custom Mandap Design', cat: 'decor', price: 0, unit: '', stock: 0, min: 0, deposit: 0, specs: 'Bespoke mandap built to theme and budget. Needs a site visit.', instant: false, state: 'REVIEW' },
];

export const CATEGORY_OPTIONS = [
  { id: 'tent', name: 'Tent & Structures' },
  { id: 'seat', name: 'Seating' },
  { id: 'table', name: 'Tables' },
  { id: 'kitchen', name: 'Kitchen & Utensils' },
  { id: 'crockery', name: 'Crockery & Serving' },
  { id: 'floor', name: 'Flooring & Comfort' },
  { id: 'stage', name: 'Stage & Infrastructure' },
  { id: 'light', name: 'Lighting & Electrical' },
  { id: 'decor', name: 'Decor' },
  { id: 'av', name: 'Sound & AV' },
  { id: 'staff', name: 'Staff & Services' },
];

export const UNIT_OPTIONS = ['per unit / day', 'per unit / event', 'per event', 'per set / event'];

export type TokenStatus = 'ACTIVE' | 'VISITED' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED' | 'NOT_BOOKED';

export type HallToken = {
  id: string;
  status: TokenStatus;
  event: string;
  customer: string;
  phone: string;
  date: string;
  slot: string;
  guests: number;
  amount: number;
  paidAt: string;
  visitTxt: string;
  note: string;
};

export const HALL_TOKENS: HallToken[] = [
  {
    id: 'TK-88213',
    status: 'ACTIVE',
    event: 'Family Wedding',
    customer: 'Sandhya Rao',
    phone: '+91 90111 22334',
    date: '20 Dec 2026',
    slot: 'Evening',
    guests: 600,
    amount: 5000,
    paidAt: '28 Sep, 3:15 PM',
    visitTxt: 'Not visited yet',
    note: 'Customer will visit to see the hall and confirm the final rent.',
  },
  {
    id: 'TK-88190',
    status: 'VISITED',
    event: 'Engagement',
    customer: 'Rahul Varma',
    phone: '+91 90222 33445',
    date: '15 Nov 2026',
    slot: 'Morning',
    guests: 250,
    amount: 5000,
    paidAt: '20 Sep, 11:00 AM',
    visitTxt: 'Visited on 26 Sep',
    note: 'Waiting for you to confirm the final rent and booking.',
  },
];

export function getOrder(id: string): Order | undefined {
  return ORDERS.find((o) => o.id === id);
}

export function getQuote(id: string): Quote | undefined {
  return QUOTES.find((q) => q.id === id);
}

export function getItem(id: string): MyItem | undefined {
  return MY_ITEMS.find((i) => i.id === id);
}

export function getToken(id: string): HallToken | undefined {
  return HALL_TOKENS.find((t) => t.id === id);
}

export function statusColors(status: string): { bg: string; color: string } {
  switch (status) {
    case 'PENDING':
    case 'ACTIVE':
    case 'AWAITING VENDOR':
    case 'REVISION REQUESTED':
      return { bg: '#fff7e6', color: '#8a5a00' };
    case 'CONFIRMED':
    case 'DELIVERED':
    case 'COMPLETED':
    case 'VISITED':
      return { bg: '#e8f7f0', color: '#047857' };
    case 'CANCELLED':
    case 'DISPUTED':
    case 'EXPIRED':
      return { bg: '#fdecec', color: '#b91c1c' };
    case 'PACKED':
    case 'OUT_FOR_DELIVERY':
    case 'OFFER SENT':
      return { bg: '#fdeef3', color: '#a0133f' };
    default:
      return { bg: '#f4f1f8', color: '#4b4560' };
  }
}
