import { describe, expect, it } from "vitest";

import { initialState, nextRecommendedAction, reducer } from "./state";

describe("experience mode", () => {
  it("defaults new players to normal guidance", () => {
    expect(initialState().experienceMode).toBe("normal");
    expect(initialState().seenTips).toEqual([]);
  });

  it("migrates an existing save that finished the old onboarding to experienced", () => {
    const s = reducer(initialState(), {
      type: "restore",
      saved: { guideSeen: true, credits: 987_654, takedowns: 12, prestige: 3 },
    });
    expect(s.experienceMode).toBe("experienced");
    expect(s.seenTips).toEqual([]);
    // progression must survive untouched
    expect(s.credits).toBe(987_654);
    expect(s.takedowns).toBe(12);
    expect(s.prestige).toBe(3);
  });

  it("keeps a fresh save on normal and respects an explicit stored mode", () => {
    expect(reducer(initialState(), { type: "restore", saved: {} }).experienceMode).toBe("normal");
    expect(
      reducer(initialState(), {
        type: "restore",
        saved: { guideSeen: true, experienceMode: "normal", seenTips: ["tools"] },
      }),
    ).toMatchObject({ experienceMode: "normal", seenTips: ["tools"] });
  });

  it("records dismissed tips once", () => {
    let s = reducer(initialState(), { type: "tip-seen", id: "tools" });
    s = reducer(s, { type: "tip-seen", id: "tools" });
    expect(s.seenTips).toEqual(["tools"]);
  });

  it("switching mode changes nothing but the preference", () => {
    const base = initialState();
    const s = reducer(base, { type: "experience-mode", mode: "experienced" });
    expect(s.experienceMode).toBe("experienced");
    expect({ ...s, experienceMode: base.experienceMode }).toEqual(base);
  });
});

describe("nextRecommendedAction", () => {
  it("is advisory and prioritises heat, then cases", () => {
    const base = initialState();
    expect(nextRecommendedAction({ ...base, heat: 90 })?.tab).toBe("command");
    expect(nextRecommendedAction({ ...base, active: [] })?.tab).toBe("targets");
    expect(nextRecommendedAction(base)?.tab).toBe("tools");
  });
});
