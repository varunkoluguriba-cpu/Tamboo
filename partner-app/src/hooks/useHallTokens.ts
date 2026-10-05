import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import type { TokenStatus } from '../data/catalog';

export type RemoteHallToken = {
  id: string;
  hallId: string;
  hallName: string;
  customer: string;
  customerId: string;
  phone: string;
  date: string;
  slot: string;
  guests: number;
  amount: number;
  finalRent: number;
  advancePct: number;
  advanceAmount: number;
  advanceDeadlineAtMs: number | null;
  status: 'token_paid' | 'visited' | 'awaiting_advance' | 'confirmed' | 'not_booked' | 'cancelled' | 'disputed';
  heldAtMs: number;
  visitHours: number;
};

// Server statuses map to the UI's TokenStatus tabs — 'token_paid' splits into ACTIVE vs
// EXPIRED depending on whether the 48h visit window has passed.
export function tokenUiStatus(tok: RemoteHallToken): TokenStatus {
  if (tok.status === 'token_paid') {
    const expired = Date.now() > tok.heldAtMs + tok.visitHours * 3600 * 1000;
    return expired ? 'EXPIRED' : 'ACTIVE';
  }
  if (tok.status === 'visited') return 'VISITED';
  if (tok.status === 'awaiting_advance') return 'AWAITING_ADVANCE';
  if (tok.status === 'confirmed') return 'CONFIRMED';
  if (tok.status === 'not_booked') return 'NOT_BOOKED';
  return 'CANCELLED'; // cancelled, disputed
}

export function useHallTokens() {
  const [tokens, setTokens] = useState<RemoteHallToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get<RemoteHallToken[]>('/api/halls/me/tokens');
      setTokens(res);
      setError('');
    } catch {
      setError('Could not load pre-bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { tokens, loading, error, reload: load };
}
