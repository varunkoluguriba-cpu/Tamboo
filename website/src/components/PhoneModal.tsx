import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/lang';
import { ApiError } from '../lib/api';

// Asked once, before the first booking, of customers who signed in with Google (no OTP):
// owners and vendors need a number to call about the booking.
export default function PhoneModal() {
  const { t } = useLang();
  const { savePhone, closePhone } = useAuth();
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const d = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(d)) return setErr(t.loginScreenInvalidPhone);
    setErr(''); setBusy(true);
    try { await savePhone(d); closePhone(); } catch (e) { setErr(e instanceof ApiError ? e.message : t.tryAgain); } finally { setBusy(false); }
  };
  return (
    <div className="backdrop" onClick={closePhone}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 style={{ fontSize: 20 }}>{t.webPhoneTitle}</h2>
        <p className="muted" style={{ margin: 0 }}>{t.webPhoneWhy}</p>
        <div className="phone-row ltr">
          <span className="cc">+91</span>
          <input className="input" inputMode="numeric" autoComplete="tel-national" maxLength={11} value={phone} autoFocus
            onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && save()} placeholder="98XXX XXXXX" />
        </div>
        {!!err && <div className="err">{err}</div>}
        <button className="btn btn-primary btn-block" disabled={busy} onClick={save}>{busy ? '…' : t.webPhoneSave}</button>
        <span className="small">{t.webPhoneNote}</span>
      </div>
    </div>
  );
}
