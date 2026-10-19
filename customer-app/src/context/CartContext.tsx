import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useCatalog } from './CatalogContext';

type Line = { productId: string; qty: number };
export type DeliveryMode = 'delivery' | 'pickup';

export type CartVendorGroup = {
  vendorId: string;
  vendorName: string;
  lines: Array<{ productId: string; name: string; qty: number; unitPrice: number; total: number; warn?: string }>;
  subtotal: number;
};

export type Pricing = {
  subtotal: number;
  delivery: number;
  platformFee: number;
  discount: number;
  tax: number;
  total: number;
};

interface CartContextValue {
  lines: Line[];
  itemCount: number;
  addToCart: (productId: string, qty: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeLine: (productId: string) => void;
  clearCart: () => void;
  groups: CartVendorGroup[];
  subtotal: number;
  vendorCount: number;
  couponCode: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  pricing: Pricing;
  deliveryMode: DeliveryMode;
  setDeliveryMode: (mode: DeliveryMode) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { getProduct, getVendor } = useCatalog();
  const [lines, setLines] = useState<Line[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  // Real discount %, fetched from the backend's Coupon collection when a code is applied —
  // never a hardcoded client-side map, so it always matches what admins actually create and
  // what create-order/verify will independently re-validate at checkout.
  const [couponDiscountPct, setCouponDiscountPct] = useState(0);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('delivery');

  const addToCart = useCallback((productId: string, qty: number) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) return prev.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l));
      return [...prev, { productId, qty }];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => l.productId !== productId);
      return prev.map((l) => (l.productId === productId ? { ...l, qty } : l));
    });
  }, []);

  const removeLine = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
    setCouponCode(null);
    setCouponDiscountPct(0);
    setDeliveryMode('delivery');
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase();
    try {
      const res = await api.get<{ valid: boolean; discountPct?: number }>(`/api/coupons/${encodeURIComponent(normalized)}`);
      if (res.valid && res.discountPct) {
        setCouponCode(normalized);
        setCouponDiscountPct(res.discountPct);
        return true;
      }
    } catch {
      // fall through to the invalid-coupon path below
    }
    setCouponCode(null);
    setCouponDiscountPct(0);
    return false;
  }, []);

  const groups = useMemo<CartVendorGroup[]>(() => {
    const byVendor = new Map<string, CartVendorGroup>();
    for (const line of lines) {
      const product = getProduct(line.productId);
      if (!product) continue;
      const vendor = getVendor(product.vendorId);
      if (!vendor) continue;
      const group = byVendor.get(vendor.id) || { vendorId: vendor.id, vendorName: vendor.name, lines: [], subtotal: 0 };
      const total = product.price * line.qty;
      const warn = line.qty > product.avail.free ? `Only ${product.avail.free} left for your date.` : undefined;
      group.lines.push({ productId: product.id, name: product.name, qty: line.qty, unitPrice: product.price, total, warn });
      group.subtotal += total;
      byVendor.set(vendor.id, group);
    }
    return Array.from(byVendor.values());
  }, [lines, getProduct, getVendor]);

  const subtotal = useMemo(() => groups.reduce((sum, g) => sum + g.subtotal, 0), [groups]);
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);

  const pricing = useMemo<Pricing>(() => {
    const delivery = deliveryMode === 'delivery' ? groups.length * 300 : 0;
    const platformFee = Math.round(subtotal * 0.02);
    const discount = couponCode ? Math.round(subtotal * (couponDiscountPct / 100)) : 0;
    const tax = Math.round((subtotal - discount) * 0.05);
    const total = subtotal - discount + delivery + platformFee + tax;
    return { subtotal, delivery, platformFee, discount, tax, total };
  }, [groups.length, subtotal, couponCode, couponDiscountPct, deliveryMode]);

  const value = useMemo(
    () => ({
      lines,
      itemCount,
      addToCart,
      updateQty,
      removeLine,
      clearCart,
      groups,
      subtotal,
      vendorCount: groups.length,
      couponCode,
      applyCoupon,
      pricing,
      deliveryMode,
      setDeliveryMode,
    }),
    [lines, itemCount, addToCart, updateQty, removeLine, clearCart, groups, subtotal, couponCode, applyCoupon, pricing, deliveryMode],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
