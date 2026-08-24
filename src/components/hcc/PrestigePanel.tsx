import { useState } from "react";

import { Bar, Chip, HudButton, Panel } from "./ui";
import { useGame, useStats } from "@/lib/hcc/store";
import {
  PRESTIGE_KEEPS,
  PRESTIGE_RESETS,
  canPrestige,
  nextMilestone,
  prestigeBonuses,
  prestigeRequirement,
  rewardForLevel,
} from "@/lib/hcc/prestige";
import { cn } from "@/lib/utils";

export default function PrestigePanel() {
  const { state, dispatch } = useGame();
  const stats = useStats();
  const [confirm, setConfirm] = useState(false);
  const req = prestigeRequirement(state.prestige);
  const ready = canPrestige(state);
  const bonuses = prestigeBonuses(state);
  const nextLevel = state.prestige + 1;
  const milestone = nextMilestone(state.prestige);
  const milestoneReward = rewardForLevel(milestone);
  const nextReward = rewardForLevel(nextLevel);

  const rows: { label: string; have: number; need: number }[] = [
    { label: "INTEL", have: state.intel, need: req.intel },
    { label: "TAKEDOWNS", have: state.takedowns, need: req.takedowns },
    { label: "CREDITS", have: Math.round(state.credits), need: req.credits },
  ];

  return (
    <Panel
      label="PRESTIGE"
      right={<Chip tone={ready ? "green" : "dim"}>{ready ? "AVAILABLE" : `P${state.prestige}`}</Chip>}
      className="p-3"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg tracking-widest text-hud-violet">PRESTIGE {state.prestige}</h2>
        <span className="text-[10px] tracking-[0.18em] text-muted-foreground">
          NEXT MILESTONE · PRESTIGE {milestone}
        </span>
      </div>
      <Bar
        value={Math.min(100, ((state.prestige % 5 || (state.prestige === 0 ? 0 : 5)) / 5) * 100)}
        tone="violet"
        className="mt-2"
      />
      <p className="mt-1 text-[10px] text-muted-foreground">
        {milestoneReward ? `${milestoneReward.name} — ${milestoneReward.detail}` : "Further milestones every 5 levels."}
      </p>

      <div className="mt-3 space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="tracking-[0.16em] text-muted-foreground">{r.label}</span>
            <span className={cn("tabular-nums", r.have >= r.need ? "text-hud-green" : "text-hud-amber")}>
              {r.have.toLocaleString()} / {r.need.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-md border border-border/60 bg-background/40 p-2 text-[10px]">
        <p className="tracking-[0.18em] text-muted-foreground">CURRENT PERMANENT BONUSES</p>
        <p className="mt-1 text-foreground">
          +{Math.round(bonuses.bounty * 100)}% bounty · ×{bonuses.miningMul.toFixed(2)} mining yield · +
          {bonuses.opSlots} channel{bonuses.opSlots === 1 ? "" : "s"} · +{Math.round(bonuses.crack * 100)}% crack · +
          {bonuses.dissipation} stealth
        </p>
        {bonuses.titles.length > 0 && (
          <p className="mt-1 text-hud-violet">{bonuses.titles.join(" · ")}</p>
        )}
        <p className="mt-1 text-muted-foreground">
          Effective now: bounty +{Math.round(stats.bounty * 100)}% · channels {Math.max(1, Math.round(stats.opSlots))}
        </p>
      </div>

      {!confirm && (
        <HudButton
          className="mt-3 w-full"
          tone={ready ? "amber" : "ghost"}
          disabled={!ready}
          onClick={() => setConfirm(true)}
        >
          {ready ? `Prestige to ${nextLevel}` : "Requirements not met"}
        </HudButton>
      )}

      {confirm && (
        <div className="mt-3 rounded-md border border-hud-amber/50 bg-hud-amber/5 p-2">
          <p className="text-[11px] text-hud-amber">
            Prestige {nextLevel}
            {nextReward ? ` — milestone: ${nextReward.name}` : " — no milestone at this level"}.
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-[10px] tracking-[0.18em] text-hud-red">WILL RESET</p>
              <ul className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
                {PRESTIGE_RESETS.map((r) => (
                  <li key={r}>· {r}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.18em] text-hud-green">WILL BE KEPT</p>
              <ul className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
                {PRESTIGE_KEEPS.map((k) => (
                  <li key={k}>· {k}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <HudButton
              size="sm"
              tone="amber"
              onClick={() => {
                setConfirm(false);
                dispatch({ type: "prestige" });
              }}
            >
              Confirm prestige
            </HudButton>
            <HudButton size="sm" tone="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </HudButton>
          </div>
        </div>
      )}

      <p className="mt-2 text-[10px] text-muted-foreground">
        Career record: {state.lifetime.takedowns} takedowns · {Math.round(state.lifetime.credits).toLocaleString()} cr
        earned · {state.lifetime.intel.toLocaleString()} intel.
      </p>
    </Panel>
  );
}
