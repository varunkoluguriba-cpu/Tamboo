import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { usePageMeta } from '../lib/seo';
import { LANGS, useLang } from '../lib/lang';
import { Spinner, useToast } from '../components/ui';

export default function Account() {
  const { t, lang, setLang } = useLang();
  const { user, loading, logout, openLogin, refresh } = useAuth();
  const navigate = useNavigate();
  const [areas, setAreas] = useState<string[]>([]);
  const [area, setArea] = useState('');
  const [toast, showToast] = useToast();

  usePageMeta(t.webAccount);
  useEffect(() => { api.get<string[]>('/api/auth/localities').then(setAreas).catch(() => {}); }, []);
  useEffect(() => { setArea(user?.area || ''); }, [user]);

  if (loading) return <Spinner />;
  if (!user) return <div className="card stack" style={{ alignItems: 'center' }}><span className="muted">{t.webLoginSub}</span><button className="btn btn-primary" onClick={openLogin}>{t.webLogin}</button></div>;

  const saveArea = async (a: string) => {
    setArea(a);
    try { await api.put('/api/auth/me/area', { area: a }); await refresh(); showToast(t.webSaved); } catch (e) { showToast(e instanceof ApiError ? e.message : t.tryAgain); }
  };
  const del = async () => {
    if (!window.confirm(`${t.deleteAccountTitle}\n\n${t.deleteAccountBody}`)) return;
    try { await api.del('/api/auth/me'); logout(); navigate('/'); } catch (e) { showToast(e instanceof ApiError ? e.message : t.tryAgain); }
  };

  return (
    <div className="stack" style={{ maxWidth: 560 }}>
      <h1 className="title">{user.name}</h1>
      <span className="muted ltr" style={{ alignSelf: 'flex-start' }}>{user.phone.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2')}</span>
      <div className="card stack">
        <div className="field">
          <label htmlFor="ar">{t.webYourArea}</label>
          <select id="ar" className="input" value={area} onChange={(e) => saveArea(e.target.value)}>
            <option value="">—</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ln">{t.webLanguage}</label>
          <select id="ln" className="input" value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGS.map(([code, native, en]) => <option key={code} value={code}>{native} · {en}</option>)}
          </select>
        </div>
      </div>
      <button className="btn btn-outline" onClick={() => navigate('/bookings')}>{t.webNavBookings}</button>
      <button className="btn btn-outline" onClick={() => { logout(); navigate('/'); }}>{t.webLogout}</button>
      <button className="btn btn-danger" onClick={del}>{t.deleteAccount}</button>
      {toast}
    </div>
  );
}
