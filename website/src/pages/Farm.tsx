import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { usePageMeta } from '../lib/seo';
import { useLang } from '../lib/lang';
import { payWithRazorpay } from '../lib/razorpay';
import { LoadError, Photo, Spinner, inr, useToast } from '../components/ui';
import MonthCalendar, { ymd } from '../components/MonthCalendar';
import { getSearch } from '../lib/search';
import { AMENITY_KEYS, SLOT_KEYS, endsNextDay, slotLabel, time12, timeRange, type Farm as FarmT, type FarmQuote, type MyFarmBooking, type SlotKey } from '../../../customer-app/src/utils/farm';

type SlotState = 'free' | 'booked' | 'closed' | 'past';
const OCCASIONS = ['Birthday', 'House party', 'Wedding', 'Reception', 'Corporate'];

export default function Farm() {
  const { id = '' } = useParams();
  const { t } = useLang();
  const { user, openLogin, needPhone } = useAuth();
  const navigate = useNavigate();
  const [farm, setFarm] = useState<FarmT | null>(null);
  const [error, setError] = useState<'' | 'load' | 'missing'>('');
  const searched = useState(getSearch)[0];
  const [month, setMonth] = useState(() => (searched.date >= ymd(new Date()) ? searched.date : ymd(new Date())).slice(0, 7));
  const [avail, setAvail] = useState<Record<string, Partial<Record<SlotKey, SlotState>>>>({});
  const [date, setDate] = useState(() => (searched.date >= ymd(new Date()) ? searched.date : ''));
  const [slot, setSlot] = useState<SlotKey | null>(null);
  const [guests, setGuests] = useState(searched.guests);
  const [occasion, setOccasion] = useState('');
  const [quote, setQuote] = useState<FarmQuote | null>(null);
  const [quoteErr, setQuoteErr] = useState('');
  const [agree, setAgree] = useState(false);
  const [paying, setPaying] = useState(false);
  const [toast, showToast] = useToast();

  const load = useCallback(() => {
    setError('');
    api.get<FarmT>(`/api/farms/${id}`)
      .then((f) => { setFarm(f); setSlot((s) => s || SLOT_KEYS.find((k) => f.slots[k]?.enabled) || null); })
      .catch((e) => setError(e instanceof ApiError && e.status === 404 ? 'missing' : 'load'));
  }, [id]);
  useEffect(load, [load]);
  useEffect(() => {
    api.get<Record<string, Partial<Record<SlotKey, SlotState>>>>(`/api/farms/${id}/availability?month=${month}`).then((d) => setAvail((p) => ({ ...p, ...d }))).catch(() => {});
  }, [id, month]);

  usePageMeta(farm ? `${farm.name} — ${t.cfListTitle}, ${farm.area}` : undefined, farm ? `${farm.name}: ${t.cfUpTo.replace('{n}', String(farm.maxGuests))}. ${farm.about}` : undefined);
  const g = parseInt(guests || '0', 10) || 0;
  useEffect(() => {
    setQuote(null); setQuoteErr('');
    if (!farm || !date || !slot || g < 1) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api.post<FarmQuote>(`/api/farms/${farm.id}/quote`, { date, slot, guests: g })
        .then((q) => { if (!cancelled) setQuote(q); })
        .catch((e) => { if (!cancelled) setQuoteErr(e instanceof ApiError ? e.message : t.tryAgain); });
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [farm, date, slot, g, t]);

  if (error === 'missing') return <div className="card muted">{t.webFarmMissing} <Link to="/farm-houses" className="ok">{t.cfListTitle} →</Link></div>;
  if (error) return <LoadError onRetry={load} />;
  if (!farm) return <Spinner />;

  const offered = SLOT_KEYS.filter((k) => farm.slots[k]?.enabled);
  const today = ymd(new Date());
  const colour = (s?: SlotState) => (s === 'free' ? 'var(--green)' : s === 'booked' ? 'var(--pink)' : 'var(--divider-strong)');
  const r = farm.rules;
  const yes = (v: boolean) => (v ? t.cfAllowed : t.cfNotAllowed);
  const RULES: Array<[string, string, boolean]> = [
    [t.cfRuleEvents, yes(r.eventsAllowed), r.eventsAllowed], [t.cfRuleAlcohol, yes(r.alcoholAllowed), r.alcoholAllowed],
    [t.cfRuleOutsideFood, yes(r.outsideFoodAllowed), r.outsideFoodAllowed], [t.cfRuleDj, yes(r.djAllowed), r.djAllowed],
    [t.cfRulePets, yes(r.petsAllowed), r.petsAllowed], [t.cfRuleSmoking, r.smokingOutdoorOnly ? t.cfOutdoorsOnly : t.cfAllowed, true],
  ];
  const FACTS = ([
    [t.cfBedrooms, farm.bedrooms], [t.cfAcRooms, farm.acRooms], [t.cfBeds, farm.beds], [t.cfBathrooms, farm.bathrooms],
    [t.cfLawn, farm.lawnSqft ? t.cfSqft.replace('{n}', farm.lawnSqft.toLocaleString('en-IN')) : 0],
    [t.cfParking, farm.parkingCars ? t.cfCars.replace('{n}', String(farm.parkingCars)) : 0],
  ] as Array<[string, number | string]>).filter(([, v]) => v);
  const occLabel = (o: string) => ({ Birthday: t.homeScreenOccasionBirthday, 'House party': t.homeScreenOccasionHouseParty, Wedding: t.homeScreenOccasionWedding, Reception: t.homeScreenOccasionReception, Corporate: t.homeScreenOccasionCorporate } as Record<string, string>)[o];
  const slotState = (k: SlotKey) => (date ? avail[date]?.[k] : undefined);

  const pay = async () => {
    if (!user) return openLogin();
    if (needPhone()) return;
    if (!quote || !slot) return;
    setPaying(true);
    try {
      const b = await api.post<{ booking: MyFarmBooking; payment: { orderId: string; amount: number; currency: string; keyId: string } }>(`/api/farms/${farm.id}/book`, { date, slot, guests: g, occasion });
      let res;
      try {
        res = await payWithRazorpay({ key: b.payment.keyId, order_id: b.payment.orderId, amount: b.payment.amount, currency: b.payment.currency, name: 'Tamboo',
          description: `${farm.name} · ${slotLabel(slot, t)}`, prefill: { name: user.name, contact: user.phone } });
      } catch (e) {
        if (!(e as { cancelled?: boolean }).cancelled) showToast(`${t.payNotCompletedTitle}: ${(e as Error).message}`);
        return;
      }
      const v = await api.post<{ verified: boolean; conflict?: boolean }>(`/api/farms/bookings/${b.booking.id}/verify`, res);
      if (!v.verified) return showToast(t.cfVerifyFail);
      navigate(`/bookings/farm/${b.booking.id}`);
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="gallery">
        {farm.photos.length ? farm.photos.map((p, i) => <img key={i} src={p} alt={`${farm.name} ${i + 1}`} />) : <Photo alt={farm.name} icon="🌴" />}
      </div>
      <div className="detail">
        <div className="stack">
          <div>
            <h1 className="title">{farm.name}</h1>
            <div className="muted">{[farm.area, farm.distanceFromCityKm ? t.cfFromCity.replace('{km}', String(farm.distanceFromCityKm)) : '', t.cfUpTo.replace('{n}', String(farm.maxGuests))].filter(Boolean).join(' · ')}</div>
          </div>
          {!!farm.about && <div className="card"><h3 style={{ fontSize: 16, marginBottom: 6 }}>{t.cfAbout}</h3><span className="muted" style={{ whiteSpace: 'pre-line' }}>{farm.about}</span></div>}

          <div className="card stack" style={{ gap: 8 }}>
            <h3 style={{ fontSize: 16 }}>{t.cfStays}</h3>
            {offered.map((k) => {
              const s = farm.slots[k];
              return (
                <div key={k} className="between" style={{ borderBottom: '1px solid var(--divider)', paddingBottom: 6 }}>
                  <div><b>{slotLabel(k, t)}</b><div className="small">{timeRange(s.start, s.end)}{endsNextDay(s.start, s.end) ? ` (${t.cfNextDay})` : ''}</div></div>
                  <div style={{ textAlign: 'end' }}>
                    <div><b className="price">{inr(s.weekdayPrice)}</b> <span className="small">{t.cfWeekday}</span></div>
                    {s.weekendPrice > 0 && s.weekendPrice !== s.weekdayPrice && <div><b className="price">{inr(s.weekendPrice)}</b> <span className="small">{t.cfWeekend}</span></div>}
                  </div>
                </div>
              );
            })}
            {farm.includedGuests > 0 && farm.extraGuestCharge > 0 && <span className="small">{t.cfIncluded.replace('{n}', String(farm.includedGuests)).replace('{price}', inr(farm.extraGuestCharge))}</span>}
          </div>

          {FACTS.length > 0 && (
            <div className="card stack" style={{ gap: 8 }}>
              <h3 style={{ fontSize: 16 }}>{t.cfGuestsRooms}</h3>
              <div className="facts">{FACTS.map(([k, v]) => <div key={k} className="fact"><b>{v}</b><span className="small">{k}</span></div>)}</div>
            </div>
          )}

          {farm.amenities.length > 0 && (
            <div className="card stack" style={{ gap: 8 }}>
              <h3 style={{ fontSize: 16 }}>{t.cfAmenities}</h3>
              <div className="wrap-row">{farm.amenities.filter((a) => AMENITY_KEYS[a]).map((a) => <span key={a} className="chip chip-ok">✓ {t[AMENITY_KEYS[a]]}</span>)}</div>
              {!!farm.poolDetails && <span className="small">{t.cfPool}: <bdi>{farm.poolDetails}</bdi></span>}
            </div>
          )}

          <div className="card stack" style={{ gap: 4 }}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>{t.cfRules}</h3>
            {RULES.map(([k, v, ok]) => <div key={k} className="kv"><span>{k}</span><b style={{ color: ok ? 'var(--green)' : 'var(--danger)' }}>{v}</b></div>)}
            {!!r.musicTill && <span className="small">• {t.cfMusicTill.replace('{time}', time12(r.musicTill))}</span>}
            {r.minAge > 0 && <span className="small">• {t.cfMinAge.replace('{n}', String(r.minAge))}</span>}
            {!!r.other && <span className="small">• <bdi>{r.other}</bdi></span>}
          </div>

          {farm.addons.length > 0 && (
            <div className="card stack" style={{ gap: 4 }}>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>{t.cfExtras}</h3>
              {farm.addons.map((a, i) => <div key={i} className="kv"><span><bdi>{a.name}</bdi></span><b>{inr(a.price)}</b></div>)}
            </div>
          )}

          <div className="note stack" style={{ gap: 4 }}>
            {farm.securityDeposit > 0 && <span>• {t.cfDeposit.replace('{amount}', inr(farm.securityDeposit))}</span>}
            <span>• {t.cfAddressAfter}</span>
          </div>
          <div className="card"><h3 style={{ fontSize: 16, marginBottom: 6 }}>{t.cfPolicyTitle}</h3><span className="muted">{t.cfPolicy}</span></div>
        </div>

        <aside className="card stack book-card sticky">
          <h3 style={{ fontSize: 17 }}>{t.cfBookTitle}</h3>
          <MonthCalendar month={month} onMonth={setMonth} selected={date} onPick={setDate} isDisabled={(d) => d < today}
            dots={(d) => offered.map((k) => colour(avail[d]?.[k]))} />
          <div className="wrap-row small">
            <span><span style={{ color: 'var(--green)' }}>●</span> {t.venueSlotFree}</span>
            <span><span style={{ color: 'var(--pink)' }}>●</span> {t.venueSlotBooked}</span>
            <span>{offered.map((k) => slotLabel(k, t)).join(' · ')}</span>
          </div>
          <div className="field">
            <label>{t.cfStayType}</label>
            <div className="wrap-row">
              {offered.map((k) => {
                const st = slotState(k);
                return <button key={k} className={`pick ${slot === k ? 'sel' : ''}`} disabled={!!date && st !== undefined && st !== 'free'} onClick={() => setSlot(k)}>{slotLabel(k, t)}</button>;
              })}
            </div>
          </div>
          <div className="field">
            <label htmlFor="fg">{t.cfGuests}</label>
            <input id="fg" className="input" inputMode="numeric" value={guests} placeholder={`1–${farm.maxGuests}`} onChange={(e) => setGuests(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          </div>
          <div className="field">
            <label>{t.cfOccasion}</label>
            <div className="wrap-row">{OCCASIONS.map((o) => <button key={o} className={`pick ${occasion === o ? 'sel' : ''}`} onClick={() => setOccasion((c) => (c === o ? '' : o))}>{occLabel(o)}</button>)}</div>
          </div>
          {quoteErr ? <span className="err">{quoteErr}</span> : quote ? (
            <div className="stack" style={{ gap: 4, background: 'var(--bg)', borderRadius: 14, padding: 12 }}>
              <div className="kv"><span>{t.cfStayPrice} · {timeRange(quote.checkIn, quote.checkOut)}{endsNextDay(quote.checkIn, quote.checkOut) ? ` (${t.cfNextDay})` : ''}</span><b>{inr(quote.basePrice)}</b></div>
              {quote.extraGuests > 0 && <div className="kv"><span>{t.cfExtraGuests.replace('{n}', String(quote.extraGuests))}</span><b>{inr(quote.extraGuestCharge)}</b></div>}
              <div className="kv"><span><b>{t.cfTotal}</b></span><b>{inr(quote.total)}</b></div>
              <div className="divider" />
              <div className="kv"><span><b>{t.cfPayNow.replace('{pct}', String(quote.advancePct))}</b></span><b className="price">{inr(quote.advanceAmount)}</b></div>
              <div className="kv"><span>{t.cfPayLater}</span><b>{inr(quote.balanceAmount)}</b></div>
            </div>
          ) : <span className="small">{t.cfErrPick}</span>}
          <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />{t.cfAgree}</label>
          <button className="btn btn-primary btn-block" disabled={!quote || !agree || paying} onClick={pay}>{paying ? '…' : quote ? t.cfPayBtn.replace('{amount}', inr(quote.advanceAmount)) : t.cfBookTitle}</button>
          {!user && <span className="small">{t.webLoginToBook}</span>}
        </aside>
      </div>
      {toast}
    </div>
  );
}
