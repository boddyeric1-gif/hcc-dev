import { useMemo, useState } from "react";
import { Star } from "lucide-react";

import { Chip, HudButton, Panel, Stat } from "../ui";
import StarsShop from "../StarsShop";
import { audio } from "@/lib/hcc/audio";
import { useGame, useStats } from "@/lib/hcc/store";
import { SLOT_LABEL, itemById } from "@/lib/hcc/catalog";
import { deskTier } from "@/lib/hcc/progression";
import { deriveStats, rankIndex, shopItems } from "@/lib/hcc/state";
import type { Item, ItemCategory, Slot } from "@/lib/hcc/types";
import { dualPriceFor } from "@/lib/telegram/stars";
import { useStars } from "@/hooks/useStars";
import { cn } from "@/lib/utils";

const CATS_FULL: { id: ItemCategory; label: string }[] = [
  { id: "hardware", label: "RIG" },
  { id: "mining", label: "MINING" },
  { id: "tools", label: "TOOLS" },
  { id: "perks", label: "PERKS" },
  { id: "custom", label: "STYLE" },
];

/** Preferred order of hardware slot sections in the shop. */
const HARDWARE_SLOT_ORDER: Slot[] = [
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
];

const STYLE_SLOT_ORDER: Slot[] = [
  "lighting",
  "deskmat",
  "poster",
  "rigTheme",
  "minerTheme",
  "uiTheme",
  "badge",
];

const sectionTitle = (it: Item, cat: ItemCategory): string => {
  if (cat === "hardware" && it.slot) {
    const base = SLOT_LABEL[it.slot] ?? it.slot.toUpperCase();
    return `${base.toUpperCase()} UPGRADES`;
  }
  if (cat === "custom" && it.slot) {
    if (it.slot === "badge") return "OPERATION BADGES";
    if (it.slot === "uiTheme") return "HUD THEMES";
    if (it.slot === "rigTheme") return "RIG FINISHES";
    if (it.slot === "minerTheme") return "MINER FINISHES";
    if (it.slot === "lighting") return "LIGHTING";
    if (it.slot === "deskmat") return "DESKMATS";
    if (it.slot === "poster") return "WALL ART";
    return (SLOT_LABEL[it.slot] ?? it.slot).toUpperCase();
  }
  if (cat === "mining") {
    const k = it.mining?.kind;
    if (k === "shelf") return "RACKS & SHELVES";
    if (k === "gpu") return "GPU RIGS";
    if (k === "asic") return "ASIC MINERS";
    if (k === "cooler") return "FARM COOLING";
    if (k === "contract") return "POWER CONTRACTS";
    return "MINING HARDWARE";
  }
  if (cat === "tools") {
    if (it.stats?.opSlots) return "PARALLEL CHANNELS";
    if ((it.stats?.dissipation ?? 0) > 0 && !it.stats?.crack) return "STEALTH & SCRUBBERS";
    if ((it.stats?.crack ?? 0) > 0) return "CRACK & SOCIAL";
    return "FIELD TOOLS";
  }
  if (cat === "perks") {
    if ((it.stats?.bounty ?? 0) > 0 && !(it.stats?.opSlots)) return "BOUNTY CONTACTS";
    if (it.stats?.opSlots) return "TASK FORCE LINKS";
    if (it.stats?.miningMul || it.stats?.miningHeatMul) return "MINING PERKS";
    if (it.stats?.failHeatMul || it.stats?.dissipation) return "HEAT DISCIPLINE";
    return "OPERATOR PERKS";
  }
  return cat.toUpperCase();
};

const sectionSortKey = (title: string, cat: ItemCategory): number => {
  if (cat === "hardware") {
    const slot = HARDWARE_SLOT_ORDER.findIndex((s) =>
      title.startsWith((SLOT_LABEL[s] ?? s).toUpperCase()),
    );
    return slot >= 0 ? slot : 99;
  }
  if (cat === "custom") {
    const order = [
      "LIGHTING",
      "DESKMATS",
      "WALL ART",
      "RIG FINISHES",
      "MINER FINISHES",
      "HUD THEMES",
      "OPERATION BADGES",
    ];
    const i = order.indexOf(title);
    return i >= 0 ? i : 99;
  }
  if (cat === "mining") {
    const order = ["RACKS & SHELVES", "GPU RIGS", "ASIC MINERS", "FARM COOLING", "POWER CONTRACTS"];
    const i = order.indexOf(title);
    return i >= 0 ? i : 99;
  }
  if (cat === "tools") {
    const order = ["CRACK & SOCIAL", "STEALTH & SCRUBBERS", "PARALLEL CHANNELS", "FIELD TOOLS"];
    const i = order.indexOf(title);
    return i >= 0 ? i : 99;
  }
  if (cat === "perks") {
    const order = ["HEAT DISCIPLINE", "BOUNTY CONTACTS", "MINING PERKS", "TASK FORCE LINKS", "OPERATOR PERKS"];
    const i = order.indexOf(title);
    return i >= 0 ? i : 99;
  }
  return 0;
};

