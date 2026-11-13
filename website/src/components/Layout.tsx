import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { LANGS, useLang } from '../lib/lang';
import { useServicesConfig } from '../lib/services';
import LoginModal from './LoginModal';
import PhoneModal from './PhoneModal';
import { Skyline } from './Scenes';

export default function Layout() {
  const { t, lang, setLang } = useLang();
  const { user, openLogin, loginOpen, phoneOpen } = useAuth();
  const services = useServicesConfig();
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  useEffect(() => { setMenu(false); window.scrollTo(0, 0); }, [loc.pathname]);

  const links = [
    { to: '/halls', label: t.webNavHalls },
    { to: '/farm-houses', label: t.webNavFarms },
    { to: '/rentals', label: t.webNavRentals },
    ...(services?.enabled ? [{ to: '/services', label: t.webNavServices }] : []),
    { to: '/bookings', label: t.webNavBookings },
  ];

  return (
    <>
      <header className="header">
        <div className="wrap header-in">
          <Link to="/" className="logo" aria-label="Tamboo home">tamboo</Link>
          <nav className="nav">
            {links.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
          </nav>
          <div className="header-end">
            <select className="lang-select" value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t.webLanguage}>
              {LANGS.map(([code, native]) => <option key={code} value={code}>{native}</option>)}
            </select>
            {user ? (
              <Link to="/account" className="btn btn-soft btn-sm">{user.name || t.webAccount}</Link>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={openLogin}>{t.webLogin}</button>
            )}
            <button className="menu-btn" onClick={() => setMenu((m) => !m)} aria-label={t.webMenu}>☰</button>
          </div>
        </div>
        <nav className={`mobile-nav ${menu ? 'open' : ''}`}>
          {links.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
        </nav>
      </header>

      <main className="wrap page">
        <Outlet />
      </main>

      <Skyline className="skyline" />
      <footer className="footer">
        <div className="wrap footer-in">
          <div className="stack" style={{ gap: 4 }}>
            <span className="logo" style={{ fontSize: 18 }}>tamboo</span>
            <span>{t.webFooterTagline}</span>
          </div>
          <div className="wrap-row" style={{ gap: 18 }}>
            <Link to="/halls">{t.webNavHalls}</Link>
            <Link to="/farm-houses">{t.webNavFarms}</Link>
            <Link to="/rentals">{t.webNavRentals}</Link>
            <a href="/privacy.html">{t.webPrivacy}</a>
          </div>
          <div className="small">© {new Date().getFullYear()} Tamboo · {t.webFooterCity}</div>
        </div>
      </footer>
      {loginOpen && <LoginModal />}
      {phoneOpen && <PhoneModal />}
    </>
  );
}
