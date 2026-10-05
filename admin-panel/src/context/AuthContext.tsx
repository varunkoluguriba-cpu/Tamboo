import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api, ApiError, getToken, setToken } from '../api';

interface AuthContextValue {
  loggedIn: boolean;
  error: string;
  loading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (password: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ token: string }>('/api/admin-auth/login', { password });
      setToken(res.token);
      setLoggedIn(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not log in. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setLoggedIn(false);
  }, []);

  const value = useMemo(() => ({ loggedIn, error, loading, login, logout }), [loggedIn, error, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
