import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useLang } from '../lib/lang';
import { LoadError, Spinner, inr } from '../components/ui';
import { orderStatusText, prettyDate, refundText } from '../../../customer-app/src/utils/status';
import type { RemoteOrderSummary } from '../../../customer-app/src/navigation/types';

export default function OrderDetail() {
  const { id = '' } = useParams();
  const { t } = useLang();
  const { user, openLogin } = useAuth();
  const [o, setO] = useState<RemoteOrderSummary | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    setError(false);
    api.get<RemoteOrderSummary[]>('/api/orders/me').then((list) => { const f = list.find((x) => x.id === id); if (f) setO(f); else setError(true); }).catch(() => setError(true));
  }, [id, user]);
  useEffect(load, [load]);

  if (!user) return <div className="card stack" style={{ alignItems: 'center' }}><span className="muted">{t.webLoginForBookings}</span><button className="btn btn-primary" onClick={openLogin}>{t.webLogin}</button></div>;
  if (error) return <LoadError onRetry={load} />;
  if (!o) return <Spinner />;

  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <Link to="/bookings" className="small">← {t.webNavBookings}</Link>
      <div className="between">
        <div><h1 className="title" style={{ fontSize: 22 }}>{o.vendorName}</h1><span className="small">{o.code}</span></div>
        <span className="pill chip-ok">{orderStatusText(o.status, t)}</span>
      </div>
      {!!refundText(o, t) && <div className="note">{refundText(o, t)}</div>}
      <div className="card stack" style={{ gap: 4 }}>
        <div className="kv"><span>{t.date}</span><b>{prettyDate(o.dateTxt)}</b></div>
        {!!o.eventName && <div className="kv"><span>{t.eventFieldNameLabel}</span><b>{o.eventName}</b></div>}
        {!!o.address && <div className="kv"><span>{t.webDeliveryAddress}</span><b>{o.address}</b></div>}
        {o.guests > 0 && <div className="kv"><span>{t.guests}</span><b>{o.guests}</b></div>}
      </div>
      <div className="card stack" style={{ gap: 4 }}>
        {o.lines.map((l, i) => <div key={i} className="kv"><span>{l.name} × {l.qty}</span><b>{inr(l.unitPrice * l.qty)}</b></div>)}
        <div className="divider" />
        <div className="kv"><span><b>{t.webPaid}</b></span><b>{inr(o.amountPaid ?? o.value)}</b></div>
      </div>
      {o.history.length > 0 && (
        <div className="card stack" style={{ gap: 4 }}>
          {o.history.map((h, i) => <div key={i} className="kv"><span>{h.label}</span><span className="small">{h.date}</span></div>)}
        </div>
      )}
      <span className="small">{t.checkoutPolicyText}</span>
    </div>
  );
}
