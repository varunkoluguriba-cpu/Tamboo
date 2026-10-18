import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './styles.css';
import { AuthProvider, useAuth } from './context/AuthContext';
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

function Gate({ children }: { children: React.ReactNode }) {
  const { loggedIn } = useAuth();
  return loggedIn ? <>{children}</> : <Navigate to="/login" replace />;
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
        <Route path="partners" element={<Partners />} />
        <Route path="partners/:id" element={<PartnerDetail />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="halls" element={<Halls />} />
        <Route path="halls/:id" element={<HallDetail />} />
        <Route path="items" element={<Items />} />
        <Route path="items/:id" element={<ItemDetail />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="packages" element={<Packages />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="hall-bookings/:id" element={<HallBookingDetail />} />
        <Route path="disputes" element={<Disputes />} />
        <Route path="support" element={<Support />} />
        <Route path="support/:type/:id" element={<SupportThread />} />
        <Route path="site-content" element={<SiteContent />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit" element={<AuditLog />} />
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
