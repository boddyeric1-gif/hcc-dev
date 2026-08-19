import { useMemo, useState } from "react";

import { HudButton, Panel } from "../ui";
import { buildPorts, mulberry } from "@/lib/hcc/puzzles";
import type { OpDifficulty } from "@/lib/hcc/puzzles";
import { cn } from "@/lib/utils";
import type { Target } from "@/lib/hcc/types";

export default function PortMapper({
  target,
  diff,
  seed,
  onDone,
}: {
  target: Target;
  diff: OpDifficulty;
  seed: number;
  onDone: (success: boolean) => void;
}) {
  const ports = useMemo(
    () => buildPorts(mulberry(seed), diff.grid, diff.liveServices),
    [seed, diff.grid, diff.liveServices],
  );
  const [opened, setOpened] = useState<number[]>([]);
  const [used, setUsed] = useState(0);
  const found = opened.filter((i) => ports[i]?.live).length;
  const win = found >= diff.liveServices;
  const out = !win && used >= diff.probes;

  return (
    <Panel label="PORT MAPPER" className="p-3">
      <p className="mb-3 text-xs text-muted-foreground">
        Probe the perimeter of {target.host}. Find all {diff.liveServices} responding services before your
        probe budget runs out. The map is regenerated every attempt.
      </p>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {ports.map((p, i) => {
          const isOpen = opened.includes(i);
          return (
            <button
              key={p.num}
              type="button"
              disabled={isOpen || out || win}
              onClick={() => {
                setOpened((o) => [...o, i]);
                setUsed((u) => u + 1);
              }}
              className={cn(
                "rounded-md border py-2 text-[10px] tabular-nums transition-all",
                !isOpen && "border-border bg-secondary/40 text-muted-foreground hover:border-hud-cyan/50",
                isOpen && p.live && "border-hud-green/60 bg-hud-green/10 text-hud-green text-glow",
                isOpen && !p.live && "border-border/40 bg-background/40 text-muted-foreground/40 line-through",
              )}
            >
              {p.num}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] tracking-[0.18em] text-muted-foreground">
        <span>
          PROBES {Math.max(0, diff.probes - used)}/{diff.probes}
        </span>
        <span>
          SERVICES {found}/{diff.liveServices}
        </span>
      </div>
      {(win || out) && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className={cn("text-xs", win ? "text-hud-green" : "text-hud-red")}>
            {win ? "Perimeter mapped." : "Probe budget exhausted — connection dropped."}
          </span>
          <HudButton tone={win ? "green" : "red"} size="sm" onClick={() => onDone(win)}>
            {win ? "File evidence" : "Withdraw"}
          </HudButton>
        </div>
      )}
    </Panel>
  );
}
