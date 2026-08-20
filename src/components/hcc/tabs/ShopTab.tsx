import { useState } from "react";
import { Star } from "lucide-react";

import { Chip, HudButton, Panel, Stat } from "../ui";
import { audio } from "@/lib/hcc/audio";
import { useGame } from "@/lib/hcc/store";
import { itemById } from "@/lib/hcc/catalog";
import { rankIndex, shopItems } from "@/lib/hcc/state";
import type { ItemCategory } from "@/lib/hcc/types";
import { getTelegramWebApp, useTelegram } from "@/hooks/useTelegram";
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
  const [cat, setCat] = useState<ItemCategory>("hardware");
  const { isTelegram } = useTelegram();
  const rank = rankIndex(state.intel);
  const items = shopItems(cat);

  const handleStarPurchase = (id: string) => {
    const app = getTelegramWebApp();
    if (!app) return;
    const url = `https://t.me/invoice/hcc-${id}`;
    app.openInvoice(url, (status) => {
      if (status === "paid") dispatch({ type: "buy", id });
    });
  };

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
