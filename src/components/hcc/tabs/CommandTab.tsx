import { useMemo } from "react";

import EventStream from "../EventStream";
import { Bar, Chip, HudButton, Panel, Stat } from "../ui";
import { useGame, useStats } from "@/lib/hcc/store";
import { evidencePct, nextRankIntel, rankName } from "@/lib/hcc/state";
import { TARGETS, targetById } from "@/lib/hcc/targets";

export default function CommandTab() {
  const { state, dispatch } = useGame();
  const stats = useStats();
  const active = targetById(state.selected);
  const remaining = TARGETS.filter((t) => !state.progress[t.id]?.seized).length;
  const nextIntel = nextRankIntel(state.intel);
  const rankPct = useMemo(() => {
    if (nextIntel === null) return 100;
    return (state.intel / nextIntel) * 100;
  }, [state.intel, nextIntel]);

  return (
    <div className="space-y-3">
      <Panel label="OPERATOR" className="p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="RANK" value={rankName(state.intel)} hint={`${state.intel} intel`} tone="violet" />
          <Stat label="CREDITS" value={`${Math.round(state.credits).toLocaleString()} cr`} tone="green" />
          <Stat label="TAKEDOWNS" value={`${state.takedowns}/${TARGETS.length}`} hint={`${remaining} active`} />
          <Stat
            label="TRACE HEAT"
            value={`${Math.round(state.heat)}%`}
            tone={state.heat > 66 ? "red" : state.heat > 33 ? "amber" : "cyan"}
          />
        </div>
        <div className="mt-3 space-y-2">
          <Bar value={rankPct} tone="violet" />
          <Bar value={state.heat} tone={state.heat > 66 ? "red" : state.heat > 33 ? "amber" : "cyan"} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <HudButton size="sm" tone="amber" onClick={() => dispatch({ type: "scrub" })}>
            Scrub logs · 600 cr
          </HudButton>
          <HudButton size="sm" tone="ghost" onClick={() => dispatch({ type: "tab", tab: "tools" })}>
            Open toolkit
          </HudButton>
        </div>
      </Panel>

      {active && (
        <Panel label="ACTIVE CASE" className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-xl tracking-widest text-hud-cyan text-glow">{active.codename}</h2>
              <p className="truncate text-[11px] text-muted-foreground">
                {active.caseId} · {active.host}
              </p>
            </div>
            <Chip tone={active.threat === "CRITICAL" ? "red" : active.threat === "SEVERE" ? "amber" : "cyan"}>
              {active.threat}
            </Chip>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{active.brief}</p>
          <div className="mt-3 flex items-center gap-2 text-[10px] tracking-[0.18em] text-muted-foreground">
            <span>EVIDENCE {evidencePct(state, active.id)}%</span>
            <Bar value={evidencePct(state, active.id)} tone="green" className="flex-1" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <HudButton size="sm" onClick={() => dispatch({ type: "tab", tab: "tools" })}>
              Run operation
            </HudButton>
            <HudButton size="sm" tone="green" onClick={() => dispatch({ type: "tab", tab: "case" })}>
              View dossier
            </HudButton>
          </div>
        </Panel>
      )}

      <Panel
        label="ENCRYPTED EVENT STREAM"
        right={<span className="text-[9px] text-hud-green/70">CRACK {(stats.crack * 100).toFixed(0)}% · SCAN {stats.scan.toFixed(1)}x</span>}
      >
        <EventStream log={state.log} className="h-64" />
      </Panel>
    </div>
  );
}
