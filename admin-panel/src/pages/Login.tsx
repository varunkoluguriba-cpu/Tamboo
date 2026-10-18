import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, error, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) login(username, password);
  };

  return (
    <div className="login-wrap">
      <div className="login-illustration">
        <div className="login-blob a" />
        <div className="login-blob b" />
        <div className="login-illustration-inner">
          <div className="login-illustration-badge">
            <span className="sidebar-badge" style={{ color: '#fff', WebkitTextFillColor: '#fff' }}>tamboo</span>
            <span className="sidebar-sub">ADMIN</span>
          </div>

          <div className="login-cardstack">
            <div className="login-cardstack-shape back" />
            <div className="login-cardstack-shape front">
              <div className="login-cardstack-row">
                <div className="login-cardstack-dot" />
                <div className="login-cardstack-line w60" />
              </div>
              <div className="login-cardstack-line w90" />
              <div className="login-cardstack-line w75" />
              <div className="login-cardstack-badge">Confirmed</div>
            </div>
          </div>

          <h2 className="login-illustration-title">Run the backbone of Tamboo.</h2>
          <p className="login-illustration-body">
            Approve partners, track every booking, and keep the marketplace running smoothly —
            all from one place.
          </p>
        </div>
      </div>

      <div className="login-form-side">
        <form className="login-card" onSubmit={submit}>
          <div className="login-logo-row">
            <span className="login-badge">tamboo</span>
            <span className="sidebar-sub">ADMIN</span>
          </div>
          <div className="login-sub">Admin panel</div>

          <label className="field-label" htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            className="text-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />

          <label className="field-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="text-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="btn-primary" disabled={loading || !username || !password}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          {!!error && <div className="error-text">{error}</div>}

          <Link to="/forgot" className="login-sub">Forgot password?</Link>
        </form>
      </div>
    </div>
  );
}
