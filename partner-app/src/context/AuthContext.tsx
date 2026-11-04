import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setToken, getToken, ApiError } from '../api/client';
import {
  sendOtp as fbSendOtp,
  confirmOtp as fbConfirmOtp,
  signInWithGoogle as fbSignInWithGoogle,
  type ConfirmationResult,
} from '../services/firebaseAuth';
import { PENDING_ACK_KEY } from '../constants';
import type { PartnerUser, RegisterPayload } from '../types';
import { AppState } from 'react-native';

const PROFILE_CACHE_KEY = 'tamboo-partner-profile';

interface AuthContextValue {
  partner: PartnerUser | null;
  loading: boolean;
  pendingAck: boolean;
  acknowledgePending: () => void;
  sendOtp: (e164Phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<PartnerUser>;
  continueWithGoogle: () => Promise<PartnerUser>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [partner, setPartner] = useState<PartnerUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Stores which partner id has dismissed the pending-review screen — must be scoped
  // per-account, since a global flag would let a second partner (e.g. after logout and
  // logging in as a different business) inherit the first partner's acknowledgment.
  const [ackedPartnerId, setAckedPartnerId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [otpPhone, setOtpPhone] = useState('');

  // The last profile we got from the server, kept on the phone so a dropped connection at
  // startup doesn't look like a logout. Only a 401 (token really invalid) signs the user out.
  const loadMe = useCallback(async () => {
    try {
      const me = await api.get<PartnerUser>('/api/partner-auth/me');
      setPartner(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await setToken(null);
        await AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
        setPartner(null);
        return;
      }
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY).catch(() => null);
      setPartner(cached ? JSON.parse(cached) : null);
    }
  }, []);

  const profile = partner;
  useEffect(() => {
    if (profile) AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile)).catch(() => {});
  }, [profile]);
  // Refresh from the server when the app comes back to the foreground (e.g. connection restored).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') getToken().then((tok) => { if (tok) loadMe(); });
    });
    return () => sub.remove();
  }, [loadMe]);

  useEffect(() => {
    (async () => {
      const [token, ackedId] = await Promise.all([getToken(), AsyncStorage.getItem(PENDING_ACK_KEY)]);
      if (ackedId) setAckedPartnerId(ackedId);
      if (token) await loadMe();
      setLoading(false);
    })();
  }, [loadMe]);

  const acknowledgePending = useCallback(() => {
    if (!partner) return;
    setAckedPartnerId(partner.id);
    AsyncStorage.setItem(PENDING_ACK_KEY, partner.id).catch(() => {});
  }, [partner]);

  const pendingAck = !!partner && ackedPartnerId === partner.id;

  const sendOtp = useCallback(async (e164Phone: string) => {
    const conf = await fbSendOtp(e164Phone);
    setConfirmation(conf);
    setOtpPhone(e164Phone);
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    if (!confirmation) throw new Error('Request an OTP first');
    const fbUser = await fbConfirmOtp(confirmation, code, otpPhone);
    const idToken = await fbUser.getIdToken();
    const res = await api.post<{ token: string; partner: PartnerUser }>('/api/partner-auth/verify', { idToken });
    await setToken(res.token);
    setPartner(res.partner);
    return res.partner;
  }, [confirmation, otpPhone]);

  const continueWithGoogle = useCallback(async () => {
    const fbUser = await fbSignInWithGoogle();
    const idToken = await fbUser.getIdToken();
    const res = await api.post<{ token: string; partner: PartnerUser }>('/api/partner-auth/google', { idToken });
    await setToken(res.token);
    setPartner(res.partner);
    return res.partner;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await api.post<{ partner: PartnerUser }>('/api/partner-auth/register', payload);
    setPartner(res.partner);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
    await setToken(null);
    setPartner(null);
  }, []);

  // Server refuses (409) while a booking/order is in progress — the error message says why.
  const deleteAccount = useCallback(async () => {
    await api.delete('/api/partner-auth/me');
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
    await setToken(null);
    setPartner(null);
  }, []);

  const value = useMemo(
    () => ({ partner, loading, pendingAck, acknowledgePending, sendOtp, verifyOtp, continueWithGoogle, register, logout, deleteAccount }),
    [partner, loading, pendingAck, acknowledgePending, sendOtp, verifyOtp, continueWithGoogle, register, logout, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
