/**
 * Cosmetic palettes. Purely visual — nothing here feeds deriveStats.
 * Every theme id matches a catalog item id so ownership drives the render.
 */

export type RigTheme = {
  readonly id: string;
  readonly name: string;
  /** back wall */
  readonly wall: string;
  /** desk / rack chassis */
  readonly chassis: string;
  readonly metal: string;
  /** architectural strip glow */
  readonly glow: string;
  /** key light tint */
  readonly key: string;
  readonly floor: string;
};

export const RIG_THEMES: Record<string, RigTheme> = {
  "rig-theme-blacksite": {
    id: "rig-theme-blacksite",
    name: "Blacksite",
    wall: "#0b0e12",
    chassis: "#0a0d11",
    metal: "#1a1f26",
    glow: "#7fe8ff",
    key: "#9fd8ff",
    floor: "#07090c",
  },
  "rig-theme-neon": {
    id: "rig-theme-neon",
    name: "Neon Network",
    wall: "#130f24",
    chassis: "#161029",
    metal: "#2a2145",
    glow: "#ff4fd8",
    key: "#c48cff",
    floor: "#0c0918",
  },
  "rig-theme-corporate": {
    id: "rig-theme-corporate",
    name: "Corporate Ghost",
    wall: "#191d21",
    chassis: "#20252b",
    metal: "#3a4149",
    glow: "#dfe7ee",
    key: "#e8f1ff",
    floor: "#14181c",
  },
  "rig-theme-deepweb": {
    id: "rig-theme-deepweb",
    name: "Deep Web",
    wall: "#08130f",
    chassis: "#0a1512",
    metal: "#153029",
    glow: "#39ff9e",
    key: "#8effc7",
    floor: "#050d0a",
  },
  "rig-theme-quantum": {
    id: "rig-theme-quantum",
    name: "Quantum Lab",
    wall: "#0d1424",
    chassis: "#101a2e",
    metal: "#22314f",
    glow: "#6fa8ff",
    key: "#cfe0ff",
    floor: "#080e1a",
  },
  "rig-theme-redline": {
    id: "rig-theme-redline",
    name: "Redline",
    wall: "#170b0d",
    chassis: "#1b0d10",
    metal: "#3a1a20",
    glow: "#ff3355",
    key: "#ff9aa8",
    floor: "#0f0709",
  },
  "rig-theme-cyberpunk": {
    id: "rig-theme-cyberpunk",
    name: "Cyberpunk",
    wall: "#141024",
    chassis: "#1a1330",
    metal: "#3b2a5c",
    glow: "#ffd23f",
    key: "#ff8ae2",
    floor: "#0d0a18",
  },
  "rig-theme-classified": {
    id: "rig-theme-classified",
    name: "Classified",
    wall: "#0a0a0a",
    chassis: "#0d0d0d",
    metal: "#242424",
    glow: "#ffb020",
    key: "#ffd79a",
    floor: "#060606",
  },
};

export const DEFAULT_RIG_THEME = RIG_THEMES["rig-theme-blacksite"]!;

export const rigTheme = (id: string | undefined | null): RigTheme =>
  (id && RIG_THEMES[id]) || DEFAULT_RIG_THEME;

export type MinerTheme = {
  readonly id: string;
  readonly name: string;
  readonly chassis: string;
  readonly trim: string;
  readonly led: string;
  readonly metalness: number;
  readonly roughness: number;
};

