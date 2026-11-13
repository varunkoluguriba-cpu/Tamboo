// More of Tamboo's own SVG illustrations: page banners, service categories, occasions, trust
// badges and the Hyderabad skyline. Same palette as Illustrations.tsx.
const C = {
  maroon: '#4d0013', wine: '#8a1538', pink: '#e75480', blush: '#fdeef3', rose: '#f7c6d6',
  gold: '#f4b740', marigold: '#f08a24', cream: '#fff7ec', leaf: '#2f8f5b', leafLight: '#7cc79a',
  water: '#5bb8e8', waterLight: '#bfe6f8', wood: '#a0673c', ink: '#1e1b2e', sky: '#ffe3c2', steel: '#c9ccd6',
};
type P = { className?: string; size?: number };

// A row of small hanging bulbs along a gentle curve — reused across banners.
function Lights({ x1, x2, y, sag, n }: { x1: number; x2: number; y: number; sag: number; n: number }) {
  return (
    <g>
      <path d={`M${x1} ${y} Q${(x1 + x2) / 2} ${y + sag * 2} ${x2} ${y}`} stroke={C.wine} strokeOpacity="0.35" strokeWidth="1.2" fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const tt = (i + 0.5) / n; const bx = x1 + tt * (x2 - x1); const by = y + 4 * sag * tt * (1 - tt);
        return <circle key={i} cx={bx} cy={by + 5} r="3.2" fill={[C.gold, C.pink, C.marigold][i % 3]} />;
      })}
    </g>
  );
}

// ---------- page banners (wide, 360x180) ----------
export function HallsBanner({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 360 180" aria-hidden>
      <circle cx="290" cy="40" r="26" fill={C.sky} />
      <Lights x1={20} x2={340} y={14} sag={10} n={14} />
      <rect x="60" y="62" width="240" height="96" rx="6" fill="#fff" />
      <path d="M48 66 L180 26 L312 66 Z" fill={C.wine} />
      <path d="M150 48 h60 l-6 -10 h-48 Z" fill={C.gold} />
      {[80, 118, 156, 194, 232, 270].map((x) => <rect key={x} x={x} y="72" width="10" height="78" rx="3" fill={C.rose} />)}
      <rect x="160" y="102" width="40" height="56" rx="20" fill={C.maroon} />
      <rect x="166" y="108" width="28" height="50" rx="14" fill={C.gold} opacity="0.85" />
      <path d="M60 70 Q180 108 300 70" stroke={C.marigold} strokeWidth="5" strokeLinecap="round" strokeDasharray="0.1 8" fill="none" />
      <rect x="40" y="156" width="280" height="10" rx="5" fill={C.gold} />
      {/* chandelier glimpses */}
      <g transform="translate(108 92)"><path d="M0 0 l8 12 l8 -12" stroke={C.gold} strokeWidth="2" fill="none" /><circle cx="8" cy="14" r="3" fill={C.gold} /></g>
      <g transform="translate(236 92)"><path d="M0 0 l8 12 l8 -12" stroke={C.gold} strokeWidth="2" fill="none" /><circle cx="8" cy="14" r="3" fill={C.gold} /></g>
      {/* potted plants */}
      <g transform="translate(26 120)"><rect x="0" y="22" width="18" height="16" rx="3" fill={C.wood} /><circle cx="9" cy="14" r="12" fill={C.leaf} /></g>
      <g transform="translate(316 120)"><rect x="0" y="22" width="18" height="16" rx="3" fill={C.wood} /><circle cx="9" cy="14" r="12" fill={C.leaf} /></g>
    </svg>
  );
}

