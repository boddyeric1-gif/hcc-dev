import { useState } from "react";
import { Star } from "lucide-react";

import { Chip, HudButton, Panel, Stat } from "../ui";
import StarsShop from "../StarsShop";
import { audio } from "@/lib/hcc/audio";
import { useGame, useStats } from "@/lib/hcc/store";
import { itemById } from "@/lib/hcc/catalog";
import { deriveStats, rankIndex, shopItems } from "@/lib/hcc/state";
import type { ItemCategory } from "@/lib/hcc/types";
import { dualPriceFor } from "@/lib/telegram/stars";
import { useStars } from "@/hooks/useStars";
import { cn } from "@/lib/utils";

const CATS: { id: ItemCategory; label: string }[] = [
  { id: "hardware", label: "RIG" },
  { id: "mining", label: "MINING" },
  { id: "tools", label: "TOOLS" },
  { id: "perks", label: "PERKS" },
  { id: "custom", label: "STYLE" },
];

export default function ShopTab() {
  const { state, dispatch } = useGame();
  const stats = useStats();
  const [cat, setCat] = useState<ItemCategory>("hardware");
  const { isTelegram, ready, buy: buyWithStars } = useStars();
  const rank = rankIndex(state.intel);
  const items = shopItems(cat);


  return (
    <div className="space-y-3">
      <Panel label="BLACK MARKET" className="p-3">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="CREDITS" value={`${Math.round(state.credits).toLocaleString()} cr`} tone="green" />
          <Stat label="CLEARANCE" value={`RANK ${rank + 1}`} tone="violet" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={cn(
                "rounded border px-2 py-1 text-[10px] tracking-[0.18em]",
                cat === c.id ? "border-hud-cyan/60 bg-hud-cyan/10 text-hud-cyan" : "border-border text-muted-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Panel>

      <StarTestPurchase />

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => {
          const owned = state.owned.includes(it.id);
          const locked = (it.rank ?? 0) > rank;
          const afford = state.credits >= it.price;
          const count = state.mining.units[it.id] ?? 0;
          const installed = it.slot ? state.installed[it.slot] === it.id : false;
          const premium = it.tier >= 4;
          return (
            <Panel key={it.id} className={cn("p-3", locked && "opacity-55")}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <h3 className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
                  {premium && (
                    <Star className="size-3.5 shrink-0 text-hud-amber" strokeWidth={1.8} aria-label="Telegram Stars item" />
                  )}
                  <span className="truncate">{it.name}</span>
                </h3>
                <Chip tone={premium ? "red" : it.tier === 3 ? "amber" : it.tier === 2 ? "cyan" : "dim"}>
                  T{it.tier}
                </Chip>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{it.blurb}</p>
              {it.mining && it.mining.kind !== "contract" && (
                <p className="mt-1 text-[10px] tracking-[0.14em] text-hud-green/80">
                  {it.mining.hash > 0 && `${it.mining.hash} MH/s · `}
                  {it.mining.watts}W{it.mining.heat < 0 && ` · ${it.mining.heat} heat`}
                  {it.mining.slots ? ` · ${it.mining.slots} slots` : ""}
                </p>
              )}
              {it.mining?.kind === "contract" && (
                <p className="mt-1 text-[10px] tracking-[0.14em] text-hud-amber/80">
                  {it.mining.capacityKw} kW · {it.mining.pricePerKwh} cr/kWh
                </p>
              )}
              <EffectPreview id={it.id} owned={owned} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs tabular-nums text-hud-amber">
                  {it.price === 0 ? "OWNED" : `${it.price.toLocaleString()} cr`}
                </span>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {count > 0 && <Chip tone="cyan">×{count}</Chip>}
                  {installed && <Chip tone="green">FITTED</Chip>}
                  <HudButton
                    size="sm"
                    tone={locked ? "ghost" : "green"}
                    disabled={locked || !afford || (owned && !it.stackable)}
                    onClick={() => {
                      audio.sfx("buy");
                      dispatch({ type: "buy", id: it.id });
                    }}
                  >
                    {locked
                      ? `Rank ${(it.rank ?? 0) + 1}`
                      : owned && !it.stackable
                        ? "Owned"
                        : it.stackable
                          ? "Buy unit"
                          : "Acquire"}
                  </HudButton>
                  {premium && isTelegram && !locked && (owned ? it.stackable : true) && (
                    <HudButton size="sm" tone="amber" onClick={() => handleStarPurchase(it.id)}>
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3" strokeWidth={2} />
                        Stars
                      </span>
                    </HudButton>
                  )}
                </div>
              </div>
              {owned && it.slot && !installed && (
                <HudButton size="sm" tone="cyan" className="mt-2" onClick={() => dispatch({ type: "install", id: it.id })}>
                  Install
                </HudButton>
              )}
              {it.mining?.kind === "contract" && owned && state.mining.contract !== it.id && (
                <HudButton size="sm" tone="cyan" className="mt-2" onClick={() => dispatch({ type: "mining-contract", id: it.id })}>
                  Switch contract
                </HudButton>
              )}
            </Panel>
          );
        })}
      </div>
      <p className="px-1 text-[10px] text-muted-foreground">
        Current contract: {itemById(state.mining.contract)?.name}
      </p>
    </div>
  );
}

type Delta = { label: string; before: string; after: string };

function effectDeltas(state: Parameters<typeof deriveStats>[0], id: string): Delta[] {
  const item = itemById(id);
  if (!item) return [];
  const before = deriveStats(state);
  const projected = {
    ...state,
    owned: state.owned.includes(id) ? state.owned : [...state.owned, id],
    installed: item.slot ? { ...state.installed, [item.slot]: id } : state.installed,
  };
  const after = deriveStats(projected);
  const out: Delta[] = [];
  const push = (label: string, b: number, a: number, fmt: (n: number) => string) => {
    if (Math.abs(a - b) < 0.0001) return;
    out.push({ label, before: fmt(b), after: fmt(a) });
  };
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  push("CRACK POWER", before.crack, after.crack, pct);
  push("SCAN SPEED", before.scan, after.scan, (n) => `${n.toFixed(1)}x`);
  push("STEALTH", before.dissipation, after.dissipation, (n) => n.toFixed(0));
  push("BOUNTY", before.bounty, after.bounty, (n) => `+${Math.round(n * 100)}%`);
  push("MINING YIELD", before.miningMul, after.miningMul, (n) => `${n.toFixed(2)}x`);
  push(
    "ACTIVE CHANNELS",
    Math.max(1, Math.round(before.opSlots)),
    Math.max(1, Math.round(after.opSlots)),
    (n) => `${n} / ${n}`,
  );
  push("FAIL HEAT", before.failHeatMul, after.failHeatMul, (n) => `${Math.round(n * 100)}%`);
  push("MINING HEAT", before.miningHeatMul, after.miningHeatMul, (n) => `${Math.round(n * 100)}%`);
  return out;
}

function EffectPreview({ id, owned }: { id: string; owned: boolean }) {
  const { state } = useGame();
  const deltas = effectDeltas(state, id);
  if (deltas.length === 0) return null;
  return (
    <ul className="mt-2 space-y-0.5 rounded-md border border-border/50 bg-background/40 p-2">
      {deltas.map((d) => (
        <li key={d.label} className="flex items-center justify-between gap-2 text-[10px]">
          <span className="tracking-[0.16em] text-muted-foreground">{d.label}</span>
          <span className="tabular-nums text-muted-foreground">
            {d.before} <span className="text-hud-cyan">→</span>{" "}
            <span className={owned ? "text-hud-green/70" : "text-hud-green"}>{d.after}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
