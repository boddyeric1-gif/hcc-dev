import { describe, expect, it } from "vitest";

import {
  LEGACY_MAX_IMPORT,
  MINING_MAX_SECONDS,
  MemoryLedger,
  bountyCap,
  idemKey,
  miningRatePerSec,
  safeCredits,
  stateFromProfile,
} from "./ledger";

const profile = (over: Partial<Parameters<typeof stateFromProfile>[0]> = {}) =>
  stateFromProfile({
    owned: [],
    installed: {},
    minerUnits: {},
    contract: null,
    prestige: 0,
    premiumExpiresAt: null,
    ...over,
  });

describe("credit safety", () => {
  it("clamps nonsense claims to zero", () => {
    expect(safeCredits(Number.NaN)).toBe(0);
    expect(safeCredits(-5)).toBe(0);
    expect(safeCredits(Infinity)).toBe(0);
    expect(safeCredits(12.9)).toBe(12);
  });

  it("builds stable idempotency keys", () => {
    expect(idemKey.bounty(7, "t1")).toBe(idemKey.bounty(7, "t1"));
    expect(idemKey.bounty(7, "t1")).not.toBe(idemKey.bounty(8, "t1"));
    expect(idemKey.stars("charge-1")).toBe("stars:charge-1");
  });
});

describe("server-derived bounds", () => {
  it("caps bounty above the richest generated case", () => {
    expect(bountyCap(profile())).toBeGreaterThan(15_000);
  });

  it("pays nothing per second without hardware", () => {
    expect(miningRatePerSec(profile(), Date.now())).toBe(0);
  });
});

describe("ledger semantics", () => {
  it("never goes negative", () => {
    const l = new MemoryLedger();
    l.apply(100, "a");
    expect(l.apply(-500, "b").applied).toBe(false);
    expect(l.balance).toBe(100);
  });

  it("ignores a replayed idempotency key", () => {
    const l = new MemoryLedger();
    expect(l.apply(1000, "k").applied).toBe(true);
    expect(l.apply(1000, "k").applied).toBe(false);
    expect(l.balance).toBe(1000);
  });

  it("imports a legacy balance once, clamped", () => {
    const l = new MemoryLedger();
    l.migrateLegacy(LEGACY_MAX_IMPORT * 10);
    expect(l.balance).toBe(LEGACY_MAX_IMPORT);
    l.migrateLegacy(LEGACY_MAX_IMPORT);
    expect(l.balance).toBe(LEGACY_MAX_IMPORT);
  });

  it("refuses a purchase the wallet cannot afford", () => {
    const l = new MemoryLedger();
    l.apply(100);
    expect(l.purchase("rig-a", 500, false, "k1").applied).toBe(false);
    expect(l.owned.has("rig-a")).toBe(false);
  });

  it("grants the entitlement exactly once", () => {
    const l = new MemoryLedger();
    l.apply(1000);
    expect(l.purchase("rig-a", 400, false, "k1").applied).toBe(true);
    expect(l.purchase("rig-a", 400, false, "k2").applied).toBe(false);
    expect(l.balance).toBe(600);
  });
});

describe("mining settlement", () => {
  it("pays only what elapsed time allows", () => {
    const t0 = 1_000_000;
    const l = new MemoryLedger(t0);
    const res = l.settleMining(10, 1_000_000, t0 + 60_000, "m1");
    expect(res.granted).toBe(600);
    expect(res.clamped).toBe(true);
    expect(l.balance).toBe(600);
  });

  it("banks unclaimed allowance for a later sale", () => {
    const t0 = 0;
    const l = new MemoryLedger(t0);
    l.settleMining(10, 100, t0 + 60_000, "m1"); // 600 accrued, 100 taken
    const second = l.settleMining(10, 400, t0 + 60_100, "m2");
    expect(second.granted).toBe(400);
  });

  it("caps the offline window", () => {
    const t0 = 0;
    const l = new MemoryLedger(t0);
    const year = t0 + 365 * 24 * 3600 * 1000;
    const res = l.settleMining(1, 10_000_000, year, "m1");
    expect(res.granted).toBe(MINING_MAX_SECONDS);
  });

  it("pays nothing when no time has passed", () => {
    const l = new MemoryLedger(500);
    expect(l.settleMining(10, 5000, 500, "m1").granted).toBe(0);
  });
});
