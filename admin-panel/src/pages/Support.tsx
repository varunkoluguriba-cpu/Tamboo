import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type Thread = {
  type: 'customer' | 'partner';
  id: string;
  name: string;
  lastMessage: string;
  lastSender: 'customer' | 'partner' | 'admin';
  lastAt: string;
  unread: boolean;
};

export default function Support() {
  const { logout } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get<Thread[]>('/api/admin/support')
      .then((res) => { if (!cancelled) setThreads(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load support threads.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [logout]);

  return (
    <div>
      <h1 className="page-title">Support</h1>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : threads.length === 0 ? (
        <div className="empty-state">No support messages yet.</div>
      ) : (
        threads.map((th) => (
          <Link key={`${th.type}:${th.id}`} to={`/support/${th.type}/${th.id}`} className="partner-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="partner-name">{th.name}</div>
              <div className="partner-meta" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {th.lastSender === 'admin' ? 'You: ' : ''}{th.lastMessage}
              </div>
            </div>
            <span className={`badge ${th.type === 'customer' ? 'verified' : 'pending'}`}>{th.type}</span>
            {th.unread && <span className="badge pending" style={{ marginLeft: 6 }}>new</span>}
          </Link>
        ))
      )}
    </div>
  );
}
