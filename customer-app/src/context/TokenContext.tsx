import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type HallToken = {
  hallId: string;
  hallName: string;
  date: string;
  slot: 'Morning' | 'Evening';
  guests: string;
  amount: number;
  heldAtMs: number;
  visitHours: number;
  visited: boolean;
};

interface TokenContextValue {
  token: HallToken | null;
  startToken: (data: Omit<HallToken, 'heldAtMs' | 'visited'>) => void;
  markVisited: () => void;
  clearToken: () => void;
}

const TokenContext = createContext<TokenContextValue | undefined>(undefined);

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<HallToken | null>(null);

  const startToken = useCallback((data: Omit<HallToken, 'heldAtMs' | 'visited'>) => {
    setToken({ ...data, heldAtMs: Date.now(), visited: false });
  }, []);

  const markVisited = useCallback(() => {
    setToken((t) => (t ? { ...t, visited: true } : t));
  }, []);

  const clearToken = useCallback(() => setToken(null), []);

  const value = useMemo(() => ({ token, startToken, markVisited, clearToken }), [token, startToken, markVisited, clearToken]);

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
