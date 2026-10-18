import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type OrderLine = { itemId: string | null; name: string; qty: number; unitPrice: number };
type HistoryEntry = { label: string; date: string };

type OrderT = {
  _id: string;
  code: string;
  customer: { _id: string; name: string; phone: string } | null;
  partner: { _id: string; businessName: string; phone: string } | null;
  vendorName: string;
  customerName: string;
  customerPhone: string;
  eventType: string;
  eventName: string;
  dateTxt: string;
  address: string;
  guests: number;
  lines: OrderLine[];
  value: number;
  commissionPct: number;
  commission: number;
  earn: number;
  status: string;
  history: HistoryEntry[];
  createdAt: string;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const STATUSES = ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
const badgeFor = (s: string) => (['CANCELLED', 'DISPUTED'].includes(s) ? 'rejected' : ['COMPLETED', 'DELIVERED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY'].includes(s) ? 'verified' : 'pending');

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { logout } = useAuth();
  const [order, setOrder] = useState<OrderT | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api.get<OrderT>(`/api/admin/orders/${id}`)
      .then(setOrder)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load this order.');
      })
      .finally(() => setLoading(false));
  }, [id, logout]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (status: string) => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await api.patch<OrderT>(`/api/admin/orders/${id}`, { status });
      setOrder(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      alert(err instanceof ApiError ? err.message : 'Could not update status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state">Loading…</div>;
  if (error || !order) return <div className="empty-state">{error || 'Order not found.'}</div>;

  return (
    <div>
      <Link to="/bookings" className="back-link">← Back to bookings & revenue</Link>
      <div className="top-bar">
        <h1 className="page-title" style={{ marginBottom: 4 }}>{order.code}</h1>
        <span className={`badge ${badgeFor(order.status)}`}>{order.status}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-field"><label>Vendor</label><div className="val">{order.partner ? <Link to={`/partners/${order.partner._id}`}>{order.vendorName}</Link> : order.vendorName}</div></div>
        <div className="detail-field"><label>Customer</label><div className="val">{order.customer ? <Link to={`/customers/${order.customer._id}`}>{order.customerName}</Link> : order.customerName}</div></div>
        <div className="detail-field"><label>Phone</label><div className="val">{order.customerPhone}</div></div>
        <div className="detail-field"><label>Event</label><div className="val">{order.eventName || order.eventType || '—'} · {order.dateTxt}</div></div>
        <div className="detail-field"><label>Guests</label><div className="val">{order.guests}</div></div>
        <div className="detail-field"><label>Address</label><div className="val">{order.address || '—'}</div></div>
        <div className="detail-field"><label>Value / Commission / Vendor earns</label><div className="val">{inr(order.value)} / {inr(order.commission)} ({order.commissionPct}%) / {inr(order.earn)}</div></div>
        <div className="detail-field"><label>Placed</label><div className="val">{new Date(order.createdAt).toLocaleDateString('en-IN')}</div></div>
      </div>

      <h3 style={{ marginTop: 20 }}>Line items</h3>
      {order.lines.map((l, i) => (
        <div key={i} className="ledger-row">
          <div className="ledger-desc"><div className="d">{l.name}</div><div className="m">×{l.qty} @ {inr(l.unitPrice)}</div></div>
          <div className="ledger-amt credit">{inr(l.qty * l.unitPrice)}</div>
        </div>
      ))}

      <h3 style={{ marginTop: 20 }}>Change status</h3>
      <div className="action-row" style={{ flexWrap: 'wrap' }}>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={s === 'CANCELLED' || s === 'DISPUTED' ? 'btn-reject' : 'btn-secondary'}
            disabled={saving || order.status === s}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {order.history.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>History</h3>
          {order.history.map((h, i) => (
            <div key={i} className="ledger-row">
              <div className="ledger-desc"><div className="d">{h.label}</div><div className="m">{new Date(h.date).toLocaleString('en-IN')}</div></div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
