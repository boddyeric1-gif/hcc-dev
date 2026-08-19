import { useMemo, useState } from "react";

import { HudButton, Panel } from "../ui";
import { buildPretext, mulberry } from "@/lib/hcc/puzzles";
import type { OpDifficulty } from "@/lib/hcc/puzzles";
import { cn } from "@/lib/utils";
import type { Target } from "@/lib/hcc/types";

export default function Pretext({
  target,
  diff,
  seed,
  onDone,
}: {
  target: Target;
  diff: OpDifficulty;
  seed: number;
  onDone: (s: boolean) => void;
}) {
  const rounds = useMemo(
    () => buildPretext(mulberry(seed), diff.pretextRounds),
    [seed, diff.pretextRounds],
  );
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const blown = wrong > diff.pretextAllowed;
  const done = blown || step >= rounds.length;
  const win = !blown && step >= rounds.length;
  const round = rounds[step];

  return (
    <Panel label="SOCIAL ENGINEERING" className="p-3">
      <p className="mb-3 text-xs text-muted-foreground">
        Live chat with {target.codename} support. {target.operator.note}
      </p>
      {!done && round && (
        <>
          <div className="mb-3 rounded-md border border-hud-violet/30 bg-hud-violet/5 px-3 py-2 text-[11px] text-hud-violet">
            BEHAVIOURAL SIGNAL — {round.signal}
          </div>
          <div className="space-y-2">
            {round.options.map((o, i) => (
              <button
                key={o.text}
                type="button"
                disabled={picked !== null}
                onClick={() => {
                  setPicked(i);
                  if (!o.ok) setWrong((w) => w + 1);
                  window.setTimeout(() => {
                    setPicked(null);
                    setStep((s) => s + 1);
                  }, 700);
                }}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left text-xs transition-colors",
                  picked === null && "border-border bg-secondary/30 hover:border-hud-cyan/50",
                  picked === i && o.ok && "border-hud-green/60 bg-hud-green/10 text-hud-green",
                  picked === i && !o.ok && "border-hud-red/60 bg-hud-red/10 text-hud-red",
                  picked !== null && picked !== i && "border-border/40 opacity-40",
                )}
              >
                {o.text}
              </button>
            ))}
          </div>
          <div className="mt-3 text-[10px] tracking-[0.18em] text-muted-foreground">
            EXCHANGE {step + 1}/{rounds.length} · SUSPICION {wrong}/{diff.pretextAllowed + 1}
          </div>
        </>
      )}
      {done && (
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-xs", win ? "text-hud-green" : "text-hud-red")}>
            {win ? "Pretext held. They gave you the reference." : "They stopped replying and flagged the session."}
          </span>
          <HudButton tone={win ? "green" : "red"} size="sm" onClick={() => onDone(win)}>
            {win ? "File evidence" : "Withdraw"}
          </HudButton>
        </div>
      )}
    </Panel>
  );
}
