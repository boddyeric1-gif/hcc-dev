/**
 * Server-side analytics writer.
 *
 * Strictly observational: this module can reach the analytics RPCs only. It
 * imports nothing from the wallet/ledger layer, so an analytics call can never
 * grant credits or mutate the economy. Every failure is swallowed and logged —
 * gameplay must never break because measurement is down.
 */
import { sanitizeEvents, type AnalyticsEvent } from "./events";

const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;

const swallow = (scope: string, error: unknown): null => {
  console.error(`[analytics] ${scope}:`, error);
  return null;
};

export type SessionStart = {
  telegramUserId: number | null;
  anonId: string | null;
  platform: string;
  appVersion: string;
  source: string | null;
  campaign: string | null;
  creative: string | null;
};

export async function startSession(input: SessionStart): Promise<string | null> {
  try {
    const db = await admin();
    const { data, error } = await db.rpc("hcc_start_session", {
      _user_id: input.telegramUserId,
      _anon_id: input.anonId,
      _platform: input.platform,
      _app_version: input.appVersion,
      _source: input.source,
      _campaign: input.campaign,
      _creative: input.creative,
      // generated types mark these params non-nullable; the SQL accepts nulls
    } as never);
    if (error) return swallow("start_session", error.message);
    return typeof data === "string" ? data : null;
  } catch (error) {
    return swallow("start_session", error);
  }
}

export async function endSession(sessionId: string): Promise<void> {
  try {
    const db = await admin();
    const { error } = await db.rpc("hcc_end_session", { _session_id: sessionId });
    if (error) swallow("end_session", error.message);
  } catch (error) {
    swallow("end_session", error);
  }
}

export async function recordEvents(input: {
  telegramUserId: number | null;
  sessionId: string | null;
  platform: string;
  appVersion: string;
  events: unknown;
}): Promise<number> {
  const clean: AnalyticsEvent[] = sanitizeEvents(input.events);
  if (clean.length === 0) return 0;
  try {
    const db = await admin();
    const { data, error } = await db.rpc("hcc_record_events", {
      _user_id: input.telegramUserId,
      _session_id: input.sessionId,
      _platform: input.platform,
      _app_version: input.appVersion,
      _events: clean,
    } as never);
    if (error) {
      swallow("record_events", error.message);
      return 0;
    }
    return typeof data === "number" ? data : clean.length;
  } catch (error) {
    swallow("record_events", error);
    return 0;
  }
}

export async function markMilestone(telegramUserId: number, milestone: string): Promise<boolean> {
  try {
    const db = await admin();
    const { data, error } = await db.rpc("hcc_mark_milestone", {
      _user_id: telegramUserId,
      _milestone: milestone.slice(0, 48),
    });
    if (error) {
      swallow("mark_milestone", error.message);
      return false;
    }
    return data === true;
  } catch (error) {
    swallow("mark_milestone", error);
    return false;
  }
}

export async function syncProgress(input: {
  telegramUserId: number;
  rankIndex: number;
  prestige: number;
  rigTier: number;
  minerTier: number;
  opSlots: number;
}): Promise<void> {
  try {
    const db = await admin();
    const { error } = await db.rpc("hcc_sync_player_progress", {
      _user_id: input.telegramUserId,
      _rank_index: input.rankIndex,
      _prestige: input.prestige,
      _rig_tier: input.rigTier,
      _miner_tier: input.minerTier,
      _op_slots: input.opSlots,
    });
    if (error) swallow("sync_progress", error.message);
  } catch (error) {
    swallow("sync_progress", error);
  }
}

/**
 * Called from the Stars webhook after a charge is recorded. Purchase events are
 * emitted here — never client-side — so they cannot be faked, and the webhook's
 * own idempotency stops Telegram retries from double-counting.
 */
