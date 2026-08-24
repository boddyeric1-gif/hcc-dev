/**
 * Shared, pure economy rules for the server-authoritative credit ledger.
 *
 * Everything in this file is deterministic and dependency-free so the same
 * bounds are used by the server bridge (`wallet.server.ts`) and by tests.
 * The database is the source of truth for balances; these helpers decide the
 * *maximum* a client claim is allowed to be worth before it reaches the RPC.
 */
import { deriveMining, deriveStats, initialState } from "./state";
import type { Coin, GameState } from "./types";

/** Ledger transaction kinds. Mirrors `hcc_ledger.tx_type`. */
export type TxType =
  | "legacy_import"
  | "bounty"
  | "mining_reward"
  | "purchase"
  | "spend"
  | "stars_credit"
  | "daily_drop"
  | "prestige_grant";

/** Hard ceiling applied by the database to any single balance. */
export const MAX_BALANCE = 9_000_000_000_000_000;

/** One-time import of a pre-ledger local save is clamped to this. */
export const LEGACY_MAX_IMPORT = 50_000_000;

/** Bumped when the legacy import rules change; stored on the profile. */
export const LEGACY_MIGRATION_VERSION = 1;

/** Offline mining is only ever paid for this much elapsed real time. */
export const MINING_MAX_SECONDS = 12 * 60 * 60;

/**
 * The richest single case a player can plausibly close, before rig bonuses.
 * Generated targets top out near 14k; the headroom absorbs future tuning.
 */
const BOUNTY_BASE_CEILING = 20_000;

/** Tolerance for float drift between client and server derivation. */
const CLAIM_TOLERANCE = 1.1;

export type ServerProfile = {
  owned: readonly string[];
  installed: Record<string, string>;
  minerUnits: Record<string, number>;
  contract: string | null;
  prestige: number;
  premiumExpiresAt: number | null;
};

/**
 * Rebuilds a minimal GameState from server-owned entitlements so the shared
 * derivation functions can be reused without trusting any client numbers.
 */
export const stateFromProfile = (p: ServerProfile): GameState => {
  const base = initialState();
  return {
    ...base,
    owned: [...new Set([...base.owned, ...p.owned])],
    installed: { ...base.installed, ...p.installed },
    prestige: Math.max(0, Math.floor(p.prestige)),
    premium: { ...base.premium, expiresAt: p.premiumExpiresAt },
    mining: {
      ...base.mining,
      units: { ...p.minerUnits },
      contract: p.contract ?? base.mining.contract,
    },
  };
};

/** The most credits a single takedown may ever pay for this profile. */
export const bountyCap = (s: GameState): number =>
  Math.ceil(BOUNTY_BASE_CEILING * (1 + Math.max(0, deriveStats(s).bounty)) * CLAIM_TOLERANCE);

/**
 * Credits per second this rig can legitimately earn, net of power. Used as the
 * accrual rate for the server-side mining allowance.
 */
export const miningRatePerSec = (s: GameState, at: number): number => {
  const read = deriveMining(s, at);
  return Math.max(0, read.netPerSec) * CLAIM_TOLERANCE;
};

/** Clamps any credit figure to a safe, finite integer. */
export const safeCredits = (n: number): number => {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(MAX_BALANCE, Math.floor(n)));
};

/** Stable idempotency keys, so retries never double-credit. */
export const idemKey = {
  legacy: (userId: number) => `legacy:${userId}`,
  bounty: (userId: number, targetId: string) => `bounty:${userId}:${targetId}`,
  mining: (userId: number, coin: Coin, at: number) =>
    `mining:${userId}:${coin}:${Math.floor(at / 1000)}`,
  purchase: (userId: number, itemId: string, seq: number) => `buy:${userId}:${itemId}:${seq}`,
  spend: (userId: number, reason: string, at: number) =>
    `spend:${userId}:${reason}:${Math.floor(at / 1000)}`,
  stars: (chargeId: string) => `stars:${chargeId}`,
  daily: (userId: number, day: string) => `daily:${userId}:${day}`,
  prestige: (userId: number, level: number) => `prestige:${userId}:${level}`,
};

/**
 * In-memory reference implementation of the database ledger semantics.
 * The SQL functions are the real thing; this mirrors them exactly so the
 * invariants (idempotency, no negative balances, allowance accrual) can be
 * unit-tested without a database.
 */
export class MemoryLedger {
  balance = 0;
  allowance = 0;
  lastSettledAt: number;
  migrated = false;
  owned = new Set<string>();
  private readonly seen = new Map<string, number>();

  constructor(now = Date.now()) {
    this.lastSettledAt = now;
  }

  apply(amount: number, key?: string): { applied: boolean; balance: number } {
    if (key && this.seen.has(key)) return { applied: false, balance: this.balance };
    const next = Math.max(0, Math.min(MAX_BALANCE, this.balance + Math.floor(amount)));
    if (amount < 0 && this.balance + amount < 0) return { applied: false, balance: this.balance };
    this.balance = next;
    if (key) this.seen.set(key, next);
    return { applied: true, balance: next };
  }

  migrateLegacy(claimed: number): { applied: boolean; balance: number } {
    if (this.migrated) return { applied: false, balance: this.balance };
    this.migrated = true;
    return this.apply(Math.min(safeCredits(claimed), LEGACY_MAX_IMPORT), "legacy");
  }

  purchase(itemId: string, price: number, stackable: boolean, key: string) {
    if (!stackable && this.owned.has(itemId)) return { applied: false, balance: this.balance };
    if (this.balance < price) return { applied: false, balance: this.balance, insufficient: true };
    const res = this.apply(-price, key);
    if (res.applied) this.owned.add(itemId);
    return res;
  }

  settleMining(ratePerSec: number, claimed: number, now: number, key: string) {
    const elapsed = Math.min(Math.max(0, (now - this.lastSettledAt) / 1000), MINING_MAX_SECONDS);
    this.allowance += Math.max(0, ratePerSec) * elapsed;
    this.lastSettledAt = now;
    const granted = Math.max(0, Math.min(safeCredits(claimed), Math.floor(this.allowance)));
    this.allowance = Math.max(0, this.allowance - granted);
    if (granted === 0) return { granted: 0, clamped: claimed > 0, balance: this.balance };
    const res = this.apply(granted, key);
    return { granted: res.applied ? granted : 0, clamped: claimed > granted, balance: res.balance };
  }
}
