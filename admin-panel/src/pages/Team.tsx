import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { useAuth, type AdminRole } from '../context/AuthContext';

type TeamMember = { _id: string; username: string; email: string; role: AdminRole; createdAt: string };

const ROLES: Array<{ value: AdminRole; label: string; desc: string }> = [
  { value: 'super_admin', label: 'Super Admin', desc: 'Full access to everything, including Team and Audit log.' },
  { value: 'support', label: 'Support', desc: 'Support chats, Customers, Partners, Bookings & revenue, Disputes.' },
  { value: 'operations', label: 'Operations', desc: 'Partners, Halls, Items, Quotes, Packages, Disputes.' },
  { value: 'finance', label: 'Finance', desc: 'Partners, Bookings & revenue, Fees & coupons.' },
  { value: 'marketing', label: 'Marketing', desc: 'Marketing site only.' },
];

export default function Team() {
  const { logout, me } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('support');
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<TeamMember[]>('/api/admin/team')
      .then(setTeam)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load the team.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return setFormErr('Enter a username');
    if (!email.trim()) return setFormErr('Enter an email');
    if (password.length < 8) return setFormErr('Password must be at least 8 characters');
    setFormErr('');
    setSaving(true);
    try {
      await api.post('/api/admin/team', { username: username.trim(), email: email.trim(), password, role });
      setUsername(''); setEmail(''); setPassword(''); setRole('support');
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      setFormErr(err instanceof ApiError ? err.message : 'Could not create account.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.username}'s account? They'll be logged out immediately.`)) return;
    try {
      await api.delete(`/api/admin/team/${member._id}`);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      alert(err instanceof ApiError ? err.message : 'Could not remove account.');
    }
  };

  return (
    <div>
      <h1 className="page-title">Team</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : (
          team.map((m) => (
            <div key={m._id} className="ledger-row">
              <div className="ledger-desc">
                <div className="d">{m.username}{m.username === me?.username ? ' (you)' : ''}</div>
                <div className="m">{m.email} · {ROLES.find((r) => r.value === m.role)?.label || m.role}</div>
              </div>
              {m.username !== me?.username && (
                <button className="btn-secondary" onClick={() => remove(m)}>Remove</button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Add a team member</h3>
        <form onSubmit={addMember}>
          <label className="field-label">Username</label>
          <input className="text-input" value={username} onChange={(e) => setUsername(e.target.value)} style={{ marginBottom: 12 }} />
          <label className="field-label">Email</label>
          <input className="text-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 12 }} />
          <label className="field-label">Password</label>
          <input className="text-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: 12 }} />
          <label className="field-label">Role</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, marginTop: 6 }}>
            {ROLES.map((r) => (
              <label key={r.value} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input type="radio" name="role" checked={role === r.value} onChange={() => setRole(r.value)} style={{ marginTop: 3 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.desc}</div>
                </div>
              </label>
            ))}
          </div>
          {!!formErr && <div className="error-text" style={{ marginBottom: 12 }}>{formErr}</div>}
          <button className="btn-primary" style={{ width: 'auto', padding: '0 28px' }} type="submit" disabled={saving}>
            {saving ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
