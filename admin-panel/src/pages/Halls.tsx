import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type Hall = {
  id: string;
  name: string;
  venueType: string;
  address: string;
  rent: number;
  pricingMode: 'rent' | 'perPlate';
  platePrice: number;
  partner: { id: string; businessName: string; verificationStatus: string } | null;
  createdAt: string;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function Halls() {
  const { logout } = useAuth();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get<Hall[]>('/api/admin/halls')
      .then((res) => { if (!cancelled) setHalls(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load halls.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [logout]);

  return (
    <div>
      <h1 className="page-title">Halls</h1>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : halls.length === 0 ? (
        <div className="empty-state">No halls listed yet.</div>
      ) : (
        halls.map((h) => (
          <Link key={h.id} to={`/halls/${h.id}`} className="partner-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="partner-name">{h.name || '(no name)'}</div>
              <div className="partner-meta">
                {h.partner?.businessName || 'Unlinked'} · {h.venueType} · {h.pricingMode === 'rent' ? inr(h.rent) : `${inr(h.platePrice)}/plate`}
              </div>
            </div>
            {h.partner && <span className={`badge ${h.partner.verificationStatus}`}>{h.partner.verificationStatus}</span>}
          </Link>
        ))
      )}
    </div>
  );
}
