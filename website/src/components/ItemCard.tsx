import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { useLang } from '../lib/lang';
import { Photo, inr } from './ui';
import { unitText } from '../../../customer-app/src/utils/units';

export type PublicItem = {
  id: string; name: string; cat: string; vendorId: string; price: number; unit: string; specs: string; deposit: string; min: string;
  avail: { total: number; reserved: number; free: number }; photos: string[];
};
export type PublicVendor = {
  id: string; name: string; area: string; city: string; hours: string; blurb: string; deliveryFee: number; setupFee: number; pickupFee: number;
  areas: string[]; coverPhoto: string; logoPhoto: string;
};

// One rentable item with a quantity stepper. Stock shown is for the event date in the cart.
export default function ItemCard({ item, vendor, showVendor }: { item: PublicItem; vendor?: PublicVendor; showVendor?: boolean }) {
  const { t } = useLang();
  const { add, lines, event } = useCart();
  const min = Math.max(1, parseInt(item.min, 10) || 1);
  const [qty, setQty] = useState(min);
  const inCart = lines.find((l) => l.productId === item.id)?.qty || 0;
  const free = item.avail.free;
  const soldOut = free <= 0;
  const tooMany = qty + inCart > free;

  const addIt = () => {
    if (!vendor || soldOut || tooMany) return;
    add({ productId: item.id, vendorId: item.vendorId, vendorName: vendor.name, name: item.name, unit: item.unit, unitPrice: item.price, free },
      qty, { deliveryFee: vendor.deliveryFee || 0, setupFee: vendor.setupFee || 0, pickupFee: vendor.pickupFee || 0 });
  };

  return (
    <div className="tile">
      <Photo src={item.photos?.[0]} alt={item.name} icon="📦" />
      <div className="tile-body">
        <span className="tile-name">{item.name}</span>
        {showVendor && vendor && <Link to={`/rentals/${vendor.id}`} className="small" style={{ color: 'var(--pink-strong)' }}>{vendor.name}</Link>}
        {!!item.specs && <span className="small">{item.specs}</span>}
        <div className="between">
          <span className="price">{inr(item.price)} <span className="small">{unitText(item.unit, t)}</span></span>
          <span className={`chip ${soldOut ? 'chip-warn' : 'chip-ok'}`}>{soldOut ? t.webSoldOut : event.date ? t.webFreeOnDate.replace('{n}', String(free)) : t.webInStock.replace('{n}', String(free))}</span>
        </div>
        {min > 1 && <span className="small">{t.webMinOrder.replace('{n}', String(min))}</span>}
        <div className="row">
          <div className="row" style={{ gap: 4 }}>
            <button className="btn btn-soft btn-sm" onClick={() => setQty((q) => Math.max(min, q - 1))} aria-label="−">−</button>
            <input className="input" style={{ width: 64, height: 36, textAlign: 'center' }} inputMode="numeric" value={qty} onChange={(e) => setQty(Math.max(0, parseInt(e.target.value.replace(/\D/g, '') || '0', 10)))} onBlur={() => setQty((q) => Math.max(min, q))} />
            <button className="btn btn-soft btn-sm" onClick={() => setQty((q) => q + 1)} aria-label="+">+</button>
          </div>
          <button className="btn btn-primary btn-sm" style={{ marginInlineStart: 'auto' }} disabled={soldOut || tooMany || qty < min} onClick={addIt}>{t.webAddToCart}</button>
        </div>
        {inCart > 0 && <span className="small ok">{t.webInCart.replace('{n}', String(inCart))}</span>}
        {tooMany && !soldOut && <span className="err" style={{ fontSize: 12.5 }}>{t.webOnlyLeft.replace('{n}', String(free))}</span>}
      </div>
    </div>
  );
}
