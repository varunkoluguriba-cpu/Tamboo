import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type Msg = { id: string; sender: 'customer' | 'partner' | 'admin'; text: string; at: string };

const POLL_MS = 4000;

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function SupportThread() {
  const { type, id } = useParams<{ type: 'customer' | 'partner'; id: string }>();
  const { logout } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!type || !id) return undefined;
    const load = () => {
      api.get<Msg[]>(`/api/admin/support/${type}/${id}`)
        .then(setMsgs)
        .catch((err) => { if (err instanceof ApiError && err.status === 401) logout(); })
        .finally(() => setLoading(false));
    };
    load();
    pollRef.current = setInterval(load, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [type, id, logout]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !type || !id) return;
    setDraft('');
    try {
      const msg = await api.post<Msg>(`/api/admin/support/${type}/${id}`, { text });
      setMsgs((m) => [...m, msg]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    }
  };

  return (
    <div>
      <Link to="/support" className="back-link">&larr; Support</Link>
      <h1 className="page-title">{type === 'customer' ? 'Customer' : 'Partner'} thread</h1>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {msgs.length === 0 ? (
            <div className="empty-state">No messages yet.</div>
          ) : (
            msgs.map((m) => (
              <div key={m.id} className={`support-bubble ${m.sender === 'admin' ? 'mine' : 'theirs'}`}>
                <div className="support-bubble-text">{m.text}</div>
                <div className="support-bubble-time">{m.sender === 'admin' ? 'You' : m.sender} · {fmtTime(m.at)}</div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="payout-form">
        <div className="field">
          <input
            className="text-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Reply…"
          />
        </div>
        <button className="btn-approve" onClick={send} disabled={!draft.trim()}>Send</button>
      </div>
    </div>
  );
}
