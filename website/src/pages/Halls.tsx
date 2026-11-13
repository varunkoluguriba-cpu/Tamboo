import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useLang } from '../lib/lang';
import { usePageMeta } from '../lib/seo';
import { LoadError, Photo, Spinner, inr } from '../components/ui';
import { hallTypeText, paxText } from '../../../customer-app/src/utils/units';

export type PublicHall = {
  id: string; type: string; name: string; hotelName: string; area: string; city: string; blurb: string; photos: string[];
  cap: string; seated: number; floating: number; ac: boolean; hasCrockery: boolean; amenities: string;
  facts: Array<{ k: string; v: string }>; pricingMode: 'rent' | 'perPlate'; rent: number; platePrice: number; minPlates: number;
  token: number; advancePct: number; partnerId: string; phone: string; km: number | null; lat: number | null; lng: number | null;
};

// Same four types partners list under (partner-app VENUE_TYPES).
const TYPES = ['', 'Function Hall', 'Banquet Hall', 'Marriage Hall', 'Hotel'];

export default function Halls() {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const [halls, setHalls] = useState<PublicHall[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState(() => params.get('q') || '');
  const type = params.get('type') || '';
  const guests = Number(params.get('guests') || 0);

  const load = useCallback(() => {
    setError(false);
    api.get<PublicHall[]>('/api/halls').then(setHalls).catch(() => setError(true));
  }, []);
  useEffect(load, [load]);

  const shown = useMemo(() => (halls || []).filter((h) =>
    (!type || (h.type || '').toLowerCase() === type.toLowerCase())
    && (!q.trim() || `${h.name} ${h.area}`.toLowerCase().includes(q.trim().toLowerCase()))
    && (!guests || !h.floating || h.floating >= guests)), [halls, type, q, guests]);

  usePageMeta(t.venuesHeaderTitle, t.webCatHallsSub);
  const set = (k: string, v: string) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };
  const typeLabel = (v: string) => (v ? hallTypeText(v, t) : t.venuesTypeAll);

  return (
    <div className="stack">
      <h1 className="title">{t.venuesHeaderTitle}</h1>
      <div className="card stack" style={{ gap: 12 }}>
        <input className="input" placeholder={t.venuesSearchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="wrap-row">
          {TYPES.map((v) => <button key={v || 'all'} className={`pick ${type === v ? 'sel' : ''}`} onClick={() => set('type', v)}>{typeLabel(v)}</button>)}
        </div>
        <div className="row" style={{ maxWidth: 260 }}>
          <label className="small" htmlFor="g" style={{ whiteSpace: 'nowrap' }}>{t.guests}</label>
          <input id="g" className="input" inputMode="numeric" value={guests || ''} placeholder="100" onChange={(e) => set('guests', e.target.value.replace(/\D/g, '').slice(0, 5))} />
        </div>
      </div>

      {error ? <LoadError onRetry={load} /> : halls === null ? <Spinner /> : (
        <>
          <span className="muted">{shown.length === 1 ? t.venuesOneFound : t.venuesCountFound.replace('{count}', String(shown.length))}</span>
          {shown.length === 0 ? <div className="card muted">{t.venuesNoHallsMatch}</div> : (
            <div className="grid">
              {shown.map((h) => (
                <Link key={h.id} to={`/halls/${h.id}`} className="tile">
                  <Photo src={h.photos?.[0]} alt={h.name} />
                  <div className="tile-body">
                    <span className="tile-name">{h.name}</span>
                    <span className="small">{[hallTypeText(h.type || '', t), h.area].filter(Boolean).join(' · ')}</span>
                    <div className="wrap-row" style={{ gap: 6 }}>
                      <span className="chip">{paxText(h.cap, t)}</span>
                      <span className="chip">{h.ac ? t.venuesAC : t.venuesNonAC}</span>
                      <span className={`chip ${h.hasCrockery ? 'chip-ok' : 'chip-warn'}`}>{h.hasCrockery ? t.venuesHasCrockery : t.venuesNoCrockery}</span>
                    </div>
                    <div className="between">
                      <span className="price">{h.pricingMode === 'perPlate' ? `${inr(h.platePrice)}${t.venuesPerPlateLabel}` : `${t.venuesRentLabel} ${inr(h.rent)}`}</span>
                      <span className="small">{t.venuesTokenLabel} {inr(h.token)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
