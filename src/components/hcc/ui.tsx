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
        <header className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <span className="text-[10px] tracking-[0.22em] text-hud-cyan/80">{label}</span>
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
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", color)}
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
    cyan: "border-hud-cyan/45 text-hud-cyan hover:bg-hud-cyan/12",
    green: "border-hud-green/45 text-hud-green hover:bg-hud-green/12",
    amber: "border-hud-amber/45 text-hud-amber hover:bg-hud-amber/12",
    red: "border-hud-red/45 text-hud-red hover:bg-hud-red/12",
    ghost: "border-border text-muted-foreground hover:bg-secondary",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-md border bg-background/40 tracking-[0.14em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-35",
        size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3 py-2 text-[11px]",
        tones[tone],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Chip({ children, tone = "dim" }: { children: ReactNode; tone?: "dim" | "cyan" | "green" | "amber" | "red" }) {
  const tones: Record<string, string> = {
    dim: "border-border text-muted-foreground",
    cyan: "border-hud-cyan/40 text-hud-cyan",
    green: "border-hud-green/40 text-hud-green",
    amber: "border-hud-amber/40 text-hud-amber",
    red: "border-hud-red/40 text-hud-red",
  };
  return (
    <span className={cn("rounded border px-1.5 py-0.5 text-[9px] tracking-[0.16em] uppercase", tones[tone])}>
      {children}
    </span>
  );
}
