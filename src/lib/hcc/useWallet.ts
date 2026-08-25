import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { useTelegram } from "@/hooks/useTelegram";
import { useAnalytics } from "@/lib/analytics/useAnalytics";
import {
  buyWithCredits,
  claimBounty,
  commitPrestigeLevel,
  getWalletAccount,
  migrateWallet,
  settleSale,
  spendFromWallet,
} from "./wallet.functions";
import type { Coin } from "./types";

export type WalletAccount = {
  balance: number;
  owned: string[];
  prestige: number;
  migrationComplete: boolean;
};

export type WalletBridge = {
  /** true once a verified Telegram session is available */
  enabled: boolean;
  ready: boolean;
  link: (localCredits: number) => Promise<WalletAccount | null>;
  refresh: () => Promise<WalletAccount | null>;
  buy: (itemId: string) => Promise<number | null>;
  bounty: (targetId: string, claimed: number) => Promise<number | null>;
  sell: (coin: Coin, claimed: number) => Promise<number | null>;
  spend: (amount: number, reason: string) => Promise<number | null>;
  prestige: (level: number, grant: number) => Promise<number | null>;
};

/**
 * Thin client for the server-authoritative ledger. Outside Telegram there is no
 * verifiable identity, so the game stays in local mode and nothing is synced.
 */
export function useWallet(): WalletBridge {
  const { initData } = useTelegram();
  const track = useAnalytics();
  const [ready, setReady] = useState(false);
  const enabled = initData.length > 10;
  const initRef = useRef(initData);
  initRef.current = initData;

  const account = useServerFn(getWalletAccount);
  const migrate = useServerFn(migrateWallet);
  const buyFn = useServerFn(buyWithCredits);
  const bountyFn = useServerFn(claimBounty);
  const sellFn = useServerFn(settleSale);
  const spendFn = useServerFn(spendFromWallet);
  const prestigeFn = useServerFn(commitPrestigeLevel);

  useEffect(() => {
    if (!enabled) setReady(false);
  }, [enabled]);

  const guard = useCallback(
    async <T,>(run: (initData: string) => Promise<T>): Promise<T | null> => {
      const id = initRef.current;
      if (id.length <= 10) return null;
      try {
        return await run(id);
      } catch (err) {
        console.error("[wallet]", err);
        track("server_sync_error", { reason: "wallet" });
        return null;
      }
    },
    [track],
  );

  const link = useCallback(
    async (localCredits: number) =>
      guard(async (id) => {
        const res = await migrate({ data: { initData: id, claimedBalance: localCredits } });
        setReady(true);
        return {
          balance: res.account.balance,
          owned: res.account.owned,
          prestige: res.account.prestige,
          migrationComplete: res.account.migrationComplete,
        };
      }),
    [guard, migrate],
  );

  const refresh = useCallback(
    async () =>
      guard(async (id) => {
        const snap = await account({ data: { initData: id } });
        setReady(true);
        return {
          balance: snap.balance,
          owned: snap.owned,
          prestige: snap.prestige,
          migrationComplete: snap.migrationComplete,
        };
      }),
    [guard, account],
  );

  return {
    enabled,
    ready,
    link,
    refresh,
    buy: useCallback(
      (itemId) => guard(async (id) => (await buyFn({ data: { initData: id, itemId } })).balance),
      [guard, buyFn],
    ),
    bounty: useCallback(
      (targetId, claimed) =>
        guard(async (id) => (await bountyFn({ data: { initData: id, targetId, claimed } })).balance),
      [guard, bountyFn],
    ),
    sell: useCallback(
      (coin, claimed) =>
        guard(async (id) => (await sellFn({ data: { initData: id, coin, claimed } })).balance),
      [guard, sellFn],
    ),
    spend: useCallback(
      (amount, reason) =>
        guard(async (id) => (await spendFn({ data: { initData: id, amount, reason } })).balance),
      [guard, spendFn],
    ),
    prestige: useCallback(
      (level, grant) =>
        guard(async (id) => (await prestigeFn({ data: { initData: id, level, grant } })).balance),
      [guard, prestigeFn],
    ),
  };
}
