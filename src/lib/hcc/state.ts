import { CATALOG, COINS, DEFAULT_INSTALLED, STARTER_OWNED, itemById } from "./catalog";
import { contractRead, difficulty, quote, sellQuote, type ContractRead, type Regime } from "./market";
import { TARGETS, targetById } from "./targets";
import { canPrestige, prestigeBonuses, rewardForLevel } from "./prestige";
import { PREMIUM_MINING_MUL, isStarsOnlyItem } from "@/lib/telegram/stars";
import type {
  AudioSettings,
  Target,
  Coin,
  GameState,
  Item,
  LogLine,
  OpKind,
  Quality,
  RigStats,
  Slot,
  TabId,
  Tone,
} from "./types";

export const RANKS = [
  { name: "SCRIPT KIDDIE", intel: 0 },
  { name: "OPERATOR", intel: 500 },
  { name: "GHOST", intel: 1400 },
  { name: "ARCHITECT", intel: 2800 },
  { name: "PHANTOM", intel: 5000 },
] as const;

export const rankIndex = (intel: number): number => {
  let i = 0;
  RANKS.forEach((r, idx) => {
    if (intel >= r.intel) i = idx;
  });
  return i;
};

export const rankName = (intel: number): string => RANKS[rankIndex(intel)]!.name;

export const nextRankIntel = (intel: number): number | null => {
  const next = RANKS[rankIndex(intel) + 1];
  return next ? next.intel : null;
};

export const stamp = (): string =>
  new Date().toISOString().slice(11, 19);

export const initialState = (): GameState => ({
  phase: "offline",
  operator: null,
  tab: "command",
  credits: 2500,
  intel: 0,
  heat: 0,
  takedowns: 0,
  selected: TARGETS[0]!.id,
  active: [TARGETS[0]!.id],
  generated: [],
  progress: Object.fromEntries(
    TARGETS.map((t) => [t.id, { evidence: [], seized: false }]),
  ),
  owned: [...STARTER_OWNED],
  installed: { ...DEFAULT_INSTALLED },
  perks: [],
  mining: {
    coin: "GHST",
    units: {},
    alloc: {},
    contract: "pow-1",
    balances: { BTC: 0, ETH: 0, GHST: 0 },
    lastTick: 0,
  },
  quality: "balanced",
  brightness: 1.25,
  audio: { muted: false, music: 0.45, sfx: 0.7 },
  guideSeen: false,
  premium: { expiresAt: null, lastClaimOn: null, syncedAt: 0 },
  prestige: 0,
  prestigeClaimed: [],
  lifetime: { credits: 0, takedowns: 0, intel: 0 },
  log: [],
  nextLineId: 1,
});

/**
 * Whether the Operative Pass is currently active. The server is authoritative;
 * this only reads the last synced expiry so the UI and yield math agree offline.
 */
export const isPremiumActive = (s: GameState, now: number = Date.now()): boolean =>
  s.premium.expiresAt !== null && s.premium.expiresAt > now;

/** UTC day key used for the once-per-day pass drop. */
export const utcDayKey = (now: number = Date.now()): string =>
  new Date(now).toISOString().slice(0, 10);

/** A pass holder can claim once per UTC day. */
export const canClaimDaily = (s: GameState, now: number = Date.now()): boolean =>
  isPremiumActive(s, now) && s.premium.lastClaimOn !== utcDayKey(now);

const BASE_STATS: RigStats = {
  crack: 0.28,
  dissipation: 0,
  scan: 1,
  bounty: 0,
  miningMul: 1,
  coolingWatts: 0,
  opSlots: 1,
  failHeatMul: 1,
  miningHeatMul: 1,
};

