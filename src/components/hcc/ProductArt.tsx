/**
 * Presentation-only product illustrations for the H.C.C. shop.
 * Each drawing is chosen from the real catalogue entry (slot / mining kind /
 * tier) — no per-item hardcoding, no game logic, no invented stats.
 */
import type { Item } from "@/lib/hcc/types";
import { cn } from "@/lib/utils";

export type ArtTone = "cyan" | "green" | "amber" | "red" | "violet";

const STROKE: Record<ArtTone, string> = {
  cyan: "var(--hud-cyan)",
  green: "var(--hud-green)",
  amber: "var(--hud-amber)",
  red: "var(--hud-red)",
  violet: "var(--hud-violet)",
};

type ArtProps = { c: string; tier: number };

const body = "var(--background)";
const panel = "rgba(255,255,255,0.04)";

/* ---------- individual hardware drawings ---------- */

const Cpu = ({ c, tier }: ArtProps) => (
  <g>
    {[...Array(8)].map((_, i) => (
      <g key={i}>
        <rect x={22 + i * 8} y={16} width={3} height={8} fill={c} opacity={0.6} />
        <rect x={22 + i * 8} y={96} width={3} height={8} fill={c} opacity={0.6} />
        <rect x={16} y={22 + i * 8} width={8} height={3} fill={c} opacity={0.6} />
        <rect x={96} y={22 + i * 8} width={8} height={3} fill={c} opacity={0.6} />
      </g>
    ))}
    <rect x={24} y={24} width={72} height={72} rx={4} fill={body} stroke={c} strokeWidth={1.6} />
    <rect x={38} y={38} width={44} height={44} rx={2} fill={panel} stroke={c} strokeWidth={1} opacity={0.9} />
    {[...Array(Math.min(4, tier))].map((_, i) => (
      <rect key={i} x={44} y={45 + i * 8} width={32} height={3} fill={c} opacity={0.45} />
    ))}
    <circle cx={31} cy={31} r={2} fill={c} />
  </g>
);

const Gpu = ({ c, tier }: ArtProps) => (
  <g>
    <rect x={10} y={38} width={100} height={44} rx={3} fill={body} stroke={c} strokeWidth={1.6} />
    <rect x={14} y={42} width={92} height={36} rx={2} fill={panel} />
    {[...Array(Math.max(1, Math.min(3, tier - 1)))].map((_, i) => (
      <g key={i}>
        <circle cx={30 + i * 28} cy={60} r={13} fill="none" stroke={c} strokeWidth={1.3} />
        <circle cx={30 + i * 28} cy={60} r={4} fill={c} opacity={0.5} />
        <path
          d={`M ${30 + i * 28} 49 A 11 11 0 0 1 ${41 + i * 28} 60`}
          fill="none"
          stroke={c}
          strokeWidth={1}
          opacity={0.7}
        />
      </g>
    ))}
    <rect x={10} y={82} width={34} height={7} fill={c} opacity={0.55} />
    <rect x={96} y={30} width={6} height={10} fill={c} opacity={0.7} />
  </g>
);

const Ram = ({ c, tier }: ArtProps) => (
  <g>
    {[...Array(Math.max(1, Math.min(3, tier)))].map((_, i) => (
      <g key={i} transform={`translate(${i * 14 - (Math.min(3, tier) - 1) * 7} 0)`}>
        <rect x={26} y={30} width={68} height={60} rx={2} fill={body} stroke={c} strokeWidth={1.4} />
        <rect x={32} y={38} width={24} height={16} rx={1} fill={panel} stroke={c} strokeWidth={0.8} />
        <rect x={62} y={38} width={24} height={16} rx={1} fill={panel} stroke={c} strokeWidth={0.8} />
        <rect x={32} y={62} width={54} height={4} fill={c} opacity={0.4} />
        {[...Array(9)].map((_, k) => (
          <rect key={k} x={30 + k * 7} y={84} width={4} height={6} fill={c} opacity={0.6} />
        ))}
      </g>
    ))}
  </g>
);

