import { useEffect, useState } from 'react';
import { Home, GraduationCap, ShoppingCart, Lightbulb, Utensils, Backpack, Pill, Hospital, Syringe, Milk, Ship, Activity, Book, Zap, Droplet, DollarSign, Bot } from 'lucide-react';
import svgPaths from '../../imports/Pool-2/svg-j7y9f97e6x';
import FigmaTree from '../../imports/Icon-1/Icon-2043-273';
import { usePools, usePoolAnalytics, useSpendRequests } from '../../api/hooks';

// ─── Brand palette ────────────────────────────────────────────────────────────
const C = {
  cyan:    '#00E5FF', cyan2:   '#0088CC', cyanLt:  '#80F7FF',
  orange:  '#FF8C00', orange2: '#CC5500', orangeLt:'#FFB347',
  green:   '#39FF14', green2:  '#0A8800', greenLt: '#AAFF88',
  blue:    '#3B82F6', blue2:   '#1D4ED8', blueLt:  '#93C5FD',
  trunk:   '#008FCC', trunkLt: '#00CCFF',
};

// ─── Icon mapping ─────────────────────────────────────────────────────────────
type IconType = 'home' | 'lightbulb' | 'droplet' | 'shopping-cart' | 'utensils' | 'milk' | 'graduation-cap' | 'book' | 'backpack' | 'pill' | 'hospital' | 'syringe';

function IconComponent({ type, color, size = 16 }: { type: IconType; color: string; size?: number }) {
  const iconProps = { color, size, strokeWidth: 2 };
  switch (type) {
    case 'home': return <Home {...iconProps} />;
    case 'lightbulb': return <Lightbulb {...iconProps} />;
    case 'droplet': return <Droplet {...iconProps} />;
    case 'shopping-cart': return <ShoppingCart {...iconProps} />;
    case 'utensils': return <Utensils {...iconProps} />;
    case 'milk': return <Milk {...iconProps} />;
    case 'graduation-cap': return <GraduationCap {...iconProps} />;
    case 'book': return <Book {...iconProps} />;
    case 'backpack': return <Backpack {...iconProps} />;
    case 'pill': return <Pill {...iconProps} />;
    case 'hospital': return <Hospital {...iconProps} />;
    case 'syringe': return <Syringe {...iconProps} />;
    default: return <Home {...iconProps} />;
  }
}

// ─── Trip / Pool data ─────────────────────────────────────────────────────────
const TRIPS_DATA = {
  langkawi: {
    name: 'April Family Fund', icon: 'home' as IconType, members: 4, total: 1550,
    A: { label: 'Housing & Utils', icon: 'home' as IconType, total: 600, color: C.cyan,
      items: [{ icon: 'home' as IconType, name: 'Monthly Rent', amount: 'RM 400' },
              { icon: 'lightbulb' as IconType, name: 'Electric Bill',  amount: 'RM 150' },
              { icon: 'droplet' as IconType, name: 'Water Bill',  amount: 'RM 50'  }] },
    B: { label: 'Groceries', icon: 'shopping-cart' as IconType, total: 450, color: C.orange,
      items: [{ icon: 'utensils' as IconType, name: 'Wet Market', amount: 'RM 180' },
              { icon: 'shopping-cart' as IconType, name: '99 Speedmart',       amount: 'RM 150' },
              { icon: 'milk' as IconType, name: 'Milk & Snacks',       amount: 'RM 120' }] },
    C: { label: 'Education', icon: 'graduation-cap' as IconType, total: 300, color: C.green,
      items: [{ icon: 'graduation-cap' as IconType, name: 'School Fees',     amount: 'RM 120' },
              { icon: 'book' as IconType, name: 'Textbooks', amount: 'RM 100' },
              { icon: 'backpack' as IconType, name: 'Uniform & Supplies',   amount: 'RM 80'  }] },
    D: { label: 'Healthcare', icon: 'pill' as IconType, total: 200, color: C.blue,
      items: [{ icon: 'pill' as IconType, name: 'Pharmacy',    amount: 'RM 80' },
              { icon: 'hospital' as IconType, name: 'Clinic Visit',       amount: 'RM 72' },
              { icon: 'syringe' as IconType, name: 'Vitamins', amount: 'RM 48' }] },
  },
  penang: {
    name: 'March Family Fund', icon: 'home' as IconType, members: 3, total: 980,
    A: { label: 'Housing & Utils', icon: 'home' as IconType, total: 350, color: C.cyan,
      items: [{ icon: 'home' as IconType, name: 'Monthly Rent', amount: 'RM 280' },
              { icon: 'lightbulb' as IconType, name: 'Electric Bill', amount: 'RM 70'  }] },
    B: { label: 'Groceries', icon: 'shopping-cart' as IconType, total: 420, color: C.orange,
      items: [{ icon: 'utensils' as IconType, name: 'Wet Market', amount: 'RM 95' },
              { icon: 'shopping-cart' as IconType, name: '99 Speedmart',  amount: 'RM 180' },
              { icon: 'milk' as IconType, name: 'Milk & Snacks',    amount: 'RM 145' }] },
    C: { label: 'Education', icon: 'graduation-cap' as IconType, total: 140, color: C.green,
      items: [{ icon: 'graduation-cap' as IconType, name: 'School Fees',  amount: 'RM 80' },
              { icon: 'book' as IconType, name: 'Textbooks',     amount: 'RM 60' }] },
    D: { label: 'Healthcare', icon: 'pill' as IconType, total: 70, color: C.blue,
      items: [{ icon: 'pill' as IconType, name: 'Pharmacy', amount: 'RM 28' },
              { icon: 'hospital' as IconType, name: 'Clinic Visit',        amount: 'RM 42' }] },
  },
  kl: {
    name: 'May Family Fund', icon: 'home' as IconType, members: 4, total: 1220,
    A: { label: 'Housing & Utils', icon: 'home' as IconType, total: 480, color: C.cyan,
      items: [{ icon: 'home' as IconType, name: 'Monthly Rent',    amount: 'RM 380' },
              { icon: 'lightbulb' as IconType, name: 'Electric Bill',   amount: 'RM 100' }] },
    B: { label: 'Groceries', icon: 'shopping-cart' as IconType, total: 380, color: C.orange,
      items: [{ icon: 'utensils' as IconType, name: 'Wet Market', amount: 'RM 150' },
              { icon: 'shopping-cart' as IconType, name: '99 Speedmart',  amount: 'RM 90'  },
              { icon: 'milk' as IconType, name: 'Milk & Snacks',  amount: 'RM 140' }] },
    C: { label: 'Education', icon: 'graduation-cap' as IconType, total: 260, color: C.green,
      items: [{ icon: 'graduation-cap' as IconType, name: 'School Fees',   amount: 'RM 140' },
              { icon: 'book' as IconType, name: 'Textbooks',  amount: 'RM 80'  },
              { icon: 'backpack' as IconType, name: 'Uniform & Supplies',       amount: 'RM 40'  }] },
    D: { label: 'Healthcare', icon: 'pill' as IconType, total: 100, color: C.blue,
      items: [{ icon: 'pill' as IconType, name: 'Pharmacy',     amount: 'RM 45' },
              { icon: 'hospital' as IconType, name: 'Clinic Visit',     amount: 'RM 55' }] },
  },
} as const;

// TripId is a runtime string (poolId, or fallback static keys). Using string here
// lets us swap TRIPS_DATA for backend-derived data without TypeScript fights.
type TripId  = string;
type BranchId = 'A' | 'B' | 'C' | 'D';
type Trip = typeof TRIPS_DATA[keyof typeof TRIPS_DATA];

