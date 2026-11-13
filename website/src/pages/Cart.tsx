import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { EmptyArt } from '../components/Illustrations';
import { useLang } from '../lib/lang';
import { usePageMeta } from '../lib/seo';
import { useCart, toDMY, toYMD } from '../lib/cart';
import { payWithRazorpay } from '../lib/razorpay';
import { inr, useToast } from '../components/ui';
import { unitText } from '../../../customer-app/src/utils/units';

const EVENT_TYPES = ['Wedding', 'Reception', 'Birthday', 'House party', 'Corporate'];

export default function Cart() {
  const { t } = useLang();
  const { user, openLogin } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'delivery' | 'pickup'>('delivery');
  const [payMode, setPayMode] = useState<'full' | 'advance'>('full');
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState<{ code: string; pct: number } | null>(null);
  const [couponErr, setCouponErr] = useState('');
  const [agree, setAgree] = useState(false);
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState('');
  const [toast, showToast] = useToast();
  usePageMeta(t.cart);
  const ev = cart.event;
  const totals = cart.totals(mode, applied?.pct || 0);
  const due = payMode === 'full' ? totals.total : Math.round(totals.total * 0.3);
  const vendors = [...new Set(cart.lines.map((l) => l.vendorId))];
  const evLabel = (e: string) => ({ Wedding: t.homeScreenOccasionWedding, Reception: t.homeScreenOccasionReception, Birthday: t.homeScreenOccasionBirthday, 'House party': t.homeScreenOccasionHouseParty, Corporate: t.homeScreenOccasionCorporate } as Record<string, string>)[e] || e;

  if (cart.lines.length === 0) {
    return (
      <div className="card stack" style={{ alignItems: 'center', textAlign: 'center', padding: 36 }}>
        <EmptyArt />
        <h1 className="section-title">{t.cartEmptyTitle}</h1>
        <span className="muted">{t.webCartEmptyBody}</span>
        <Link to="/rentals" className="btn btn-primary">{t.cartBrowseItems}</Link>
      </div>
    );
  }

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setCouponErr('');
    try {
      const r = await api.get<{ valid: boolean; discountPct?: number }>(`/api/coupons/${encodeURIComponent(code)}`);
      if (r.valid && r.discountPct) setApplied({ code, pct: r.discountPct }); else { setApplied(null); setCouponErr(t.cartInvalidCoupon); }
    } catch { setApplied(null); setCouponErr(t.cartInvalidCoupon); }
  };

  const pay = async () => {
    if (!user) return openLogin();
    if (!ev.date) return setErr(t.checkoutNeedDate);
    if (mode === 'delivery' && !ev.address.trim()) return setErr(t.checkoutNeedAddress);
    setErr('');
    setPaying(true);
    const payload = {
      payMode, deliveryMode: mode, couponCode: applied?.code || null, customerName: user.name, customerPhone: user.phone,
      eventType: ev.type, eventName: ev.name, dateTxt: ev.date, address: ev.address, guests: parseInt(ev.guests, 10) || 0,
      groups: vendors.map((v) => {
        const ls = cart.lines.filter((l) => l.vendorId === v);
        return { vendorId: v, vendorName: ls[0].vendorName, subtotal: ls.reduce((n, l) => n + l.unitPrice * l.qty, 0), deliveryFee: 0,
          lines: ls.map((l) => ({ itemId: l.productId, name: l.name, qty: l.qty, unitPrice: l.unitPrice })) };
      }),
    };
    try {
      const order = await api.post<{ orderId: string; amount: number; currency: string; keyId: string }>('/api/payments/create-order', { cart: payload });
      let res;
      try {
        res = await payWithRazorpay({ key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency, name: 'Tamboo',
          description: t.webRentalOrderDesc.replace('{n}', String(vendors.length)), prefill: { name: user.name, contact: user.phone } });
      } catch (e) {
        if (!(e as { cancelled?: boolean }).cancelled) showToast(`${t.payNotCompletedTitle}: ${(e as Error).message}`);
        return;
      }
      const v = await api.post<{ verified: boolean; orders?: Array<{ id: string; code: string; vendor: string; conflict?: boolean }> }>('/api/payments/verify', { ...res, cart: payload });
      if (!v.verified) return showToast(t.payVerifyFailedMsg);
      const conflicts = (v.orders || []).filter((o) => o.conflict).map((o) => o.vendor);
      cart.clear();
      navigate('/bookings', { state: { notice: conflicts.length ? t.payStockConflictMsg.replace('{vendors}', conflicts.join(', ')) : t.confirmPageSub } });
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : t.tryAgain);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="detail">
      <div className="stack">
        <h1 className="title">{t.cart}</h1>
        {vendors.length > 1 && <div className="note">{t.cartMultiVendorNote.replaceAll('{count}', String(vendors.length))}</div>}
        {vendors.map((v) => {
          const ls = cart.lines.filter((l) => l.vendorId === v);
          return (
            <div key={v} className="card stack" style={{ gap: 10 }}>
              <Link to={`/rentals/${v}`} className="section-title" style={{ fontSize: 16 }}>{ls[0].vendorName}</Link>
              {ls.map((l) => (
                <div key={l.productId} className="between" style={{ flexWrap: 'wrap', borderBottom: '1px solid var(--divider)', paddingBottom: 8 }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <b>{l.name}</b>
                    <div className="small">{inr(l.unitPrice)} {unitText(l.unit, t)}</div>
                    {l.qty > l.free && <div className="err" style={{ fontSize: 12.5 }}>{t.webOnlyLeft.replace('{n}', String(l.free))}</div>}
                  </div>
                  <div className="row" style={{ gap: 4 }}>
                    <button className="btn btn-soft btn-sm" onClick={() => cart.setQty(l.productId, l.qty - 1)}>−</button>
                    <span style={{ minWidth: 34, textAlign: 'center', fontWeight: 700 }}>{l.qty}</span>
                    <button className="btn btn-soft btn-sm" onClick={() => cart.setQty(l.productId, l.qty + 1)}>+</button>
                    <b style={{ minWidth: 80, textAlign: 'end' }}>{inr(l.unitPrice * l.qty)}</b>
                    <button className="small" onClick={() => cart.setQty(l.productId, 0)} aria-label={t.webRemove}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        <div className="card stack" style={{ gap: 12 }}>
          <h2 className="section-title" style={{ fontSize: 17 }}>{t.eventHeaderTitle}</h2>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: '1 1 160px' }}>
              <label htmlFor="cd">{t.date}</label>
              <input id="cd" type="date" className="input" min={new Date().toISOString().slice(0, 10)} value={toYMD(ev.date)} onChange={(e) => cart.setEvent({ date: toDMY(e.target.value) })} />
            </div>
            <div className="field" style={{ flex: '1 1 120px' }}>
              <label htmlFor="cg">{t.guests}</label>
              <input id="cg" className="input" inputMode="numeric" value={ev.guests} onChange={(e) => cart.setEvent({ guests: e.target.value.replace(/\D/g, '').slice(0, 5) })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="cn">{t.eventFieldNameLabel}</label>
            <input id="cn" className="input" value={ev.name} placeholder={t.eventNamePlaceholder} onChange={(e) => cart.setEvent({ name: e.target.value })} />
          </div>
          <div className="field">
            <label>{t.eventFieldTypeLabel}</label>
            <div className="wrap-row">{EVENT_TYPES.map((x) => <button key={x} className={`pick ${ev.type === x ? 'sel' : ''}`} onClick={() => cart.setEvent({ type: x })}>{evLabel(x)}</button>)}</div>
          </div>
          <div className="field">
            <label>{t.checkoutService}</label>
            <div className="wrap-row">
              <button className={`pick ${mode === 'delivery' ? 'sel' : ''}`} onClick={() => setMode('delivery')}>{t.checkoutDeliveryPickup}</button>
              <button className={`pick ${mode === 'pickup' ? 'sel' : ''}`} onClick={() => setMode('pickup')}>{t.checkoutSelfPickup}</button>
            </div>
          </div>
          {mode === 'delivery' && (
            <div className="field">
              <label htmlFor="ca">{t.webDeliveryAddress}</label>
              <textarea id="ca" className="input" style={{ height: 76, paddingTop: 10 }} value={ev.address} onChange={(e) => cart.setEvent({ address: e.target.value })} />
            </div>
          )}
        </div>
      </div>

      <aside className="card stack sticky book-card">
        <div className="row">
          <input className="input" placeholder={t.cartCouponPlaceholder} value={coupon} onChange={(e) => setCoupon(e.target.value)} style={{ textTransform: 'uppercase' }} />
          <button className="btn btn-soft" onClick={applyCoupon}>{t.cartApply}</button>
        </div>
        {applied && <span className="small ok">{t.cartCouponAppliedSuffix.replace('{code}', applied.code).replace('{pct}', String(applied.pct))}</span>}
        {!!couponErr && <span className="err">{couponErr}</span>}
        <div className="kv"><span>{t.checkoutSubtotal}</span><b>{inr(totals.subtotal)}</b></div>
        {totals.discount > 0 && <div className="kv"><span>{t.checkoutCouponDiscount}</span><b className="ok">−{inr(totals.discount)}</b></div>}
        <div className="kv"><span>{mode === 'delivery' ? t.checkoutDeliveryPickup : t.checkoutSelfPickup}</span><b>{inr(totals.delivery)}</b></div>
        <div className="kv"><span>{t.checkoutPlatformFee}</span><b>{inr(totals.platformFee)}</b></div>
        <div className="kv"><span>{t.checkoutTaxes}</span><b>{inr(totals.tax)}</b></div>
        <div className="divider" />
        <div className="kv"><span><b>{t.checkoutTotalPayable}</b></span><b className="price">{inr(totals.total)}</b></div>
        <div className="wrap-row">
          <button className={`pick ${payMode === 'full' ? 'sel' : ''}`} onClick={() => setPayMode('full')}>{t.payInFull}</button>
          <button className={`pick ${payMode === 'advance' ? 'sel' : ''}`} onClick={() => setPayMode('advance')}>{t.payAdvance30}</button>
        </div>
        <span className="small">{t.checkoutPolicyText}</span>
        <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />{t.checkoutAgreeText}</label>
        {!!err && <span className="err">{err}</span>}
        <button className="btn btn-primary btn-block" disabled={!agree || paying || cart.lines.some((l) => l.qty > l.free)} onClick={pay}>{paying ? '…' : t.webPayAmount.replace('{amount}', inr(due))}</button>
        <span className="small">{t.payMethodsNote}</span>
      </aside>
      {toast}
    </div>
  );
}
