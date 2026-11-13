import { useEffect, useState, type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useLang } from '../lib/lang';
import { usePageMeta } from '../lib/seo';
import { useServicesConfig } from '../lib/services';
import PageBanner from '../components/PageBanner';
import { Photo, SERVICE_ART, inr } from '../components/ui';
import { BirthdayArt, CorporateArt, PartyArt, PoojaArt, WeddingArt } from '../components/Scenes';
import { hallTypeText, itemCategoryText } from '../../../customer-app/src/utils/units';
import { serviceCategoryInfo } from '../lib/serviceText';
import type { Farm } from '../../../customer-app/src/utils/farm';
import type { PublicHall } from './Halls';

type Section = 'halls' | 'farms' | 'services' | 'rentals';
// What each occasion usually needs, most common first. Every occasion can still use any venue.
export const OCCASIONS: Record<string, { order: Section[]; services: string[]; rentals: string[] }> = {
  wedding: { order: ['halls', 'farms', 'services', 'rentals'], services: ['priest', 'catering', 'decor', 'music'], rentals: ['tent', 'seat', 'light', 'decor'] },
  birthday: { order: ['halls', 'farms', 'services', 'rentals'], services: ['decor', 'catering', 'music'], rentals: ['decor', 'light', 'av'] },
  'house-party': { order: ['farms', 'halls', 'services', 'rentals'], services: ['catering', 'music'], rentals: ['av', 'light', 'seat'] },
  pooja: { order: ['services', 'halls', 'rentals', 'farms'], services: ['priest', 'catering', 'decor'], rentals: ['tent', 'seat', 'crockery'] },
  corporate: { order: ['halls', 'farms', 'services', 'rentals'], services: ['catering', 'decor'], rentals: ['stage', 'av', 'seat'] },
};

export default function Occasion() {
  const { key = '' } = useParams();
  const { t } = useLang();
  const services = useServicesConfig();
  const [halls, setHalls] = useState<PublicHall[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const occ = OCCASIONS[key];
  const meta: Record<string, { title: string; sub: string; Art: () => ReactElement }> = {
    wedding: { title: t.homeScreenOccasionWedding, sub: t.webOccWeddingSub, Art: () => <WeddingArt size={150} /> },
    birthday: { title: t.homeScreenOccasionBirthday, sub: t.webOccBirthdaySub, Art: () => <BirthdayArt size={150} /> },
    'house-party': { title: t.homeScreenOccasionHouseParty, sub: t.webOccPartySub, Art: () => <PartyArt size={150} /> },
    pooja: { title: t.webOccPooja, sub: t.webOccPoojaSub, Art: () => <PoojaArt size={150} /> },
    corporate: { title: t.homeScreenOccasionCorporate, sub: t.webOccCorporateSub, Art: () => <CorporateArt size={150} /> },
  };
  const m = meta[key];
  usePageMeta(m?.title, m?.sub);
  useEffect(() => {
    api.get<PublicHall[]>('/api/halls').then(setHalls).catch(() => {});
    api.get<Farm[]>('/api/farms').then(setFarms).catch(() => {});
  }, []);

  if (!occ || !m) return <div className="card muted">{t.webNotFound} <Link to="/" className="ok">{t.webBackHome}</Link></div>;

  const blocks: Record<Section, ReactElement | null> = {
    halls: (
      <section key="halls" className="stack">
        <div className="between"><h2 className="section-title">{t.webNavHalls}</h2><Link to="/halls" className="btn btn-soft btn-sm">{t.webSeeAll}</Link></div>
        {halls.length === 0 ? <div className="card muted">{t.venuesNoHallsMatch}</div> : (
          <div className="grid">{halls.slice(0, 4).map((h) => (
            <Link key={h.id} to={`/halls/${h.id}`} className="tile">
              <Photo src={h.photos?.[0]} alt={h.name} />
              <div className="tile-body">
                <span className="tile-name">{h.name}</span>
                <span className="small">{[hallTypeText(h.type || '', t), h.area].filter(Boolean).join(' · ')}</span>
                <span className="price">{h.pricingMode === 'perPlate' ? `${inr(h.platePrice)}${t.venuesPerPlateLabel}` : `${t.venuesRentLabel} ${inr(h.rent)}`}</span>
              </div>
            </Link>
          ))}</div>
        )}
      </section>
    ),
    farms: (
      <section key="farms" className="stack">
        <div className="between"><h2 className="section-title">{t.webNavFarms}</h2><Link to="/farm-houses" className="btn btn-soft btn-sm">{t.webSeeAll}</Link></div>
        {farms.length === 0 ? <div className="card muted">{t.cfNone}</div> : (
          <div className="grid">{farms.slice(0, 4).map((f) => (
            <Link key={f.id} to={`/farm-houses/${f.id}`} className="tile">
              <Photo src={f.photos?.[0]} alt={f.name} icon="🌴" />
              <div className="tile-body">
                <span className="tile-name">{f.name}</span>
                <span className="small">{[f.area, t.cfUpTo.replace('{n}', String(f.maxGuests))].filter(Boolean).join(' · ')}</span>
                {f.fromPrice != null && <span className="price">{t.cfFrom.replace('{price}', inr(f.fromPrice))}</span>}
              </div>
            </Link>
          ))}</div>
        )}
      </section>
    ),
    services: services?.enabled ? (
      <section key="services" className="stack">
        <h2 className="section-title">{t.webNavServices}</h2>
        <div className="svc-cats">
          {occ.services.map((c) => { const Art = SERVICE_ART[c]; return <Link key={c} to={`/services?c=${c}`} className="svc-cat"><Art size={72} />{serviceCategoryInfo(c, t).label}</Link>; })}
        </div>
      </section>
    ) : null,
    rentals: (
      <section key="rentals" className="stack">
        <div className="between"><h2 className="section-title">{t.webNavRentals}</h2><Link to="/rentals" className="btn btn-soft btn-sm">{t.webSeeAll}</Link></div>
        <div className="wrap-row">{occ.rentals.map((c) => <Link key={c} to={`/rentals?cat=${c}`} className="pick">{itemCategoryText(c, t)}</Link>)}</div>
      </section>
    ),
  };

  return (
    <div className="stack" style={{ gap: 26 }}>
      <PageBanner title={m.title} sub={m.sub} art={<div className="occ-banner-art"><m.Art /></div>} />
      {occ.order.map((s) => blocks[s])}
    </div>
  );
}
