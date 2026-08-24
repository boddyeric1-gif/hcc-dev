export type Tone = "sys" | "ok" | "warn" | "bad" | "user" | "dim";

export type LogLine = {
  readonly id: number;
  readonly stamp: string;
  readonly text: string;
  readonly tone: Tone;
};

export type OpKind = "ports" | "pretext" | "cipher" | "ledger";

export type EvidenceOp = {
  readonly kind: OpKind;
  readonly label: string;
  readonly captured: string;
};

export type Threat = "HIGH" | "SEVERE" | "CRITICAL";

export type Target = {
  readonly id: string;
  readonly codename: string;
  readonly caseId: string;
  readonly host: string;
  readonly threat: Threat;
  readonly security: number;
  readonly allegation: string;
  readonly brief: string;
  readonly bounty: number;
  readonly intel: number;
  readonly ops: readonly EvidenceOp[];
  readonly operator: {
    readonly alias: string;
    readonly realName: string;
    readonly location: string;
    readonly note: string;
  };
};

export type TargetProgress = {
  readonly evidence: readonly OpKind[];
  readonly seized: boolean;
};

export type Slot =
  | "cpu"
  | "gpu"
  | "ram"
  | "storage"
  | "cooling"
  | "psu"
  | "monitors"
  | "desk"
  | "chair"
  | "router"
  | "lighting"
  | "deskmat"
  | "poster"
  | "rigTheme"
  | "minerTheme"
  | "uiTheme"
  | "badge";

export type ItemCategory = "hardware" | "tools" | "perks" | "mining" | "custom";

export type RigStats = {
  readonly crack: number;
  readonly dissipation: number;
  readonly scan: number;
  readonly bounty: number;
  readonly miningMul: number;
  readonly coolingWatts: number;
  /** how many cases can stay warm at once */
  readonly opSlots: number;
  /** multiplier on heat gained from a failed operation (lower is better) */
  readonly failHeatMul: number;
  /** multiplier on mining hardware heat output (lower is better) */
  readonly miningHeatMul: number;
};

export type MiningSpec = {
  readonly hash: number;
  readonly watts: number;
  readonly heat: number;
  readonly kind: "asic" | "gpu" | "shelf" | "cooler" | "contract";
  readonly capacityKw?: number;
  readonly pricePerKwh?: number;
  readonly slots?: number;
  /** contract only — multiplier applied to the rate during peak hours */
  readonly peakMul?: number;
  /** contract only — multiplier applied to the rate during off-peak hours */
  readonly offPeakMul?: number;
  /** contract only — penalty multiplier on power drawn above the ceiling */
  readonly overageMul?: number;
  /** contract only — flat fee charged when switching away early */
  readonly switchFee?: number;
  /** contract only — monthly-equivalent demand charge per installed kW, per second */
  readonly demandPerKw?: number;
};

export type Item = {
  readonly id: string;
  readonly name: string;
  readonly category: ItemCategory;
  readonly slot?: Slot;
  /** progression tier. Open-ended so T6+ content needs no type change. */
  readonly tier: number;
  readonly price: number;
  readonly blurb: string;
  readonly stats?: Partial<RigStats>;
  readonly mining?: MiningSpec;
  readonly stackable?: boolean;
  readonly rank?: number;
};

export type Coin = "BTC" | "ETH" | "GHST";

export type Quality = "ultra" | "balanced" | "performance";

export type MiningState = {
  readonly coin: Coin;
  readonly units: Readonly<Record<string, number>>;
  /** per hardware type: how many of those units are assigned to each coin */
  readonly alloc: Readonly<Record<string, Partial<Record<Coin, number>>>>;
  readonly contract: string;
  readonly balances: Readonly<Record<Coin, number>>;
  readonly lastTick: number;
};
/**
 * Mirror of the server's Operative Pass record. The server is authoritative for
 * both expiry and daily claims; this copy only drives the UI and the local
 * mining multiplier between syncs.
 */
export type PremiumState = {
  /** epoch ms from the server, or null when no pass has ever been bought */
  readonly expiresAt: number | null;
  /** UTC date string (YYYY-MM-DD) of the last claimed daily drop */
  readonly lastClaimOn: string | null;
  /** server clock at the moment of the last sync, for drift-tolerant display */
  readonly syncedAt: number;
};


export type AudioSettings = {
  readonly muted: boolean;
  readonly music: number;
  readonly sfx: number;
};

/** Mirror of the backend credit ledger. `mode` is 'server' once linked. */
export type WalletState = {
  readonly mode: "local" | "server";
  readonly balance: number;
  readonly syncedAt: number;
  readonly migrated: boolean;
  readonly pending: boolean;
};

export type GameState = {
  readonly phase: "offline" | "auth" | "online";
  readonly operator: string | null;
  readonly tab: TabId;
  readonly credits: number;
  readonly intel: number;
  readonly heat: number;
  readonly takedowns: number;
  readonly selected: string | null;
  /** cases currently being worked — limited by opSlots */
  readonly active: readonly string[];
  readonly generated: readonly Target[];
  readonly progress: Readonly<Record<string, TargetProgress>>;
  readonly owned: readonly string[];
  readonly installed: Readonly<Partial<Record<Slot, string>>>;
  readonly perks: readonly string[];
  readonly mining: MiningState;
  readonly quality: Quality;
  readonly brightness: number;
  readonly audio: AudioSettings;
  readonly guideSeen: boolean;
  /** mirror of the server-authoritative Operative Pass state */
  readonly premium: PremiumState;
  /** server-authoritative wallet mirror; local math is optimistic only */
  readonly wallet: WalletState;
  /** permanent prestige level — survives every prestige reset */
  readonly prestige: number;
  /** milestone reward ids already granted, never re-granted */
  readonly prestigeClaimed: readonly string[];
  /** career totals that survive prestige */
  readonly lifetime: { readonly credits: number; readonly takedowns: number; readonly intel: number };
  readonly log: readonly LogLine[];
  readonly nextLineId: number;
};

export type TabId =
  | "command"
  | "targets"
  | "tools"
  | "rig"
  | "mining"
  | "shop"
  | "case"
  | "guide";

export type Rng = () => number;