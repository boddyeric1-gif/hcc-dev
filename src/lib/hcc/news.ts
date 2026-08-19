import type { Coin } from "./types";

/**
 * Market news and macro shocks. Everything is derived deterministically from the
 * clock, so headlines, their impact and their history are identical on every
 * device and survive reloads without any persisted state.
 */

export type NewsScope = Coin | "ALL";

export type NewsTone = "bull" | "bear" | "macro";

export type NewsTemplate = {
  readonly key: string;
  readonly headline: string;
  readonly detail: string;
  readonly tone: NewsTone;
  /** peak multiplier applied to mid price at the middle of the window */
  readonly priceMul: number;
  /** multiplier on the coin's volatility while active */
  readonly volMul: number;
  /** multiplier on the bid/ask spread while active */
  readonly spreadMul: number;
  /** multiplier on the energy rate while active (macro only) */
  readonly rateMul?: number;
  /** multiplier on the contract overage penalty while active (macro only) */
  readonly overageMul?: number;
  readonly macro?: boolean;
};

const COIN_NEWS: readonly NewsTemplate[] = [
  {
    key: "etf",
    headline: "Sovereign fund opens {COIN} desk",
    detail: "Bid depth thickens as an institutional allocator starts accumulating.",
    tone: "bull",
    priceMul: 1.34,
    volMul: 1.5,
    spreadMul: 0.75,
  },
  {
    key: "exch-halt",
    headline: "{COIN} withdrawals halted on a major exchange",
    detail: "Liquidity evaporates; quotes widen and sellers get punished.",
    tone: "bear",
    priceMul: 0.72,
    volMul: 2.4,
    spreadMul: 3.1,
  },
  {
    key: "hardfork",
    headline: "{COIN} hard fork scheduled",
    detail: "Traders front-run the split. Direction unclear, amplitude certain.",
    tone: "macro",
    priceMul: 1.08,
    volMul: 2.8,
    spreadMul: 1.8,
  },
  {
    key: "whale",
    headline: "Dormant whale moves 40k {COIN}",
    detail: "Order books flinch. Depth thins on the bid.",
    tone: "bear",
    priceMul: 0.86,
    volMul: 1.9,
    spreadMul: 2.0,
  },
  {
    key: "merchant",
    headline: "Payment processor adds {COIN} settlement",
    detail: "Steady organic demand, tighter books.",
    tone: "bull",
    priceMul: 1.18,
    volMul: 0.8,
    spreadMul: 0.65,
  },
  {
    key: "hack",
    headline: "Bridge exploit drains {COIN} liquidity pool",
    detail: "Confidence shock. Everyone hits the bid at once.",
    tone: "bear",
    priceMul: 0.64,
    volMul: 3.0,
    spreadMul: 3.6,
  },
];

const MACRO_NEWS: readonly NewsTemplate[] = [
  {
    key: "grid",
    headline: "Regional grid emergency declared",
    detail: "Utilities invoke surge pricing; overage penalties bite harder.",
    tone: "macro",
    priceMul: 0.97,
    volMul: 1.4,
    spreadMul: 1.5,
    rateMul: 1.85,
    overageMul: 1.6,
    macro: true,
  },
  {
    key: "heatwave",
    headline: "Heatwave warning across the corridor",
    detail: "Cooling loads spike and power is rationed at the meter.",
    tone: "macro",
    priceMul: 1,
    volMul: 1.2,
    spreadMul: 1.25,
    rateMul: 1.45,
    overageMul: 1.3,
    macro: true,
  },
  {
    key: "surplus",
    headline: "Hydro surplus floods the wholesale market",
    detail: "Energy is briefly cheap. Mine while it lasts.",
    tone: "bull",
    priceMul: 1.02,
    volMul: 0.9,
    spreadMul: 0.9,
    rateMul: 0.58,
    macro: true,
  },
  {
    key: "crackdown",
    headline: "Regulator opens probe into mining custody",
    detail: "Risk desks de-leverage across every ticker.",
    tone: "bear",
    priceMul: 0.8,
    volMul: 2.2,
    spreadMul: 2.4,
    rateMul: 1.15,
    macro: true,
  },
  {
    key: "rates",
    headline: "Central bank surprises with a rate cut",
    detail: "Risk assets catch a broad bid.",
    tone: "bull",
    priceMul: 1.22,
    volMul: 1.6,
    spreadMul: 0.85,
    macro: true,
  },
  {
    key: "outage",
    headline: "Undersea cable cut throttles routing",
    detail: "Latency chaos: orders land late and fills get worse.",
    tone: "bear",
    priceMul: 0.92,
    volMul: 1.8,
    spreadMul: 2.8,
    rateMul: 1.1,
    macro: true,
  },
];

