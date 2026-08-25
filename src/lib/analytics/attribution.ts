/**
 * Telegram Ads gives a Mini App no campaign metadata. The only carrier is the
 * start parameter, so each ad creative gets its own link:
 *
 *   https://t.me/HCCGameBot/app?startapp=tgads-cyberop-a
 *
 * Payload format: `source-campaign-creative` (campaign/creative optional).
 * Bare tab names (`shop`, `mining`, …) keep working exactly as before and are
 * treated as organic deep links, not campaigns.
 */
export type Attribution = {
  source: string | null;
  campaign: string | null;
  creative: string | null;
};

export const NO_ATTRIBUTION: Attribution = { source: null, campaign: null, creative: null };

const SAFE = /^[a-z0-9_]{1,32}$/;

const clean = (part: string | undefined): string | null => {
  if (!part) return null;
  const value = part.toLowerCase();
  return SAFE.test(value) ? value : null;
};

/**
 * Reserved payloads that address a section of the console rather than an ad.
 * Passed in by the caller so the tab list stays the single source of truth.
 */
export function parseAttribution(
  startParam: string | null | undefined,
  reserved: ReadonlySet<string> = new Set(),
): Attribution {
  if (!startParam) return NO_ATTRIBUTION;
  const value = startParam.toLowerCase().trim();
  if (!value || reserved.has(value)) return NO_ATTRIBUTION;
  const [source, campaign, creative] = value.split("-");
  const parsed = clean(source);
  if (!parsed) return NO_ATTRIBUTION;
  return { source: parsed, campaign: clean(campaign), creative: clean(creative) };
}

export function readStartParam(): string | null {
  if (typeof window === "undefined") return null;
  const fromQuery = new URLSearchParams(window.location.search).get("startapp");
  return fromQuery ?? window.Telegram?.WebApp?.initDataUnsafe?.start_param ?? null;
}
