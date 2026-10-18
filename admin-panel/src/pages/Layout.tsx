import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { api } from '../api';
import { useAuth, type Section } from '../context/AuthContext';

type Stats = { pendingVerification: number; disputedCount: number };

const NAV_ITEMS: Array<{ to: string; label: string; end?: boolean; section?: Section; badgeKey?: keyof Stats }> = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/partners', label: 'Partners', section: 'partners', badgeKey: 'pendingVerification' },
  { to: '/customers', label: 'Customers', section: 'customers' },
  { to: '/halls', label: 'Halls', section: 'halls' },
  { to: '/items', label: 'Items', section: 'items' },
  { to: '/quotes', label: 'Quotes', section: 'quotes' },
  { to: '/packages', label: 'Packages', section: 'packages' },
  { to: '/bookings', label: 'Bookings & revenue', section: 'bookings' },
  { to: '/disputes', label: 'Disputes', section: 'disputes', badgeKey: 'disputedCount' },
  { to: '/support', label: 'Support', section: 'support' },
  { to: '/site-content', label: 'Marketing site', section: 'site-content' },
  { to: '/settings', label: 'Fees & coupons', section: 'settings' },
  { to: '/audit', label: 'Audit log', section: 'audit' },
  { to: '/team', label: 'Team', section: 'team' },
];

export default function Layout() {
  const { logout, me, can } = useAuth();
  const [stats, setStats] = useState<Stats>({ pendingVerification: 0, disputedCount: 0 });

  useEffect(() => {
    api.get<Stats>('/api/admin/dashboard').then(setStats).catch(() => {});
  }, []);

  const visibleItems = NAV_ITEMS.filter((item) => !item.section || can(item.section));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo-row">
          <span className="sidebar-badge">tamboo</span>
          <span className="sidebar-sub">ADMIN</span>
        </div>

        {visibleItems.map((item) => {
          const badge = item.badgeKey ? stats[item.badgeKey] : 0;
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span>{item.label}</span>
              {!!badge && <span className="nav-badge">{badge}</span>}
            </NavLink>
          );
        })}

        <div className="sidebar-footer">
          {me && (
            <div style={{ fontSize: 11.5, color: '#b8b2c4', textAlign: 'center' }}>
              Signed in as <b style={{ color: '#fff' }}>{me.username}</b> · {me.role.replace('_', ' ')}
            </div>
          )}
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
