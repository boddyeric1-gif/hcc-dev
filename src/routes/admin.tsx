import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { getMetricsSummary, type MetricsSummary } from "@/lib/analytics/analytics.functions";
import { useTelegram } from "@/hooks/useTelegram";
import { Panel, Stat, HudButton, Chip } from "@/components/hcc/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "H.C.C — Metrics Console" },
      { name: "description", content: "Admin analytics dashboard for H.C.C." },
      { property: "og:title", content: "H.C.C — Metrics Console" },
      { property: "og:description", content: "Admin analytics dashboard for H.C.C." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { initData } = useTelegram();
  const fetchSummary = useServerFn(getMetricsSummary);
  const [data, setData] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!initData) {
      setError("Open this page inside the Telegram Mini App so your admin ID can be verified.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const summary = await fetchSummary({ data: { initData } });
      setData(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initData) load();
  }, [initData]);

  return (
    <div className="flex min-h-screen flex-col bg-background p-3 text-foreground">
      <header className="mb-3 flex items-center gap-3">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] text-hud-cyan hover:underline">
          <ArrowLeft className="size-3.5" strokeWidth={1.6} />
          Back to Console
        </Link>
        <h1 className="ml-auto text-xs tracking-[0.22em] text-hud-cyan">METRICS CONSOLE</h1>
      </header>

      <Panel label="OVERVIEW" className="p-3">
        <div className="mb-3 flex items-center gap-2">
          <HudButton onClick={load} disabled={loading} tone="cyan">
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} strokeWidth={1.6} />
            Refresh
          </HudButton>
          {error && <Chip tone="red">{error}</Chip>}
        </div>

        {!data && !error && loading && (
          <div className="py-8 text-center text-[11px] text-muted-foreground">Loading metrics…</div>
        )}

        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="TOTAL PLAYERS" value={formatNumber(data.totalPlayers)} tone="cyan" />
              <Stat label="ACTIVE TODAY" value={formatNumber(data.activeToday)} tone="green" />
              <Stat label="ACTIVE 7D" value={formatNumber(data.active7d)} tone="green" />
              <Stat label="NEW TODAY" value={formatNumber(data.newToday)} tone="amber" />
              <Stat label="NEW 7D" value={formatNumber(data.new7d)} tone="amber" />
              <Stat label="PAYING PLAYERS" value={formatNumber(data.payingPlayers)} tone="violet" />
              <Stat label="TOTAL STARS" value={formatNumber(data.totalStars)} tone="violet" />
            </div>

            <section>
              <h3 className="mb-2 text-[10px] tracking-[0.2em] text-muted-foreground">REVENUE BY PRODUCT</h3>
              <div className="space-y-1.5">
                {data.revenue.length === 0 && (
                  <div className="text-[11px] text-muted-foreground">No purchases recorded yet.</div>
                )}
                {data.revenue.map((r) => (
                  <div
                    key={`${r.productId}-${r.kind}`}
                    className="flex items-center justify-between rounded border border-border/60 bg-background/40 px-2.5 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[11px] text-foreground/90">{r.productId}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">{r.kind}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] tabular-nums text-hud-cyan">{formatNumber(r.totalStars)} ⭐</div>
                      <div className="text-[10px] tabular-nums text-muted-foreground">{r.transactions} tx</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-[10px] tracking-[0.2em] text-muted-foreground">RETENTION (D1 / D7)</h3>
              <div className="space-y-1.5">
                {data.retention.length === 0 && (
                  <div className="text-[11px] text-muted-foreground">No cohorts matured yet.</div>
                )}
                {data.retention.map((r) => (
                  <div
                    key={r.cohortDay}
                    className="flex items-center justify-between rounded border border-border/60 bg-background/40 px-2.5 py-1.5"
                  >
                    <div className="text-[11px] text-foreground/90">{r.cohortDay}</div>
                    <div className="flex gap-3 text-right text-[11px] tabular-nums">
                      <div className="text-hud-green">{r.d1}% D1</div>
                      <div className="text-hud-amber">{r.d7}% D7</div>
                      <div className="text-muted-foreground">n={formatNumber(r.cohortSize)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-[10px] tracking-[0.2em] text-muted-foreground">TOP EVENTS</h3>
              <div className="space-y-1.5">
                {data.topEvents.length === 0 && (
                  <div className="text-[11px] text-muted-foreground">No events recorded yet.</div>
                )}
                {data.topEvents.map((e) => (
                  <div
                    key={e.name}
                    className="flex items-center justify-between rounded border border-border/60 bg-background/40 px-2.5 py-1.5"
                  >
                    <div className="text-[11px] uppercase text-foreground/90">{e.name}</div>
                    <div className="flex gap-3 text-right text-[11px] tabular-nums text-muted-foreground">
                      <span className="text-hud-cyan">{formatNumber(e.players)} players</span>
                      <span>{formatNumber(e.events)} events</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </Panel>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
