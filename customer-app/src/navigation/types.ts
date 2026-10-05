export type AuthStackParamList = {
  Onboarding: undefined;
  Language: undefined;
  Login: undefined;
  Otp: { phone: string };
  Register: undefined;
};

export type RemoteOrderSummary = {
  id: string;
  code: string;
  status: string;
  vendorName: string;
  eventName: string;
  eventType: string;
  dateTxt: string;
  address: string;
  guests: number;
  lines: Array<{ name: string; qty: number; unitPrice: number }>;
  value: number;
  history: Array<{ label: string; date: string }>;
  createdAtMs: number;
};

export type RemoteHallBooking = {
  id: string;
  hallId: string;
  hallName: string;
  date: string;
  slot: string;
  guests: string;
  amount: number;
  finalRent: number;
  advancePct: number;
  advanceAmount: number;
  advanceDeadlineAtMs: number | null;
  status: string;
  heldAtMs: number;
  visitHours: number;
};

export type BookingDetailParams =
  | { kind: 'order'; order: RemoteOrderSummary }
  | { kind: 'hall'; hall: RemoteHallBooking };

export type RootStackParamList = {
  Home: undefined;
  Event: undefined;
  Browse: { category?: string };
  Vendor: { id: string };
  Product: { id: string };
  Cart: undefined;
  Checkout: undefined;
  Pay: undefined;
  Confirm: { orders: Array<{ id: string; vendor: string; total: number }> };
  Bookings: undefined;
  BookingDetail: BookingDetailParams;
  Venues: undefined;
  Venue: { id: string };
  TokenPay: { hallId: string; date: string; slot: 'Morning' | 'Evening' };
  TokenDone: undefined;
  Token: undefined;
  AdvancePay: undefined;
  Chat: { peerName: string; vendorId?: string };
  Notifications: undefined;
  Profile: undefined;
};