export type NewsEvent = {
  readonly id: string;
  readonly scope: NewsScope;
  readonly headline: string;
  readonly detail: string;
  readonly tone: NewsTone;
  readonly start: number;
  readonly end: number;
  readonly template: NewsTemplate;
};

const MIN = 60000;
const BUCKET = 7 * MIN;

const hash01 = (n: number): number => {
  const x = Math.sin(n * 91.7 + 47.13) * 29713.5453;
  return x - Math.floor(x);
};

const SCOPES: readonly NewsScope[] = ["BTC", "ETH", "GHST", "ALL"];

const eventForBucket = (bucket: number): NewsEvent | null => {
  const roll = hash01(bucket * 3.11);
  if (roll > 0.42) return null;
  const scope = SCOPES[Math.floor(hash01(bucket * 7.7) * SCOPES.length)] ?? "ALL";
  const pool = scope === "ALL" ? MACRO_NEWS : COIN_NEWS;
  const template = pool[Math.floor(hash01(bucket * 13.3) * pool.length)]!;
  const start = bucket * BUCKET + Math.floor(hash01(bucket * 5.5) * BUCKET);
  const dur = (5 + hash01(bucket * 2.2) * 13) * MIN;
  return {
    id: `${bucket}-${template.key}`,
    scope,
    headline: template.headline.replace("{COIN}", scope === "ALL" ? "the market" : scope),
    detail: template.detail,
    tone: template.tone,
    start,
    end: start + dur,
    template,
  };
};

/** Every event overlapping the instant `at`, newest first. */
export const activeNews = (at: number): NewsEvent[] => {
  const b = Math.floor(at / BUCKET);
  const out: NewsEvent[] = [];
  for (let i = b - 4; i <= b + 1; i++) {
    const e = eventForBucket(i);
    if (e && at >= e.start && at < e.end) out.push(e);
  }
  return out.sort((a, z) => z.start - a.start);
};

/** Recent + active headlines for the news ticker. */
export const recentNews = (at: number, count = 5): NewsEvent[] => {
  const b = Math.floor(at / BUCKET);
  const out: NewsEvent[] = [];
  for (let i = b + 1; i >= b - 24 && out.length < count * 3; i--) {
    const e = eventForBucket(i);
    if (e && e.start <= at) out.push(e);
  }
  return out.sort((a, z) => z.start - a.start).slice(0, count);
};

/** 0 at the edges of the window, 1 at its centre — shocks ramp in and decay. */
export const intensity = (e: NewsEvent, at: number): number => {
  const p = (at - e.start) / Math.max(1, e.end - e.start);
  if (p <= 0 || p >= 1) return 0;
  return Math.sin(Math.PI * p) ** 0.7;
};

export type NewsImpact = {
  readonly priceMul: number;
  readonly volMul: number;
  readonly spreadMul: number;
  readonly rateMul: number;
  readonly overageMul: number;
  readonly events: readonly NewsEvent[];
};

const NEUTRAL: NewsImpact = {
  priceMul: 1,
  volMul: 1,
  spreadMul: 1,
  rateMul: 1,
  overageMul: 1,
  events: [],
};

const blend = (mul: number, k: number): number => 1 + (mul - 1) * k;

/** Combined market impact on a coin (pass "ALL" for energy/contract effects). */
export const newsImpact = (scope: NewsScope, at: number): NewsImpact => {
  const events = activeNews(at).filter((e) => e.scope === scope || e.scope === "ALL");
  if (events.length === 0) return NEUTRAL;
  let priceMul = 1;
  let volMul = 1;
  let spreadMul = 1;
  let rateMul = 1;
  let overageMul = 1;
  events.forEach((e) => {
    const k = intensity(e, at);
    priceMul *= blend(e.template.priceMul, k);
    volMul *= blend(e.template.volMul, k);
    spreadMul *= blend(e.template.spreadMul, k);
    rateMul *= blend(e.template.rateMul ?? 1, k);
    overageMul *= blend(e.template.overageMul ?? 1, k);
  });
  return { priceMul, volMul, spreadMul, rateMul, overageMul, events };
};
