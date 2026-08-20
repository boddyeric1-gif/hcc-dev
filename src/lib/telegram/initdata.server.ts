import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies Telegram Mini App initData per the official algorithm and returns the
 * authenticated Telegram user id. Returns null when the signature is invalid,
 * stale, or the payload carries no user.
 */
export function verifyInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86_400,
): { telegramUserId: number } | null {
  if (!initData) return null;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return null;
  }
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const checkString = [...params.entries()]
    .map(([k, v]) => [k, v] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(checkString).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(hash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate)) return null;
  if (Math.abs(Date.now() / 1000 - authDate) > maxAgeSeconds) return null;

  try {
    const user = JSON.parse(params.get("user") ?? "null") as { id?: number } | null;
    if (!user || typeof user.id !== "number") return null;
    return { telegramUserId: user.id };
  } catch {
    return null;
  }
}
