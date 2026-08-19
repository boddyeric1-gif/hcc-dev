import { useMemo, useState } from "react";

import { HudButton, Panel } from "../ui";
import { cn } from "@/lib/utils";
import type { Target } from "@/lib/hcc/types";

type Round = { signal: string; options: { text: string; ok: boolean }[] };

const ROUNDS: Round[] = [
  {
    signal: "Operator responds to authority and deadlines.",
    options: [
      { text: "Hey! Big fan of the site, can we chat?", ok: false },
      { text: "Compliance review closes in 40 minutes. Confirm your escrow reference.", ok: true },
      { text: "I think your server has a bug, want me to look?", ok: false },
    ],
  },
  {
    signal: "Their support staff are overworked and unsupervised.",
    options: [
      { text: "Escalate to your supervisor immediately.", ok: false },
      { text: "I won't file a complaint — just resend the case number and we're done.", ok: true },
      { text: "I demand the owner's full legal name.", ok: false },
    ],
  },
  {
    signal: "They verify by asking for something only a member would know.",
    options: [
      { text: "Quote the vetting fee back at them, exactly.", ok: true },
      { text: "Claim the verification system is broken.", ok: false },
      { text: "Send a screenshot of an unrelated invoice.", ok: false },
    ],
  },
];

export default function Pretext({ target, onDone }: { target: Target; onDone: (s: boolean) => void }) {
  const rounds = useMemo(() => ROUNDS, []);
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const done = step >= rounds.length;
  const win = done && wrong === 0;
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
                key={i}
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
            EXCHANGE {step + 1}/{rounds.length} · SUSPICION {wrong}
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
