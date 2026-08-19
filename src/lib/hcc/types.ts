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
  | "poster";

export type ItemCategory = "hardware" | "tools" | "perks" | "mining" | "custom";

export type RigStats = {
  readonly crack: number;
  readonly dissipation: number;
  readonly scan: number;
  readonly bounty: number;
  readonly miningMul: number;
  readonly coolingWatts: number;
};

export type MiningSpec = {
  readonly hash: number;
  readonly watts: number;
  readonly heat: number;
  readonly kind: "asic" | "gpu" | "shelf" | "cooler" | "contract";
  readonly capacityKw?: number;
  readonly pricePerKwh?: number;
  readonly slots?: number;
};

export type Item = {
  readonly id: string;
  readonly name: string;
  readonly category: ItemCategory;
  readonly slot?: Slot;
  readonly tier: 1 | 2 | 3 | 4;
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
  readonly contract: string;
  readonly balances: Readonly<Record<Coin, number>>;
  readonly lastTick: number;
};

export type GameState = {
  readonly phase: "offline" | "booting" | "online";
  readonly tab: TabId;
  readonly credits: number;
  readonly intel: number;
  readonly heat: number;
  readonly takedowns: number;
  readonly selected: string | null;
  readonly progress: Readonly<Record<string, TargetProgress>>;
  readonly owned: readonly string[];
  readonly installed: Readonly<Partial<Record<Slot, string>>>;
  readonly perks: readonly string[];
  readonly mining: MiningState;
  readonly quality: Quality;
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
  | "case";

export type Rng = () => number;