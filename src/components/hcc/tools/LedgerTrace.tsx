import { useEffect, useMemo, useState } from "react";

import { HudButton, Panel } from "../ui";
import { cn } from "@/lib/utils";
import type { Target } from "@/lib/hcc/types";

export default function LedgerTrace({
  target,
  length,
  onDone,
}: {
  target: Target;
  length: number;
  onDone: (s: boolean) => void;
}) {
  const nodes = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        label: `0x${((target.id.charCodeAt(0) + i * 37) * 991).toString(16).slice(0, 4)}`,
      })),
    [target.id],
  );
  const seq = useMemo(
    () =>
      Array.from({ length }, (_, i) =>
        Math.floor((Math.sin((target.id.length + i) * 91.7) * 0.5 + 0.5) * 6) % 6,
      ),
    [target.id, length],
  );
  const [phase, setPhase] = useState<"show" | "input" | "win" | "lose">("show");
  const [cursor, setCursor] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (phase !== "show") return;
    if (cursor >= seq.length) {
      const t = window.setTimeout(() => setPhase("input"), 400);
      return () => window.clearTimeout(t);
    }
    setActive(seq[cursor] ?? null);
    const off = window.setTimeout(() => setActive(null), 420);
    const nxt = window.setTimeout(() => setCursor((c) => c + 1), 700);
    return () => {
      window.clearTimeout(off);
      window.clearTimeout(nxt);
    };
  }, [phase, cursor, seq]);

  return (
    <Panel label="LEDGER TRACE" className="p-3">
      <p className="mb-3 text-xs text-muted-foreground">
        Follow the settlement path through the mixer, then replay it hop by hop.
      </p>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {nodes.map((n) => (
          <button
            key={n.id}
            type="button"
            disabled={phase !== "input"}
            onClick={() => {
              if (seq[step] === n.id) {
                const next = step + 1;
                setStep(next);
                if (next >= seq.length) setPhase("win");
              } else {
                setPhase("lose");
              }
            }}
            className={cn(
              "rounded-md border py-3 font-mono text-[10px] transition-all duration-200",
              active === n.id
                ? "border-hud-green bg-hud-green/20 text-hud-green text-glow scale-105"
                : "border-border bg-secondary/30 text-muted-foreground",
              phase === "input" && "hover:border-hud-cyan/60",
            )}
          >
            {n.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] tracking-[0.18em] text-muted-foreground">
          {phase === "show" ? "OBSERVING PATH…" : `HOP ${Math.min(step + 1, seq.length)}/${seq.length}`}
        </span>
        {(phase === "win" || phase === "lose") && (
          <HudButton tone={phase === "win" ? "green" : "red"} size="sm" onClick={() => onDone(phase === "win")}>
            {phase === "win" ? "File evidence" : "Withdraw"}
          </HudButton>
        )}
      </div>
    </Panel>
  );
}
