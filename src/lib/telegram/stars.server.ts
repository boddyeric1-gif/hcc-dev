import { callBotApi } from "./bot.server";
import { verifyInitData } from "./initdata.server";
import { buildInvoicePayload, starProductById, type StarProduct } from "./stars";

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

/** Records a completed Stars payment. Returns false when the charge was already recorded. */
export async function recordStarPayment(input: {
  chargeId: string;
  providerChargeId: string | null;
  telegramUserId: number;
  productId: string;
  stars: number;
}): Promise<boolean> {
  const product = starProductById(input.productId);
  if (!product) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("star_purchases").insert({
    telegram_payment_charge_id: input.chargeId,
    provider_payment_charge_id: input.providerChargeId,
    telegram_user_id: input.telegramUserId,
    product_id: product.id,
    stars: input.stars,
    credits: product.credits,
  });
  if (error) {
    // 23505 = unique violation: Telegram redelivered an update we already handled.
    if (error.code === "23505") return false;
    console.error(`Failed to record star payment: ${error.message}`);
    throw new Error("Could not record payment");
  }
  return true;
}

/** Atomically claims every unclaimed purchase for a user and returns the credits owed. */
export async function claimCreditsFor(telegramUserId: number): Promise<{ credits: number; purchases: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("star_purchases")
    .update({ claimed_at: new Date().toISOString() })
    .eq("telegram_user_id", telegramUserId)
    .is("claimed_at", null)
    .select("credits");
  if (error) {
    console.error(`Failed to claim star credits: ${error.message}`);
    throw new Error("Could not claim credits");
  }
  const rows = data ?? [];
  return { credits: rows.reduce((sum, r) => sum + r.credits, 0), purchases: rows.length };
}
