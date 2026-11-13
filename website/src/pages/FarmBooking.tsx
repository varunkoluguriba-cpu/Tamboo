import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/lang';
import { LoadError, Spinner, inr, useToast } from '../components/ui';
import { endsNextDay, farmDate, slotLabel, time12, type MyFarmBooking } from '../../../customer-app/src/utils/farm';

export default function FarmBooking() {
  const { id = '' } = useParams();
  const { t } = useLang();
  const { user, openLogin } = useAuth();
  const [b, setB] = useState<MyFarmBooking | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, showToast] = useToast();

  const load = useCallback(() => {
    if (!user) return;
    setError(false);
    api.get<MyFarmBooking[]>('/api/farms/bookings/me').then((list) => { const f = list.find((x) => x.id === id); if (f) setB(f); else setError(true); }).catch(() => setError(true));
  }, [id, user]);
  useEffect(load, [load]);

  if (!user) return <div className="card stack" style={{ alignItems: 'center' }}><span className="muted">{t.webLoginForBookings}</span><button className="btn btn-primary" onClick={openLogin}>{t.webLogin}</button></div>;
  if (error) return <LoadError onRetry={load} />;
  if (!b) return <Spinner />;

  const cancel = async () => {
    const refund = Math.round((b.advanceAmount * b.refundPctNow) / 100);
    const msg = b.refundPctNow > 0 ? t.cfCancelMsg.replace('{amount}', inr(refund)).replace('{pct}', String(b.refundPctNow)) : t.cfCancelNoRefund;
    if (!window.confirm(`${t.cfCancelTitle}\n\n${msg}`)) return;
    setBusy(true);
    try { setB((await api.post<{ booking: MyFarmBooking }>(`/api/farms/bookings/${b.id}/cancel`)).booking); } catch (e) {
      showToast(e instanceof ApiError ? e.message : t.tryAgain);
    } finally { setBusy(false); }
  };

  const ok = b.status === 'confirmed' || b.status === 'completed';
  const st = { confirmed: t.cfStConfirmed, completed: t.cfStCompleted, cancelled: t.cfStCancelled, disputed: t.cfStDisputed }[b.status];
  const rf = b.refundStatus === 'pending' ? t.cfRefundPending.replace('{amount}', inr(b.refundAmount)) : b.refundStatus === 'refunded' ? t.cfRefunded.replace('{amount}', inr(b.refundAmount)) : '';
  const dest = b.lat != null && b.lng != null ? `${b.lat},${b.lng}` : encodeURIComponent(b.address);

  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <Link to="/bookings?tab=farms" className="small">← {t.webNavBookings}</Link>
      <div className="between">
        <div><h1 className="title" style={{ fontSize: 22 }}>{b.farmName}</h1><span className="small">{b.code}</span></div>
        <span className={`pill ${ok ? 'chip-ok' : 'chip-warn'}`}>{st}</span>
      </div>
      {b.cancelledBy === 'owner' && <div className="note">{t.cfByOwner}</div>}
      {b.status === 'disputed' && <div className="note">{t.cfDisputedNote}</div>}
      {!!rf && <div className="note">{rf}</div>}

      <div className="card stack" style={{ gap: 4 }}>
        <div className="kv"><span>{slotLabel(b.slot, t)}</span><b>{t.cfGuestsN.replace('{n}', String(b.guests))}</b></div>
        <div className="kv"><span>{t.cfCheckIn}</span><b>{farmDate(b.date, t)}, {time12(b.checkIn)}</b></div>
        <div className="kv"><span>{t.cfCheckOut}</span><b>{time12(b.checkOut)}{endsNextDay(b.checkIn, b.checkOut) ? ` (${t.cfNextDay})` : ''}</b></div>
      </div>

      {ok && !!b.address && (
        <div className="card stack">
          <span className="small">{t.cfAddress}</span>
          <b>{b.address}</b>
          <div className="wrap-row">
            <a className="btn btn-soft" href={`https://www.google.com/maps/dir/?api=1&destination=${dest}`} target="_blank" rel="noreferrer">📍 {t.cfDirections}</a>
            {!!b.ownerPhone && <a className="btn btn-soft" href={`tel:${b.ownerPhone}`}>📞 {t.cfCallOwner}</a>}
          </div>
          {!!b.ownerPhone && <span className="small ltr">{b.ownerPhone.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2')}</span>}
        </div>
      )}

      <div className="card stack" style={{ gap: 4 }}>
        <div className="kv"><span>{t.cfStayPrice}</span><b>{inr(b.basePrice)}</b></div>
        {b.extraGuests > 0 && <div className="kv"><span>{t.cfExtraGuests.replace('{n}', String(b.extraGuests))}</span><b>{inr(b.extraGuestCharge)}</b></div>}
        <div className="kv"><span><b>{t.cfTotal}</b></span><b>{inr(b.total)}</b></div>
        <div className="kv"><span>{t.cfPaidOnline}</span><b>{inr(b.advanceAmount)}</b></div>
        {b.status !== 'cancelled' && <div className="kv"><span><b>{t.cfPayLater}</b></span><b>{inr(b.balanceAmount)}</b></div>}
        {b.status !== 'cancelled' && b.securityDeposit > 0 && <span className="small">{t.cfDeposit.replace('{amount}', inr(b.securityDeposit))}</span>}
      </div>

      {b.status === 'confirmed' && (
        <>
          <span className="small">{t.cfPolicy}</span>
          <button className="btn btn-danger" disabled={busy} onClick={cancel}>{t.cfCancelBtn}</button>
        </>
      )}
      {toast}
    </div>
  );
}
