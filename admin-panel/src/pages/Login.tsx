import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, error, loading } = useAuth();
  const [password, setPassword] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) login(password);
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-badge">tamboo</div>
        <div className="login-sub">Admin panel</div>

        <label className="field-label" htmlFor="password">Admin password</label>
        <input
          id="password"
          type="password"
          className="text-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />

        <button type="submit" className="btn-primary" disabled={loading || !password}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        {!!error && <div className="error-text">{error}</div>}
      </form>
    </div>
  );
}
