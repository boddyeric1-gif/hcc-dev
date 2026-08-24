import ChannelBoard from "../ChannelBoard";
import { Bar, Chip, HudButton, Panel } from "../ui";
import { useGame, useStats } from "@/lib/hcc/store";
import { allTargets, evidencePct, rankIndex } from "@/lib/hcc/state";
import { opDifficulty } from "@/lib/hcc/puzzles";
import { cn } from "@/lib/utils";

export default function TargetsTab() {
  const { state, dispatch } = useGame();
  const stats = useStats();
  const slots = Math.max(1, Math.round(stats.opSlots));

  return (
    <div className="space-y-3">
      <ChannelBoard />
      {allTargets(state).map((t) => {
        const p = state.progress[t.id];
        const selected = state.selected === t.id;
        const engaged = state.active.includes(t.id);
        const diff = opDifficulty(t, { crack: stats.crack, rank: rankIndex(state.intel) });
        return (
          <Panel
            key={t.id}
            className={cn("p-3 transition-colors", selected && "border-hud-cyan/60 glow-cyan")}
          >
            <button type="button" className="w-full text-left" onClick={() => dispatch({ type: "select", id: t.id })}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg tracking-widest text-foreground">{t.codename}</h2>
                    {t.id.startsWith("gen-") && !p?.seized && <Chip tone="amber">NEW</Chip>}
                    {engaged && !p?.seized && <Chip tone="cyan">ENGAGED</Chip>}
                    {p?.seized && <Chip tone="green">SEIZED</Chip>}
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">{t.allegation}</p>
                </div>
                <Chip tone={t.threat === "CRITICAL" ? "red" : t.threat === "SEVERE" ? "amber" : "cyan"}>{t.threat}</Chip>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] tracking-[0.16em] text-muted-foreground">
                <span>SEC {t.security}</span>
                <span>BOUNTY {t.bounty.toLocaleString()}</span>
                <span>INTEL +{t.intel}</span>
              </div>
              <p className="mt-1 text-[10px] tracking-[0.16em] text-muted-foreground">
                EFFORT{" "}
                <span
                  className={
                    diff.label === "BLACKSITE"
                      ? "text-hud-red"
                      : diff.label === "HARDENED"
                        ? "text-hud-amber"
                        : "text-hud-green"
                  }
                >
                  {diff.label}
                </span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Bar value={evidencePct(state, t.id)} tone={p?.seized ? "green" : "cyan"} className="flex-1" />
                <span className="text-[10px] tabular-nums text-muted-foreground">{evidencePct(state, t.id)}%</span>
              </div>
            </button>
            {selected && !p?.seized && (
              <div className="mt-3 flex flex-wrap gap-2">
                {engaged ? (
                  <HudButton size="sm" onClick={() => dispatch({ type: "tab", tab: "tools" })}>
                    Run operation
                  </HudButton>
                ) : (
                  <HudButton
                    size="sm"
                    onClick={() => {
                      dispatch({ type: "engage", id: t.id });
                      dispatch({ type: "tab", tab: "tools" });
                    }}
                  >
                    Engage case
                  </HudButton>
                )}
                {engaged && (
                  <HudButton size="sm" tone="ghost" onClick={() => dispatch({ type: "drop", id: t.id })}>
                    Release
                  </HudButton>
                )}
                <HudButton size="sm" tone="green" onClick={() => dispatch({ type: "tab", tab: "case" })}>
                  Dossier
                </HudButton>
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
