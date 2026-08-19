import { TARGETS, targetById } from "./targets";
import type { GameState, LogLine, Rng, Target, TargetProgress } from "./types";

const EMPTY_PROGRESS: TargetProgress = {
  scanned: false,
  cracked: [],
  doxed: false,
  seized: false,
};

export const initialState = (): GameState => ({
  rep: 0,
  credits: 400,
  heat: 0,
  upgrades: { cracker: 1, proxy: 0, scrubbers: 1 },
  progress: Object.fromEntries(TARGETS.map((t) => [t.id, EMPTY_PROGRESS])),
  log: [],
  selected: null,
  nextLineId: 1,
});

type Out = { text: string; tone: LogLine["tone"] };
const sys = (text: string): Out => ({ text, tone: "sys" });
const ok = (text: string): Out => ({ text, tone: "ok" });
const warn = (text: string): Out => ({ text, tone: "warn" });
const bad = (text: string): Out => ({ text, tone: "bad" });
const dim = (text: string): Out => ({ text, tone: "dim" });

export const progressOf = (state: GameState, id: string): TargetProgress =>
  state.progress[id] ?? EMPTY_PROGRESS;

export const heatGain = (state: GameState, base: number): number =>
  Math.max(1, Math.round(base * (1 - state.upgrades.proxy * 0.15)));

export const crackChance = (state: GameState, difficulty: number): number => {
  const raw = 0.9 - difficulty + (state.upgrades.cracker - 1) * 0.12;
  return Math.min(0.95, Math.max(0.08, raw));
};

const setProgress = (
  state: GameState,
  id: string,
  patch: Partial<TargetProgress>,
): GameState => ({
  ...state,
  progress: { ...state.progress, [id]: { ...progressOf(state, id), ...patch } },
});

const applyHeat = (state: GameState, delta: number): { state: GameState; out: Out[] } => {
  const heat = Math.max(0, state.heat + delta);
  if (heat < 100) return { state: { ...state, heat }, out: [] };
  const lostCredits = Math.round(state.credits * 0.4);
  const lostRep = Math.min(state.rep, 8);
  return {
    state: {
      ...state,
      heat: 35,
      credits: state.credits - lostCredits,
      rep: state.rep - lostRep,
    },
    out: [
      bad("!! TRACE COMPLETE — a counter-intrusion reached your relay."),
      bad(`   Burned a safehouse: -${lostCredits}cr, -${lostRep} rep. Heat reset to 35.`),
      dim("   Rebuild slower. Run 'scrub' before the meter climbs again."),
    ],
  };
};

const HELP: Out[] = [
  sys("COMMANDS"),
  dim("  targets            list active investigations"),
  dim("  brief <id>         read the case file"),
  dim("  scan <id>          map open services (+heat)"),
  dim("  crack <id> <port>  breach a service, pull evidence"),
  dim("  dox <id>           unmask the operator (needs all evidence)"),
  dim("  report <id>        hand the dossier to law enforcement"),
  dim("  scrub              burn a scrubber, cut heat"),
  dim("  shop / buy <item>  cracker | proxy | scrubber"),
  dim("  status | clear | help"),
];

const PRICES = { cracker: 700, proxy: 600, scrubber: 250 } as const;

const listTargets = (state: GameState): Out[] => [
  sys("ACTIVE INVESTIGATIONS"),
  ...TARGETS.map((t) => {
    const p = progressOf(state, t.id);
    const status = p.seized
      ? "SEIZED"
      : p.doxed
        ? "DOXED"
        : p.scanned
          ? `${p.cracked.length}/${t.ports.length} breached`
          : "unmapped";
    return dim(
      `  ${t.id.padEnd(13)} T${t.tier}  ${t.codename.padEnd(14)} ${t.crime.padEnd(28)} ${status}`,
    );
  }),
];

const requireTarget = (arg: string | undefined): Target | Out[] => {
  if (!arg) return [warn("Specify a target id. Try 'targets'.")];
  const t = targetById(arg);
  return t ?? [warn(`No investigation named '${arg}'.`)];
};

export type ExecResult = { state: GameState; out: Out[] };

