import { useState } from "react";

import Cipher from "../tools/Cipher";
import LedgerTrace from "../tools/LedgerTrace";
import PortMapper from "../tools/PortMapper";
import Pretext from "../tools/Pretext";
import { Chip, HudButton, Panel } from "../ui";
import { useGame, useStats } from "@/lib/hcc/store";
import { findTarget } from "@/lib/hcc/state";
import type { OpKind } from "@/lib/hcc/types";
import { cn } from "@/lib/utils";

const OPS: { kind: OpKind; name: string; desc: string }[] = [
  { kind: "ports", name: "Port Mapper", desc: "Sweep the perimeter for responding services." },
  { kind: "pretext", name: "Social Engineering", desc: "Talk your way past their support desk." },
  { kind: "cipher", name: "Cipher Wheel", desc: "Decrypt an intercepted archive header." },
  { kind: "ledger", name: "Ledger Trace", desc: "Follow settlements through the mixer." },
];

export default function ToolsTab() {
  const { state, dispatch } = useGame();
  const stats = useStats();
  const target = findTarget(state, state.selected);
  const [running, setRunning] = useState<OpKind | null>(null);

  if (!target) return null;
  const progress = state.progress[target.id];
  const seized = progress?.seized ?? false;

  const finish = (kind: OpKind) => (success: boolean) => {
    dispatch({ type: "op", targetId: target.id, kind, success });
    setRunning(null);
  };

  const probes = 5 + Math.round(stats.crack * 6) - (target.security > 90 ? 1 : 0);
  const attempts = 2 + Math.round(stats.crack * 4);
  const hops = target.security > 90 ? 5 : target.security > 80 ? 4 : 3;

  return (
    <div className="space-y-3">
      <Panel label="TOOLKIT" className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.2em] text-muted-foreground">ENGAGING</p>
            <h2 className="font-display text-lg tracking-widest text-hud-cyan">{target.codename}</h2>
          </div>
          <Chip tone="cyan">SEC {target.security}</Chip>
        </div>
      </Panel>

      {seized && (
        <Panel className="p-3 text-xs text-hud-green">
          This server is already seized. Select another case from TARGETS.
        </Panel>
      )}

      {!seized && running === null && (
        <div className="grid gap-3 sm:grid-cols-2">
          {OPS.map((op) => {
            const done = progress?.evidence.includes(op.kind);
            return (
              <Panel key={op.kind} className={cn("p-3", done && "opacity-60")}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm text-foreground">{op.name}</h3>
                  {done && <Chip tone="green">FILED</Chip>}
                </div>
                <p className="mt-1 mb-3 text-[11px] text-muted-foreground">{op.desc}</p>
                <HudButton size="sm" disabled={done ?? false} onClick={() => setRunning(op.kind)}>
                  {done ? "Complete" : "Execute"}
                </HudButton>
              </Panel>
            );
          })}
        </div>
      )}

      {running === "ports" && <PortMapper target={target} probes={probes} onDone={finish("ports")} />}
      {running === "pretext" && <Pretext target={target} onDone={finish("pretext")} />}
      {running === "cipher" && <Cipher target={target} attempts={attempts} onDone={finish("cipher")} />}
      {running === "ledger" && <LedgerTrace target={target} length={hops} onDone={finish("ledger")} />}

      {running !== null && (
        <HudButton tone="ghost" size="sm" onClick={() => setRunning(null)}>
          Abort operation
        </HudButton>
      )}
    </div>
  );
}
