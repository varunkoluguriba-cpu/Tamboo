import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { usePageMeta } from '../lib/seo';
import { useLang } from '../lib/lang';
import { useServicesConfig } from '../lib/services';
import { Photo, inr } from '../components/ui';
import SearchBox from '../components/SearchBox';
import { FarmArt, HallArt, HeroScene, PhoneArt, RentalArt, ServiceArt, StepCalendar, StepPay, StepSearch } from '../components/Illustrations';
import { hallTypeText } from '../../../customer-app/src/utils/units';
import type { Farm } from '../../../customer-app/src/utils/farm';
import type { PublicHall } from './Halls';

type SiteContent = { customerAppUrl?: string; partnerAppUrl?: string };

export default function Home() {
  const { t } = useLang();
  const services = useServicesConfig();
  const [halls, setHalls] = useState<PublicHall[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [site, setSite] = useState<SiteContent>({});

  usePageMeta(undefined, t.webHeroSub);
  useEffect(() => {
    api.get<PublicHall[]>('/api/halls').then(setHalls).catch(() => {});
    api.get<Farm[]>('/api/farms').then(setFarms).catch(() => {});
    api.get<SiteContent>('/api/site-content').then(setSite).catch(() => {});
  }, []);

  const cats = [
    { to: '/halls', Art: HallArt, name: t.webNavHalls, sub: t.webCatHallsSub },
    { to: '/farm-houses', Art: FarmArt, name: t.webNavFarms, sub: t.cfTileSub },
    { to: '/rentals', Art: RentalArt, name: t.webNavRentals, sub: t.webCatRentalsSub },
    ...(services?.enabled ? [{ to: '/services', Art: ServiceArt, name: t.webNavServices, sub: t.webCatServicesSub }] : []),
  ];

  return (
    <div className="stack" style={{ gap: 30 }}>
      <section className="hero hero-home">
        <div className="hero-copy">
          <h1>{t.webHeroTitle}</h1>
          <p>{t.webHeroSub}</p>
        </div>
        <HeroScene className="hero-art" />
        <div className="hero-search"><SearchBox servicesOn={!!services?.enabled} /></div>
      </section>

      <section className="cat-grid">
        {cats.map((c) => (
          <Link key={c.to} to={c.to} className="cat">
            <c.Art size={56} />
            <b>{c.name}</b>
            <span className="small">{c.sub}</span>
          </Link>
        ))}
      </section>

      <section className="stack">
        <h2 className="section-title">{t.webHowTitle}</h2>
        <div className="steps">
          {[t.webHow1, t.webHow2, t.webHow3].map((s, i) => (
            <div key={i} className="card step">
              {[<StepSearch key="a" />, <StepCalendar key="b" />, <StepPay key="c" />][i]}
              <div className="row" style={{ alignItems: 'flex-start' }}><span className="step-n">{i + 1}</span><span>{s}</span></div>
            </div>
          ))}
        </div>
      </section>

      {halls.length > 0 && (
        <section className="stack">
          <div className="between"><h2 className="section-title">{t.webNavHalls}</h2><Link to="/halls" className="btn btn-soft btn-sm">{t.webSeeAll}</Link></div>
          <div className="grid">
            {halls.slice(0, 4).map((h) => (
              <Link key={h.id} to={`/halls/${h.id}`} className="tile">
                <Photo src={h.photos?.[0]} alt={h.name} />
                <div className="tile-body">
                  <span className="tile-name">{h.name}</span>
                  <span className="small">{[hallTypeText(h.type || '', t), h.area].filter(Boolean).join(' · ')}</span>
                  <span className="price">{h.pricingMode === 'perPlate' ? `${inr(h.platePrice)}${t.venuesPerPlateLabel}` : `${t.venuesRentLabel} ${inr(h.rent)}`}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {farms.length > 0 && (
        <section className="stack">
          <div className="between"><h2 className="section-title">{t.webNavFarms}</h2><Link to="/farm-houses" className="btn btn-soft btn-sm">{t.webSeeAll}</Link></div>
          <div className="grid">
            {farms.slice(0, 4).map((f) => (
              <Link key={f.id} to={`/farm-houses/${f.id}`} className="tile">
                <Photo src={f.photos?.[0]} alt={f.name} icon="🌴" />
                <div className="tile-body">
                  <span className="tile-name">{f.name}</span>
                  <span className="small">{[f.area, t.cfUpTo.replace('{n}', String(f.maxGuests))].filter(Boolean).join(' · ')}</span>
                  {f.fromPrice != null && <span className="price">{t.cfFrom.replace('{price}', inr(f.fromPrice))}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="band band-pink">
        <PhoneArt size={110} />
        <div className="stack" style={{ gap: 6, maxWidth: 560, flex: '1 1 260px' }}>
          <h2 className="section-title">{t.webAppTitle}</h2>
          <span className="muted">{t.webAppBody}</span>
        </div>
        {site.customerAppUrl
          ? <a className="btn btn-primary" href={site.customerAppUrl} target="_blank" rel="noreferrer">{t.webAppGet}</a>
          : <span className="chip chip-warn" style={{ fontSize: 13.5, padding: '8px 14px' }}>{t.webAppSoon}</span>}
      </section>

      <section className="band band-dark">
        <div className="stack" style={{ gap: 6, maxWidth: 620 }}>
          <h2 className="section-title">{t.webBizTitle}</h2>
          <span style={{ opacity: 0.85 }}>{t.webBizBody}</span>
        </div>
        {site.partnerAppUrl
          ? <a className="btn btn-light" href={site.partnerAppUrl} target="_blank" rel="noreferrer">{t.webBizGetApp}</a>
          : <span className="chip" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13.5, padding: '8px 14px' }}>{t.webBizAppSoon}</span>}
      </section>
    </div>
  );
}
