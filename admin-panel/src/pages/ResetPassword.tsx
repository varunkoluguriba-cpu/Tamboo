import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.post('/api/admin-auth/reset', { token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset the password. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-badge">tamboo</div>
          <div className="error-text">This reset link is incomplete. Request a new one.</div>
          <Link to="/forgot" className="login-sub">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-badge">tamboo</div>
        <div className="login-sub">Choose a new password</div>

        {done ? (
          <>
            <div className="login-sub">Your password has been changed.</div>
            <Link to="/login" className="btn-primary">Sign in</Link>
          </>
        ) : (
          <>
            <label className="field-label" htmlFor="password">New password (at least 8 characters)</label>
            <input id="password" type="password" autoComplete="new-password" className="text-input" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            <label className="field-label" htmlFor="confirm">Confirm new password</label>
            <input id="confirm" type="password" autoComplete="new-password" className="text-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <button type="submit" className="btn-primary" disabled={busy || !password || !confirm}>
              {busy ? 'Saving…' : 'Set new password'}
            </button>
            {!!error && <div className="error-text">{error}</div>}
          </>
        )}
      </form>
    </div>
  );
}
