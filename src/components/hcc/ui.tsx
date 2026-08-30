import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  label,
  right,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  right?: ReactNode;
}) {
  return (
    <section className={cn("panel relative overflow-hidden", className)}>
      {label && (
        <header className="flex items-center justify-between border-b border-hud-cyan/15 px-3 py-2">
          <h2 className="text-[10px] tracking-[0.24em] text-hud-cyan/90">{label}</h2>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Bar({
  value,
  tone = "cyan",
  className,
}: {
  value: number;
  tone?: "cyan" | "green" | "amber" | "red" | "violet";
  className?: string;
}) {
  const color =
    tone === "green"
      ? "bg-hud-green"
      : tone === "amber"
        ? "bg-hud-amber"
        : tone === "red"
          ? "bg-hud-red"
          : tone === "violet"
            ? "bg-hud-violet"
            : "bg-hud-cyan";

  return (
    <div className={cn("bar-track h-1.5 w-full", className)}>
      <div
        className={cn("bar-fill", color)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "cyan",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "cyan" | "green" | "amber" | "red" | "violet";
}) {
  const color =
    tone === "green"
      ? "text-hud-green"
      : tone === "amber"
        ? "text-hud-amber"
        : tone === "red"
          ? "text-hud-red"
          : tone === "violet"
            ? "text-hud-violet"
            : "text-hud-cyan";
  return (
    <div className="min-w-0">
      <div className="text-[9px] tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={cn("truncate text-sm font-semibold tabular-nums", color)}>{value}</div>
      {hint && <div className="truncate text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function HudButton({
  children,
  onClick,
  disabled,
  tone = "cyan",
  className,
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "cyan" | "green" | "amber" | "red" | "ghost";
  className?: string;
  size?: "sm" | "md";
}) {
  const tones: Record<string, string> = {
    cyan: "border-hud-cyan/50 text-hud-cyan hover:bg-hud-cyan/15 hover:shadow-[0_0_20px_-6px] hover:shadow-hud-cyan/40",
    green: "border-hud-green/50 text-hud-green hover:bg-hud-green/15 hover:shadow-[0_0_20px_-6px] hover:shadow-hud-green/40",
    amber: "border-hud-amber/50 text-hud-amber hover:bg-hud-amber/15",
    red: "border-hud-red/50 text-hud-red hover:bg-hud-red/15",
    ghost: "border-border text-muted-foreground hover:bg-secondary",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-md border bg-background/50 tracking-[0.14em] uppercase transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-35 active:scale-[0.98]",
        size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3 py-2 text-[11px]",
        tones[tone],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Chip({
  children,
  tone = "dim",
}: {
  children: ReactNode;
  tone?: "dim" | "cyan" | "green" | "amber" | "red";
}) {
  const tones: Record<string, string> = {
    dim: "border-border text-muted-foreground",
    cyan: "border-hud-cyan/45 text-hud-cyan",
    green: "border-hud-green/45 text-hud-green",
    amber: "border-hud-amber/45 text-hud-amber",
    red: "border-hud-red/45 text-hud-red",
  };
  return (
    <span className={cn("rounded border px-1.5 py-0.5 text-[9px] tracking-[0.16em] uppercase", tones[tone])}>
      {children}
    </span>
  );
}

export function Sparkline({
  values,
  className,
  up = true,
}: {
  values: readonly number[];
  className?: string;
  up?: boolean;
}) {
  if (values.length < 2) return <div className={className} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 92 - 4;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const stroke = up ? "var(--hud-green, #39ff9e)" : "var(--hud-red, #ff3355)";
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className} aria-hidden>
      <polyline
        points={`0,100 ${pts.join(" ")} 100,100`}
        fill={stroke}
        fillOpacity="0.12"
        stroke="none"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
