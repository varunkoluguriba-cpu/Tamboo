import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useLang } from '../lib/lang';
import { usePageMeta } from '../lib/seo';
import { useCart, toDMY, toYMD } from '../lib/cart';
import { LoadError, Photo, Spinner, inr } from '../components/ui';
import ItemCard, { type PublicItem, type PublicVendor } from '../components/ItemCard';
import { itemCategoryText } from '../../../customer-app/src/utils/units';

// Category chips → item category codes (chairs and tables share one chip, as in the app).
const CATS: Array<{ key: string; codes: string[] }> = [
  { key: '', codes: [] }, { key: 'tent', codes: ['tent'] }, { key: 'seat', codes: ['seat', 'table'] }, { key: 'crockery', codes: ['crockery'] },
  { key: 'kitchen', codes: ['kitchen'] }, { key: 'light', codes: ['light'] }, { key: 'av', codes: ['av'] }, { key: 'decor', codes: ['decor'] },
  { key: 'stage', codes: ['stage'] }, { key: 'floor', codes: ['floor'] }, { key: 'staff', codes: ['staff'] },
];

export default function Rentals() {
  const { t } = useLang();
  const { event, setEvent, count } = useCart();
  const [vendors, setVendors] = useState<PublicVendor[] | null>(null);
  const [items, setItems] = useState<PublicItem[] | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<'items' | 'vendors'>('items');
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');

  usePageMeta(t.webNavRentals, t.webCatRentalsSub);
  const load = useCallback(() => {
    setError(false);
    api.get<PublicVendor[]>('/api/vendors').then(setVendors).catch(() => setError(true));
  }, []);
  useEffect(load, [load]);
  // Stock is per date, so items are re-read whenever the event date changes.
  useEffect(() => {
    if (!vendors) return;
    setItems(null);
    const qs = event.date ? `?date=${encodeURIComponent(event.date)}` : '';
    Promise.all(vendors.map((v) => api.get<PublicItem[]>(`/api/vendors/${v.id}/products${qs}`).catch(() => [] as PublicItem[])))
      .then((lists) => setItems(lists.flat()));
  }, [vendors, event.date]);

  const vendorById = useMemo(() => new Map((vendors || []).map((v) => [v.id, v])), [vendors]);
  const shown = useMemo(() => {
    const codes = CATS.find((c) => c.key === cat)?.codes || [];
    const s = q.trim().toLowerCase();
    return (items || []).filter((i) => (!codes.length || codes.includes(i.cat))
      && (!s || i.name.toLowerCase().includes(s) || (vendorById.get(i.vendorId)?.name || '').toLowerCase().includes(s)));
  }, [items, cat, q, vendorById]);

  return (
    <div className="stack">
      <div className="between">
        <h1 className="title">{t.webNavRentals}</h1>
        {count > 0 && <Link to="/cart" className="btn btn-primary btn-sm">{t.cart} · {count}</Link>}
      </div>
      <div className="card stack" style={{ gap: 12 }}>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: '1 1 180px' }}>
            <label htmlFor="rd">{t.browseAvailabilityPrefix}</label>
            <input id="rd" type="date" className="input" min={new Date().toISOString().slice(0, 10)} value={toYMD(event.date)} onChange={(e) => setEvent({ date: toDMY(e.target.value) })} />
          </div>
          <div className="field" style={{ flex: '2 1 240px' }}>
            <label htmlFor="rq">&nbsp;</label>
            <input id="rq" className="input" placeholder={t.browseSearchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {!event.date && <span className="small">{t.webPickDateForStock}</span>}
        <div className="tabs" style={{ maxWidth: 320 }}>
          <button className={tab === 'items' ? 'sel' : ''} onClick={() => setTab('items')}>{t.browseTabItems}</button>
          <button className={tab === 'vendors' ? 'sel' : ''} onClick={() => setTab('vendors')}>{t.browseTabVendors}</button>
        </div>
        {tab === 'items' && (
          <div className="wrap-row">
            {CATS.map((c) => <button key={c.key || 'all'} className={`pick ${cat === c.key ? 'sel' : ''}`} onClick={() => setCat(c.key)}>{c.key ? itemCategoryText(c.key, t) : t.browseCatAll}</button>)}
          </div>
        )}
      </div>

      {error ? <LoadError onRetry={load} /> : !vendors ? <Spinner /> : tab === 'vendors' ? (
        vendors.length === 0 ? <div className="card muted">{t.webNoVendors}</div> : (
          <div className="grid">
            {vendors.map((v) => (
              <Link key={v.id} to={`/rentals/${v.id}`} className="tile">
                <Photo src={v.coverPhoto || undefined} alt={v.name} icon="⛺" />
                <div className="tile-body">
                  <span className="tile-name">{v.name}</span>
                  <span className="small">{[v.area, v.city].filter(Boolean).join(', ')}</span>
                  <div className="wrap-row" style={{ gap: 6 }}>
                    <span className="chip chip-ok">✓ {t.browseVerifiedBadge}</span>
                    <span className="chip">{t.webDeliveryFee}: {v.deliveryFee ? inr(v.deliveryFee) : t.webFree}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : items === null ? <Spinner /> : shown.length === 0 ? <div className="card muted">{t.browseNoMatchFilters}</div> : (
        <div className="grid">
          {shown.map((i) => <ItemCard key={i.id} item={i} vendor={vendorById.get(i.vendorId)} showVendor />)}
        </div>
      )}
    </div>
  );
}
