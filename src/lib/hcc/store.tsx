import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import { audio } from "./audio";
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

  const value = useMemo(() => ({ state, dispatch }), [state]);
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
