import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, getToken, setToken } from '../api';

export type AdminRole = 'super_admin' | 'support' | 'operations' | 'finance' | 'marketing';
export type Section = 'partners' | 'customers' | 'halls' | 'items' | 'quotes' | 'packages' | 'bookings' | 'disputes' | 'support' | 'site-content' | 'settings' | 'audit' | 'team';

interface Me {
  username: string;
  role: AdminRole;
  sections: Section[];
}

interface AuthContextValue {
  loggedIn: boolean;
  me: Me | null;
  meLoading: boolean;
  error: string;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  can: (section: Section) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [me, setMe] = useState<Me | null>(null);
  const [meLoading, setMeLoading] = useState(!!getToken());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setLoggedIn(false);
    setMe(null);
  }, []);

  const fetchMe = useCallback(() => {
    setMeLoading(true);
    api.get<Me>('/api/admin/me')
      .then(setMe)
      .catch((err) => { if (err instanceof ApiError && err.status === 401) logout(); })
      .finally(() => setMeLoading(false));
  }, [logout]);

  // Picks up an existing token from a previous session (page refresh) too, not just a
  // fresh login — otherwise the sidebar would render with no sections until next login.
  useEffect(() => { if (loggedIn) fetchMe(); }, [loggedIn, fetchMe]);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ token: string }>('/api/admin-auth/login', { username, password });
      setToken(res.token);
      setLoggedIn(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not log in. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const can = useCallback((section: Section) => !!me?.sections.includes(section), [me]);

  const value = useMemo(() => ({ loggedIn, me, meLoading, error, loading, login, logout, can }), [loggedIn, me, meLoading, error, loading, login, logout, can]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
