/** Kept in sync with the `version` field in package.json. */
export const APP_VERSION = "1.0.0";

export function clientPlatform(): string {
  if (typeof window === "undefined") return "ssr";
  return window.Telegram?.WebApp ? "telegram" : "web";
}
