import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type Partner = {
  id: string;
  phone: string;
  role: 'tent' | 'venue';
  businessName: string;
  ownerName: string;
  city: string;
  area: string;
  venueType: string;
  categories: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
};

type PayoutEntry = {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference: string;
  createdAt: string;
};

const inr = (n: number) => `₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;

export default function PartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const { logout } = useAuth();

  const [partner, setPartner] = useState<Partner | null>(null);
  const [balance, setBalance] = useState(0);
  const [entries, setEntries] = useState<PayoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [formType, setFormType] = useState<'credit' | 'debit'>('credit');
  const [formAmount, setFormAmount] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formErr, setFormErr] = useState('');

  const handleAuthErr = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 401) { logout(); return true; }
    return false;
  }, [logout]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [p, ledger] = await Promise.all([
        api.get<Partner>(`/api/admin/partners/${id}`),
        api.get<{ balance: number; entries: PayoutEntry[] }>(`/api/admin/partners/${id}/payouts`),
      ]);
      setPartner(p);
      setBalance(ledger.balance);
      setEntries(ledger.entries);
    } catch (err) {
      if (!handleAuthErr(err)) setError(err instanceof ApiError ? err.message : 'Could not load this partner.');
    } finally {
      setLoading(false);
    }
  }, [id, handleAuthErr]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (status: 'verified' | 'rejected' | 'pending') => {
    if (!id) return;
    setSaving(true);
    try {
      const p = await api.patch<Partner>(`/api/admin/partners/${id}`, { verificationStatus: status });
      setPartner(p);
    } catch (err) {
      if (!handleAuthErr(err)) alert(err instanceof ApiError ? err.message : 'Could not update status.');
    } finally {
      setSaving(false);
    }
  };

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const amount = Number(formAmount);
    if (!amount || amount <= 0) return setFormErr('Enter a valid amount');
    setFormErr('');
    setSaving(true);
    try {
      await api.post(`/api/admin/partners/${id}/payouts`, { type: formType, amount, description: formDesc });
      setFormAmount('');
      setFormDesc('');
      await load();
    } catch (err) {
      if (!handleAuthErr(err)) setFormErr(err instanceof ApiError ? err.message : 'Could not add entry.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state">Loading…</div>;
  if (error || !partner) return <div className="empty-state">{error || 'Partner not found.'}</div>;

  return (
    <div>
      <Link to="/partners" className="back-link">← Back to partners</Link>
      <div className="top-bar">
        <h1 className="page-title" style={{ marginBottom: 4 }}>{partner.businessName}</h1>
        <span className={`badge ${partner.verificationStatus}`}>{partner.verificationStatus}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-field"><label>Owner</label><div className="val">{partner.ownerName}</div></div>
        <div className="detail-field"><label>Phone</label><div className="val">{partner.phone}</div></div>
        <div className="detail-field"><label>Role</label><div className="val">{partner.role === 'venue' ? partner.venueType || 'Venue' : 'Tent house'}</div></div>
        <div className="detail-field"><label>Location</label><div className="val">{partner.area ? `${partner.area}, ` : ''}{partner.city}</div></div>
        {partner.role === 'tent' && (
          <div className="detail-field"><label>Categories</label><div className="val">{partner.categories.join(', ') || '—'}</div></div>
        )}
        <div className="detail-field"><label>Joined</label><div className="val">{new Date(partner.createdAt).toLocaleDateString('en-IN')}</div></div>
      </div>

      <div className="action-row">
        <button className="btn-approve" disabled={saving || partner.verificationStatus === 'verified'} onClick={() => setStatus('verified')}>
          Approve
        </button>
        <button className="btn-reject" disabled={saving || partner.verificationStatus === 'rejected'} onClick={() => setStatus('rejected')}>
          Reject
        </button>
        {partner.verificationStatus !== 'pending' && (
          <button className="btn-secondary" disabled={saving} onClick={() => setStatus('pending')}>
            Reset to pending
          </button>
        )}
      </div>

      <div className="balance-banner">
        <div className="label">Current balance</div>
        <div className="value">{inr(balance)}</div>
      </div>

      <form className="payout-form" onSubmit={addEntry}>
        <div className="field">
          <label className="field-label">Type</label>
          <select className="text-input" value={formType} onChange={(e) => setFormType(e.target.value as 'credit' | 'debit')}>
            <option value="credit">Credit (earning)</option>
            <option value="debit">Debit (payout made)</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label">Amount (₹)</label>
          <input className="text-input" type="number" min="1" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 2 }}>
          <label className="field-label">Description</label>
          <input className="text-input" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="e.g. Token TK-88213 — Family Wedding" />
        </div>
        <button className="btn-secondary" type="submit" disabled={saving}>Add entry</button>
      </form>
      {!!formErr && <div className="error-text" style={{ marginTop: -12, marginBottom: 16 }}>{formErr}</div>}

      {entries.length === 0 ? (
        <div className="empty-state">No payout history yet.</div>
      ) : (
        entries.map((e) => (
          <div key={e._id} className="ledger-row">
            <div className="ledger-desc">
              <div className="d">{e.description || (e.type === 'credit' ? 'Earning' : 'Payout')}</div>
              <div className="m">{new Date(e.createdAt).toLocaleDateString('en-IN')}{e.reference ? ` · ${e.reference}` : ''}</div>
            </div>
            <div className={`ledger-amt ${e.type}`}>{e.type === 'credit' ? '+' : '-'}{inr(e.amount)}</div>
          </div>
        ))
      )}
    </div>
  );
}
