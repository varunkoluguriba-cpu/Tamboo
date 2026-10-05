import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, setToken, getToken, ApiError } from '../api/client';
import {
  sendOtp as fbSendOtp,
  confirmOtp as fbConfirmOtp,
  signInWithGoogle as fbSignInWithGoogle,
  type ConfirmationResult,
} from '../services/firebaseAuth';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  sendOtp: (e164Phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<AuthUser>;
  continueWithGoogle: () => Promise<AuthUser>;
  continueAsGuest: () => Promise<AuthUser>;
  register: (name: string, city: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

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
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    if (!confirmation) throw new Error('Request an OTP first');
    const fbUser = await fbConfirmOtp(confirmation, code);
    const idToken = await fbUser.getIdToken();
    const res = await api.post<{ token: string; user: AuthUser }>('/api/auth/verify', { idToken });
    await setToken(res.token);
    setUser(res.user);
    return res.user;
  }, [confirmation]);

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
    await setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, sendOtp, verifyOtp, continueWithGoogle, continueAsGuest, register, logout }),
    [user, loading, sendOtp, verifyOtp, continueWithGoogle, continueAsGuest, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
