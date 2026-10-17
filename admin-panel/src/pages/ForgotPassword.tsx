import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/api/admin-auth/forgot', { username });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the reset link. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-badge">tamboo</div>
        <div className="login-sub">Reset admin password</div>

        {sent ? (
          <div className="login-sub">
            If that username exists, a reset link has been sent to its recovery email. The link works for 30 minutes.
          </div>
        ) : (
          <>
            <label className="field-label" htmlFor="username">Username</label>
            <input id="username" type="text" className="text-input" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
            <button type="submit" className="btn-primary" disabled={busy || !username}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
            {!!error && <div className="error-text">{error}</div>}
          </>
        )}

        <Link to="/login" className="login-sub">Back to sign in</Link>
      </form>
    </div>
  );
}
