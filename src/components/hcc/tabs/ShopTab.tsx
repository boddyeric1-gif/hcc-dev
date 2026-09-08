import { useMemo, useState } from "react";
import {
  Armchair,
  Boxes,
  Cpu,
  Fan,
  Gauge as GaugeIcon,
  HardDrive,
  Image as ImageIcon,
  Lightbulb,
  MemoryStick,
  Monitor,
  Palette,
  Plug,
  Router,
  Server,
  Shield,
  ShoppingBag,
  Star,
  Table,
  Wrench,
  Zap,
} from "lucide-react";

import { Chip, HudButton } from "../ui";
import { SpecBlock, TerminalWindow } from "../hud";
import ProductArt from "../ProductArt";
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

const SLOT_GLYPH: Partial<Record<Slot, typeof Cpu>> = {
  cpu: Cpu,
  gpu: Server,
  ram: MemoryStick,
  storage: HardDrive,
  cooling: Fan,
  psu: Plug,
  monitors: Monitor,
  router: Router,
  desk: Table,
  chair: Armchair,
  lighting: Lightbulb,
  deskmat: Palette,
  poster: ImageIcon,
  rigTheme: Palette,
  minerTheme: Palette,
  uiTheme: Palette,
  badge: Shield,
};

/** Icon chosen from the item's own catalogue data — no per-item hardcoding. */
function glyphFor(it: Item): typeof Cpu {
  if (it.slot && SLOT_GLYPH[it.slot]) return SLOT_GLYPH[it.slot] as typeof Cpu;
  const k = it.mining?.kind;
  if (k === "asic") return Server;
  if (k === "gpu") return Cpu;
  if (k === "shelf") return Boxes;
  if (k === "cooler") return Fan;
  if (k === "contract") return Zap;
  if (it.category === "perks") return Shield;
  if (it.category === "tools") return Wrench;
  return GaugeIcon;
}

