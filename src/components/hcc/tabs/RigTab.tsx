import { Suspense, lazy, useMemo } from "react";
import { ClientOnly } from "@tanstack/react-router";

import { Bar, Chip, HudButton, Stat } from "../ui";
import { TechSpec, TerminalWindow } from "../hud";
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
      <TerminalWindow
        title="WORKSPACE — LIVE RENDER"
        subtitle="FACILITY CAM 01 · OPERATOR BAY"
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
      </TerminalWindow>

      <TerminalWindow title="RIG PERFORMANCE" subtitle="LIVE TELEMETRY" bodyClassName="p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="CRACK POWER" value={`${(stats.crack * 100).toFixed(0)}%`} />
          <Stat label="SCAN SPEED" value={`${stats.scan.toFixed(1)}x`} tone="green" />
          <Stat label="STEALTH" value={`${stats.dissipation.toFixed(0)}`} tone="violet" hint="heat dissipation" />
          <Stat label="MINING MULT" value={`${stats.miningMul.toFixed(2)}x`} tone="amber" />
        </div>
        <Bar value={stats.crack * 100} className="mt-3" />
      </TerminalWindow>

      <TerminalWindow title="HARDWARE BAY" subtitle="INSTALLED LOADOUT" bodyClassName="p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {SLOTS.map((slot) => {
            const current = itemById(state.installed[slot]);
            const alternatives = ownedSlotItems(state, slot).filter((i) => i.id !== current?.id);
            const t = current?.tier ?? 0;
            return (
              <div
                key={slot}
                className={cn(
                  "relative overflow-hidden rounded-md border bg-background/45 p-2",
                  current ? "border-hud-cyan/25" : "border-border/60",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 w-[2px]",
                    t >= 3 ? "bg-hud-green" : t === 2 ? "bg-hud-cyan" : t === 1 ? "bg-hud-cyan/40" : "bg-border",
                  )}
                  aria-hidden
                />
                <div className="flex items-center justify-between gap-2 pl-1.5">
                  <span className="text-[10px] tracking-[0.18em] text-muted-foreground">{SLOT_LABEL[slot]}</span>
                  <Chip tone={t >= 3 ? "green" : t === 2 ? "cyan" : "dim"}>TIER {t}</Chip>
                </div>
                <p className="mt-0.5 pl-1.5 text-xs text-foreground">{current?.name ?? "Empty"}</p>
                <div className="mt-1.5 flex gap-4 pl-1.5">
                  <TechSpec label="BAY" value={slot.toUpperCase()} />
                  <TechSpec
                    label="STATUS"
                    value={current ? "ONLINE" : "EMPTY"}
                    tone={current ? "green" : "amber"}
                  />
                  <TechSpec label="SPARES" value={`${alternatives.length}`} />
                </div>
                {alternatives.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1 pl-1.5">
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
      </TerminalWindow>
    </div>
  );
}
