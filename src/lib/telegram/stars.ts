/**
 * Client-safe Telegram Stars catalog.
 *
 * Product ids are stable identifiers and are the ONLY thing the payment flow
 * trusts — display names, prices and rewards are always resolved server-side
 * from this table, never from anything the client sends.
 */

import { LIMITED_TIME_OFFERS } from "./limited-offers";

export type StarSection = "credits" | "pass" | "elite" | "cosmetics" | "test";

export type StarProduct = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** price in Telegram Stars (XTR) */
  readonly stars: number;
  readonly section: StarSection;
  /** credits granted on fulfilment */
  readonly credits: number;
  /** catalog item ids granted on fulfilment */
  readonly itemIds: readonly string[];
  /** premium pass days granted on fulfilment */
  readonly days: number;
  /** equivalent grind price, shown for dual-price items (0 = Stars-only) */
  readonly creditPrice: number;
  readonly tagline?: string;
  /** highlighted as the standout deal in its section */
  readonly bestValue?: boolean;
  /** promotional offer, merchandised with a LIMITED TIME badge */
  readonly limited?: boolean;
  /** kept available for payment verification but not merchandised */
  readonly test?: boolean;
};

const p = (x: Omit<StarProduct, "credits" | "itemIds" | "days" | "creditPrice"> &
  Partial<Pick<StarProduct, "credits" | "itemIds" | "days" | "creditPrice">>): StarProduct => ({
  credits: 0,
  itemIds: [],
  days: 0,
  creditPrice: 0,
  ...x,
});

/** Legacy 1-Star verification product. Kept live, hidden from the production shop. */
export const STAR_TEST_PRODUCT: StarProduct = p({
  id: "test-star-100k",
  title: "TEST — 100,000 credits",
  description: "Internal payment verification product. 1 Star grants 100,000 credits.",
  stars: 1,
  section: "test",
  credits: 100_000,
  test: true,
});

