import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";

import { useAnalytics } from "@/lib/analytics/useAnalytics";
import { eventForAction } from "@/lib/analytics/gameplay";
import { syncPlayerProgress } from "@/lib/analytics/analytics.functions";
import { useTelegram } from "@/hooks/useTelegram";
import { audio } from "./audio";
import { itemById } from "./catalog";
import { sellQuote } from "./market";
import { rewardForLevel } from "./prestige";
import { findTarget } from "./state";
import { useWallet } from "./useWallet";
import { generateTarget } from "./generator";
import { activeNews } from "./news";
import {
  allTargets,
  coinPrice,
  deriveMining,
  deriveStats,
  initialState,
  rankIndex,
  reducer,
  type Action,
} from "./state";
import type { GameState } from "./types";

const KEY = "hcc.save.v2";

type Ctx = {
  state: GameState;
  dispatch: (a: Action) => void;
};

const GameContext = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const wallet = useWallet();
  const linked = useRef(false);
  const track = useAnalytics();
  const { initData } = useTelegram();
  const syncProgress = useServerFn(syncPlayerProgress);

  const sync = useCallback((balance: number | null) => {
    if (balance === null) return;
    dispatch({ type: "wallet-sync", balance, at: Date.now() });
  }, []);

  /**
   * Link the local save to the backend ledger once per session. The first link
   * imports the pre-ledger balance (clamped, once ever); afterwards the server
   * balance simply replaces whatever the device thinks it has.
   */
  useEffect(() => {
    if (!wallet.enabled || linked.current || state.phase === "offline") return;
    linked.current = true;
    void wallet.link(stateRef.current.credits).then((acc) => {
      if (!acc) {
        linked.current = false;
        return;
      }
      dispatch({ type: "wallet-mode", mode: "server" });
      dispatch({
        type: "wallet-sync",
        balance: acc.balance,
        owned: acc.owned,
        prestige: acc.prestige,
        at: Date.now(),
      });
    });
  }, [wallet, state.phase]);

  // cached progression snapshot for reporting; observation only, never credits
  const rank = rankIndex(state.intel);
  useEffect(() => {
    if (!initData) return;
    const s = stateRef.current;
    const tierOf = (ids: readonly string[]) =>
      ids.reduce((max, itemId) => Math.max(max, itemById(itemId)?.tier ?? 1), 1);
    void syncProgress({
      data: {
        initData,
        rankIndex: rank,
        prestige: s.prestige,
        rigTier: tierOf(Object.values(s.installed)),
        minerTier: tierOf(Object.keys(s.mining.units)),
        opSlots: Math.max(1, Math.round(deriveStats(s).opSlots)),
      },
    }).catch(() => {
      /* measurement is best effort */
    });
  }, [initData, rank, state.prestige, syncProgress]);

  /**
   * Optimistic local reducer first, then the authoritative server mutation.
   * The server's balance always wins, so a tampered client only ever sees its
   * own number for a moment.
   */
  const send = useCallback(
    (a: Action) => {
      const before = stateRef.current;
      dispatch(a);
      const event = eventForAction(a as unknown as { type: string }, before);
      if (event) track(event.name, event.props);
      if (before.wallet.mode !== "server") return;
      switch (a.type) {
        case "buy": {
          const it = itemById(a.id);
          if (!it || it.price <= 0 || before.credits < it.price) return;
          void wallet.buy(a.id).then(sync);
          return;
        }
        case "report": {
          const t = findTarget(before, a.targetId);
          const p = before.progress[a.targetId];
          if (!t || !p || p.seized || p.evidence.length < t.ops.length) return;
          const payout = Math.round(t.bounty * (1 + deriveStats(before).bounty));
          void wallet.bounty(a.targetId, payout).then(sync);
          return;
        }
        case "sell": {
          const amount = before.mining.balances[a.coin];
          if (amount <= 0) return;
          void wallet.sell(a.coin, Math.round(sellQuote(a.coin, a.at, amount).gross)).then(sync);
          return;
        }
        case "scrub": {
          if (before.credits < 600) return;
          void wallet.spend(600, "scrub").then(sync);
          return;
        }
        case "mining-contract": {
          const fee = itemById(before.mining.contract)?.mining?.switchFee ?? 0;
          if (fee <= 0 || fee > before.credits) return;
          void wallet.spend(fee, "contract-switch").then(sync);
          return;
        }
        case "prestige": {
          const level = before.prestige + 1;
          void wallet.prestige(level, rewardForLevel(level)?.effect.grant ?? 0).then(sync);
          return;
        }
        default:
          return;
      }
    },
    [wallet, sync, track],
  );

  // restore
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<GameState>;
      dispatch({ type: "restore", saved } as unknown as Action);
    } catch {
      /* ignore corrupted save */
    }
  }, []);

  // persist
  useEffect(() => {
    if (state.phase === "offline") return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ ...state, log: [], phase: "online" }));
    } catch {
      /* storage unavailable */
    }
  }, [state]);

  // mining accrual
  useEffect(() => {
    if (state.phase !== "online") return;
    const id = window.setInterval(() => {
      const now = Date.now();
      const read = deriveMining(state, now);
      if (read.effectiveHash <= 0 && read.costPerSec <= 0) return;
      dispatch({
        type: "mining-accrue",
        amounts: {
          BTC: read.coins.BTC.coinPerSec * 2,
          ETH: read.coins.ETH.coinPerSec * 2,
          GHST: read.coins.GHST.coinPerSec * 2,
        },
        cost: read.costPerSec * 2,
        at: now,
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, [state]);

  // market news + macro shocks announce themselves in the event stream
  useEffect(() => {
    if (state.phase !== "online") return;
    const seen = new Set<string>();
    activeNews(Date.now()).forEach((e) => seen.add(e.id));
    const id = window.setInterval(() => {
      activeNews(Date.now()).forEach((e) => {
        if (seen.has(e.id)) return;
        seen.add(e.id);
        audio.sfx("alert");
        dispatch({
          type: "log",
          text: `MARKET WIRE — ${e.headline}. ${e.detail}`,
          tone: e.tone === "bear" ? "bad" : e.tone === "bull" ? "ok" : "warn",
        });
      });
    }, 5000);
    return () => window.clearInterval(id);
  }, [state.phase]);

  // enemy generator: new criminals surface at random intervals, forever
  useEffect(() => {
    if (state.phase !== "online") return;
    let timer = 0;
    const schedule = (ms: number) => {
      timer = window.setTimeout(() => {
        const s = stateRef.current;
        const open = allTargets(s).filter((t) => !s.progress[t.id]?.seized).length;
        if (open < 9) {
          const target = generateTarget({
            rank: rankIndex(s.intel),
            seq: s.generated.length + 1,
          });
          dispatch({ type: "spawn", target });
          audio.sfx("alert");
          audio.speak("New cyber criminal detected");
        }
        schedule(70000 + Math.random() * 110000);
      }, ms);
    };
    schedule(30000 + Math.random() * 40000);
    return () => window.clearTimeout(timer);
  }, [state.phase]);

  const value = useMemo(() => ({ state, dispatch: send }), [state, send]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): Ctx {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}

export function useStats() {
  const { state } = useGame();
  return useMemo(() => deriveStats(state), [state]);
}

export function useMiningReadout(at: number) {
  const { state } = useGame();
  return useMemo(() => deriveMining(state, at), [state, at]);
}

export { coinPrice };
