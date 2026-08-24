import { createServerFn } from "@tanstack/react-start";

import {
  authenticateInitData,
  claimCreditsFor,
  claimDailyFor,
  createInvoiceLink,
  premiumStatusFor,
} from "./stars.server";
import { starProductById } from "./stars";

const requireSession = <T extends { initData?: unknown }>(input: T): T => {
  if (typeof input?.initData !== "string" || input.initData.length < 10)
    throw new Error("Missing Telegram session");
  return input;
};

export const createStarInvoice = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string; productId: string }) => {
    requireSession(input);
    if (typeof input?.productId !== "string") throw new Error("Missing product");
    return input;
  })
  .handler(async ({ data }) => {
    const product = starProductById(data.productId);
    if (!product) throw new Error("Unknown product");
    const telegramUserId = authenticateInitData(data.initData);
    return { url: await createInvoiceLink(product, telegramUserId) };
  });

export const claimStarCredits = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string }) => requireSession(input))
  .handler(async ({ data }) => claimCreditsFor(authenticateInitData(data.initData)));

export const getPremiumStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string }) => requireSession(input))
  .handler(async ({ data }) => premiumStatusFor(authenticateInitData(data.initData)));

export const claimDailyDrop = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string }) => requireSession(input))
  .handler(async ({ data }) => claimDailyFor(authenticateInitData(data.initData)));
