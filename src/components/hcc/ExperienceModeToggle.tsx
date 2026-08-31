import { Chip, HudButton, Panel } from "./ui";
import { audio } from "@/lib/hcc/audio";
import { useGame } from "@/lib/hcc/store";
import type { ExperienceMode } from "@/lib/hcc/types";
import { cn } from "@/lib/utils";

const OPTIONS: {
  mode: ExperienceMode;
  title: string;
  blurb: string;
  recommended?: boolean;
}[] = [
  {
    mode: "normal",
    title: "NORMAL",
    blurb: "Smaller console at first, tips on each tab. Mining & full desk unlock as you play.",
    recommended: true,
  },
  {
    mode: "experienced",
    title: "EXPERIENCED",
    blurb: "Full desk immediately — every tab and advanced panel, minimal hand-holding.",
  },
];

/**
 * Preference switch only. Changing modes never touches progression, credits,
 * cases, mining, upgrades, prestige or Stars — it only changes guidance and UI density.
 */
export default function ExperienceModeToggle({
  onPick,
  bare = false,
}: {
  onPick?: (mode: ExperienceMode) => void;
  bare?: boolean;
}) {
  const { state, dispatch } = useGame();

  const pick = (mode: ExperienceMode) => {
    audio.sfx("tab");
    dispatch({ type: "experience-mode", mode });
    onPick?.(mode);
  };

  const body = (
    <div className={cn("grid gap-2 sm:grid-cols-2", bare ? "" : "p-3")}>
      {OPTIONS.map((o) => {
        const active = state.experienceMode === o.mode;
        return (
          <button
            key={o.mode}
            type="button"
            onClick={() => pick(o.mode)}
            aria-pressed={active}
            className={cn(
              "rounded-md border bg-background/40 p-3 text-left transition-colors",
              active
                ? "border-hud-cyan/60 bg-hud-cyan/10"
                : "border-border/60 hover:border-hud-cyan/40",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-[11px] tracking-[0.2em]",
                  active ? "text-hud-cyan" : "text-foreground/90",
                )}
              >
                {o.title}
              </span>
              {o.recommended && <Chip tone="green">RECOMMENDED</Chip>}
              {active && !o.recommended && <Chip tone="cyan">ACTIVE</Chip>}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{o.blurb}</p>
          </button>
        );
      })}
    </div>
  );

  if (bare) return body;

  return (
    <Panel
      label="EXPERIENCE MODE"
      right={
        <HudButton
          size="sm"
          tone="ghost"
          onClick={() => pick(state.experienceMode === "normal" ? "experienced" : "normal")}
        >
          Switch
        </HudButton>
      }
    >
      {body}
      <p className="px-3 pb-3 text-[10px] leading-relaxed text-muted-foreground">
        Guidance and UI density only. Economy, difficulty and unlocks you already earned stay the same.
      </p>
    </Panel>
  );
}
