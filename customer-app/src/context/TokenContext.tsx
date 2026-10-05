import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

export type HallToken = {
  id: string;
  hallId: string;
  hallName: string;
  date: string;
  slot: 'Morning' | 'Evening';
  guests: string;
  amount: number;
  heldAtMs: number;
  visitHours: number;
  visited: boolean;
  status?: 'token_paid' | 'visited' | 'awaiting_advance' | 'confirmed' | 'not_booked' | 'cancelled' | 'disputed';
  finalRent?: number;
  advancePct?: number;
  advanceAmount?: number;
  advanceDeadlineAtMs?: number | null;
};

interface TokenContextValue {
  token: HallToken | null;
  startToken: (data: Omit<HallToken, 'visited'>) => void;
  markVisited: () => void;
  clearToken: () => void;
  refreshToken: () => Promise<void>;
  cancelToken: () => Promise<void>;
  notBookingToken: () => Promise<void>;
  disputeToken: () => Promise<void>;
}

const TokenContext = createContext<TokenContextValue | undefined>(undefined);

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [token, setToken] = useState<HallToken | null>(null);

  const startToken = useCallback((data: Omit<HallToken, 'visited'>) => {
    setToken({ ...data, visited: false });
  }, []);

  const markVisited = useCallback(() => {
    setToken((t) => (t ? { ...t, visited: true } : t));
  }, []);

  const clearToken = useCallback(() => setToken(null), []);

  const refreshToken = useCallback(async () => {
    try {
      const t = await api.get<HallToken | null>('/api/halls/my-token');
      setToken(t);
    } catch {
      // Stay on whatever local state we have — this is a best-effort sync, not critical path.
    }
  }, []);

  const cancelToken = useCallback(async () => {
    if (!token) return;
    await api.patch(`/api/halls/my-token/${token.id}`, { action: 'cancel' });
    setToken(null);
  }, [token]);

  const notBookingToken = useCallback(async () => {
    if (!token) return;
    await api.patch(`/api/halls/my-token/${token.id}`, { action: 'notBooking' });
    setToken(null);
  }, [token]);

  const disputeToken = useCallback(async () => {
    if (!token) return;
    await api.patch(`/api/halls/my-token/${token.id}`, { action: 'dispute' });
  }, [token]);

  useEffect(() => {
    if (user) refreshToken();
    else setToken(null);
  }, [user, refreshToken]);

  const value = useMemo(
    () => ({ token, startToken, markVisited, clearToken, refreshToken, cancelToken, notBookingToken, disputeToken }),
    [token, startToken, markVisited, clearToken, refreshToken, cancelToken, notBookingToken, disputeToken],
  );

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
}

export function useToken() {
  const ctx = useContext(TokenContext);
  if (!ctx) throw new Error('useToken must be used within TokenProvider');
  return ctx;
}

export function msLeft(t: HallToken): number {
  return Math.max(0, t.heldAtMs + t.visitHours * 3600 * 1000 - Date.now());
}

export function formatHoursLeft(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}