export const MINER_THEMES: Record<string, MinerTheme> = {
  "miner-theme-tactical": {
    id: "miner-theme-tactical",
    name: "Tactical",
    chassis: "#1b1f1a",
    trim: "#2c3327",
    led: "#9dff5c",
    metalness: 0.5,
    roughness: 0.62,
  },
  "miner-theme-industrial": {
    id: "miner-theme-industrial",
    name: "Industrial",
    chassis: "#2a2b2d",
    trim: "#54585c",
    led: "#ffb020",
    metalness: 0.85,
    roughness: 0.42,
  },
  "miner-theme-quantum": {
    id: "miner-theme-quantum",
    name: "Quantum",
    chassis: "#0e1730",
    trim: "#283f6e",
    led: "#7fb4ff",
    metalness: 0.95,
    roughness: 0.16,
  },
  "miner-theme-blacksite": {
    id: "miner-theme-blacksite",
    name: "Blacksite",
    chassis: "#0a0c0f",
    trim: "#181d24",
    led: "#7fe8ff",
    metalness: 0.95,
    roughness: 0.24,
  },
  "miner-theme-neon": {
    id: "miner-theme-neon",
    name: "Neon",
    chassis: "#170f2b",
    trim: "#39215e",
    led: "#ff4fd8",
    metalness: 0.7,
    roughness: 0.3,
  },
  "miner-theme-experimental": {
    id: "miner-theme-experimental",
    name: "Experimental",
    chassis: "#0b1a17",
    trim: "#12463a",
    led: "#39ffd0",
    metalness: 1,
    roughness: 0.08,
  },
};

export const DEFAULT_MINER_THEME = MINER_THEMES["miner-theme-industrial"]!;

export const minerTheme = (id: string | undefined | null): MinerTheme =>
  (id && MINER_THEMES[id]) || DEFAULT_MINER_THEME;

/** UI themes retint the HUD tokens defined in styles.css. */
export type UiTheme = {
  readonly id: string;
  readonly name: string;
  readonly vars: Readonly<Record<string, string>>;
};

export const UI_THEMES: Record<string, UiTheme> = {
  "ui-theme-terminal": { id: "ui-theme-terminal", name: "Terminal", vars: {} },
  "ui-theme-blacksite": {
    id: "ui-theme-blacksite",
    name: "Blacksite",
    vars: {
      "--hud-cyan": "oklch(0.86 0.09 210)",
      "--hud-green": "oklch(0.80 0.13 160)",
      "--hud-amber": "oklch(0.86 0.14 85)",
      "--hud-violet": "oklch(0.72 0.12 285)",
    },
  },
  "ui-theme-cyberops": {
    id: "ui-theme-cyberops",
    name: "Cyber Ops",
    vars: {
      "--hud-cyan": "oklch(0.78 0.19 320)",
      "--hud-green": "oklch(0.86 0.17 190)",
      "--hud-amber": "oklch(0.88 0.17 95)",
      "--hud-violet": "oklch(0.70 0.22 300)",
    },
  },
  "ui-theme-darkgrid": {
    id: "ui-theme-darkgrid",
    name: "Dark Grid",
    vars: {
      "--hud-cyan": "oklch(0.74 0.06 230)",
      "--hud-green": "oklch(0.78 0.10 155)",
      "--hud-amber": "oklch(0.80 0.10 80)",
      "--hud-violet": "oklch(0.66 0.09 290)",
    },
  },
  "ui-theme-classified": {
    id: "ui-theme-classified",
    name: "Classified",
    vars: {
      "--hud-cyan": "oklch(0.84 0.15 80)",
      "--hud-green": "oklch(0.82 0.16 120)",
      "--hud-amber": "oklch(0.80 0.19 55)",
      "--hud-violet": "oklch(0.70 0.14 40)",
    },
  },
};

export const uiTheme = (id: string | undefined | null): UiTheme =>
  (id && UI_THEMES[id]) || UI_THEMES["ui-theme-terminal"]!;

export type Badge = { readonly id: string; readonly label: string; readonly tone: string };

export const BADGES: Record<string, Badge> = {
  "badge-rookie": { id: "badge-rookie", label: "ROOKIE", tone: "text-muted-foreground" },
  "badge-operator": { id: "badge-operator", label: "OPERATOR", tone: "text-hud-cyan" },
  "badge-specialist": { id: "badge-specialist", label: "SPECIALIST", tone: "text-hud-green" },
  "badge-ghost": { id: "badge-ghost", label: "GHOST", tone: "text-hud-violet" },
  "badge-blacksite": { id: "badge-blacksite", label: "BLACKSITE", tone: "text-hud-amber" },
  "badge-elite": { id: "badge-elite", label: "ELITE", tone: "text-hud-red" },
  "badge-apex": { id: "badge-apex", label: "APEX", tone: "text-hud-amber text-glow" },
};

export const badge = (id: string | undefined | null): Badge | null => (id && BADGES[id]) || null;
