import { useMemo } from "react";

import EventStream from "../EventStream";
import OperatorBadge from "../OperatorBadge";
import PrestigePanel from "../PrestigePanel";
import { Bar, Chip, HudButton, Panel, Stat } from "../ui";
import { useGame, useStats } from "@/lib/hcc/store";
import {
  allTargets,
  channelEchoChance,
  deriveMining,
  deskBountyBonus,
  evidencePct,
  findTarget,
  nextRankIntel,
  nextRecommendedAction,
  rankName,
} from "@/lib/hcc/state";
import { cn } from "@/lib/utils";

export default function CommandTab() {
  const { state, dispatch } = useGame();
  const stats = useStats();
  const selected = findTarget(state, state.selected);
  const roster = allTargets(state);
  const remaining = roster.filter((t) => !state.progress[t.id]?.seized).length;
  const nextIntel = nextRankIntel(state.intel);
  const next = nextRecommendedAction(state);
  const slots = Math.max(1, Math.round(stats.opSlots));
  const echoPct = Math.round(channelEchoChance(state) * 100);
  const deskPct = Math.round(deskBountyBonus(state.active.length) * 100);
  const farm = useMemo(() => deriveMining(state, Date.now()), [state]);
  const rankPct = useMemo(() => {
    if (nextIntel === null) return 100;
    return (state.intel / nextIntel) * 100;
  }, [state.intel, nextIntel]);

  const readyCount = state.active.filter((id) => {
    const t = findTarget(state, id);
    const p = state.progress[id];
    return t && p && !p.seized && p.evidence.length >= t.ops.length;
  }).length;

  return (
    <div className="space-y-3">
      {/* SITUATION REPORT — single glance home */}
      <section className="panel relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 scanlines opacity-30" aria-hidden />
        <header className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-hud-cyan/20 px-3 py-2">
          <div>
            <p className="text-[9px] tracking-[0.32em] text-muted-foreground">SITUATION REPORT</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg tracking-[0.22em] text-hud-cyan text-glow">
                {state.operator ?? "OPERATOR"}
              </h2>
              <OperatorBadge badgeId={state.installed.badge} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip tone="violet">{rankName(state.intel)}</Chip>
            {state.prestige > 0 && <Chip tone="amber">P{state.prestige}</Chip>}
            <Chip tone={state.heat > 66 ? "red" : state.heat > 33 ? "amber" : "cyan"}>
              {Math.round(state.heat)}% HEAT
            </Chip>
          </div>
        </header>

        <div className="relative z-10 grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
          <Stat label="CREDITS" value={`${Math.round(state.credits).toLocaleString()} cr`} tone="green" />
          <Stat label="INTEL" value={`${state.intel.toLocaleString()}`} tone="violet" hint={nextIntel ? `next @ ${nextIntel}` : "max rank"} />
          <Stat label="DESK" value={`${state.active.length}/${slots}`} tone="cyan" hint={readyCount ? `${readyCount} ready to file` : `${echoPct}% echo`} />
          <Stat
            label="FARM NET"
            value={`${Math.round(farm.netPerSec * 3600).toLocaleString()} cr/h`}
            tone={farm.netPerSec >= 0 ? "green" : "red"}
            hint={farm.effectiveHash > 0 ? `${Math.round(farm.effectiveHash)} MH/s` : "offline"}
          />
        </div>

        <div className="relative z-10 space-y-2 border-t border-border/40 px-3 pb-3">
          <div className="flex justify-between text-[9px] tracking-[0.18em] text-muted-foreground">
            <span>RANK PROGRESS</span>
            <span>{Math.min(100, Math.round(rankPct))}%</span>
          </div>
          <Bar value={rankPct} tone="violet" />
          <div className="flex justify-between text-[9px] tracking-[0.18em] text-muted-foreground">
            <span>TRACE HEAT</span>
            <span className={state.heat > 66 ? "text-hud-red" : undefined}>{Math.round(state.heat)}%</span>
          </div>
          <Bar value={state.heat} tone={state.heat > 66 ? "red" : state.heat > 33 ? "amber" : "cyan"} />
        </div>

        <div className="relative z-10 flex flex-wrap gap-2 border-t border-border/40 px-3 py-2.5">
          <HudButton size="sm" tone="amber" onClick={() => dispatch({ type: "scrub" })}>
            Scrub · 600 cr
          </HudButton>
          <HudButton size="sm" onClick={() => dispatch({ type: "tab", tab: "targets" })}>
            Targets
          </HudButton>
          <HudButton size="sm" tone="green" onClick={() => dispatch({ type: "tab", tab: "mining" })}>
            Farm floor
          </HudButton>
          {deskPct > 0 && (
            <span className="self-center text-[10px] tracking-[0.14em] text-hud-green">
              DESK BONUS +{deskPct}%
            </span>
          )}
        </div>
      </section>

      {/* PRIORITY — always visible, not only guided mode */}
      {next && (
        <Panel label="PRIORITY" className="p-3">
          <p className="text-[12px] leading-relaxed text-foreground/90">{next.label}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {state.heat > 80 ? (
              <HudButton size="sm" tone="amber" onClick={() => dispatch({ type: "scrub" })}>
                Scrub logs · 600 cr
              </HudButton>
            ) : (
              <HudButton size="sm" onClick={() => dispatch({ type: "tab", tab: next.tab })}>
                Open {next.tab}
              </HudButton>
            )}
          </div>
        </Panel>
      )}

      {/* CHANNEL STRIP */}
      <Panel
        label="ACTIVE DESK"
        right={
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {state.active.length}/{slots} · echo {echoPct}%
          </span>
        }
        className="p-3"
      >
        {state.active.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No channels open. Engage a case from TARGETS.</p>
        ) : (
          <ul className="space-y-2">
            {state.active.map((id) => {
              const t = findTarget(state, id);
              if (!t) return null;
              const pct = evidencePct(state, id);
              const ready = pct >= 100;
              const sel = state.selected === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: "select", id });
                      dispatch({ type: "tab", tab: ready ? "case" : "tools" });
                    }}
                    className={cn(
                      "w-full rounded-md border p-2 text-left transition-colors",
                      sel ? "border-hud-cyan/50 bg-hud-cyan/10" : "border-border/60 bg-background/40 hover:border-hud-cyan/35",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs tracking-widest text-foreground">{t.codename}</span>
                      <Chip tone={ready ? "green" : "cyan"}>{ready ? "READY" : `${pct}%`}</Chip>
                    </div>
                    <Bar value={pct} tone={ready ? "green" : "cyan"} className="mt-1.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-[10px] text-muted-foreground">
          {remaining} cases still open in the field queue · {state.takedowns} career takedowns
        </p>
      </Panel>

      {selected && !state.progress[selected.id]?.seized && (
        <Panel label="FOCUS CASE" className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-xl tracking-widest text-hud-cyan text-glow">{selected.codename}</h2>
              <p className="truncate text-[11px] text-muted-foreground">
                {selected.caseId} · {selected.host}
              </p>
            </div>
            <Chip tone={selected.threat === "CRITICAL" ? "red" : selected.threat === "SEVERE" ? "amber" : "cyan"}>
              {selected.threat}
            </Chip>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{selected.brief}</p>
          <div className="mt-3 flex items-center gap-2 text-[10px] tracking-[0.18em] text-muted-foreground">
            <span>EVIDENCE {evidencePct(state, selected.id)}%</span>
            <Bar value={evidencePct(state, selected.id)} tone="green" className="flex-1" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <HudButton size="sm" onClick={() => dispatch({ type: "tab", tab: "tools" })}>
              Run operation
            </HudButton>
            <HudButton size="sm" tone="green" onClick={() => dispatch({ type: "tab", tab: "case" })}>
              Dossier
            </HudButton>
          </div>
        </Panel>
      )}

      <PrestigePanel />

      <Panel
        label="EVENT STREAM"
        right={
          <span className="text-[9px] text-hud-green/70">
            CRACK {(stats.crack * 100).toFixed(0)}% · SCAN {stats.scan.toFixed(1)}x
          </span>
        }
      >
        <EventStream log={state.log} className="h-52" />
      </Panel>
    </div>
  );
}
