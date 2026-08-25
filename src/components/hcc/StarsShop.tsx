import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";

import { Chip, HudButton, Panel } from "./ui";
import { useStars } from "@/hooks/useStars";
import { useAnalytics } from "@/lib/analytics/useAnalytics";
import { useGame } from "@/lib/hcc/store";
import { canClaimDaily, isPremiumActive } from "@/lib/hcc/state";
import { productsForSection, type StarProduct, type StarSection } from "@/lib/telegram/stars";
import { cn } from "@/lib/utils";

const SECTIONS: { id: StarSection; label: string; note: string }[] = [
  { id: "credits", label: "CREDITS", note: "Instant credit drops, cleared straight into the account." },
  { id: "pass", label: "PASS", note: "30 days of clearance: permanent yield boost and a daily drop." },
  { id: "elite", label: "ELITE", note: "Stars-tier hardware. Also earnable with credits, slowly." },
  { id: "cosmetics", label: "COSMETICS", note: "Exclusive finishes and badges. Not sold for credits." },
];

function daysLeft(expiresAt: number | null): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 86_400_000));
}

export default function StarsShop() {
  const { state } = useGame();
  const { isTelegram, ready, status, message, pendingId, buy, claimDaily } = useStars();
  const [section, setSection] = useState<StarSection>("credits");
  const products = useMemo(() => productsForSection(section), [section]);
  const track = useAnalytics();

  // one event per shop open, and one per product actually shown (deduped)
  useEffect(() => {
    if (isTelegram) track("stars_shop_opened", {});
  }, [isTelegram, track]);
  useEffect(() => {
    if (!isTelegram) return;
    products.forEach((p) => track("stars_product_viewed", { product_id: p.id, stars: p.stars }));
  }, [isTelegram, products, track]);

  const active = isPremiumActive(state);
  const claimable = canClaimDaily(state);

  if (!isTelegram) {
    return (
      <Panel label="PREMIUM SUPPLY" className="p-3">
        <p className="text-[11px] text-muted-foreground">
          Telegram Stars purchases — credit drops, the Operative Pass and Stars-tier equipment — are available when
          H.C.C is opened inside Telegram.
        </p>
      </Panel>
    );
  }

  return (
    <Panel
      label="PREMIUM SUPPLY — TELEGRAM STARS"
      right={active ? <Chip tone="amber">PASS · {daysLeft(state.premium.expiresAt)}D</Chip> : null}
      className="p-3"
    >
      {active && (
        <div className="mb-3 rounded-md border border-hud-amber/40 bg-hud-amber/5 p-2">
          <p className="text-[11px] text-foreground">
            Operative Pass active — +50% mining yield for {daysLeft(state.premium.expiresAt)} more days.
          </p>
          <HudButton
            size="sm"
            tone={claimable ? "amber" : "ghost"}
            className="mt-2"
            disabled={!claimable || !ready}
            onClick={() => void claimDaily()}
          >
            {claimable ? "Claim today's 100,000 cr drop" : "Daily drop claimed"}
          </HudButton>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={cn(
              "rounded border px-2 py-1 text-[10px] tracking-[0.18em]",
              section === s.id
                ? "border-hud-amber/60 bg-hud-amber/10 text-hud-amber"
                : "border-border text-muted-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        {SECTIONS.find((s) => s.id === section)?.note}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {products.map((p) => (
          <StarCard
            key={p.id}
            product={p}
            owned={p.itemIds.length > 0 && p.itemIds.every((id) => state.owned.includes(id))}
            busy={pendingId === p.id}
            disabled={!ready || status === "working" || status === "confirming"}
            onBuy={() => void buy(p.id)}
          />
        ))}
      </div>

      {message && <p className="mt-2 text-[10px] tracking-[0.14em] text-hud-green/80">{message}</p>}
      <p className="mt-2 text-[10px] text-muted-foreground">
        Purchases are confirmed by Telegram and applied by the server. Nothing is granted on the device.
      </p>
    </Panel>
  );
}

function StarCard({
  product,
  owned,
  busy,
  disabled,
  onBuy,
}: {
  product: StarProduct;
  owned: boolean;
  busy: boolean;
  disabled: boolean;
  onBuy: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-2",
        product.bestValue ? "border-hud-amber/50 bg-hud-amber/5" : "border-border/60 bg-background/40",
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <h3 className="min-w-0 truncate text-sm text-foreground">{product.title}</h3>
        {product.bestValue ? <Chip tone="amber">BEST VALUE</Chip> : owned ? <Chip tone="green">OWNED</Chip> : null}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{product.description}</p>
      {product.tagline && <p className="mt-1 text-[10px] tracking-[0.14em] text-hud-green/80">{product.tagline}</p>}
      {product.creditPrice > 0 && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          Also earnable for {product.creditPrice.toLocaleString()} cr in the credit shop.
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-hud-amber">
          <Star className="size-3" strokeWidth={2} />
          {product.stars} XTR
        </span>
        <HudButton size="sm" tone="amber" disabled={disabled || owned} onClick={onBuy}>
          {busy ? "Opening…" : owned ? "Owned" : "Buy with Stars"}
        </HudButton>
      </div>
    </div>
  );
}
