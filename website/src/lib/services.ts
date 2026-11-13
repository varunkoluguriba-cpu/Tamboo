import { useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './auth';

// Event services are switched on per customer by the server (testers only during beta), so the
// site asks once the customer is signed in — signed-out visitors never see the section.
export type ServicesConfig = { enabled: boolean; categories?: string[]; freeQuotes?: number; freeLeft?: number; fees?: Record<string, number>; noResponseHours?: number };

export function useServicesConfig(): ServicesConfig | null {
  const { user } = useAuth();
  const [cfg, setCfg] = useState<ServicesConfig | null>(null);
  useEffect(() => {
    if (!user) { setCfg(null); return; }
    api.get<ServicesConfig>('/api/services/config').then(setCfg).catch(() => setCfg(null));
  }, [user]);
  return cfg;
}
