import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type OrderRow = { _id: string; code: string; vendorName: string; value: number; status: string; createdAt: string };
type BookingRow = { _id: string; hallName: string; amount: number; status: string; date: string; slot: string; createdAt: string };
type QuoteRow = { _id: string; code: string; vendorName: string; status: string; createdAt: string };

type CustomerDetailT = {
  id: string;
  name: string;
  phone: string;
  email: string;
  authMethod: string;
  city: string;
  createdAt: string;
  orders: OrderRow[];
  bookings: BookingRow[];
  quotes: QuoteRow[];
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { logout } = useAuth();
  const [c, setC] = useState<CustomerDetailT | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    api.get<CustomerDetailT>(`/api/admin/users/${id}`)
      .then((res) => { if (!cancelled) setC(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load this customer.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, logout]);

  if (loading) return <div className="empty-state">Loading…</div>;
  if (error || !c) return <div className="empty-state">{error || 'Customer not found.'}</div>;

  return (
    <div>
      <Link to="/customers" className="back-link">← Back to customers</Link>
      <h1 className="page-title" style={{ marginBottom: 4 }}>{c.name || '(no name)'}</h1>

      <div className="detail-grid" style={{ marginBottom: 20 }}>
        <div className="detail-field"><label>Phone</label><div className="val">{c.phone || '—'}</div></div>
        <div className="detail-field"><label>Email</label><div className="val">{c.email || '—'}</div></div>
        <div className="detail-field"><label>Auth method</label><div className="val">{c.authMethod}</div></div>
        <div className="detail-field"><label>City</label><div className="val">{c.city}</div></div>
        <div className="detail-field"><label>Joined</label><div className="val">{new Date(c.createdAt).toLocaleDateString('en-IN')}</div></div>
      </div>

      <h3>Rental orders ({c.orders.length})</h3>
      {c.orders.length === 0 ? <div className="empty-state">None yet.</div> : c.orders.map((o) => (
        <Link key={o._id} to={`/orders/${o._id}`} className="ledger-row">
          <div className="ledger-desc">
            <div className="d">{o.code} · {o.vendorName}</div>
            <div className="m">{new Date(o.createdAt).toLocaleDateString('en-IN')} · {o.status}</div>
          </div>
          <div className="ledger-amt credit">{inr(o.value)}</div>
        </Link>
      ))}

      <h3 style={{ marginTop: 20 }}>Hall bookings ({c.bookings.length})</h3>
      {c.bookings.length === 0 ? <div className="empty-state">None yet.</div> : c.bookings.map((b) => (
        <Link key={b._id} to={`/hall-bookings/${b._id}`} className="ledger-row">
          <div className="ledger-desc">
            <div className="d">{b.hallName} · {b.date} · {b.slot}</div>
            <div className="m">{new Date(b.createdAt).toLocaleDateString('en-IN')} · {b.status}</div>
          </div>
          <div className="ledger-amt credit">{inr(b.amount)}</div>
        </Link>
      ))}

      <h3 style={{ marginTop: 20 }}>Quotes ({c.quotes.length})</h3>
      {c.quotes.length === 0 ? <div className="empty-state">None yet.</div> : c.quotes.map((q) => (
        <div key={q._id} className="ledger-row">
          <div className="ledger-desc">
            <div className="d">{q.code} · {q.vendorName}</div>
            <div className="m">{new Date(q.createdAt).toLocaleDateString('en-IN')} · {q.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
