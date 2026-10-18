import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type DisputedOrder = {
  id: string; kind: 'order'; code: string; vendorName: string; customerName: string;
  customerPhone: string; value: number; dateTxt: string;
  partner: { id: string; businessName: string } | null; updatedAt: string;
};
type DisputedBooking = {
  id: string; kind: 'booking'; hallName: string; customerName: string;
  customerPhone: string; amount: number; date: string; slot: string;
  partner: { id: string; businessName: string } | null; updatedAt: string;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function Disputes() {
  const { logout } = useAuth();
  const [orders, setOrders] = useState<DisputedOrder[]>([]);
  const [bookings, setBookings] = useState<DisputedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get<{ orders: DisputedOrder[]; bookings: DisputedBooking[] }>('/api/admin/disputes')
      .then((res) => { if (!cancelled) { setOrders(res.orders); setBookings(res.bookings); } })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load disputes.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [logout]);

  const total = orders.length + bookings.length;

  return (
    <div>
      <h1 className="page-title">Disputes</h1>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : total === 0 ? (
        <div className="empty-state">No disputes right now — nothing needs attention.</div>
      ) : (
        <>
          {orders.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="partner-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="partner-name">{o.code} · {o.vendorName}</div>
                <div className="partner-meta">{o.customerName} · {o.customerPhone} · {o.dateTxt} · {inr(o.value)}</div>
              </div>
              <span className="badge rejected">order dispute</span>
            </Link>
          ))}
          {bookings.map((b) => (
            <Link key={b.id} to={`/hall-bookings/${b.id}`} className="partner-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="partner-name">{b.hallName}</div>
                <div className="partner-meta">{b.customerName} · {b.customerPhone} · {b.date} {b.slot} · {inr(b.amount)}</div>
              </div>
              <span className="badge rejected">booking dispute</span>
            </Link>
          ))}
        </>
      )}
    </div>
  );
}
