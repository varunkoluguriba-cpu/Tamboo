import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './styles.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './pages/Layout';
import Partners from './pages/Partners';
import PartnerDetail from './pages/PartnerDetail';
import Bookings from './pages/Bookings';

function Gate({ children }: { children: React.ReactNode }) {
  const { loggedIn } = useAuth();
  return loggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { loggedIn } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={loggedIn ? <Navigate to="/partners" replace /> : <Login />} />
      <Route path="/" element={<Gate><Layout /></Gate>}>
        <Route index element={<Navigate to="/partners" replace />} />
        <Route path="partners" element={<Partners />} />
        <Route path="partners/:id" element={<PartnerDetail />} />
        <Route path="bookings" element={<Bookings />} />
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
