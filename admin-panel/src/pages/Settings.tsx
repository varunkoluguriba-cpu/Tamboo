import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type ConfigT = { commissionPct: number; defaultAdvancePct: number };
type Coupon = { _id: string; code: string; description: string; discountPct: number; active: boolean };

export default function Settings() {
  const { logout } = useAuth();
  const [config, setConfig] = useState<ConfigT | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPct, setNewPct] = useState('');
  const [couponErr, setCouponErr] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get<ConfigT>('/api/admin/config'), api.get<Coupon[]>('/api/admin/coupons')])
      .then(([c, cp]) => { setConfig(c); setCoupons(cp); })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load settings.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.put<ConfigT>('/api/admin/config', config);
      setConfig(res);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      alert(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const addCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const discountPct = Number(newPct);
    if (!newCode.trim()) return setCouponErr('Enter a coupon code');
    if (!discountPct || discountPct < 1 || discountPct > 100) return setCouponErr('Discount must be 1-100%');
    setCouponErr('');
    try {
      await api.post('/api/admin/coupons', { code: newCode.trim(), description: newDesc.trim(), discountPct });
      setNewCode(''); setNewDesc(''); setNewPct('');
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      setCouponErr(err instanceof ApiError ? err.message : 'Could not create coupon.');
    }
  };

  const toggleCoupon = async (c: Coupon) => {
    try {
      await api.patch(`/api/admin/coupons/${c._id}`, { active: !c.active });
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      alert(err instanceof ApiError ? err.message : 'Could not update coupon.');
    }
  };

  if (loading) return <div className="empty-state">Loading…</div>;
  if (error || !config) return <div className="empty-state">{error || 'Could not load.'}</div>;

  return (
    <div>
      <h1 className="page-title">Fees & coupons</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Fees & policies</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <label style={{ flex: 1, fontSize: 13.5, color: 'var(--text-soft)' }}>Commission on orders & tokens</label>
          <input
            className="text-input"
            style={{ width: 90, textAlign: 'right' }}
            type="number"
            value={config.commissionPct}
            onChange={(e) => { setConfig({ ...config, commissionPct: Number(e.target.value) }); setSaved(false); }}
          />
          <span style={{ width: 24, fontSize: 12.5, color: 'var(--text-muted)' }}>%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ flex: 1, fontSize: 13.5, color: 'var(--text-soft)' }}>Default hall advance % (new halls)</label>
          <input
            className="text-input"
            style={{ width: 90, textAlign: 'right' }}
            type="number"
            value={config.defaultAdvancePct}
            onChange={(e) => { setConfig({ ...config, defaultAdvancePct: Number(e.target.value) }); setSaved(false); }}
          />
          <span style={{ width: 24, fontSize: 12.5, color: 'var(--text-muted)' }}>%</span>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '0 28px' }} onClick={saveConfig} disabled={saving}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save settings'}
        </button>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Applies to new bookings. Existing bookings keep the rate they were booked at.
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Coupons</h3>
        {coupons.length === 0 ? (
          <div className="empty-state">No coupons yet.</div>
        ) : (
          coupons.map((c) => (
            <div key={c._id} className="ledger-row">
              <div className="ledger-desc">
                <div className="d">{c.code} — {c.discountPct}% off</div>
                <div className="m">{c.description || '—'}</div>
              </div>
              <button className="btn-secondary" onClick={() => toggleCoupon(c)}>{c.active ? 'Deactivate' : 'Activate'}</button>
            </div>
          ))
        )}

        <form onSubmit={addCoupon} style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <input className="text-input" style={{ flex: 1, minWidth: 120 }} placeholder="CODE" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
          <input className="text-input" style={{ flex: 2, minWidth: 160 }} placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <input className="text-input" style={{ width: 90 }} type="number" placeholder="%" value={newPct} onChange={(e) => setNewPct(e.target.value)} />
          <button className="btn-secondary" type="submit">+ Add coupon</button>
        </form>
        {!!couponErr && <div className="error-text" style={{ marginTop: 8 }}>{couponErr}</div>}
      </div>
    </div>
  );
}
