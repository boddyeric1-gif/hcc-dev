/**
 * LIMITED-TIME Stars offers.
 *
 * Isolated on purpose: this file is the ONLY place limited promos are defined.
 * To end a promotion, empty `LIMITED_TIME_OFFERS` (or delete this file and its
 * single import in `stars.ts`) — nothing else in the shop or the payment flow
 * depends on it.
 */

import type { StarProduct } from "./stars";

export const LIMITED_TIME_OFFERS: readonly StarProduct[] = [
  {
    id: "hcc_limited_100k_1star",
    title: "LIMITED — 100,000 CREDITS",
    description: "Limited-time launch drop: 1 Telegram Star clears 100,000 H.C.C credits into the account.",
    stars: 1,
    section: "credits",
    credits: 100_000,
    itemIds: [],
    days: 0,
    creditPrice: 0,
    tagline: "Limited time — 100,000 cr for a single Star",
    limited: true,
    bestValue: true,
  },
];
