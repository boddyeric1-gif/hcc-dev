import { useMemo, useState } from "react";

import Cipher from "../tools/Cipher";
import LedgerTrace from "../tools/LedgerTrace";
import PortMapper from "../tools/PortMapper";
import Pretext from "../tools/Pretext";
import { Chip, HudButton, Panel } from "../ui";
import { useGame, useStats } from "@/lib/hcc/store";
import { findTarget, rankIndex } from "@/lib/hcc/state";
import { opDifficulty, seedFor } from "@/lib/hcc/puzzles";
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
  const [run, setRun] = useState(() => Math.floor(Math.random() * 1e6));

  const diff = useMemo(
    () => (target ? opDifficulty(target, { crack: stats.crack, rank: rankIndex(state.intel) }) : null),
    [target, stats.crack, state.intel],
  );

  if (!target || !diff) return null;
  const progress = state.progress[target.id];
  const seized = progress?.seized ?? false;
  const engaged = state.active.includes(target.id);
  const slots = Math.max(1, Math.round(stats.opSlots));

  const finish = (kind: OpKind) => (success: boolean) => {
    dispatch({ type: "op", targetId: target.id, kind, success });
    setRunning(null);
    setRun((r) => r + 1);
  };

  const start = (kind: OpKind) => {
    setRun((r) => r + 1);
    setRunning(kind);
  };

  const seed = seedFor(target.id, running ?? "none", run);

  return (
    <div className="space-y-3">
      <Panel label="TOOLKIT" className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.2em] text-muted-foreground">ENGAGING</p>
            <h2 className="font-display text-lg tracking-widest text-hud-cyan">{target.codename}</h2>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Chip tone="cyan">SEC {target.security}</Chip>
            <Chip
              tone={diff.label === "BLACKSITE" ? "red" : diff.label === "HARDENED" ? "amber" : "green"}
            >
              {diff.label}
            </Chip>
            <Chip tone="dim">
              CHANNELS {state.active.length}/{slots}
            </Chip>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Difficulty adapts: harder targets shrink your budget, better rigs and higher rank widen it again.
        </p>
      </Panel>

      {seized && (
        <Panel className="p-3 text-xs text-hud-green">
          This server is already seized. Select another case from TARGETS.
        </Panel>
      )}

      {!seized && !engaged && (
        <Panel className="p-3">
          <p className="text-xs text-muted-foreground">
            {target.codename} is not on an active channel.{" "}
            {state.active.length >= slots
              ? "All channels are in use — engaging will let the oldest case go cold."
              : "Engage to open a channel and start collecting evidence."}
          </p>
          <HudButton className="mt-3" size="sm" onClick={() => dispatch({ type: "engage", id: target.id })}>
            Engage case
          </HudButton>
        </Panel>
      )}

      {!seized && engaged && running === null && (
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
                <HudButton size="sm" disabled={done ?? false} onClick={() => start(op.kind)}>
                  {done ? "Complete" : "Execute"}
                </HudButton>
              </Panel>
            );
          })}
        </div>
      )}

      {engaged && running === "ports" && (
        <PortMapper target={target} diff={diff} seed={seed} onDone={finish("ports")} />
      )}
      {engaged && running === "pretext" && (
        <Pretext target={target} diff={diff} seed={seed} onDone={finish("pretext")} />
      )}
      {engaged && running === "cipher" && (
        <Cipher target={target} diff={diff} seed={seed} onDone={finish("cipher")} />
      )}
      {engaged && running === "ledger" && <LedgerTrace diff={diff} seed={seed} onDone={finish("ledger")} />}

      {running !== null && (
        <HudButton
          tone="ghost"
          size="sm"
          onClick={() => {
            setRunning(null);
            setRun((r) => r + 1);
          }}
        >
          Abort operation
        </HudButton>
      )}
    </div>
  );
}