export const deriveStats = (s: GameState): RigStats => {
  const out: { -readonly [K in keyof RigStats]: RigStats[K] } = { ...BASE_STATS };
  const contributing: Item[] = [];
  Object.values(s.installed).forEach((id) => {
    const it = itemById(id);
    if (it) contributing.push(it);
  });
  s.owned.forEach((id) => {
    const it = itemById(id);
    if (it && (it.category === "tools" || it.category === "perks")) contributing.push(it);
  });
  contributing.forEach((it) => {
    const st = it.stats;
    if (!st) return;
    out.crack += st.crack ?? 0;
    out.dissipation += st.dissipation ?? 0;
    out.scan += st.scan ?? 0;
    out.bounty += st.bounty ?? 0;
    out.coolingWatts += st.coolingWatts ?? 0;
    out.opSlots += st.opSlots ?? 0;
    if (st.miningMul) out.miningMul *= st.miningMul;
    if (st.failHeatMul) out.failHeatMul *= st.failHeatMul;
    if (st.miningHeatMul) out.miningHeatMul *= st.miningHeatMul;
  });
  const pb = prestigeBonuses(s);
  out.bounty += pb.bounty;
  out.miningMul *= pb.miningMul;
  if (isPremiumActive(s)) out.miningMul *= PREMIUM_MINING_MUL;
  out.opSlots += pb.opSlots;
  out.crack += pb.crack;
  out.dissipation += pb.dissipation;
  out.crack = Math.min(0.92, out.crack);
  out.failHeatMul = Math.max(0.15, out.failHeatMul);
  out.miningHeatMul = Math.max(0.2, out.miningHeatMul);
  return out;
};

/** Every multiplicative contribution to mining yield, for the transparency panel. */
export const miningMulBreakdown = (s: GameState): { label: string; mul: number }[] => {
  const out: { label: string; mul: number }[] = [];
  const seen: Item[] = [];
  Object.values(s.installed).forEach((id) => {
    const it = itemById(id);
    if (it) seen.push(it);
  });
  s.owned.forEach((id) => {
    const it = itemById(id);
    if (it && (it.category === "tools" || it.category === "perks")) seen.push(it);
  });
  seen.forEach((it) => {
    const m = it.stats?.miningMul;
    if (m && m !== 1) out.push({ label: it.name, mul: m });
  });
  const pb = prestigeBonuses(s);
  if (pb.miningMul !== 1) out.push({ label: `Prestige ${s.prestige}`, mul: pb.miningMul });
  if (isPremiumActive(s)) out.push({ label: "Operative Pass", mul: PREMIUM_MINING_MUL });
  return out;
};

export type CoinReadout = {
  hash: number;
  effectiveHash: number;
  coinPerSec: number;
  difficulty: number;
  bid: number;
  revenuePerSec: number;
  units: number;
};

export type MiningReadout = {
  hash: number;
  effectiveHash: number;
  watts: number;
  capacityW: number;
  heatLoad: number;
  coolingCap: number;
  throttle: number;
  slots: number;
  slotsUsed: number;
  coinPerSec: number;
  costPerSec: number;
  netPerSec: number;
  price: number;
  bid: number;
  ask: number;
  spreadPct: number;
  change24h: number;
  regime: Regime;
  difficulty: number;
  contract: ContractRead;
  overageW: number;
  breakEven: number;
  dailyNet: number;
  limiter: string;
  coins: Record<Coin, CoinReadout>;
  totalNetPerSec: number;
  /** raw catalogue hashrate before throttle and multipliers */
  rawHash: number;
  yieldMul: number;
  mulBreakdown: { label: string; mul: number }[];
  revenuePerSec: number;
  dailyGross: number;
  dailyPower: number;
};

const COIN_LIST: readonly Coin[] = ["BTC", "ETH", "GHST"];

/** How many units of a hardware type are pointed at each coin. */
export const unitAllocation = (
  s: GameState,
  id: string,
): Record<Coin, number> => {
  const total = s.mining.units[id] ?? 0;
  const saved = s.mining.alloc[id] ?? {};
  const out = { BTC: 0, ETH: 0, GHST: 0 } as Record<Coin, number>;
  let used = 0;
  COIN_LIST.forEach((c) => {
    const n = Math.max(0, Math.min(total - used, saved[c] ?? 0));
    out[c] = n;
    used += n;
  });
  out[s.mining.coin] += Math.max(0, total - used);
  return out;
};

