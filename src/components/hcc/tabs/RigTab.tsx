import { Suspense, lazy, useMemo } from "react";
import { ClientOnly } from "@tanstack/react-router";

import { Bar, Chip, HudButton, Panel, Stat } from "../ui";
import SceneBrightness from "../SceneBrightness";
import type { RigVisual } from "../three/RigScene";
import { useGame, useStats } from "@/lib/hcc/store";
import { LIGHT_HEX, SLOT_LABEL, itemById } from "@/lib/hcc/catalog";
import { ownedSlotItems } from "@/lib/hcc/state";
import { rigTheme } from "@/lib/hcc/themes";
import type { Quality, Slot } from "@/lib/hcc/types";
import { cn } from "@/lib/utils";

const RigScene = lazy(() => import("../three/RigScene"));

const SLOTS: Slot[] = [
  "cpu",
  "gpu",
  "ram",
  "storage",
  "cooling",
  "psu",
  "monitors",
  "router",
  "desk",
  "chair",
  "lighting",
  "deskmat",
  "poster",
];

const QUALITIES: Quality[] = ["performance", "balanced", "ultra"];

function SceneFallback() {
  return (
    <div className="hud-grid flex h-full items-center justify-center text-[10px] tracking-[0.28em] text-hud-cyan/60">
      RENDERING WORKSPACE…
    </div>
  );
}

export default function RigTab() {
  const { state, dispatch } = useGame();
  const stats = useStats();

  const visual: RigVisual = useMemo(() => {
    const tier = (slot: Slot) => itemById(state.installed[slot])?.tier ?? 1;
    return {
      desk: tier("desk"),
      chair: tier("chair"),
      monitors: tier("monitors"),
      gpu: tier("gpu"),
      cooling: tier("cooling"),
      storage: tier("storage"),
      router: tier("router"),
      deskmat: tier("deskmat"),
      poster: state.installed.poster ? tier("poster") : 0,
      accent: LIGHT_HEX[state.installed.lighting ?? "light-cyan"] ?? "#38e1ff",
      load: Math.min(1, stats.crack),
      theme: rigTheme(state.installed.rigTheme),
    };
  }, [state.installed, stats.crack]);

  return (
    <div className="space-y-3">
      <Panel
        label="WORKSPACE — LIVE RENDER"
        right={
          <div className="flex items-center gap-3">
            <SceneBrightness />
            <div className="flex gap-1">
            {QUALITIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => dispatch({ type: "quality", quality: q })}
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[9px] tracking-[0.16em] uppercase",
                  state.quality === q
                    ? "border-hud-cyan/60 text-hud-cyan"
                    : "border-border text-muted-foreground",
                )}
              >
                {q.slice(0, 4)}
              </button>
            ))}
            </div>
          </div>
        }
      >
        <div className="h-[46vh] min-h-[280px] w-full">
          <ClientOnly fallback={<SceneFallback />}>
            <Suspense fallback={<SceneFallback />}>
              <RigScene v={visual} quality={state.quality} brightness={state.brightness} />
            </Suspense>
          </ClientOnly>
        </div>
        <p className="border-t border-border/60 px-3 py-2 text-[10px] text-muted-foreground">
          Drag to orbit · pinch to zoom. The room updates as you install hardware.
        </p>
      </Panel>

      <Panel label="RIG PERFORMANCE" className="p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="CRACK POWER" value={`${(stats.crack * 100).toFixed(0)}%`} />
          <Stat label="SCAN SPEED" value={`${stats.scan.toFixed(1)}x`} tone="green" />
          <Stat label="STEALTH" value={`${stats.dissipation.toFixed(0)}`} tone="violet" hint="heat dissipation" />
          <Stat label="MINING MULT" value={`${stats.miningMul.toFixed(2)}x`} tone="amber" />
        </div>
        <Bar value={stats.crack * 100} className="mt-3" />
      </Panel>

      <Panel label="INSTALLED HARDWARE" className="p-3">
        <div className="space-y-2">
          {SLOTS.map((slot) => {
            const current = itemById(state.installed[slot]);
            const alternatives = ownedSlotItems(state, slot).filter((i) => i.id !== current?.id);
            return (
              <div key={slot} className="rounded-md border border-border/60 bg-background/40 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] tracking-[0.18em] text-muted-foreground">{SLOT_LABEL[slot]}</span>
                  <Chip tone={(current?.tier ?? 1) >= 3 ? "green" : (current?.tier ?? 1) === 2 ? "cyan" : "dim"}>
                    TIER {current?.tier ?? 0}
                  </Chip>
                </div>
                <p className="mt-0.5 text-xs text-foreground">{current?.name ?? "Empty"}</p>
                {alternatives.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {alternatives.map((alt) => (
                      <HudButton key={alt.id} size="sm" tone="ghost" onClick={() => dispatch({ type: "install", id: alt.id })}>
                        {alt.name}
                      </HudButton>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
