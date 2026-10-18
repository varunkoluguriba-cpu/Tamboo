import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type ItemT = {
  id: string;
  name: string;
  cat: string;
  price: number;
  unit: string;
  stock: number;
  paused: boolean;
  photos: string[];
  partner: { id: string; businessName: string; verificationStatus: string } | null;
  createdAt: string;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const { logout } = useAuth();
  const [item, setItem] = useState<ItemT | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    api.get<ItemT>(`/api/admin/items/${id}`)
      .then((res) => { if (!cancelled) setItem(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load this item.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, logout]);

  if (loading) return <div className="empty-state">Loading…</div>;
  if (error || !item) return <div className="empty-state">{error || 'Item not found.'}</div>;

  return (
    <div>
      <Link to="/items" className="back-link">← Back to items</Link>
      <div className="top-bar">
        <h1 className="page-title" style={{ marginBottom: 4 }}>{item.name}</h1>
        <span className={`badge ${item.paused ? 'rejected' : 'verified'}`}>{item.paused ? 'paused' : 'live'}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-field"><label>Vendor</label><div className="val">{item.partner ? <Link to={`/partners/${item.partner.id}`}>{item.partner.businessName}</Link> : 'Unlinked'}</div></div>
        <div className="detail-field"><label>Category</label><div className="val">{item.cat}</div></div>
        <div className="detail-field"><label>Price</label><div className="val">{inr(item.price)} {item.unit}</div></div>
        <div className="detail-field"><label>Stock</label><div className="val">{item.stock}</div></div>
        <div className="detail-field"><label>Listed</label><div className="val">{new Date(item.createdAt).toLocaleDateString('en-IN')}</div></div>
      </div>

      {item.photos.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Photos ({item.photos.length})</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {item.photos.map((p, i) => (
              <img key={i} src={p} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 12 }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
