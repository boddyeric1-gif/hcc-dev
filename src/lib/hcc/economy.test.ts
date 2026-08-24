import { describe, expect, it } from "vitest";

import { canPrestige, prestigeBonuses, prestigeRequirement } from "./prestige";
import { deriveMining, deriveStats, initialState, reducer } from "./state";
import type { GameState } from "./types";

const ready = (): GameState => {
  const base = initialState();
  const req = prestigeRequirement(0);
  return { ...base, intel: req.intel, takedowns: req.takedowns, credits: req.credits };
};

describe("prestige", () => {
  it("blocks prestige until every requirement is met", () => {
    expect(canPrestige(initialState())).toBe(false);
    expect(canPrestige(ready())).toBe(true);
  });

  it("resets the desk but keeps identity and career record", () => {
    const s: GameState = { ...ready(), operator: "GHOST", lifetime: { credits: 500, takedowns: 4, intel: 90 } };
    const next = reducer(s, { type: "prestige" });
    expect(next.prestige).toBe(1);
    expect(next.operator).toBe("GHOST");
    expect(next.lifetime.takedowns).toBe(4);
    expect(next.intel).toBe(0);
    expect(next.takedowns).toBe(0);
    expect(next.owned).toEqual(initialState().owned);
  });

  it("grants permanent multipliers that survive the reset", () => {
    const next = reducer(ready(), { type: "prestige" });
    const bonus = prestigeBonuses(next);
    expect(bonus.bounty).toBeGreaterThan(0);
    expect(bonus.miningMul).toBeGreaterThan(1);
    expect(deriveStats(next).bounty).toBeGreaterThan(deriveStats(initialState()).bounty);
  });
});

describe("channels", () => {
  it("refuses to engage beyond the channel limit instead of dropping a case", () => {
    let s = initialState();
    const slots = Math.max(1, Math.round(deriveStats(s).opSlots));
    const ids = ["t-1", "t-2", "t-3", "t-4", "t-5", "t-6"].slice(0, slots + 1);
    ids.forEach((id) => {
      s = reducer(s, { type: "engage", id });
    });
    expect(s.active.length).toBeLessThanOrEqual(slots);
  });
});

describe("mining readout", () => {
  it("exposes a breakdown consistent with the effective hashrate", () => {
    const read = deriveMining(initialState(), Date.now());
    expect(read.rawHash).toBeGreaterThanOrEqual(0);
    expect(read.effectiveHash).toBeLessThanOrEqual(read.rawHash * read.yieldMul + 0.001);
    expect(read.dailyPower).toBeCloseTo(read.costPerSec * 86400, 5);
  });
});
