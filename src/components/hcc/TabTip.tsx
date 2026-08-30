import { Lightbulb } from "lucide-react";

import { HudButton } from "./ui";
import { GUIDE } from "@/lib/hcc/guide";
import { audio } from "@/lib/hcc/audio";
import { requestGuideChapter } from "@/lib/hcc/guideFocus";
import { useGame } from "@/lib/hcc/store";
import type { TabId } from "@/lib/hcc/types";

/** Which guide chapter explains which tab. Guide copy is the single source. */
const TAB_TO_CHAPTER: Partial<Record<TabId, string>> = {
  targets: "targets",
  tools: "tools",
  rig: "rig",
  mining: "mining",
  shop: "shop",
  case: "case",
};

/** Heat is contextual, not tab-driven: it surfaces once heat gets real. */
const HEAT_TIP_AT = 40;

const chapterFor = (id: string) => GUIDE.find((c) => c.id === id) ?? null;

/**
 * The single contextual-guidance surface. Rendered once from ConsoleShell;
 * renders nothing at all in experienced mode.
 */
export default function TabTip() {
  const { state, dispatch } = useGame();
  if (state.experienceMode !== "normal") return null;

  const heatDue = state.heat >= HEAT_TIP_AT && !state.seenTips.includes("heat");
  const tabChapter = TAB_TO_CHAPTER[state.tab];
  const tabDue = tabChapter && !state.seenTips.includes(tabChapter) ? tabChapter : null;

  const chapter = chapterFor(heatDue ? "heat" : (tabDue ?? ""));
  if (!chapter) return null;

  const first = chapter.steps[0];

  const dismiss = () => {
    audio.sfx("tab");
    dispatch({ type: "tip-seen", id: chapter.id });
  };

  const openChapter = () => {
    audio.sfx("tab");
    dispatch({ type: "tip-seen", id: chapter.id });
    requestGuideChapter(chapter.id);
    dispatch({ type: "tab", tab: "guide" });
  };

  return (
    <div className="mb-3 rounded-md border border-hud-cyan/35 bg-hud-cyan/5 p-3">
      <div className="flex items-start gap-2">
        <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-hud-cyan" strokeWidth={1.6} />
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.2em] text-hud-cyan">{chapter.title}</p>
          <p className="mt-0.5 text-[11px] text-foreground/90">{chapter.tagline}</p>
          {first && (
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{first.body}</p>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <HudButton size="sm" tone="green" onClick={dismiss}>
          Got it
        </HudButton>
        <HudButton size="sm" tone="ghost" onClick={openChapter}>
          Open full chapter
        </HudButton>
      </div>
    </div>
  );
}
