import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';

export type QuoteStatus = 'AWAITING VENDOR' | 'OFFER SENT' | 'REVISION REQUESTED';
export type QuoteVersion = { v: number; total: number; lines: Array<{ label: string; amount: number }> };
export type Quote = {
  id: string;
  event: string;
  customer: string;
  customerId?: string;
  phone: string;
  date: string;
  guests: number;
  need: string;
  isRevision: boolean;
  status: QuoteStatus;
  versions: QuoteVersion[];
};

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get<Quote[]>('/api/quotes/vendor/me');
      setQuotes(res);
      setError('');
    } catch {
      setError('Could not load quotes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { quotes, loading, error, reload: load };
}
