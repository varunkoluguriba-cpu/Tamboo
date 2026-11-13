import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from './api';

export type User = { id: string; phone: string; name: string; email: string; city: string; area: string; registered: boolean; isGuest: boolean };
type Ctx = {
  user: User | null; loading: boolean;
  signIn: (idToken: string) => Promise<User>;
  register: (name: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  loginOpen: boolean; openLogin: () => void; closeLogin: () => void;
};
const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!getToken());
  const [loginOpen, setLoginOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const me = await api.get<User>('/api/auth/me');
      setUser(me.isGuest ? null : me);
    } catch (e) {
      // Only a rejected session logs out; a network blip keeps the token for next time.
      if ((e as { status?: number }).status === 401) { setToken(null); setUser(null); }
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const signIn = useCallback(async (idToken: string) => {
    const r = await api.post<{ token: string; user: User }>('/api/auth/verify', { idToken });
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }, []);
  const register = useCallback(async (name: string) => {
    const r = await api.post<{ user: User }>('/api/auth/register', { name, city: 'Hyderabad' });
    setUser(r.user);
  }, []);
  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  const value = useMemo(() => ({
    user, loading, signIn, register, logout, refresh,
    loginOpen, openLogin: () => setLoginOpen(true), closeLogin: () => setLoginOpen(false),
  }), [user, loading, signIn, register, logout, refresh, loginOpen]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
}
