import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type QuoteRow = {
  id: string;
  code: string;
  vendorName: string;
  customerName: string;
  dateTxt: string;
  guests: number;
  need: string;
  status: string;
  latestTotal: number | null;
  partner: { id: string; businessName: string } | null;
  createdAt: string;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const statusBadge = (s: string) => (['ACCEPTED'].includes(s) ? 'verified' : ['DECLINED'].includes(s) ? 'rejected' : 'pending');

export default function Quotes() {
  const { logout } = useAuth();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get<QuoteRow[]>('/api/admin/quotes')
      .then((res) => { if (!cancelled) setQuotes(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load quotes.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [logout]);

  return (
    <div>
      <h1 className="page-title">Quotes</h1>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : quotes.length === 0 ? (
        <div className="empty-state">No quote requests yet.</div>
      ) : (
        quotes.map((q) => (
          <div key={q.id} className="partner-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="partner-name">{q.code} · {q.vendorName}</div>
              <div className="partner-meta">
                {q.customerName} · {q.need} · {q.guests} guests{q.latestTotal ? ` · ${inr(q.latestTotal)}` : ''}
              </div>
            </div>
            <span className={`badge ${statusBadge(q.status)}`}>{q.status.replace('_', ' ').toLowerCase()}</span>
          </div>
        ))
      )}
    </div>
  );
}