export const coinPrice = (coin: Coin, at: number): number => {
  return quote(coin, at).mid;
};

export const deriveMining = (s: GameState, at: number): MiningReadout => {
  const stats = deriveStats(s);
  let hash = 0;
  let watts = 0;
  let heat = 0;
  let cooling = 0;
  let slots = 0;
  let slotsUsed = 0;
  const coinHash = { BTC: 0, ETH: 0, GHST: 0 } as Record<Coin, number>;
  const coinUnits = { BTC: 0, ETH: 0, GHST: 0 } as Record<Coin, number>;
  Object.entries(s.mining.units).forEach(([id, count]) => {
    const it = itemById(id);
    const m = it?.mining;
    if (!m || !count) return;
    if (m.kind === "shelf") {
      slots += (m.slots ?? 0) * count;
      return;
    }
    if (m.kind === "cooler") {
      cooling += -m.heat * count;
      watts += m.watts * count;
      return;
    }
    slotsUsed += count;
    hash += m.hash * count;
    watts += m.watts * count;
    heat += m.heat * count * stats.miningHeatMul;
    const alloc = unitAllocation(s, id);
    COIN_LIST.forEach((c) => {
      coinHash[c] += m.hash * alloc[c];
      coinUnits[c] += alloc[c];
    });
  });
  cooling += stats.coolingWatts / 100;
  const contract = contractRead(s.mining.contract, at);
  const capacityW = contract.capacityW;

  // Over-capacity draw is allowed but billed at a punitive rate, and the
  // breaker sags: only a small amount of overdraw is tolerated.
  const overageW = Math.max(0, watts - capacityW);
  const powerThrottle = watts > capacityW * 1.25 ? (capacityW * 1.25) / watts : 1;
  const heatLoad = Math.max(0, heat - cooling);
  const heatThrottle = heatLoad > 0 ? Math.max(0.15, 1 - heatLoad / 120) : 1;
  const slotThrottle = slotsUsed > slots ? Math.max(0.2, slots / Math.max(1, slotsUsed)) : 1;
  const throttle = powerThrottle * heatThrottle * slotThrottle;

  const effectiveHash = hash * throttle * stats.miningMul;
  const coins = {} as Record<Coin, CoinReadout>;
  let revenuePerSec = 0;
  COIN_LIST.forEach((c) => {
    const eff = coinHash[c] * throttle * stats.miningMul;
    const d = difficulty(c, at, eff);
    const cps = (eff * COINS[c].perHash) / d;
    const cq = quote(c, at);
    const rev = cps * cq.bid;
    revenuePerSec += rev;
    coins[c] = {
      hash: coinHash[c],
      effectiveHash: eff,
      coinPerSec: cps,
      difficulty: d,
      bid: cq.bid,
      revenuePerSec: rev,
      units: coinUnits[c],
    };
  });
  const sel = coins[s.mining.coin]!;
  const diff = sel.difficulty;
  const coinPerSec = sel.coinPerSec;
  const q = quote(s.mining.coin, at);
  const drawnW = watts * throttle;
  const billedOverW = Math.max(0, drawnW - capacityW);
  const energyCost =
    (((drawnW - billedOverW) / 1000) * contract.rate +
      (billedOverW / 1000) * contract.rate * contract.overageMul) /
    3600;
  const demandCost = (contract.demandPerKw * (drawnW / 1000)) / 3600;
  const costPerSec = energyCost + demandCost;

  const breakEven = coinPerSec > 0 ? costPerSec / coinPerSec : 0;
  const netPerSec = revenuePerSec - costPerSec;

  const limiter =
    slotsUsed > slots
      ? "RACK SLOTS"
      : heatThrottle < 0.92
        ? "THERMALS"
        : powerThrottle < 1
          ? "POWER CEILING"
          : overageW > 0
            ? "OVERAGE BILLING"
            : hash === 0
              ? "NO HARDWARE"
              : "NONE";

  return {
    hash,
    effectiveHash,
    watts: Math.round(drawnW),
    capacityW,
    heatLoad,
    coolingCap: cooling,
    throttle,
    slots,
    slotsUsed,
    coinPerSec,
    costPerSec,
    netPerSec,
    price: q.mid,
    bid: q.bid,
    ask: q.ask,
    spreadPct: q.spreadPct,
    change24h: q.change24h,
    regime: q.regime,
    difficulty: diff,
    contract,
    overageW,
    breakEven,
    dailyNet: netPerSec * 86400,
    limiter,
    coins,
    totalNetPerSec: netPerSec,
    rawHash: hash,
    yieldMul: stats.miningMul,
    mulBreakdown: miningMulBreakdown(s),
    revenuePerSec,
    dailyGross: revenuePerSec * 86400,
    dailyPower: costPerSec * 86400,
  };
};

