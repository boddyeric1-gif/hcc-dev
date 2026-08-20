import { createHash, timingSafeEqual } from "node:crypto";

/** Webhook secret derived from the bot token so both sides agree without extra config. */
export function deriveWebhookSecret(botToken: string): string {
  return createHash("sha256").update(`telegram-webhook:${botToken}`).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function botApiUrl(botToken: string, method: string): string {
  return `https://api.telegram.org/bot${botToken}/${method}`;
}

export async function callBotApi<T = unknown>(
  botToken: string,
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(botApiUrl(botToken, method), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Telegram ${method} failed [${res.status}]: ${text}`);
    throw new Error(`Telegram ${method} failed [${res.status}]: ${text}`);
  }
  const payload = JSON.parse(text) as { ok?: boolean; description?: string; result?: T };
  if (payload.ok !== true) {
    console.error(`Telegram ${method} returned not-ok: ${text}`);
    throw new Error(`Telegram ${method} returned not-ok: ${payload.description ?? text}`);
  }
  return payload.result as T;
}

/** Public base URL of the Mini App; overridable per environment. */
export function miniAppBaseUrl(): string {
  return process.env["PUBLIC_APP_URL"] ?? "https://hcc-dev.lovable.app/";
}
