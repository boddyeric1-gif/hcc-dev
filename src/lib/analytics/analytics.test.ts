import { describe, expect, it } from "vitest";

import { EVENT_NAMES, isEventName, sanitizeEvents, sanitizeProps } from "./events";
import { parseAttribution } from "./attribution";
import { eventForAction } from "./gameplay";

describe("event taxonomy", () => {
  it("accepts known names and rejects everything else", () => {
    expect(isEventName("target_reported")).toBe(true);
    expect(isEventName("drop_table_users")).toBe(false);
    expect(new Set(EVENT_NAMES).size).toBe(EVENT_NAMES.length);
  });

  it("whitelists metadata keys and clamps values", () => {
    const props = sanitizeProps({
      id: "gpu-4",
      username: "not-allowed",
      photo_url: "https://x",
      amount: 12.34567,
      success: true,
      reason: "x".repeat(200),
      nested: { a: 1 },
    });
    expect(props).toEqual({ id: "gpu-4", amount: 12.345, success: true, reason: "x".repeat(64) });
    expect("username" in props).toBe(false);
    expect("photo_url" in props).toBe(false);
  });

  it("drops unknown events, caps the batch and clamps timestamps", () => {
    const now = 1_700_000_000_000;
    const events = sanitizeEvents(
      [
        { name: "app_opened", at: now + 999_999, props: {} },
        { name: "nope", at: now, props: {} },
        { name: "tab_viewed", at: now - 10_000_000_000, props: { tab: "shop" } },
      ],
      now,
    );
    expect(events.map((e) => e.name)).toEqual(["app_opened", "tab_viewed"]);
    expect(events[0]!.at).toBe(now);
    expect(events[1]!.at).toBe(now - 86_400_000);
    expect(sanitizeEvents("not-an-array")).toEqual([]);
    expect(sanitizeEvents(new Array(200).fill({ name: "app_opened" })).length).toBe(100);
  });
});

describe("attribution", () => {
  const reserved = new Set(["shop", "mining"]);

  it("parses source-campaign-creative payloads", () => {
    expect(parseAttribution("tgads-cyberop-a", reserved)).toEqual({
      source: "tgads",
      campaign: "cyberop",
      creative: "a",
    });
    expect(parseAttribution("tgads", reserved).source).toBe("tgads");
  });

  it("treats reserved tab deep links as organic", () => {
    expect(parseAttribution("shop", reserved).source).toBeNull();
    expect(parseAttribution(null, reserved).source).toBeNull();
    expect(parseAttribution("bad payload!", reserved).source).toBeNull();
  });
});

describe("gameplay event mapping", () => {
  it("never emits for render-loop or wallet actions", () => {
    expect(eventForAction({ type: "mining-accrue" }, {})).toBeNull();
    expect(eventForAction({ type: "wallet-sync" }, {})).toBeNull();
    expect(eventForAction({ type: "log" }, {})).toBeNull();
  });

  it("distinguishes the first engagement", () => {
    expect(eventForAction({ type: "engage", id: "t1" }, { active: [] })?.name).toBe("first_target_engaged");
    expect(eventForAction({ type: "engage", id: "t1" }, { active: ["t0"] })?.name).toBe("target_engaged");
  });

  it("maps purchases, reports and prestige", () => {
    expect(eventForAction({ type: "buy", id: "gpu-4" }, {})).toEqual({
      name: "upgrade_purchased",
      props: { id: "gpu-4" },
    });
    expect(eventForAction({ type: "report", targetId: "t9" }, {})?.name).toBe("target_reported");
    expect(eventForAction({ type: "prestige" }, { prestige: 3 })).toEqual({
      name: "prestige_completed",
      props: { level: 4 },
    });
  });

  it("only produces names that exist in the taxonomy", () => {
    const actions = [
      { type: "tab", tab: "shop" },
      { type: "drop", id: "t1" },
      { type: "op", kind: "cipher", success: true },
      { type: "install", id: "gpu-2" },
      { type: "sell", coin: "BTC" },
      { type: "mining-contract", id: "c2" },
      { type: "mining-assign", id: "m1", coin: "ETH", delta: 1 },
      { type: "guide-seen" },
    ];
    for (const action of actions) {
      const event = eventForAction(action, {});
      expect(event && isEventName(event.name)).toBe(true);
    }
  });
});
