import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type Row = {
  id: string; code: string; category: string; vendorName: string; vendorId: string;
  customerName: string; customerPhone: string; eventDate: string; fee: number;
  status: 'NEW' | 'CONTACTED' | 'CLOSED' | 'NO_RESPONSE'; smsSent: boolean; createdAt: string; refundStatus: string;
};

const CAT: Record<string, string> = { priest: 'Priest', catering: 'Catering', decor: 'Decoration', music: 'Music' };
const badge = (s: Row['status']) => (s === 'CLOSED' || s === 'CONTACTED' ? 'verified' : s === 'NO_RESPONSE' ? 'rejected' : 'pending');
const label = (s: Row['status']) => ({ NEW: 'waiting for vendor', CONTACTED: 'vendor called', CLOSED: 'done', NO_RESPONSE: 'no response (24h)' }[s]);

// Quote requests customers sent to event-service vendors (priest / catering / decor / music).
export default function ServiceRequests() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get<Row[]>('/api/admin/service-requests')
      .then((r) => { if (!cancelled) setRows(r); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load service requests.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [logout]);

  return (
    <div>
      <h1 className="page-title">Service requests</h1>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : rows.length === 0 ? (
        <div className="empty-state">No service requests yet.</div>
      ) : (
        rows.map((r) => (
          <div key={r.id} className="partner-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="partner-name">
                {r.code} · {CAT[r.category] || r.category} · <Link to={`/partners/${r.vendorId}`}>{r.vendorName}</Link>
              </div>
              <div className="partner-meta">
                {r.customerName} ({r.customerPhone}) · event {r.eventDate} · {r.fee > 0 ? `fee ₹${r.fee}` : 'free request'}
                {' · '}{r.smsSent ? 'SMS sent' : 'no SMS (app only)'}
                {r.refundStatus === 'pending' ? ' · refund owed' : r.refundStatus === 'refunded' ? ' · refunded' : ''}
              </div>
            </div>
            <span className={`badge ${badge(r.status)}`}>{label(r.status)}</span>
          </div>
        ))
      )}
    </div>
  );
}
