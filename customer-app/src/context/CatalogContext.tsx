import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Hall, Vendor, Product } from '../data/catalog';

interface CatalogContextValue {
  halls: Hall[];
  getHall: (id: string) => Hall | undefined;
  vendors: Vendor[];
  getVendor: (id: string) => Vendor | undefined;
  products: Product[];
  getProduct: (id: string) => Product | undefined;
  productsByVendor: (vendorId: string) => Product[];
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [realHalls, setRealHalls] = useState<Hall[]>([]);
  const [realVendors, setRealVendors] = useState<Vendor[]>([]);
  const [realProducts, setRealProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.get<Hall[]>('/api/halls').then(setRealHalls).catch(() => {});

    api.get<Vendor[]>('/api/vendors').then(async (vs) => {
      setRealVendors(vs);
      const lists = await Promise.all(
        vs.map((v) => api.get<Product[]>(`/api/vendors/${v.id}/products`).catch(() => [] as Product[])),
      );
      setRealProducts(lists.flat());
    }).catch(() => {});
  }, []);

  // Real backend listings only — mock catalog data used to be merged in here, but a
  // customer could pay real money (via Razorpay) for a mock hall/product with no real
  // vendor behind it, since Booking/Order still get created with partner: null.
  const halls = realHalls;
  const vendors = realVendors;
  const products = realProducts;

  const value = useMemo<CatalogContextValue>(() => ({
    halls,
    getHall: (id) => halls.find((h) => h.id === id),
    vendors,
    getVendor: (id) => vendors.find((v) => v.id === id),
    products,
    getProduct: (id) => products.find((p) => p.id === id),
    productsByVendor: (vendorId) => products.filter((p) => p.vendorId === vendorId),
  }), [halls, vendors, products]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