export function execute(state: GameState, input: string, rng: Rng = Math.random): ExecResult {
  const [cmd, ...args] = input.trim().split(/\s+/);
  const c = (cmd ?? "").toLowerCase();
  if (!c) return { state, out: [] };

  switch (c) {
    case "help":
      return { state, out: HELP };
    case "status":
      return {
        state,
        out: [
          sys("OPERATOR STATUS"),
          dim(`  rep ${state.rep}   credits ${state.credits}cr   heat ${state.heat}%`),
          dim(
            `  cracker v${state.upgrades.cracker}   proxy layers ${state.upgrades.proxy}   scrubbers ${state.upgrades.scrubbers}`,
          ),
        ],
      };
    case "targets":
      return { state, out: listTargets(state) };
    case "shop":
      return {
        state,
        out: [
          sys("GREY MARKET"),
          dim(`  cracker    ${PRICES.cracker}cr   +12% breach success`),
          dim(`  proxy      ${PRICES.proxy}cr   -15% heat per action`),
          dim(`  scrubber   ${PRICES.scrubber}cr   one heat wipe`),
        ],
      };
    case "buy": {
      const item = (args[0] ?? "").toLowerCase();
      if (item !== "cracker" && item !== "proxy" && item !== "scrubber")
        return { state, out: [warn("Buy what? cracker | proxy | scrubber")] };
      const price = PRICES[item];
      if (state.credits < price)
        return { state, out: [warn(`Not enough credits. Need ${price}cr.`)] };
      const u = state.upgrades;
      const upgrades =
        item === "cracker"
          ? { ...u, cracker: u.cracker + 1 }
          : item === "proxy"
            ? { ...u, proxy: u.proxy + 1 }
            : { ...u, scrubbers: u.scrubbers + 1 };
      return {
        state: { ...state, credits: state.credits - price, upgrades },
        out: [ok(`Acquired ${item}. -${price}cr.`)],
      };
    }
    case "scrub": {
      if (state.upgrades.scrubbers <= 0)
        return { state, out: [warn("No scrubbers left. Buy one from the grey market.")] };
      const cut = Math.min(state.heat, 45);
      return {
        state: {
          ...state,
          heat: state.heat - cut,
          upgrades: { ...state.upgrades, scrubbers: state.upgrades.scrubbers - 1 },
        },
        out: [ok(`Logs rewritten across three hops. Heat -${cut}%.`)],
      };
    }
    case "clear":
      return { state: { ...state, log: [] }, out: [] };
    default:
      break;
  }

  const found = requireTarget(args[0]);
  const isTarget = (v: Target | Out[]): v is Target => !Array.isArray(v);

  if (c === "brief" || c === "scan" || c === "crack" || c === "dox" || c === "report") {
    if (!isTarget(found)) return { state, out: found };
    const t = found;
    const p = progressOf(state, t.id);
    const selected = { ...state, selected: t.id };

    if (c === "brief")
      return {
        state: selected,
        out: [
          sys(`CASE FILE — ${t.codename} (${t.host})`),
          dim(`  ${t.crime} · tier ${t.tier} · bounty ${t.bounty}cr · ${t.rep} rep`),
          dim(`  ${t.brief}`),
        ],
      };

    if (c === "scan") {
      if (p.scanned) return { state: selected, out: [dim("Already mapped. See the dossier panel.")] };
      const h = applyHeat(setProgress(selected, t.id, { scanned: true }), heatGain(state, 6));
      return {
        state: h.state,
        out: [
          sys(`Mapping ${t.host} ...`),
          ...t.ports.map((port) => dim(`  :${port.id.padEnd(6)} ${port.service}`)),
          ok(`${t.ports.length} services exposed.`),
          ...h.out,
        ],
      };
    }

    if (c === "crack") {
      if (!p.scanned) return { state: selected, out: [warn("Scan the host first.")] };
      const portId = args[1];
      const port = t.ports.find((x) => x.id === portId);
      if (!port) return { state: selected, out: [warn("Unknown port. Run 'scan' to review.")] };
      if (p.cracked.includes(port.id))
        return { state: selected, out: [dim("Already breached. Evidence is in the dossier.")] };
      const chance = crackChance(state, port.difficulty);
      if (rng() <= chance) {
        const next = setProgress(selected, t.id, { cracked: [...p.cracked, port.id] });
        const h = applyHeat(next, heatGain(state, 7));
        const remaining = t.ports.length - (p.cracked.length + 1);
        return {
          state: h.state,
          out: [
            ok(`:${port.id} breached — ${port.service}`),
            dim(`  EVIDENCE · ${port.evidence}`),
            remaining > 0
              ? dim(`  ${remaining} service(s) still holding.`)
              : ok("  Full evidence chain assembled. Run 'dox'."),
            ...h.out,
          ],
        };
      }
      const h = applyHeat(selected, heatGain(state, 16));
      return {
        state: h.state,
        out: [bad(`:${port.id} rejected the handshake. They logged the attempt.`), ...h.out],
      };
    }

    if (c === "dox") {
      if (p.cracked.length < t.ports.length)
        return { state: selected, out: [warn("Evidence chain incomplete. Breach every service first.")] };
      if (p.doxed) return { state: selected, out: [dim("Already unmasked.")] };
      const h = applyHeat(setProgress(selected, t.id, { doxed: true }), heatGain(state, 12));
      return {
        state: h.state,
        out: [
          sys("Correlating wallets, timestamps, and metadata ..."),
          ok(`  ${t.operator.alias} is ${t.operator.realName} — ${t.operator.location}`),
          dim(`  ${t.operator.note}`),
          dim("  Package it: 'report " + t.id + "'"),
          ...h.out,
        ],
      };
    }

    // report
    if (!p.doxed) return { state: selected, out: [warn("Nothing to hand over yet. Dox the operator first.")] };
    if (p.seized) return { state: selected, out: [dim("Already handed over. That one's finished.")] };
    const next = setProgress(selected, t.id, { seized: true });
    const done = TARGETS.every((x) => progressOf(next, x.id).seized);
    return {
      state: {
        ...next,
        credits: next.credits + t.bounty,
        rep: next.rep + t.rep,
        heat: Math.max(0, next.heat - 15),
      },
      out: [
        ok(`Dossier delivered. ${t.host} seized. ${t.operator.realName} in custody.`),
        dim(`  +${t.bounty}cr  +${t.rep} rep  heat -15%`),
        ...(done
          ? [
              sys("— NETWORK CLEARED —"),
              dim("  Four rooms dark. Somewhere, a new one opens. It always does."),
            ]
          : []),
      ],
    };
  }

  return { state, out: [warn(`Unknown command '${c}'. Type 'help'.`)] };
}

export const appendLog = (state: GameState, entries: Out[]): GameState => {
  let id = state.nextLineId;
  const lines = entries.map((e) => ({ id: id++, text: e.text, tone: e.tone }));
  return { ...state, log: [...state.log, ...lines].slice(-300), nextLineId: id };
};

export const runCommand = (state: GameState, input: string, rng?: Rng): GameState => {
  const echoed = appendLog(state, [{ text: `> ${input}`, tone: "user" }]);
  const { state: next, out } = execute(echoed, input, rng);
  return appendLog(next, out);
};
