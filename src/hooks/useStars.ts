import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { getTelegramWebApp, useTelegram } from "@/hooks/useTelegram";
import { useGame } from "@/lib/hcc/store";
import {
  claimDailyDrop,
  claimStarCredits,
  createStarInvoice,
  getPremiumStatus,
} from "@/lib/telegram/stars.functions";
import { starProductById } from "@/lib/telegram/stars";

export type StarsStatus = "idle" | "working" | "confirming" | "error";

/**
 * Single entry point for Telegram Stars purchasing.
 *
 * Nothing is granted client-side on the invoice callback: the callback only
 * triggers a claim, and the server decides what (if anything) is owed based on
 * the webhook-recorded charge.
 */
export function useStars() {
  const { dispatch } = useGame();
  const { isTelegram, initData } = useTelegram();
  const [status, setStatus] = useState<StarsStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const claim = useServerFn(claimStarCredits);
  const invoice = useServerFn(createStarInvoice);
  const premiumStatus = useServerFn(getPremiumStatus);
  const daily = useServerFn(claimDailyDrop);
  const busy = useRef(false);

  const syncPremium = useCallback(
    (p: { expiresAt: number | null; lastClaimOn: string | null; now: number }) => {
      dispatch({ type: "premium-sync", expiresAt: p.expiresAt, lastClaimOn: p.lastClaimOn, at: p.now });
    },
    [dispatch],
  );

  /** Applies anything the server says is owed. Safe to call repeatedly. */
  const claimPending = useCallback(async () => {
    if (!initData || busy.current) return false;
    busy.current = true;
    try {
      const result = await claim({ data: { initData } });
      syncPremium(result.premium);
      if (result.balance !== null)
        dispatch({ type: "wallet-sync", balance: result.balance, at: Date.now() });
      else if (result.credits > 0)
        dispatch({ type: "grant-credits", amount: result.credits, reason: "Telegram Stars purchase" });
      if (result.itemIds.length > 0)
        dispatch({ type: "grant-items", ids: result.itemIds, reason: "Telegram Stars purchase" });
      return result.purchases > 0;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      busy.current = false;
    }
  }, [claim, dispatch, initData, syncPremium]);

  // Pick up purchases confirmed while the Mini App was closed, and refresh the pass.
  useEffect(() => {
    if (!initData) return;
    void claimPending();
    void premiumStatus({ data: { initData } })
      .then(syncPremium)
      .catch((err: unknown) => console.error(err));
  }, [claimPending, initData, premiumStatus, syncPremium]);

  const buy = useCallback(
    async (productId: string) => {
      const app = getTelegramWebApp();
      const product = starProductById(productId);
      if (!app || !initData || !product) return;
      setStatus("working");
      setPendingId(productId);
      setMessage(null);
      try {
        const { url } = await invoice({ data: { initData, productId } });
        app.openInvoice(url, (paymentStatus) => {
          if (paymentStatus !== "paid") {
            setStatus("idle");
            setPendingId(null);
            setMessage(paymentStatus === "cancelled" ? "Purchase cancelled." : null);
            return;
          }
          setStatus("confirming");
          setMessage("Payment received — confirming with the server…");
          // Telegram delivers the webhook moments later; poll briefly.
          let tries = 0;
          const tick = () => {
            void claimPending().then((granted) => {
              if (granted) {
                setStatus("idle");
                setPendingId(null);
                setMessage(`${product.title} delivered.`);
                return;
              }
              if (++tries < 10) window.setTimeout(tick, 1500);
              else {
                setStatus("idle");
                setPendingId(null);
                setMessage("Still confirming. Reopen the shop in a moment and it will apply.");
              }
            });
          };
          window.setTimeout(tick, 1200);
        });
      } catch (err) {
        console.error(err);
        setStatus("error");
        setPendingId(null);
        setMessage("Could not open the invoice. Try again.");
      }
    },
    [claimPending, initData, invoice],
  );

  const claimDaily = useCallback(async () => {
    if (!initData) return;
    try {
      const result = await daily({ data: { initData } });
      syncPremium(result.premium);
      if (result.credits > 0) {
        if (result.balance !== null)
          dispatch({ type: "wallet-sync", balance: result.balance, at: Date.now() });
        else
          dispatch({ type: "grant-credits", amount: result.credits, reason: "Operative Pass daily drop" });
        setMessage(`Daily drop claimed — ${result.credits.toLocaleString()} cr.`);
      } else {
        setMessage("Today's drop has already been claimed.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Could not claim the daily drop.");
    }
  }, [daily, dispatch, initData, syncPremium]);

  return { isTelegram, ready: !!initData, status, message, pendingId, buy, claimDaily, claimPending };
}
