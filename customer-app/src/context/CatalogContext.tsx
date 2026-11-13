import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { PermissionsAndroid, Platform, AppState } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import { useEvent } from './EventContext';
import { useAuth } from './AuthContext';
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

async function withRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i >= tries - 1) throw err;
      await new Promise<void>((r) => setTimeout(() => r(), 1500 * (i + 1)));
    }
  }
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const { event } = useEvent();
  const [realHalls, setRealHalls] = useState<Hall[]>([]);
  const [realVendors, setRealVendors] = useState<Vendor[]>([]);
  const [realProducts, setRealProducts] = useState<Product[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Best-effort — if permission is denied or location fails, halls load without distance.
  // Asked only once the person is signed in (or browsing as guest) and on the home screen with
  // "Halls near you" — not as the very first thing on a fresh install, before they know why.
  const { user } = useAuth();
  const signedIn = !!user;
  useEffect(() => {
    if (!signedIn) return;
    const getLocation = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }
      Geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    };
    getLocation();
  }, [signedIn]);

  // Mobile networks drop requests often, so retry a few times, and reload whenever the app
  // comes back to the foreground — otherwise one failed request leaves the lists empty.
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') setReloadKey((k) => k + 1); });
    return () => sub.remove();
  }, []);

  // Approximate area for the admin's area-wise analytics: at most once a day, only for real
  // accounts, and only when location was allowed (the server rounds it to ~1 km and keeps
  // just the locality).
  useEffect(() => {
    if (!coords || !user || user.isGuest) return;
    const KEY = 'tamboo-area-sent-at';
    AsyncStorage.getItem(KEY).then((v) => {
      if (v && Date.now() - Number(v) < 24 * 3600 * 1000) return;
      return api.put('/api/auth/me/location', coords).then(() => AsyncStorage.setItem(KEY, String(Date.now())));
    }).catch(() => {});
  }, [coords, user]);

  useEffect(() => {
    const qs = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
    let cancelled = false;
    withRetry(() => api.get<Hall[]>(`/api/halls${qs}`)).then((h) => { if (!cancelled) setRealHalls(h); }).catch(() => {});
    return () => { cancelled = true; };
  }, [coords, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    withRetry(() => api.get<Vendor[]>('/api/vendors')).then((v) => { if (!cancelled) setRealVendors(v); }).catch(() => {});
    return () => { cancelled = true; };
  }, [reloadKey]);

  // Refetches products whenever the event date changes, so "Booked"/"Free" on the product
  // screen reflects real committed stock for that date (see backend's getCommittedQtyByItem)
  // instead of the stale/empty figures from whatever date was active at first app load.
  useEffect(() => {
    if (realVendors.length === 0) return;
    const dateQS = event.date ? `?date=${encodeURIComponent(event.date)}` : '';
    let cancelled = false;
    Promise.all(
      realVendors.map((v) => api.get<Product[]>(`/api/vendors/${v.id}/products${dateQS}`).catch(() => [] as Product[])),
    ).then((lists) => { if (!cancelled) setRealProducts(lists.flat()); });
    return () => { cancelled = true; };
  }, [realVendors, event.date]);

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
