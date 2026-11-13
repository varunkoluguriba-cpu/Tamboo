import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { EmptyArt } from '../components/Illustrations';
import { useLang } from '../lib/lang';
import { usePageMeta } from '../lib/seo';
import { useServicesConfig } from '../lib/services';
import { LoadError, Spinner, inr } from '../components/ui';
import { hallStatusText, orderStatusText, prettyDate, quoteStatusText, refundText } from '../../../customer-app/src/utils/status';
import { farmDate, slotLabel, type MyFarmBooking } from '../../../customer-app/src/utils/farm';
import type { RemoteHallBooking, RemoteOrderSummary } from '../../../customer-app/src/navigation/types';

type Tab = 'orders' | 'halls' | 'farms' | 'quotes' | 'services';
type Quote = { id: string; code: string; vendorName: string; productName: string; dateTxt: string; status: string; quotedTotal: number };
type ServiceReq = { id: string; code: string; vendorName: string; category: string; eventDate: string; status: string; fee: number; refundStatus: string; refundAmount: number };

const OK_ORDER = ['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];
const OK_HALL = ['visited', 'awaiting_advance', 'confirmed'];

export default function Bookings() {
  const { t } = useLang();
  const { user, loading: authLoading, openLogin } = useAuth();
  const services = useServicesConfig();
  const [params, setParams] = useSearchParams();
  const notice = (useLocation().state as { notice?: string } | null)?.notice;
  const tab = (params.get('tab') as Tab) || 'orders';
  const [orders, setOrders] = useState<RemoteOrderSummary[] | null>(null);
  const [halls, setHalls] = useState<RemoteHallBooking[] | null>(null);
  const [farms, setFarms] = useState<MyFarmBooking[] | null>(null);
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [reqs, setReqs] = useState<ServiceReq[] | null>(null);
  const [error, setError] = useState(false);

  usePageMeta(t.webNavBookings);
  const load = useCallback(() => {
    if (!user) return;
    setError(false);
    const fail = () => setError(true);
    api.get<RemoteOrderSummary[]>('/api/orders/me').then(setOrders).catch(fail);
    api.get<RemoteHallBooking[]>('/api/halls/my-tokens').then(setHalls).catch(fail);
    api.get<MyFarmBooking[]>('/api/farms/bookings/me').then(setFarms).catch(fail);
    api.get<Quote[]>('/api/quotes/me').then(setQuotes).catch(fail);
  }, [user]);
  useEffect(load, [load]);
  useEffect(() => { if (services?.enabled) api.get<ServiceReq[]>('/api/services/requests/me').then(setReqs).catch(() => setReqs([])); }, [services?.enabled]);

  if (authLoading) return <Spinner />;
  if (!user) {
    return (
      <div className="card stack" style={{ alignItems: 'center', textAlign: 'center', padding: 36 }}>
        <EmptyArt />
        <h1 className="section-title">{t.webNavBookings}</h1>
        <span className="muted">{t.webLoginForBookings}</span>
        <button className="btn btn-primary" onClick={openLogin}>{t.webLogin}</button>
      </div>
    );
  }

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: 'orders', label: t.webTabRentals }, { key: 'halls', label: t.bookingsTabHalls }, { key: 'farms', label: t.cfTabFarms },
    { key: 'quotes', label: t.bookingsTabQuotes }, ...(services?.enabled ? [{ key: 'services' as Tab, label: t.svTab }] : []),
  ];
  const Pill = ({ label, ok }: { label: string; ok: boolean }) => <span className={`pill ${ok ? 'chip-ok' : 'chip-warn'}`}>{label}</span>;
  const empty = (msg: string, to: string, cta: string) => (
    <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}><EmptyArt size={100} /><span className="muted">{msg}</span><Link to={to} className="btn btn-soft">{cta}</Link></div>
  );

  return (
    <div className="stack">
      <h1 className="title">{t.webNavBookings}</h1>
      {!!notice && <div className="note" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>{notice}</div>}
      <div className="tabs">
        {TABS.map((x) => <button key={x.key} className={tab === x.key ? 'sel' : ''} onClick={() => setParams({ tab: x.key }, { replace: true })}>{x.label}</button>)}
      </div>
      {error && <LoadError onRetry={load} />}

      {tab === 'orders' && (orders === null ? <Spinner /> : orders.length === 0 ? empty(t.bookingsEmptyActive, '/rentals', t.cartBrowseItems) : (
        <div className="stack" style={{ gap: 10 }}>
          {orders.map((o) => (
            <Link key={o.id} to={`/bookings/order/${o.id}`} className="card stack" style={{ gap: 4 }}>
              <div className="between"><span className="small">{o.code}</span><Pill label={orderStatusText(o.status, t)} ok={OK_ORDER.includes(o.status)} /></div>
              <b>{o.vendorName}</b>
              <div className="between"><span className="small">{prettyDate(o.dateTxt)} · {o.lines.length} {t.webItems}</span><b>{inr(o.amountPaid ?? o.value)}</b></div>
              {!!refundText(o, t) && <span className="small" style={{ color: 'var(--amber)' }}>{refundText(o, t)}</span>}
            </Link>
          ))}
        </div>
      ))}

      {tab === 'halls' && (halls === null ? <Spinner /> : halls.length === 0 ? empty(t.bookingsEmptyHalls, '/halls', t.bookingsFindHall) : (
        <div className="stack" style={{ gap: 10 }}>
          {halls.map((b) => (
            <Link key={b.id} to={`/bookings/hall/${b.id}`} className="card stack" style={{ gap: 4 }}>
              <div className="between"><span className="small">{b.id.slice(-6).toUpperCase()}</span><Pill label={hallStatusText(b, t)} ok={OK_HALL.includes(b.status)} /></div>
              <b>{b.hallName}</b>
              <div className="between"><span className="small">{prettyDate(b.date)} · {b.slot === 'Morning' ? t.venueMorning : t.venueEvening}</span><b>{inr(b.amount)}</b></div>
              {!!refundText(b, t) && <span className="small" style={{ color: 'var(--amber)' }}>{refundText(b, t)}</span>}
            </Link>
          ))}
        </div>
      ))}

      {tab === 'farms' && (farms === null ? <Spinner /> : farms.length === 0 ? empty(t.cfNoBookings, '/farm-houses', t.cfFind) : (
        <div className="stack" style={{ gap: 10 }}>
          {farms.map((b) => {
            const ok = b.status === 'confirmed' || b.status === 'completed';
            const st = { confirmed: t.cfStConfirmed, completed: t.cfStCompleted, cancelled: t.cfStCancelled, disputed: t.cfStDisputed }[b.status];
            const rf = b.refundStatus === 'pending' ? t.cfRefundPending.replace('{amount}', inr(b.refundAmount)) : b.refundStatus === 'refunded' ? t.cfRefunded.replace('{amount}', inr(b.refundAmount)) : '';
            return (
              <Link key={b.id} to={`/bookings/farm/${b.id}`} className="card stack" style={{ gap: 4 }}>
                <div className="between"><span className="small">{b.code}</span><Pill label={st} ok={ok} /></div>
                <b>{b.farmName}</b>
                <div className="between"><span className="small">{farmDate(b.date, t)} · {slotLabel(b.slot, t)}</span><b>{inr(b.total)}</b></div>
                {!!rf && <span className="small" style={{ color: 'var(--amber)' }}>{rf}</span>}
              </Link>
            );
          })}
        </div>
      ))}

      {tab === 'quotes' && (quotes === null ? <Spinner /> : quotes.length === 0 ? <div className="card muted">{t.bookingsEmptyQuotes}</div> : (
        <div className="stack" style={{ gap: 10 }}>
          <div className="note">{t.webQuotesInApp}</div>
          {quotes.map((q) => (
            <div key={q.id} className="card stack" style={{ gap: 4 }}>
              <div className="between"><span className="small">{q.code}</span><Pill label={quoteStatusText(q.status, t)} ok={q.status === 'ACCEPTED' || q.status === 'OFFER_SENT'} /></div>
              <b>{q.vendorName}</b>
              <div className="between"><span className="small">{q.productName} · {prettyDate(q.dateTxt)}</span>{q.quotedTotal > 0 && <b>{inr(q.quotedTotal)}</b>}</div>
            </div>
          ))}
        </div>
      ))}

      {tab === 'services' && (reqs === null ? <Spinner /> : reqs.length === 0 ? empty(t.svReqsEmpty, '/services', t.webNavServices) : (
        <div className="stack" style={{ gap: 10 }}>
          {reqs.map((r) => {
            const st = ({ NEW: t.svStNew, CONTACTED: t.svStContacted, CLOSED: t.svStClosed, NO_RESPONSE: t.svStNoResponse } as Record<string, string>)[r.status] || r.status;
            return (
              <div key={r.id} className="card stack" style={{ gap: 4 }}>
                <div className="between"><span className="small">{r.code}</span><Pill label={st} ok={r.status !== 'NO_RESPONSE'} /></div>
                <b>{r.vendorName}</b>
                <div className="between"><span className="small">{prettyDate(r.eventDate)}</span><span className="small">{r.fee > 0 ? t.svFeePaid.replace('{fee}', String(r.fee)) : t.svFreeRequest}</span></div>
                {r.status === 'NO_RESPONSE' && <span className="small" style={{ color: 'var(--amber)' }}>
                  {r.fee === 0 ? t.svNoRespFree : r.refundStatus === 'refunded' ? t.svNoRespRefunded.replace('{fee}', String(r.fee)) : t.svNoRespPending.replace('{fee}', String(r.fee))}
                </span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
