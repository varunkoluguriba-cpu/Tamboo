import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type Hall = {
  id: string;
  name: string;
  venueType: string;
  address: string;
  seated: number;
  floating: number;
  pricingMode: 'rent' | 'perPlate';
  rent: number;
  platePrice: number;
  token: number;
  photos: string[];
  partner: { id: string; businessName: string; verificationStatus: string } | null;
  createdAt: string;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function HallDetail() {
  const { id } = useParams<{ id: string }>();
  const { logout } = useAuth();
  const [hall, setHall] = useState<Hall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    api.get<Hall>(`/api/admin/halls/${id}`)
      .then((res) => { if (!cancelled) setHall(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load this hall.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, logout]);

  if (loading) return <div className="empty-state">Loading…</div>;
  if (error || !hall) return <div className="empty-state">{error || 'Hall not found.'}</div>;

  return (
    <div>
      <Link to="/halls" className="back-link">← Back to halls</Link>
      <div className="top-bar">
        <h1 className="page-title" style={{ marginBottom: 4 }}>{hall.name}</h1>
        {hall.partner && <span className={`badge ${hall.partner.verificationStatus}`}>{hall.partner.verificationStatus}</span>}
      </div>

      <div className="detail-grid">
        <div className="detail-field"><label>Owner</label><div className="val">{hall.partner ? <Link to={`/partners/${hall.partner.id}`}>{hall.partner.businessName}</Link> : 'Unlinked'}</div></div>
        <div className="detail-field"><label>Venue type</label><div className="val">{hall.venueType || '—'}</div></div>
        <div className="detail-field"><label>Address</label><div className="val">{hall.address || '—'}</div></div>
        <div className="detail-field"><label>Seated / Floating</label><div className="val">{hall.seated} / {hall.floating}</div></div>
        <div className="detail-field"><label>Pricing</label><div className="val">{hall.pricingMode === 'rent' ? `${inr(hall.rent)} flat rent` : `${inr(hall.platePrice)}/plate`}</div></div>
        <div className="detail-field"><label>Token</label><div className="val">{inr(hall.token)}</div></div>
        <div className="detail-field"><label>Listed</label><div className="val">{new Date(hall.createdAt).toLocaleDateString('en-IN')}</div></div>
      </div>

      {hall.photos.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Photos ({hall.photos.length})</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {hall.photos.map((p, i) => (
              <img key={i} src={p} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 12 }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
