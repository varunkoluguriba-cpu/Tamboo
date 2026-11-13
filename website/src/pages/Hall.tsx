import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { usePageMeta } from '../lib/seo';
import { useLang } from '../lib/lang';
import { payWithRazorpay } from '../lib/razorpay';
import { LoadError, Photo, Spinner, inr, useToast } from '../components/ui';
import MonthCalendar, { ymd } from '../components/MonthCalendar';
import { getSearch } from '../lib/search';
import { hallTypeText, paxText } from '../../../customer-app/src/utils/units';
import type { PublicHall } from './Halls';

type SlotState = 'free' | 'booked' | 'closed';
type DayAvail = { morning: SlotState; evening: SlotState };
type Slot = 'Morning' | 'Evening';
const VISIT_HOURS = 48;

export default function Hall() {
  const { id = '' } = useParams();
  const { t } = useLang();
  const { user, openLogin } = useAuth();
  const navigate = useNavigate();
  const [hall, setHall] = useState<PublicHall | null>(null);
  const [error, setError] = useState<'' | 'load' | 'missing'>('');
  const searched = useState(getSearch)[0];
  const [month, setMonth] = useState(() => (searched.date >= ymd(new Date()) ? searched.date : ymd(new Date())).slice(0, 7));
  const [avail, setAvail] = useState<Record<string, DayAvail>>({});
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<Slot | null>(null);
  const [guests, setGuests] = useState(searched.guests);
  const [agree, setAgree] = useState(false);
  const [paying, setPaying] = useState(false);
  const [toast, showToast] = useToast();

  const load = useCallback(() => {
    setError('');
    api.get<PublicHall>(`/api/halls/${id}`).then(setHall).catch((e) => setError(e instanceof ApiError && e.status === 404 ? 'missing' : 'load'));
  }, [id]);
  useEffect(load, [load]);
  usePageMeta(hall ? `${hall.name} — ${hallTypeText(hall.type || '', t)}, ${hall.area}` : undefined, hall ? `${hall.name}: ${hall.cap}. ${hall.blurb || ''}` : undefined);
  useEffect(() => {
    api.get<Record<string, DayAvail>>(`/api/halls/${id}/availability?month=${month}`).then((d) => setAvail((p) => ({ ...p, ...d }))).catch(() => {});
  }, [id, month]);

  const today = ymd(new Date());
  // A date not loaded yet (or in the past) counts as closed, so nobody can pick an unverified slot.
  const dayAvail = useCallback((d: string): DayAvail => (d < today ? { morning: 'closed', evening: 'closed' } : avail[d] || { morning: 'closed', evening: 'closed' }), [avail, today]);
  const pickDate = (d: string) => {
    const a = dayAvail(d);
    setDate(d);
    setSlot(a.morning === 'free' ? 'Morning' : a.evening === 'free' ? 'Evening' : null);
  };
  // Open on the date searched from the home page, once that month's availability has loaded.
  useEffect(() => {
    if (!date && searched.date >= today && avail[searched.date]) pickDate(searched.date);
  }, [avail]); // eslint-disable-line react-hooks/exhaustive-deps
  const dots = useMemo(() => (d: string) => {
    const a = dayAvail(d);
    const c = (s: SlotState) => (s === 'free' ? 'var(--green)' : s === 'booked' ? 'var(--pink)' : 'var(--divider-strong)');
    return [c(a.morning), c(a.evening)];
  }, [dayAvail]);

  if (error === 'missing') return <div className="card muted">{t.venueNotFound} <Link to="/halls" className="ok">{t.venuesHeaderTitle} →</Link></div>;
  if (error) return <LoadError onRetry={load} />;
  if (!hall) return <Spinner />;

  const FACT_LABELS: Record<string, string> = {
    Capacity: t.venueFactCapacity, Parking: t.venueFactParking, Rooms: t.venueFactRooms,
    Size: t.venueFactSize, Catering: t.venueFactCatering, Kitchen: t.venueFactKitchen,
  };
  const factValue = (v: string) => ({ Available: t.venueFactAvailable, 'Not available': t.venueFactNotAvailable, 'In-house catering only': t.venueCatInHouse, 'Outside caterers allowed': t.venueCatOutside, 'Both allowed': t.venueCatBoth } as Record<string, string>)[v]
    ?? paxText(v.replace(/ cars$/, ` ${t.venueFactCars}`), t);
  const slotLabel = (s: Slot) => (s === 'Morning' ? t.venueMorning : t.venueEvening);
  const a = date ? dayAvail(date) : null;
  const canPay = !!date && !!slot && agree && !paying;

  const pay = async () => {
    if (!user) return openLogin();
    if (!date || !slot) return;
    setPaying(true);
    try {
      const order = await api.post<{ orderId: string; amount: number; currency: string; keyId: string }>('/api/payments/create-order', { hallId: hall.id, date, slot });
      let res;
      try {
        res = await payWithRazorpay({ key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency, name: 'Tamboo',
          description: t.tokenPayOrderDescription.replace('{hallName}', hall.name), prefill: { name: user.name, contact: user.phone } });
      } catch (e) {
        if (!(e as { cancelled?: boolean }).cancelled) showToast(`${t.payNotCompletedTitle}: ${(e as Error).message}`);
        return;
      }
      const v = await api.post<{ verified: boolean; bookingId?: string; bookingConflict?: boolean }>('/api/payments/verify', {
        ...res, hallId: hall.id, hallName: hall.name, date, slot, guests, partnerId: hall.partnerId, customerName: user.name, customerPhone: user.phone,
      });
      if (!v.verified) return showToast(t.tokenPayVerifyFailedMsg);
      if (v.bookingConflict) return showToast(t.tokenPayConflictMsg);
      navigate(v.bookingId ? `/bookings/hall/${v.bookingId}` : '/bookings?tab=halls');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="gallery">
        {hall.photos.length ? hall.photos.map((p, i) => <img key={i} src={p} alt={`${hall.name} ${i + 1}`} />) : <Photo alt={hall.name} />}
      </div>
      <div className="detail">
        <div className="stack">
          <div>
            <h1 className="title">{hall.name}</h1>
            <div className="muted">{[hallTypeText(hall.type || '', t), hall.area, hall.city].filter(Boolean).join(' · ')}</div>
            <div className="wrap-row" style={{ marginTop: 8 }}>
              <span className="chip chip-ok">✓ {t.venueVerified}</span>
              <span className="chip">{paxText(hall.cap, t)}</span>
              <span className="chip">{hall.ac ? t.venuesAC : t.venuesNonAC}</span>
            </div>
          </div>
          {!!hall.blurb && <div className="card">{hall.blurb}</div>}
          <div className="card stack" style={{ gap: 10 }}>
            <div className="facts">
              {hall.facts.map((f) => <div key={f.k} className="fact"><b>{factValue(f.v)}</b><span className="small">{FACT_LABELS[f.k] ?? f.k}</span></div>)}
            </div>
            <div className="kv"><span>{t.venueCrockeryLabel}</span><b>{hall.hasCrockery ? t.venueCrockeryAvailable : t.venueCrockeryNotProvided}</b></div>
            {!!hall.amenities && <div className="kv"><span>{t.venueAmenitiesLabel}</span><b>{hall.amenities}</b></div>}
          </div>
          <div className="card stack" style={{ gap: 6 }}>
            <h3 className="section-title" style={{ fontSize: 16 }}>{t.tokenRefundPolicyTitle}</h3>
            {[t.tokenRefundFull2Hr, t.tokenRefund80Visit, t.tokenRefundExpireNoVisit, t.tokenRefundHallCancels, t.tokenRefundMismatch].map((s) => <span key={s} className="muted">• {s}</span>)}
          </div>
        </div>

        <aside className="card stack book-card sticky">
          <div className="kv"><span>{hall.pricingMode === 'perPlate' ? t.venueCateringPerPlate : t.venueHallRentPerSlot}</span><b className="price">{inr(hall.pricingMode === 'perPlate' ? hall.platePrice : hall.rent)}</b></div>
          {hall.pricingMode === 'perPlate' && hall.minPlates > 0 && <span className="small">{t.venuePlateNote.replace('{count}', String(hall.minPlates))}</span>}
          <div className="kv"><span>{t.venueTokenToPrebook}</span><b className="price">{inr(hall.token)}</b></div>
          <div className="divider" />
          <h3 style={{ fontSize: 16 }}>{t.venueAvailabilityCalendarTitle}</h3>
          <MonthCalendar month={month} onMonth={setMonth} selected={date} onPick={pickDate} dots={dots} isDisabled={(d) => d < today} />
          <div className="wrap-row small"><span>● <span style={{ color: 'var(--green)' }}>{t.venueSlotFree}</span></span><span>● <span style={{ color: 'var(--pink)' }}>{t.venueSlotBooked}</span></span><span>{t.venueMorning} · {t.venueEvening}</span></div>
          {date && a ? (
            <div className="wrap-row">
              {(['Morning', 'Evening'] as Slot[]).map((s) => {
                const st = s === 'Morning' ? a.morning : a.evening;
                return <button key={s} className={`pick ${slot === s ? 'sel' : ''}`} disabled={st !== 'free'} onClick={() => setSlot(s)}>{slotLabel(s)} · {st === 'free' ? t.venueSlotFree : st === 'booked' ? t.venueSlotBooked : t.venueSlotClosed}</button>;
              })}
            </div>
          ) : <span className="small">{t.venuePickDateToCheck}</span>}
          {date && !slot && <span className="err">{t.venuePickFreeSlot}</span>}
          <div className="field">
            <label htmlFor="hg">{t.guests}</label>
            <input id="hg" className="input" inputMode="numeric" value={guests} onChange={(e) => setGuests(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder={hall.cap.replace(/ pax$/, '')} />
          </div>
          <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />{t.tokenPayAgreeText.replace('{hours}', String(VISIT_HOURS))}</label>
          <button className="btn btn-primary btn-block" disabled={!canPay} onClick={pay}>{paying ? '…' : t.tokenPayButtonLabel.replace('{amount}', inr(hall.token))}</button>
          {!user && <span className="small">{t.webLoginToBook}</span>}
        </aside>
      </div>
      {toast}
    </div>
  );
}
