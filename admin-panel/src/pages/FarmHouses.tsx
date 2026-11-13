import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type Slot = { enabled: boolean; start: string; end: string; weekdayPrice: number; weekendPrice: number };
type Farm = {
  id: string; name: string; area: string; published: boolean; maxGuests: number; bedrooms: number;
  amenities: string[]; slots: { day: Slot; night: Slot; fullDay: Slot }; photoCount: number;
  securityDeposit: number; advancePct: number; createdAt: string;
  partner: { id: string; businessName: string; phone: string; verificationStatus: string } | null;
};
type FBooking = {
  id: string; code: string; farmName: string; customerName: string; customerPhone: string; date: string;
  slot: 'day' | 'night' | 'fullDay'; guests: number; total: number; advanceAmount: number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'disputed'; cancelledBy: string; refundStatus: string; refundAmount: number;
};

const SLOT: Record<string, string> = { day: 'Day', night: 'Night', fullDay: 'Full day (24h)' };
const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
const statusBadge = (s: FBooking['status']) => (s === 'confirmed' || s === 'completed' ? 'verified' : s === 'disputed' ? 'rejected' : 'pending');

// Farm houses listed by 'farm' partners, and their online bookings (advance paid on Tamboo).
export default function FarmHouses() {
  const { logout, can } = useAuth();
  const [tab, setTab] = useState<'farms' | 'bookings'>('farms');
  const [farms, setFarms] = useState<Farm[] | null>(null);
  const [bookings, setBookings] = useState<FBooking[] | null>(null);
  const [error, setError] = useState('');
  const canBookings = can('bookings');

  useEffect(() => {
    const fail = (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) return logout();
      setError(err instanceof ApiError ? err.message : 'Could not load farm houses.');
    };
    api.get<Farm[]>('/api/admin/farms').then(setFarms).catch(fail);
    if (canBookings) api.get<FBooking[]>('/api/admin/farm-bookings').then(setBookings).catch(fail);
  }, [logout, canBookings]);

  if (error) return <div className="empty-state">{error}</div>;

  return (
    <div>
      <h1 className="page-title">Farm houses</h1>
      {canBookings && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button className={tab === 'farms' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('farms')}>Listings{farms ? ` (${farms.length})` : ''}</button>
          <button className={tab === 'bookings' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('bookings')}>Bookings{bookings ? ` (${bookings.length})` : ''}</button>
        </div>
      )}
      {tab === 'farms' ? (
        !farms ? <div className="empty-state">Loading…</div>
          : farms.length === 0 ? <div className="empty-state">No farm houses listed yet.</div>
            : farms.map((f) => {
              const slots = (Object.keys(SLOT) as Array<keyof Farm['slots']>).filter((k) => f.slots?.[k]?.enabled)
                .map((k) => `${SLOT[k]} ${inr(f.slots[k].weekdayPrice)}${f.slots[k].weekendPrice ? ` / wknd ${inr(f.slots[k].weekendPrice)}` : ''}`);
              return (
                <div key={f.id} className="partner-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="partner-name">
                      {f.name || '(no name)'}{f.partner && <> · <Link to={`/partners/${f.partner.id}`}>{f.partner.businessName}</Link> ({f.partner.phone})</>}
                    </div>
                    <div className="partner-meta">
                      {f.area || 'area not set'} · up to {f.maxGuests} guests · {f.bedrooms} bedrooms · {f.photoCount} photos · {f.amenities.length} amenities
                    </div>
                    <div className="partner-meta">{slots.join(' · ') || 'no stay types set'} · advance {f.advancePct}% · deposit {inr(f.securityDeposit)}</div>
                  </div>
                  <span className={`badge ${!f.published ? '' : f.partner?.verificationStatus === 'verified' ? 'verified' : 'pending'}`}>
                    {!f.published ? 'hidden' : f.partner?.verificationStatus === 'verified' ? 'live' : 'partner not approved'}
                  </span>
                </div>
              );
            })
      ) : !bookings ? <div className="empty-state">Loading…</div>
        : bookings.length === 0 ? <div className="empty-state">No farm-house bookings yet.</div>
          : bookings.map((b) => (
            <div key={b.id} className="partner-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="partner-name">{b.code} · {b.farmName}</div>
                <div className="partner-meta">
                  {b.customerName} ({b.customerPhone}) · {b.date} · {SLOT[b.slot]} · {b.guests} guests · total {inr(b.total)} · advance paid {inr(b.advanceAmount)}
                  {b.cancelledBy ? ` · cancelled by ${b.cancelledBy}` : ''}
                  {b.refundStatus === 'pending' ? ` · refund owed ${inr(b.refundAmount)}` : b.refundStatus === 'refunded' ? ` · refunded ${inr(b.refundAmount)}` : ''}
                </div>
              </div>
              <span className={`badge ${statusBadge(b.status)}`}>{b.status}</span>
            </div>
          ))}
    </div>
  );
}