// ─── Fiber generator ──────────────────────────────────────────────────────────
interface FP { d: string; w: number; op: number; dash?: string; col: string }

function mkFibers(
  x1: number, y1: number, cx1: number, cy1: number,
  cx2: number, cy2: number, x2: number, y2: number,
  n: number, spread: number, col: string, colAlt: string,
): FP[] {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;
  return Array.from({ length: n }, (_, i) => {
    const t  = n > 1 ? (i / (n - 1)) * 2 - 1 : 0;
    const o  = t * spread;
    const ta = Math.abs(t);
    const wv1x = Math.sin(i * 1.31) * spread * 0.32;
    const wv1y = Math.cos(i * 0.92) * spread * 0.24;
    const wv2x = Math.cos(i * 1.13) * spread * 0.26;
    const wv2y = Math.sin(i * 0.78) * spread * 0.20;
    const f = (v: number) => +v.toFixed(1);
    const d = [
      `M${f(x1+nx*o)} ${f(y1+ny*o)}`,
      `C${f(cx1+nx*o+wv1x)} ${f(cy1+ny*o+wv1y)}`,
      `${f(cx2+nx*o+wv2x)} ${f(cy2+ny*o+wv2y)}`,
      `${f(x2+nx*o)} ${f(y2+ny*o)}`,
    ].join(' ');
    const ctr = ta < 0.28;
    return {
      d,
      w:    ctr ? 2.2 - ta * 2.0 : 0.4 + (1 - ta) * 0.6,
      op:   ctr ? 0.95 - ta * 0.55 : 0.12 + (1 - ta) * 0.48,
      dash: ta > 0.60 ? (i % 2 ? '4 14' : '2 10') : undefined,
      col:  (i % 6 === 0 || ta < 0.14) ? colAlt : col,
    };
  });
}

// ─── Pre-computed fibers — organic real-tree geometry ─────────────────────────
// Trunk: wide lattice column, tapers from base to fork
const TRK      = mkFibers(201,496, 202,430, 200,370, 201,310, 34, 20, C.trunk,   C.trunkLt);
const TRK_VL   = mkFibers(194,455, 177,428, 160,400, 148,378,  9,  5, C.cyan2,   C.cyan);
const TRK_VR   = mkFibers(208,455, 225,428, 242,400, 254,376,  9,  5, C.blue2,   C.blue);
const TRK_VL2  = mkFibers(196,395, 179,372, 163,350, 152,330,  7,  4, C.cyan2,   C.cyanLt);
const TRK_VR2  = mkFibers(206,393, 223,370, 239,348, 250,328,  7,  4, C.blue2,   C.blueLt);
const TRK_VL3  = mkFibers(198,352, 183,338, 169,324, 158,310,  5, 2.8,C.cyan2,   C.cyanLt);
const TRK_VR3  = mkFibers(204,350, 220,336, 235,322, 246,308,  5, 2.8,C.blue2,   C.blueLt);

// Branch A – CYAN (Accommodation) — sweeps far LEFT then rises
// Lower arc: trunk → elbow (droops outward like real branch)
const BRA_LO   = mkFibers(201,310, 142,322, 72,292, 52,244, 28, 20, C.cyan,  C.cyan2);
// Upper arc: elbow → tip (rises naturally)
const BRA_UP   = mkFibers(52,244, 44,208, 44,165, 52,72, 24, 15, C.cyan,  C.cyanLt);
// Side sub-branches
const BRA_SB1  = mkFibers(68,222, 50,204, 33,183, 20,158,  8,  5, C.cyan,  C.cyanLt);
const BRA_SB2  = mkFibers(48,170, 36,152, 26,133, 17,112,  6, 3.5,C.cyan,  C.cyanLt);
const BRA_SB3  = mkFibers(52,130, 63,118, 74,106, 82,92,   5,  3, C.cyanLt,C.cyan);

// Branch B – ORANGE (Food & Dining) — left-of-center, natural taper
const BRB_LO   = mkFibers(201,310, 185,280, 166,235, 156,192, 22, 14, C.orange, C.orange2);
const BRB_UP   = mkFibers(156,192, 150,158, 148,116, 148,72,  20, 12, C.orange, C.orangeLt);
const BRB_SB1  = mkFibers(165,182, 150,162, 133,142, 118,116,  8,  5, C.orange, C.orangeLt);
const BRB_SB2  = mkFibers(150,142, 161,126, 172,112, 178,96,   5,  3, C.orangeLt,C.orange);

// Branch C – GREEN (Activities) — right-of-center, mirror of B
const BRC_LO   = mkFibers(201,310, 220,280, 244,235, 256,192, 16, 10, C.green, C.green2);
const BRC_UP   = mkFibers(256,192, 262,158, 264,116, 265,72,  14,  9, C.green, C.greenLt);
const BRC_SB1  = mkFibers(249,182, 266,162, 282,142, 298,116,  7,  4, C.green, C.greenLt);
const BRC_SB2  = mkFibers(260,142, 250,126, 240,110, 232,95,   5, 2.5,C.greenLt,C.green);

// Branch D – BLUE (Transport) — sweeps far RIGHT then rises, thinnest
const BRD_LO   = mkFibers(201,310, 262,322, 340,292, 358,244, 11,  8, C.blue, C.blue2);
const BRD_UP   = mkFibers(358,244, 365,210, 364,168, 358,108,  9,  7, C.blue, C.blueLt);
const BRD_SB1  = mkFibers(345,232, 332,212, 316,190, 302,168,  5,  3, C.blue, C.blueLt);

// ─── Particle component ───────────────────────────────────────────────────────
function Particle({ path, col, dur, delay, r }: {
  path: string; col: string; dur: number; delay: number; r: number;
}) {
  return (
    <circle r={r} fill={col} fillOpacity="0">
      <animate attributeName="fillOpacity" values="0;1;1;0"
        keyTimes="0;0.15;0.85;1" dur={`${dur}s`} begin={`${-delay}s`} repeatCount="indefinite" />
      <animateMotion path={path} dur={`${dur}s`} begin={`${-delay}s`} repeatCount="indefinite" />
    </circle>
  );
}

// ─── FG: render fiber group ───────────────────────────────────────────────────
function FG({ fps }: { fps: FP[] }) {
  return (
    <>
      {fps.map((f, i) => (
        <path key={i} d={f.d} stroke={f.col}
          strokeWidth={f.w} strokeOpacity={f.op}
          fill="none" strokeDasharray={f.dash} strokeLinecap="round" />
      ))}
    </>
  );
}

// ─── Diamond (tip cluster detail) ────────────────────────────────────────────
function Diamond({ cx, cy, s, col, delay }: {
  cx: number; cy: number; s: number; col: string; delay: number;
}) {
  const pts  = `${cx},${cy-s} ${cx+s},${cy} ${cx},${cy+s} ${cx-s},${cy}`;
  const pts2 = `${cx},${cy-s*.55} ${cx+s*.55},${cy} ${cx},${cy+s*.55} ${cx-s*.55},${cy}`;
  return (
    <g>
      <polygon points={pts} fill="none" stroke={col} strokeWidth="1.1" opacity="0.88">
        <animate attributeName="opacity" values="0.45;1;0.45" dur="2.4s"
          begin={`${delay}s`} repeatCount="indefinite" />
      </polygon>
      <polygon points={pts2} fill={col} fillOpacity="0.30">
        <animate attributeName="fillOpacity" values="0.15;0.50;0.15" dur="2.4s"
          begin={`${delay}s`} repeatCount="indefinite" />
      </polygon>
    </g>
  );
}

