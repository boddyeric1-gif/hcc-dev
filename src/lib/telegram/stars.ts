/** Client-safe description of the temporary Telegram Stars test product. */
export const STAR_TEST_PRODUCT = {
  id: "test-star-100k",
  title: "TEST — 100,000 credits",
  description: "Test purchase: 1 Telegram Star grants 100,000 H.C.C credits.",
  stars: 1,
  credits: 100_000,
} as const;

export type StarProduct = typeof STAR_TEST_PRODUCT;

export const STAR_PRODUCTS: readonly StarProduct[] = [STAR_TEST_PRODUCT];

export function starProductById(id: string): StarProduct | undefined {
  return STAR_PRODUCTS.find((p) => p.id === id);
}

/** Invoice payload format: "<productId>:<telegramUserId>". */
export function buildInvoicePayload(productId: string, telegramUserId: number): string {
  return `${productId}:${telegramUserId}`;
}

export function parseInvoicePayload(
  payload: string | undefined | null,
): { productId: string; telegramUserId: number } | null {
  if (!payload) return null;
  const [productId, rawId] = payload.split(":");
  const telegramUserId = Number(rawId);
  if (!productId || !Number.isFinite(telegramUserId) || telegramUserId <= 0) return null;
  return { productId, telegramUserId };
}
