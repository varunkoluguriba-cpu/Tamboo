import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type Stats = {
  totalUsers: number;
  totalPartners: number;
  pendingVerification: number;
  totalHalls: number;
  totalItems: number;
  disputedCount: number;
  totalCollected: number;
  totalCommission: number;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function Dashboard() {
  const { logout, can, me } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get<Stats>('/api/admin/dashboard')
      .then((res) => { if (!cancelled) setStats(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load dashboard.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [logout]);

  if (loading) return <div className="empty-state">Loading…</div>;
  if (error || !stats) return <div className="empty-state">{error || 'Could not load.'}</div>;

  const showRevenue = can('bookings');
  const showPartners = can('partners');
  const showCustomers = can('customers');
  const showHalls = can('halls');
  const showItems = can('items');
  const showDisputes = can('disputes');
  const anyCard = showRevenue || showPartners || showCustomers || showHalls || showItems || showDisputes;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      {!anyCard && me && (
        <div className="empty-state">
          Nothing to show here for your role ({me.role.replace('_', ' ')}) — use the sidebar to get to what you need.
        </div>
      )}

      {showRevenue && (
        <div className="detail-grid" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="detail-field"><label>Total collected</label><div className="val" style={{ fontSize: 22 }}>{inr(stats.totalCollected)}</div></div>
          </div>
          <div className="card">
            <div className="detail-field"><label>Tamboo commission</label><div className="val" style={{ fontSize: 22, color: 'var(--green)' }}>{inr(stats.totalCommission)}</div></div>
          </div>
        </div>
      )}

      {(showPartners || showCustomers || showHalls || showItems) && (
        <div className="detail-grid" style={{ marginBottom: 20 }}>
          {showPartners && (
            <Link to="/partners" className="card" style={{ display: 'block' }}>
              <div className="detail-field"><label>Partners</label><div className="val" style={{ fontSize: 22 }}>{stats.totalPartners}</div></div>
            </Link>
          )}
          {showCustomers && (
            <Link to="/customers" className="card" style={{ display: 'block' }}>
              <div className="detail-field"><label>Customers</label><div className="val" style={{ fontSize: 22 }}>{stats.totalUsers}</div></div>
            </Link>
          )}
          {showHalls && (
            <Link to="/halls" className="card" style={{ display: 'block' }}>
              <div className="detail-field"><label>Halls listed</label><div className="val" style={{ fontSize: 22 }}>{stats.totalHalls}</div></div>
            </Link>
          )}
          {showItems && (
            <Link to="/items" className="card" style={{ display: 'block' }}>
              <div className="detail-field"><label>Items listed</label><div className="val" style={{ fontSize: 22 }}>{stats.totalItems}</div></div>
            </Link>
          )}
        </div>
      )}

      {(showPartners || showDisputes) && (
        <div className="detail-grid">
          {showPartners && (
            <Link to="/partners?status=pending" className="card" style={{ display: 'block' }}>
              <div className="detail-field">
                <label>Pending verification</label>
                <div className="val" style={{ fontSize: 22, color: stats.pendingVerification > 0 ? 'var(--amber)' : undefined }}>{stats.pendingVerification}</div>
              </div>
            </Link>
          )}
          {showDisputes && (
            <Link to="/disputes" className="card" style={{ display: 'block' }}>
              <div className="detail-field">
                <label>Disputes needing attention</label>
                <div className="val" style={{ fontSize: 22, color: stats.disputedCount > 0 ? 'var(--danger)' : undefined }}>{stats.disputedCount}</div>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
