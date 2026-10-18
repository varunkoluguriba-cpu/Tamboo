import { useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type Step = { title: string; body: string };
type City = { name: string; live: boolean };

type Content = {
  heroEyebrow: string;
  heroTitle: string;
  heroBody: string;
  steps: Step[];
  businessPitchTitle: string;
  businessPitchBody: string;
  businessChecklist: string[];
  cities: City[];
  customerAppUrl: string;
  partnerAppUrl: string;
};

const EMPTY: Content = {
  heroEyebrow: '', heroTitle: '', heroBody: '',
  steps: [{ title: '', body: '' }, { title: '', body: '' }, { title: '', body: '' }],
  businessPitchTitle: '', businessPitchBody: '', businessChecklist: [],
  cities: [], customerAppUrl: '', partnerAppUrl: '',
};

export default function SiteContent() {
  const { logout } = useAuth();
  const [content, setContent] = useState<Content>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get<Content>('/api/site-content')
      .then((res) => { if (!cancelled) setContent(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load site content.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [logout]);

  const set = <K extends keyof Content>(key: K, value: Content[K]) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const setStep = (idx: number, field: keyof Step, value: string) => {
    set('steps', content.steps.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const setChecklistItem = (idx: number, value: string) => {
    set('businessChecklist', content.businessChecklist.map((c, i) => (i === idx ? value : c)));
  };
  const addChecklistItem = () => set('businessChecklist', [...content.businessChecklist, '']);
  const removeChecklistItem = (idx: number) => set('businessChecklist', content.businessChecklist.filter((_, i) => i !== idx));

  const setCity = (idx: number, field: keyof City, value: string | boolean) => {
    set('cities', content.cities.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };
  const addCity = () => set('cities', [...content.cities, { name: '', live: false }]);
  const removeCity = (idx: number) => set('cities', content.cities.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.put<Content>('/api/site-content', content);
      setContent(res);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state">Loading…</div>;

  return (
    <div>
      <h1 className="page-title">Marketing site</h1>
      <p style={{ color: 'var(--text-soft)', fontSize: 13.5, marginTop: -8, marginBottom: 20 }}>
        Edit the copy shown on the public marketing site — changes go live as soon as you save, no redeploy needed.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Hero</h3>
        <label className="field-label">Eyebrow</label>
        <input className="text-input" value={content.heroEyebrow} onChange={(e) => set('heroEyebrow', e.target.value)} />
        <label className="field-label" style={{ marginTop: 12 }}>Title</label>
        <input className="text-input" value={content.heroTitle} onChange={(e) => set('heroTitle', e.target.value)} />
        <label className="field-label" style={{ marginTop: 12 }}>Body</label>
        <textarea className="text-input" style={{ height: 80, padding: '10px 14px' }} value={content.heroBody} onChange={(e) => set('heroBody', e.target.value)} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>How it works — 3 steps</h3>
        {content.steps.map((step, i) => (
          <div key={i} style={{ marginBottom: i < content.steps.length - 1 ? 16 : 0, paddingBottom: i < content.steps.length - 1 ? 16 : 0, borderBottom: i < content.steps.length - 1 ? '1px solid var(--divider)' : 'none' }}>
            <label className="field-label">Step {i + 1} title</label>
            <input className="text-input" value={step.title} onChange={(e) => setStep(i, 'title', e.target.value)} />
            <label className="field-label" style={{ marginTop: 8 }}>Step {i + 1} body</label>
            <textarea className="text-input" style={{ height: 60, padding: '10px 14px' }} value={step.body} onChange={(e) => setStep(i, 'body', e.target.value)} />
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>For businesses</h3>
        <label className="field-label">Title</label>
        <input className="text-input" value={content.businessPitchTitle} onChange={(e) => set('businessPitchTitle', e.target.value)} />
        <label className="field-label" style={{ marginTop: 12 }}>Body</label>
        <textarea className="text-input" style={{ height: 70, padding: '10px 14px' }} value={content.businessPitchBody} onChange={(e) => set('businessPitchBody', e.target.value)} />
        <label className="field-label" style={{ marginTop: 12 }}>Checklist</label>
        {content.businessChecklist.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="text-input" value={item} onChange={(e) => setChecklistItem(i, e.target.value)} />
            <button className="btn-secondary" onClick={() => removeChecklistItem(i)}>Remove</button>
          </div>
        ))}
        <button className="btn-secondary" onClick={addChecklistItem}>+ Add checklist item</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Cities</h3>
        {content.cities.map((city, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input className="text-input" style={{ flex: 1 }} value={city.name} onChange={(e) => setCity(i, 'name', e.target.value)} placeholder="City name" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: 'var(--text-soft)', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={city.live} onChange={(e) => setCity(i, 'live', e.target.checked)} />
              Live
            </label>
            <button className="btn-secondary" onClick={() => removeCity(i)}>Remove</button>
          </div>
        ))}
        <button className="btn-secondary" onClick={addCity}>+ Add city</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>App download links</h3>
        <label className="field-label">Customer app URL (leave blank to show "coming soon")</label>
        <input className="text-input" value={content.customerAppUrl} onChange={(e) => set('customerAppUrl', e.target.value)} placeholder="https://play.google.com/store/apps/details?id=..." />
        <label className="field-label" style={{ marginTop: 12 }}>Partner app URL (leave blank to show "coming soon")</label>
        <input className="text-input" value={content.partnerAppUrl} onChange={(e) => set('partnerAppUrl', e.target.value)} placeholder="https://play.google.com/store/apps/details?id=..." />
      </div>

      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
      <button className="btn-primary" style={{ width: 'auto', padding: '0 28px' }} onClick={save} disabled={saving}>
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
      </button>
    </div>
  );
}