export function FarmBanner({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 360 180" aria-hidden>
      <circle cx="80" cy="52" r="30" fill={C.sky} />
      <path d="M0 120 Q90 86 180 112 T360 104 V180 H0 Z" fill="#cdebd8" />
      <path d="M150 74 L216 40 L282 74 Z" fill={C.wine} />
      <rect x="160" y="74" width="112" height="56" fill="#fff" />
      <rect x="204" y="96" width="22" height="34" fill={C.wood} />
      <rect x="172" y="86" width="22" height="18" rx="3" fill={C.waterLight} /><rect x="238" y="86" width="22" height="18" rx="3" fill={C.waterLight} />
      <rect x="120" y="138" width="190" height="30" rx="15" fill={C.water} />
      <path d="M134 152 q12 -7 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" stroke={C.waterLight} strokeWidth="3" fill="none" />
      {/* palms */}
      {[[110, 168, 1], [328, 168, -1]].map(([x, y, d], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${d} 1)`}>
          <path d="M0 0 q-6 -60 6 -100" stroke={C.wood} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M6 -100 q-34 -6 -46 16 q24 -12 46 -16 Z M6 -100 q30 -16 46 4 q-24 -8 -46 -4 Z M6 -100 q-14 -26 -2 -40 q2 20 2 40 Z M6 -100 q22 -10 30 12 q-14 -14 -30 -12 Z" fill={C.leaf} />
        </g>
      ))}
      {/* hammock + lounger */}
      <path d="M40 140 q20 18 40 0" stroke={C.pink} strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="318" y="128" width="30" height="6" rx="3" fill={C.gold} transform="rotate(-12 318 128)" />
      {/* birds */}
      <path d="M140 40 q6 -6 12 0 q6 -6 12 0" stroke={C.wine} strokeWidth="2" fill="none" /><path d="M176 28 q5 -5 10 0 q5 -5 10 0" stroke={C.wine} strokeWidth="2" fill="none" />
    </svg>
  );
}

export function RentalsBanner({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 360 180" aria-hidden>
      <Lights x1={10} x2={350} y={16} sag={8} n={15} />
      <path d="M40 76 L180 30 L320 76 Z" fill={C.cream} />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M180 30 L${60 + i * 48} 76 L${84 + i * 48} 76 Z`} fill={i % 2 ? C.rose : C.pink} opacity="0.9" />)}
      <path d={`M40 76 ${Array.from({ length: 14 }, () => 'q10 12 20 0').join(' ')} Z`} fill={C.wine} />
      <rect x="46" y="76" width="5" height="90" fill={C.cream} /><rect x="309" y="76" width="5" height="90" fill={C.cream} />
      {/* chairs in rows */}
      {[0, 1].map((r) => [0, 1, 2, 3, 4, 5, 6].map((c) => (
        <g key={`${r}${c}`} transform={`translate(${86 + c * 28} ${112 + r * 26})`}>
          <rect x="0" y="0" width="16" height="12" rx="3" fill={r ? C.gold : C.marigold} /><rect x="0" y="12" width="16" height="4" rx="2" fill={C.wine} />
          <rect x="1" y="16" width="2.5" height="8" fill={C.wood} /><rect x="12.5" y="16" width="2.5" height="8" fill={C.wood} />
        </g>
      )))}
      {/* speakers + vessels */}
      <g transform="translate(14 112)"><rect width="22" height="40" rx="4" fill={C.ink} /><circle cx="11" cy="12" r="6" fill="#555" /><circle cx="11" cy="28" r="7" fill="#555" /></g>
      <g transform="translate(326 130)"><path d="M0 8 h26 l-3 18 h-20 Z" fill={C.steel} /><ellipse cx="13" cy="8" rx="13" ry="4" fill="#e6e8ee" /><path d="M6 0 q3 -6 0 -10 M14 0 q3 -6 0 -10" stroke={C.steel} strokeWidth="2" fill="none" /></g>
    </svg>
  );
}

export function ServicesBanner({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 360 180" aria-hidden>
      {/* flower arch */}
      <path d="M100 168 V80 a80 80 0 0 1 160 0 V168" stroke={C.marigold} strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray="0.1 12" />
      <path d="M100 168 V80 a80 80 0 0 1 160 0 V168" stroke={C.pink} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="0.1 12" strokeDashoffset="6" />
      {/* homa / diya stand in the centre */}
      <path d="M150 168 h60 l-8 -22 h-44 Z" fill={C.wood} />
      <path d="M180 144 q-14 -18 0 -40 q14 22 0 40 Z" fill={C.marigold} /><path d="M180 140 q-6 -10 0 -22 q6 12 0 22 Z" fill={C.gold} />
      {/* kalash left */}
      <g transform="translate(40 116)"><path d="M10 52 q-14 -22 6 -36 h20 q20 14 6 36 Z" fill={C.gold} /><rect x="14" y="10" width="20" height="8" rx="3" fill={C.marigold} /><path d="M24 10 l-10 -14 M24 10 l0 -16 M24 10 l10 -14" stroke={C.leaf} strokeWidth="4" strokeLinecap="round" /><circle cx="24" cy="-8" r="7" fill={C.wood} /></g>
      {/* biryani handi right */}
      <g transform="translate(276 120)"><ellipse cx="30" cy="12" rx="32" ry="8" fill={C.steel} /><path d="M-2 12 q0 38 32 38 q32 0 32 -38 Z" fill="#9aa0ae" /><path d="M14 -2 q4 -8 0 -14 M30 -4 q4 -8 0 -14 M46 -2 q4 -8 0 -14" stroke="#b7bcc8" strokeWidth="2.5" fill="none" strokeLinecap="round" /></g>
      {/* sannayi */}
      <g transform="translate(300 50) rotate(30)"><rect x="0" y="0" width="6" height="44" rx="3" fill={C.wood} /><path d="M-6 44 h18 l-4 10 h-10 Z" fill={C.gold} /></g>
      {/* petals */}
      {[[40, 30], [70, 60], [300, 24], [330, 90], [20, 90]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="5" ry="3" fill={i % 2 ? C.pink : C.marigold} transform={`rotate(${i * 40} ${x} ${y})`} />)}
    </svg>
  );
}

