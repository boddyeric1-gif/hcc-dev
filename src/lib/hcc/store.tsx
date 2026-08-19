import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import { coinPrice, deriveMining, deriveStats, initialState, reducer, type Action } from "./state";
import type { GameState } from "./types";

const KEY = "hcc.save.v2";

type Ctx = {
  state: GameState;
  dispatch: (a: Action) => void;
};

const GameContext = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

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
        coin: state.mining.coin,
        amount: read.coinPerSec * 2,
        cost: read.costPerSec * 2,
        at: now,
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, [state]);

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
