export type Port = {
  readonly id: string;
  readonly service: string;
  readonly difficulty: number;
  readonly evidence: string;
};

export type Target = {
  readonly id: string;
  readonly codename: string;
  readonly host: string;
  readonly tier: 1 | 2 | 3;
  readonly crime: string;
  readonly brief: string;
  readonly bounty: number;
  readonly rep: number;
  readonly ports: readonly Port[];
  readonly operator: {
    readonly alias: string;
    readonly realName: string;
    readonly location: string;
    readonly note: string;
  };
};

export type TargetProgress = {
  readonly scanned: boolean;
  readonly cracked: readonly string[];
  readonly doxed: boolean;
  readonly seized: boolean;
};

export type Upgrades = {
  readonly cracker: number;
  readonly proxy: number;
  readonly scrubbers: number;
};

export type LogLine = {
  readonly id: number;
  readonly text: string;
  readonly tone: "sys" | "ok" | "warn" | "bad" | "user" | "dim";
};

export type GameState = {
  readonly rep: number;
  readonly credits: number;
  readonly heat: number;
  readonly upgrades: Upgrades;
  readonly progress: Readonly<Record<string, TargetProgress>>;
  readonly log: readonly LogLine[];
  readonly selected: string | null;
  readonly nextLineId: number;
};

export type Rng = () => number;
