import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

export type ServiceCategory = 'priest' | 'catering' | 'decor' | 'music';

export type ServicesConfig = {
  enabled: boolean;
  categories?: ServiceCategory[];
  freeQuotes?: number;
  freeLeft?: number;
  fees?: Record<ServiceCategory, number>;
  noResponseHours?: number;
};

type Ctx = { config: ServicesConfig; refresh: () => void };

const ServicesContext = createContext<Ctx>({ config: { enabled: false }, refresh: () => {} });

// Whether event services are switched on for this customer (decided by the server — it can
// be on for testers only), plus the free-request count and fees the screens need to show.
// Anything other than a clear 'enabled: true' keeps Services hidden.
export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [config, setConfig] = useState<ServicesConfig>({ enabled: false });
  const refresh = useCallback(() => {
    if (!user) { setConfig({ enabled: false }); return; }
    api.get<ServicesConfig>('/api/services/config').then(setConfig).catch(() => {});
  }, [user]);
  useEffect(() => { refresh(); }, [refresh]);
  const value = useMemo(() => ({ config, refresh }), [config, refresh]);
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export const useServices = () => useContext(ServicesContext);
