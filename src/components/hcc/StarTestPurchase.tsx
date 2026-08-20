import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Star } from "lucide-react";

import { Chip, HudButton, Panel } from "./ui";
import { getTelegramWebApp, useTelegram } from "@/hooks/useTelegram";
import { useGame } from "@/lib/hcc/store";
import { claimStarCredits, createStarInvoice } from "@/lib/telegram/stars.functions";
import { STAR_TEST_PRODUCT } from "@/lib/telegram/stars";

type Status = "idle" | "working" | "done" | "error";

/** Temporary Telegram Stars test product. Credits are granted only after server-side confirmation. */
export default function StarTestPurchase() {
  const { dispatch } = useGame();
  const { isTelegram, initData } = useTelegram();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const claim = useServerFn(claimStarCredits);
  const invoice = useServerFn(createStarInvoice);
  const claiming = useRef(false);

  const claimPending = useCallback(async () => {
    if (!initData || claiming.current) return;
    claiming.current = true;
    try {
      const result = await claim({ data: { initData } });
      if (result.credits > 0) {
        dispatch({ type: "grant-credits", amount: result.credits, reason: "Telegram Stars test purchase" });
        setStatus("done");
        setMessage(`${result.credits.toLocaleString()} cr credited.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      claiming.current = false;
    }
  }, [claim, dispatch, initData]);

  // Pick up any payment confirmed while the Mini App was closed.
  useEffect(() => {
    void claimPending();
  }, [claimPending]);

  const buy = async () => {
    const app = getTelegramWebApp();
    if (!app || !initData) return;
    setStatus("working");
    setMessage(null);
    try {
      const { url } = await invoice({ data: { initData, productId: STAR_TEST_PRODUCT.id } });
      app.openInvoice(url, (paymentStatus) => {
        if (paymentStatus === "paid") {
          setMessage("Payment received — confirming with the server…");
          // Telegram delivers the webhook moments later; retry briefly.
          let tries = 0;
          const tick = () => {
            void claimPending().then(() => {
              if (++tries < 8) window.setTimeout(tick, 1500);
            });
          };
          window.setTimeout(tick, 1200);
        } else {
          setStatus("idle");
          setMessage(paymentStatus === "cancelled" ? "Purchase cancelled." : null);
        }
      });
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Could not open the invoice. Try again.");
    }
  };

  if (!isTelegram) return null;

  return (
    <Panel label="TEST PURCHASE" className="p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <h3 className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
          <Star className="size-3.5 shrink-0 text-hud-amber" strokeWidth={1.8} />
          <span className="truncate">{STAR_TEST_PRODUCT.title}</span>
        </h3>
        <Chip tone="amber">TEST</Chip>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {STAR_TEST_PRODUCT.description} Pricing is provisional while we verify payments.
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-hud-amber">{STAR_TEST_PRODUCT.stars} ★ XTR</span>
        <HudButton size="sm" tone="amber" disabled={status === "working" || !initData} onClick={() => void buy()}>
          {status === "working" ? "Opening…" : "Buy test pack"}
        </HudButton>
      </div>
      {message && <p className="mt-2 text-[10px] tracking-[0.14em] text-hud-green/80">{message}</p>}
    </Panel>
  );
}