/** Base cases plus every procedurally generated target, newest first. */
export const allTargets = (s: GameState): readonly Target[] => [...s.generated, ...TARGETS];

export const findTarget = (s: GameState, id: string | null | undefined): Target | undefined =>
  id ? (s.generated.find((t) => t.id === id) ?? targetById(id)) : undefined;

export const evidencePct = (s: GameState, id: string): number => {
  const p = s.progress[id];
  const t = findTarget(s, id);
  if (!p || !t) return 0;
  return Math.round((p.evidence.length / t.ops.length) * 100);
};

export type Action =
  | { type: "boot" }
  | { type: "login"; handle: string }
  | { type: "logout" }
  | { type: "brightness"; value: number }
  | { type: "audio"; patch: Partial<AudioSettings> }
  | { type: "tab"; tab: TabId }
  | { type: "guide-seen" }
  | { type: "select"; id: string }
  | { type: "engage"; id: string }
  | { type: "drop"; id: string }
  | { type: "spawn"; target: Target }
  | { type: "log"; text: string; tone?: Tone }
  | { type: "op"; targetId: string; kind: OpKind; success: boolean }
  | { type: "report"; targetId: string }
  | { type: "buy"; id: string }
  | { type: "install"; id: string }
  | { type: "grant-credits"; amount: number; reason: string }
  | { type: "grant-items"; ids: readonly string[]; reason: string }
  | { type: "premium-sync"; expiresAt: number | null; lastClaimOn: string | null; at: number }
  | { type: "scrub" }
  | { type: "mining-coin"; coin: Coin }
  | { type: "mining-unit"; id: string; delta: number }
  | { type: "mining-assign"; id: string; coin: Coin; delta: number }
  | { type: "mining-contract"; id: string }
  | { type: "mining-accrue"; amounts: Partial<Record<Coin, number>>; cost: number; at: number }
  | { type: "sell"; coin: Coin; at: number }
  | { type: "quality"; quality: Quality }
  | { type: "restore"; saved: Partial<GameState> }
  | { type: "prestige" }
  | { type: "reset" };

const pushLog = (s: GameState, text: string, tone: Tone = "sys"): GameState => {
  const line: LogLine = { id: s.nextLineId, stamp: stamp(), text, tone };
  return {
    ...s,
    log: [...s.log, line].slice(-160),
    nextLineId: s.nextLineId + 1,
  };
};

const withHeat = (s: GameState, delta: number): GameState => {
  const stats = deriveStats(s);
  const adj = delta > 0 ? delta * Math.max(0.25, 1 - stats.dissipation / 60) : delta;
  const heat = Math.max(0, Math.min(100, s.heat + adj));
  if (heat >= 100) {
    const fine = Math.round(s.credits * 0.35);
    let next = { ...s, heat: 22, credits: Math.max(0, s.credits - fine) };
    next = pushLog(next, "TRACE COMPLETE — counter-intrusion detected your uplink.", "bad");
    next = pushLog(next, `Emergency relocation cost ${fine.toLocaleString()} cr. Heat reset to 22%.`, "warn");
    return next;
  }
  return { ...s, heat };
};

