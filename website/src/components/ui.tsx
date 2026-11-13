import { useEffect, useState, type ReactElement } from 'react';
import { useLang } from '../lib/lang';
import { FarmArt, HallArt, RentalArt, ServiceArt } from './Illustrations';
import { CateringArt, DecorArt, MusicArt, PriestArt } from './Scenes';

export const SERVICE_ART: Record<string, (p: { size?: number }) => ReactElement> = { priest: PriestArt, catering: CateringArt, decor: DecorArt, music: MusicArt };

export function Spinner() { return <div className="spinner" role="status" aria-label="Loading" />; }

// Listing photo, or (until the owner uploads one) Tamboo's own drawing for that kind of listing.
export function Photo({ src, alt, icon = '🏛️' }: { src?: string; alt: string; icon?: string }) {
  if (src) return <img className="tile-photo" src={src} alt={alt} loading="lazy" />;
  const Art = icon === '🌴' ? FarmArt : icon === '⛺' || icon === '📦' ? RentalArt : icon === '🏛️' ? HallArt
    : icon === '🪔' ? PriestArt : icon === '🍛' ? CateringArt : icon === '💐' ? DecorArt : icon === '🎺' ? MusicArt : ServiceArt;
  return <div className="tile-photo" aria-hidden><Art size={110} /></div>;
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useLang();
  return (
    <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}>
      <span className="muted">{t.loadFailedMsg}</span>
      <button className="btn btn-soft" onClick={onRetry}>{t.retry}</button>
    </div>
  );
}

// Small self-dismissing message at the bottom of the screen.
export function useToast(): [ReactElement | null, (m: string) => void] {
  const [msg, setMsg] = useState('');
  useEffect(() => { if (!msg) return; const id = setTimeout(() => setMsg(''), 4000); return () => clearTimeout(id); }, [msg]);
  return [msg ? <div className="toast" role="status">{msg}</div> : null, setMsg];
}

export const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
