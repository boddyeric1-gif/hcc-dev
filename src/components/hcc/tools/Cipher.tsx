import { useMemo, useState } from "react";

import { HudButton, Panel } from "../ui";
import { buildCipher, mulberry } from "@/lib/hcc/puzzles";
import type { OpDifficulty } from "@/lib/hcc/puzzles";
import { cn } from "@/lib/utils";
import type { Target } from "@/lib/hcc/types";

const shiftText = (t: string, by: number) =>
  t.replace(/[a-z]/g, (ch) =>
    String.fromCharCode(((ch.charCodeAt(0) - 97 + by + 26) % 26) + 97),
  );

export default function Cipher({
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
  const { plain, key } = useMemo(
    () => buildCipher(mulberry(seed), target.operator.alias),
    [seed, target.operator.alias],
  );
  const cipher = useMemo(() => shiftText(plain, key), [plain, key]);
  const [shift, setShift] = useState(0);
  const [left, setLeft] = useState(diff.cipherAttempts);
  const [state, setState] = useState<"open" | "win" | "lose">("open");
  const preview = shiftText(cipher, -shift);

  return (
    <Panel label="CIPHER WHEEL" className="p-3">
      <p className="mb-3 text-xs text-muted-foreground">
        Rotate the substitution wheel until the intercepted archive header reads as plain language. The key
        is regenerated for every intercept.
      </p>
      <div className="mb-3 rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] break-all">
        <div className="mb-1 text-[9px] tracking-[0.2em] text-muted-foreground">INTERCEPT</div>
        <div className="text-muted-foreground/70">{cipher}</div>
        <div className="mt-2 mb-1 text-[9px] tracking-[0.2em] text-muted-foreground">DECODE @ {shift}</div>
        <div className={cn(state === "win" ? "text-hud-green text-glow" : "text-hud-cyan")}>{preview}</div>
      </div>
      <input
        type="range"
        min={0}
        max={25}
        value={shift}
        disabled={state !== "open"}
        onChange={(e) => setShift(Number(e.target.value))}
        className="mb-3 w-full accent-[var(--hud-cyan)]"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] tracking-[0.18em] text-muted-foreground">ATTEMPTS {left}</span>
        {state === "open" ? (
          <HudButton
            size="sm"
            onClick={() => {
              if (shift === key) {
                setState("win");
                return;
              }
              const rem = left - 1;
              setLeft(rem);
              if (rem <= 0) setState("lose");
            }}
          >
            Commit key
          </HudButton>
        ) : (
          <HudButton tone={state === "win" ? "green" : "red"} size="sm" onClick={() => onDone(state === "win")}>
            {state === "win" ? "File evidence" : "Withdraw"}
          </HudButton>
        )}
      </div>
    </Panel>
  );
}
