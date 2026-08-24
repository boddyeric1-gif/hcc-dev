/**
 * Server-side bridge to the authoritative credit ledger.
 *
 * Every mutation goes through a SECURITY DEFINER RPC that locks the wallet row,
 * enforces idempotency and refuses to go negative. Nothing here trusts a client
 * number: claims are always clamped against a value re-derived from
 * server-owned entitlements.
 */
import { premiumStatusFor } from "@/lib/telegram/stars.server";
import { itemById } from "./catalog";
import {
  LEGACY_MAX_IMPORT,
  LEGACY_MIGRATION_VERSION,
  MINING_MAX_SECONDS,
  bountyCap,
  idemKey,
  miningRatePerSec,
  safeCredits,
  stateFromProfile,
  type ServerProfile,
  type TxType,
} from "./ledger";
import type { Coin } from "./types";

export type AccountSnapshot = {
  balance: number;
  owned: string[];
  installed: Record<string, string>;
  minerUnits: Record<string, number>;
  contract: string | null;
  prestige: number;
  lastSettledAt: number;
  migrationComplete: boolean;
  now: number;
};

type ApplyResult = {
  applied: boolean;
  duplicate?: boolean;
  reason?: string | undefined;
  amount?: number;
  balance: number;
};

const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;

const fail = (scope: string, message: string): never => {
  console.error(`[wallet] ${scope}: ${message}`);
  throw new Error(`Wallet ${scope} failed`);
};

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
};

/** Full authoritative snapshot for a verified Telegram user. */
export async function accountFor(telegramUserId: number): Promise<AccountSnapshot> {
  const db = await admin();
  const { data, error } = await db.rpc("hcc_account", { _user_id: telegramUserId });
  if (error) fail("account", error.message);
  const o = asObject(data);
  return {
    balance: num(o["balance"]),
    owned: Array.isArray(o["owned"]) ? (o["owned"] as string[]) : [],
    installed: asObject(o["installed"]) as Record<string, string>,
    minerUnits: asObject(o["minerUnits"]) as Record<string, number>,
    contract: typeof o["contract"] === "string" ? o["contract"] : null,
    prestige: num(o["prestige"]),
    lastSettledAt: num(o["lastSettledAt"]),
    migrationComplete: o["migrationComplete"] === true,
    now: num(o["now"], Date.now()),
  };
}

async function profileFor(telegramUserId: number): Promise<{
  account: AccountSnapshot;
  profile: ServerProfile;
}> {
  const account = await accountFor(telegramUserId);
  const premium = await premiumStatusFor(telegramUserId);
  return {
    account,
    profile: {
      owned: account.owned,
      installed: account.installed,
      minerUnits: account.minerUnits,
      contract: account.contract,
      prestige: account.prestige,
      premiumExpiresAt: premium.expiresAt,
    },
  };
}

async function apply(
  telegramUserId: number,
  amount: number,
  txType: TxType,
  reason: string,
  key: string,
  metadata: Record<string, unknown> = {},
): Promise<ApplyResult> {
  const db = await admin();
  const { data, error } = await db.rpc("hcc_apply", {
    _user_id: telegramUserId,
    _amount: Math.trunc(amount),
    _tx_type: txType,
    _reason: reason,
    _idempotency_key: key,
    _metadata: metadata as never,
  });
  if (error) fail("apply", error.message);
  const o = asObject(data);
  return {
    applied: o["applied"] === true,
    duplicate: o["duplicate"] === true,
    reason: typeof o["reason"] === "string" ? o["reason"] : undefined,
    amount: num(o["amount"]),
    balance: num(o["balance"]),
  };
}

/**
 * One-time import of a pre-ledger local save. Clamped, recorded and refused on
 * every subsequent attempt, so a tampered local file can be worth at most the
 * clamp once per account.
 */
export async function migrateLegacyBalance(
  telegramUserId: number,
  claimedBalance: number,
): Promise<{ migrated: boolean; imported: number; clamped: boolean; balance: number }> {
  const db = await admin();
  const { data, error } = await db.rpc("hcc_migrate_legacy", {
    _user_id: telegramUserId,
    _claimed_balance: safeCredits(claimedBalance),
    _max_import: LEGACY_MAX_IMPORT,
    _source: "local_save_v2",
    _version: LEGACY_MIGRATION_VERSION,
  });
  if (error) fail("migrate", error.message);
  const o = asObject(data);
  return {
    migrated: o["migrated"] === true,
    imported: num(o["imported"]),
    clamped: o["clamped"] === true,
    balance: num(o["balance"]),
  };
}

