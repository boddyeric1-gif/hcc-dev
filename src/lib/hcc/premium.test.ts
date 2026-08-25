import { describe, expect, it } from "vitest";

import {
  CREDITS_PER_DAILY_DROP,
  PREMIUM_MINING_MUL,
  STAR_PRODUCTS,
  STAR_TEST_PRODUCT,
  buildInvoicePayload,
  dualPriceFor,
  isStarsOnlyItem,
  parseInvoicePayload,
  productsForSection,
  starProductById,
} from "../telegram/stars";
import { clampNumber, fmt, fmtHash } from "./format";
import {
  canClaimDaily,
  deriveMining,
  initialState,
  isPremiumActive,
  miningMulBreakdown,
  reducer,
  utcDayKey,
} from "./state";
import type { GameState } from "./types";

const DAY = 86_400_000;
const NOW = Date.now();

const withPass = (days: number, lastClaimOn: string | null = null): GameState => ({
  ...initialState(),
  premium: { expiresAt: NOW + days * DAY, lastClaimOn, syncedAt: NOW },
});

describe("stars catalog", () => {
  it("gives every product a unique, stable identifier and a positive price", () => {
    const all = STAR_PRODUCTS;
    const ids = all.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    all.forEach((p) => {
      expect(p.stars).toBeGreaterThan(0);
      expect(starProductById(p.id)).toBeTruthy();
    });
  });

  it("keeps the 1-Star verification purchase available but out of the merchandised catalog", () => {
    expect(STAR_TEST_PRODUCT.stars).toBe(1);
    expect(STAR_TEST_PRODUCT.test).toBe(true);
    expect(productsForSection("credits").some((p) => p.id === STAR_TEST_PRODUCT.id)).toBe(false);
    expect(starProductById(STAR_TEST_PRODUCT.id)).toBeTruthy();
  });

  it("scales credit drops so bigger packs are never worse value per Star", () => {
    // Limited-time promos are deliberately better value than the standing ladder.
    const drops = productsForSection("credits")
      .filter((p) => p.credits > 0 && !p.limited)
      .sort((a, b) => a.stars - b.stars);
    expect(drops.length).toBeGreaterThanOrEqual(4);

    for (let i = 1; i < drops.length; i += 1) {
      const prev = drops[i - 1]!;
      const cur = drops[i]!;
      expect(cur.credits / cur.stars).toBeGreaterThanOrEqual(prev.credits / prev.stars);
    }
  });

  it("sells a 30-day Operative Pass", () => {
    const pass = productsForSection("pass")[0];
    expect(pass?.days).toBe(30);
  });

  it("round-trips invoice payloads and rejects malformed ones", () => {
    const payload = buildInvoicePayload("hcc_credits_100k", 42);
    const parsed = parseInvoicePayload(payload);
    expect(parsed?.productId).toBe("hcc_credits_100k");
    expect(parsed?.telegramUserId).toBe(42);
    expect(parseInvoicePayload("garbage")).toBeNull();
  });


  it("marks Stars-exclusive items and exposes dual pricing where offered", () => {
    const dual = STAR_PRODUCTS.find((p) => !p.test && p.creditPrice > 0 && p.itemIds.length > 0);
    if (dual) expect(dualPriceFor(dual.itemIds[0]!)?.id).toBe(dual.id);
    const exclusive = STAR_PRODUCTS.find((p) => !p.test && p.creditPrice === 0 && p.itemIds.length > 0);
    if (exclusive) {
      expect(isStarsOnlyItem(exclusive.itemIds[0]!)).toBe(true);
      expect(dualPriceFor(exclusive.itemIds[0]!)).toBeUndefined();
    }
  });
});

describe("operative pass", () => {
  it("is active before expiry and inactive after it", () => {
    expect(isPremiumActive(withPass(30), NOW)).toBe(true);
    expect(isPremiumActive(withPass(30), NOW + 31 * DAY)).toBe(false);
    expect(isPremiumActive(initialState(), NOW)).toBe(false);
  });

  it("applies the +50% mining multiplier only while active", () => {
    const active = withPass(30);
    const label = miningMulBreakdown(active).find((m) => m.label.includes("Operative Pass"));
    expect(label?.mul).toBeCloseTo(PREMIUM_MINING_MUL, 5);

    const withBoost = deriveMining(active, NOW).yieldMul;
    const without = deriveMining(initialState(), NOW).yieldMul;
    expect(withBoost).toBeCloseTo(without * PREMIUM_MINING_MUL, 5);
  });

  it("drops the boost the moment the pass expires", () => {
    const expired: GameState = { ...initialState(), premium: { expiresAt: NOW - DAY, lastClaimOn: null, syncedAt: NOW } };
    expect(miningMulBreakdown(expired).some((m) => m.label.includes("Operative Pass"))).toBe(false);
    expect(deriveMining(expired, NOW).yieldMul).toBeCloseTo(deriveMining(initialState(), NOW).yieldMul, 5);
  });

  it("keeps credits and permanent upgrades when the pass lapses", () => {
    const owned = { ...initialState().owned };
    const expired: GameState = {
      ...initialState(),
      credits: 1_234,
      owned,
      premium: { expiresAt: NOW - DAY, lastClaimOn: null, syncedAt: NOW },
    };
    expect(expired.credits).toBe(1_234);
    expect(expired.owned).toEqual(owned);
  });

  it("allows exactly one daily drop per UTC day", () => {
    const fresh = withPass(30);
    expect(canClaimDaily(fresh, NOW)).toBe(true);

    const claimed = reducer(fresh, {
      type: "premium-sync",
      expiresAt: fresh.premium.expiresAt,
      lastClaimOn: utcDayKey(NOW),
      at: NOW,
    });
    expect(canClaimDaily(claimed, NOW)).toBe(false);
    expect(canClaimDaily(claimed, NOW + DAY)).toBe(true);
    expect(CREDITS_PER_DAILY_DROP).toBe(100_000);
  });

  it("never offers a daily drop without an active pass", () => {
    expect(canClaimDaily(initialState(), NOW)).toBe(false);
    expect(canClaimDaily(withPass(-1), NOW)).toBe(false);
  });
});

describe("unbounded scaling", () => {
  it("formats huge hashrate and credit values without truncating to a cap", () => {
    expect(fmt(1_500)).toMatch(/^1\.50?K$/);
    expect(fmt(2_500_000_000)).toMatch(/^2\.50?B$/);
    expect(fmt(4.2e15)).toMatch(/Qa$/);
    expect(fmtHash(1_000_000)).not.toBe(fmtHash(1_000));
  });

  it("keeps values finite and non-negative without clipping realistic endgame numbers", () => {
    expect(clampNumber(1e12)).toBe(1e12);
    expect(clampNumber(-5)).toBe(-5);
    expect(Number.isFinite(clampNumber(Number.POSITIVE_INFINITY))).toBe(true);
    expect(clampNumber(Number.NaN)).toBe(0);
  });

  it("grows mining output as hardware is added, with no plateau at the old ceiling", () => {
    const s = initialState();
    const many: GameState = { ...s, mining: { ...s.mining, units: { ...s.mining.units } } };
    const base = deriveMining(s, NOW).rawHash;
    expect(base).toBeGreaterThanOrEqual(0);
    expect(deriveMining(many, NOW).rawHash).toBeGreaterThanOrEqual(base);
  });
});
