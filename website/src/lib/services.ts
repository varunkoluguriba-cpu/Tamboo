import { useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './auth';

// Event services are switched on by the server (for everyone, or only testers during beta). The
// site asks on load and again when the customer signs in or out.
export type ServicesConfig = { enabled: boolean; categories?: string[]; freeQuotes?: number; freeLeft?: number; fees?: Record<string, number>; noResponseHours?: number };

export function useServicesConfig(): ServicesConfig | null {
  const { user } = useAuth();
  const [cfg, setCfg] = useState<ServicesConfig | null>(null);
  useEffect(() => {
    api.get<ServicesConfig>('/api/services/config').then(setCfg).catch(() => setCfg({ enabled: false }));
  }, [user]);
  return cfg;
}
