import { useState, type ReactNode } from "react";
import { X } from "lucide-react";

import ExperienceModeToggle from "./ExperienceModeToggle";
import { HudButton } from "./ui";
import { audio } from "@/lib/hcc/audio";
import { useGame } from "@/lib/hcc/store";

/** Three cards max — depth lives in GUIDE and progressive unlocks, not the doorway. */
const CARDS: { title: string; body: string }[] = [
  {
    title: "YOU ARE THE TASK FORCE",
    body: "Pick a target, run tools to gather evidence, file the case for a bounty. That is the whole hunt loop.",
  },
  {
    title: "START SIMPLE",
    body: "TARGETS → TOOLS → CASE. Heat rises if ops fail — Scrub on CMD if it climbs. Shop and mining open as you go; you do not need them in the first five minutes.",
  },
  {
    title: "THE MANUAL IS THERE",
    body: "Tap ? anytime for the full field guide. Experienced operators can hide tips; nothing about the game itself changes.",
  },
];

type Stage = "mode" | "cards" | "ack";

export default function Onboarding() {
  const { dispatch } = useGame();
  const [stage, setStage] = useState<Stage>("mode");
  const [i, setI] = useState(0);
  const card = CARDS[i]!;
  const last = i === CARDS.length - 1;

  const close = (openGuide: boolean) => {
    audio.sfx("tab");
    dispatch({ type: "guide-seen" });
    if (openGuide) dispatch({ type: "tab", tab: "guide" });
  };

  const frame = (children: ReactNode) => (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/85 p-4 backdrop-blur-sm sm:items-center">
      <div className="panel relative w-full max-w-md p-4">
        <button
          type="button"
          aria-label="Skip introduction"
          onClick={() => close(false)}
          className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-hud-cyan"
        >
          <X className="size-4" strokeWidth={1.6} />
        </button>
        {children}
      </div>
    </div>
  );

  if (stage === "mode") {
    return frame(
      <>
        <div className="text-[10px] tracking-[0.24em] text-hud-green">BRIEFING</div>
        <h2 className="mt-2 font-display text-xl tracking-widest text-hud-cyan text-glow">
          HOW MUCH GUIDANCE DO YOU WANT?
        </h2>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          Normal starts with a smaller console and tips. Experienced shows everything at once. Economy and
          difficulty are identical.
        </p>
        <div className="mt-3">
          <ExperienceModeToggle
            bare
            onPick={(mode) => setStage(mode === "normal" ? "cards" : "ack")}
          />
        </div>
      </>,
    );
  }

  if (stage === "ack") {
    return frame(
      <>
        <div className="text-[10px] tracking-[0.24em] text-hud-green">CLEARANCE CONFIRMED</div>
        <h2 className="mt-2 font-display text-xl tracking-widest text-hud-cyan text-glow">
          EXPERIENCED MODE
        </h2>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          Full desk online — every tab, every panel. Switch back to Normal anytime from GUIDE if you want a quieter console.
        </p>
        <div className="mt-4 flex justify-between gap-2">
          <HudButton size="sm" tone="ghost" onClick={() => setStage("mode")}>
            Back
          </HudButton>
          <HudButton size="sm" tone="green" onClick={() => close(false)}>
            Enter console
          </HudButton>
        </div>
      </>,
    );
  }

  return frame(
    <>
      <div className="text-[10px] tracking-[0.24em] text-hud-green">
        BRIEFING {i + 1}/{CARDS.length}
      </div>
      <h2 className="mt-2 font-display text-xl tracking-widest text-hud-cyan text-glow">{card.title}</h2>
      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{card.body}</p>

      <div className="mt-4 flex items-center gap-1.5">
        {CARDS.map((c, n) => (
          <span
            key={c.title}
            className={`h-1 flex-1 rounded-full ${n <= i ? "bg-hud-cyan" : "bg-secondary"}`}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-between gap-2">
        <HudButton size="sm" tone="ghost" onClick={() => (i === 0 ? close(false) : setI(i - 1))}>
          {i === 0 ? "Skip" : "Back"}
        </HudButton>
        {last ? (
          <div className="flex gap-2">
            <HudButton size="sm" tone="ghost" onClick={() => close(false)}>
              Start hunting
            </HudButton>
            <HudButton size="sm" tone="green" onClick={() => close(true)}>
              Open manual
            </HudButton>
          </div>
        ) : (
          <HudButton
            size="sm"
            onClick={() => {
              audio.sfx("tab");
              setI(i + 1);
            }}
          >
            Next
          </HudButton>
        )}
      </div>
    </>,
  );
}
