import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type ItemRow = {
  id: string;
  name: string;
  cat: string;
  price: number;
  stock: number;
  paused: boolean;
  partner: { id: string; businessName: string; verificationStatus: string } | null;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function Items() {
  const { logout } = useAuth();
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get<ItemRow[]>('/api/admin/items')
      .then((res) => { if (!cancelled) setItems(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load items.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [logout]);

  return (
    <div>
      <h1 className="page-title">Items</h1>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No items listed yet.</div>
      ) : (
        items.map((i) => (
          <Link key={i.id} to={`/items/${i.id}`} className="partner-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="partner-name">{i.name}</div>
              <div className="partner-meta">{i.partner?.businessName || 'Unlinked'} · {i.cat} · {inr(i.price)} · stock {i.stock}</div>
            </div>
            <span className={`badge ${i.paused ? 'rejected' : 'verified'}`}>{i.paused ? 'paused' : 'live'}</span>
          </Link>
        ))
      )}
    </div>
  );
}
