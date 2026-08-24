/**
 * Client-callable RPC surface for the credit ledger. Every function verifies
 * the Telegram `initData` HMAC server-side and derives the user id from it, so
 * a client can never act for another account or set its own balance.
 */
import { createServerFn } from "@tanstack/react-start";

import type { Coin } from "./types";

/**
 * Server-only modules are loaded inside handlers: this file is reachable from
 * the client bundle, and only handler bodies are stripped.
 */
const server = async () => {
  const [{ authenticateInitData }, wallet] = await Promise.all([
    import("@/lib/telegram/stars.server"),
    import("./wallet.server"),
  ]);
  return { authenticateInitData, ...wallet };
};

const requireSession = <T extends { initData?: unknown }>(input: T): T => {
  if (typeof input?.initData !== "string" || input.initData.length < 10)
    throw new Error("Missing Telegram session");
  return input;
};

const requireString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.length === 0) throw new Error(`Missing ${label}`);
  return value;
};

const requireNumber = (value: unknown, label: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Missing ${label}`);
  return value;
};

export const getWalletAccount = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string }) => requireSession(input))
  .handler(async ({ data }) => {
    const s = await server();
    return s.accountFor(s.authenticateInitData(data.initData));
  });

export const migrateWallet = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string; claimedBalance: number }) => {
    requireSession(input);
    requireNumber(input.claimedBalance, "balance");
    return input;
  })
  .handler(async ({ data }) => {
    const s = await server();
    const userId = s.authenticateInitData(data.initData);
    const result = await s.migrateLegacyBalance(userId, data.claimedBalance);
    return { ...result, account: await s.accountFor(userId) };
  });

export const buyWithCredits = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string; itemId: string }) => {
    requireSession(input);
    requireString(input.itemId, "item");
    return input;
  })
  .handler(async ({ data }) => {
    const s = await server();
    return s.purchaseItem(s.authenticateInitData(data.initData), data.itemId);
  });

export const claimBounty = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string; targetId: string; claimed: number }) => {
    requireSession(input);
    requireString(input.targetId, "target");
    requireNumber(input.claimed, "claim");
    return input;
  })
  .handler(async ({ data }) => {
    const s = await server();
    return s.settleBounty(s.authenticateInitData(data.initData), data.targetId, data.claimed);
  });

export const settleSale = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string; coin: Coin; claimed: number }) => {
    requireSession(input);
    requireString(input.coin, "coin");
    requireNumber(input.claimed, "claim");
    return input;
  })
  .handler(async ({ data }) => {
    const s = await server();
    return s.settleMiningSale(s.authenticateInitData(data.initData), data.coin, data.claimed);
  });

export const spendFromWallet = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string; amount: number; reason: string }) => {
    requireSession(input);
    requireNumber(input.amount, "amount");
    requireString(input.reason, "reason");
    return input;
  })
  .handler(async ({ data }) => {
    const s = await server();
    return s.spendCredits(s.authenticateInitData(data.initData), data.amount, data.reason);
  });

export const commitPrestigeLevel = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string; level: number; grant: number }) => {
    requireSession(input);
    requireNumber(input.level, "level");
    requireNumber(input.grant, "grant");
    return input;
  })
  .handler(async ({ data }) => {
    const s = await server();
    return s.commitPrestige(s.authenticateInitData(data.initData), data.level, data.grant);
  });
