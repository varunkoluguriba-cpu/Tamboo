import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../lib/lang';
import { useCart, toDMY } from '../lib/cart';
import { getSearch, setSearch } from '../lib/search';

type Kind = 'halls' | 'farms' | 'rentals' | 'services';

// Home-page search: pick what you need, fill date / guests / area, and land on that list with
// the same details carried over.
export default function SearchBox({ servicesOn }: { servicesOn: boolean }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const { setEvent } = useCart();
  const saved = getSearch();
  const [kind, setKind] = useState<Kind>('halls');
  const [date, setDate] = useState(saved.date);
  const [guests, setGuests] = useState(saved.guests);
  const [q, setQ] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const kinds: Array<{ k: Kind; label: string }> = [
    { k: 'halls', label: t.webNavHalls }, { k: 'farms', label: t.webNavFarms }, { k: 'rentals', label: t.webNavRentals },
    ...(servicesOn ? [{ k: 'services' as Kind, label: t.webNavServices }] : []),
  ];
  const go = () => {
    setSearch({ date, guests });
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (guests && kind !== 'rentals' && kind !== 'services') p.set('guests', guests);
    if (kind === 'rentals') {
      if (date) setEvent({ date: toDMY(date) });
      if (guests) setEvent({ guests });
    }
    const path = { halls: '/halls', farms: '/farm-houses', rentals: '/rentals', services: '/services' }[kind];
    navigate(`${path}${p.toString() ? `?${p}` : ''}`);
  };

  return (
    <div className="searchbox">
      <div className="search-kinds" role="tablist">
        {kinds.map((x) => <button key={x.k} role="tab" aria-selected={kind === x.k} className={kind === x.k ? 'sel' : ''} onClick={() => setKind(x.k)}>{x.label}</button>)}
      </div>
      <div className="search-fields">
        {kind !== 'services' && (
          <div className="field">
            <label htmlFor="sb-date">{t.date}</label>
            <input id="sb-date" type="date" className="input" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}
        {kind !== 'services' && kind !== 'rentals' && (
          <div className="field">
            <label htmlFor="sb-g">{t.guests}</label>
            <input id="sb-g" className="input" inputMode="numeric" placeholder="100" value={guests} onChange={(e) => setGuests(e.target.value.replace(/\D/g, '').slice(0, 5))} />
          </div>
        )}
        {kind !== 'services' && (
          <div className="field grow">
            <label htmlFor="sb-q">{t.webSearchLabel}</label>
            <input id="sb-q" className="input" placeholder={kind === 'rentals' ? t.browseSearchPlaceholder : t.webSearchAreaPh} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} />
          </div>
        )}
        <button className="btn btn-primary search-go" onClick={go}>{t.webSearchBtn}</button>
      </div>
    </div>
  );
}
