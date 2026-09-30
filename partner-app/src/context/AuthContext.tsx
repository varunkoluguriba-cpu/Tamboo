import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setToken, getToken, ApiError } from '../api/client';
import { sendOtp as fbSendOtp, confirmOtp as fbConfirmOtp, type ConfirmationResult } from '../services/firebaseAuth';
import { PENDING_ACK_KEY } from '../constants';
import type { PartnerUser, RegisterPayload } from '../types';

interface AuthContextValue {
  partner: PartnerUser | null;
  loading: boolean;
  pendingAck: boolean;
  acknowledgePending: () => void;
  sendOtp: (e164Phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<PartnerUser>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [partner, setPartner] = useState<PartnerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAck, setPendingAck] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const loadMe = useCallback(async () => {
    try {
      const me = await api.get<PartnerUser>('/api/partner-auth/me');
      setPartner(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) await setToken(null);
      setPartner(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const [token, ack] = await Promise.all([getToken(), AsyncStorage.getItem(PENDING_ACK_KEY)]);
      if (ack === '1') setPendingAck(true);
      if (token) await loadMe();
      setLoading(false);
    })();
  }, [loadMe]);

  const acknowledgePending = useCallback(() => {
    setPendingAck(true);
    AsyncStorage.setItem(PENDING_ACK_KEY, '1').catch(() => {});
  }, []);

  const sendOtp = useCallback(async (e164Phone: string) => {
    const conf = await fbSendOtp(e164Phone);
    setConfirmation(conf);
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    if (!confirmation) throw new Error('Request an OTP first');
    const fbUser = await fbConfirmOtp(confirmation, code);
    const idToken = await fbUser.getIdToken();
    const res = await api.post<{ token: string; partner: PartnerUser }>('/api/partner-auth/verify', { idToken });
    await setToken(res.token);
    setPartner(res.partner);
    return res.partner;
  }, [confirmation]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await api.post<{ partner: PartnerUser }>('/api/partner-auth/register', payload);
    setPartner(res.partner);
  }, []);

  const logout = useCallback(async () => {
    await setToken(null);
    setPartner(null);
  }, []);

  const value = useMemo(
    () => ({ partner, loading, pendingAck, acknowledgePending, sendOtp, verifyOtp, register, logout }),
    [partner, loading, pendingAck, acknowledgePending, sendOtp, verifyOtp, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
