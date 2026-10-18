import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './styles.css';
import { AuthProvider, useAuth, type Section } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Partners from './pages/Partners';
import PartnerDetail from './pages/PartnerDetail';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Halls from './pages/Halls';
import HallDetail from './pages/HallDetail';
import Items from './pages/Items';
import ItemDetail from './pages/ItemDetail';
import Quotes from './pages/Quotes';
import Packages from './pages/Packages';
import Bookings from './pages/Bookings';
import OrderDetail from './pages/OrderDetail';
import HallBookingDetail from './pages/HallBookingDetail';
import Disputes from './pages/Disputes';
import Support from './pages/Support';
import SupportThread from './pages/SupportThread';
import SiteContent from './pages/SiteContent';
import Settings from './pages/Settings';
import AuditLog from './pages/AuditLog';
import Team from './pages/Team';

function Gate({ children }: { children: React.ReactNode }) {
  const { loggedIn } = useAuth();
  return loggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

// Hides a route from anyone whose role doesn't include this section — not just a UI nicety,
// the backend enforces the same list independently (config/adminRoles.js), this just avoids
// showing a broken page and an inevitable 403 before redirecting home.
function SectionGate({ section, children }: { section: Section; children: React.ReactNode }) {
  const { can, meLoading } = useAuth();
  if (meLoading) return null;
  return can(section) ? <>{children}</> : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { loggedIn } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={loggedIn ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route path="/" element={<Gate><Layout /></Gate>}>
        <Route index element={<Dashboard />} />
        <Route path="partners" element={<SectionGate section="partners"><Partners /></SectionGate>} />
        <Route path="partners/:id" element={<SectionGate section="partners"><PartnerDetail /></SectionGate>} />
        <Route path="customers" element={<SectionGate section="customers"><Customers /></SectionGate>} />
        <Route path="customers/:id" element={<SectionGate section="customers"><CustomerDetail /></SectionGate>} />
        <Route path="halls" element={<SectionGate section="halls"><Halls /></SectionGate>} />
        <Route path="halls/:id" element={<SectionGate section="halls"><HallDetail /></SectionGate>} />
        <Route path="items" element={<SectionGate section="items"><Items /></SectionGate>} />
        <Route path="items/:id" element={<SectionGate section="items"><ItemDetail /></SectionGate>} />
        <Route path="quotes" element={<SectionGate section="quotes"><Quotes /></SectionGate>} />
        <Route path="packages" element={<SectionGate section="packages"><Packages /></SectionGate>} />
        <Route path="bookings" element={<SectionGate section="bookings"><Bookings /></SectionGate>} />
        <Route path="orders/:id" element={<SectionGate section="bookings"><OrderDetail /></SectionGate>} />
        <Route path="hall-bookings/:id" element={<SectionGate section="bookings"><HallBookingDetail /></SectionGate>} />
        <Route path="disputes" element={<SectionGate section="disputes"><Disputes /></SectionGate>} />
        <Route path="support" element={<SectionGate section="support"><Support /></SectionGate>} />
        <Route path="support/:type/:id" element={<SectionGate section="support"><SupportThread /></SectionGate>} />
        <Route path="site-content" element={<SectionGate section="site-content"><SiteContent /></SectionGate>} />
        <Route path="settings" element={<SectionGate section="settings"><Settings /></SectionGate>} />
        <Route path="audit" element={<SectionGate section="audit"><AuditLog /></SectionGate>} />
        <Route path="team" element={<SectionGate section="team"><Team /></SectionGate>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
