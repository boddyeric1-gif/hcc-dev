import { callBotApi } from "./bot.server";
import { verifyInitData } from "./initdata.server";
import { CREDITS_PER_DAILY_DROP, buildInvoicePayload, starProductById, type StarProduct } from "./stars";

export function requireBotToken(): string {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return token;
}

export function authenticateInitData(initData: string): number {
  const verified = verifyInitData(initData, requireBotToken());
  if (!verified) throw new Error("Invalid Telegram session");
  return verified.telegramUserId;
}

export async function createInvoiceLink(product: StarProduct, telegramUserId: number): Promise<string> {
  return callBotApi<string>(requireBotToken(), "createInvoiceLink", {
    title: product.title,
    description: product.description,
    payload: buildInvoicePayload(product.id, telegramUserId),
    currency: "XTR",
    prices: [{ label: product.title, amount: product.stars }],
  });
}

/**
 * Records a completed Stars payment and, for subscriptions, extends the pass.
 * Rewards always come from the server-side product table, never from the update
 * payload. Returns false when the charge was already recorded (Telegram retry).
 */
export async function recordStarPayment(input: {
  chargeId: string;
  providerChargeId: string | null;
  telegramUserId: number;
  productId: string;
  stars: number;
}): Promise<boolean> {
  const product = starProductById(input.productId);
  if (!product) return false;
  const kind = product.days > 0 ? "subscription" : product.itemIds.length > 0 ? "items" : "credits";
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("star_purchases").insert({
    telegram_payment_charge_id: input.chargeId,
    provider_payment_charge_id: input.providerChargeId,
    telegram_user_id: input.telegramUserId,
    product_id: product.id,
    stars: input.stars,
    credits: product.credits,
    kind,
    item_ids: [...product.itemIds],
    sub_days: product.days,
  });
  if (error) {
    // 23505 = unique violation: Telegram redelivered an update we already handled.
    if (error.code === "23505") return false;
    console.error(`Failed to record star payment: ${error.message}`);
    throw new Error("Could not record payment");
  }

  if (product.days > 0) {
    const { error: subError } = await supabaseAdmin.rpc("hcc_grant_premium", {
      _user_id: input.telegramUserId,
      _days: product.days,
    });
    if (subError) {
      console.error(`Failed to grant premium pass: ${subError.message}`);
      throw new Error("Could not activate pass");
    }
  }
  return true;
}

export type PremiumSnapshot = {
  /** epoch ms, or null when the user has never held a pass */
  expiresAt: number | null;
  /** UTC date string of the last claimed daily drop */
  lastClaimOn: string | null;
  /** server clock, so the client can reason about drift */
  now: number;
};

async function readPremium(telegramUserId: number): Promise<PremiumSnapshot> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("premium_pass")
    .select("expires_at, last_claim_on")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();
  if (error) {
    console.error(`Failed to read premium pass: ${error.message}`);
    throw new Error("Could not read pass");
  }
  return {
    expiresAt: data?.expires_at ? Date.parse(data.expires_at) : null,
    lastClaimOn: data?.last_claim_on ?? null,
    now: Date.now(),
  };
}

export type ClaimResult = {
  credits: number;
  itemIds: string[];
  purchases: number;
  premium: PremiumSnapshot;
  /** authoritative balance after the claim, or null when the ledger is unavailable */
  balance: number | null;
};

/**
 * Atomically claims every unclaimed purchase for a user, returning the credits
 * and item unlocks owed. Claiming marks the rows so a replay grants nothing.
 */
export async function claimCreditsFor(telegramUserId: number): Promise<ClaimResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("star_purchases")
    .update({ claimed_at: new Date().toISOString() })
    .eq("telegram_user_id", telegramUserId)
    .is("claimed_at", null)
    .select("credits, item_ids, telegram_payment_charge_id");
  if (error) {
    console.error(`Failed to claim star credits: ${error.message}`);
    throw new Error("Could not claim credits");
  }
  const rows = data ?? [];
  const itemIds = [...new Set(rows.flatMap((r) => r.item_ids ?? []))];
  // Credits land in the authoritative ledger, keyed by charge id so a replay
  // of the same purchase can never pay twice.
  const { creditStars } = await import("@/lib/hcc/wallet.server");
  let balance: number | null = null;
  for (const row of rows) {
    if (row.credits > 0) {
      const res = await creditStars(telegramUserId, row.telegram_payment_charge_id, row.credits);
      balance = res.balance;
    }
  }
  return {
    credits: rows.reduce((sum, r) => sum + r.credits, 0),
    itemIds,
    purchases: rows.length,
    premium: await readPremium(telegramUserId),
    balance,
  };
}

/** Server-authoritative pass state for a verified Telegram user. */
export async function premiumStatusFor(telegramUserId: number): Promise<PremiumSnapshot> {
  return readPremium(telegramUserId);
}

/**
 * Claims the once-per-UTC-day pass drop. The database function performs the
 * date check and the write in one statement, so double taps grant nothing.
 */
export async function claimDailyFor(
  telegramUserId: number,
): Promise<{ credits: number; premium: PremiumSnapshot; balance: number | null }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("hcc_claim_daily", { _user_id: telegramUserId });
  if (error) {
    console.error(`Failed to claim daily drop: ${error.message}`);
    throw new Error("Could not claim daily drop");
  }
  const claimed = data === true;
  let balance: number | null = null;
  if (claimed) {
    const { creditDailyDrop } = await import("@/lib/hcc/wallet.server");
    const day = new Date().toISOString().slice(0, 10);
    balance = (await creditDailyDrop(telegramUserId, day, CREDITS_PER_DAILY_DROP)).balance;
  }
  return {
    credits: claimed ? CREDITS_PER_DAILY_DROP : 0,
    premium: await readPremium(telegramUserId),
    balance,
  };
}
