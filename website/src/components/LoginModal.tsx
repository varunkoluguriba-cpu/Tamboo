import { useState } from 'react';
import type { ConfirmationResult } from 'firebase/auth';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/lang';
import { sendOtp } from '../lib/firebase';
import { ApiError } from '../lib/api';
import { OtpArt } from './Scenes';

// Phone → OTP → (first time) name. Same Firebase OTP the apps use; the server issues the session.
export default function LoginModal() {
  const { t } = useLang();
  const { signIn, register, closeLogin, user } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>(user && !user.registered ? 'name' : 'phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState<ConfirmationResult | null>(null);

  const digits = phone.replace(/\D/g, '');
  const send = async () => {
    if (!/^[6-9]\d{9}$/.test(digits)) return setErr(t.loginScreenInvalidPhone);
    setErr(''); setBusy(true);
    try {
      setConfirm(await sendOtp(`+91${digits}`, 'otp-send-btn'));
      setStep('otp');
    } catch {
      setErr(t.webOtpSendFailed);
    } finally { setBusy(false); }
  };
  const verify = async () => {
    if (!confirm || code.length !== 6) return setErr(t.otpScreenEnterCode);
    setErr(''); setBusy(true);
    try {
      const cred = await confirm.confirm(code);
      const u = await signIn(await cred.user.getIdToken());
      if (!u.registered || !u.name) setStep('name'); else closeLogin();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t.otpScreenIncorrectCode);
    } finally { setBusy(false); }
  };
  const saveName = async () => {
    if (!name.trim()) return setErr(t.registerNameRequired);
    setErr(''); setBusy(true);
    try { await register(name.trim()); closeLogin(); } catch (e) {
      setErr(e instanceof ApiError ? e.message : t.registerSaveError);
    } finally { setBusy(false); }
  };

  return (
    <div className="backdrop" onClick={closeLogin}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="between">
          <h2 style={{ fontSize: 21 }}>{step === 'name' ? t.webNameTitle : t.webLoginTitle}</h2>
          <button onClick={closeLogin} aria-label={t.cancel} style={{ fontSize: 22, color: 'var(--text-muted)' }}>×</button>
        </div>
        {step === 'phone' && (
          <>
            <div className="modal-art"><OtpArt /></div>
            <p className="muted" style={{ margin: 0 }}>{t.webLoginSub}</p>
            <div className="field">
              <label htmlFor="phone">{t.webPhoneLabel}</label>
              <div className="phone-row ltr">
                <span className="cc">+91</span>
                <input id="phone" className="input" inputMode="numeric" autoComplete="tel-national" maxLength={11} value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="98XXX XXXXX" autoFocus />
              </div>
            </div>
            {!!err && <div className="err">{err}</div>}
            <button id="otp-send-btn" className="btn btn-primary btn-block" disabled={busy} onClick={send}>{busy ? '…' : t.webSendOtp}</button>
            <p className="small" style={{ margin: 0 }}>{t.webLoginTerms}</p>
          </>
        )}
        {step === 'otp' && (
          <>
            <p className="muted" style={{ margin: 0 }}>{t.otpScreenSentTo.replace('{param}', `⁦+91 ${digits.slice(0, 5)} ${digits.slice(5)}⁩`)}</p>
            <input className="input ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} autoFocus
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && verify()} placeholder="••••••" style={{ letterSpacing: 8, textAlign: 'center', fontSize: 22 }} />
            {!!err && <div className="err">{err}</div>}
            <button className="btn btn-primary btn-block" disabled={busy} onClick={verify}>{busy ? '…' : t.webVerify}</button>
            <button className="small" onClick={() => { setStep('phone'); setCode(''); setErr(''); }}>{t.webChangeNumber}</button>
          </>
        )}
        {step === 'name' && (
          <>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveName()} placeholder={t.webNamePh} autoFocus />
            {!!err && <div className="err">{err}</div>}
            <button className="btn btn-primary btn-block" disabled={busy} onClick={saveName}>{busy ? '…' : t.webContinue}</button>
          </>
        )}
      </div>
    </div>
  );
}