// ---------- service categories (square 96) ----------
export function PriestArt({ className, size = 96 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 96 96" aria-hidden>
      <circle cx="48" cy="48" r="46" fill="#fff1df" />
      <circle cx="48" cy="34" r="12" fill="#c98b5a" />
      <path d="M36 30 q12 -16 24 0" fill={C.ink} opacity="0.85" />
      <rect x="45" y="22" width="6" height="3" rx="1.5" fill={C.marigold} />
      <path d="M26 78 q0 -28 22 -32 q22 4 22 32 Z" fill={C.cream} />
      <path d="M40 48 l8 30 l8 -30" stroke={C.marigold} strokeWidth="4" fill="none" />
      <path d="M30 80 h36" stroke={C.wine} strokeWidth="4" strokeLinecap="round" />
      <g transform="translate(64 60)"><path d="M0 12 q10 8 20 0 Z" fill={C.marigold} /><path d="M10 11 q-4 -6 0 -13 q4 7 0 13 Z" fill={C.gold} /></g>
    </svg>
  );
}
export function CateringArt({ className, size = 96 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 96 96" aria-hidden>
      <circle cx="48" cy="48" r="46" fill="#fff4e5" />
      <ellipse cx="48" cy="44" rx="30" ry="8" fill={C.steel} />
      <path d="M18 44 q0 32 30 32 q30 0 30 -32 Z" fill="#9aa0ae" />
      <path d="M18 50 q30 10 60 0" stroke="#7d8392" strokeWidth="2" fill="none" />
      <ellipse cx="48" cy="44" rx="24" ry="5" fill={C.gold} />
      {[34, 48, 62].map((x) => <path key={x} d={`M${x} 34 q4 -8 0 -16`} stroke="#c3c7d1" strokeWidth="3" fill="none" strokeLinecap="round" />)}
      <path d="M70 30 l14 -14" stroke={C.wood} strokeWidth="4" strokeLinecap="round" /><ellipse cx="68" cy="33" rx="6" ry="4" fill={C.steel} />
      <circle cx="40" cy="44" r="2" fill={C.marigold} /><circle cx="52" cy="42" r="2" fill={C.leaf} /><circle cx="58" cy="46" r="2" fill={C.marigold} />
    </svg>
  );
}
export function DecorArt({ className, size = 96 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 96 96" aria-hidden>
      <circle cx="48" cy="48" r="46" fill={C.blush} />
      <path d="M20 82 V44 a28 28 0 0 1 56 0 V82" stroke={C.marigold} strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray="0.1 8" />
      <path d="M20 82 V44 a28 28 0 0 1 56 0 V82" stroke={C.pink} strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="0.1 8" strokeDashoffset="4" />
      {[[48, 16], [28, 26], [68, 26]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="6" fill={C.rose} /><circle cx={x} cy={y} r="2.5" fill={C.gold} /></g>)}
      <path d="M30 82 h36" stroke={C.wine} strokeWidth="4" strokeLinecap="round" />
      <path d="M40 60 q8 -10 16 0 q-8 10 -16 0 Z" fill={C.leafLight} />
    </svg>
  );
}
export function MusicArt({ className, size = 96 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 96 96" aria-hidden>
      <circle cx="48" cy="48" r="46" fill="#eef4ff" />
      {/* dhol */}
      <ellipse cx="40" cy="60" rx="10" ry="16" fill={C.cream} />
      <rect x="40" y="44" width="30" height="32" fill={C.wine} />
      <ellipse cx="70" cy="60" rx="10" ry="16" fill={C.cream} />
      {[46, 54, 62].map((x) => <path key={x} d={`M${x} 44 l6 32`} stroke={C.gold} strokeWidth="2" />)}
      {/* sannayi */}
      <g transform="translate(22 14) rotate(-35)"><rect x="0" y="0" width="5" height="36" rx="2.5" fill={C.wood} /><path d="M-6 36 h17 l-4 9 h-9 Z" fill={C.gold} /></g>
      <path d="M72 22 v14 a4 4 0 1 1 -3 -3.8 V22 Z" fill={C.pink} /><path d="M80 18 v12 a3.5 3.5 0 1 1 -3 -3.4 V18 Z" fill={C.marigold} />
    </svg>
  );
}

