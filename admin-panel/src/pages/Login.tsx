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
      <form className="login-card" onSubmit={submit}>
        <div className="login-badge">tamboo</div>
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
  );
}
