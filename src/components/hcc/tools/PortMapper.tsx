import { useMemo, useState } from "react";

import { HudButton, Panel } from "../ui";
import { buildPorts, mulberry } from "@/lib/hcc/puzzles";
import type { OpDifficulty } from "@/lib/hcc/puzzles";
import { audio } from "@/lib/hcc/audio";
import { cn } from "@/lib/utils";
import type { Target } from "@/lib/hcc/types";

export default function PortMapper({
  target,
  diff,
  seed,
  onDone,
  onFlash,
}: {
  target: Target;
  diff: OpDifficulty;
  seed: number;
  onDone: (success: boolean) => void;
  onFlash?: (f: "ok" | "fail" | null) => void;
}) {
  const map = useMemo(
    () => buildPorts(mulberry(seed), diff.grid, diff.liveServices, diff.portFloor),
    [seed, diff.grid, diff.liveServices, diff.portFloor],
  );
  const ports = map.cells;
  const [opened, setOpened] = useState<number[]>([]);
  const [used, setUsed] = useState(0);
  const [ping, setPing] = useState<number | null>(null);
  const found = opened.filter((i) => ports[i]?.live).length;
  const win = found >= diff.liveServices;
  const out = !win && used >= diff.probes;

  const probe = (i: number) => {
    if (opened.includes(i) || out || win) return;
    setPing(i);
    window.setTimeout(() => setPing(null), 700);
    setOpened((o) => [...o, i]);
    setUsed((u) => u + 1);
    audio.sfx(ports[i]?.live ? "ok" : "click");
  };

  // polar layout around a radar ring — same cells/rules as the original grid
  const nodes = ports.map((p, i) => {
    const angle = -Math.PI / 2 + (i / ports.length) * Math.PI * 2;
    const ring = 0.62 + (i % 3) * 0.08;
    return {
      i,
      p,
      x: 50 + Math.cos(angle) * ring * 42,
      y: 50 + Math.sin(angle) * ring * 42,
    };
  });

  return (
    <Panel label="PORT MAPPER — PERIMETER" className="p-3">
      <p className="mb-2 text-xs text-muted-foreground">
        Probe the perimeter of {target.host}. Each port prints its signal strength. A port is live when its
        signal is <span className="text-hud-cyan">{map.floor} or higher</span> — that&apos;s the whole rule. Tap the
        strong ones, skip the weak ones.
      </p>

      <div className="mb-3 flex flex-wrap gap-2 text-[10px] tracking-[0.16em]">
        <span className="rounded border border-hud-cyan/30 bg-hud-cyan/5 px-2 py-1 text-hud-cyan">
          SIGNAL FLOOR {map.floor}
        </span>
        <span className="rounded border border-border px-2 py-1 text-muted-foreground">
          SERVICES {found}/{diff.liveServices}
        </span>
        <span className="rounded border border-border px-2 py-1 text-muted-foreground">
          PROBES {Math.max(0, diff.probes - used)}/{diff.probes}
        </span>
      </div>

      {/* radar visuals — mechanics match original grid */}
      <div className="relative mx-auto mb-3 aspect-square w-full max-w-[320px]">
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
          {[18, 30, 42].map((r) => (
            <circle
              key={r}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="color-mix(in oklch, var(--hud-cyan) 22%, transparent)"
              strokeWidth="0.35"
            />
          ))}
          <line
            x1="50"
            y1="8"
            x2="50"
            y2="92"
            stroke="color-mix(in oklch, var(--hud-cyan) 12%, transparent)"
            strokeWidth="0.3"
          />
          <line
            x1="8"
            y1="50"
            x2="92"
            y2="50"
            stroke="color-mix(in oklch, var(--hud-cyan) 12%, transparent)"
            strokeWidth="0.3"
          />
          {!win && !out && (
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="10"
              stroke="color-mix(in oklch, var(--hud-cyan) 45%, transparent)"
              strokeWidth="0.5"
              style={{ transformOrigin: "50px 50px", animation: "hcc-sweep-rot 4s linear infinite" }}
            />
          )}
          <circle cx="50" cy="50" r="2.2" fill="var(--hud-cyan)" opacity="0.85" />
          <text x="50" y="54" textAnchor="middle" fontSize="3.2" fill="var(--hud-cyan)" opacity="0.7">
            {target.host.slice(0, 12)}
          </text>
        </svg>

        {nodes.map(({ i, p, x, y }) => {
          const isOpen = opened.includes(i);
          const isPing = ping === i;
          // original rule: signal is always readable so you can judge before probing
          const aboveFloor = p.signal >= map.floor;
          return (
            <button
              key={p.num}
              type="button"
              disabled={isOpen || out || win}
              onClick={() => probe(i)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={cn(
                "absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border text-[9px] tabular-nums transition-all duration-300",
                !isOpen &&
                  aboveFloor &&
                  "border-hud-cyan/45 bg-hud-cyan/10 text-hud-cyan hover:border-hud-cyan/70",
                !isOpen &&
                  !aboveFloor &&
                  "border-border/70 bg-background/80 text-muted-foreground hover:border-border",
                isOpen && p.live && "border-hud-green/70 bg-hud-green/20 text-hud-green text-glow scale-110",
                isOpen &&
                  !p.live &&
                  "border-border/40 bg-background/50 text-muted-foreground/35 line-through scale-90",
                isPing && "ring-2 ring-hud-cyan/50",
              )}
            >
              {isPing && (
                <span className="pointer-events-none absolute inset-0 animate-ring rounded-full border border-hud-cyan/40" />
              )}
              <span className="font-mono">{p.num}</span>
              <span className="text-[8px] opacity-80">{p.signal}%</span>
            </button>
          );
        })}
      </div>

      <style>{`@keyframes hcc-sweep-rot { to { transform: rotate(360deg); } }`}</style>

      {(win || out) && (
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className={cn("text-xs", win ? "text-hud-green" : "text-hud-red")}>
            {win ? "Perimeter mapped." : "Probe budget exhausted — connection dropped."}
          </span>
          <HudButton
            tone={win ? "green" : "red"}
            size="sm"
            onClick={() => {
              onFlash?.(win ? "ok" : "fail");
              audio.sfx(win ? "ok" : "fail");
              onDone(win);
            }}
          >
            {win ? "File evidence" : "Withdraw"}
          </HudButton>
        </div>
      )}
    </Panel>
  );
}
