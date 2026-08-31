import { useState } from "react";

import { Bar, Chip, HudButton, Panel } from "../ui";
import { audio } from "@/lib/hcc/audio";
import { useGame } from "@/lib/hcc/store";
import { evidencePct, findTarget } from "@/lib/hcc/state";
import { cn } from "@/lib/utils";

export default function CaseTab() {
  const { state, dispatch } = useGame();
  const t = findTarget(state, state.selected);
  const [seize, setSeize] = useState<null | "animating" | "done">(null);

  if (!t) return null;
  const p = state.progress[t.id];
  const pct = evidencePct(state, t.id);
  const complete = pct >= 100;

  const submit = () => {
    if (!complete || p?.seized) return;
    setSeize("animating");
    audio.sfx("unlock");
    window.setTimeout(() => {
      dispatch({ type: "report", targetId: t.id });
      setSeize("done");
      audio.sfx("ok");
    }, 1600);
    window.setTimeout(() => setSeize(null), 4200);
  };

  return (
    <div className="relative space-y-3">
      {/* SEIZE SEQUENCE OVERLAY */}
      {seize && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-background/90 px-4 backdrop-blur-md",
            seize === "animating" && "animate-in fade-in duration-300",
          )}
          role="dialog"
          aria-label="Case submission sequence"
        >
          <div className="panel relative w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="pointer-events-none absolute inset-0 scanlines opacity-50" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bg-hud-green/5 animate-soft-pulse" aria-hidden />

            <p className="text-[10px] tracking-[0.35em] text-muted-foreground">TASK FORCE UPLINK</p>
            <h2 className="mt-2 font-display text-3xl tracking-[0.25em] text-hud-cyan text-glow animate-flicker">
              {t.codename}
            </h2>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{t.caseId}</p>

            <div className="my-5 border border-hud-green/40 bg-hud-green/10 py-3">
              <p className="text-[11px] tracking-[0.3em] text-hud-green">
                {seize === "animating" ? "TRANSMITTING DOSSIER…" : "SERVER SEIZED"}
              </p>
              {seize === "done" && (
                <p className="mt-1 text-lg font-semibold tabular-nums text-hud-green text-glow">
                  +{t.bounty.toLocaleString()} cr
                </p>
              )}
              {seize === "done" && (
                <p className="text-[10px] tracking-[0.2em] text-hud-violet">+{t.intel} INTEL</p>
              )}
            </div>

            <div className="flex justify-center gap-2">
              {t.ops.map((op) => (
                <span
                  key={op.kind}
                  className="rounded border border-hud-green/40 px-2 py-0.5 text-[9px] tracking-[0.16em] text-hud-green"
                >
                  {op.kind.toUpperCase()}
                </span>
              ))}
            </div>

            {seize === "done" && (
              <p className="mt-4 text-[10px] tracking-[0.2em] text-muted-foreground">
                Operator identity filed. Heat adjusted.
              </p>
            )}
          </div>
        </div>
      )}

      <Panel label={`CASE FILE ${t.caseId}`} className="p-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl tracking-widest text-hud-cyan text-glow">{t.codename}</h2>
          <Chip tone={p?.seized ? "green" : "amber"}>{p?.seized ? "CLOSED" : "OPEN"}</Chip>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t.allegation}</p>
        <div className="mt-3 flex items-center gap-2">
          <Bar value={pct} tone={complete ? "green" : "cyan"} className="flex-1" />
          <span className="text-[10px] tabular-nums text-muted-foreground">{pct}%</span>
        </div>
      </Panel>

      <Panel label="EVIDENCE CHAIN" className="p-3">
        <ul className="space-y-2">
          {t.ops.map((op) => {
            const filed = p?.evidence.includes(op.kind);
            return (
              <li key={op.kind} className="rounded-md border border-border/60 bg-background/40 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] tracking-[0.16em] text-foreground/90">{op.label}</span>
                  <Chip tone={filed ? "green" : "dim"}>{filed ? "FILED" : "MISSING"}</Chip>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {filed ? op.captured : "████████ ███ ████████ ██████ ████."}
                </p>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel label="OPERATOR IDENTITY" className="p-3">
        {complete ? (
          <dl className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <dt className="text-muted-foreground">Alias</dt>
              <dd className="text-hud-cyan">{t.operator.alias}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Legal name</dt>
              <dd className="text-hud-green">{t.operator.realName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Location</dt>
              <dd className="text-foreground">{t.operator.location}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Note</dt>
              <dd className="text-foreground/80">{t.operator.note}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Identity resolves only once the evidence chain is complete. {4 - (p?.evidence.length ?? 0)} operations
            remaining.
          </p>
        )}
      </Panel>

      {!p?.seized && (
        <HudButton
          tone={complete ? "green" : "ghost"}
          disabled={!complete || seize !== null}
          className="w-full"
          onClick={submit}
        >
          Submit to task force · {t.bounty.toLocaleString()} cr
        </HudButton>
      )}
    </div>
  );
}
