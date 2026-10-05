import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import type { OrderStatus } from '../data/catalog';

export type RemoteOrder = {
  id: string;
  code: string;
  status: OrderStatus;
  event: string;
  customer: string;
  customerId: string;
  phone: string;
  address: string;
  guests: number;
  type: string;
  dateTxt: string;
  value: number;
  commission: number;
  earn: number;
  lines: Array<{ name: string; qty: number; unitPrice: number }>;
  history: Array<{ label: string; date: string }>;
  fromQuote: boolean;
};

export function useOrders() {
  const [orders, setOrders] = useState<RemoteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get<RemoteOrder[]>('/api/vendors/me/orders');
      setOrders(res);
      setError('');
    } catch {
      setError('Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { orders, loading, error, reload: load };
}
