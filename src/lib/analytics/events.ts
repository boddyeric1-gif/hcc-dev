/**
 * Frozen analytics taxonomy.
 *
 * The server rejects any name outside this list, and every event's metadata is
 * whitelisted to short scalars. No player-supplied text and no Telegram profile
 * fields (beyond the numeric id derived from verified initData) are ever stored.
 */
export const EVENT_NAMES = [
  // lifecycle
  "app_opened",
  "session_started",
  "session_ended",
  // onboarding / activation
  "onboarding_started",
  "onboarding_completed",
  "guide_opened",
  "experience_mode_set",
  "first_target_engaged",
  // gameplay
  "tab_viewed",
  "target_engaged",
  "target_dropped",
  "op_attempted",
  "target_reported",
  // mining
  "mining_started",
  "mining_claimed",
  "mining_contract_switched",
  "miner_assigned",
  // upgrades / shop
  "shop_item_viewed",
  "upgrade_viewed",
  "upgrade_purchased",
  "item_installed",
  // tools & perks
  "tool_used",
  "perk_activated",
  // channels / community
  "channel_opened",
  "community_link_clicked",
  // progression
  "rank_reached",
  "prestige_completed",
  "milestone_reached",
  // monetization
  "stars_shop_opened",
  "stars_product_viewed",
  "stars_purchase_started",
  "stars_purchase_failed",
  "stars_purchase_completed",
  "operative_pass_purchase_completed",
  "daily_drop_claimed",
  // retention
  "session_resumed",
  // errors
  "client_error",
  "server_sync_error",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

const NAME_SET: ReadonlySet<string> = new Set(EVENT_NAMES);

export function isEventName(value: unknown): value is EventName {
  return typeof value === "string" && NAME_SET.has(value);
}

export type EventProps = Record<string, string | number | boolean>;

export type AnalyticsEvent = {
  name: EventName;
  props: EventProps;
  at: number;
};

/** Keys allowed in event metadata. Anything else is dropped server-side. */
export const ALLOWED_PROP_KEYS = [
  "id",
  "tab",
  "coin",
  "kind",
  "tier",
  "rank",
  "prestige",
  "amount",
  "price",
  "stars",
  "units",
  "level",
  "slots",
  "success",
  "source",
  "reason",
  "milestone",
  "product_id",
  "duration_ms",
] as const;

const KEY_SET: ReadonlySet<string> = new Set(ALLOWED_PROP_KEYS);

const MAX_STRING = 64;
const MAX_KEYS = 8;

/** Whitelists keys, clamps value shapes and sizes. Never throws. */
export function sanitizeProps(input: unknown): EventProps {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: EventProps = {};
  let n = 0;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (n >= MAX_KEYS) break;
    if (!KEY_SET.has(key)) continue;
    if (typeof value === "string") {
      out[key] = value.slice(0, MAX_STRING);
    } else if (typeof value === "number") {
      if (!Number.isFinite(value)) continue;
      out[key] = Math.trunc(value * 1000) / 1000;
    } else if (typeof value === "boolean") {
      out[key] = value;
    } else {
      continue;
    }
    n += 1;
  }
  return out;
}

/** Drops unknown names and normalises metadata + timestamp. */
export function sanitizeEvents(input: unknown, now = Date.now()): AnalyticsEvent[] {
  if (!Array.isArray(input)) return [];
  const out: AnalyticsEvent[] = [];
  for (const raw of input.slice(0, 100)) {
    if (!raw || typeof raw !== "object") continue;
    const candidate = raw as { name?: unknown; props?: unknown; at?: unknown };
    if (!isEventName(candidate.name)) continue;
    const at = typeof candidate.at === "number" && Number.isFinite(candidate.at) ? candidate.at : now;
    out.push({
      name: candidate.name,
      props: sanitizeProps(candidate.props),
      // never accept a future or absurdly old timestamp
      at: Math.min(Math.max(at, now - 86_400_000), now),
    });
  }
  return out;
}