type Section = { title: string; items: Item[] };

function groupItems(items: Item[], cat: ItemCategory): Section[] {
  const map = new Map<string, Item[]>();
  for (const it of items) {
    const title = sectionTitle(it, cat);
    const list = map.get(title) ?? [];
    list.push(it);
    map.set(title, list);
  }
  return [...map.entries()]
    .map(([title, list]) => ({
      title,
      items: [...list].sort((a, b) => a.tier - b.tier || a.price - b.price),
    }))
    .sort((a, b) => sectionSortKey(a.title, cat) - sectionSortKey(b.title, cat));
}

export default function ShopTab() {
  const { state, dispatch } = useGame();
  const stats = useStats();
  const tier = deskTier(state);
  const cats = useMemo(() => {
    if (tier === "rookie") {
      return [
        { id: "tools" as const, label: "TOOLS" },
        { id: "hardware" as const, label: "RIG" },
        { id: "custom" as const, label: "STYLE" },
        { id: "perks" as const, label: "PERKS" },
        { id: "mining" as const, label: "MINING" },
      ];
    }
    return CATS_FULL;
  }, [tier]);
  const [cat, setCat] = useState<ItemCategory>("tools");
  const { isTelegram, ready, buy: buyWithStars } = useStars();
  const rank = rankIndex(state.intel);
  const items = shopItems(cat);
  const sections = useMemo(() => groupItems(items, cat), [items, cat]);

  return (
    <div className="space-y-3">
      <Panel label="BLACK MARKET" className="p-3">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="CREDITS" value={`${Math.round(state.credits).toLocaleString()} cr`} tone="green" />
          <Stat label="CLEARANCE" value={`RANK ${rank + 1}`} tone="violet" />
        </div>
        {tier === "rookie" && (
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            Start with TOOLS and RIG if you want easier ops. Mining gear is optional until you open the farm floor.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-1">
          {cats.map((c) => (
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

      {(tier === "full" || state.experienceMode === "experienced") && <StarsShop />}

      {sections.map((sec) => (
        <div key={sec.title} className="space-y-2">
          <div className="flex items-center gap-2 px-1 pt-1">
            <h3 className="text-[10px] tracking-[0.28em] text-hud-cyan">{sec.title}</h3>
            <div className="h-px flex-1 bg-hud-cyan/20" />
            <span className="text-[9px] tabular-nums text-muted-foreground">{sec.items.length}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {sec.items.map((it) => {
              const owned = state.owned.includes(it.id);
              const locked = (it.rank ?? 0) > rank;
              const afford = state.credits >= it.price;
              const count = state.mining.units[it.id] ?? 0;
              const installed = it.slot ? state.installed[it.slot] === it.id : false;
              const starDeal = dualPriceFor(it.id);
              const premium = !!starDeal;
              return (
                <Panel key={it.id} className={cn("p-3", locked && "opacity-55")}>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                    <h3 className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
                      {premium && (
                        <Star
                          className="size-3.5 shrink-0 text-hud-amber"
                          strokeWidth={1.8}
                          aria-label="Telegram Stars item"
                        />
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
                      {starDeal && isTelegram && !owned && (
                        <HudButton
                          size="sm"
                          tone="amber"
                          disabled={!ready}
                          onClick={() => void buyWithStars(starDeal.id)}
                        >
                          <span className="inline-flex items-center gap-1">
                            <Star className="size-3" strokeWidth={2} />
                            {starDeal.stars}
                          </span>
                        </HudButton>
                      )}
                    </div>
                  </div>
                  {owned && it.slot && !installed && (
                    <HudButton
                      size="sm"
                      tone="cyan"
                      className="mt-2"
                      onClick={() => dispatch({ type: "install", id: it.id })}
                    >
                      Install
                    </HudButton>
                  )}
                  {it.mining?.kind === "contract" && owned && state.mining.contract !== it.id && (
                    <HudButton
                      size="sm"
                      tone="cyan"
                      className="mt-2"
                      onClick={() => dispatch({ type: "mining-contract", id: it.id })}
                    >
                      Switch contract
                    </HudButton>
                  )}
                </Panel>
              );
            })}
          </div>
        </div>
      ))}

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
    (n) => `${n}`,
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

// keep STYLE_SLOT_ORDER referenced for future filters
void STYLE_SLOT_ORDER;
