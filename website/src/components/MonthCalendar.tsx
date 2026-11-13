import { useLang } from '../lib/lang';

const pad = (n: number) => String(n).padStart(2, '0');
// Local calendar date as 'YYYY-MM-DD' (what the API uses for booking dates).
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shift = (month: string, by: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + by, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

// Sunday-first month grid. `dots(date)` returns the colours to show under a day (e.g. per slot).
export default function MonthCalendar({ month, onMonth, selected, onPick, dots, isDisabled }: {
  month: string; onMonth: (m: string) => void; selected: string; onPick: (d: string) => void;
  dots?: (d: string) => string[]; isDisabled?: (d: string) => boolean;
}) {
  const { t } = useLang();
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const thisMonth = ymd(new Date()).slice(0, 7);
  const cells: Array<string | null> = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${pad(i + 1)}`)];
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="between">
        <button className="btn btn-soft btn-sm" disabled={month <= thisMonth} style={{ opacity: month <= thisMonth ? 0.35 : 1 }} onClick={() => onMonth(shift(month, -1))} aria-label="Previous month">‹</button>
        <b>{t.cfMonths.split(',')[m - 1]} {y}</b>
        <button className="btn btn-soft btn-sm" onClick={() => onMonth(shift(month, 1))} aria-label="Next month">›</button>
      </div>
      <div className="cal" dir="ltr">
        {t.webWeekdays.split(',').map((w, i) => <span key={i} className="cal-h">{w}</span>)}
        {cells.map((d, i) => d === null ? <span key={`e${i}`} /> : (
          <button key={d} className={`cal-d ${selected === d ? 'sel' : ''}`} disabled={isDisabled?.(d)} onClick={() => onPick(d)}>
            {Number(d.slice(8))}
            {dots && !isDisabled?.(d) && <span className="dots">{dots(d).map((c, j) => <span key={j} className="dot" style={{ background: selected === d ? '#fff' : c }} />)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