/** Buys a catalogue item: price and entitlement come from the server catalogue. */
export async function purchaseItem(
  telegramUserId: number,
  itemId: string,
): Promise<{ ok: boolean; reason?: string | undefined; balance: number; owned: string[] }> {
  const item = itemById(itemId);
  if (!item) fail("purchase", `unknown item ${itemId}`);
  if (!(item!.price > 0)) {
    const snap = await accountFor(telegramUserId);
    return { ok: false, reason: "not_purchasable", balance: snap.balance, owned: snap.owned };
  }
  const mining = item!.mining;
  const db = await admin();
  const seq = Date.now();
  const { data, error } = await db.rpc("hcc_purchase", {
    _user_id: telegramUserId,
    _item_id: item!.id,
    _price: Math.trunc(item!.price),
    _stackable: item!.stackable === true,
    _slot: item!.slot ?? (null as unknown as string),
    _is_miner: !!mining && mining.kind !== "contract",
    _is_contract: !!mining && mining.kind === "contract",
    _idempotency_key: idemKey.purchase(telegramUserId, item!.id, seq),
  });
  if (error) fail("purchase", error.message);
  const o = asObject(data);
  const snap = await accountFor(telegramUserId);
  return {
    ok: o["applied"] === true,
    reason: typeof o["reason"] === "string" ? o["reason"] : undefined,
    balance: snap.balance,
    owned: snap.owned,
  };
}

/**
 * Pays a takedown bounty. The claim is capped by a bounty ceiling re-derived
 * from the player's server-side rig, and keyed per target so a case can only
 * ever pay once.
 */
export async function settleBounty(
  telegramUserId: number,
  targetId: string,
  claimed: number,
): Promise<{ granted: number; clamped: boolean; balance: number }> {
  const { profile } = await profileFor(telegramUserId);
  const cap = bountyCap(stateFromProfile(profile));
  const granted = Math.min(safeCredits(claimed), cap);
  const res = await apply(
    telegramUserId,
    granted,
    "bounty",
    `Bounty for ${targetId}`,
    idemKey.bounty(telegramUserId, targetId),
    { targetId, claimed, cap },
  );
  return { granted: res.applied ? granted : 0, clamped: safeCredits(claimed) > cap, balance: res.balance };
}

/**
 * Settles a mining sale. The database accrues an allowance from real elapsed
 * time at a rate re-derived from server-owned hardware, then pays out at most
 * that allowance — offline gains are real, but impossible gains are not.
 */
export async function settleMiningSale(
  telegramUserId: number,
  coin: Coin,
  claimed: number,
): Promise<{ granted: number; clamped: boolean; balance: number }> {
  const { profile } = await profileFor(telegramUserId);
  const rate = miningRatePerSec(stateFromProfile(profile), Date.now());
  const db = await admin();
  const { data, error } = await db.rpc("hcc_settle_mining", {
    _user_id: telegramUserId,
    _rate_per_sec: rate,
    _max_seconds: MINING_MAX_SECONDS,
    _claimed_credits: safeCredits(claimed),
    _idempotency_key: idemKey.mining(telegramUserId, coin, Date.now()),
  });
  if (error) fail("mining", error.message);
  const o = asObject(data);
  return {
    granted: num(o["granted"]),
    clamped: o["clamped"] === true,
    balance: num(o["balance"]),
  };
}

/** A server-validated sink (log scrubbing, contract fees, heat fines). */
export async function spendCredits(
  telegramUserId: number,
  amount: number,
  reason: string,
): Promise<{ ok: boolean; balance: number }> {
  const value = safeCredits(amount);
  if (value <= 0) {
    const snap = await accountFor(telegramUserId);
    return { ok: false, balance: snap.balance };
  }
  const res = await apply(
    telegramUserId,
    -value,
    "spend",
    reason,
    idemKey.spend(telegramUserId, reason, Date.now()),
    { reason },
  );
  return { ok: res.applied, balance: res.balance };
}

/** Credits a verified Telegram Stars purchase into the ledger, once per charge. */
export async function creditStars(
  telegramUserId: number,
  chargeId: string,
  credits: number,
): Promise<{ applied: boolean; balance: number }> {
  const res = await apply(
    telegramUserId,
    safeCredits(credits),
    "stars_credit",
    `Stars purchase ${chargeId}`,
    idemKey.stars(chargeId),
    { chargeId },
  );
  return { applied: res.applied, balance: res.balance };
}

/** Credits the once-per-UTC-day Operative Pass drop. */
export async function creditDailyDrop(
  telegramUserId: number,
  day: string,
  credits: number,
): Promise<{ applied: boolean; balance: number }> {
  const res = await apply(
    telegramUserId,
    safeCredits(credits),
    "daily_drop",
    `Operative Pass drop ${day}`,
    idemKey.daily(telegramUserId, day),
    { day },
  );
  return { applied: res.applied, balance: res.balance };
}

/** Advances server-owned prestige and pays any milestone grant exactly once. */
export async function commitPrestige(
  telegramUserId: number,
  level: number,
  grant: number,
): Promise<{ prestige: number; balance: number }> {
  const db = await admin();
  const { data, error } = await db.rpc("hcc_set_prestige", {
    _user_id: telegramUserId,
    _level: Math.max(0, Math.floor(level)),
  });
  if (error) fail("prestige", error.message);
  let balance = (await accountFor(telegramUserId)).balance;
  if (grant > 0) {
    const res = await apply(
      telegramUserId,
      safeCredits(grant),
      "prestige_grant",
      `Prestige ${level} milestone grant`,
      idemKey.prestige(telegramUserId, level),
      { level },
    );
    balance = res.balance;
  }
  return { prestige: num(data, level), balance };
}
