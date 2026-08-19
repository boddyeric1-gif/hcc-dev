import { COINS, itemById } from "./catalog";
import type { Coin } from "./types";

export type Regime = "CALM" | "TRENDING" | "SPIKE";

const MIN = 60000;

const hash01 = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const seedOf = (coin: Coin): number => coin.charCodeAt(0) + coin.length * 7;

/** Slow, deterministic regime cycling per coin — changes roughly every 20 minutes. */
export const regimeOf = (coin: Coin, at: number): Regime => {
  const bucket = Math.floor(at / (20 * MIN)) + seedOf(coin);
  const r = hash01(bucket);
  const vol = COINS[coin].vol;
  if (r > 0.88 - vol) return "SPIKE";
  if (r > 0.55 - vol * 0.5) return "TRENDING";
  return "CALM";
};

const regimeGain: Record<Regime, number> = { CALM: 0.45, TRENDING: 1, SPIKE: 2.1 };

/** Mid price for a coin at a moment in time. Deterministic, no persisted state. */
export const midPrice = (coin: Coin, at: number): number => {
  const c = COINS[coin];
  const t = at / MIN;
  const s = seedOf(coin);
  const wave =
    Math.sin(t * 0.07 + s) * 0.55 +
    Math.sin(t * 0.23 + s * 0.3) * 0.28 +
    Math.sin(t * 0.61 + s * 1.7) * 0.12 +
    Math.sin(t * 1.9 + s * 0.9) * 0.05;
  const gain = regimeGain[regimeOf(coin, at)];
  return Math.max(1, c.base * (1 + wave * c.vol * gain));
};

/** Bid/ask spread widens with volatility, regime and thin books. */
export const spreadPct = (coin: Coin, at: number): number => {
  const c = COINS[coin];
  const base = 0.0018 + c.vol * 0.035;
  const gain = regimeGain[regimeOf(coin, at)];
  const jitter = 0.4 + hash01(Math.floor(at / (2 * MIN)) + seedOf(coin)) * 0.6;
  return base * gain * jitter;
};

export type Quote = {
  mid: number;
  bid: number;
  ask: number;
  spreadPct: number;
  regime: Regime;
  change24h: number;
};

export const quote = (coin: Coin, at: number): Quote => {
  const mid = midPrice(coin, at);
  const sp = spreadPct(coin, at);
  const prev = midPrice(coin, at - 24 * 60 * MIN);
  return {
    mid,
    bid: mid * (1 - sp / 2),
    ask: mid * (1 + sp / 2),
    spreadPct: sp,
    regime: regimeOf(coin, at),
    change24h: (mid - prev) / prev,
  };
};

export const priceHistory = (coin: Coin, at: number, points = 40, stepMs = 18 * MIN): number[] => {
  const out: number[] = [];
  for (let i = points - 1; i >= 0; i--) out.push(midPrice(coin, at - i * stepMs));
  return out;
};

/**
 * Network difficulty. Grows on a slow global schedule and rises further with the
 * player's own hashrate (their share of the network pushes the retarget up).
 */
export const difficulty = (coin: Coin, at: number, playerHash: number): number => {
  const c = COINS[coin];
  const days = at / (24 * 60 * MIN);
  const drift = 1 + Math.log1p(Math.max(0, days % 365)) * 0.06;
  const wobble = 1 + Math.sin(days * 1.3 + seedOf(coin)) * 0.05;
  const netHash = 6000 + 1400 / Math.max(0.05, c.vol);
  const crowd = 1 + playerHash / (netHash + playerHash) * 0.9;
  return drift * wobble * crowd;
};

/** Sell slippage: larger notional walks further down the book. */
export const slippagePct = (coin: Coin, notional: number): number => {
  const depth = COINS[coin].base * 900;
  return Math.min(0.06, (notional / depth) * 0.5);
};

export const sellQuote = (coin: Coin, at: number, amount: number) => {
  const q = quote(coin, at);
  const notional = amount * q.bid;
  const slip = slippagePct(coin, notional);
  const price = q.bid * (1 - slip);
  return { price, gross: amount * price, slip, quote: q };
};

export type ContractRead = {
  id: string;
  name: string;
  capacityW: number;
  baseRate: number;
  rate: number;
  peak: boolean;
  overageMul: number;
  switchFee: number;
  demandPerKw: number;
};

/** Peak window follows the local clock: 16:00–21:00 is expensive. */
export const isPeak = (at: number): boolean => {
  const h = new Date(at).getHours();
  return h >= 16 && h < 21;
};

export const contractRead = (id: string, at: number): ContractRead => {
  const it = itemById(id);
  const m = it?.mining;
  const baseRate = m?.pricePerKwh ?? 0.34;
  const peak = isPeak(at);
  const mul = peak ? (m?.peakMul ?? 1.6) : (m?.offPeakMul ?? 0.85);
  return {
    id,
    name: it?.name ?? "Unmetered",
    capacityW: (m?.capacityKw ?? 7) * 1000,
    baseRate,
    rate: baseRate * mul,
    peak,
    overageMul: m?.overageMul ?? 3,
    switchFee: m?.switchFee ?? 0,
    demandPerKw: m?.demandPerKw ?? 0,
  };
};
