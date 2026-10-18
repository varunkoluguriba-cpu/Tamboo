import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type LogEntry = { _id: string; who: string; what: string; target: string; before: string; after: string; createdAt: string };

export default function AuditLog() {
  const { logout } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get<LogEntry[]>('/api/admin/audit')
      .then((res) => { if (!cancelled) setLogs(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load the audit log.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [logout]);

  return (
    <div>
      <h1 className="page-title">Audit log</h1>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : logs.length === 0 ? (
        <div className="empty-state">No admin actions recorded yet.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
            <thead>
              <tr style={{ background: 'var(--bg)', textAlign: 'left', color: 'var(--text-soft)' }}>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>When</th>
                <th style={{ padding: 12, fontWeight: 600 }}>Who</th>
                <th style={{ padding: 12, fontWeight: 600 }}>Action</th>
                <th style={{ padding: 12, fontWeight: 600 }}>Target</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} style={{ borderTop: '1px solid var(--divider)' }}>
                  <td style={{ padding: '10px 18px', color: 'var(--text-soft)', whiteSpace: 'nowrap' }}>{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                  <td style={{ padding: 10 }}>{l.who}</td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{l.what}</td>
                  <td style={{ padding: 10 }}>{l.target || '—'}</td>
                  <td style={{ padding: '10px 18px', color: 'var(--text-soft)' }}>{l.before && l.after ? `${l.before} → ${l.after}` : l.after || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
