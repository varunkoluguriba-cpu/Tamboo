import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/lang';
import { payWithRazorpay } from '../lib/razorpay';
import { LoadError, Spinner, inr, useToast } from '../components/ui';
import { hallStatusText, prettyDate, refundText } from '../../../customer-app/src/utils/status';
import type { RemoteHallBooking } from '../../../customer-app/src/navigation/types';

type Booking = RemoteHallBooking & { visitDay?: string | null; visitTime?: string | null; freeCancelHours?: number };
const DAYS = ['today', 'tomorrow', 'dayAfter'] as const;
const TIMES = ['morning', 'afternoon', 'evening', 'night'] as const;
const num = (n: number) => Math.round(n || 0).toLocaleString('en-IN');

export default function HallBooking() {
  const { id = '' } = useParams();
  const { t } = useLang();
  const { user, openLogin } = useAuth();
  const [b, setB] = useState<Booking | null>(null);
  const [hallPhone, setHallPhone] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [day, setDay] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [toast, showToast] = useToast();

  const load = useCallback(() => {
    if (!user) return;
    setError(false);
    api.get<Booking[]>('/api/halls/my-tokens').then((list) => {
      const f = list.find((x) => x.id === id);
      if (!f) return setError(true);
      setB(f); setDay(f.visitDay || ''); setTime(f.visitTime || '');
      api.get<{ phone: string }>(`/api/halls/${f.hallId}`).then((h) => setHallPhone(h.phone)).catch(() => {});
    }).catch(() => setError(true));
  }, [id, user]);
  useEffect(load, [load]);

  if (!user) return <div className="card stack" style={{ alignItems: 'center' }}><span className="muted">{t.webLoginForBookings}</span><button className="btn btn-primary" onClick={openLogin}>{t.webLogin}</button></div>;
  if (error) return <LoadError onRetry={load} />;
  if (!b) return <Spinner />;

  const act = async (action: string, extra: Record<string, string> = {}, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    try {
      setB(await api.patch<Booking>(`/api/halls/my-token/${b.id}`, { action, ...extra }));
      if (action === 'scheduleVisit') showToast(t.tokenVisitScheduledTitle);
      if (action === 'dispute') showToast(t.tokenDisputeRaisedMsg);
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : t.tryAgain);
    } finally { setBusy(false); }
  };

  const payAdvance = async () => {
    setBusy(true);
    try {
      const order = await api.post<{ orderId: string; amount: number; currency: string; keyId: string }>('/api/payments/create-advance-order', { bookingId: b.id });
      let res;
      try {
        res = await payWithRazorpay({ key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency, name: 'Tamboo',
          description: t.advancePayOrderDescription.replace('{hallName}', b.hallName), prefill: { name: user.name, contact: user.phone } });
      } catch (e) {
        if (!(e as { cancelled?: boolean }).cancelled) showToast(`${t.payNotCompletedTitle}: ${(e as Error).message}`);
        return;
      }
      const v = await api.post<{ verified: boolean }>('/api/payments/verify', { ...res, advanceForBookingId: b.id });
      if (!v.verified) showToast(t.advancePayVerifyFailedMsg);
      load();
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : t.tryAgain);
    } finally { setBusy(false); }
  };

  const heldUntil = b.heldAtMs + b.visitHours * 3600 * 1000;
  const expired = b.status === 'token_paid' && Date.now() > heldUntil;
  const canCancel = b.status === 'token_paid' && Date.now() - b.heldAtMs < (b.freeCancelHours || 2) * 3600 * 1000;
  const ok = ['visited', 'awaiting_advance', 'confirmed'].includes(b.status);
  const note = expired ? t.tokenNoteExpired : b.status === 'token_paid' ? t.tokenNoteActive : b.status === 'visited' ? t.tokenNoteVisited
    : b.status === 'awaiting_advance' ? t.tokenNoteAwaitingAdvance : b.status === 'confirmed' ? t.tokenNoteConfirmed : '';
  const dayLabel = (d: string) => ({ today: t.tokenVisitDayToday, tomorrow: t.tokenVisitDayTomorrow, dayAfter: t.tokenVisitDayAfter } as Record<string, string>)[d];
  const timeLabel = (x: string) => ({ morning: t.tokenVisitTimeMorning, afternoon: t.tokenVisitTimeAfternoon, evening: t.tokenVisitTimeEvening, night: t.tokenVisitTimeNight } as Record<string, string>)[x];
  const deadline = b.advanceDeadlineAtMs ? new Date(b.advanceDeadlineAtMs).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <Link to="/bookings?tab=halls" className="small">← {t.webNavBookings}</Link>
      <div className="between">
        <h1 className="title" style={{ fontSize: 22 }}>{b.hallName}</h1>
        <span className={`pill ${ok ? 'chip-ok' : 'chip-warn'}`}>{hallStatusText(b, t)}</span>
      </div>
      {!!note && <div className="note">{note}</div>}
      {!!refundText(b, t) && <div className="note">{refundText(b, t)}</div>}

      <div className="card stack" style={{ gap: 4 }}>
        <div className="kv"><span>{t.tokenPaySummaryDate}</span><b>{prettyDate(b.date)}</b></div>
        <div className="kv"><span>{t.tokenPaySummarySlot}</span><b>{b.slot === 'Morning' ? t.venueMorning : t.venueEvening}</b></div>
        {!!b.guests && <div className="kv"><span>{t.guests}</span><b>{b.guests}</b></div>}
        <div className="kv"><span>{t.tokenAmountPaidLabel}</span><b>{inr(b.amount)}</b></div>
        {b.finalRent > 0 && <div className="kv"><span>{t.advancePaySummaryRent}</span><b>{inr(b.finalRent)}</b></div>}
      </div>

      {b.status === 'awaiting_advance' && (
        <div className="card stack book-card">
          <h3 style={{ fontSize: 17 }}>{t.tokenAdvanceTitle}</h3>
          <span className="muted">{t.tokenAdvanceMsg.replace('{rent}', num(b.finalRent)).replace('{amount}', num(b.advanceAmount)).replace('{deadline}', deadline)}</span>
          <button className="btn btn-primary" disabled={busy} onClick={payAdvance}>{t.tokenPayAdvanceBtn.replace('{amount}', inr(b.advanceAmount))}</button>
        </div>
      )}
      {b.status === 'confirmed' && (
        <div className="card stack" style={{ borderInlineStart: '4px solid var(--green)' }}>
          <b>{t.tokenConfirmedTitle}</b>
          <span className="muted">{t.tokenConfirmedMsg.replace('{rent}', num(b.finalRent)).replace('{balance}', num(Math.max(0, b.finalRent - b.amount - b.advanceAmount)))}</span>
        </div>
      )}

      {b.status === 'token_paid' && !expired && (
        <div className="card stack">
          <h3 style={{ fontSize: 16 }}>{t.tokenScheduleVisitTitle}</h3>
          <div className="wrap-row">{DAYS.map((d) => <button key={d} className={`pick ${day === d ? 'sel' : ''}`} onClick={() => setDay(d)}>{dayLabel(d)}</button>)}</div>
          <div className="wrap-row">{TIMES.map((x) => <button key={x} className={`pick ${time === x ? 'sel' : ''}`} onClick={() => setTime(x)}>{timeLabel(x)}</button>)}</div>
          <button className="btn btn-soft" disabled={busy || !day || !time} onClick={() => act('scheduleVisit', { visitDay: day, visitTime: time })}>{t.tokenSaveVisitTime}</button>
        </div>
      )}

      {(b.status === 'token_paid' || b.status === 'visited') && !expired && (
        <div className="card stack">
          <b>{t.tokenDecidedAfterVisit}</b>
          <span className="small">{t.tokenDecidedAfterVisitSub}</span>
          <div className="wrap-row">
            <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => act('notBooking', {}, `${t.tokenNotBookingTitle}\n\n${t.tokenNotBookingMsg}`)}>{t.tokenNotBooking80}</button>
            <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => act('dispute', {}, t.tokenHallMismatch)}>{t.tokenHallMismatch}</button>
          </div>
        </div>
      )}

      <div className="wrap-row">
        {!!hallPhone && ['token_paid', 'visited', 'awaiting_advance', 'confirmed'].includes(b.status) && <a className="btn btn-soft" href={`tel:${hallPhone}`}>📞 {t.tokenCallHall}</a>}
        {canCancel && <button className="btn btn-danger" disabled={busy} onClick={() => act('cancel', {}, `${t.tokenCancelTitle}\n\n${t.tokenCancelMsg}`)}>{t.tokenCancelFullRefund}</button>}
      </div>

      <div className="card stack" style={{ gap: 4 }}>
        <b>{t.tokenRefundPolicyTitle}</b>
        {[t.tokenRefundFull2Hr, t.tokenRefund80Visit, t.tokenRefundExpireNoVisit, t.tokenRefundHallCancels, t.tokenRefundMismatch].map((s) => <span key={s} className="small">• {s}</span>)}
      </div>
      {toast}
    </div>
  );
}