/** Spec badges, all derived from the real catalogue entry. */
function specsFor(it: Item): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const m = it.mining;
  if (m && m.kind !== "contract") {
    if (m.hash > 0) out.push({ label: "HASH RATE", value: `${m.hash} MH/s` });
    out.push({ label: "POWER DRAW", value: `${m.watts}W` });
    if (m.heat < 0) out.push({ label: "COOLING", value: `${m.heat} heat` });
    if (m.slots) out.push({ label: "SLOTS", value: `${m.slots}` });
  } else if (m?.kind === "contract") {
    out.push({ label: "CAPACITY", value: `${m.capacityKw} kW` });
    out.push({ label: "TARIFF", value: `${m.pricePerKwh} cr/kWh` });
  }
  const s = it.stats;
  if (s) {
    if (s.crack) out.push({ label: "CRACK", value: `+${Math.round(s.crack * 100)}%` });
    if (s.scan) out.push({ label: "SCAN", value: `+${s.scan.toFixed(1)}x` });
    if (s.dissipation) out.push({ label: "STEALTH", value: `+${s.dissipation.toFixed(0)}` });
    if (s.bounty) out.push({ label: "BOUNTY", value: `+${Math.round(s.bounty * 100)}%` });
    if (s.miningMul) out.push({ label: "YIELD", value: `${s.miningMul.toFixed(2)}x` });
    if (s.opSlots) out.push({ label: "CHANNELS", value: `+${s.opSlots}` });
  }
  out.push({ label: "TIER", value: `T${it.tier}` });
  if (it.slot) out.push({ label: "FITS", value: (SLOT_LABEL[it.slot] ?? it.slot).toUpperCase() });
  return out.slice(0, 4);
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
      {/* STOREFRONT HEADER — live wallet + clearance from game state */}
      <section className="panel bracket-frame relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-hud-cyan/35 bg-background/60 text-hud-cyan">
              <ShoppingBag className="size-4.5" strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-lg tracking-[0.22em] text-foreground">HARDWARE SHOP</h2>
              <p className="text-[9px] tracking-[0.24em] text-muted-foreground">BLACK MARKET SUPPLY NET</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border/70 bg-background/60 px-3 py-1.5">
            <div className="text-right">
              <div className="text-sm font-semibold tabular-nums text-hud-green">
                {Math.round(state.credits).toLocaleString()} cr
              </div>
              <div className="text-[8px] tracking-[0.2em] text-muted-foreground">
                CLEARANCE · RANK {rank + 1}
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORY BAR — filters the real catalogue */}
        <div className="no-scrollbar flex gap-1 overflow-x-auto border-t border-hud-cyan/15 px-2 py-2">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-[10px] tracking-[0.22em] transition-all duration-200",
                cat === c.id
                  ? "bg-hud-cyan/15 text-hud-cyan shadow-[0_0_18px_-6px] shadow-hud-cyan/60 ring-1 ring-hud-cyan/45"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        {tier === "rookie" && (
          <p className="border-t border-border/40 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
            Start with TOOLS and RIG if you want easier ops. Mining gear is optional until you open the farm floor.
          </p>
        )}
      </section>

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
              const Glyph = glyphFor(it);
              const plateTone = installed ? "green" : premium ? "amber" : locked ? "red" : "cyan";
              return (
                <article
                  key={it.id}
                  className={cn(
                    "panel group relative flex flex-col overflow-hidden transition-shadow duration-300",
                    locked ? "opacity-55" : "hover:shadow-[0_0_36px_-16px] hover:shadow-hud-cyan/60",
                  )}
                >
                  {/* PRODUCT VISUAL — item illustration + live spec badges */}
                  <div className="relative h-36 shrink-0 overflow-hidden border-b border-hud-cyan/20 bg-background/50">
                    <div className="pointer-events-none absolute inset-0 hud-grid opacity-40" aria-hidden />
                    <div
                      className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl opacity-25"
                      style={{ background: `var(--hud-${plateTone})` }}
                      aria-hidden
                    />
                    <SpecBlock specs={specsFor(it)} />
                    <div className="absolute inset-0 flex items-center justify-center p-3">
                      <ProductArt item={it} tone={plateTone} className="max-h-full w-auto" />
                    </div>
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                      {count > 0 && <Chip tone="cyan">×{count}</Chip>}
                      {installed && <Chip tone="green">FITTED</Chip>}
                      {owned && !installed && !it.stackable && <Chip tone="dim">OWNED</Chip>}
                      {locked && <Chip tone="red">RANK {(it.rank ?? 0) + 1}</Chip>}
                    </div>
                    <span className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[8px] tracking-[0.2em] text-muted-foreground">
                      <Glyph className="size-3" strokeWidth={1.6} />
                      {(it.slot ? (SLOT_LABEL[it.slot] ?? it.slot) : (it.mining?.kind ?? it.category)).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="flex min-w-0 items-start gap-1.5 text-sm leading-tight text-foreground">
                      {premium && (
                        <Star
                          className="mt-0.5 size-3.5 shrink-0 text-hud-amber"
                          strokeWidth={1.8}
                          aria-label="Telegram Stars item"
                        />
                      )}
                      <span className="min-w-0">{it.name}</span>
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{it.blurb}</p>
                    <EffectPreview id={it.id} owned={owned} />

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
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
                              : "Buy now"}
                      </HudButton>
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          afford ? "text-hud-amber" : "text-hud-red/80",
                        )}
                      >
                        {it.price === 0 ? "OWNED" : `${it.price.toLocaleString()} cr`}
                      </span>
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
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}

      <TerminalWindow title="SUPPLY STATUS" bodyClassName="px-3 py-2">
        <p className="text-[10px] tracking-[0.14em] text-muted-foreground">
          POWER CONTRACT · {itemById(state.mining.contract)?.name ?? "NONE"}
        </p>
        <p className="mt-1 text-[10px] tracking-[0.14em] text-muted-foreground">
          CRACK {(stats.crack * 100).toFixed(0)}% · SCAN {stats.scan.toFixed(1)}x · STEALTH{" "}
          {stats.dissipation.toFixed(0)}
        </p>
      </TerminalWindow>
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
