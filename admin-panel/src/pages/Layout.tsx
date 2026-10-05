import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-badge">tamboo</div>
        <NavLink to="/partners" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Partners
        </NavLink>
        <NavLink to="/bookings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Bookings & revenue
        </NavLink>
        <div className="sidebar-footer">
          <button className="btn-secondary" onClick={logout} style={{ width: '100%' }}>
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
