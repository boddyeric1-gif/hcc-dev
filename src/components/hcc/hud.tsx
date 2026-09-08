/**
 * Presentation-only HUD primitives for the H.C.C. console reskin.
 * These components hold NO game logic — every value they render is passed in
 * by a screen that reads the existing H.C.C. state.
 */
import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type HudTone = "cyan" | "green" | "amber" | "red" | "violet";

const TEXT: Record<HudTone, string> = {
  cyan: "text-hud-cyan",
  green: "text-hud-green",
  amber: "text-hud-amber",
  red: "text-hud-red",
  violet: "text-hud-violet",
};

const BORDER: Record<HudTone, string> = {
  cyan: "border-hud-cyan/35",
  green: "border-hud-green/35",
  amber: "border-hud-amber/35",
  red: "border-hud-red/40",
  violet: "border-hud-violet/35",
};

const FILL: Record<HudTone, string> = {
  cyan: "bg-hud-cyan",
  green: "bg-hud-green",
  amber: "bg-hud-amber",
  red: "bg-hud-red",
  violet: "bg-hud-violet",
};

/** Decorative window controls, matching the reference's floating panels. */
function WindowGlyphs({ tone = "cyan" }: { tone?: HudTone }) {
  return (
    <span className={cn("flex items-center gap-1.5 opacity-60", TEXT[tone])} aria-hidden>
      <span className="h-px w-2 bg-current" />
      <span className="h-2 w-2 border border-current" />
      <span className="relative h-2 w-2">
        <span className="absolute inset-x-0 top-1/2 h-px rotate-45 bg-current" />
        <span className="absolute inset-x-0 top-1/2 h-px -rotate-45 bg-current" />
      </span>
    </span>
  );
}

/** Floating operator window: title bar, technical marks, bracketed frame. */
export function TerminalWindow({
  title,
  subtitle,
  right,
  tone = "cyan",
  className,
  bodyClassName,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  tone?: HudTone;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("panel bracket-frame relative overflow-hidden", className)}>
      <header className="panel-titlebar flex items-center gap-2 px-3 py-2">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", FILL[tone], "shadow-[0_0_8px_0] shadow-current/60")} />
        <h2 className={cn("truncate text-[10px] tracking-[0.24em]", TEXT[tone])}>{title}</h2>
        {subtitle && (
          <span className="hidden min-w-0 truncate text-[9px] tracking-[0.18em] text-muted-foreground sm:inline">
            {subtitle}
          </span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {right}
          <WindowGlyphs tone={tone} />
        </div>
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Vertical column gauge (OPERATION STATUS in the reference). */
export function Gauge({
  label,
  pct,
  readout,
  caption,
  tone = "cyan",
}: {
  label: string;
  pct: number;
  readout: string;
  caption?: string;
  tone?: HudTone;
}) {
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <span className="truncate text-[8px] tracking-[0.2em] text-muted-foreground">{label}</span>
      <div className={cn("relative h-24 w-7 overflow-hidden rounded-sm border bg-background/60", BORDER[tone])}>
        <div
          className={cn("absolute inset-x-0 bottom-0 transition-[height] duration-500", FILL[tone])}
          style={{ height: `${v}%`, boxShadow: "0 0 18px -2px currentColor" }}
        />
        <div className="pointer-events-none absolute inset-0 scanlines opacity-40" aria-hidden />
      </div>
      <span className={cn("text-sm font-semibold tabular-nums", TEXT[tone])}>{readout}</span>
      {caption && <span className="text-center text-[8px] tracking-[0.16em] text-muted-foreground">{caption}</span>}
    </div>
  );
}

/** Small technical spec row used on product cards and hardware bays. */
export function TechSpec({ label, value, tone = "cyan" }: { label: string; value: string; tone?: HudTone }) {
  return (
    <div className="leading-tight">
      <div className="text-[7px] tracking-[0.18em] text-muted-foreground/80">{label}</div>
      <div className={cn("text-[9px] font-semibold tabular-nums", TEXT[tone])}>{value}</div>
    </div>
  );
}

/** Bordered spec block that floats over a product visual. */
export function SpecBlock({ specs }: { specs: readonly { label: string; value: string }[] }) {
  if (specs.length === 0) return null;
  return (
    <div className="pointer-events-none absolute right-1.5 top-1.5 z-10 space-y-1 rounded-sm border border-hud-cyan/25 bg-background/85 px-1.5 py-1 backdrop-blur-sm">
      {specs.map((s) => (
        <TechSpec key={s.label} label={s.label} value={s.value} />
      ))}
    </div>
  );
}

/**
 * Procedural hardware plate — an isometric lit slab behind a glyph.
 * Purely decorative framing for a real catalogue item.
 */
export function HardwarePlate({
  glyph,
  tone = "cyan",
  tier,
}: {
  glyph: ReactNode;
  tone?: HudTone;
  tier: number;
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className={cn("absolute bottom-5 h-8 w-28 rounded-[50%] blur-xl opacity-70", FILL[tone])}
        style={{ opacity: 0.18 + Math.min(4, tier) * 0.07 }}
        aria-hidden
      />
      <div className="relative" style={{ transform: "rotateX(52deg) rotateZ(-45deg)" }}>
        <div className={cn("h-16 w-16 border bg-gradient-to-br from-secondary to-background/80", BORDER[tone])} />
        <div className={cn("absolute -bottom-1.5 -left-1.5 h-16 w-16 border-b-2 border-l-2", BORDER[tone])} />
      </div>
      <div className={cn("absolute inset-0 flex items-center justify-center", TEXT[tone])}>{glyph}</div>
    </div>
  );
}

/** Alert window (HEAT INDICATOR in the reference). */
export function StatusWindow({
  title,
  tone,
  headline,
  pct,
  note,
}: {
  title: string;
  tone: HudTone;
  headline: string;
  pct: number;
  note?: string;
}) {
  const segments = 22;
  const lit = Math.round((Math.max(0, Math.min(100, pct)) / 100) * segments);
  return (
    <div className={cn("rounded-md border bg-background/80 p-2.5 backdrop-blur-sm", BORDER[tone])}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-[9px] tracking-[0.24em]", TEXT[tone])}>{title}</span>
        <WindowGlyphs tone={tone} />
      </div>
      <p className={cn("mt-1.5 text-[11px] tracking-[0.14em]", TEXT[tone])}>{headline}</p>
      <div className="mt-1.5 flex h-4 items-end gap-[2px]" aria-hidden>
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            className={cn("flex-1 rounded-[1px]", i < lit ? FILL[tone] : "bg-border/60")}
            style={{ height: `${45 + (i / segments) * 55}%` }}
          />
        ))}
      </div>
      {note && <p className="mt-1.5 text-[9px] tracking-[0.16em] text-muted-foreground">{note}</p>}
    </div>
  );
}

/** Live UTC clock for the console header. Display only. */
export function ConsoleClock({ className }: { className?: string }) {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
    setT(fmt());
    const id = window.setInterval(() => setT(fmt()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  if (!t) return null;
  return (
    <span className={cn("tabular-nums", className)}>
      {t} <span className="text-muted-foreground">GMT</span>
    </span>
  );
}
