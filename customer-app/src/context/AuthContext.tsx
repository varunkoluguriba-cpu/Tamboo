import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, setToken, getToken, ApiError } from '../api/client';
import {
  sendOtp as fbSendOtp,
  confirmOtp as fbConfirmOtp,
  signInWithGoogle as fbSignInWithGoogle,
  type ConfirmationResult,
} from '../services/firebaseAuth';
import type { AuthUser } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADDRESSES_KEY, CART_KEY, NOTIF_PREFS_KEY } from '../constants';

// Personal data kept on the phone — removed on logout so the next person can't see it.
const clearPersonalData = () => Promise.all([ADDRESSES_KEY, CART_KEY, NOTIF_PREFS_KEY].map((k) => AsyncStorage.removeItem(k).catch(() => {})));

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  sendOtp: (e164Phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<AuthUser>;
  continueWithGoogle: () => Promise<AuthUser>;
  continueAsGuest: () => Promise<AuthUser>;
  register: (name: string, city: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [otpPhone, setOtpPhone] = useState('');

  const loadMe = useCallback(async () => {
    try {
      const me = await api.get<AuthUser>('/api/auth/me');
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) await setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) await loadMe();
      setLoading(false);
    })();
  }, [loadMe]);

  const sendOtp = useCallback(async (e164Phone: string) => {
    const conf = await fbSendOtp(e164Phone);
    setConfirmation(conf);
    setOtpPhone(e164Phone);
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    if (!confirmation) throw new Error('Request an OTP first');
    const fbUser = await fbConfirmOtp(confirmation, code, otpPhone);
    const idToken = await fbUser.getIdToken();
    const res = await api.post<{ token: string; user: AuthUser }>('/api/auth/verify', { idToken });
    await setToken(res.token);
    setUser(res.user);
    return res.user;
  }, [confirmation, otpPhone]);

  const continueWithGoogle = useCallback(async () => {
    const fbUser = await fbSignInWithGoogle();
    const idToken = await fbUser.getIdToken();
    const res = await api.post<{ token: string; user: AuthUser }>('/api/auth/google', { idToken });
    await setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const continueAsGuest = useCallback(async () => {
    const res = await api.post<{ token: string; user: AuthUser }>('/api/auth/guest');
    await setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (name: string, city: string) => {
    const res = await api.post<{ user: AuthUser }>('/api/auth/register', { name, city });
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await clearPersonalData();
    await setToken(null);
    setUser(null);
  }, []);

  // Server refuses (409) while a booking/order is in progress — the error message says why.
  const deleteAccount = useCallback(async () => {
    await api.delete('/api/auth/me');
    await clearPersonalData();
    await setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, sendOtp, verifyOtp, continueWithGoogle, continueAsGuest, register, logout, deleteAccount }),
    [user, loading, sendOtp, verifyOtp, continueWithGoogle, continueAsGuest, register, logout, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