// ---------- occasions (square 80) ----------
export function WeddingArt({ className, size = 80 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 80 80" aria-hidden>
      <circle cx="40" cy="40" r="38" fill={C.blush} />
      <circle cx="32" cy="44" r="13" fill="none" stroke={C.gold} strokeWidth="5" /><circle cx="48" cy="44" r="13" fill="none" stroke={C.gold} strokeWidth="5" />
      <path d="M44 22 l4 -6 l4 6 l-4 5 Z" fill={C.waterLight} />
      <path d="M8 20 Q40 40 72 20" stroke={C.marigold} strokeWidth="5" strokeLinecap="round" strokeDasharray="0.1 7" fill="none" />
    </svg>
  );
}
export function BirthdayArt({ className, size = 80 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 80 80" aria-hidden>
      <circle cx="40" cy="40" r="38" fill="#fff1df" />
      <rect x="20" y="44" width="40" height="22" rx="4" fill={C.pink} /><rect x="20" y="44" width="40" height="7" rx="3" fill="#fff" />
      <rect x="24" y="34" width="32" height="12" rx="4" fill={C.rose} />
      {[32, 40, 48].map((x) => <g key={x}><rect x={x - 1.5} y="24" width="3" height="10" fill={C.gold} /><path d={`M${x} 18 q-3 4 0 6 q3 -2 0 -6 Z`} fill={C.marigold} /></g>)}
      <ellipse cx="14" cy="22" rx="7" ry="9" fill={C.water} /><path d="M14 31 q2 8 -2 14" stroke={C.ink} strokeWidth="1" fill="none" />
      <ellipse cx="66" cy="20" rx="7" ry="9" fill={C.gold} /><path d="M66 29 q-2 8 2 14" stroke={C.ink} strokeWidth="1" fill="none" />
    </svg>
  );
}
export function PartyArt({ className, size = 80 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 80 80" aria-hidden>
      <circle cx="40" cy="40" r="38" fill="#e8f6ee" />
      <Lights x1={6} x2={74} y={16} sag={6} n={7} />
      <path d="M30 62 l-4 -26 h28 l-4 26 Z" fill={C.waterLight} opacity="0.9" /><path d="M27 42 h26" stroke="#fff" strokeWidth="2" />
      <path d="M48 30 l10 -12" stroke={C.pink} strokeWidth="3" strokeLinecap="round" />
      <path d="M58 58 v-16 a5 5 0 1 1 -3 -4.6" stroke={C.wine} strokeWidth="3" fill="none" />
      <circle cx="20" cy="56" r="3" fill={C.marigold} /><circle cx="62" cy="64" r="2.5" fill={C.pink} />
    </svg>
  );
}
export function PoojaArt({ className, size = 80 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 80 80" aria-hidden>
      <circle cx="40" cy="40" r="38" fill="#fff4e5" />
      <path d="M8 16 h64" stroke={C.leaf} strokeWidth="3" />
      {[14, 26, 38, 50, 62].map((x) => <path key={x} d={`M${x} 16 q4 10 8 0`} fill={C.leafLight} />)}
      <path d="M26 66 q-12 -18 6 -30 h16 q18 12 6 30 Z" fill={C.gold} />
      <rect x="30" y="30" width="20" height="7" rx="3" fill={C.marigold} />
      <path d="M40 30 l-8 -10 M40 30 v-12 M40 30 l8 -10" stroke={C.leaf} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="40" cy="16" r="5" fill={C.wood} />
      <path d="M33 52 h14 M40 45 v14" stroke={C.wine} strokeWidth="2.5" />
    </svg>
  );
}
export function CorporateArt({ className, size = 80 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 80 80" aria-hidden>
      <circle cx="40" cy="40" r="38" fill="#eef1ff" />
      <rect x="14" y="20" width="52" height="30" rx="3" fill="#fff" stroke={C.steel} strokeWidth="2" />
      <path d="M20 42 l10 -10 l8 6 l12 -12 l8 6" stroke={C.pink} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10" y="56" width="60" height="8" rx="3" fill={C.wine} />
      <path d="M40 50 v6" stroke={C.steel} strokeWidth="3" />
      <rect x="36" y="44" width="8" height="12" rx="4" fill={C.ink} transform="translate(22 0)" />
    </svg>
  );
}

