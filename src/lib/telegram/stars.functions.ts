import { createServerFn } from "@tanstack/react-start";

import { authenticateInitData, claimCreditsFor, createInvoiceLink } from "./stars.server";
import { starProductById } from "./stars";

export const createStarInvoice = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string; productId: string }) => {
    if (typeof input?.initData !== "string" || input.initData.length < 10) throw new Error("Missing Telegram session");
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
  .inputValidator((input: { initData: string }) => {
    if (typeof input?.initData !== "string" || input.initData.length < 10) throw new Error("Missing Telegram session");
    return input;
  })
  .handler(async ({ data }) => claimCreditsFor(authenticateInitData(data.initData)));