export const reducer = (s: GameState, a: Action): GameState => {
  switch (a.type) {
    case "boot": {
      return { ...s, phase: "auth" };
    }
    case "login": {
      const handle = a.handle.trim().slice(0, 18) || "GHOSTHAND";
      let next: GameState = { ...s, phase: "online", operator: handle };
      next = pushLog(next, `H.C.C console online. Welcome back, ${handle}.`, "ok");
      next = pushLog(next, "Clearance TASK-FORCE / BLACKSITE granted.", "sys");
      next = pushLog(next, `${allTargets(next).filter((t) => !next.progress[t.id]?.seized).length} active cases loaded from the field queue.`, "sys");
      return next;
    }
    case "logout":
      return { ...s, phase: "auth", operator: null };
    case "brightness":
      return { ...s, brightness: Math.max(0.6, Math.min(2.4, a.value)) };
    case "audio":
      return { ...s, audio: { ...s.audio, ...a.patch } };
    case "tab":
      return { ...s, tab: a.tab };
    case "guide-seen":
      return { ...s, guideSeen: true };
    case "select":
      return { ...s, selected: a.id };
    case "engage": {
      const t = findTarget(s, a.id);
      if (!t) return s;
      if (s.progress[a.id]?.seized) return { ...s, selected: a.id };
      if (s.active.includes(a.id)) return { ...s, selected: a.id };
      const slots = Math.max(1, Math.round(deriveStats(s).opSlots));
      if (s.active.length >= slots) {
        return pushLog(
          { ...s, selected: a.id },
          `All ${slots} channel${slots === 1 ? "" : "s"} are in use. Release a case or buy parallel-op tooling in the SHOP.`,
          "warn",
        );
      }
      const next: GameState = { ...s, selected: a.id, active: [...s.active, a.id] };
      return pushLog(next, `Case engaged — ${t.codename}. ${next.active.length}/${slots} channels in use.`, "sys");
    }
    case "drop": {
      if (!s.active.includes(a.id)) return s;
      const t = findTarget(s, a.id);
      return pushLog(
        {
          ...s,
          active: s.active.filter((id) => id !== a.id),
          progress: { ...s.progress, [a.id]: { evidence: [], seized: s.progress[a.id]?.seized ?? false } },
        },
        `Released ${t?.codename ?? a.id}. Channel free.`,
        "dim",
      );
    }
    case "spawn": {
      if (s.generated.some((t) => t.id === a.target.id)) return s;
      let next: GameState = {
        ...s,
        generated: [a.target, ...s.generated].slice(0, 24),
        progress: { ...s.progress, [a.target.id]: { evidence: [], seized: false } },
      };
      next = pushLog(next, `NEW CYBER CRIMINAL DETECTED — ${a.target.codename} (${a.target.threat}).`, "warn");
      next = pushLog(next, `${a.target.allegation} · host ${a.target.host} · bounty ${a.target.bounty.toLocaleString()} cr`, "sys");
      return next;
    }
    case "log":
      return pushLog(s, a.text, a.tone ?? "sys");
    case "op": {
      const t = findTarget(s, a.targetId);
      if (!t) return s;
      if (!s.active.includes(a.targetId)) {
        return pushLog(s, `${t.codename} is not an engaged case.`, "warn");
      }
      const op = t.ops.find((o) => o.kind === a.kind);
      if (!op) return s;
      if (!a.success) {
        const fh = deriveStats(s).failHeatMul;
        let next = pushLog(s, `${op.label} failed on ${t.codename}. Session dropped.`, "bad");
        next = withHeat(next, 9 * fh);
        return next;
      }
      const prev = s.progress[a.targetId] ?? { evidence: [], seized: false };
      if (prev.evidence.includes(a.kind)) {
        return pushLog(s, `${op.label} already filed for ${t.codename}.`, "dim");
      }
      const evidence = [...prev.evidence, a.kind];
      let next: GameState = {
        ...s,
        intel: s.intel + Math.round(t.intel * 0.15),
        progress: { ...s.progress, [a.targetId]: { ...prev, evidence } },
      };
      next = pushLog(next, `EVIDENCE FILED — ${op.captured}`, "ok");
      next = withHeat(next, 4);
      if (evidence.length === t.ops.length) {
        next = pushLog(next, `${t.codename} dossier complete. Ready to submit to task force.`, "warn");
      }
      return next;
    }
    case "report": {
      const t = findTarget(s, a.targetId);
      const p = s.progress[a.targetId];
      if (!t || !p || p.seized) return s;
      if (p.evidence.length < t.ops.length) {
        return pushLog(s, `Dossier for ${t.codename} is incomplete. Task force will not act.`, "warn");
      }
      const stats = deriveStats(s);
      const payout = Math.round(t.bounty * (1 + stats.bounty));
      let next: GameState = {
        ...s,
        credits: s.credits + payout,
        intel: s.intel + t.intel,
        takedowns: s.takedowns + 1,
        lifetime: {
          credits: s.lifetime.credits + payout,
          takedowns: s.lifetime.takedowns + 1,
          intel: s.lifetime.intel + t.intel,
        },
        progress: { ...s.progress, [a.targetId]: { ...p, seized: true } },
      };
      next = pushLog(next, `SERVER SEIZED — ${t.host} (${t.codename}) is offline.`, "ok");
      next = { ...next, active: next.active.filter((id) => id !== a.targetId) };
      next = pushLog(
        next,
        `${t.operator.realName} ("${t.operator.alias}") detained in ${t.operator.location}.`,
        "ok",
      );
      next = pushLog(next, `Bounty settled: ${payout.toLocaleString()} cr · +${t.intel} intel`, "ok");
      next = withHeat(next, -18);
      return next;
    }
    case "buy": {
      const it = itemById(a.id);
      if (!it) return s;
      // Stars-exclusive goods have no credit price and must never be bought with credits.
      if (isStarsOnlyItem(a.id) && !s.owned.includes(a.id))
        return pushLog(s, `${it.name} is only available through Telegram Stars.`, "warn");
      if (!it.stackable && s.owned.includes(a.id)) return s;
      if (s.credits < it.price) return pushLog(s, "Insufficient credits.", "warn");
      let next: GameState = {
        ...s,
        credits: s.credits - it.price,
        owned: s.owned.includes(a.id) ? s.owned : [...s.owned, a.id],
      };
      if (it.category === "mining" && it.mining && it.mining.kind !== "contract") {
        next = {
          ...next,
          mining: {
            ...next.mining,
            units: { ...next.mining.units, [a.id]: (next.mining.units[a.id] ?? 0) + 1 },
          },
        };
      }
      if (it.slot) {
        next = { ...next, installed: { ...next.installed, [it.slot]: a.id } };
      }
      if (it.category === "mining" && it.mining?.kind === "contract") {
        next = { ...next, mining: { ...next.mining, contract: a.id } };
      }
      return pushLog(next, `Acquired ${it.name} for ${it.price.toLocaleString()} cr.`, "ok");
    }
    case "grant-credits": {
      if (!(a.amount > 0)) return s;
      return pushLog(
        { ...s, credits: s.credits + a.amount },
        `${a.reason} — +${Math.round(a.amount).toLocaleString()} cr credited.`,
        "ok",
      );
    }
    /** Fulfilment of a server-verified Stars purchase. Never called from raw UI. */
    case "grant-items": {
      const items = a.ids.map(itemById).filter((i): i is Item => !!i);
      if (items.length === 0) return s;
      let next: GameState = {
        ...s,
        owned: [...new Set([...s.owned, ...items.map((i) => i.id)])],
      };
      items.forEach((it) => {
        if (it.category === "mining" && it.mining && it.mining.kind !== "contract") {
          next = {
            ...next,
            mining: {
              ...next.mining,
              units: { ...next.mining.units, [it.id]: (next.mining.units[it.id] ?? 0) + 1 },
            },
          };
        }
        if (it.slot) next = { ...next, installed: { ...next.installed, [it.slot]: it.id } };
      });
      return pushLog(next, `${a.reason} — ${items.map((i) => i.name).join(", ")} unlocked.`, "ok");
    }
    case "premium-sync": {
      const wasActive = isPremiumActive(s, a.at);
      const next: GameState = {
        ...s,
        premium: { expiresAt: a.expiresAt, lastClaimOn: a.lastClaimOn, syncedAt: a.at },
      };
      const nowActive = isPremiumActive(next, a.at);
      if (nowActive && !wasActive)
        return pushLog(next, "Operative Pass active — +50% mining yield and a daily credit drop.", "ok");
      if (!nowActive && wasActive) return pushLog(next, "Operative Pass expired.", "warn");
      return next;
    }

    case "install": {
      const it = itemById(a.id);
      if (!it?.slot || !s.owned.includes(a.id)) return s;
      return pushLog(
        { ...s, installed: { ...s.installed, [it.slot]: a.id } },
        `${it.name} installed.`,
        "sys",
      );
    }
    case "scrub": {
      const cost = 600;
      if (s.credits < cost) return pushLog(s, "Insufficient credits to scrub logs.", "warn");
      let next = { ...s, credits: s.credits - cost };
      next = withHeat(next, -30);
      return pushLog(next, "Logs scrubbed across all relays. Trace heat reduced.", "ok");
    }
    case "mining-coin":
      return pushLog({ ...s, mining: { ...s.mining, coin: a.coin } }, `Mining switched to ${a.coin}.`, "sys");
    case "mining-contract": {
      if (a.id === s.mining.contract) return s;
      const fee = itemById(s.mining.contract)?.mining?.switchFee ?? 0;
      if (fee > s.credits) return pushLog(s, `Switch fee of ${fee.toLocaleString()} cr unaffordable.`, "warn");
      const next: GameState = {
        ...s,
        credits: s.credits - fee,
        mining: { ...s.mining, contract: a.id },
      };
      return pushLog(
        next,
        fee > 0
          ? `Power contract switched. Early-termination fee ${fee.toLocaleString()} cr.`
          : "Power contract switched.",
        fee > 0 ? "warn" : "sys",
      );
    }
    case "mining-unit": {
      const cur = s.mining.units[a.id] ?? 0;
      const nextCount = Math.max(0, cur + a.delta);
      return { ...s, mining: { ...s.mining, units: { ...s.mining.units, [a.id]: nextCount } } };
    }
    case "mining-assign": {
      const total = s.mining.units[a.id] ?? 0;
      const cur = unitAllocation(s, a.id);
      const next = Math.max(0, Math.min(total, (s.mining.alloc[a.id]?.[a.coin] ?? cur[a.coin]) + a.delta));
      const others = { ...(s.mining.alloc[a.id] ?? {}) };
      const explicit: Partial<Record<Coin, number>> = { ...others, [a.coin]: next };
      const sum = COIN_LIST.reduce((acc, c) => acc + (explicit[c] ?? 0), 0);
      if (sum > total) return s;
      return { ...s, mining: { ...s.mining, alloc: { ...s.mining.alloc, [a.id]: explicit } } };
    }
    case "mining-accrue":
      return {
        ...s,
        credits: Math.max(0, s.credits - a.cost),
        mining: {
          ...s.mining,
          lastTick: a.at,
          balances: COIN_LIST.reduce(
            (acc, c) => ({ ...acc, [c]: s.mining.balances[c] + (a.amounts[c] ?? 0) }),
            {} as Record<Coin, number>,
          ),
        },
      };
    case "sell": {
      const amount = s.mining.balances[a.coin];
      if (amount <= 0) return s;
      const sq = sellQuote(a.coin, a.at, amount);
      const gross = Math.round(sq.gross);
      let next: GameState = {
        ...s,
        credits: s.credits + gross,
        mining: { ...s.mining, balances: { ...s.mining.balances, [a.coin]: 0 } },
      };
      return pushLog(
        next,
        `Filled ${amount.toFixed(6)} ${a.coin} at ${Math.round(sq.price).toLocaleString()} cr` +
          ` (spread ${(sq.quote.spreadPct * 100).toFixed(2)}%, slip ${(sq.slip * 100).toFixed(2)}%)` +
          ` → ${gross.toLocaleString()} cr.`,
        "ok",
      );
    }
    case "quality":
      return { ...s, quality: a.quality };
    case "restore": {
      const base = initialState();
      const sv = a.saved;
      return {
        ...base,
        ...sv,
        phase: s.phase,
        tab: s.tab,
        log: s.log,
        nextLineId: s.nextLineId,
        generated: sv.generated ?? [],
        active: sv.active ?? base.active,
        progress: { ...base.progress, ...(sv.progress ?? {}) },
        installed: { ...base.installed, ...(sv.installed ?? {}) },
        owned: Array.from(new Set([...base.owned, ...(sv.owned ?? [])])),
        mining: { ...base.mining, ...(sv.mining ?? {}) },
        prestige: sv.prestige ?? 0,
        prestigeClaimed: sv.prestigeClaimed ?? [],
        lifetime: { ...base.lifetime, ...(sv.lifetime ?? {}) },
        premium: { ...base.premium, ...(sv.premium ?? {}) },
      };
    }
    case "prestige": {
      if (!canPrestige(s)) return pushLog(s, "Prestige requirements not met.", "warn");
      const level = s.prestige + 1;
      const reward = rewardForLevel(level);
      const base = initialState();
      // Stars-exclusive goods are paid for, so they are never taken by a prestige reset.
      const keptStarsItems = s.owned.filter(isStarsOnlyItem);
      let next: GameState = {
        ...base,
        owned: Array.from(new Set([...base.owned, ...keptStarsItems])),
        phase: s.phase,
        tab: s.tab,
        operator: s.operator,
        quality: s.quality,
        brightness: s.brightness,
        audio: s.audio,
        guideSeen: s.guideSeen,
        // paid entitlements survive prestige
        premium: s.premium,
        log: s.log,
        nextLineId: s.nextLineId,
        prestige: level,
        prestigeClaimed: reward ? [...s.prestigeClaimed, reward.id] : [...s.prestigeClaimed],
        lifetime: s.lifetime,
      };
      next = pushLog(next, `PRESTIGE ${level} — case files sealed, desk cleared, badge upgraded.`, "ok");
      if (reward) {
        next = pushLog(next, `MILESTONE — ${reward.name}: ${reward.detail}`, "warn");
        if (reward.effect.grant) {
          next = { ...next, credits: next.credits + reward.effect.grant };
          next = pushLog(next, `Restart grant: +${reward.effect.grant.toLocaleString()} cr.`, "ok");
        }
      } else {
        next = pushLog(next, `No milestone at this level — next payout at prestige ${Math.floor(level / 5) * 5 + 5}.`, "dim");
      }
      return next;
    }
    case "reset":
      return { ...initialState(), phase: "online" };
    default:
      return s;
  }
};

/** Items merchandised in the credit shop. Stars-exclusive goods are excluded. */
export const shopItems = (cat: Item["category"]): Item[] =>
  CATALOG.filter((i) => i.category === cat && !isStarsOnlyItem(i.id));

export const ownedSlotItems = (s: GameState, slot: Slot): Item[] =>
  CATALOG.filter((i) => i.slot === slot && s.owned.includes(i.id));
