import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";

import OfficialChannel from "../OfficialChannel";
import { Chip, HudButton, Panel, Stat } from "../ui";
import { GUIDE, type GuideChapter } from "@/lib/hcc/guide";
import { audio } from "@/lib/hcc/audio";
import { useGame } from "@/lib/hcc/store";
import { allTargets, deriveStats, rankName } from "@/lib/hcc/state";
import { cn } from "@/lib/utils";

const matches = (c: GuideChapter, q: string): boolean => {
  if (!q) return true;
  const hay = [c.title, c.tagline, ...c.steps.flatMap((s) => [s.title, s.body]), ...(c.rules ?? [])]
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase());
};

export default function GuideTab() {
  const { state, dispatch } = useGame();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string>(GUIDE[0]!.id);
  const [done, setDone] = useState<readonly string[]>([]);

  const chapters = useMemo(() => GUIDE.filter((c) => matches(c, query)), [query]);
  const stats = deriveStats(state);
  const openCases = allTargets(state).filter((t) => !state.progress[t.id]?.seized).length;

  const toggleDone = (id: string) => {
    audio.sfx("tab");
    setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  };

  return (
    <div className="space-y-3">
      <Panel label="FIELD MANUAL" className="p-3">
        <h2 className="font-display text-2xl tracking-widest text-hud-cyan text-glow">HOW TO HUNT</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Nine chapters covering every system in the console. Tap a chapter to open it, use the jump
          button to go straight to the tab it describes, and mark chapters read as you go.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="OPERATOR" value={state.operator ?? "—"} />
          <Stat label="RANK" value={rankName(state.intel)} tone="violet" />
          <Stat label="CHANNELS" value={`${state.active.length}/${Math.max(1, Math.round(stats.opSlots))}`} tone="green" />
          <Stat label="OPEN CASES" value={String(openCases)} tone="amber" />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-2 py-1.5">
          <Search className="size-3.5 text-muted-foreground" strokeWidth={1.6} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the manual — heat, spread, pretext…"
            className="w-full bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="mt-2 text-[10px] tracking-[0.18em] text-muted-foreground">
          {done.length}/{GUIDE.length} CHAPTERS READ
        </div>
      </Panel>

      <OfficialChannel />

      {chapters.length === 0 && (
        <Panel className="p-4 text-center text-[11px] text-muted-foreground">
          No manual entry matches “{query}”.
        </Panel>
      )}

      {chapters.map((c) => {
        const open = openId === c.id;
        const read = done.includes(c.id);
        return (
          <Panel key={c.id} className="overflow-hidden">
            <button
              type="button"
              onClick={() => {
                audio.sfx("tab");
                setOpenId(open ? "" : c.id);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
            >
              <ChevronRight
                className={cn("size-4 shrink-0 text-hud-cyan transition-transform", open && "rotate-90")}
                strokeWidth={1.6}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] tracking-[0.2em] text-hud-cyan">{c.title}</span>
                <span className="block truncate text-[10px] text-muted-foreground">{c.tagline}</span>
              </span>
              {read && <Chip tone="green">READ</Chip>}
            </button>

            {open && (
              <div className="space-y-2 border-t border-border/60 p-3">
                <ol className="space-y-2">
                  {c.steps.map((s, i) => (
                    <li
                      key={s.title}
                      className="rounded-md border border-border/60 bg-background/40 p-2.5"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] tabular-nums text-hud-green">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[11px] tracking-[0.14em] text-foreground/90">{s.title}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{s.body}</p>
                    </li>
                  ))}
                </ol>

                {c.rules && (
                  <ul className="space-y-1 rounded-md border border-hud-amber/30 bg-hud-amber/5 p-2.5">
                    {c.rules.map((r) => (
                      <li key={r} className="text-[11px] leading-relaxed text-hud-amber/90">
                        › {r}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {c.tab && (
                    <HudButton
                      size="sm"
                      onClick={() => {
                        audio.sfx("tab");
                        dispatch({ type: "tab", tab: c.tab! });
                      }}
                    >
                      Open {c.tab}
                    </HudButton>
                  )}
                  <HudButton size="sm" tone={read ? "ghost" : "green"} onClick={() => toggleDone(c.id)}>
                    {read ? "Mark unread" : "Mark read"}
                  </HudButton>
                </div>
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
