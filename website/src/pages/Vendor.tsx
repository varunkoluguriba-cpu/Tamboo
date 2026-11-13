import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { usePageMeta } from '../lib/seo';
import { useLang } from '../lib/lang';
import { useCart } from '../lib/cart';
import { LoadError, Spinner, inr } from '../components/ui';
import ItemCard, { type PublicItem, type PublicVendor } from '../components/ItemCard';

export default function Vendor() {
  const { id = '' } = useParams();
  const { t } = useLang();
  const { event, count } = useCart();
  const [vendor, setVendor] = useState<PublicVendor | null>(null);
  const [items, setItems] = useState<PublicItem[] | null>(null);
  const [error, setError] = useState<'' | 'load' | 'missing'>('');

  const load = useCallback(() => {
    setError('');
    api.get<PublicVendor>(`/api/vendors/${id}`).then(setVendor).catch((e) => setError(e instanceof ApiError && e.status === 404 ? 'missing' : 'load'));
  }, [id]);
  useEffect(load, [load]);
  useEffect(() => {
    const qs = event.date ? `?date=${encodeURIComponent(event.date)}` : '';
    api.get<PublicItem[]>(`/api/vendors/${id}/products${qs}`).then(setItems).catch(() => setItems([]));
  }, [id, event.date]);

  usePageMeta(vendor ? `${vendor.name} — ${t.webNavRentals}` : undefined, vendor?.blurb || undefined);
  if (error === 'missing') return <div className="card muted">{t.webVendorMissing} <Link to="/rentals" className="ok">{t.webNavRentals} →</Link></div>;
  if (error) return <LoadError onRetry={load} />;
  if (!vendor) return <Spinner />;

  return (
    <div className="stack">
      {!!vendor.coverPhoto && <img src={vendor.coverPhoto} alt={vendor.name} style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 'var(--radius)' }} />}
      <div className="between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 className="title">{vendor.name}</h1>
          <div className="muted">{[vendor.area, vendor.city].filter(Boolean).join(', ')}{vendor.hours ? ` · ${vendor.hours}` : ''}</div>
        </div>
        {count > 0 && <Link to="/cart" className="btn btn-primary btn-sm">{t.cart} · {count}</Link>}
      </div>
      {!!vendor.blurb && <div className="card">{vendor.blurb}</div>}
      <div className="card wrap-row" style={{ gap: 16 }}>
        <span className="chip chip-ok">✓ {t.browseVerifiedBadge}</span>
        <span className="small">{t.webDeliveryFee}: <b>{vendor.deliveryFee ? inr(vendor.deliveryFee) : t.webFree}</b></span>
        <span className="small">{t.webSetupFee}: <b>{vendor.setupFee ? inr(vendor.setupFee) : t.webIncluded}</b></span>
        {vendor.pickupFee > 0 && <span className="small">{t.vendorPickupLabel}: <b>{inr(vendor.pickupFee)}</b></span>}
        {vendor.areas.length > 0 && <span className="small">{t.webDeliversTo}: {vendor.areas.join(', ')}</span>}
      </div>
      {!event.date && <span className="small">{t.webPickDateForStock} <Link to="/rentals" className="ok">{t.browseAvailabilityPrefix} →</Link></span>}
      {items === null ? <Spinner /> : items.length === 0 ? <div className="card muted">{t.webNoItems}</div> : (
        <div className="grid">{items.map((i) => <ItemCard key={i.id} item={i} vendor={vendor} />)}</div>
      )}
    </div>
  );
}