const Storage = ({ c, tier }: ArtProps) => (
  <g>
    <rect x={18} y={34} width={84} height={52} rx={3} fill={body} stroke={c} strokeWidth={1.6} />
    <circle cx={60} cy={60} r={19} fill="none" stroke={c} strokeWidth={1.2} opacity={0.9} />
    <circle cx={60} cy={60} r={5} fill={c} opacity={0.5} />
    <path d="M 78 44 L 88 52 L 70 66" fill="none" stroke={c} strokeWidth={1.4} opacity={0.85} />
    {[...Array(Math.min(4, tier))].map((_, i) => (
      <rect key={i} x={24} y={40 + i * 6} width={10} height={3} fill={c} opacity={0.5} />
    ))}
  </g>
);

const Cooling = ({ c, tier }: ArtProps) => (
  <g>
    {tier >= 3 ? (
      <>
        <rect x={14} y={30} width={92} height={44} rx={3} fill={body} stroke={c} strokeWidth={1.5} />
        {[...Array(14)].map((_, i) => (
          <line key={i} x1={18 + i * 6.4} y1={34} x2={18 + i * 6.4} y2={70} stroke={c} strokeWidth={0.9} opacity={0.45} />
        ))}
        <path d="M 20 78 q 20 16 40 0 q 20 -16 40 0" fill="none" stroke={c} strokeWidth={1.6} opacity={0.8} />
        <circle cx={30} cy={94} r={7} fill="none" stroke={c} strokeWidth={1.2} />
        <circle cx={90} cy={94} r={7} fill="none" stroke={c} strokeWidth={1.2} />
      </>
    ) : (
      <>
        <rect x={22} y={22} width={76} height={76} rx={4} fill={body} stroke={c} strokeWidth={1.5} />
        <circle cx={60} cy={60} r={30} fill="none" stroke={c} strokeWidth={1} opacity={0.6} />
        {[...Array(7)].map((_, i) => (
          <path
            key={i}
            d="M 60 60 q 16 -8 26 -2 q -8 12 -26 2 z"
            fill={c}
            opacity={0.28}
            transform={`rotate(${i * 51.4} 60 60)`}
          />
        ))}
        <circle cx={60} cy={60} r={8} fill={body} stroke={c} strokeWidth={1.2} />
      </>
    )}
  </g>
);

const Psu = ({ c, tier }: ArtProps) => (
  <g>
    <rect x={16} y={32} width={88} height={56} rx={3} fill={body} stroke={c} strokeWidth={1.6} />
    <circle cx={44} cy={60} r={18} fill="none" stroke={c} strokeWidth={1.1} opacity={0.7} />
    {[...Array(6)].map((_, i) => (
      <line
        key={i}
        x1={44}
        y1={60}
        x2={44 + Math.cos((i * Math.PI) / 3) * 18}
        y2={60 + Math.sin((i * Math.PI) / 3) * 18}
        stroke={c}
        strokeWidth={0.9}
        opacity={0.5}
      />
    ))}
    <path d="M 82 46 L 74 62 h 8 l -6 14" fill="none" stroke={c} strokeWidth={1.8} />
    <rect x={70} y={82} width={30} height={4} fill={c} opacity={0.35 + Math.min(4, tier) * 0.1} />
  </g>
);

const Monitors = ({ c, tier }: ArtProps) => {
  const n = Math.max(1, Math.min(3, tier - 1));
  return (
    <g>
      {[...Array(n)].map((_, i) => {
        const w = n === 1 ? 72 : n === 2 ? 46 : 34;
        const gap = 4;
        const total = n * w + (n - 1) * gap;
        const x = 60 - total / 2 + i * (w + gap);
        const rot = n === 3 ? (i - 1) * 12 : 0;
        return (
          <g key={i} transform={`rotate(${rot} 60 60)`}>
            <rect x={x} y={30} width={w} height={w * 0.62} rx={2} fill={body} stroke={c} strokeWidth={1.4} />
            <rect x={x + 3} y={33} width={w - 6} height={w * 0.62 - 6} fill={c} opacity={0.14} />
            {[...Array(4)].map((_, k) => (
              <rect key={k} x={x + 6} y={38 + k * 6} width={w - 16 - k * 3} height={1.6} fill={c} opacity={0.55} />
            ))}
          </g>
        );
      })}
      <rect x={54} y={78} width={12} height={12} fill={c} opacity={0.4} />
      <rect x={40} y={90} width={40} height={4} rx={2} fill={c} opacity={0.55} />
    </g>
  );
};