export const STAR_PRODUCTS: readonly StarProduct[] = [
  STAR_TEST_PRODUCT,

  // ── limited-time promos (isolated in ./limited-offers) ──────────────────
  ...LIMITED_TIME_OFFERS,

  // ── credit drops ────────────────────────────────────────────────────────
  p({
    id: "hcc_credits_100k",
    title: "100K CREDIT DROP",
    description: "An emergency wire of 100,000 H.C.C credits.",
    stars: 50,
    section: "credits",
    credits: 100_000,
    tagline: "2,000 cr per Star",
  }),

  p({
    id: "hcc_credits_250k",
    title: "QUARTER-MILLION DROP",
    description: "250,000 H.C.C credits, cleared through the fence.",
    stars: 100,
    section: "credits",
    credits: 250_000,
    tagline: "2,500 cr per Star",
  }),
  p({
    id: "hcc_credits_500k",
    title: "HALF-MILLION DROP",
    description: "500,000 H.C.C credits, laundered and untraceable.",
    stars: 150,
    section: "credits",
    credits: 500_000,
    tagline: "3,333 cr per Star",
  }),
  p({
    id: "hcc_credits_1m",
    title: "MILLION CREDIT DROP",
    description: "1,000,000 H.C.C credits. The whole account, at once.",
    stars: 200,
    section: "credits",
    credits: 1_000_000,
    tagline: "5,000 cr per Star — 10× the 100K drop",

  }),

  // ── operative pass ──────────────────────────────────────────────────────
  p({
    id: "hcc_operative_pass_30d",
    title: "H.C.C OPERATIVE PASS",
    description:
      "30 days of blacksite clearance: +50% mining yield for the whole period, plus a 100,000 credit drop claimable once every day.",
    stars: 500,
    section: "pass",
    days: 30,
    tagline: "3,000,000 cr in daily drops + 30 days of +50% yield",
    bestValue: true,
  }),

  // ── T5 elite equipment (dual price) ─────────────────────────────────────
  p({
    id: "hcc_t5_rig_premium",
    title: "TITAN ERIS-X BLACKSITE CORE",
    description: "Stars-tier T5 graphics core. +32% crack power and 2.2× mining yield.",
    stars: 200,
    section: "elite",
    itemIds: ["gpu-x"],
    creditPrice: 4_500_000,
  }),
  p({
    id: "hcc_t5_miner_premium",
    title: "QUANTUM LATTICE ASIC",
    description: "Stars-tier T5 miner: 9,800 MH/s per unit. Stacks without limit.",
    stars: 120,
    section: "elite",
    itemIds: ["min-quantum"],
    creditPrice: 2_000_000,
  }),
  p({
    id: "hcc_t5_cooling_premium",
    title: "ZERO-POINT THERMAL SINK",
    description: "Stars-tier T5 cooling plant. Absorbs 1,200 heat on 1.5 kW.",
    stars: 90,
    section: "elite",
    itemIds: ["min-zeropoint"],
    creditPrice: 1_200_000,
  }),
  p({
    id: "hcc_t5_tool_premium",
    title: "ORACLE MESH ARRAY",
    description: "Stars-tier T5 tool. Two extra parallel channels and far faster sweeps.",
    stars: 250,
    section: "elite",
    itemIds: ["tool-oracle"],
    creditPrice: 6_000_000,
  }),
  p({
    id: "hcc_t5_perk_premium",
    title: "DIPLOMATIC IMMUNITY",
    description: "Stars-tier T5 perk. Bounties pay double, failures barely register.",
    stars: 180,
    section: "elite",
    itemIds: ["perk-immunity"],
    creditPrice: 5_000_000,
  }),

  // ── exclusive cosmetics ─────────────────────────────────────────────────
  p({
    id: "hcc_cosmetic_apex_kit",
    title: "APEX BLACKSITE KIT",
    description:
      "Stars-exclusive cosmetic set: Classified rig theme, Experimental miner finish, Classified HUD and the APEX badge.",
    stars: 150,
    section: "cosmetics",
    itemIds: ["rig-theme-classified", "miner-theme-experimental", "ui-theme-classified", "badge-apex"],
    tagline: "Four exclusive cosmetics — not purchasable with credits",
  }),
  p({
    id: "hcc_cosmetic_neon_kit",
    title: "NEON NETWORK KIT",
    description: "Stars-exclusive cosmetic set: Neon Network rig theme, Neon miner finish and the Cyber Ops HUD.",
    stars: 80,
    section: "cosmetics",
    itemIds: ["rig-theme-neon", "miner-theme-neon", "ui-theme-cyberops"],
  }),
];

export function starProductById(id: string): StarProduct | undefined {
  return STAR_PRODUCTS.find((prod) => prod.id === id);
}

/** Everything merchandised in the premium shop, i.e. excluding internal test products. */
export const productsForSection = (section: StarSection): StarProduct[] =>
  STAR_PRODUCTS.filter((prod) => prod.section === section && !prod.test);

/** Credit price a dual-priced Stars product can also be bought for, if any. */
export const dualPriceFor = (itemId: string): StarProduct | undefined =>
  STAR_PRODUCTS.find((prod) => !prod.test && prod.itemIds.includes(itemId) && prod.creditPrice > 0);

/** True when an item can ONLY be obtained through a Stars purchase. */
export const isStarsOnlyItem = (itemId: string): boolean =>
  STAR_PRODUCTS.some((prod) => !prod.test && prod.creditPrice === 0 && prod.itemIds.includes(itemId));

export const CREDITS_PER_DAILY_DROP = 100_000;
export const PREMIUM_MINING_MUL = 1.5;

/** Invoice payload format: "<productId>:<telegramUserId>". */
export function buildInvoicePayload(productId: string, telegramUserId: number): string {
  return `${productId}:${telegramUserId}`;
}

export function parseInvoicePayload(
  payload: string | undefined | null,
): { productId: string; telegramUserId: number } | null {
  if (!payload) return null;
  const idx = payload.lastIndexOf(":");
  if (idx <= 0) return null;
  const productId = payload.slice(0, idx);
  const telegramUserId = Number(payload.slice(idx + 1));
  if (!productId || !Number.isFinite(telegramUserId) || telegramUserId <= 0) return null;
  return { productId, telegramUserId };
}
