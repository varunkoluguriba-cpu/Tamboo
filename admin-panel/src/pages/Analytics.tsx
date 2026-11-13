import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api';
import { useAuth } from '../context/AuthContext';

type Row = {
  area: string;
  tent: number; halls: number; priest: number; catering: number; decor: number; music: number; pendingPartners: number;
  customers: number; customersAreaPicked: number; customers7d: number; customers30d: number;
  orders: number; hallBookings: number; serviceRequests: number;
  partnersTotal: number; demand: number;
  suggestion: 'pushCustomers' | 'recruitPartners' | 'balanced' | 'tooLittleData' | 'none';
};
type Sort = 'total' | 'partners' | 'customers' | 'gap' | 'name';

// Series colours (validated: CVD-safe pair, ≥3:1 on white). Text never uses them.
const PARTNER_COLOR = '#a0133f';
const CUSTOMER_COLOR = '#2563eb';

const SUGGESTION: Record<Row['suggestion'], { label: string; cls: string } | null> = {
  pushCustomers: { label: '↑ Push customer app here', cls: 'pending' },
  recruitPartners: { label: '↑ Recruit partners here', cls: 'pending' },
  balanced: { label: 'Balanced', cls: 'verified' },
  tooLittleData: { label: 'Too little data', cls: '' },
  none: null,
};

