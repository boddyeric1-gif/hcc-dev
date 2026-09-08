import { useState } from "react";

import { Bar, Chip, HudButton, Panel } from "../ui";
import { StatusWindow, TerminalWindow } from "../hud";
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

      {/* ADVANCED DIGITAL EVIDENCE BOARD — every node is real case state */}
      <TerminalWindow
        title="ADVANCED DIGITAL EVIDENCE BOARD"
        subtitle={p?.seized ? "CASE CLOSED" : "TRACE MODE ACTIVE"}
        right={<Chip tone={p?.seized ? "green" : "amber"}>{p?.seized ? "CLOSED" : "OPEN"}</Chip>}
        bodyClassName="relative"
      >
        <div className="pointer-events-none absolute inset-0 hud-grid opacity-40" aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-2 px-3 pt-3">
          <div className="min-w-0">
            <h2 className="font-display text-2xl tracking-widest text-hud-cyan text-glow">{t.codename}</h2>
            <p className="truncate text-[10px] tracking-[0.18em] text-muted-foreground">
              {t.caseId} · {t.host}
            </p>
          </div>
          <div className="text-right text-[9px] tracking-[0.18em] text-muted-foreground">
            <div>THREAT · {t.threat}</div>
            <div>EVIDENCE · {pct}%</div>
          </div>
        </div>

        <EvidenceGraph
          codename={t.codename}
          nodes={t.ops.map((op) => ({
            key: op.kind,
            label: op.label,
            filed: !!p?.evidence.includes(op.kind),
          }))}
          resolved={complete}
          alias={t.operator.alias}
          onNode={() => {
            dispatch({ type: "select", id: t.id });
            if (!complete) dispatch({ type: "tab", tab: "tools" });
          }}
        />

        <div className="relative flex items-center gap-2 border-t border-border/40 px-3 py-2">
          <Bar value={pct} tone={complete ? "green" : "cyan"} className="flex-1" />
          <span className="text-[10px] tabular-nums text-muted-foreground">{pct}%</span>
        </div>
        <p className="relative border-t border-border/40 px-3 py-2 text-xs text-muted-foreground">{t.allegation}</p>
      </TerminalWindow>

      {/* HEAT INDICATOR + ACCESS LEDGER — live heat and live event log */}
      <div className="grid gap-3 sm:grid-cols-2">
        <StatusWindow
          title="HEAT INDICATOR"
          tone={state.heat > 66 ? "red" : state.heat > 33 ? "amber" : "cyan"}
          headline={`ALERT LEVEL: ${state.heat > 66 ? "HIGH" : state.heat > 33 ? "ELEVATED" : "NOMINAL"} [${Math.round(state.heat)}%]`}
          pct={state.heat}
          {...(state.heat > 66 ? { note: "HEAT RISE — DETECTION IMMINENT" } : {})}
        />
        <TerminalWindow title="ACCESS LEDGER" tone="cyan" bodyClassName="px-3 py-2">
          <ul className="no-scrollbar max-h-28 space-y-0.5 overflow-y-auto font-mono text-[10px]">
            {state.log.length === 0 && <li className="text-muted-foreground">No console activity logged.</li>}
            {state.log.slice(-14).map((l) => (
              <li key={l.id} className="flex gap-2">
                <span className="shrink-0 text-muted-foreground/50">[{l.stamp}]</span>
                <span className="min-w-0 break-words text-muted-foreground">{l.text}</span>
              </li>
            ))}
          </ul>
        </TerminalWindow>
      </div>

      <TerminalWindow title="EVIDENCE CHAIN" bodyClassName="space-y-2 p-3">
        {t.ops.map((op) => {
          const filed = p?.evidence.includes(op.kind);
          return (
            <div key={op.kind} className="rounded-md border border-border/60 bg-background/40 p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] tracking-[0.16em] text-foreground/90">{op.label}</span>
                <Chip tone={filed ? "green" : "dim"}>{filed ? "FILED" : "MISSING"}</Chip>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {filed ? op.captured : "████████ ███ ████████ ██████ ████."}
              </p>
            </div>
          );
        })}
      </TerminalWindow>

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

type GraphNode = { key: string; label: string; filed: boolean };

/**
 * Presentation-only node graph. Nodes and link states are passed in from the
 * live case state — nothing here invents evidence.
 */
function EvidenceGraph({
  codename,
  nodes,
  resolved,
  alias,
  onNode,
}: {
  codename: string;
  nodes: readonly GraphNode[];
  resolved: boolean;
  alias: string;
  onNode: () => void;
}) {
  const cx = 170;
  const cy = 118;
  const r = 86;
  const points = nodes.map((n, i) => {
    const angle = (-Math.PI / 2) + (i / Math.max(1, nodes.length)) * Math.PI * 2;
    return { ...n, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r * 0.82 };
  });

  return (
    <div className="relative px-1 py-1">
      <svg viewBox="0 0 340 236" className="h-auto w-full" role="img" aria-label={`Evidence graph for ${codename}`}>
        {/* links */}
        {points.map((p) => (
          <line
            key={`l-${p.key}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke={p.filed ? "var(--hud-cyan)" : "var(--border)"}
            strokeWidth={p.filed ? 1.2 : 0.8}
            strokeDasharray={p.filed ? undefined : "3 4"}
            opacity={p.filed ? 0.75 : 0.5}
          />
        ))}
        {/* cross links between filed nodes, mirroring the corroborated chain */}
        {points.map((p, i) =>
          points.slice(i + 1).map((q) =>
            p.filed && q.filed ? (
              <line
                key={`x-${p.key}-${q.key}`}
                x1={p.x}
                y1={p.y}
                x2={q.x}
                y2={q.y}
                stroke="var(--hud-cyan)"
                strokeWidth={0.5}
                opacity={0.22}
              />
            ) : null,
          ),
        )}
        {/* centre target node */}
        <circle cx={cx} cy={cy} r={26} fill="var(--background)" stroke="var(--hud-cyan)" strokeWidth={1.2} opacity={0.95} />
        <circle cx={cx} cy={cy} r={32} fill="none" stroke="var(--hud-cyan)" strokeWidth={0.5} opacity={0.35} />
        <text x={cx} y={cy + 3} textAnchor="middle" fontSize="9" fill="var(--hud-cyan)" letterSpacing="1.2">
          TARGET
        </text>
        <text x={cx} y={cy + 46} textAnchor="middle" fontSize="9" fill="var(--foreground)" letterSpacing="1.4">
          {resolved ? alias : codename}
        </text>

        {/* evidence nodes */}
        {points.map((p) => (
          <g key={p.key} onClick={onNode} className="cursor-pointer" role="presentation">
            <rect
              x={p.x - 11}
              y={p.y - 13}
              width={22}
              height={26}
              rx={2}
              fill="var(--background)"
              stroke={p.filed ? "var(--hud-green)" : "var(--border)"}
              strokeWidth={1}
            />
            <path
              d={`M ${p.x - 5} ${p.y - 6} h 10 M ${p.x - 5} ${p.y} h 10 M ${p.x - 5} ${p.y + 6} h 6`}
              stroke={p.filed ? "var(--hud-green)" : "var(--muted-foreground)"}
              strokeWidth={1}
              opacity={0.85}
            />
            <text
              x={p.x}
              y={p.y + 26}
              textAnchor="middle"
              fontSize="7.5"
              letterSpacing="0.8"
              fill={p.filed ? "var(--hud-green)" : "var(--muted-foreground)"}
            >
              {p.label.length > 20 ? `${p.label.slice(0, 19)}…` : p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
