import { CATALOG, COINS, DEFAULT_INSTALLED, STARTER_OWNED, itemById } from "./catalog";
import { TARGETS, targetById } from "./targets";
import type {
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
  tab: "command",
  credits: 1200,
  intel: 0,
  heat: 0,
  takedowns: 0,
  selected: TARGETS[0]!.id,
  progress: Object.fromEntries(
    TARGETS.map((t) => [t.id, { evidence: [], seized: false }]),
  ),
  owned: [...STARTER_OWNED],
  installed: { ...DEFAULT_INSTALLED },
  perks: [],
  mining: {
    coin: "GHST",
    units: {},
    contract: "pow-1",
    balances: { BTC: 0, ETH: 0, GHST: 0 },
    lastTick: 0,
  },
  quality: "balanced",
  log: [],
  nextLineId: 1,
});

const BASE_STATS: RigStats = {
  crack: 0.28,
  dissipation: 0,
  scan: 1,
  bounty: 0,
  miningMul: 1,
  coolingWatts: 0,
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
    if (st.miningMul) out.miningMul *= st.miningMul;
  });
  out.crack = Math.min(0.92, out.crack);
  return out;
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
};

export const coinPrice = (coin: Coin, at: number): number => {
  const c = COINS[coin];
  const t = at / 60000;
  const wave =
    Math.sin(t * 0.7 + coin.length) * 0.6 +
    Math.sin(t * 0.23 + 1.7) * 0.3 +
    Math.sin(t * 2.1) * 0.1;
  return Math.max(1, c.base * (1 + wave * c.vol));
};

export const deriveMining = (s: GameState, at: number): MiningReadout => {
  const stats = deriveStats(s);
  let hash = 0;
  let watts = 0;
  let heat = 0;
  let cooling = 0;
  let slots = 0;
  let slotsUsed = 0;
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
    heat += m.heat * count;
  });
  cooling += stats.coolingWatts / 100;
  const contract = itemById(s.mining.contract)?.mining;
  const capacityW = (contract?.capacityKw ?? 7) * 1000;
  const pricePerKwh = contract?.pricePerKwh ?? 0.34;

  const powerThrottle = watts > capacityW ? capacityW / watts : 1;
  const heatLoad = Math.max(0, heat - cooling);
  const heatThrottle = heatLoad > 0 ? Math.max(0.15, 1 - heatLoad / 120) : 1;
  const slotThrottle = slotsUsed > slots ? Math.max(0.2, slots / Math.max(1, slotsUsed)) : 1;
  const throttle = powerThrottle * heatThrottle * slotThrottle;

  const effectiveHash = hash * throttle * stats.miningMul;
  const coinPerSec = effectiveHash * COINS[s.mining.coin].perHash;
  const price = coinPrice(s.mining.coin, at);
  const costPerSec = ((watts * throttle) / 1000) * pricePerKwh / 3600;
  return {
    hash,
    effectiveHash,
    watts: Math.round(watts * throttle),
    capacityW,
    heatLoad,
    coolingCap: cooling,
    throttle,
    slots,
    slotsUsed,
    coinPerSec,
    costPerSec,
    netPerSec: coinPerSec * price - costPerSec,
    price,
  };
};

export const evidencePct = (s: GameState, id: string): number => {
  const p = s.progress[id];
  const t = targetById(id);
  if (!p || !t) return 0;
  return Math.round((p.evidence.length / t.ops.length) * 100);
};

export type Action =
  | { type: "boot" }
  | { type: "tab"; tab: TabId }
  | { type: "select"; id: string }
  | { type: "log"; text: string; tone?: Tone }
  | { type: "op"; targetId: string; kind: OpKind; success: boolean }
  | { type: "report"; targetId: string }
  | { type: "buy"; id: string }
  | { type: "install"; id: string }
  | { type: "scrub" }
  | { type: "mining-coin"; coin: Coin }
  | { type: "mining-unit"; id: string; delta: number }
  | { type: "mining-contract"; id: string }
  | { type: "mining-accrue"; coin: Coin; amount: number; cost: number; at: number }
  | { type: "sell"; coin: Coin; price: number }
  | { type: "quality"; quality: Quality }
  | { type: "restore"; saved: Partial<GameState> }
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
      let next: GameState = { ...s, phase: "online" };
      next = pushLog(next, "H.C.C console online. Operator authenticated.", "ok");
      next = pushLog(next, "Four active cases loaded from the field queue.", "sys");
      return next;
    }
    case "tab":
      return { ...s, tab: a.tab };
    case "select":
      return { ...s, selected: a.id };
    case "log":
      return pushLog(s, a.text, a.tone ?? "sys");
    case "op": {
      const t = targetById(a.targetId);
      if (!t) return s;
      const op = t.ops.find((o) => o.kind === a.kind);
      if (!op) return s;
      if (!a.success) {
        let next = pushLog(s, `${op.label} failed on ${t.codename}. Session dropped.`, "bad");
        next = withHeat(next, 9);
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
      const t = targetById(a.targetId);
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
        progress: { ...s.progress, [a.targetId]: { ...p, seized: true } },
      };
      next = pushLog(next, `SERVER SEIZED — ${t.host} (${t.codename}) is offline.`, "ok");
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
    case "mining-contract":
      return { ...s, mining: { ...s.mining, contract: a.id } };
    case "mining-unit": {
      const cur = s.mining.units[a.id] ?? 0;
      const nextCount = Math.max(0, cur + a.delta);
      return { ...s, mining: { ...s.mining, units: { ...s.mining.units, [a.id]: nextCount } } };
    }
    case "mining-accrue":
      return {
        ...s,
        credits: Math.max(0, s.credits - a.cost),
        mining: {
          ...s.mining,
          lastTick: a.at,
          balances: { ...s.mining.balances, [a.coin]: s.mining.balances[a.coin] + a.amount },
        },
      };
    case "sell": {
      const amount = s.mining.balances[a.coin];
      if (amount <= 0) return s;
      const gross = Math.round(amount * a.price);
      let next: GameState = {
        ...s,
        credits: s.credits + gross,
        mining: { ...s.mining, balances: { ...s.mining.balances, [a.coin]: 0 } },
      };
      return pushLog(next, `Sold ${amount.toFixed(6)} ${a.coin} for ${gross.toLocaleString()} cr.`, "ok");
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
        progress: { ...base.progress, ...(sv.progress ?? {}) },
        installed: { ...base.installed, ...(sv.installed ?? {}) },
        owned: Array.from(new Set([...base.owned, ...(sv.owned ?? [])])),
        mining: { ...base.mining, ...(sv.mining ?? {}) },
      };
    }
    case "reset":
      return { ...initialState(), phase: "online" };
    default:
      return s;
  }
};

export const shopItems = (cat: Item["category"]): Item[] =>
  CATALOG.filter((i) => i.category === cat);

export const ownedSlotItems = (s: GameState, slot: Slot): Item[] =>
  CATALOG.filter((i) => i.slot === slot && s.owned.includes(i.id));