// Area-wise supply (partners) vs demand (customers, orders) — where to push which app.
export default function Analytics() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('total');
  const [only, setOnly] = useState<'all' | 'pushCustomers' | 'recruitPartners'>('all');

  useEffect(() => {
    api.get<{ rows: Row[] }>('/api/admin/analytics/areas')
      .then((r) => setRows(r.rows))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof ApiError ? err.message : 'Could not load analytics.');
      });
  }, [logout]);

  const totals = useMemo(() => {
    const r = rows || [];
    const sum = (k: keyof Row) => r.reduce((s, x) => s + (x[k] as number), 0);
    const customers = sum('customers');
    const unknown = r.find((x) => x.area === 'Unknown');
    return {
      partners: sum('partnersTotal'), pending: sum('pendingPartners'), customers,
      knownPct: customers ? Math.round(((customers - (unknown?.customers || 0)) / customers) * 100) : 0,
      pushCustomers: r.filter((x) => x.suggestion === 'pushCustomers').length,
      recruitPartners: r.filter((x) => x.suggestion === 'recruitPartners').length,
    };
  }, [rows]);

  const shown = useMemo(() => {
    let list = (rows || []).filter((r) => r.area.toLowerCase().includes(q.trim().toLowerCase()));
    if (only !== 'all') list = list.filter((r) => r.suggestion === only);
    const by: Record<Sort, (a: Row, b: Row) => number> = {
      total: (a, b) => (b.partnersTotal + b.customers) - (a.partnersTotal + a.customers),
      partners: (a, b) => b.partnersTotal - a.partnersTotal,
      customers: (a, b) => b.customers - a.customers,
      gap: (a, b) => (b.partnersTotal * 5 - b.customers) - (a.partnersTotal * 5 - a.customers),
      name: (a, b) => a.area.localeCompare(b.area),
    };
    return [...list].sort(by[sort]);
  }, [rows, q, sort, only]);

  const max = Math.max(1, ...(rows || []).flatMap((r) => [r.partnersTotal, r.customers]));

  if (error) return <div className="empty-state">{error}</div>;
  if (!rows) return <div className="empty-state">Loading…</div>;

  return (
    <div>
      <h1 className="page-title">Area analytics</h1>
      <div style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 14, maxWidth: 760 }}>
        Partners (supply) and customers (demand) for each Hyderabad locality — counts of people who installed the app <b>and signed up</b>.
        Use it to decide where to push the customer app and where to recruit partners.
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Tile label="Live partners" value={totals.partners} sub={totals.pending ? `+${totals.pending} waiting for approval` : 'verified'} />
        <Tile label="Customers signed up" value={totals.customers} sub={`${totals.knownPct}% with a known area`} />
        <Tile label="Areas to push customer app" value={totals.pushCustomers} sub="partners there, few customers" />
        <Tile label="Areas to recruit partners" value={totals.recruitPartners} sub="customers there, few partners" />
      </div>

      <div className="card" style={{ marginBottom: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="text-input" style={{ flex: 1, minWidth: 180 }} placeholder="Search area…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="text-input" style={{ width: 'auto' }} value={only} onChange={(e) => setOnly(e.target.value as typeof only)}>
          <option value="all">All areas</option>
          <option value="pushCustomers">Push customer app</option>
          <option value="recruitPartners">Recruit partners</option>
        </select>
        <select className="text-input" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="total">Sort: most active</option>
          <option value="partners">Sort: most partners</option>
          <option value="customers">Sort: most customers</option>
          <option value="gap">Sort: biggest customer gap</option>
          <option value="name">Sort: A–Z</option>
        </select>
        <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: 'var(--text-soft)' }}>
          <Legend color={PARTNER_COLOR} label="Partners" />
          <Legend color={CUSTOMER_COLOR} label="Customers" />
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <Th>Area</Th><Th style={{ minWidth: 150 }}>Partners vs customers</Th>
              <Th right>Tent</Th><Th right>Halls</Th><Th right>Priest</Th><Th right>Catering</Th><Th right>Decor</Th><Th right>Music</Th>
              <Th right>Customers</Th><Th right>New 7d / 30d</Th><Th right>Orders</Th><Th right>Hall bookings</Th><Th right>Service req.</Th>
              <Th>Suggestion</Th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const sug = SUGGESTION[r.suggestion];
              return (
                <tr key={r.area} style={{ borderTop: '1px solid var(--divider)' }}>
                  <Td><b>{r.area}</b>{r.pendingPartners > 0 && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>+{r.pendingPartners} pending</div>}</Td>
                  <Td>
                    <Bar value={r.partnersTotal} max={max} color={PARTNER_COLOR} title={`${r.area}: ${r.partnersTotal} live partners`} />
                    <Bar value={r.customers} max={max} color={CUSTOMER_COLOR} title={`${r.area}: ${r.customers} customers`} />
                  </Td>
                  <Td right>{r.tent || '–'}</Td><Td right>{r.halls || '–'}</Td><Td right>{r.priest || '–'}</Td>
                  <Td right>{r.catering || '–'}</Td><Td right>{r.decor || '–'}</Td><Td right>{r.music || '–'}</Td>
                  <Td right><b>{r.customers}</b></Td>
                  <Td right>{r.customers7d} / {r.customers30d}</Td>
                  <Td right>{r.orders || '–'}</Td><Td right>{r.hallBookings || '–'}</Td><Td right>{r.serviceRequests || '–'}</Td>
                  <Td>{sug ? <span className={`badge ${sug.cls}`}>{sug.label}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}</Td>
                </tr>
              );
            })}
            {shown.length === 0 && <tr><td colSpan={14}><div className="empty-state">No areas match.</div></td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6, maxWidth: 820 }}>
        <b>How areas are worked out:</b> tent houses and event services by the area they typed at sign-up; halls by their map pin;
        customers by the area they picked, otherwise their approximate location (only if they allowed location, rounded to ~1 km).
        Orders use the delivery address. <b>Unknown</b> = no area yet (e.g. customers who skipped it and denied location);
        <b> Other</b> = outside the listed localities.<br />
        <b>Suggestions:</b> “Push customer app” when an area has 3+ partners but fewer than 5 customers per partner;
        “Recruit partners” when it has 20+ customers and at most 1 partner.
      </div>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="card" style={{ flex: '1 1 180px', minWidth: 170 }}>
      <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{label}</div>
      <div style={{ fontFamily: 'Sora', fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />{label}</span>;
}

// Thin horizontal bar, rounded data-end, sized against the busiest area; the hover title gives the exact count.
function Bar({ value, max, color, title }: { value: number; max: number; color: string; title: string }) {
  return (
    <div title={title} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 12, margin: '3px 0' }}>
      <div style={{ height: 6, width: `${Math.max(value ? 4 : 0, (value / max) * 110)}px`, background: color, borderRadius: '0 4px 4px 0' }} />
      <span style={{ fontSize: 11.5, color: 'var(--text-soft)' }}>{value}</span>
    </div>
  );
}

function Th({ children, right, style }: { children: React.ReactNode; right?: boolean; style?: React.CSSProperties }) {
  return <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap', ...style }}>{children}</th>;
}
function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <td style={{ padding: '9px 12px', textAlign: right ? 'right' : 'left', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{children}</td>;
}
