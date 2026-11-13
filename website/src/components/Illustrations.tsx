// Tamboo's own illustrations, drawn as inline SVG in the brand palette (maroon / pink / marigold),
// so they load instantly, stay sharp at any size and carry no licence.
const C = {
  maroon: '#4d0013', wine: '#8a1538', pink: '#e75480', blush: '#fdeef3', rose: '#f7c6d6',
  gold: '#f4b740', marigold: '#f08a24', cream: '#fff7ec', leaf: '#2f8f5b', leafLight: '#7cc79a',
  water: '#5bb8e8', waterLight: '#bfe6f8', wood: '#a0673c', ink: '#1e1b2e',
};
type P = { className?: string; size?: number };

// Festive banner scene: string lights, a decorated mandap, a shamiana tent, and a farm house with a pool.
export function HeroScene({ className }: P) {
  const bulbs = Array.from({ length: 13 }, (_, i) => i);
  return (
    <svg className={className} viewBox="0 0 480 330" role="img" aria-label="Wedding mandap, shamiana tent and farm house with pool">
      <defs>
        <radialGradient id="glow" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#fff" stopOpacity="0.28" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <linearGradient id="drape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.pink} /><stop offset="1" stopColor={C.wine} /></linearGradient>
      </defs>
      <ellipse cx="240" cy="170" rx="235" ry="160" fill="url(#glow)" />
      {/* string lights */}
      <path d="M10 30 Q240 84 470 30" stroke={C.cream} strokeOpacity="0.7" strokeWidth="1.5" fill="none" />
      {bulbs.map((i) => {
        const tt = (i + 0.5) / bulbs.length;
        const x = 10 + tt * 460;
        const y = (1 - tt) * (1 - tt) * 30 + 2 * (1 - tt) * tt * 84 + tt * tt * 30;
        return <g key={i}><line x1={x} y1={y} x2={x} y2={y + 7} stroke={C.cream} strokeOpacity="0.6" /><circle cx={x} cy={y + 11} r="5" fill={i % 3 === 0 ? C.gold : i % 3 === 1 ? C.rose : C.cream} /><circle cx={x} cy={y + 11} r="10" fill={C.gold} opacity="0.18" /></g>;
      })}
      {/* ground */}
      <ellipse cx="240" cy="306" rx="230" ry="18" fill={C.maroon} opacity="0.35" />
      {/* shamiana (left) */}
      <g transform="translate(18 150)">
        <path d="M0 50 L60 0 L120 50 Z" fill={C.cream} />
        <path d="M60 0 L30 50 L45 50 Z M60 0 L75 50 L90 50 Z" fill={C.rose} />
        <path d="M0 50 q10 12 20 0 q10 12 20 0 q10 12 20 0 q10 12 20 0 q10 12 20 0 q10 12 20 0 Z" fill={C.pink} />
        <rect x="6" y="50" width="5" height="100" fill={C.cream} /><rect x="109" y="50" width="5" height="100" fill={C.cream} />
        {/* round table + chairs */}
        <ellipse cx="60" cy="120" rx="26" ry="7" fill={C.cream} />
        <path d="M34 120 h52 v18 q-26 8 -52 0 Z" fill={C.rose} />
        <rect x="20" y="112" width="10" height="26" rx="3" fill={C.gold} /><rect x="90" y="112" width="10" height="26" rx="3" fill={C.gold} />
      </g>
      {/* mandap (centre) */}
      <g transform="translate(150 100)">
        <rect x="0" y="190" width="180" height="16" rx="4" fill={C.cream} />
        <rect x="10" y="182" width="160" height="10" rx="3" fill={C.gold} />
        {[18, 52, 128, 162].map((x) => <rect key={x} x={x - 4} y="58" width="8" height="126" rx="3" fill={C.cream} />)}
        <path d="M0 62 Q90 -30 180 62 Z" fill="url(#drape)" />
        <path d="M83 18 l7 -14 l7 14 Z" fill={C.gold} />
        <circle cx="90" cy="2" r="4.5" fill={C.gold} />
        {/* drapes */}
        <path d="M14 62 Q30 110 22 150 L14 150 Z" fill={C.rose} opacity="0.9" />
        <path d="M166 62 Q150 110 158 150 L166 150 Z" fill={C.rose} opacity="0.9" />
        {/* marigold garland */}
        <path d="M14 66 Q90 118 166 66" stroke={C.marigold} strokeWidth="7" strokeLinecap="round" strokeDasharray="0.1 9" fill="none" />
        <path d="M14 66 Q90 100 166 66" stroke={C.gold} strokeWidth="6" strokeLinecap="round" strokeDasharray="0.1 9" fill="none" />
        {[40, 70, 110, 140].map((x, i) => <line key={x} x1={x} y1={75 + (i % 2) * 6} x2={x} y2={120} stroke={C.marigold} strokeWidth="5" strokeLinecap="round" strokeDasharray="0.1 8" />)}
        {/* kalash */}
        <path d="M84 166 q6 -16 12 0 q8 0 8 10 h-28 q0 -10 8 -10 Z" fill={C.gold} />
        <path d="M86 152 l4 -8 l4 8 Z" fill={C.leaf} />
      </g>
      {/* farm house (right) */}
      <g transform="translate(330 160)">
        <path d="M0 40 L55 5 L110 40 Z" fill={C.wine} />
        <rect x="8" y="40" width="94" height="58" fill={C.cream} />
        <rect x="46" y="66" width="18" height="32" fill={C.wood} />
        <rect x="18" y="52" width="18" height="16" rx="2" fill={C.waterLight} /><rect x="74" y="52" width="18" height="16" rx="2" fill={C.waterLight} />
        <rect x="-10" y="110" width="110" height="26" rx="13" fill={C.water} />
        <path d="M2 122 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0" stroke={C.waterLight} strokeWidth="3" fill="none" />
        {/* palm */}
        <path d="M118 140 q4 -50 -6 -90" stroke={C.wood} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M112 50 q-30 -6 -40 14 q22 -10 40 -14 Z M112 50 q28 -14 40 4 q-22 -6 -40 -4 Z M112 50 q-12 -24 -2 -36 q2 18 2 36 Z M112 50 q20 -10 28 10 q-14 -12 -28 -10 Z" fill={C.leafLight} />
      </g>
      {/* sparkles */}
      {[[60, 95], [440, 100], [120, 70], [360, 80]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 7} l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z`} fill={C.gold} />)}
    </svg>
  );
}

// Small category pictures (used on tiles and as photo placeholders).
export function HallArt({ className, size = 64 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="30" fill={C.blush} />
      <path d="M12 26 L32 12 L52 26 Z" fill={C.wine} />
      <rect x="14" y="26" width="36" height="24" fill="#fff" />
      {[18, 26, 34, 42].map((x) => <rect key={x} x={x} y="29" width="4" height="18" rx="1" fill={C.rose} />)}
      <rect x="10" y="50" width="44" height="4" rx="2" fill={C.gold} />
      <path d="M14 26 Q32 34 50 26" stroke={C.marigold} strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 4" fill="none" />
    </svg>
  );
}
export function FarmArt({ className, size = 64 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#e8f6ee" />
      <path d="M10 28 L26 16 L42 28 Z" fill={C.wine} />
      <rect x="13" y="28" width="26" height="16" fill="#fff" />
      <rect x="23" y="34" width="6" height="10" fill={C.wood} />
      <rect x="10" y="46" width="36" height="8" rx="4" fill={C.water} />
      <path d="M50 54 q1 -16 -2 -28" stroke={C.wood} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M48 26 q-10 -2 -13 5 q7 -4 13 -5 Z M48 26 q9 -5 13 1 q-7 -2 -13 -1 Z M48 26 q-4 -8 0 -12 q1 6 0 12 Z" fill={C.leaf} />
    </svg>
  );
}
export function RentalArt({ className, size = 64 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="30" fill={C.cream} />
      <path d="M8 30 L32 12 L56 30 Z" fill={C.pink} />
      <path d="M32 12 L22 30 L28 30 Z M32 12 L36 30 L42 30 Z" fill="#fff" />
      <path d="M8 30 q4 5 8 0 q4 5 8 0 q4 5 8 0 q4 5 8 0 q4 5 8 0 q4 5 8 0 Z" fill={C.wine} />
      <rect x="10" y="30" width="2" height="22" fill={C.wood} /><rect x="52" y="30" width="2" height="22" fill={C.wood} />
      <rect x="20" y="40" width="7" height="12" rx="2" fill={C.gold} /><rect x="37" y="40" width="7" height="12" rx="2" fill={C.gold} />
      <rect x="27" y="44" width="10" height="3" rx="1.5" fill={C.wine} />
      <circle cx="22" cy="20" r="2" fill={C.gold} /><circle cx="42" cy="20" r="2" fill={C.gold} />
    </svg>
  );
}
export function ServiceArt({ className, size = 64 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#fff1df" />
      {/* diya */}
      <path d="M16 40 q16 12 32 0 Z" fill={C.marigold} />
      <path d="M32 38 q-5 -7 0 -16 q5 9 0 16 Z" fill={C.gold} />
      <path d="M32 36 q-2 -4 0 -9 q2 5 0 9 Z" fill="#fff" />
      {/* flowers */}
      {[[14, 20], [50, 20], [50, 48], [14, 48]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="4" fill={i % 2 ? C.pink : C.marigold} /><circle cx={x} cy={y} r="1.5" fill="#fff" /></g>)}
      <rect x="18" y="48" width="28" height="4" rx="2" fill={C.wine} />
    </svg>
  );
}

// "How it works" step pictures.
export function StepSearch({ className, size = 56 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 56 56" aria-hidden>
      <rect x="4" y="8" width="38" height="40" rx="6" fill={C.blush} />
      <rect x="10" y="15" width="26" height="6" rx="3" fill="#fff" /><rect x="10" y="26" width="18" height="5" rx="2.5" fill={C.rose} /><rect x="10" y="35" width="22" height="5" rx="2.5" fill={C.rose} />
      <circle cx="38" cy="36" r="9" fill="#fff" stroke={C.wine} strokeWidth="4" /><path d="M44 42 l7 7" stroke={C.wine} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
export function StepCalendar({ className, size = 56 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 56 56" aria-hidden>
      <rect x="6" y="10" width="44" height="40" rx="7" fill="#fff" stroke={C.rose} strokeWidth="2" />
      <rect x="6" y="10" width="44" height="11" rx="7" fill={C.wine} />
      <rect x="15" y="5" width="4" height="10" rx="2" fill={C.maroon} /><rect x="37" y="5" width="4" height="10" rx="2" fill={C.maroon} />
      {[0, 1, 2, 3].map((c) => [0, 1].map((r) => <circle key={`${c}${r}`} cx={15 + c * 9} cy={30 + r * 10} r="2.6" fill={c === 2 && r === 1 ? C.pink : C.leafLight} />))}
      <circle cx="33" cy="40" r="6" fill="none" stroke={C.pink} strokeWidth="2" />
    </svg>
  );
}
export function StepPay({ className, size = 56 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 56 56" aria-hidden>
      <rect x="4" y="14" width="40" height="27" rx="5" fill={C.wine} />
      <rect x="4" y="20" width="40" height="5" fill={C.maroon} />
      <rect x="9" y="31" width="12" height="4" rx="2" fill={C.gold} />
      <path d="M40 22 l12 5 v9 c0 7 -5 11 -12 14 c-7 -3 -12 -7 -12 -14 v-9 Z" fill="#fff" stroke={C.leaf} strokeWidth="2.5" />
      <path d="M35 36 l4 4 l7 -8" stroke={C.leaf} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Phone showing the app, for the "Get the app" band.
export function PhoneArt({ className, size = 120 }: P) {
  return (
    <svg className={className} width={size * 0.62} height={size} viewBox="0 0 74 120" aria-hidden>
      <rect x="2" y="2" width="70" height="116" rx="12" fill={C.ink} />
      <rect x="7" y="10" width="60" height="100" rx="6" fill="#fff" />
      <rect x="7" y="10" width="60" height="26" rx="6" fill={C.wine} />
      <text x="37" y="27" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="11" fill="#fff">tamboo</text>
      <rect x="12" y="42" width="50" height="22" rx="5" fill={C.blush} /><rect x="12" y="68" width="24" height="18" rx="4" fill={C.cream} /><rect x="38" y="68" width="24" height="18" rx="4" fill="#e8f6ee" />
      <rect x="12" y="90" width="50" height="10" rx="5" fill={C.pink} />
      <rect x="29" y="5" width="16" height="3" rx="1.5" fill="#444" />
    </svg>
  );
}

// Friendly empty state (no bookings, empty cart, nothing found).
export function EmptyArt({ className, size = 120 }: P) {
  return (
    <svg className={className} width={size} height={size * 0.75} viewBox="0 0 160 120" aria-hidden>
      <ellipse cx="80" cy="108" rx="60" ry="8" fill={C.blush} />
      <rect x="40" y="30" width="80" height="70" rx="10" fill="#fff" stroke={C.rose} strokeWidth="3" />
      <path d="M40 46 h80" stroke={C.rose} strokeWidth="3" />
      <path d="M62 30 v-8 a18 18 0 0 1 36 0 v8" stroke={C.wine} strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="68" cy="68" r="3.5" fill={C.wine} /><circle cx="92" cy="68" r="3.5" fill={C.wine} />
      <path d="M70 82 q10 7 20 0" stroke={C.wine} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M128 26 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 Z" fill={C.gold} />
      <path d="M28 58 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 Z" fill={C.pink} />
    </svg>
  );
}
