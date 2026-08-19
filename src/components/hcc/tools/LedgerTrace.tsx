import { useEffect, useMemo, useState } from "react";

import { HudButton, Panel } from "../ui";
import { buildLedger, mulberry } from "@/lib/hcc/puzzles";
import type { OpDifficulty } from "@/lib/hcc/puzzles";
import { cn } from "@/lib/utils";

export default function LedgerTrace({
  diff,
  seed,
  onDone,
}: {
  diff: OpDifficulty;
  seed: number;
  onDone: (s: boolean) => void;
}) {
  const { labels, seq } = useMemo(
    () => buildLedger(mulberry(seed), diff.ledgerNodes, diff.hops),
    [seed, diff.ledgerNodes, diff.hops],
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
    const off = window.setTimeout(() => setActive(null), diff.ledgerShowMs * 0.6);
    const nxt = window.setTimeout(() => setCursor((c) => c + 1), diff.ledgerShowMs);
    return () => {
      window.clearTimeout(off);
      window.clearTimeout(nxt);
    };
  }, [phase, cursor, seq, diff.ledgerShowMs]);

  return (
    <Panel label="LEDGER TRACE" className="p-3">
      <p className="mb-3 text-xs text-muted-foreground">
        Follow the settlement path through the mixer, then replay it hop by hop. {diff.hops} hops, new route
        every attempt.
      </p>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {labels.map((label, id) => (
          <button
            key={`${label}-${id}`}
            type="button"
            disabled={phase !== "input"}
            onClick={() => {
              if (seq[step] === id) {
                const next = step + 1;
                setStep(next);
                if (next >= seq.length) setPhase("win");
              } else {
                setPhase("lose");
              }
            }}
            className={cn(
              "rounded-md border py-3 font-mono text-[10px] transition-all duration-200",
              active === id
                ? "border-hud-green bg-hud-green/20 text-hud-green text-glow scale-105"
                : "border-border bg-secondary/30 text-muted-foreground",
              phase === "input" && "hover:border-hud-cyan/60",
            )}
          >
            {label}
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
