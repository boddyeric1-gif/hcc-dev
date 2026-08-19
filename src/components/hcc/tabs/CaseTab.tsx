import { Bar, Chip, HudButton, Panel } from "../ui";
import { useGame } from "@/lib/hcc/store";
import { evidencePct } from "@/lib/hcc/state";
import { targetById } from "@/lib/hcc/targets";

export default function CaseTab() {
  const { state, dispatch } = useGame();
  const t = targetById(state.selected);
  if (!t) return null;
  const p = state.progress[t.id];
  const pct = evidencePct(state, t.id);
  const complete = pct >= 100;

  return (
    <div className="space-y-3">
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
          disabled={!complete}
          className="w-full"
          onClick={() => dispatch({ type: "report", targetId: t.id })}
        >
          Submit to task force · {t.bounty.toLocaleString()} cr
        </HudButton>
      )}
    </div>
  );
}