// ─── TipCluster: the node at the end of each branch ──────────────────────────
function TipCluster({ cx, cy, col, glowId, label, delay, focused }: {
  cx: number; cy: number; col: string; glowId: string;
  label: string; delay: number; focused?: boolean;
}) {
  return (
    <g>
      {/* Expanding pulse rings when focused */}
      {focused && (
        <>
          <circle cx={cx} cy={cy} r="22" fill="none" stroke={col} strokeWidth="1.2" strokeOpacity="0.6">
            <animate attributeName="r" values="20;42;20" dur="2s" repeatCount="indefinite" />
            <animate attributeName="strokeOpacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r="32" fill="none" stroke={col} strokeWidth="0.6" strokeOpacity="0.3">
            <animate attributeName="r" values="30;52;30" dur="2.5s" begin="-0.5s" repeatCount="indefinite" />
            <animate attributeName="strokeOpacity" values="0.4;0;0.4" dur="2.5s" begin="-0.5s" repeatCount="indefinite" />
          </circle>
        </>
      )}
      {/* Ambient halo */}
      <ellipse cx={cx} cy={cy} rx={focused ? 32 : 22} ry={focused ? 32 : 22} fill={`url(#${glowId})`}>
        <animate attributeName="opacity" values={focused ? "0.55;1;0.55" : "0.25;0.6;0.25"}
          dur="3.2s" begin={`${delay}s`} repeatCount="indefinite" />
      </ellipse>
      {/* Diamond crystal cluster */}
      <Diamond cx={cx}    cy={cy}    s={focused ? 12 : 9} col={col} delay={delay} />
      <Diamond cx={cx-12} cy={cy+5} s={4.5} col={col} delay={delay+0.35} />
      <Diamond cx={cx+12} cy={cy+5} s={4.5} col={col} delay={delay+0.65} />
      <Diamond cx={cx}   cy={cy-14} s={3.5} col={col} delay={delay+0.90} />
      {/* Core pulsing dot */}
      <circle cx={cx} cy={cy} r="6" fill={col} fillOpacity="0.15" />
      <circle cx={cx} cy={cy} r="4.5" fill={col} fillOpacity="0.55">
        <animate attributeName="r" values={focused ? "4;7;4" : "3.5;5.5;3.5"} dur="2.2s" begin={`${delay}s`} repeatCount="indefinite" />
        <animate attributeName="fillOpacity" values="0.4;0.9;0.4" dur="2.2s" begin={`${delay}s`} repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r="2" fill={col} />
      {/* RM label */}
      <text x={cx} y={cy - 54} textAnchor="middle" fontSize={focused ? 16 : 13}
        fontWeight="800" fill={col} fontFamily="Inter, sans-serif" opacity="0.95"
        filter={focused ? "url(#intensedBloom)" : "url(#bloom)"}
      >{label}</text>
    </g>
  );
}

// ─── DrillDownPanel ───────────────────────────────────────────────────────────
type TripBranch = typeof TRIPS_DATA['langkawi']['A'];

function DrillDownPanel({ branch, onClose }: { branch: TripBranch; onClose: () => void }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 12, left: 8, right: 8,
        background: 'rgba(4, 14, 42, 0.92)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: `1px solid ${branch.color}40`,
        borderTop: `2px solid ${branch.color}`,
        borderRadius: 20,
        padding: '14px 14px 10px',
        zIndex: 30,
        boxShadow: `0 16px 56px rgba(0,0,0,0.7), 0 0 40px ${branch.color}18, inset 0 1px 0 rgba(255,255,255,0.08)`,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 13, flexShrink: 0,
            background: `${branch.color}18`, border: `1.5px solid ${branch.color}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 16px ${branch.color}30`,
          }}>
            <IconComponent type={branch.icon} color={branch.color} size={20} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>{branch.label}</p>
            <p style={{ fontSize: 10, color: 'rgba(190,219,255,0.5)', margin: 0, letterSpacing: '0.3px' }}>
              {branch.items.length} transactions
            </p>
          </div>
        </div>
        <p style={{ fontSize: 22, fontWeight: 900, color: branch.color, margin: 0, textShadow: `0 0 16px ${branch.color}88`, letterSpacing: '-0.5px' }}>
          RM {branch.total.toLocaleString()}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, ${branch.color}70, ${branch.color}20, transparent)`, marginBottom: 8 }} />

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {branch.items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 11, padding: '8px 11px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: `${branch.color}14`, border: `1px solid ${branch.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconComponent type={item.icon} color={branch.color} size={14} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{item.name}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: branch.color, textShadow: `0 0 8px ${branch.color}55` }}>{item.amount}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: branch.color, boxShadow: `0 0 6px ${branch.color}` }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(190,219,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Total</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 900, color: branch.color, textShadow: `0 0 10px ${branch.color}80` }}>
          RM {branch.total.toLocaleString()}
        </span>
      </div>

      <div style={{ marginTop: 7, textAlign: 'center' }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, sans-serif',
        }}>Tap anywhere to dismiss</button>
      </div>
    </div>
  );
}

