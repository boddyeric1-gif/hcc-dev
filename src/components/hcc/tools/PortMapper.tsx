import { useMemo, useState } from "react";

import { HudButton, Panel } from "../ui";
import { cn } from "@/lib/utils";
import type { Target } from "@/lib/hcc/types";

const seeded = (s: string, i: number) => {
  const h = Math.sin(s.length * 12.9898 + i * 78.233) * 43758.5453;
  return h - Math.floor(h);
};

export default function PortMapper({
  target,
  probes,
  onDone,
}: {
  target: Target;
  probes: number;
  onDone: (success: boolean) => void;
}) {
  const ports = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        num: 1024 + Math.floor(seeded(target.id, i) * 60000),
        live: seeded(target.id + "L", i) > 0.76,
      })),
    [target.id],
  );
  const liveCount = ports.filter((p) => p.live).length || 1;
  const [opened, setOpened] = useState<number[]>([]);
  const [used, setUsed] = useState(0);
  const found = opened.filter((i) => ports[i]?.live).length;
  const out = used >= probes;
  const win = found >= liveCount;

  return (
    <Panel label="PORT MAPPER" className="p-3">
      <p className="mb-3 text-xs text-muted-foreground">
        Probe the perimeter of {target.host}. Find every responding service before your probe budget runs out.
      </p>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {ports.map((p, i) => {
          const isOpen = opened.includes(i);
          return (
            <button
              key={i}
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
          PROBES {probes - used}/{probes}
        </span>
        <span>
          SERVICES {found}/{liveCount}
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
