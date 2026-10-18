import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

type Stats = { pendingVerification: number; disputedCount: number };

const NAV_ITEMS: Array<{ to: string; label: string; end?: boolean; badgeKey?: keyof Stats }> = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/partners', label: 'Partners', badgeKey: 'pendingVerification' },
  { to: '/customers', label: 'Customers' },
  { to: '/halls', label: 'Halls' },
  { to: '/items', label: 'Items' },
  { to: '/quotes', label: 'Quotes' },
  { to: '/packages', label: 'Packages' },
  { to: '/bookings', label: 'Bookings & revenue' },
  { to: '/disputes', label: 'Disputes', badgeKey: 'disputedCount' },
  { to: '/support', label: 'Support' },
  { to: '/site-content', label: 'Marketing site' },
  { to: '/settings', label: 'Fees & coupons' },
  { to: '/audit', label: 'Audit log' },
];

export default function Layout() {
  const { logout } = useAuth();
  const [stats, setStats] = useState<Stats>({ pendingVerification: 0, disputedCount: 0 });

  useEffect(() => {
    api.get<Stats>('/api/admin/dashboard').then(setStats).catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo-row">
          <span className="sidebar-badge">tamboo</span>
          <span className="sidebar-sub">ADMIN</span>
        </div>

        {NAV_ITEMS.map((item) => {
          const badge = item.badgeKey ? stats[item.badgeKey] : 0;
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span>{item.label}</span>
              {!!badge && <span className="nav-badge">{badge}</span>}
            </NavLink>
          );
        })}

        <div className="sidebar-footer">
          <button className="btn-secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