const RouterArt = ({ c, tier }: ArtProps) => (
  <g>
    <rect x={18} y={62} width={84} height={26} rx={5} fill={body} stroke={c} strokeWidth={1.5} />
    {[...Array(Math.max(2, Math.min(5, tier + 1)))].map((_, i, a) => (
      <line
        key={i}
        x1={30 + i * (60 / Math.max(1, a.length - 1))}
        y1={62}
        x2={24 + i * (72 / Math.max(1, a.length - 1))}
        y2={26}
        stroke={c}
        strokeWidth={1.6}
      />
    ))}
    {[...Array(4)].map((_, i) => (
      <circle key={i} cx={30 + i * 12} cy={80} r={2.2} fill={c} opacity={0.7} />
    ))}
    <path d="M 78 40 a 14 14 0 0 1 12 12" fill="none" stroke={c} strokeWidth={1.2} opacity={0.6} />
  </g>
);

const Desk = ({ c, tier }: ArtProps) => (
  <g>
    <path d="M 12 56 L 108 56 L 96 66 L 24 66 Z" fill={panel} stroke={c} strokeWidth={1.5} />
    <line x1={26} y1={66} x2={26} y2={98} stroke={c} strokeWidth={1.8} />
    <line x1={94} y1={66} x2={94} y2={98} stroke={c} strokeWidth={1.8} />
    {tier >= 3 && <rect x={30} y={74} width={60} height={4} fill={c} opacity={0.35} />}
    {tier >= 2 && <rect x={40} y={38} width={40} height={16} rx={2} fill={body} stroke={c} strokeWidth={1.1} />}
  </g>
);

const Chair = ({ c, tier }: ArtProps) => (
  <g>
    <rect x={40} y={20} width={40} height={44} rx={8} fill={body} stroke={c} strokeWidth={1.5} />
    <rect x={46} y={28} width={28} height={4} fill={c} opacity={0.4} />
    <rect x={34} y={64} width={52} height={12} rx={4} fill={body} stroke={c} strokeWidth={1.4} />
    <line x1={60} y1={76} x2={60} y2={90} stroke={c} strokeWidth={2} />
    <path d="M 40 100 L 60 90 L 80 100" fill="none" stroke={c} strokeWidth={1.6} />
    {tier >= 3 && <path d="M 34 40 h -8 M 86 40 h 8" stroke={c} strokeWidth={1.6} />}
  </g>
);

const Lighting = ({ c, tier }: ArtProps) => (
  <g>
    <rect x={20} y={26} width={80} height={8} rx={4} fill={c} opacity={0.75} />
    {[...Array(Math.max(2, Math.min(5, tier + 1)))].map((_, i, a) => (
      <path
        key={i}
        d={`M ${28 + i * (64 / (a.length - 1 || 1))} 34 L ${18 + i * (84 / (a.length - 1 || 1))} 96`}
        stroke={c}
        strokeWidth={1.1}
        opacity={0.28}
      />
    ))}
    <ellipse cx={60} cy={96} rx={42} ry={7} fill={c} opacity={0.18} />
  </g>
);

const Deskmat = ({ c, tier }: ArtProps) => (
  <g>
    <path d="M 14 52 L 106 52 L 92 88 L 28 88 Z" fill={panel} stroke={c} strokeWidth={1.5} />
    {[...Array(Math.min(4, tier + 1))].map((_, i) => (
      <path
        key={i}
        d={`M ${22 + i * 6} ${58 + i * 6} L ${98 - i * 6} ${58 + i * 6}`}
        stroke={c}
        strokeWidth={0.9}
        opacity={0.35}
      />
    ))}
  </g>
);

