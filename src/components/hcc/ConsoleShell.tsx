import {
  Boxes,
  FileSearch,
  Cpu,
  Crosshair,
  ShoppingCart,
  TerminalSquare,
  Wrench,
} from "lucide-react";

import BootScreen from "./BootScreen";
import CaseTab from "./tabs/CaseTab";
import CommandTab from "./tabs/CommandTab";
import MiningTab from "./tabs/MiningTab";
import RigTab from "./tabs/RigTab";
import ShopTab from "./tabs/ShopTab";
import TargetsTab from "./tabs/TargetsTab";
import ToolsTab from "./tabs/ToolsTab";
import { useGame } from "@/lib/hcc/store";
import { rankName } from "@/lib/hcc/state";
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
];

export default function ConsoleShell() {
  const { state, dispatch } = useGame();

  if (state.phase !== "online") {
    return <BootScreen onDone={() => dispatch({ type: "boot" })} />;
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="pointer-events-none fixed inset-0 hud-grid opacity-40" aria-hidden />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-32 bg-hud-cyan/5 blur-3xl" aria-hidden />

      <header className="sticky top-0 z-20 border-b border-hud-cyan/20 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg tracking-[0.3em] text-hud-cyan text-glow">H.C.C</span>
            <span className="hidden text-[9px] tracking-[0.3em] text-muted-foreground sm:inline">
              HUNTING CYBER CRIMINALS
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] tabular-nums">
            <span className="text-hud-violet">{rankName(state.intel)}</span>
            <span className="text-hud-green">{Math.round(state.credits).toLocaleString()} cr</span>
            <span className={cn(state.heat > 66 ? "text-hud-red" : state.heat > 33 ? "text-hud-amber" : "text-hud-cyan")}>
              {Math.round(state.heat)}% heat
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-3 pt-3 pb-24">
        {state.tab === "command" && <CommandTab />}
        {state.tab === "targets" && <TargetsTab />}
        {state.tab === "tools" && <ToolsTab />}
        {state.tab === "rig" && <RigTab />}
        {state.tab === "mining" && <MiningTab />}
        {state.tab === "shop" && <ShopTab />}
        {state.tab === "case" && <CaseTab />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-hud-cyan/20 bg-background/92 backdrop-blur-md">
        <div className="no-scrollbar mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2 py-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = state.tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => dispatch({ type: "tab", tab: t.id })}
                className={cn(
                  "flex min-w-[58px] flex-1 flex-col items-center gap-1 rounded-md border px-2 py-1.5 transition-colors",
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
    </div>
  );
}
