import { Bar, Chip, HudButton, Panel } from "./ui";
import { useGame, useStats } from "@/lib/hcc/store";
import { channelEchoChance, deskBountyBonus, evidencePct, findTarget } from "@/lib/hcc/state";
import { cn } from "@/lib/utils";

/**
 * Live view of every case currently held on a channel. Each channel keeps its
 * own target, evidence set and completion state — switching between them here
 * never discards progress. Multi-channel desks also gain echo chance + submit bonus.
 */
export default function ChannelBoard({ compact = false }: { compact?: boolean }) {
  const { state, dispatch } = useGame();
  const stats = useStats();
  const slots = Math.max(1, Math.round(stats.opSlots));
  const empty = Math.max(0, slots - state.active.length);
  const echoPct = Math.round(channelEchoChance(state) * 100);
  const deskPct = Math.round(deskBountyBonus(state.active.length) * 100);

  return (
    <Panel
      label="ACTIVE CHANNELS"
      right={
        <span
          className={cn(
            "text-[10px] tabular-nums",
            state.active.length >= slots ? "text-hud-amber" : "text-hud-green",
          )}
        >
          {state.active.length} / {slots}
        </span>
      }
      className="p-3"
    >
      <div className="space-y-2">
        {state.active.map((id) => {
          const t = findTarget(state, id);
          if (!t) return null;
          const p = state.progress[id];
          const pct = evidencePct(state, id);
          const complete = pct >= 100;
          return (
            <div
              key={id}
              className={cn(
                "rounded-md border p-2",
                state.selected === id ? "border-hud-cyan/60 bg-hud-cyan/5" : "border-border/60 bg-background/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => dispatch({ type: "select", id })}
                >
                  <p className="truncate text-xs tracking-widest text-foreground">{t.codename}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {p?.evidence.length ?? 0}/{t.ops.length} evidence · bounty {t.bounty.toLocaleString()} cr
                  </p>
                </button>
                <Chip tone={complete ? "green" : "cyan"}>{complete ? "READY" : `${pct}%`}</Chip>
              </div>
              <Bar value={pct} tone={complete ? "green" : "cyan"} className="mt-2" />
              {!compact && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <HudButton
                    size="sm"
                    onClick={() => {
                      dispatch({ type: "select", id });
                      dispatch({ type: "tab", tab: "tools" });
                    }}
                  >
                    Work channel
                  </HudButton>
                  {complete && (
                    <HudButton size="sm" tone="green" onClick={() => dispatch({ type: "report", targetId: id })}>
                      Submit dossier
                    </HudButton>
                  )}
                  <HudButton size="sm" tone="ghost" onClick={() => dispatch({ type: "drop", id })}>
                    Release
                  </HudButton>
                </div>
              )}
            </div>
          );
        })}
        {Array.from({ length: empty }).map((_, i) => (
          <div
            key={`free-${i}`}
            className="rounded-md border border-dashed border-border/60 px-2 py-3 text-center text-[10px] tracking-[0.2em] text-muted-foreground"
          >
            CHANNEL FREE
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
        Evidence on each channel is independent. With 2+ cases open, successful ops have a{" "}
        <span className="text-hud-cyan">{echoPct}%</span> chance to echo the same evidence kind to other
        channels{state.owned.includes("tool-oracle") ? " (Oracle Mesh: always)" : ""}. Submitting while the desk is
        loaded pays a{" "}
        <span className="text-hud-green">{deskPct}%</span> desk bounty bonus. Widen the desk with Split-Session,
        Orchestrator, Swarm, Hive, Liaison, or Oracle.
      </p>
    </Panel>
  );
}