// ---------- trust badges (48) ----------
export function BadgeVerified({ size = 48 }: P) {
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden><circle cx="24" cy="24" r="22" fill="#e8f6ee" /><path d="M24 9 l13 5 v9 c0 9 -6 14 -13 17 c-7 -3 -13 -8 -13 -17 v-9 Z" fill={C.leaf} /><path d="M18 24 l4 4 l8 -9" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function BadgeSecure({ size = 48 }: P) {
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden><circle cx="24" cy="24" r="22" fill={C.blush} /><rect x="13" y="22" width="22" height="16" rx="3" fill={C.wine} /><path d="M17 22 v-4 a7 7 0 0 1 14 0 v4" stroke={C.wine} strokeWidth="3" fill="none" /><circle cx="24" cy="30" r="2.5" fill={C.gold} /></svg>;
}
export function BadgeCalendar({ size = 48 }: P) {
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden><circle cx="24" cy="24" r="22" fill="#fff4e5" /><rect x="12" y="14" width="24" height="22" rx="3" fill="#fff" stroke={C.marigold} strokeWidth="2" /><rect x="12" y="14" width="24" height="6" rx="3" fill={C.marigold} />{[0, 1, 2].map((i) => <circle key={i} cx={18 + i * 6} cy="27" r="2" fill={i === 1 ? C.pink : C.leafLight} />)}</svg>;
}
export function BadgeLanguage({ size = 48 }: P) {
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden><circle cx="24" cy="24" r="22" fill="#eef4ff" /><rect x="10" y="14" width="20" height="14" rx="4" fill={C.wine} /><text x="20" y="25" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">అ</text><rect x="20" y="22" width="18" height="13" rx="4" fill={C.pink} /><text x="29" y="32" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">अ</text></svg>;
}

// ---------- Hyderabad skyline with Charminar (wide strip) ----------
export function Skyline({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 1200 120" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <g fill={C.rose} opacity="0.55">
        <rect x="40" y="60" width="60" height="60" /><rect x="110" y="40" width="40" height="80" /><rect x="160" y="70" width="70" height="50" />
        <rect x="860" y="50" width="50" height="70" /><rect x="920" y="30" width="36" height="90" /><rect x="966" y="64" width="80" height="56" /><rect x="1060" y="44" width="44" height="76" /><rect x="1110" y="70" width="70" height="50" />
        {/* Golconda-style hill fort */}
        <path d="M250 120 Q300 70 380 80 Q430 60 470 120 Z" /><rect x="330" y="66" width="30" height="20" />
      </g>
      {/* Charminar */}
      <g transform="translate(560 6)" fill={C.wine} opacity="0.85">
        <rect x="0" y="22" width="12" height="92" /><rect x="68" y="22" width="12" height="92" />
        <path d="M-2 22 q8 -14 16 0 Z M66 22 q8 -14 16 0 Z" />
        <rect x="6" y="2" width="1.6" height="12" /><rect x="74" y="2" width="1.6" height="12" />
        <rect x="8" y="58" width="64" height="56" />
        <rect x="8" y="50" width="64" height="8" />
        <path d="M20 114 v-24 a20 20 0 0 1 40 0 v24 Z" fill={C.cream} opacity="1" />
        <circle cx="40" cy="70" r="5" fill={C.cream} opacity="1" />
        {[0, 1].map((i) => <rect key={i} x={-2 + i * 70} y={44 - 0} width="16" height="4" />)}
        {[0, 1].map((i) => <rect key={`b${i}`} x={-2 + i * 70} y={80} width="16" height="4" />)}
      </g>
      <rect x="0" y="114" width="1200" height="6" fill={C.wine} opacity="0.35" />
    </svg>
  );
}

// Phone with an OTP lock — login dialog.
export function OtpArt({ size = 84 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 84 84" aria-hidden>
      <circle cx="42" cy="42" r="40" fill={C.blush} />
      <rect x="26" y="12" width="32" height="58" rx="7" fill={C.ink} /><rect x="29" y="18" width="26" height="46" rx="4" fill="#fff" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={31 + i * 6} y="34" width="4" height="6" rx="1.5" fill={C.pink} />)}
      <circle cx="58" cy="58" r="12" fill={C.leaf} /><path d="M52 58 l4 4 l8 -8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
