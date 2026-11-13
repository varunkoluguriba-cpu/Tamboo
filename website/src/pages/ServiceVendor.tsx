import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/lang';
import { useServicesConfig } from '../lib/services';
import { payWithRazorpay } from '../lib/razorpay';
import { toDMY } from '../lib/cart';
import { languageText, offerPriceText, serviceCategoryInfo, traditionText, type PublicServiceVendor } from '../lib/serviceText';
import { LoadError, Photo, Spinner, useToast } from '../components/ui';

const EVENT_TYPES = ['Wedding', 'Reception', 'Birthday', 'House party', 'Corporate'];

export default function ServiceVendor() {
  const { id = '' } = useParams();
  const { t } = useLang();
  const { user, openLogin, needPhone } = useAuth();
  const cfg = useServicesConfig();
  const navigate = useNavigate();
  const [v, setV] = useState<PublicServiceVendor | null>(null);
  const [error, setError] = useState(false);
  const [offerId, setOfferId] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('');
  const [guests, setGuests] = useState('');
  const [area, setArea] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, showToast] = useToast();

  const load = useCallback(() => { setError(false); api.get<PublicServiceVendor>(`/api/services/${id}`).then(setV).catch(() => setError(true)); }, [id]);
  useEffect(() => { if (cfg?.enabled) load(); }, [load, cfg?.enabled]);

  if (cfg && !cfg.enabled) return <div className="card muted">{t.webServicesSoon}</div>;
  if (error) return <LoadError onRetry={load} />;
  if (!v || !cfg) return <Spinner />;

  const free = (cfg.freeLeft || 0) > 0;
  const fee = free ? 0 : cfg.fees?.[v.category] || 0;
  const hours = cfg.noResponseHours || 24;
  const evLabel = (e: string) => ({ Wedding: t.homeScreenOccasionWedding, Reception: t.homeScreenOccasionReception, Birthday: t.homeScreenOccasionBirthday, 'House party': t.homeScreenOccasionHouseParty, Corporate: t.homeScreenOccasionCorporate } as Record<string, string>)[e];
  const offer = v.offers?.find((o) => o.id === offerId);

  const send = async () => {
    if (!user) return openLogin();
    if (needPhone()) return;
    if (!date) return setErr(t.svReqNeedDate);
    if (!consent) return setErr(t.svReqNeedConsent);
    setErr(''); setBusy(true);
    try {
      const r = await api.post<{ request: { id: string }; payment: null | { orderId: string; amount: number; currency: string; keyId: string } }>('/api/services/requests', {
        partnerId: v.id, eventDate: toDMY(date), eventType: type, guests: parseInt(guests, 10) || 0, area, message, offerId: offerId || undefined, consent: true,
      });
      if (r.payment) {
        let res;
        try {
          res = await payWithRazorpay({ key: r.payment.keyId, order_id: r.payment.orderId, amount: r.payment.amount, currency: r.payment.currency, name: 'Tamboo',
            description: t.svReqPayDesc.replace('{vendor}', v.name), prefill: { name: user.name, contact: user.phone } });
        } catch (e) {
          if (!(e as { cancelled?: boolean }).cancelled) showToast(`${t.payNotCompletedTitle}: ${(e as Error).message}`);
          return;
        }
        const ver = await api.post<{ verified: boolean }>(`/api/services/requests/${r.request.id}/verify`, res);
        if (!ver.verified) return showToast(t.payVerifyFailedMsg);
      }
      const msg = (fee > 0 ? t.svReqSentPaid.replace('{fee}', String(fee)) : t.svReqSentFree).replace('{vendor}', v.name).replace('{hours}', String(hours));
      navigate('/bookings?tab=services', { state: { notice: `${t.svReqSentTitle}. ${msg}` } });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t.svReqFailed);
    } finally { setBusy(false); }
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <Link to={`/services?c=${v.category}`} className="small">← {serviceCategoryInfo(v.category, t).label}</Link>
      <div className="gallery">{v.photos.length ? v.photos.map((p, i) => <img key={i} src={p} alt={`${v.name} ${i + 1}`} />) : <Photo alt={v.name} icon={serviceCategoryInfo(v.category, t).icon} />}</div>
      <div className="detail">
        <div className="stack">
          <div>
            <h1 className="title">{v.name}</h1>
            <div className="muted">{[serviceCategoryInfo(v.category, t).label, v.area, v.experienceYears ? t.svExperience.replace('{n}', String(v.experienceYears)) : ''].filter(Boolean).join(' · ')}</div>
          </div>
          {!!v.about && <div className="card"><h3 style={{ fontSize: 16, marginBottom: 6 }}>{t.svAbout}</h3><span className="muted" style={{ whiteSpace: 'pre-line' }}>{v.about}</span></div>}
          <div className="card stack" style={{ gap: 4 }}>
            {v.areas.length > 0 && <div className="kv"><span>{t.svServes}</span><b>{v.areas.join(', ')}</b></div>}
            {v.traditions.length > 0 && <div className="kv"><span>{t.svTraditions}</span><b>{v.traditions.map((x) => traditionText(x, t)).join(', ')}</b></div>}
            {v.languages.length > 0 && <div className="kv"><span>{t.svLanguages}</span><b>{v.languages.map(languageText).join(', ')}</b></div>}
          </div>
          {!!v.offers?.length && (
            <div className="card stack">
              <h3 style={{ fontSize: 16 }}>{t.svPackages}</h3>
              {v.offers.map((o) => (
                <div key={o.id} className="stack" style={{ gap: 4, borderBottom: '1px solid var(--divider)', paddingBottom: 8 }}>
                  <div className="between"><b>{o.title}</b><b className="price">{offerPriceText(o, t)}</b></div>
                  {!!o.description && <span className="small">{o.description}</span>}
                  <button className={`pick ${offerId === o.id ? 'sel' : ''}`} style={{ alignSelf: 'flex-start' }} onClick={() => setOfferId((c) => (c === o.id ? '' : o.id))}>{t.svAskAbout}</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <aside className="card stack book-card sticky">
          <h3 style={{ fontSize: 17 }}>{t.svAsk}</h3>
          <span className="small">{t.svReqSubtitle.replace('{vendor}', v.name)}</span>
          {offer && <span className="chip">{t.svReqPackage.replace('{title}', offer.title)}</span>}
          <div className="field"><label htmlFor="sd">{t.svReqDate}</label><input id="sd" type="date" className="input" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="field"><label>{t.svReqType}</label><div className="wrap-row">{EVENT_TYPES.map((x) => <button key={x} className={`pick ${type === x ? 'sel' : ''}`} onClick={() => setType((c) => (c === x ? '' : x))}>{evLabel(x)}</button>)}</div></div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label htmlFor="sg">{t.svReqGuests}</label><input id="sg" className="input" inputMode="numeric" value={guests} onChange={(e) => setGuests(e.target.value.replace(/\D/g, '').slice(0, 5))} /></div>
            <div className="field" style={{ flex: 2 }}><label htmlFor="sa">{t.svReqArea}</label><input id="sa" className="input" value={area} placeholder={t.svReqAreaPh} onChange={(e) => setArea(e.target.value)} /></div>
          </div>
          <div className="field"><label htmlFor="sm">{t.svReqMsg}</label><textarea id="sm" className="input" style={{ height: 80, paddingTop: 10 }} value={message} placeholder={t.svReqMsgPh} onChange={(e) => setMessage(e.target.value)} /></div>
          {user ? <label className="check"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{t.svReqConsent.replace('{phone}', `⁦${user.phone}⁩`).replace('{vendor}', v.name)}</label>
            : <span className="small">{t.webLoginToRequest}</span>}
          <span className="small">{free ? t.svReqFeeFree.replace('{n}', String(cfg.freeLeft)).replace('{total}', String(cfg.freeQuotes)) : t.svReqFeePaid.replace('{fee}', String(fee)).replace('{vendor}', v.name).replace('{hours}', String(hours))}</span>
          {!!err && <span className="err">{err}</span>}
          <button className="btn btn-primary btn-block" disabled={busy} onClick={send}>{busy ? '…' : !user ? t.webLogin : fee > 0 ? t.svReqPay.replace('{fee}', String(fee)) : t.svReqSend}</button>
        </aside>
      </div>
      {toast}
    </div>
  );
}
