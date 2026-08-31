import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";

import { Bar, Chip, HudButton, Panel, Sparkline, Stat } from "../ui";
import SceneBrightness from "../SceneBrightness";
import type { MiningVisual } from "../three/MiningScene";
import { useGame } from "@/lib/hcc/store";
import { COINS, CATALOG, LIGHT_HEX, itemById } from "@/lib/hcc/catalog";
import { deriveMining, unitAllocation } from "@/lib/hcc/state";
import { priceHistory, sellQuote } from "@/lib/hcc/market";
import { activeNews, recentNews } from "@/lib/hcc/news";
import { minerTheme } from "@/lib/hcc/themes";
import type { Coin } from "@/lib/hcc/types";
import { cn } from "@/lib/utils";

const MiningScene = lazy(() => import("../three/MiningScene"));

const COIN_LIST: Coin[] = ["BTC", "ETH", "GHST"];
const CONTRACTS = CATALOG.filter((i) => i.mining?.kind === "contract");

function SceneFallback() {
  return (
    <div className="hud-grid flex h-full items-center justify-center text-[10px] tracking-[0.28em] text-hud-green/60">
      SPINNING UP FARM…
    </div>
  );
}

export default function MiningTab() {
  const { state, dispatch } = useGame();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 2500);
    return () => window.clearInterval(id);
  }, []);

  const read = useMemo(() => deriveMining(state, now), [state, now]);
  const history = useMemo(() => priceHistory(state.mining.coin, now), [state.mining.coin, now]);

  const units = Object.entries(state.mining.units).filter(([, n]) => n > 0);
  const visual: MiningVisual = useMemo(() => {
    let gpuRigs = 0;
    let asics = 0;
    let shelves = 0;
    let fans = 0;
    units.forEach(([id, n]) => {
      const m = itemById(id)?.mining;
      if (!m) return;
      if (m.kind === "gpu") gpuRigs += n;
      if (m.kind === "asic") asics += n;
      if (m.kind === "shelf") shelves += n;
      if (m.kind === "cooler") fans += n;
    });
    return {
      gpuRigs: Math.min(60, gpuRigs),
      asics: Math.min(60, asics),
      shelves: Math.max(1, shelves),
      fans,
      heatRatio: read.coolingCap > 0 ? read.heatLoad / (read.coolingCap + 1) : read.heatLoad / 40,
      online: read.effectiveHash > 0,
      accent: LIGHT_HEX[state.installed.lighting ?? "light-cyan"] ?? "#38e1ff",
      theme: minerTheme(state.installed.minerTheme),
    };
  }, [units, read, state.installed.lighting, state.installed.minerTheme]);

  const news = useMemo(() => recentNews(now, 5), [now]);
  const live = useMemo(() => new Set(activeNews(now).map((e) => e.id)), [now]);
  const balance = state.mining.balances[state.mining.coin];
  const sq = balance > 0 ? sellQuote(state.mining.coin, now, balance) : null;

  return (
    <div className="space-y-3">
      <Panel label="MINING FARM — LIVE RENDER" right={<SceneBrightness />}>
        <div className="h-[42vh] min-h-[260px] w-full">
          <ClientOnly fallback={<SceneFallback />}>
            <Suspense fallback={<SceneFallback />}>
              <MiningScene v={visual} quality={state.quality} brightness={state.brightness} />
            </Suspense>
          </ClientOnly>
        </div>
      </Panel>

      <Panel label="MARKET" className="p-3">
        <div className="grid grid-cols-3 gap-2">
          {COIN_LIST.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => dispatch({ type: "mining-coin", coin: c })}
              className={cn(
                "rounded-md border px-2 py-2 text-left transition-colors",
                state.mining.coin === c ? "border-hud-green/60 bg-hud-green/10" : "border-border bg-secondary/30",
              )}
            >
              <div className="text-[11px] tracking-[0.18em] text-foreground">{c}</div>
              <div className="text-[10px] text-muted-foreground">{COINS[c].name}</div>
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-md border border-border/60 bg-background/40 p-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] tracking-[0.2em] text-muted-foreground">
              {state.mining.coin} / CR — 10 HR
            </span>
            <span className={cn("text-[11px] tabular-nums", read.change24h >= 0 ? "text-hud-green" : "text-hud-red")}>
              {read.change24h >= 0 ? "+" : ""}
              {(read.change24h * 100).toFixed(2)}% 24h
            </span>
          </div>
          <Sparkline values={history} className="mt-2 h-14 w-full" up={read.change24h >= 0} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="BID" value={`${Math.round(read.bid).toLocaleString()} cr`} tone="green" />
          <Stat label="ASK" value={`${Math.round(read.ask).toLocaleString()} cr`} tone="red" />
          <Stat label="SPREAD" value={`${(read.spreadPct * 100).toFixed(2)}%`} tone="amber" />
          <Stat
            label="REGIME"
            value={read.regime}
            tone={read.regime === "SPIKE" ? "red" : read.regime === "TRENDING" ? "amber" : "cyan"}
          />
          <Stat label="DIFFICULTY" value={`${read.difficulty.toFixed(3)}x`} tone="violet" hint="yield divisor" />
          <Stat label="BALANCE" value={balance.toFixed(6)} tone="green" />
          <Stat
            label="BREAK-EVEN"
            value={read.breakEven > 0 ? `${Math.round(read.breakEven).toLocaleString()} cr` : "—"}
            hint="price to cover power"
            tone={read.breakEven > read.bid ? "red" : "green"}
          />
          <Stat
            label="PROJECTED / DAY"
            value={`${Math.round(read.dailyNet).toLocaleString()} cr`}
            hint="all coins, net of power"
            tone={read.dailyNet >= 0 ? "green" : "red"}
          />
        </div>

        <HudButton
          tone="green"
          className="mt-3 w-full"
          disabled={balance <= 0}
          onClick={() => dispatch({ type: "sell", coin: state.mining.coin, at: Date.now() })}
        >
          {sq
            ? `Sell ${balance.toFixed(6)} ${state.mining.coin} → ${Math.round(sq.gross).toLocaleString()} cr`
            : `No ${state.mining.coin} to sell`}
        </HudButton>
        {sq && sq.slip > 0.0005 && (
          <p className="mt-1 text-[10px] text-hud-amber">
            Order size walks the book — {(sq.slip * 100).toFixed(2)}% slippage on top of the spread.
          </p>
        )}
      </Panel>

      <Panel label="MARKET WIRE" className="p-3">
        {news.length === 0 && <p className="text-[11px] text-muted-foreground">Wire quiet. No active shocks.</p>}
        <ul className="space-y-2">
          {news.map((e) => (
            <li
              key={e.id}
              className={cn(
                "rounded-md border p-2",
                live.has(e.id) ? "border-hud-amber/50 bg-hud-amber/5" : "border-border/60 bg-background/40 opacity-70",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-[11px] text-foreground">{e.headline}</p>
                <Chip tone={live.has(e.id) ? (e.tone === "bear" ? "red" : e.tone === "bull" ? "green" : "amber") : "dim"}>
                  {live.has(e.id) ? (e.scope === "ALL" ? "MACRO" : e.scope) : "SETTLED"}
                </Chip>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{e.detail}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel label="FARM TELEMETRY" className="p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="HASHRATE" value={`${read.effectiveHash.toFixed(0)} MH/s`} hint={`raw ${Math.round(read.rawHash)}`} />
          <Stat label="DRAW" value={`${(read.watts / 1000).toFixed(2)} kW`} hint={`cap ${(read.capacityW / 1000).toFixed(0)} kW`} tone="amber" />
          <Stat label="THERMAL LOAD" value={read.heatLoad > 0 ? `+${read.heatLoad.toFixed(0)}` : "STABLE"} tone={read.heatLoad > 0 ? "red" : "green"} />
          <Stat label="RACK SLOTS" value={`${read.slotsUsed}/${read.slots}`} tone={read.slotsUsed > read.slots ? "red" : "cyan"} />
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px] tracking-[0.18em] text-muted-foreground">
            <span>EFFICIENCY</span>
            <span>{(read.throttle * 100).toFixed(0)}%</span>
          </div>
          <Bar value={read.throttle * 100} tone={read.throttle > 0.85 ? "green" : read.throttle > 0.5 ? "amber" : "red"} />
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Limiting factor:{" "}
          <span className={read.limiter === "NONE" ? "text-hud-green" : "text-hud-amber"}>{read.limiter}</span>
          {read.hash > 0 && ` · ${(read.watts / Math.max(1, read.effectiveHash)).toFixed(1)} W per MH/s`}
        </p>
        <div className="mt-3 space-y-1">
          {COIN_LIST.map((c) => {
            const cr = read.coins[c];
            return (
              <div
                key={c}
                className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-background/40 px-2 py-1 text-[10px]"
              >
                <span className="tracking-[0.18em] text-muted-foreground">{c}</span>
                <span className="text-muted-foreground">
                  {cr.units} unit{cr.units === 1 ? "" : "s"} · {cr.effectiveHash.toFixed(0)} MH/s
                </span>
                <span className={cr.revenuePerSec > 0 ? "text-hud-green tabular-nums" : "text-muted-foreground"}>
                  {Math.round(cr.revenuePerSec * 3600).toLocaleString()} cr/h
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel label="YIELD BREAKDOWN" className="p-3">
        <ul className="space-y-1 text-[11px]">
          <li className="flex justify-between gap-2">
            <span className="text-muted-foreground">Base hashrate (installed units)</span>
            <span className="tabular-nums text-foreground">{Math.round(read.rawHash).toLocaleString()} MH/s</span>
          </li>
          <li className="flex justify-between gap-2">
            <span className="text-muted-foreground">Efficiency (power · thermals · slots)</span>
            <span className="tabular-nums text-foreground">×{read.throttle.toFixed(3)}</span>
          </li>
          {read.mulBreakdown.map((m) => (
            <li key={m.label} className="flex justify-between gap-2">
              <span className="truncate text-muted-foreground">{m.label}</span>
              <span className="tabular-nums text-hud-green">×{m.mul.toFixed(2)}</span>
            </li>
          ))}
          {read.mulBreakdown.length === 0 && (
            <li className="text-[10px] text-muted-foreground">No yield multipliers owned yet — GPUs, PSUs and perks add them.</li>
          )}
          <li className="mt-1 flex justify-between gap-2 border-t border-border/60 pt-1">
            <span className="tracking-[0.16em] text-muted-foreground">EFFECTIVE HASHRATE</span>
            <span className="tabular-nums text-hud-cyan">{Math.round(read.effectiveHash).toLocaleString()} MH/s</span>
          </li>
        </ul>
        <ul className="mt-3 space-y-1 border-t border-border/60 pt-2 text-[11px]">
          <li className="flex justify-between gap-2">
            <span className="text-muted-foreground">Gross revenue (all coins, at bid)</span>
            <span className="tabular-nums text-hud-green">
              {Math.round(read.revenuePerSec * 3600).toLocaleString()} cr/h
            </span>
          </li>
          <li className="flex justify-between gap-2">
            <span className="text-muted-foreground">Power & demand charges</span>
            <span className="tabular-nums text-hud-red">
              −{Math.round(read.costPerSec * 3600).toLocaleString()} cr/h
            </span>
          </li>
          <li className="mt-1 flex justify-between gap-2 border-t border-border/60 pt-1">
            <span className="tracking-[0.16em] text-muted-foreground">NET</span>
            <span className={cn("tabular-nums", read.netPerSec >= 0 ? "text-hud-green" : "text-hud-red")}>
              {Math.round(read.netPerSec * 3600).toLocaleString()} cr/h · {Math.round(read.dailyNet).toLocaleString()} cr/day
            </span>
          </li>
        </ul>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Coins are mined continuously and credited on sale; the day figure is net cr/h × 24 at current prices and
          difficulty, so it drifts with the market.
        </p>
      </Panel>

      <Panel label="POWER CONTRACT" className="p-3">
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <Chip tone={read.contract.peak ? "red" : "green"}>{read.contract.peak ? "PEAK WINDOW" : "OFF-PEAK"}</Chip>
          <span className="text-muted-foreground">
            {read.contract.rate.toFixed(3)} cr/kWh now (base {read.contract.baseRate.toFixed(2)})
          </span>
          {Math.abs(read.contract.macroRateMul - 1) > 0.02 && (
            <Chip tone={read.contract.macroRateMul > 1 ? "red" : "green"}>
              MACRO {read.contract.macroRateMul.toFixed(2)}x
            </Chip>
          )}
          {read.overageW > 0 && (
            <Chip tone="red">OVERAGE {(read.overageW / 1000).toFixed(1)} kW @ {read.contract.overageMul}x</Chip>
          )}
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Peak hours run 16:00–21:00. Draw above the ceiling is billed at the penalty rate and the breaker sags past 125%.
        </p>
        <div className="mt-3 space-y-2">
          {CONTRACTS.map((c) => {
            const m = c.mining!;
            const owned = state.owned.includes(c.id);
            const active = state.mining.contract === c.id;
            return (
              <div
                key={c.id}
                className={cn(
                  "rounded-md border p-2",
                  active ? "border-hud-green/50 bg-hud-green/5" : "border-border/60 bg-background/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-foreground">{c.name}</p>
                  {active ? (
                    <Chip tone="green">ACTIVE</Chip>
                  ) : owned ? (
                    <HudButton size="sm" tone="ghost" onClick={() => dispatch({ type: "mining-contract", id: c.id })}>
                      Switch
                    </HudButton>
                  ) : (
                    <Chip tone="dim">{c.price.toLocaleString()} cr · SHOP</Chip>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {m.capacityKw} kW · {m.pricePerKwh} base · peak {m.peakMul}x · off-peak {m.offPeakMul}x · overage{" "}
                  {m.overageMul}x{m.switchFee ? ` · exit ${m.switchFee.toLocaleString()} cr` : " · no exit fee"}
                </p>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel label="INSTALLED UNITS" className="p-3">
        {units.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            No mining hardware. Buy shelves, rigs and cooling from the SHOP.
          </p>
        )}
        {units.length > 0 && (
          <p className="mb-2 text-[10px] text-muted-foreground">
            Assign individual miners to coins. Anything left unassigned mines {state.mining.coin}.
          </p>
        )}
        <div className="space-y-2">
          {units.map(([id, n]) => {
            const it = itemById(id);
            if (!it) return null;
            const alloc = unitAllocation(state, id);
            const assignable = (it.mining?.kind === "gpu" || it.mining?.kind === "asic") ?? false;
            return (
              <div key={id} className="rounded-md border border-border/60 bg-background/40 p-2">
                <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs text-foreground">{it.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {it.mining?.hash ? `${it.mining.hash} MH/s · ` : ""}
                    {it.mining?.watts}W
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <HudButton size="sm" tone="ghost" onClick={() => dispatch({ type: "mining-unit", id, delta: -1 })}>
                    −
                  </HudButton>
                  <Chip tone="cyan">{n}</Chip>
                </div>
                </div>
                {assignable && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {COIN_LIST.map((c) => (
                      <div
                        key={c}
                        className="flex items-center justify-between gap-1 rounded-md border border-border/50 px-1.5 py-1"
                      >
                        <button
                          type="button"
                          className="px-1 text-[11px] text-muted-foreground hover:text-hud-red"
                          onClick={() => dispatch({ type: "mining-assign", id, coin: c, delta: -1 })}
                        >
                          −
                        </button>
                        <span className="text-[10px] tabular-nums text-foreground">
                          {c} {alloc[c]}
                        </span>
                        <button
                          type="button"
                          className="px-1 text-[11px] text-muted-foreground hover:text-hud-green"
                          onClick={() => dispatch({ type: "mining-assign", id, coin: c, delta: 1 })}
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
