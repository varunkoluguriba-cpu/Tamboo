import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type RefundRow = {
  id: string; kind: 'order' | 'booking' | 'service'; title: string; customerName: string; customerPhone: string;
  amount: number; reason: string; paymentId: string; requestedAt: string; refundedAt: string | null; refundRef: string;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const when = (s: string | null) => (s ? new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '');

// Refunds owed to customers. Tamboo has no refund automation yet, so each one is paid from the
// Razorpay dashboard (Payments → find the payment id → Refund) and then marked paid here, which
// updates what the customer sees in their app.
export default function Refunds() {
  const { logout } = useAuth();
  const [tab, setTab] = useState<'pending' | 'refunded'>('pending');
  const [rows, setRows] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get<RefundRow[]>(`/api/admin/refunds?status=${tab}`)
      .then((r) => { setRows(r); setError(''); })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load refunds.');
      })
      .finally(() => setLoading(false));
  }, [tab, logout]);

  useEffect(() => { load(); }, [load]);

  const markPaid = async (r: RefundRow) => {
    const ref = window.prompt(`Refunded ${inr(r.amount)} to ${r.customerName} in Razorpay?\n\nPaste the Razorpay refund id (optional), then OK:`, '');
    if (ref === null) return;
    setBusyId(r.id);
    try {
      await api.post(`/api/admin/refunds/${r.kind}/${r.id}/mark-refunded`, { ref });
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Could not update.');
    } finally {
      setBusyId(null);
    }
  };

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <h1 className="page-title">Refunds</h1>
      <p className="partner-meta" style={{ marginBottom: 12 }}>
        Pay each refund from the Razorpay dashboard (Payments → search the payment id → Refund), then mark it paid here.
        Customers see “Refund in 5–7 days” until you do.
      </p>
      <div className="tabs">
        <button className={`tab-btn${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>To refund</button>
        <button className={`tab-btn${tab === 'refunded' ? ' active' : ''}`} onClick={() => setTab('refunded')}>Refunded</button>
      </div>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : rows.length === 0 ? (
        <div className="empty-state">{tab === 'pending' ? 'No refunds owed right now.' : 'No refunds marked paid yet.'}</div>
      ) : (
        <>
          {tab === 'pending' && <div className="partner-meta" style={{ margin: '8px 0' }}>{rows.length} to refund · {inr(total)} total</div>}
          {rows.map((r) => (
            <div key={`${r.kind}-${r.id}`} className="partner-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="partner-name">
                  {r.kind === 'service' ? <Link to="/service-requests">{r.title}</Link> : <Link to={r.kind === 'order' ? `/orders/${r.id}` : `/hall-bookings/${r.id}`}>{r.title}</Link>} · {inr(r.amount)}
                </div>
                <div className="partner-meta">{r.customerName} · {r.customerPhone} · {r.reason}</div>
                <div className="partner-meta">
                  Payment id: <code>{r.paymentId || '—'}</code> · {tab === 'pending' ? `owed since ${when(r.requestedAt)}` : `refunded ${when(r.refundedAt)}${r.refundRef ? ` · ${r.refundRef}` : ''}`}
                </div>
              </div>
              {tab === 'pending' && (
                <button className="btn-approve" disabled={busyId === r.id} onClick={() => markPaid(r)}>
                  {busyId === r.id ? '…' : 'Mark refunded'}
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
