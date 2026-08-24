/**
 * Compact numeric formatting so the HUD keeps working at endgame scale.
 * There are no display caps: values roll into K/M/B/T/Qa/Qi suffixes and then
 * fall back to exponential notation rather than being clipped or truncated.
 */
const SUFFIX = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"] as const;

/** Largest value the game will hold in a single counter. Guards against overflow/NaN. */
export const MAX_VALUE = 9e15;

export const clampNumber = (n: number): number => {
  if (!Number.isFinite(n)) return 0;
  return Math.max(-MAX_VALUE, Math.min(MAX_VALUE, n));
};

/** Compact display: 950 → "950", 12_400 → "12.4K", 3.2e9 → "3.20B". */
export function fmt(value: number, digits = 2): string {
  const n = clampNumber(value);
  const abs = Math.abs(n);
  if (abs < 1000) return (Math.round(n * 100) / 100).toLocaleString("en-US");
  const tier = Math.min(SUFFIX.length - 1, Math.floor(Math.log10(abs) / 3));
  const scaled = n / 10 ** (tier * 3);
  if (tier === SUFFIX.length - 1 && abs >= 10 ** ((SUFFIX.length - 1) * 3 + 3)) {
    return n.toExponential(2);
  }
  const d = Math.abs(scaled) >= 100 ? 0 : Math.abs(scaled) >= 10 ? 1 : digits;
  return `${scaled.toFixed(d)}${SUFFIX[tier]}`;
}

/** Credits with unit, compact above 1,000,000 so long numbers never overflow a cell. */
export const fmtCr = (value: number): string =>
  Math.abs(value) >= 1_000_000
    ? `${fmt(value)} cr`
    : `${Math.round(clampNumber(value)).toLocaleString("en-US")} cr`;

/** Hashrate scales from MH/s through GH/s, TH/s, PH/s and beyond. */
const HASH_UNITS = ["MH/s", "GH/s", "TH/s", "PH/s", "EH/s", "ZH/s", "YH/s"] as const;

export function fmtHash(mh: number): string {
  const n = clampNumber(mh);
  const abs = Math.abs(n);
  if (abs < 1000) return `${(Math.round(n * 10) / 10).toLocaleString("en-US")} MH/s`;
  const tier = Math.min(HASH_UNITS.length - 1, Math.floor(Math.log10(abs) / 3));
  const scaled = n / 10 ** (tier * 3);
  return `${scaled.toFixed(scaled >= 100 ? 0 : 2)} ${HASH_UNITS[tier]}`;
}

/** Power scales from W through kW, MW, GW. */
export function fmtWatts(w: number): string {
  const n = clampNumber(w);
  const abs = Math.abs(n);
  if (abs < 1000) return `${Math.round(n)} W`;
  if (abs < 1e6) return `${(n / 1000).toFixed(2)} kW`;
  if (abs < 1e9) return `${(n / 1e6).toFixed(2)} MW`;
  return `${(n / 1e9).toFixed(2)} GW`;
}
