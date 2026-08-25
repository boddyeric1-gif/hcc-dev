/**
 * Maps gameplay actions to analytics events at the single client write path
 * (`send()` in the game store), so no event calls are scattered through UI
 * files. Pure and side-effect free: easy to test, impossible to break the game.
 */
import type { EventName, EventProps } from "./events";

type Trackable = { name: EventName; props: EventProps };

type ActionLike = { type: string; [key: string]: unknown };

type StateLike = {
  active?: readonly unknown[];
  prestige?: number;
};

const num = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const id = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

export function eventForAction(action: ActionLike, before: StateLike): Trackable | null {
  switch (action.type) {
    case "tab":
      return { name: "tab_viewed", props: { tab: id(action["tab"]) ?? "unknown" } };
    case "engage":
      return {
        name: (before.active?.length ?? 0) === 0 ? "first_target_engaged" : "target_engaged",
        props: { id: id(action["id"]) ?? "" },
      };
    case "drop":
      return { name: "target_dropped", props: { id: id(action["id"]) ?? "" } };
    case "op":
      return {
        name: "op_attempted",
        props: { kind: id(action["kind"]) ?? "", success: action["success"] === true },
      };
    case "report":
      return { name: "target_reported", props: { id: id(action["targetId"]) ?? "" } };
    case "buy":
      return { name: "upgrade_purchased", props: { id: id(action["id"]) ?? "" } };
    case "install":
      return { name: "item_installed", props: { id: id(action["id"]) ?? "" } };
    case "sell":
      return { name: "mining_claimed", props: { coin: id(action["coin"]) ?? "" } };
    case "mining-contract":
      return { name: "mining_contract_switched", props: { id: id(action["id"]) ?? "" } };
    case "mining-assign":
      return {
        name: "miner_assigned",
        props: { id: id(action["id"]) ?? "", coin: id(action["coin"]) ?? "", amount: num(action["delta"]) ?? 0 },
      };
    case "prestige":
      return { name: "prestige_completed", props: { level: (before.prestige ?? 0) + 1 } };
    case "guide-seen":
      return { name: "onboarding_completed", props: {} };
    default:
      // deliberately silent: mining ticks, logs, wallet syncs and render-loop
      // actions must never generate events
      return null;
  }
}
