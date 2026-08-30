import { useEffect } from "react";
import {
  Boxes,
  FileSearch,
  Cpu,
  Crosshair,
  BookOpen,
  HelpCircle,
  ShoppingCart,
  Volume2,
  VolumeX,
  TerminalSquare,
  Wrench,
} from "lucide-react";

import BootScreen from "./BootScreen";
import CaseTab from "./tabs/CaseTab";
import GuideTab from "./tabs/GuideTab";
import Onboarding from "./Onboarding";
import TabTip from "./TabTip";
import CommandTab from "./tabs/CommandTab";
import MiningTab from "./tabs/MiningTab";
import RigTab from "./tabs/RigTab";
import ShopTab from "./tabs/ShopTab";
import TargetsTab from "./tabs/TargetsTab";
import ToolsTab from "./tabs/ToolsTab";
import { useGame } from "@/lib/hcc/store";
import { audio } from "@/lib/hcc/audio";
import { deriveMining, rankName } from "@/lib/hcc/state";
import type { TabId } from "@/lib/hcc/types";
import { cn } from "@/lib/utils";

const TABS: { id: TabId; label: string; icon: typeof Cpu }[] = [
  { id: "command", label: "CMD", icon: TerminalSquare },
  { id: "targets", label: "TARGETS", icon: Crosshair },
  { id: "tools", label: "TOOLS", icon: Wrench },
  { id: "rig", label: "RIG", icon: Cpu },
  { id: "mining", label: "MINING", icon: Boxes },
  { id: "shop", label: "SHOP", icon: ShoppingCart },
  { id: "case", label: "CASE", icon: FileSearch },
  { id: "guide", label: "GUIDE", icon: BookOpen },
];

const TAB_IDS = new Set<TabId>(TABS.map((t) => t.id));

/** start params that address a console section rather than an ad campaign */
export const RESERVED_START_PARAMS: ReadonlySet<string> = new Set(TABS.map((t) => String(t.id)));

/** Telegram deep links (/shop, ?startapp=shop) ask the console to open a section. */
function requestedTab(): TabId | null {
  if (typeof window === "undefined") return null;
  const fromQuery = new URLSearchParams(window.location.search).get("tab");
  const fromTelegram = window.Telegram?.WebApp?.initDataUnsafe?.start_param ?? null;
  const candidate = (fromQuery ?? fromTelegram) as TabId | null;
  return candidate && TAB_IDS.has(candidate) ? candidate : null;
}

export default function ConsoleShell() {
  const { state, dispatch } = useGame();
  const online = state.phase === "online";

  // honour a deep-linked section once the console is up
  useEffect(() => {
    if (!online) return;
    const tab = requestedTab();
    if (tab) dispatch({ type: "tab", tab });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // keep the synth engine in sync with saved preferences
  useEffect(() => {
    audio.setSettings(state.audio);
  }, [state.audio]);

  // ambience follows the farm: more units, more load, more heat = louder room
  useEffect(() => {
    if (!online) return;
    const tick = () => {
      const read = deriveMining(state, Date.now());
      const units = Object.values(state.mining.units).reduce((a, b) => a + b, 0);
      audio.setFarm({
        units,
        load: Math.min(1, read.watts / Math.max(1, read.capacityW)),
        heat: Math.min(1, read.heatLoad / 40),
        online: read.effectiveHash > 0,
      });
    };
    tick();
    const id = window.setInterval(tick, 4000);
    return () => window.clearInterval(id);
  }, [online, state]);

  if (!online) {
    return (
      <BootScreen
        onDone={(handle) => dispatch({ type: "login", handle })}
      />
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="pointer-events-none fixed inset-0 hud-grid opacity-40" aria-hidden />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-32 bg-hud-cyan/5 blur-3xl" aria-hidden />

      <header className="safe-top sticky top-0 z-20 border-b border-hud-cyan/20 bg-background/85 backdrop-blur-md">
        <div className="safe-x mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2">
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-lg tracking-[0.3em] text-hud-cyan text-glow">
              H.C.C
              <span className="sr-only"> — Hunting Cyber Criminals</span>
            </h1>
            <span aria-hidden className="hidden text-[9px] tracking-[0.3em] text-muted-foreground sm:inline">
              HUNTING CYBER CRIMINALS
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] tabular-nums">
            <button
              type="button"
              aria-label={state.audio.muted ? "Unmute audio" : "Mute audio"}
              onClick={() => {
                audio.start();
                audio.resume();
                dispatch({ type: "audio", patch: { muted: !state.audio.muted } });
              }}
              className="text-muted-foreground transition-colors hover:text-hud-cyan"
            >
              {state.audio.muted ? <VolumeX className="size-4" strokeWidth={1.6} /> : <Volume2 className="size-4" strokeWidth={1.6} />}
            </button>
            <button
              type="button"
              aria-label="Open the field manual"
              onClick={() => {
                audio.sfx("tab");
                dispatch({ type: "tab", tab: "guide" });
              }}
              className="text-muted-foreground transition-colors hover:text-hud-cyan"
            >
              <HelpCircle className="size-4" strokeWidth={1.6} />
            </button>
            {state.operator && <span className="hidden text-hud-cyan sm:inline">{state.operator}</span>}
            <span className="text-hud-violet">{rankName(state.intel)}</span>
            <span className="text-hud-green">{Math.round(state.credits).toLocaleString()} cr</span>
            <span className={cn(state.heat > 66 ? "text-hud-red" : state.heat > 33 ? "text-hud-amber" : "text-hud-cyan")}>
              {Math.round(state.heat)}% heat
            </span>
          </div>
        </div>
      </header>

      <main className="pb-console safe-x relative z-10 mx-auto w-full max-w-3xl flex-1 px-3 pt-3">
        <TabTip />
        {state.tab === "command" && <CommandTab />}
        {state.tab === "targets" && <TargetsTab />}
        {state.tab === "tools" && <ToolsTab />}
        {state.tab === "rig" && <RigTab />}
        {state.tab === "mining" && <MiningTab />}
        {state.tab === "shop" && <ShopTab />}
        {state.tab === "case" && <CaseTab />}
        {state.tab === "guide" && <GuideTab />}
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-hud-cyan/20 bg-background/92 backdrop-blur-md">
        <div className="no-scrollbar safe-x mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2 py-1.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = state.tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  audio.sfx("tab");
                  dispatch({ type: "tab", tab: t.id });
                }}
                className={cn(
                  "flex min-w-[52px] flex-1 shrink-0 flex-col items-center gap-0.5 rounded-md border px-2 py-1 transition-colors",
                  active
                    ? "border-hud-cyan/50 bg-hud-cyan/10 text-hud-cyan"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={1.6} />
                <span className="text-[9px] tracking-[0.16em]">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {!state.guideSeen && <Onboarding />}
    </div>
  );
}
