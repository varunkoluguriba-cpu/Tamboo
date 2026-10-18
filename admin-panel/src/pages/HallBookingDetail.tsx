import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type BookingT = {
  _id: string;
  customer: { _id: string; name: string; phone: string } | null;
  partner: { _id: string; businessName: string; phone: string } | null;
  hallId: string;
  hallName: string;
  customerName: string;
  customerPhone: string;
  date: string;
  slot: string;
  guests: number;
  amount: number;
  finalRent: number;
  advanceAmount: number;
  source: 'online' | 'offline';
  status: string;
  createdAt: string;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const STATUSES = ['token_paid', 'visited', 'awaiting_advance', 'confirmed', 'not_booked', 'cancelled', 'disputed'];
const badgeFor = (s: string) => (['cancelled', 'disputed', 'not_booked'].includes(s) ? 'rejected' : ['confirmed', 'visited'].includes(s) ? 'verified' : 'pending');

export default function HallBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { logout } = useAuth();
  const [booking, setBooking] = useState<BookingT | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api.get<BookingT>(`/api/admin/hall-bookings/${id}`)
      .then(setBooking)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load this booking.');
      })
      .finally(() => setLoading(false));
  }, [id, logout]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (status: string) => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await api.patch<BookingT>(`/api/admin/hall-bookings/${id}`, { status });
      setBooking(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      alert(err instanceof ApiError ? err.message : 'Could not update status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state">Loading…</div>;
  if (error || !booking) return <div className="empty-state">{error || 'Booking not found.'}</div>;

  return (
    <div>
      <Link to="/bookings" className="back-link">← Back to bookings & revenue</Link>
      <div className="top-bar">
        <h1 className="page-title" style={{ marginBottom: 4 }}>{booking.hallName}</h1>
        <span className={`badge ${badgeFor(booking.status)}`}>{booking.status.replace('_', ' ')}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-field"><label>Hall owner</label><div className="val">{booking.partner ? <Link to={`/partners/${booking.partner._id}`}>{booking.partner.businessName}</Link> : 'Unlinked'}</div></div>
        <div className="detail-field"><label>Customer</label><div className="val">{booking.customer ? <Link to={`/customers/${booking.customer._id}`}>{booking.customerName}</Link> : (booking.customerName || 'Offline booking')}</div></div>
        <div className="detail-field"><label>Phone</label><div className="val">{booking.customerPhone || '—'}</div></div>
        <div className="detail-field"><label>Date / slot</label><div className="val">{booking.date} · {booking.slot}</div></div>
        <div className="detail-field"><label>Guests</label><div className="val">{booking.guests}</div></div>
        <div className="detail-field"><label>Source</label><div className="val">{booking.source}</div></div>
        <div className="detail-field"><label>Token / Final rent / Advance</label><div className="val">{inr(booking.amount)} / {inr(booking.finalRent)} / {inr(booking.advanceAmount)}</div></div>
        <div className="detail-field"><label>Created</label><div className="val">{new Date(booking.createdAt).toLocaleDateString('en-IN')}</div></div>
      </div>

      <h3 style={{ marginTop: 20 }}>Change status</h3>
      <div className="action-row" style={{ flexWrap: 'wrap' }}>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={s === 'cancelled' || s === 'disputed' ? 'btn-reject' : 'btn-secondary'}
            disabled={saving || booking.status === s}
            onClick={() => setStatus(s)}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}
