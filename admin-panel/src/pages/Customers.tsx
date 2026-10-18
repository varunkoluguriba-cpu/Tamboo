import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  authMethod: 'phone' | 'google' | 'guest';
  city: string;
  createdAt: string;
};

export default function Customers() {
  const { logout } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get<Customer[]>('/api/admin/users')
      .then((res) => { if (!cancelled) setCustomers(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load customers.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [logout]);

  return (
    <div>
      <h1 className="page-title">Customers</h1>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : customers.length === 0 ? (
        <div className="empty-state">No customers yet.</div>
      ) : (
        customers.map((c) => (
          <Link key={c.id} to={`/customers/${c.id}`} className="partner-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="partner-name">{c.name || '(no name)'}</div>
              <div className="partner-meta">{c.phone || c.email || 'Guest'} · {c.city}</div>
            </div>
            <span className="badge verified">{c.authMethod}</span>
          </Link>
        ))
      )}
    </div>
  );
}
