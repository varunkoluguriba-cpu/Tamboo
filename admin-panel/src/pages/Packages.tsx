import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type PackageRow = {
  id: string;
  name: string;
  description: string;
  items: Array<{ name: string; price: number; qty: number }>;
  partner: { id: string; businessName: string } | null;
  createdAt: string;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function Packages() {
  const { logout } = useAuth();
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get<PackageRow[]>('/api/admin/packages')
      .then((res) => { if (!cancelled) setPackages(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load packages.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [logout]);

  return (
    <div>
      <h1 className="page-title">Packages</h1>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : packages.length === 0 ? (
        <div className="empty-state">No packages created yet.</div>
      ) : (
        packages.map((p) => {
          const total = p.items.reduce((sum, it) => sum + it.price * it.qty, 0);
          return (
            <div key={p.id} className="partner-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="partner-name">{p.name}</div>
                <div className="partner-meta">
                  {p.partner?.businessName || 'Unlinked'} · {p.items.map((it) => `${it.name} ×${it.qty}`).join(', ')}
                </div>
              </div>
              <span className="badge verified">{inr(total)}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