// ─── Floating Particles ──────────────────────────────────────────────────────
function FloatingParticle({ delay, left, color }: { delay: number; left: string; color: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        bottom: '85%',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}`,
        animation: `floatUp 4s ease-in-out ${delay}s infinite`,
        opacity: 0,
      }}
    />
  );
}

// ─── Interactive Figma Tree Wrapper ──────────────────────────────────────────
function InteractiveFigmaTree({ trip }: { trip: Trip }) {
  const [focused, setFocused] = useState<BranchId | null>(null);
  const [hoveredBranch, setHoveredBranch] = useState<BranchId | null>(null);

  const toggle = (id: BranchId, e: React.MouseEvent) => {
    e.stopPropagation();
    setFocused(prev => prev === id ? null : id);
  };
  const close = () => setFocused(null);

  const branches = [
    { id: 'A' as BranchId, left: '6.5%', top: '15%', color: C.cyan },
    { id: 'B' as BranchId, left: '31.5%', top: '8%', color: C.orange },
    { id: 'C' as BranchId, left: '61.5%', top: '8%', color: C.green },
    { id: 'D' as BranchId, left: '82.5%', top: '15%', color: C.blue },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }} onClick={close}>
      <style>{`
        @keyframes treeEntrance {
          0% { opacity: 0; transform: scale(0.85) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes treeBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 15px var(--glow-color), 0 0 30px var(--glow-color), inset 0 0 10px var(--glow-color);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 25px var(--glow-color), 0 0 50px var(--glow-color), inset 0 0 15px var(--glow-color);
            transform: scale(1.15);
          }
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { opacity: 0; transform: translateY(-350px) scale(1.2); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .tree-container {
          animation: treeEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), treeBreathe 6s ease-in-out 0.8s infinite;
        }
        .branch-hotspot {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .branch-hotspot:hover {
          transform: scale(1.2);
        }
        .branch-hotspot::before {
          content: '';
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--glow-color) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .branch-hotspot:hover::before {
          opacity: 0.4;
          animation: pulseGlow 2s ease-in-out infinite;
        }
        .branch-hotspot::after {
          content: '';
          position: absolute;
          inset: -20px;
          border: 2px solid var(--glow-color);
          border-radius: 50%;
          opacity: 0;
        }
        .branch-hotspot:hover::after {
          animation: ringPulse 1.5s ease-out infinite;
        }
        .trunk-glow {
          position: absolute;
          bottom: 5%;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 200px;
          background: linear-gradient(180deg,
            rgba(0, 229, 255, 0.3) 0%,
            rgba(0, 229, 255, 0.1) 50%,
            transparent 100%
          );
          filter: blur(20px);
          animation: treeBreathe 4s ease-in-out infinite;
          pointer-events: none;
        }
        .shimmer-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
          pointer-events: none;
          mix-blend-mode: overlay;
        }
      `}</style>

      {/* Trunk glow effect */}
      <div className="trunk-glow" />

      {/* Shimmer overlay */}
      <div className="shimmer-overlay" />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <FloatingParticle
          key={i}
          delay={i * 0.4}
          left={`${15 + (i * 6)}%`}
          color={[C.cyan, C.orange, C.green, C.blue][i % 4]}
        />
      ))}

      {/* Tree with entrance animation */}
      <div className="tree-container" style={{ width: '100%', height: '100%' }}>
        <FigmaTree />
      </div>

      {/* Clickable areas over each branch icon */}
      {branches.map((branch) => (
        <div
          key={branch.id}
          onClick={(e) => toggle(branch.id, e)}
          onMouseEnter={() => setHoveredBranch(branch.id)}
          onMouseLeave={() => setHoveredBranch(null)}
          className="branch-hotspot"
          style={{
            position: 'absolute',
            left: branch.left,
            top: branch.top,
            width: '12%',
            height: '12%',
            cursor: 'pointer',
            zIndex: 10,
            borderRadius: '50%',
            '--glow-color': branch.color,
          } as React.CSSProperties}
        >
          {/* Pulsing ring when hovered */}
          {hoveredBranch === branch.id && (
            <div
              style={{
                position: 'absolute',
                inset: '-15px',
                borderRadius: '50%',
                border: `3px solid ${branch.color}`,
                animation: 'pulseGlow 1.5s ease-in-out infinite',
                boxShadow: `0 0 20px ${branch.color}, inset 0 0 20px ${branch.color}`,
              }}
            />
          )}
        </div>
      ))}

      {/* Drill-down panel with slide-in animation */}
      {focused && (
        <div
          style={{
            animation: 'slideInDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <style>{`
            @keyframes slideInDown {
              0% { opacity: 0; transform: translateY(-30px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <DrillDownPanel
            branch={trip[focused]}
            onClose={close}
          />
        </div>
      )}
    </div>
  );
}

// ─── CyberBotanicalTree (kept for reference, not currently rendered) ─────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CyberBotanicalTree({ trip }: { trip: Trip }) {
  const [focused, setFocused] = useState<BranchId | null>(null);

  const toggle = (id: BranchId, e: React.MouseEvent) => {
    e.stopPropagation();
    setFocused(prev => prev === id ? null : id);
  };
  const close = () => setFocused(null);

  const op  = (id: BranchId) => (focused === null || focused === id ? 1 : 0.13);
  const flt = (id: BranchId) =>
    focused === id ? 'url(#intensedBloom)' : focused ? 'url(#bokehBlur)' : 'url(#bloom)';

  // Particle paths matching the new organic geometry
  const pTrunk = 'M201 496 C202 430 200 370 201 310';
  const pA1    = 'M201 310 C142 322 72 292 52 244';
  const pA2    = 'M52 244 C44 208 44 165 52 72';
  const pA3    = 'M68 222 C50 204 33 183 20 158';
  const pB1    = 'M201 310 C185 280 166 235 156 192';
  const pB2    = 'M156 192 C150 158 148 116 148 72';
  const pC1    = 'M201 310 C220 280 244 235 256 192';
  const pC2    = 'M256 192 C262 158 264 116 265 72';
  const pD1    = 'M201 310 C262 322 340 292 358 244';
  const pD2    = 'M358 244 C365 210 364 168 358 108';

  const css = `
    @keyframes treeBreathe {
      0%,100% { opacity: 0.80; }
      50%      { opacity: 1.00; }
    }
    .brA { animation: treeBreathe 3.4s 0.0s ease-in-out infinite; }
    .brB { animation: treeBreathe 3.9s 0.6s ease-in-out infinite; }
    .brC { animation: treeBreathe 3.6s 1.2s ease-in-out infinite; }
    .brD { animation: treeBreathe 4.2s 1.8s ease-in-out infinite; }
    .trk { animation: treeBreathe 4.5s 0.3s ease-in-out infinite; }
    @keyframes intensePulse {
      0%,100% { filter: drop-shadow(0 0 6px currentColor) brightness(1); }
      50%      { filter: drop-shadow(0 0 18px currentColor) brightness(1.25); }
    }
    .focused-branch { animation: intensePulse 2.2s ease-in-out infinite; }
  `;

  return (
    <div style={{ position: 'relative' }} onClick={close}>
      <svg viewBox="0 -35 402 540" width="402" height="535" style={{ display: 'block', overflow: 'visible' }}>
        <style>{css}</style>
        <defs>
          <filter id="bloom" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b2" />
            <feMerge><feMergeNode in="b2" /><feMergeNode in="b1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="intensedBloom" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5"  result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="b2" />
            <feMerge><feMergeNode in="b2" /><feMergeNode in="b1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="bokehBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>

          {([['gA',C.cyan],['gB',C.orange],['gC',C.green],['gD',C.blue],['gTr',C.trunkLt]] as [string,string][]).map(([id,col]) => (
            <radialGradient key={id} id={id} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={col} stopOpacity="0.7" />
              <stop offset="100%" stopColor={col} stopOpacity="0"   />
            </radialGradient>
          ))}
        </defs>

        {/* Ground glow */}
        <ellipse cx="201" cy="494" rx="60" ry="18" fill="url(#gTr)" opacity="0.55" />
        <ellipse cx="201" cy="496" rx="35" ry="10" fill={C.trunkLt} fillOpacity="0.12" />

        {/* Dimming veil when focused */}
        {focused && (
          <rect x="0" y="-35" width="402" height="540" fill="rgba(2,8,28,0.56)" style={{ pointerEvents: 'none' }} />
        )}

        {/* ── TRUNK ── */}
        <g filter="url(#softGlow)" className="trk">
          <FG fps={TRK} />
          <FG fps={TRK_VL}  /><FG fps={TRK_VR}  />
          <FG fps={TRK_VL2} /><FG fps={TRK_VR2} />
          <FG fps={TRK_VL3} /><FG fps={TRK_VR3} />
          {/* Lattice cross-members on trunk */}
          <g stroke={C.trunkLt} strokeWidth="0.7" fill="none" opacity="0.75">
            <path d="M188 495 Q194 405 198 310" />
            <path d="M194 495 Q182 405 200 310" />
            <path d="M201 495 Q208 405 201 310" />
            <path d="M208 495 Q222 405 204 310" />
            <path d="M214 495 Q206 405 198 310" />
            <path d="M188 495 L208 452 L194 405 L204 358 L198 310" />
            <path d="M214 495 L192 452 L206 405 L196 358 L204 310" />
            <path d="M194 495 L203 470 L191 432 L200 385 L196 340 L201 310" />
            <path d="M208 495 L197 470 L209 432 L197 385 L204 340 L198 310" />
            {/* Horizontal lattice rings */}
            {[460, 428, 395, 362, 335, 310].map((y, i) => {
              const r = 8 - i * 0.8;
              return <ellipse key={y} cx="201" cy={y} rx={r} ry="2.5" fill="none" stroke={C.trunkLt} strokeWidth="0.5" opacity="0.5" />;
            })}
          </g>
        </g>

        {/* ── BRANCH A – CYAN (Accommodation) ── */}
        <g
          style={{ opacity: op('A'), transition: 'opacity 0.35s ease', cursor: 'pointer', filter: focused && focused !== 'A' ? "url(#bokehBlur)" : undefined }}
          onClick={e => toggle('A', e)}
        >
          <rect x="0" y="30" width="130" height="290" fill="transparent" />
          <g filter={flt('A')} className={`brA ${focused === 'A' ? 'focused-branch' : ''}`}>
            <FG fps={BRA_LO} />
            <FG fps={BRA_UP} />
            <FG fps={BRA_SB1} />
            <FG fps={BRA_SB2} />
            <FG fps={BRA_SB3} />
            {/* Organic bark detail lines */}
            <g stroke={C.cyan} strokeWidth="0.55" fill="none" opacity="0.7">
              <path d="M148 318 Q108 310 72 292 Q46 278 52 244" />
              <path d="M155 312 Q115 318 78 300 Q50 284 52 244" />
              <path d="M52 244 Q40 218 44 185 Q46 155 52 115 Q52 95 52 72" />
              <path d="M52 244 Q35 215 30 185 Q25 155 20 120" />
              <path d="M70 230 Q55 215 45 195 Q38 175 42 155" />
            </g>
          </g>
        </g>

        {/* ── BRANCH B – ORANGE (Food & Dining) ── */}
        <g
          style={{ opacity: op('B'), transition: 'opacity 0.35s ease', cursor: 'pointer', filter: focused && focused !== 'B' ? "url(#bokehBlur)" : undefined }}
          onClick={e => toggle('B', e)}
        >
          <rect x="100" y="30" width="120" height="290" fill="transparent" />
          <g filter={flt('B')} className={`brB ${focused === 'B' ? 'focused-branch' : ''}`}>
            <FG fps={BRB_LO} />
            <FG fps={BRB_UP} />
            <FG fps={BRB_SB1} />
            <FG fps={BRB_SB2} />
            <g stroke={C.orange} strokeWidth="0.55" fill="none" opacity="0.7">
              <path d="M190 308 Q178 280 166 242 Q158 210 156 175 Q152 138 148 72" />
              <path d="M196 308 Q188 275 172 238 Q162 208 160 172 Q154 134 148 72" />
              <path d="M156 192 Q146 168 140 148 Q132 128 120 110" />
              <path d="M156 155 Q164 140 172 122 Q178 106 178 90" />
            </g>
          </g>
        </g>

        {/* ── BRANCH C – GREEN (Activities) ── */}
        <g
          style={{ opacity: op('C'), transition: 'opacity 0.35s ease', cursor: 'pointer', filter: focused && focused !== 'C' ? "url(#bokehBlur)" : undefined }}
          onClick={e => toggle('C', e)}
        >
          <rect x="195" y="30" width="120" height="290" fill="transparent" />
          <g filter={flt('C')} className={`brC ${focused === 'C' ? 'focused-branch' : ''}`}>
            <FG fps={BRC_LO} />
            <FG fps={BRC_UP} />
            <FG fps={BRC_SB1} />
            <FG fps={BRC_SB2} />
            <g stroke={C.green} strokeWidth="0.55" fill="none" opacity="0.7">
              <path d="M214 308 Q226 280 240 242 Q250 210 256 175 Q260 138 265 72" />
              <path d="M208 308 Q218 275 234 238 Q246 208 252 172 Q258 134 265 72" />
              <path d="M256 192 Q268 168 276 148 Q284 128 298 110" />
              <path d="M260 155 Q252 140 244 122 Q238 106 234 90" />
            </g>
          </g>
        </g>

        {/* ── BRANCH D – BLUE (Transport) ── */}
        <g
          style={{ opacity: op('D'), transition: 'opacity 0.35s ease', cursor: 'pointer', filter: focused && focused !== 'D' ? "url(#bokehBlur)" : undefined }}
          onClick={e => toggle('D', e)}
        >
          <rect x="285" y="30" width="117" height="290" fill="transparent" />
          <g filter={flt('D')} className={`brD ${focused === 'D' ? 'focused-branch' : ''}`}>
            <FG fps={BRD_LO} />
            <FG fps={BRD_UP} />
            <FG fps={BRD_SB1} />
            <g stroke={C.blue} strokeWidth="0.55" fill="none" opacity="0.7">
              <path d="M254 316 Q298 318 340 296 Q360 282 358 244" />
              <path d="M248 310 Q292 322 334 300 Q356 286 358 244" />
              <path d="M358 244 Q366 218 365 185 Q364 155 358 120 Q358 115 358 108" />
              <path d="M345 232 Q334 214 318 194 Q304 176 302 162" />
            </g>
          </g>
        </g>

        {/* ── Particles: trunk ── */}
        <g style={{ opacity: focused ? 0.25 : 1, transition: 'opacity 0.4s' }}>
          {[0,1,2,3].map(i => <Particle key={`tr${i}`} path={pTrunk} col={C.trunkLt} dur={4.5} delay={i*1.1} r={1.3}/>)}
        </g>

        {/* ── Particles: Branch A ── */}
        <g style={{ opacity: focused && focused !== 'A' ? 0.15 : 1, transition: 'opacity 0.4s' }}>
          {[0,1,2,3,4].map(i => <Particle key={`pA1${i}`} path={pA1} col={C.cyan}   dur={3.2} delay={i*0.64} r={focused==='A'?2:1.6}/>)}
          {[0,1,2,3].map(i =>   <Particle key={`pA2${i}`} path={pA2} col={C.cyanLt} dur={2.8} delay={i*0.70} r={focused==='A'?1.5:1.1}/>)}
          {[0,1].map(i =>       <Particle key={`pA3${i}`} path={pA3} col={C.cyan}   dur={2.2} delay={i*1.1}  r={0.9}/>)}
        </g>

        {/* ── Particles: Branch B ── */}
        <g style={{ opacity: focused && focused !== 'B' ? 0.15 : 1, transition: 'opacity 0.4s' }}>
          {[0,1,2,3].map(i => <Particle key={`pB1${i}`} path={pB1} col={C.orange}   dur={3.5} delay={i*0.88} r={focused==='B'?1.8:1.4}/>)}
          {[0,1,2].map(i =>   <Particle key={`pB2${i}`} path={pB2} col={C.orangeLt} dur={2.9} delay={i*0.96} r={focused==='B'?1.3:0.9}/>)}
        </g>

        {/* ── Particles: Branch C ── */}
        <g style={{ opacity: focused && focused !== 'C' ? 0.15 : 1, transition: 'opacity 0.4s' }}>
          {[0,1,2].map(i => <Particle key={`pC1${i}`} path={pC1} col={C.green}   dur={3.0} delay={i*1.0}  r={focused==='C'?1.7:1.3}/>)}
          {[0,1].map(i =>   <Particle key={`pC2${i}`} path={pC2} col={C.greenLt} dur={2.6} delay={i*1.3}  r={focused==='C'?1.2:0.9}/>)}
        </g>

        {/* ── Particles: Branch D ── */}
        <g style={{ opacity: focused && focused !== 'D' ? 0.15 : 1, transition: 'opacity 0.4s' }}>
          {[0,1].map(i => <Particle key={`pD1${i}`} path={pD1} col={C.blue}   dur={4.0} delay={i*2.0}  r={focused==='D'?1.5:1.1}/>)}
          {[0,1].map(i => <Particle key={`pD2${i}`} path={pD2} col={C.blueLt} dur={3.2} delay={i*1.6}  r={focused==='D'?1.2:0.8}/>)}
        </g>

        {/* ── Branch tip icon nodes ── */}
        {/* Node A */}
        <g style={{ opacity: op('A'), transition: 'opacity 0.35s', pointerEvents: 'none', filter: focused && focused !== 'A' ? "url(#bokehBlur)" : undefined }}>
          <g transform="translate(52, 72)">
            <circle cx="0" cy="0" r="28" fill="url(#gA)" opacity="0.7" filter="url(#intensedBloom)"/>
          </g>
          <TipCluster cx={52} cy={72} col={C.cyan} glowId="gA" label={`RM ${trip.A.total}`} delay={0} focused={focused==='A'}/>
          <g transform="translate(52, 34)">
            <circle cx="0" cy="0" r="16" fill="#0A1628" stroke={C.cyan} strokeWidth="1.8" filter="url(#intensedBloom)"/>
            <foreignObject x="-8" y="-8" width="16" height="16">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Home size={12} color={C.cyan} strokeWidth={2} />
              </div>
            </foreignObject>
          </g>
        </g>

        {/* Node B */}
        <g style={{ opacity: op('B'), transition: 'opacity 0.35s', pointerEvents: 'none', filter: focused && focused !== 'B' ? "url(#bokehBlur)" : undefined }}>
          <g transform="translate(148, 72)">
            <circle cx="0" cy="0" r="26" fill="url(#gB)" opacity="0.7" filter="url(#intensedBloom)"/>
          </g>
          <TipCluster cx={148} cy={72} col={C.orange} glowId="gB" label={`RM ${trip.B.total}`} delay={0.5} focused={focused==='B'}/>
          <g transform="translate(148, 34)">
            <circle cx="0" cy="0" r="16" fill="#0A1628" stroke={C.orange} strokeWidth="1.8" filter="url(#intensedBloom)"/>
            <foreignObject x="-8" y="-8" width="16" height="16">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Utensils size={12} color={C.orange} strokeWidth={2} />
              </div>
            </foreignObject>
          </g>
        </g>

        {/* Node C */}
        <g style={{ opacity: op('C'), transition: 'opacity 0.35s', pointerEvents: 'none', filter: focused && focused !== 'C' ? "url(#bokehBlur)" : undefined }}>
          <g transform="translate(265, 72)">
            <circle cx="0" cy="0" r="24" fill="url(#gC)" opacity="0.7" filter="url(#intensedBloom)"/>
          </g>
          <TipCluster cx={265} cy={72} col={C.green} glowId="gC" label={`RM ${trip.C.total}`} delay={1.0} focused={focused==='C'}/>
          <g transform="translate(265, 34)">
            <circle cx="0" cy="0" r="16" fill="#0A1628" stroke={C.green} strokeWidth="1.8" filter="url(#intensedBloom)"/>
            <foreignObject x="-8" y="-8" width="16" height="16">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <GraduationCap size={12} color={C.green} strokeWidth={2} />
              </div>
            </foreignObject>
          </g>
        </g>

        {/* Node D */}
        <g style={{ opacity: op('D'), transition: 'opacity 0.35s', pointerEvents: 'none', filter: focused && focused !== 'D' ? "url(#bokehBlur)" : undefined }}>
          <g transform="translate(358, 108)">
            <circle cx="0" cy="0" r="22" fill="url(#gD)" opacity="0.7" filter="url(#intensedBloom)"/>
          </g>
          <TipCluster cx={358} cy={108} col={C.blue} glowId="gD" label={`RM ${trip.D.total}`} delay={1.5} focused={focused==='D'}/>
          <g transform="translate(358, 70)">
            <circle cx="0" cy="0" r="16" fill="#0A1628" stroke={C.blue} strokeWidth="1.8" filter="url(#intensedBloom)"/>
            <foreignObject x="-8" y="-8" width="16" height="16">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Activity size={12} color={C.blue} strokeWidth={2} />
              </div>
            </foreignObject>
          </g>
        </g>

        {/* ── Sub-branch RM labels (dimmed when focused) ── */}
        <g filter="url(#softGlow)" style={{ opacity: focused ? 0.18 : 1, transition: 'opacity 0.4s', pointerEvents: 'none' }}>
          {/* A tendril labels */}
          <path d="M62 215 Q44 200 28 188" stroke={C.cyan} strokeWidth="0.6" fill="none" />
          <circle cx="28" cy="188" r="2" fill={C.cyan} />
          <text x="20" y="183" textAnchor="middle" fontSize="8" fontWeight="800" fill={C.cyan} opacity="0.9" fontFamily="Inter,sans-serif">RM 150</text>

          <path d="M44 165 Q30 150 18 138" stroke={C.cyanLt} strokeWidth="0.5" fill="none" />
          <circle cx="18" cy="138" r="1.6" fill={C.cyanLt} />
          <text x="10" y="133" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={C.cyanLt} opacity="0.8" fontFamily="Inter,sans-serif">RM 50</text>

          {/* B tendril labels */}
          <path d="M156 178 Q140 162 126 148" stroke={C.orange} strokeWidth="0.6" fill="none" />
          <circle cx="126" cy="148" r="2" fill={C.orange} />
          <text x="115" y="142" textAnchor="middle" fontSize="8" fontWeight="800" fill={C.orange} opacity="0.9" fontFamily="Inter,sans-serif">RM 100</text>

          <path d="M158 148 Q168 134 177 120" stroke={C.orangeLt} strokeWidth="0.5" fill="none" />
          <circle cx="177" cy="120" r="1.6" fill={C.orangeLt} />
          <text x="186" y="115" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={C.orangeLt} opacity="0.8" fontFamily="Inter,sans-serif">RM 180</text>

          {/* C tendril labels */}
          <path d="M258 178 Q274 162 290 148" stroke={C.green} strokeWidth="0.6" fill="none" />
          <circle cx="290" cy="148" r="2" fill={C.green} />
          <text x="300" y="142" textAnchor="middle" fontSize="8" fontWeight="800" fill={C.green} opacity="0.9" fontFamily="Inter,sans-serif">RM 120</text>

          <path d="M258 148 Q248 134 240 120" stroke={C.greenLt} strokeWidth="0.5" fill="none" />
          <circle cx="240" cy="120" r="1.6" fill={C.greenLt} />
          <text x="234" y="114" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={C.greenLt} opacity="0.8" fontFamily="Inter,sans-serif">RM 80</text>

          {/* D tendril label */}
          <path d="M344 220 Q328 204 312 190" stroke={C.blue} strokeWidth="0.6" fill="none" />
          <circle cx="312" cy="190" r="2" fill={C.blue} />
          <text x="304" y="184" textAnchor="middle" fontSize="8" fontWeight="800" fill={C.blue} opacity="0.9" fontFamily="Inter,sans-serif">RM 80</text>
        </g>

        {/* Tap hint */}
        {!focused && (
          <text x="201" y="492" textAnchor="middle" fontSize="9" fontWeight="600"
            fill="rgba(190,219,255,0.35)" fontFamily="Inter,sans-serif" letterSpacing="0.6">
            Tap a branch to explore
          </text>
        )}

        {/* Fork junction node */}
        <g style={{ pointerEvents: 'none', opacity: focused ? 0.45 : 1, transition: 'all 0.4s' }}>
          <circle cx="201" cy="310" r="10" fill={C.trunkLt} fillOpacity="0.15" />
          <circle cx="201" cy="310" r="6"  fill={C.trunkLt} fillOpacity="0.6">
            <animate attributeName="r" values="4.5;7;4.5" dur="2.8s" repeatCount="indefinite" />
            <animate attributeName="fillOpacity" values="0.4;0.9;0.4" dur="2.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="201" cy="310" r="2.5" fill={C.trunkLt} />
        </g>
      </svg>

      {/* Drill-down panel */}
      {focused && (
        <DrillDownPanel
          branch={trip[focused]}
          onClose={close}
        />
      )}
    </div>
  );
}

