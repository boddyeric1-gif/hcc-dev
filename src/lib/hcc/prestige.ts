import type { GameState, RigStats } from "./types";

export type PrestigeEffect = Partial<Pick<RigStats, "bounty" | "miningMul" | "opSlots" | "crack" | "dissipation">> & {
  /** one-off credit grant applied at the moment the milestone is reached */
  readonly grant?: number;
  /** cosmetic/title unlock id */
  readonly title?: string;
};

export type PrestigeReward = {
  readonly id: string;
  readonly level: number;
  readonly name: string;
  readonly detail: string;
  readonly effect: PrestigeEffect;
};

/**
 * Milestones land at prestige 1, then every fifth prestige. Levels in between
 * still grant the per-level permanent scaling below, but no milestone reward.
 */
export const PRESTIGE_REWARDS: readonly PrestigeReward[] = [
  {
    id: "pr-1",
    level: 1,
    name: "Task Force Badge",
    detail: "+10% bounty forever, and a 250,000 cr restart grant.",
    effect: { bounty: 0.1, grant: 250_000, title: "TASK FORCE" },
  },
  {
    id: "pr-5",
    level: 5,
    name: "Permanent Rack Licence",
    detail: "+25% mining yield forever.",
    effect: { miningMul: 1.25, title: "RACK BARON" },
  },
  {
    id: "pr-10",
    level: 10,
    name: "Standing Warrant",
    detail: "One extra permanent channel and +20% bounty.",
    effect: { opSlots: 1, bounty: 0.2, title: "WARRANT HOLDER" },
  },
  {
    id: "pr-15",
    level: 15,
    name: "Blacksite Clearance",
    detail: "+15% crack power and +20 stealth, permanently.",
    effect: { crack: 0.15, dissipation: 20, title: "BLACKSITE" },
  },
  {
    id: "pr-20",
    level: 20,
    name: "Grid Concession",
    detail: "+50% mining yield forever.",
    effect: { miningMul: 1.5, title: "GRID LORD" },
  },
  {
    id: "pr-25",
    level: 25,
    name: "Director's Mandate",
    detail: "A second permanent channel and +35% bounty.",
    effect: { opSlots: 1, bounty: 0.35, title: "DIRECTOR" },
  },
  {
    id: "pr-30",
    level: 30,
    name: "Phantom Doctrine",
    detail: "+2,000,000 cr and +25% crack power.",
    effect: { crack: 0.25, grant: 2_000_000, title: "PHANTOM DOCTRINE" },
  },
];

export const rewardForLevel = (level: number): PrestigeReward | undefined =>
  PRESTIGE_REWARDS.find((r) => r.level === level);

/** True when a milestone reward exists (or is extrapolated) for this level. */
export const isMilestone = (level: number): boolean => level === 1 || (level > 0 && level % 5 === 0);

/** The next level that pays out, from the current prestige. */
export const nextMilestone = (prestige: number): number => {
  if (prestige < 1) return 1;
  return Math.floor(prestige / 5) * 5 + 5;
};

/** Per-level permanent scaling that applies regardless of milestones. */
export const PER_LEVEL_BOUNTY = 0.02;
export const PER_LEVEL_MINING = 0.02;

export type PrestigeRequirement = {
  readonly intel: number;
  readonly takedowns: number;
  readonly credits: number;
};

export const prestigeRequirement = (prestige: number): PrestigeRequirement => ({
  intel: Math.round(5000 * (1 + prestige * 0.35)),
  takedowns: 15 + prestige * 5,
  credits: Math.round(250_000 * (1 + prestige * 0.5)),
});

export const canPrestige = (s: GameState): boolean => {
  const req = prestigeRequirement(s.prestige);
  return s.intel >= req.intel && s.takedowns >= req.takedowns && s.credits >= req.credits;
};

/** Aggregated permanent bonuses from prestige level plus every claimed milestone. */
export const prestigeBonuses = (s: GameState) => {
  let bounty = s.prestige * PER_LEVEL_BOUNTY;
  let miningMul = 1 + s.prestige * PER_LEVEL_MINING;
  let opSlots = 0;
  let crack = 0;
  let dissipation = 0;
  const titles: string[] = [];
  PRESTIGE_REWARDS.forEach((r) => {
    if (!s.prestigeClaimed.includes(r.id)) return;
    bounty += r.effect.bounty ?? 0;
    if (r.effect.miningMul) miningMul *= r.effect.miningMul;
    opSlots += r.effect.opSlots ?? 0;
    crack += r.effect.crack ?? 0;
    dissipation += r.effect.dissipation ?? 0;
    if (r.effect.title) titles.push(r.effect.title);
  });
  return { bounty, miningMul, opSlots, crack, dissipation, titles };
};

export const PRESTIGE_RESETS = [
  "Credits, intel and rank",
  "Trace heat and takedown count",
  "Purchased hardware, tools and perks",
  "Mining hardware, coin balances and power contract",
  "Case progress, engaged channels and generated targets",
] as const;

export const PRESTIGE_KEEPS = [
  "Prestige level and every milestone reward",
  "Permanent prestige bonuses (bounty, yield, channels)",
  "Lifetime career records",
  "Telegram identity and all Stars purchase history",
  "Operator handle, settings and field manual progress",
] as const;
