import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";

import { Bar, Chip, HudButton, Panel, Stat } from "../ui";
import type { MiningVisual } from "../three/MiningScene";
import { useGame } from "@/lib/hcc/store";
import { COINS, LIGHT_HEX, itemById } from "@/lib/hcc/catalog";
import { deriveMining } from "@/lib/hcc/state";
import type { Coin } from "@/lib/hcc/types";
import { cn } from "@/lib/utils";

const MiningScene = lazy(() => import("../three/MiningScene"));

const COIN_LIST: Coin[] = ["BTC", "ETH", "GHST"];

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
    const id = window.setInterval(() => setNow(Date.now()), 1500);
    return () => window.clearInterval(id);
  }, []);

  const read = useMemo(() => deriveMining(state, now), [state, now]);
  const contract = itemById(state.mining.contract);

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
      gpuRigs: Math.min(6, gpuRigs),
      asics: Math.min(6, asics),
      shelves: Math.max(1, Math.min(3, shelves)),
      fans,
      heatRatio: read.coolingCap > 0 ? read.heatLoad / (read.coolingCap + 1) : read.heatLoad / 40,
      online: read.effectiveHash > 0,
      accent: LIGHT_HEX[state.installed.lighting ?? "light-cyan"] ?? "#38e1ff",
    };
  }, [units, read, state.installed.lighting]);

  const balance = state.mining.balances[state.mining.coin];

  return (
    <div className="space-y-3">
      <Panel label="MINING FARM — LIVE RENDER">
        <div className="h-[42vh] min-h-[260px] w-full">
          <ClientOnly fallback={<SceneFallback />}>
            <Suspense fallback={<SceneFallback />}>
              <MiningScene v={visual} quality={state.quality} />
            </Suspense>
          </ClientOnly>
        </div>
      </Panel>

      <Panel label="ASSET" className="p-3">
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
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="PRICE" value={`${Math.round(read.price).toLocaleString()} cr`} tone="amber" />
          <Stat label="BALANCE" value={balance.toFixed(6)} tone="green" />
          <Stat label="NET / HR" value={`${Math.round(read.netPerSec * 3600).toLocaleString()} cr`} tone={read.netPerSec >= 0 ? "green" : "red"} />
          <Stat label="POWER COST" value={`${(read.costPerSec * 3600).toFixed(0)} cr/hr`} tone="red" />
        </div>
        <HudButton
          tone="green"
          className="mt-3 w-full"
          disabled={balance <= 0}
          onClick={() => dispatch({ type: "sell", coin: state.mining.coin, price: read.price })}
        >
          Sell {balance.toFixed(6)} {state.mining.coin}
        </HudButton>
      </Panel>

      <Panel label="FARM TELEMETRY" className="p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="HASHRATE" value={`${read.effectiveHash.toFixed(0)} MH/s`} hint={`raw ${read.hash}`} />
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
          Contract: {contract?.name} · {contract?.mining?.pricePerKwh} cr/kWh
        </p>
      </Panel>

      <Panel label="INSTALLED UNITS" className="p-3">
        {units.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            No mining hardware. Buy shelves, rigs and cooling from the SHOP.
          </p>
        )}
        <div className="space-y-2">
          {units.map(([id, n]) => {
            const it = itemById(id);
            if (!it) return null;
            return (
              <div key={id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/40 p-2">
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
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