export async function recordPurchase(input: {
  telegramUserId: number;
  productId: string;
  stars: number;
  kind: string;
}): Promise<void> {
  const name = input.kind === "subscription" ? "operative_pass_purchase_completed" : "stars_purchase_completed";
  await Promise.all([
    recordEvents({
      telegramUserId: input.telegramUserId,
      sessionId: null,
      platform: "telegram",
      appVersion: "server",
      events: [
        {
          name,
          at: Date.now(),
          props: { product_id: input.productId, stars: input.stars, kind: input.kind },
        },
      ],
    }),
    (async () => {
      try {
        const db = await admin();
        const { error } = await db.rpc("hcc_sync_player_purchases", { _user_id: input.telegramUserId });
        if (error) swallow("sync_purchases", error.message);
      } catch (error) {
        swallow("sync_purchases", error);
      }
    })(),
  ]);
}

/** Read-only summary for reporting. Admin ids come from an env allowlist. */
export function isAdminTelegramId(telegramUserId: number): boolean {
  const raw = process.env["HCC_ADMIN_TELEGRAM_IDS"] ?? "";
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .includes(String(telegramUserId));
}

export type MetricsSummary = {
  totalPlayers: number;
  activeToday: number;
  active7d: number;
  newToday: number;
  new7d: number;
  payingPlayers: number;
  totalStars: number;
  revenue: { productId: string; kind: string; transactions: number; totalStars: number }[];
  retention: { cohortDay: string; cohortSize: number; d1: number; d7: number }[];
  topEvents: { name: string; players: number; events: number }[];
};

export async function metricsSummary(): Promise<MetricsSummary> {
  const db = await admin();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [players, activeToday, active7d, newToday, new7d, revenue, retention, funnel] = await Promise.all([
    db.from("hcc_player").select("telegram_user_id", { count: "exact", head: true }),
    db.from("hcc_session").select("telegram_user_id", { count: "exact", head: true }).gte("started_at", dayAgo),
    db.from("hcc_session").select("telegram_user_id", { count: "exact", head: true }).gte("started_at", weekAgo),
    db.from("hcc_player").select("telegram_user_id", { count: "exact", head: true }).gte("first_seen_at", dayAgo),
    db.from("hcc_player").select("telegram_user_id", { count: "exact", head: true }).gte("first_seen_at", weekAgo),
    db.from("hcc_metrics_revenue").select("*"),
    db.from("hcc_metrics_retention").select("*").order("cohort_day", { ascending: false }).limit(14),
    db.from("hcc_metrics_funnel").select("*").order("events", { ascending: false }).limit(15),
  ]);

  const revenueRows = (revenue.data ?? []) as {
    product_id: string;
    kind: string;
    transactions: number;
    paying_players: number;
    total_stars: number;
  }[];

  return {
    totalPlayers: players.count ?? 0,
    activeToday: activeToday.count ?? 0,
    active7d: active7d.count ?? 0,
    newToday: newToday.count ?? 0,
    new7d: new7d.count ?? 0,
    payingPlayers: revenueRows.reduce((a, r) => Math.max(a, r.paying_players), 0),
    totalStars: revenueRows.reduce((a, r) => a + Number(r.total_stars ?? 0), 0),
    revenue: revenueRows.map((r) => ({
      productId: r.product_id,
      kind: r.kind,
      transactions: Number(r.transactions ?? 0),
      totalStars: Number(r.total_stars ?? 0),
    })),
    retention: ((retention.data ?? []) as { cohort_day: string; cohort_size: number; d1: number; d7: number }[]).map(
      (r) => ({
        cohortDay: r.cohort_day,
        cohortSize: Number(r.cohort_size ?? 0),
        d1: Number(r.d1 ?? 0),
        d7: Number(r.d7 ?? 0),
      }),
    ),
    topEvents: ((funnel.data ?? []) as { step: string; players: number; events: number }[]).map((r) => ({
      name: r.step,
      players: Number(r.players ?? 0),
      events: Number(r.events ?? 0),
    })),
  };
}
