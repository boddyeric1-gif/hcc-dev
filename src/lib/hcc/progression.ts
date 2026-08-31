import { STARTER_OWNED } from "./catalog";
import type { GameState, TabId } from "./types";

/**
 * Presentation tiers only — never change economy, difficulty, or what can be owned.
 * Experienced mode always runs at "full". Normal mode opens the desk as the player acts.
 */
export type DeskTier = "rookie" | "field" | "full";

export const deskTier = (s: GameState): DeskTier => {
  if (s.experienceMode === "experienced") return "full";
  const units = Object.values(s.mining.units).reduce((a, b) => a + b, 0);
  const boughtBeyondStarter = s.owned.some((id) => !STARTER_OWNED.includes(id));
  if (s.takedowns >= 1 || units > 0 || s.prestige > 0) return "full";
  if (boughtBeyondStarter || s.active.length > 1 || s.intel >= 80) return "field";
  return "rookie";
};

/** Tabs visible in the bottom nav for this desk tier. */
export const visibleTabs = (tier: DeskTier): readonly TabId[] => {
  switch (tier) {
    case "rookie":
      return ["command", "targets", "tools", "case", "shop"];
    case "field":
      return ["command", "targets", "tools", "rig", "case", "shop"];
    case "full":
    default:
      return ["command", "targets", "tools", "rig", "mining", "shop", "case", "guide"];
  }
};

export const tabUnlocked = (s: GameState, tab: TabId): boolean => {
  // Manual always available (header ? and deep links)
  if (tab === "guide") return true;
  return visibleTabs(deskTier(s)).includes(tab);
};

export const unlockHint = (tab: TabId): string => {
  switch (tab) {
    case "mining":
      return "The farm floor opens after your first takedown or once you install a miner from the SHOP.";
    case "rig":
      return "The live rig room unlocks once you buy or install hardware beyond the starter kit.";
    case "guide":
      return "Field manual is always available from the ? icon in the header.";
    default:
      return "Keep filing cases — more of the console comes online as you operate.";
  }
};

export const showPrestigePanel = (s: GameState): boolean => {
  if (s.experienceMode === "experienced") return true;
  if (s.prestige > 0) return true;
  return s.takedowns >= 3 || s.intel >= 400;
};

export const showMiningAdvanced = (s: GameState): boolean => {
  if (s.experienceMode === "experienced") return true;
  const units = Object.values(s.mining.units).reduce((a, b) => a + b, 0);
  return units > 0 || s.takedowns >= 1;
};
