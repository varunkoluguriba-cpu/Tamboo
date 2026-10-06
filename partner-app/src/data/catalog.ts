// Mock partner-side data until the backend exposes real listings/orders/tokens endpoints.

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

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

export type TokenStatus = 'ACTIVE' | 'VISITED' | 'AWAITING_ADVANCE' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED' | 'NOT_BOOKED';

export function statusColors(status: string): { bg: string; color: string } {
  switch (status) {
    case 'PENDING':
    case 'ACTIVE':
    case 'AWAITING VENDOR':
    case 'AWAITING_ADVANCE':
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
