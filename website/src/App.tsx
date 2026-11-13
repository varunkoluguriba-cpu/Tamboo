import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { LangProvider, useLang } from './lib/lang';
import Layout from './components/Layout';
import Home from './pages/Home';
import Halls from './pages/Halls';
import Hall from './pages/Hall';
import Farms from './pages/Farms';
import Farm from './pages/Farm';
import Bookings from './pages/Bookings';
import HallBooking from './pages/HallBooking';
import FarmBooking from './pages/FarmBooking';
import Account from './pages/Account';
import Rentals from './pages/Rentals';
import Vendor from './pages/Vendor';
import Cart from './pages/Cart';
import OrderDetail from './pages/OrderDetail';
import Services from './pages/Services';
import Occasion from './pages/Occasion';
import ServiceVendor from './pages/ServiceVendor';
import { CartProvider } from './lib/cart';

function NotFound() {
  const { t } = useLang();
  return (
    <div className="stack" style={{ alignItems: 'center', padding: '60px 0' }}>
      <h1 className="title">{t.webNotFound}</h1>
      <Link to="/" className="btn btn-primary">{t.webBackHome}</Link>
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="halls" element={<Halls />} />
                <Route path="halls/:id" element={<Hall />} />
                <Route path="farm-houses" element={<Farms />} />
                <Route path="farm-houses/:id" element={<Farm />} />
                <Route path="rentals" element={<Rentals />} />
                <Route path="rentals/:id" element={<Vendor />} />
                <Route path="cart" element={<Cart />} />
                <Route path="services" element={<Services />} />
                <Route path="occasions/:key" element={<Occasion />} />
                <Route path="services/:id" element={<ServiceVendor />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="bookings/hall/:id" element={<HallBooking />} />
                <Route path="bookings/farm/:id" element={<FarmBooking />} />
                <Route path="bookings/order/:id" element={<OrderDetail />} />
                <Route path="account" element={<Account />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LangProvider>
  );
}
