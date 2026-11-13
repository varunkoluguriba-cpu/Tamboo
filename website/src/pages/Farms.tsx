import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useLang } from '../lib/lang';
import { usePageMeta } from '../lib/seo';
import { LoadError, Photo, Spinner, inr } from '../components/ui';
import type { Farm } from '../../../customer-app/src/utils/farm';

export default function Farms() {
  const { t } = useLang();
  const [farms, setFarms] = useState<Farm[] | null>(null);
  const [error, setError] = useState(false);
  const [params] = useSearchParams();
  const [q, setQ] = useState(() => params.get('q') || '');
  const guests = Number(params.get('guests') || 0);
  const [poolOnly, setPoolOnly] = useState(false);

  usePageMeta(t.cfListTitle, t.cfListHint);
  const load = useCallback(() => { setError(false); api.get<Farm[]>('/api/farms').then(setFarms).catch(() => setError(true)); }, []);
  useEffect(load, [load]);

  const shown = useMemo(() => (farms || [])
    .filter((f) => (!q.trim() || `${f.name} ${f.area}`.toLowerCase().includes(q.trim().toLowerCase())) && (!poolOnly || f.amenities.includes('pool')) && (!guests || !f.maxGuests || f.maxGuests >= guests))
    .sort((a, b) => (a.distanceFromCityKm || 999) - (b.distanceFromCityKm || 999)), [farms, q, poolOnly, guests]);

  return (
    <div className="stack">
      <h1 className="title">{t.cfListTitle}</h1>
      <p className="muted" style={{ margin: 0 }}>{t.cfListHint}</p>
      <div className="card row" style={{ flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: '1 1 240px' }} placeholder={t.cfSearchPh} value={q} onChange={(e) => setQ(e.target.value)} />
        <button className={`pick ${poolOnly ? 'sel' : ''}`} onClick={() => setPoolOnly((p) => !p)}>{t.cfAmPool}</button>
      </div>
      {error ? <LoadError onRetry={load} /> : farms === null ? <Spinner /> : farms.length === 0 ? <div className="card muted">{t.cfNone}</div> : (
        <>
          <span className="muted">{shown.length === 1 ? t.cfOne : t.cfCount.replace('{n}', String(shown.length))}</span>
          {shown.length === 0 ? <div className="card muted">{t.cfNoMatch}</div> : (
            <div className="grid">
              {shown.map((f) => (
                <Link key={f.id} to={`/farm-houses/${f.id}`} className="tile">
                  <Photo src={f.photos?.[0]} alt={f.name} icon="🌴" />
                  <div className="tile-body">
                    <span className="tile-name">{f.name}</span>
                    <span className="small">{[f.area, f.distanceFromCityKm ? t.cfFromCity.replace('{km}', String(f.distanceFromCityKm)) : ''].filter(Boolean).join(' · ')}</span>
                    <div className="wrap-row" style={{ gap: 6 }}>
                      <span className="chip">{t.cfUpTo.replace('{n}', String(f.maxGuests))}</span>
                      {f.bedrooms > 0 && <span className="chip">{t.cfBedroomsN.replace('{n}', String(f.bedrooms))}</span>}
                      {f.amenities.includes('pool') && <span className="chip chip-blue">{t.cfPool}</span>}
                    </div>
                    {f.fromPrice != null && <span className="price">{t.cfFrom.replace('{price}', inr(f.fromPrice))}</span>}
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
