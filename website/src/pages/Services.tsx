import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import PageBanner from '../components/PageBanner';
import { SERVICE_ART } from '../components/ui';
import { ServicesBanner } from '../components/Scenes';
import { useLang } from '../lib/lang';
import { usePageMeta } from '../lib/seo';
import { useServicesConfig } from '../lib/services';
import { SERVICE_CATEGORIES, fromPriceText, serviceCategoryInfo, type PublicServiceVendor } from '../lib/serviceText';
import { LoadError, Photo, Spinner } from '../components/ui';

export default function Services() {
  const { t } = useLang();
  const cfg = useServicesConfig();
  const [params, setParams] = useSearchParams();
  const cat = params.get('c') || 'priest';
  const [list, setList] = useState<PublicServiceVendor[] | null>(null);
  const [error, setError] = useState(false);

  usePageMeta(t.webNavServices, t.svHeroBody);
  useEffect(() => {
    if (!cfg?.enabled) return;
    setList(null); setError(false);
    api.get<PublicServiceVendor[]>(`/api/services?category=${cat}`).then(setList).catch(() => setError(true));
  }, [cat, cfg?.enabled]);

  if (cfg === null) return <Spinner />;
  if (!cfg.enabled) return <div className="card muted">{t.webServicesSoon}</div>;

  return (
    <div className="stack">
      <PageBanner title={t.svHeroTitle} sub={t.svHeroBody} art={<ServicesBanner />} />
      <span className="small">{cfg.freeLeft && cfg.freeLeft > 0 ? (cfg.freeLeft === 1 ? t.svFreeLeftOne : t.svFreeLeft.replace('{n}', String(cfg.freeLeft))) : t.svFreeNone.replace('{hours}', String(cfg.noResponseHours || 24))}</span>
      <div className="svc-cats">
        {SERVICE_CATEGORIES.map((c) => {
          const Art = SERVICE_ART[c];
          return <button key={c} className={`svc-cat ${cat === c ? 'sel' : ''}`} onClick={() => setParams({ c }, { replace: true })}><Art size={72} />{serviceCategoryInfo(c, t).label}</button>;
        })}
      </div>
      <span className="muted">{serviceCategoryInfo(cat, t).ex}</span>
      {error ? <LoadError onRetry={() => setParams({ c: cat })} /> : list === null ? <Spinner /> : list.length === 0 ? <div className="card muted">{t.svListEmpty}</div> : (
        <div className="grid">
          {list.map((v) => (
            <Link key={v.id} to={`/services/${v.id}`} className="tile">
              <Photo src={v.photos?.[0]} alt={v.name} icon={serviceCategoryInfo(v.category, t).icon} />
              <div className="tile-body">
                <span className="tile-name">{v.name}</span>
                <span className="small">{[v.area, v.experienceYears ? t.svExperience.replace('{n}', String(v.experienceYears)) : ''].filter(Boolean).join(' · ')}</span>
                {v.fromPrice != null && <span className="price">{fromPriceText(v, t)}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
