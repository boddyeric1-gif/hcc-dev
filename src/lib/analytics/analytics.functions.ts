/**
 * Client-callable analytics RPCs.
 *
 * Identity always comes from the verified Telegram initData HMAC, never from a
 * client-supplied id. Outside Telegram, events are stored against a random
 * anonymous session id that can never claim a Telegram account.
 */
import { createServerFn } from "@tanstack/react-start";

const server = async () => import("./analytics.server");

const authOrNull = async (initData: unknown): Promise<number | null> => {
  if (typeof initData !== "string" || initData.length < 10) return null;
  try {
    const { authenticateInitData } = await import("@/lib/telegram/stars.server");
    return authenticateInitData(initData);
  } catch {
    return null;
  }
};

const str = (value: unknown, max = 64): string | null =>
  typeof value === "string" && value.length > 0 ? value.slice(0, max) : null;

type SessionInput = {
  initData?: string;
  anonId?: string;
  platform?: string;
  appVersion?: string;
  source?: string | null;
  campaign?: string | null;
  creative?: string | null;
};

export const beginSession = createServerFn({ method: "POST" })
  .inputValidator((input: SessionInput) => input ?? {})
  .handler(async ({ data }) => {
    const [{ startSession }, telegramUserId] = await Promise.all([server(), authOrNull(data.initData)]);
    const sessionId = await startSession({
      telegramUserId,
      anonId: telegramUserId === null ? str(data.anonId, 40) : null,
      platform: str(data.platform) ?? "telegram",
      appVersion: str(data.appVersion, 24) ?? "unknown",
      source: str(data.source, 32),
      campaign: str(data.campaign, 32),
      creative: str(data.creative, 32),
    });
    return { sessionId };
  });

export const finishSession = createServerFn({ method: "POST" })
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data }) => {
    if (!str(data.sessionId, 40)) return { ok: false };
    const { endSession } = await server();
    await endSession(data.sessionId);
    return { ok: true };
  });

type EventsInput = {
  initData?: string;
  sessionId?: string | null;
  platform?: string;
  appVersion?: string;
  events?: unknown;
};

export const recordAnalyticsEvents = createServerFn({ method: "POST" })
  .inputValidator((input: EventsInput) => input ?? {})
  .handler(async ({ data }) => {
    const [{ recordEvents }, telegramUserId] = await Promise.all([server(), authOrNull(data.initData)]);
    const stored = await recordEvents({
      telegramUserId,
      sessionId: str(data.sessionId, 40),
      platform: str(data.platform) ?? "telegram",
      appVersion: str(data.appVersion, 24) ?? "unknown",
      events: data.events,
    });
    return { stored };
  });

export const syncPlayerProgress = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      initData: string;
      rankIndex: number;
      prestige: number;
      rigTier: number;
      minerTier: number;
      opSlots: number;
    }) => input,
  )
  .handler(async ({ data }) => {
    const telegramUserId = await authOrNull(data.initData);
    if (telegramUserId === null) return { ok: false };
    const { syncProgress } = await server();
    const int = (v: unknown, min = 0) => (typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.trunc(v)) : min);
    await syncProgress({
      telegramUserId,
      rankIndex: int(data.rankIndex),
      prestige: int(data.prestige),
      rigTier: int(data.rigTier, 1),
      minerTier: int(data.minerTier, 1),
      opSlots: int(data.opSlots, 1),
    });
    return { ok: true };
  });

export const markPlayerMilestone = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string; milestone: string }) => input)
  .handler(async ({ data }) => {
    const telegramUserId = await authOrNull(data.initData);
    const milestone = str(data.milestone, 48);
    if (telegramUserId === null || !milestone) return { first: false };
    const { markMilestone } = await server();
    return { first: await markMilestone(telegramUserId, milestone) };
  });

/** Read-only reporting summary, restricted to the HCC_ADMIN_TELEGRAM_IDS allowlist. */
export const getMetricsSummary = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string }) => input)
  .handler(async ({ data }) => {
    const telegramUserId = await authOrNull(data.initData);
    const { isAdminTelegramId, metricsSummary } = await server();
    if (telegramUserId === null || !isAdminTelegramId(telegramUserId)) throw new Error("Forbidden");
    return metricsSummary();
  });