const Poster = ({ c, tier }: ArtProps) => (
  <g>
    <rect x={28} y={20} width={64} height={82} rx={2} fill={body} stroke={c} strokeWidth={1.5} />
    <circle cx={60} cy={50} r={16} fill="none" stroke={c} strokeWidth={1.3} opacity={0.8} />
    <path d="M 44 50 h 32 M 60 34 v 32" stroke={c} strokeWidth={0.9} opacity={0.5} />
    {[...Array(Math.min(4, tier + 1))].map((_, i) => (
      <rect key={i} x={38} y={76 + i * 6} width={44 - i * 8} height={2.4} fill={c} opacity={0.45} />
    ))}
  </g>
);

const Palette = ({ c, tier }: ArtProps) => (
  <g>
    <path
      d="M 60 20 a 40 40 0 1 0 0 80 a 10 10 0 0 0 0 -20 a 10 10 0 0 1 0 -20 h 12 a 28 28 0 0 0 -12 -40 z"
      fill={panel}
      stroke={c}
      strokeWidth={1.5}
    />
    {[...Array(Math.min(4, tier + 1))].map((_, i) => (
      <circle key={i} cx={42 + i * 12} cy={40 + (i % 2) * 14} r={4.5} fill={c} opacity={0.3 + i * 0.15} />
    ))}
  </g>
);

const Badge = ({ c, tier }: ArtProps) => (
  <g>
    <path d="M 60 18 L 96 32 v 30 q 0 26 -36 42 Q 24 88 24 62 V 32 Z" fill={body} stroke={c} strokeWidth={1.6} />
    <path d="M 60 30 L 84 40 v 22 q 0 18 -24 30 Q 36 80 36 62 V 40 Z" fill={panel} opacity={0.7} />
    {[...Array(Math.min(5, tier))].map((_, i) => (
      <circle key={i} cx={60} cy={52 + i * 9} r={2.6} fill={c} opacity={0.75} />
    ))}
  </g>
);

const Asic = ({ c, tier }: ArtProps) => (
  <g>
    <rect x={18} y={26} width={84} height={68} rx={3} fill={body} stroke={c} strokeWidth={1.6} />
    <circle cx={44} cy={60} r={17} fill="none" stroke={c} strokeWidth={1.2} />
    <circle cx={44} cy={60} r={4} fill={c} opacity={0.5} />
    {[...Array(12)].map((_, i) => (
      <line key={i} x1={70} y1={34 + i * 5} x2={96} y2={34 + i * 5} stroke={c} strokeWidth={0.9} opacity={0.4} />
    ))}
    {[...Array(Math.min(4, tier))].map((_, i) => (
      <circle key={i} cx={24 + i * 6} cy={90} r={1.8} fill={c} opacity={0.8} />
    ))}
  </g>
);

const Shelf = ({ c, tier }: ArtProps) => (
  <g>
    <rect x={20} y={18} width={80} height={84} rx={2} fill="none" stroke={c} strokeWidth={1.6} />
    {[...Array(Math.max(2, Math.min(4, tier + 1)))].map((_, i, a) => (
      <g key={i}>
        <line x1={20} y1={18 + ((i + 1) * 84) / (a.length + 1)} x2={100} y2={18 + ((i + 1) * 84) / (a.length + 1)} stroke={c} strokeWidth={1.2} />
        <rect
          x={28}
          y={22 + (i * 84) / (a.length + 1)}
          width={64}
          height={10}
          fill={c}
          opacity={0.18}
        />
      </g>
    ))}
  </g>
);

const FarmCooler = ({ c, tier }: ArtProps) => (
  <g>
    <rect x={24} y={22} width={72} height={76} rx={3} fill={body} stroke={c} strokeWidth={1.6} />
    {[...Array(Math.max(2, Math.min(3, tier)))].map((_, i, a) => (
      <g key={i}>
        <circle cx={60} cy={22 + ((i + 0.5) * 76) / a.length} r={16} fill="none" stroke={c} strokeWidth={1.1} />
        {[...Array(5)].map((_, k) => (
          <path
            key={k}
            d={`M 60 ${22 + ((i + 0.5) * 76) / a.length} q 10 -6 15 -1 q -6 8 -15 1 z`}
            fill={c}
            opacity={0.25}
            transform={`rotate(${k * 72} 60 ${22 + ((i + 0.5) * 76) / a.length})`}
          />
        ))}
      </g>
    ))}
  </g>
);

