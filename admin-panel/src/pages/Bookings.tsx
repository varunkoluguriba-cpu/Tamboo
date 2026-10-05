import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type Booking = {
  id: string;
  hallName: string;
  date: string;
  slot: string;
  guests: number;
  amount: number;
  commissionPct: number;
  commission: number;
  status: string;
  partner: { id: string; businessName: string } | null;
  createdAt: string;
};

type RentalOrder = {
  id: string;
  code: string;
  vendorName: string;
  eventName: string;
  dateTxt: string;
  guests: number;
  value: number;
  commissionPct: number;
  commission: number;
  status: string;
  partner: { id: string; businessName: string } | null;
  createdAt: string;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function Bookings() {
  const { logout } = useAuth();
  const [tab, setTab] = useState<'halls' | 'rentals'>('halls');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get<{ totalCollected: number; totalCommission: number; bookings: Booking[]; orders: RentalOrder[] }>('/api/admin/bookings')
      .then((res) => {
        if (cancelled) return;
        setBookings(res.bookings);
        setOrders(res.orders);
        setTotalCollected(res.totalCollected);
        setTotalCommission(res.totalCommission);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load bookings.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [logout]);

  return (
    <div>
      <h1 className="page-title">Bookings & revenue</h1>

      <div className="detail-grid" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="detail-field"><label>Total collected (halls + rentals)</label><div className="val" style={{ fontSize: 22 }}>{inr(totalCollected)}</div></div>
        </div>
        <div className="card">
          <div className="detail-field"><label>Tamboo commission (kept)</label><div className="val" style={{ fontSize: 22, color: 'var(--green)' }}>{inr(totalCommission)}</div></div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab === 'halls' ? ' active' : ''}`} onClick={() => setTab('halls')}>Hall tokens</button>
        <button className={`tab-btn${tab === 'rentals' ? ' active' : ''}`} onClick={() => setTab('rentals')}>Rental orders</button>
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : tab === 'halls' ? (
        bookings.length === 0 ? (
          <div className="empty-state">No token payments yet.</div>
        ) : (
          bookings.map((b) => (
            <div key={b.id} className="ledger-row">
              <div className="ledger-desc">
                <div className="d">{b.hallName} · {b.date} · {b.slot}</div>
                <div className="m">
                  {b.partner ? b.partner.businessName : 'Not linked to a partner'} · {b.guests} guests · {new Date(b.createdAt).toLocaleDateString('en-IN')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="ledger-amt credit">{inr(b.amount)}</div>
                <div className="m" style={{ marginTop: 2 }}>{inr(b.commission)} commission ({b.commissionPct}%)</div>
              </div>
            </div>
          ))
        )
      ) : orders.length === 0 ? (
        <div className="empty-state">No rental orders yet.</div>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="ledger-row">
            <div className="ledger-desc">
              <div className="d">{o.code} · {o.vendorName} · {o.eventName || 'Event'}</div>
              <div className="m">
                {o.partner ? o.partner.businessName : 'Not linked to a partner'} · {o.dateTxt} · {o.guests} guests · <span className="badge pending" style={{ padding: '2px 8px' }}>{o.status}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="ledger-amt credit">{inr(o.value)}</div>
              <div className="m" style={{ marginTop: 2 }}>{inr(o.commission)} commission ({o.commissionPct}%)</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
