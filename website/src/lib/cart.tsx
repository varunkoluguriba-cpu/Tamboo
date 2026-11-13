import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// Rental cart, kept in this browser. Prices shown here use the same formula as the app and the
// server (lib/cartPricing.js); the server re-prices every line from the database before charging.
export type CartLine = { productId: string; vendorId: string; vendorName: string; name: string; unit: string; unitPrice: number; qty: number; free: number };
export type VendorFees = { deliveryFee: number; setupFee: number; pickupFee: number };
export type CartEvent = { date: string; address: string; name: string; type: string; guests: string }; // date = DD/MM/YYYY
const KEY = 'tamboo-web-cart';
const PLATFORM_FEE_PCT = 0.02;
const TAX_PCT = 0.05;

type Saved = { lines: CartLine[]; fees: Record<string, VendorFees>; event: CartEvent };
const EMPTY: Saved = { lines: [], fees: {}, event: { date: '', address: '', name: '', type: 'Wedding', guests: '' } };

function load(): Saved {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Array.isArray(s.lines)) return { ...EMPTY, ...s }; } catch { /* ignore */ }
  return EMPTY;
}

type Ctx = Saved & {
  add: (line: Omit<CartLine, 'qty'>, qty: number, fees: VendorFees) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  setEvent: (e: Partial<CartEvent>) => void;
  count: number;
  totals: (deliveryMode: 'delivery' | 'pickup', discountPct: number) => { subtotal: number; delivery: number; platformFee: number; discount: number; tax: number; total: number };
};
const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Saved>(load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } }, [state]);

  const add = useCallback((line: Omit<CartLine, 'qty'>, qty: number, fees: VendorFees) => setState((s) => {
    const existing = s.lines.find((l) => l.productId === line.productId);
    const lines = existing ? s.lines.map((l) => (l.productId === line.productId ? { ...l, ...line, qty: l.qty + qty } : l)) : [...s.lines, { ...line, qty }];
    return { ...s, lines, fees: { ...s.fees, [line.vendorId]: fees } };
  }), []);
  const setQty = useCallback((productId: string, qty: number) => setState((s) => ({
    ...s, lines: qty <= 0 ? s.lines.filter((l) => l.productId !== productId) : s.lines.map((l) => (l.productId === productId ? { ...l, qty } : l)),
  })), []);
  const clear = useCallback(() => setState((s) => ({ ...EMPTY, event: s.event })), []);
  const setEvent = useCallback((e: Partial<CartEvent>) => setState((s) => ({ ...s, event: { ...s.event, ...e } })), []);

  const value = useMemo<Ctx>(() => ({
    ...state, add, setQty, clear, setEvent,
    count: state.lines.length,
    totals: (deliveryMode, discountPct) => {
      const subtotal = state.lines.reduce((n, l) => n + l.unitPrice * l.qty, 0);
      const vendors = [...new Set(state.lines.map((l) => l.vendorId))];
      const delivery = deliveryMode === 'delivery' ? vendors.reduce((n, v) => n + (state.fees[v]?.deliveryFee || 0) + (state.fees[v]?.setupFee || 0) + (state.fees[v]?.pickupFee || 0), 0) : 0;
      const platformFee = Math.round(subtotal * PLATFORM_FEE_PCT);
      const discount = discountPct ? Math.round(subtotal * (discountPct / 100)) : 0;
      const tax = Math.round((subtotal - discount) * TAX_PCT);
      return { subtotal, delivery, platformFee, discount, tax, total: subtotal - discount + delivery + platformFee + tax };
    },
  }), [state, add, setQty, clear, setEvent]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error('useCart outside CartProvider');
  return c;
}

// 'YYYY-MM-DD' <-> 'DD/MM/YYYY' (orders and stock use the latter).
export const toDMY = (ymd: string) => (/^\d{4}-\d{2}-\d{2}$/.test(ymd) ? `${ymd.slice(8)}/${ymd.slice(5, 7)}/${ymd.slice(0, 4)}` : '');
export const toYMD = (dmy: string) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dmy || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