const Contract = ({ c, tier }: ArtProps) => (
  <g>
    <rect x={28} y={16} width={64} height={88} rx={3} fill={body} stroke={c} strokeWidth={1.5} />
    <path d="M 64 32 L 50 62 h 12 l -6 26 22 -34 H 66 z" fill={c} opacity={0.6} stroke={c} strokeWidth={1} />
    {[...Array(Math.min(4, tier + 1))].map((_, i) => (
      <rect key={i} x={38} y={88 - i * 0} width={0} height={0} fill="none" />
    ))}
    <rect x={38} y={92} width={44} height={2.4} fill={c} opacity={0.4} />
    <rect x={38} y={24} width={30} height={2.4} fill={c} opacity={0.4} />
  </g>
);

const Tool = ({ c, tier }: ArtProps) => (
  <g>
    <rect x={20} y={30} width={80} height={60} rx={4} fill={body} stroke={c} strokeWidth={1.5} />
    <rect x={26} y={36} width={68} height={40} fill={c} opacity={0.1} />
    <path d="M 32 68 l 10 -14 l 8 8 l 12 -20 l 10 16 l 8 -8" fill="none" stroke={c} strokeWidth={1.5} />
    {[...Array(Math.min(4, tier))].map((_, i) => (
      <rect key={i} x={30 + i * 10} y={82} width={6} height={3} fill={c} opacity={0.6} />
    ))}
  </g>
);

const Perk = ({ c, tier }: ArtProps) => (
  <g>
    <circle cx={60} cy={60} r={34} fill="none" stroke={c} strokeWidth={1.5} />
    <circle cx={60} cy={60} r={26} fill={panel} stroke={c} strokeWidth={0.9} opacity={0.8} />
    {[...Array(Math.max(3, Math.min(6, tier + 2)))].map((_, i, a) => (
      <line
        key={i}
        x1={60 + Math.cos((i / a.length) * Math.PI * 2) * 26}
        y1={60 + Math.sin((i / a.length) * Math.PI * 2) * 26}
        x2={60 + Math.cos((i / a.length) * Math.PI * 2) * 34}
        y2={60 + Math.sin((i / a.length) * Math.PI * 2) * 34}
        stroke={c}
        strokeWidth={1.4}
      />
    ))}
    <path d="M 48 60 l 8 9 l 17 -19" fill="none" stroke={c} strokeWidth={2} />
  </g>
);

/* ---------- selector ---------- */

function drawingFor(it: Item): (p: ArtProps) => JSX.Element {
  if (it.slot) {
    switch (it.slot) {
      case "cpu":
        return Cpu;
      case "gpu":
        return Gpu;
      case "ram":
        return Ram;
      case "storage":
        return Storage;
      case "cooling":
        return Cooling;
      case "psu":
        return Psu;
      case "monitors":
        return Monitors;
      case "router":
        return RouterArt;
      case "desk":
        return Desk;
      case "chair":
        return Chair;
      case "lighting":
        return Lighting;
      case "deskmat":
        return Deskmat;
      case "poster":
        return Poster;
      case "badge":
        return Badge;
      default:
        return Palette;
    }
  }
  switch (it.mining?.kind) {
    case "asic":
      return Asic;
    case "gpu":
      return Gpu;
    case "shelf":
      return Shelf;
    case "cooler":
      return FarmCooler;
    case "contract":
      return Contract;
    default:
      break;
  }
  return it.category === "perks" ? Perk : Tool;
}

/**
 * Renders the illustration for a catalogue item. Display only.
 */
export default function ProductArt({
  item,
  tone = "cyan",
  className,
}: {
  item: Item;
  tone?: ArtTone;
  className?: string;
}) {
  const Draw = drawingFor(item);
  const c = STROKE[tone];
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn("h-full w-full", className)}
      role="img"
      aria-label={item.name}
      style={{ filter: `drop-shadow(0 0 10px ${c}55)` }}
    >
      <ellipse cx={60} cy={106} rx={40} ry={6} fill={c} opacity={0.14} />
      <Draw c={c} tier={item.tier} />
    </svg>
  );
}
