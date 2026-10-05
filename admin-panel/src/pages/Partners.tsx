import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type Partner = {
  id: string;
  phone: string;
  role: 'tent' | 'venue';
  businessName: string;
  ownerName: string;
  city: string;
  area: string;
  venueType: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
};

const TABS: Array<{ key: string; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
  { key: '', label: 'All' },
];

export default function Partners() {
  const { logout } = useAuth();
  const [tab, setTab] = useState('pending');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const qs = tab ? `?status=${tab}` : '';
    api.get<Partner[]>(`/api/admin/partners${qs}`)
      .then((res) => { if (!cancelled) setPartners(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load partners.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, logout]);

  return (
    <div>
      <h1 className="page-title">Partners</h1>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : partners.length === 0 ? (
        <div className="empty-state">No partners in this list.</div>
      ) : (
        partners.map((p) => (
          <Link key={p.id} to={`/partners/${p.id}`} className="partner-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="partner-name">{p.businessName || '(no business name)'}</div>
              <div className="partner-meta">
                {p.role === 'venue' ? p.venueType || 'Venue' : 'Tent house'} · {p.area ? `${p.area}, ` : ''}{p.city} · {p.phone}
              </div>
            </div>
            <span className={`badge ${p.verificationStatus}`}>{p.verificationStatus}</span>
          </Link>
        ))
      )}
    </div>
  );
}
