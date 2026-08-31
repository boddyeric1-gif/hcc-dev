import { useEffect, useMemo } from "react";
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
import { FocusModeProvider, useFocusMode } from "./FocusMode";
import OperatorBadge from "./OperatorBadge";
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
import { Panel } from "./ui";
import { useGame } from "@/lib/hcc/store";
import { audio } from "@/lib/hcc/audio";
import { deskTier, tabUnlocked, unlockHint, visibleTabs } from "@/lib/hcc/progression";
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
export const RESERVED_START_PARAMS: ReadonlySet<string> = new Set(TABS.map((t) => String(t.id)));

function requestedTab(): TabId | null {
  if (typeof window === "undefined") return null;
  const fromQuery = new URLSearchParams(window.location.search).get("tab");
  const fromTelegram = window.Telegram?.WebApp?.initDataUnsafe?.start_param ?? null;
  const candidate = (fromQuery ?? fromTelegram) as TabId | null;
  return candidate && TAB_IDS.has(candidate) ? candidate : null;
}

function ShellInner() {
  const { state, dispatch } = useGame();
  const { focused, label, setFocused, setLabel } = useFocusMode();
  const online = state.phase === "online";
  const isPerf = state.quality === "performance";
  const isMining = state.tab === "mining";
  const tier = deskTier(state);
  const navTabs = useMemo(() => {
    const allowed = new Set(visibleTabs(tier));
    return TABS.filter((t) => allowed.has(t.id));
  }, [tier]);
  const tabOk = tabUnlocked(state, state.tab);

  useEffect(() => {
    if (!online) return;
    const tab = requestedTab();
    if (tab) dispatch({ type: "tab", tab });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  useEffect(() => {
    audio.setSettings(state.audio);
  }, [state.audio]);

  useEffect(() => {
    if (state.tab !== "tools") {
      setFocused(false);
      setLabel(null);
    }
  }, [state.tab, setFocused, setLabel]);

  // If Normal mode still has this tab gated, bounce to CMD with a soft lock message
  useEffect(() => {
    if (!online) return;
    if (!tabUnlocked(state, state.tab) && state.tab !== "guide") {
      // guide always reachable via header; mining/rig gated in nav only
    }
  }, [online, state, state.tab]);

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
  }, [online, state.mining, state.owned, state.installed, state.quality]);

  if (!online) {
    return <BootScreen onDone={(handle) => dispatch({ type: "login", handle })} />;
  }

  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col",
        isPerf && "perf-mode",
        focused && "hcc-focus",
        isMining && tabOk && "hcc-mining-room",
      )}
    >
      <div className="pointer-events-none fixed inset-0 hud-grid opacity-[0.38]" aria-hidden />
      <div className="data-dust" aria-hidden />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-40 bg-hud-cyan/6 blur-3xl" aria-hidden />
      {!isMining && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-hud-cyan/8 blur-2xl animate-sweep" aria-hidden />
      )}
      {isMining && tabOk && (
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/80" aria-hidden />
      )}
      <div className="phosphor-bloom" aria-hidden />
      <div className="crt-overlay" aria-hidden />

      <header
        className={cn(
          "safe-top sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl transition-all duration-300",
          focused ? "border-hud-cyan/40" : "border-hud-cyan/25",
          isMining && tabOk && "border-hud-green/20 bg-background/55",
        )}
      >
        <div className="safe-x mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {focused ? (
              <>
                <p className="text-[10px] tracking-[0.28em] text-hud-cyan">FOCUS</p>
                <span className="font-display text-sm tracking-[0.2em] text-foreground">{label ?? "OPERATION"}</span>
              </>
            ) : (
              <>
                <h1 className="font-display text-lg tracking-[0.32em] text-hud-cyan text-glow animate-flicker">
                  H.C.C
                  <span className="sr-only"> — Hunting Cyber Criminals</span>
                </h1>
                <OperatorBadge badgeId={state.installed.badge} />
                {isMining && tabOk && (
                  <span className="text-[9px] tracking-[0.28em] text-hud-green/80">FARM FLOOR</span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] tabular-nums">
            {!focused && (
              <>
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
              </>
            )}
            {state.operator && !focused && <span className="hidden text-hud-cyan sm:inline">{state.operator}</span>}
            {!focused && <span className="text-hud-violet">{rankName(state.intel)}</span>}
            <span className="text-hud-green">{Math.round(state.credits).toLocaleString()} cr</span>
            <span className={cn(state.heat > 66 ? "text-hud-red" : state.heat > 33 ? "text-hud-amber" : "text-hud-cyan")}>
              {Math.round(state.heat)}% heat
            </span>
          </div>
        </div>
      </header>

      <main
        className={cn(
          "safe-x relative z-10 mx-auto w-full max-w-3xl flex-1 px-3 pt-3 transition-[padding] duration-300",
          focused ? "pb-6" : "pb-console",
          isMining && tabOk && "px-2 sm:px-3",
        )}
      >
        {!focused && <TabTip />}
        {!tabOk && state.tab !== "guide" ? (
          <Panel label="SECTION LOCKED" className="p-4">
            <p className="text-[12px] leading-relaxed text-muted-foreground">{unlockHint(state.tab)}</p>
            <p className="mt-2 text-[10px] tracking-[0.16em] text-hud-cyan">
              DESK TIER · {tier.toUpperCase()} — switch to Experienced in GUIDE for the full console now.
            </p>
            <button
              type="button"
              className="mt-3 text-[11px] tracking-[0.16em] text-hud-cyan underline-offset-2 hover:underline"
              onClick={() => dispatch({ type: "tab", tab: "command" })}
            >
              Return to CMD
            </button>
          </Panel>
        ) : (
          <>
            {state.tab === "command" && <CommandTab />}
            {state.tab === "targets" && <TargetsTab />}
            {state.tab === "tools" && <ToolsTab />}
            {state.tab === "rig" && <RigTab />}
            {state.tab === "mining" && <MiningTab />}
            {state.tab === "shop" && <ShopTab />}
            {state.tab === "case" && <CaseTab />}
            {state.tab === "guide" && <GuideTab />}
          </>
        )}
      </main>

      <nav
        className={cn(
          "safe-bottom fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur-xl transition-transform duration-300 ease-out",
          focused ? "pointer-events-none translate-y-full border-transparent opacity-0" : "border-hud-cyan/25 opacity-100",
          isMining && tabOk && !focused && "border-hud-green/20",
        )}
        aria-hidden={focused}
      >
        <div className="no-scrollbar safe-x mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2 py-1.5">
          {navTabs.map((t) => {
            const Icon = t.icon;
            const active = state.tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                tabIndex={focused ? -1 : 0}
                onClick={() => {
                  audio.sfx("tab");
                  dispatch({ type: "tab", tab: t.id });
                }}
                className={cn(
                  "flex min-w-[52px] flex-1 shrink-0 flex-col items-center gap-0.5 rounded-md border px-2 py-1.5 transition-all duration-200",
                  active
                    ? t.id === "mining"
                      ? "border-hud-green/55 bg-hud-green/12 text-hud-green shadow-[0_0_18px_-6px] shadow-hud-green/30"
                      : "border-hud-cyan/55 bg-hud-cyan/12 text-hud-cyan shadow-[0_0_18px_-6px] shadow-hud-cyan/30"
                    : "border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
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

export default function ConsoleShell() {
  return (
    <FocusModeProvider>
      <ShellInner />
    </FocusModeProvider>
  );
}
