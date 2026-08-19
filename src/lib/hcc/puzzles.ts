import type { Rng, Target } from "./types";

/**
 * Puzzle generation and difficulty curve.
 *
 * Every operation is regenerated from a fresh seed on each attempt, so the
 * same target never has the same answer twice. Difficulty rises with target
 * security and falls with the operator's rig, tools and rank — the game should
 * feel earned early and fluent late.
 */

export const mulberry = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const hashStr = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const seedFor = (targetId: string, kind: string, run: number): number =>
  hashStr(`${targetId}|${kind}|${run}`);

export const shuffle = <T>(arr: readonly T[], r: Rng): T[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(r() * (i + 1));
    const a = out[i]!;
    out[i] = out[j]!;
    out[j] = a;
  }
  return out;
};

export const pickN = <T>(arr: readonly T[], n: number, r: Rng): T[] => shuffle(arr, r).slice(0, n);

export type Skill = {
  /** derived crack stat, 0.28 → 0.92 */
  readonly crack: number;
  /** rank index 0 → 4 */
  readonly rank: number;
};

export type OpDifficulty = {
  /** 0 (trivial) → 1 (brutal) */
  readonly pressure: number;
  readonly grid: number;
  readonly liveServices: number;
  readonly probes: number;
  readonly pretextRounds: number;
  readonly pretextAllowed: number;
  readonly cipherAttempts: number;
  readonly cipherDecoys: boolean;
  readonly hops: number;
  readonly ledgerNodes: number;
  readonly ledgerShowMs: number;
  readonly label: "ROUTINE" | "CONTESTED" | "HARDENED" | "BLACKSITE";
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * Pressure is what the operator actually feels: raw target hardness minus
 * everything they have earned. Upgrades buy budget, not answers.
 */
export const opDifficulty = (target: Target, skill: Skill): OpDifficulty => {
  const hardness = clamp((target.security - 45) / 55, 0, 1);
  const relief = clamp((skill.crack - 0.28) / 0.64, 0, 1) * 0.62 + clamp(skill.rank / 4, 0, 1) * 0.28;
  const pressure = clamp(hardness - relief * hardness * 0.85 + 0.06, 0.05, 1);

  const grid = hardness > 0.72 ? 16 : 12;
  const liveServices = 2 + Math.round(pressure * 3);
  const probes = liveServices + Math.max(1, Math.round(2 + (1 - pressure) * 5));

  const pretextRounds = 3 + (hardness > 0.6 ? 1 : 0) + (hardness > 0.85 ? 1 : 0);
  const pretextAllowed = clamp(Math.floor((1 - pressure) * 3), 0, 2);

  const cipherAttempts = clamp(2 + Math.round((1 - pressure) * 5), 2, 7);

  const hops = clamp(3 + Math.round(pressure * 4), 3, 7);
  const ledgerNodes = hardness > 0.7 ? 9 : 6;
  const ledgerShowMs = Math.round(760 - pressure * 300);

  const label =
    pressure > 0.75 ? "BLACKSITE" : pressure > 0.5 ? "HARDENED" : pressure > 0.28 ? "CONTESTED" : "ROUTINE";

  return {
    pressure,
    grid,
    liveServices,
    probes,
    pretextRounds,
    pretextAllowed,
    cipherAttempts,
    cipherDecoys: pressure > 0.45,
    hops,
    ledgerNodes,
    ledgerShowMs,
    label,
  };
};

// ── port mapper ───────────────────────────────────────────────────────────
export type PortCell = { readonly num: number; readonly live: boolean };

export const buildPorts = (r: Rng, grid: number, live: number): PortCell[] => {
  const nums = new Set<number>();
  while (nums.size < grid) nums.add(1024 + Math.floor(r() * 64000));
  const liveIdx = new Set(pickN([...Array(grid).keys()], live, r));
  return [...nums].map((num, i) => ({ num, live: liveIdx.has(i) }));
};

// ── social engineering ────────────────────────────────────────────────────
export type PretextRound = {
  readonly signal: string;
  readonly options: readonly { readonly text: string; readonly ok: boolean }[];
};

const PRETEXT_POOL: readonly PretextRound[] = [
  {
    signal: "Operator responds to authority and deadlines.",
    options: [
      { text: "Compliance review closes in 40 minutes. Confirm your escrow reference.", ok: true },
      { text: "Hey! Big fan of the site, can we chat?", ok: false },
      { text: "I think your server has a bug, want me to look?", ok: false },
    ],
  },
  {
    signal: "Their support staff are overworked and unsupervised.",
    options: [
      { text: "I won't file a complaint — just resend the case number and we're done.", ok: true },
      { text: "Escalate this to your supervisor immediately.", ok: false },
      { text: "I demand the owner's full legal name.", ok: false },
    ],
  },
  {
    signal: "They verify by asking for something only a member would know.",
    options: [
      { text: "Quote the vetting fee back at them, exactly.", ok: true },
      { text: "Claim the verification system is broken.", ok: false },
      { text: "Send a screenshot of an unrelated invoice.", ok: false },
    ],
  },
  {
    signal: "The desk is measured on ticket close time, not accuracy.",
    options: [
      { text: "One line and you can close this: which mirror is authoritative tonight?", ok: true },
      { text: "Take your time, I'll wait on the line as long as it takes.", ok: false },
      { text: "This is going to need a full written incident report.", ok: false },
    ],
  },
  {
    signal: "Handler is paranoid about law enforcement but greedy about volume.",
    options: [
      { text: "I move six figures a month and I'm switching vendors Friday.", ok: true },
      { text: "Nobody is watching this channel, relax.", ok: false },
      { text: "Can you confirm you're not police?", ok: false },
    ],
  },
  {
    signal: "They mirror the language of whoever they're speaking to.",
    options: [
      { text: "Match their slang exactly, then ask the question flatly.", ok: true },
      { text: "Switch to formal corporate English to sound credible.", ok: false },
      { text: "Use broken English to seem harmless.", ok: false },
    ],
  },
  {
    signal: "Night shift is a single junior with no escalation path.",
    options: [
      { text: "Day shift already approved this — check the note they left you.", ok: true },
      { text: "Wake up whoever is above you.", ok: false },
      { text: "I'll call back at nine when the adults are in.", ok: false },
    ],
  },
  {
    signal: "Their vendor onboarding still runs over an old ticketing bridge.",
    options: [
      { text: "Reference the legacy bridge by its internal name and ask for a re-send.", ok: true },
      { text: "Say the new portal is down and demand a workaround.", ok: false },
      { text: "Ask them to email the credentials in plaintext.", ok: false },
    ],
  },
  {
    signal: "The operator distrusts anything that sounds urgent.",
    options: [
      { text: "Be dull. Mention a routine quarterly reconciliation and nothing else.", ok: true },
      { text: "Tell them funds are frozen and time is critical.", ok: false },
      { text: "Threaten to pull your deposit today.", ok: false },
    ],
  },
  {
    signal: "They test new contacts with a deliberately wrong detail.",
    options: [
      { text: "Correct the wrong detail politely, then move on.", ok: true },
      { text: "Agree with everything they say to keep rapport.", ok: false },
      { text: "Ignore it and repeat your request.", ok: false },
    ],
  },
  {
    signal: "Payments are handled by a separate, chattier desk.",
    options: [
      { text: "Ask support to loop in payments so 'we only do this once'.", ok: true },
      { text: "Insist support handle the payment question themselves.", ok: false },
      { text: "Say you'll open a second ticket later.", ok: false },
    ],
  },
  {
    signal: "Operator brags when their infrastructure is complimented.",
    options: [
      { text: "Admire the uptime and ask which host keeps it that clean.", ok: true },
      { text: "Say their site feels slow lately.", ok: false },
      { text: "Ask directly where the servers are.", ok: false },
    ],
  },
];

export const buildPretext = (r: Rng, rounds: number): PretextRound[] =>
  pickN(PRETEXT_POOL, rounds, r).map((round) => ({
    signal: round.signal,
    options: shuffle(round.options, r),
  }));

// ── cipher wheel ──────────────────────────────────────────────────────────
const PHRASE_HEADS = [
  "escrow archive key",
  "vendor payout manifest",
  "mirror rotation schedule",
  "cold wallet custody note",
  "affiliate settlement index",
  "seizure resistant backup",
  "courier handoff record",
];
const PHRASE_TAILS = ["node seven", "shard delta", "block nine", "relay two", "vault alpha", "tier three"];

export const buildCipher = (r: Rng, alias: string): { plain: string; key: number } => ({
  plain: `${PHRASE_HEADS[Math.floor(r() * PHRASE_HEADS.length)]!} ${alias.toLowerCase()} ${
    PHRASE_TAILS[Math.floor(r() * PHRASE_TAILS.length)]!
  }`,
  key: 1 + Math.floor(r() * 25),
});

// ── ledger trace ──────────────────────────────────────────────────────────
export const buildLedger = (
  r: Rng,
  nodes: number,
  hops: number,
): { labels: string[]; seq: number[] } => ({
  labels: Array.from({ length: nodes }, () =>
    `0x${Math.floor(r() * 0xffff).toString(16).padStart(4, "0")}`,
  ),
  seq: Array.from({ length: hops }, () => Math.floor(r() * nodes)),
});