// ─── Wallet Icon ──────────────────────────────────────────────────────────────
function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d={svgPaths.p35625ff0} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d={svgPaths.p2532d00}  stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Trip Selector Dropdown ───────────────────────────────────────────────────
function TripSelector({
  tripId,
  trips,
  onSelect,
}: {
  tripId: TripId;
  trips: { id: TripId; data: Trip }[];
  onSelect: (id: TripId) => void;
}) {
  const [open, setOpen] = useState(false);
  const trip = trips.find((t) => t.id === tripId)?.data ?? trips[0]?.data ?? TRIPS_DATA.langkawi;
  const allTrips: [TripId, Trip][] = trips.map((t) => [t.id, t.data]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          margin: '14px 20px 0', padding: '13px 16px',
          background: 'rgba(255,255,255,0.04)', border: `0.8px solid ${open ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', transition: 'border-color 0.2s',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(0,229,255,0.15) 0%, rgba(0,100,255,0.05) 100%)',
            border: '0.8px solid rgba(0,229,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconComponent type={trip.icon} color={C.cyan} size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '0.2px' }}>{trip.name}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="rgba(0,229,255,0.7)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3" />
              </svg>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(219,234,254,0.45)', margin: 0, letterSpacing: '0.4px' }}>
              {trip.members} Members • Transparent Pool
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#EFCD01', textShadow: '0 0 14px rgba(239,205,1,0.4)' }}>
            RM {trip.total.toLocaleString()}
          </span>
          <p style={{ fontSize: 9, color: 'rgba(190,219,255,0.4)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Spent</p>
        </div>
      </div>

      {/* Dropdown list */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 20, right: 20, zIndex: 50,
          marginTop: 4,
          background: 'rgba(6,16,44,0.97)',
          backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(0,229,255,0.25)',
          borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.75), 0 0 30px rgba(0,229,255,0.08)',
          overflow: 'hidden',
        }}>
          {allTrips.map(([id, t], idx) => (
            <div
              key={id}
              onClick={() => { onSelect(id); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                background: id === tripId ? 'rgba(0,229,255,0.08)' : 'transparent',
                borderBottom: idx < allTrips.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComponent type={t.icon} color={id === tripId ? C.cyan : '#fff'} size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: id === tripId ? C.cyan : '#fff' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(190,219,255,0.4)' }}>{t.members} members</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: id === tripId ? C.cyan : 'rgba(255,255,255,0.7)' }}>
                  RM {t.total.toLocaleString()}
                </div>
                {id === tripId && (
                  <div style={{ fontSize: 9, color: C.cyan, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CategoryRow: expandable ──────────────────────────────────────────────────
const BRANCH_IDS: BranchId[] = ['A', 'B', 'C', 'D'];

function CategoryRow({ branchId, branch, tripTotal, expanded, onToggle }: {
  branchId: BranchId;
  branch: TripBranch;
  tripTotal: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const total = branch.items.reduce((s, it) => {
    const n = parseFloat(it.amount.replace('RM ', ''));
    return s + (isNaN(n) ? 0 : n);
  }, 0);
  const denom = tripTotal > 0 ? tripTotal : 1;
  const pct = Math.round((branch.total / denom) * 100);

  return (
    <div style={{ marginBottom: 6 }}>
      {/* Main row */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 14px', borderRadius: expanded ? '12px 12px 0 0' : 12,
          background: expanded ? `${branch.color}12` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${expanded ? branch.color + '30' : 'rgba(255,255,255,0.06)'}`,
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: `${branch.color}14`,
            border: `1.5px solid ${expanded ? branch.color + '50' : branch.color + '25'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: expanded ? `0 0 12px ${branch.color}30` : 'none',
            transition: 'all 0.2s',
          }}>
            <IconComponent type={branch.icon} color={branch.color} size={18} />
          </div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: expanded ? '#fff' : 'rgba(255,255,255,0.85)' }}>
              {branch.label}
            </span>
            <div style={{ fontSize: 9, color: 'rgba(190,219,255,0.4)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {branch.items.length} transactions
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: expanded ? branch.color : '#fff' }}>
              RM {branch.total.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(190,219,255,0.45)' }}>{pct}%</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', flexShrink: 0 }}>
            <path d="M4 6L8 10L12 6" stroke={expanded ? branch.color : 'rgba(190,219,255,0.5)'}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          background: `${branch.color}08`,
          border: `1px solid ${branch.color}20`,
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
        }}>
          {/* Progress bar */}
          <div style={{ padding: '8px 14px 4px' }}>
            <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct * 1.6}%`, background: `linear-gradient(90deg, ${branch.color}, ${branch.color}88)`,
                borderRadius: 99, transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
          {/* Item rows */}
          {branch.items.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px',
              borderTop: i === 0 ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: `${branch.color}14`, border: `1px solid ${branch.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconComponent type={item.icon} color={branch.color} size={13} />
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{item.name}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: branch.color }}>{item.amount}</span>
            </div>
          ))}
          {/* Subtotal */}
          <div style={{
            padding: '8px 14px 10px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 9, color: 'rgba(190,219,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Subtotal</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: branch.color, textShadow: `0 0 8px ${branch.color}60` }}>
              RM {branch.total.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Category mapping (backend enum → 4 visual branches) ─────────────────────
type CategoryKey =
  | 'ACCOMMODATION' | 'TRANSPORT' | 'FOOD' | 'ACTIVITIES' | 'SHOPPING'
  | 'TOLL' | 'PETROL' | 'OTHER_TRIP' | 'RENT' | 'UTILITIES' | 'GROCERIES'
  | 'EDUCATION' | 'MEDICAL' | 'INSURANCE' | 'CHILDCARE' | 'OTHER_FAMILY';

function categoryToBranch(cat: string): BranchId {
  switch (cat) {
    case 'RENT':
    case 'UTILITIES':
    case 'ACCOMMODATION':
      return 'A';
    case 'GROCERIES':
    case 'FOOD':
      return 'B';
    case 'EDUCATION':
    case 'CHILDCARE':
    case 'ACTIVITIES':
      return 'C';
    case 'MEDICAL':
    case 'INSURANCE':
    case 'TRANSPORT':
    case 'PETROL':
    case 'TOLL':
    case 'SHOPPING':
    case 'OTHER_TRIP':
    case 'OTHER_FAMILY':
    default:
      return 'D';
  }
}

const CATEGORY_LABEL: Record<string, string> = {
  ACCOMMODATION: 'Accommodation', TRANSPORT: 'Transport', FOOD: 'Food',
  ACTIVITIES: 'Activities', SHOPPING: 'Shopping', TOLL: 'Toll', PETROL: 'Petrol',
  OTHER_TRIP: 'Other (Trip)', RENT: 'Rent', UTILITIES: 'Utilities',
  GROCERIES: 'Groceries', EDUCATION: 'Education', MEDICAL: 'Medical',
  INSURANCE: 'Insurance', CHILDCARE: 'Childcare', OTHER_FAMILY: 'Other',
};

const CATEGORY_ICON: Record<string, IconType> = {
  RENT: 'home', UTILITIES: 'lightbulb', ACCOMMODATION: 'home',
  GROCERIES: 'shopping-cart', FOOD: 'utensils',
  EDUCATION: 'graduation-cap', CHILDCARE: 'backpack', ACTIVITIES: 'book',
  MEDICAL: 'pill', INSURANCE: 'pill', TRANSPORT: 'home',
  PETROL: 'home', TOLL: 'home', SHOPPING: 'shopping-cart',
  OTHER_TRIP: 'home', OTHER_FAMILY: 'home',
};

const BRANCH_META: Record<BranchId, { label: string; icon: IconType; color: string }> = {
  A: { label: 'Housing & Utils', icon: 'home',           color: C.cyan   },
  B: { label: 'Groceries & Food', icon: 'shopping-cart', color: C.orange },
  C: { label: 'Education',       icon: 'graduation-cap', color: C.green  },
  D: { label: 'Health & Other',  icon: 'pill',           color: C.blue   },
};

interface PoolSpend {
  id: string;
  title: string;
  amount: number;
  category: string;
}

function buildTripFromBackend(
  poolName: string,
  memberCount: number,
  executedSpends: PoolSpend[],
): Trip {
  const buckets: Record<BranchId, { total: number; items: { icon: IconType; name: string; amount: string }[] }> = {
    A: { total: 0, items: [] },
    B: { total: 0, items: [] },
    C: { total: 0, items: [] },
    D: { total: 0, items: [] },
  };
  for (const sr of executedSpends) {
    const b = categoryToBranch(sr.category);
    buckets[b].total += sr.amount;
    buckets[b].items.push({
      icon: CATEGORY_ICON[sr.category] ?? 'home',
      name: sr.title || CATEGORY_LABEL[sr.category] || sr.category,
      amount: `RM ${sr.amount.toFixed(0)}`,
    });
  }
  const total = buckets.A.total + buckets.B.total + buckets.C.total + buckets.D.total;
  return {
    name: poolName,
    icon: 'home',
    members: memberCount,
    total,
    A: { ...BRANCH_META.A, total: buckets.A.total, items: buckets.A.items },
    B: { ...BRANCH_META.B, total: buckets.B.total, items: buckets.B.items },
    C: { ...BRANCH_META.C, total: buckets.C.total, items: buckets.C.items },
    D: { ...BRANCH_META.D, total: buckets.D.total, items: buckets.D.items },
  } as Trip;
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function AnalyticsDashboard() {
  const poolsQ = usePools();
  const backendPools = poolsQ.data ?? [];

  const [tripId, setTripId] = useState<TripId>('');
  const [expandedCat, setExpanded] = useState<BranchId | null>(null);

  // Pick the first pool once it loads, unless the user already chose one.
  useEffect(() => {
    if (!tripId && backendPools.length > 0) {
      setTripId(backendPools[0].id);
    }
  }, [tripId, backendPools]);

  // Live data for the selected pool.
  const activePool = backendPools.find((p) => p.id === tripId);
  const analyticsQ = usePoolAnalytics(activePool?.id);
  const spendQ = useSpendRequests(activePool?.id);
  const executedSpends: PoolSpend[] = (spendQ.data ?? [])
    .filter((s) => s.status === 'EXECUTED')
    .map((s) => ({
      id: s.id,
      title: s.title,
      amount: Number(s.amount),
      category: s.category,
    }));

  // Build the per-pool trip shape from API data, or fall back to a placeholder
  // when the user has no pools yet so the tree still renders.
  const trips: { id: TripId; data: Trip }[] = backendPools.length === 0
    ? Object.entries(TRIPS_DATA).map(([id, data]) => ({ id, data: data as Trip }))
    : backendPools.map((p) => {
        const memberCount = p.members?.filter((m) => m.isActive).length ?? 0;
        const isActive = p.id === tripId;
        const built = buildTripFromBackend(
          p.name,
          memberCount,
          isActive ? executedSpends : [],
        );
        return { id: p.id, data: built };
      });

  const fallback: Trip = TRIPS_DATA.langkawi;
  const trip: Trip = trips.find((t) => t.id === tripId)?.data ?? trips[0]?.data ?? fallback;

  // AI budget limit comes from the pool target if defined, else best-effort.
  const aiBudget = activePool?.targetAmount
    ? `RM ${Number(activePool.targetAmount).toLocaleString()}`
    : 'RM —';

  // Spent total prefers the analytics endpoint (authoritative server-side aggregate).
  const spentTotal = analyticsQ.data?.totals.spentTotal
    ? Number(analyticsQ.data.totals.spentTotal)
    : trip.total;

  const toggleCat = (id: BranchId) => setExpanded(prev => prev === id ? null : id);

  return (
    <div style={{ background: '#050C18', fontFamily: 'Inter, sans-serif', minHeight: '100%', overflowX: 'hidden' }}>

      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 28px 0', height: 44 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: '-0.24px' }}>12:30</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="17" height="11" viewBox="0 0 17 10.667" fill="white"><path d={svgPaths.p26d17600} fill="white" /></svg>
          <svg width="16" height="11" viewBox="0 0 15.333 11" fill="white"><path d={svgPaths.p39712400} fill="white" /></svg>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ border: '1px solid rgba(255,255,255,0.4)', borderRadius: 2.5, width: 22, height: 11, display: 'flex', alignItems: 'center', paddingLeft: 2 }}>
              <div style={{ background: 'white', borderRadius: 1.2, width: 17, height: 7 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '24px 20px 0 20px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.75px', lineHeight: '36px' }}>Analytics</h1>
        <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(190,219,255,0.55)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
          AI FAMILY ADVISOR
        </p>
      </div>

      {/* Trip Selector */}
      <TripSelector tripId={tripId} trips={trips} onSelect={setTripId} />

      {/* Tree */}
      <div style={{ margin: '4px -2px 0', overflow: 'hidden', position: 'relative', height: '420px' }}>
        <InteractiveFigmaTree trip={trip} />
      </div>

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 8, margin: '8px 20px' }}>
        {[
          { label: 'Total Spent',     value: `RM ${spentTotal.toLocaleString()}`, IconComp: DollarSign },
          { label: 'AI Budget Limit', value: aiBudget, IconComp: Bot },
        ].map(card => (
          <div key={card.label} style={{
            flex: 1, padding: '12px 14px',
            background: 'rgba(255,255,255,0.04)', border: '0.8px solid rgba(255,255,255,0.09)',
            borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
            <div style={{ marginBottom: 6 }}>
              <card.IconComp size={18} color="#EFCD01" strokeWidth={2} />
            </div>
            <div style={{ fontSize: 9, color: 'rgba(190,219,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 3 }}>{card.label}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#EFCD01', letterSpacing: '-0.4px' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div style={{ margin: '4px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>Category Breakdown</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(0,229,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Tap to expand
          </span>
        </div>

        {BRANCH_IDS.map(id => (
          <CategoryRow
            key={id}
            branchId={id}
            branch={trip[id]}
            tripTotal={trip.total}
            expanded={expandedCat === id}
            onToggle={() => toggleCat(id)}
          />
        ))}
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}
