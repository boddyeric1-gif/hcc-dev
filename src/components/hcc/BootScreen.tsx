import { useEffect, useState } from "react";

import HccMark from "./HccMark";
import { useTelegram } from "@/hooks/useTelegram";
import { audio } from "@/lib/hcc/audio";
import { cn } from "@/lib/utils";

const LINES = [
  "H.C.C BOOTLOADER v5.0 — HUNTING CYBER CRIMINALS",
  "verifying operator signature ............ OK",
  "mounting encrypted evidence volume ...... OK",
  "spinning up relay chain [7 hops] ........ OK",
  "syncing task force case queue ........... READY",
  "thermal telemetry ....................... NOMINAL",
  "mining controller ....................... IDLE",
  "",
  "WARNING: everything below this line is fiction.",
  "Targets, operators and payloads are invented.",
];

const AUTH_LINES = [
  "negotiating curve25519 key exchange .....",
  "handshake accepted — session sealed",
  "spoofing biometric template ............ MATCH",
  "cross-checking task force roster ....... CLEARED",
  "granting clearance BLACKSITE / TIER-3",
];

const sanitise = (raw: string): string =>
  raw.replace(/[^a-zA-Z0-9_.-]/g, "").toUpperCase().slice(0, 18);

export default function BootScreen({ onDone }: { onDone: (handle: string) => void }) {
  const { user } = useTelegram();
  const [shown, setShown] = useState(0);
  const [stage, setStage] = useState<"boot" | "ready" | "auth">("boot");
  const [authStep, setAuthStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [useRaster, setUseRaster] = useState(true);

  const handle = sanitise(user?.username ?? user?.first_name ?? "") || "GHOSTHAND";
  const bootPct = Math.min(100, Math.round((shown / LINES.length) * 100));

  useEffect(() => {
    if (stage !== "boot") return;
    if (shown >= LINES.length) {
      setProgress(100);
      const t = window.setTimeout(() => setStage("ready"), 420);
      return () => window.clearTimeout(t);
    }
    setProgress(bootPct);
    const t = window.setTimeout(() => setShown((s) => s + 1), shown === 0 ? 280 : 140);
    return () => window.clearTimeout(t);
  }, [shown, stage, bootPct]);

  useEffect(() => {
    if (stage !== "auth") return;
    if (authStep >= AUTH_LINES.length) {
      const t = window.setTimeout(() => onDone(handle), 520);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      audio.sfx("key");
      setAuthStep((s) => s + 1);
    }, 320);
    return () => window.clearTimeout(t);
  }, [stage, authStep, handle, onDone]);

  const enter = () => {
    audio.start();
    audio.resume();
    audio.sfx("unlock");
    setStage("auth");
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#050a10] px-5">
      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-40" aria-hidden />
      <div className="pointer-events-none absolute inset-0 scanlines opacity-50" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hud-cyan/15 blur-3xl"
        aria-hidden
      />
      <div className="crt-overlay" aria-hidden />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* radar frame + mark */}
        <div className="relative mb-6 flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52">
          {/* corner brackets */}
          <span className="pointer-events-none absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-hud-cyan/70" />
          <span className="pointer-events-none absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-hud-cyan/70" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-hud-cyan/70" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-hud-cyan/70" />
          {/* crosshair ticks */}
          <span className="pointer-events-none absolute left-1/2 top-1 h-3 w-px -translate-x-1/2 bg-hud-cyan/50" />
          <span className="pointer-events-none absolute bottom-1 left-1/2 h-3 w-px -translate-x-1/2 bg-hud-cyan/50" />
          <span className="pointer-events-none absolute left-1 top-1/2 h-px w-3 -translate-y-1/2 bg-hud-cyan/50" />
          <span className="pointer-events-none absolute right-1 top-1/2 h-px w-3 -translate-y-1/2 bg-hud-cyan/50" />
          {/* soft ring */}
          <div className="pointer-events-none absolute inset-3 rounded-full border border-hud-cyan/15" />
          <div className="pointer-events-none absolute inset-6 animate-soft-pulse rounded-full border border-hud-cyan/10" />

          {useRaster ? (
            <img
              src="/hcc-mark.png"
              alt=""
              className="relative z-10 h-[72%] w-[72%] object-contain drop-shadow-[0_0_22px_rgba(56,225,255,0.45)]"
              onError={() => setUseRaster(false)}
            />
          ) : (
            <HccMark className="relative z-10 h-[72%] w-[72%]" />
          )}
        </div>

        <h1 className="font-display text-3xl tracking-[0.36em] text-hud-cyan text-glow sm:text-4xl">
          H.C.C
          <span className="sr-only"> — Hunting Cyber Criminals</span>
        </h1>
        <p className="mt-1 text-[10px] tracking-[0.42em] text-muted-foreground">HUNTING CYBER CRIMINALS</p>

        {/* progress */}
        <div className="mt-5 w-full max-w-xs">
          <div className="mb-1 flex justify-between text-[9px] tracking-[0.2em] text-muted-foreground">
            <span>{stage === "auth" ? "AUTHORISING" : stage === "ready" ? "READY" : "LOADING"}</span>
            <span className="tabular-nums text-hud-cyan">
              {stage === "auth"
                ? `${Math.min(100, Math.round((authStep / AUTH_LINES.length) * 100))}%`
                : `${progress}%`}
            </span>
          </div>
          <div className="bar-track h-1.5 w-full overflow-hidden">
            <div
              className="bar-fill h-full bg-hud-cyan transition-[width] duration-200 ease-out"
              style={{
                width: `${stage === "auth" ? Math.min(100, (authStep / AUTH_LINES.length) * 100) : progress}%`,
              }}
            />
          </div>
        </div>

        {/* terminal panel */}
        <div className="panel mt-5 min-h-[200px] w-full p-3.5 font-mono text-[10px] leading-relaxed sm:text-[11px]">
          {LINES.slice(0, shown).map((l, i) => (
            <p
              key={i}
              className={cn(
                l.startsWith("WARNING") ? "text-hud-amber" : "text-hud-green/85",
                !l && "h-3",
              )}
            >
              {l || "\u00a0"}
            </p>
          ))}

          {stage === "ready" && (
            <div className="mt-3 space-y-1 border-t border-hud-cyan/20 pt-3">
              <p className="text-hud-cyan/80">// clearance on file — no credentials required</p>
              <p className="text-hud-green">
                OPERATOR: <span className="text-hud-cyan">{handle}</span>
              </p>
            </div>
          )}

          {stage === "auth" && (
            <div className="mt-3 space-y-1 border-t border-hud-cyan/20 pt-3">
              {AUTH_LINES.slice(0, authStep).map((l, i) => (
                <p key={i} className="text-hud-cyan/85">
                  {l}
                </p>
              ))}
              {authStep >= AUTH_LINES.length && (
                <p className="text-hud-green">WELCOME, {handle}.</p>
              )}
            </div>
          )}

          {stage === "boot" && shown < LINES.length && (
            <span className="mt-1 inline-block h-3 w-2 animate-pulse bg-hud-green align-middle" />
          )}
        </div>

        <button
          type="button"
          disabled={stage !== "ready"}
          onClick={enter}
          className={cn(
            "mt-5 w-full rounded-md border py-3.5 text-[11px] tracking-[0.32em] uppercase transition-all duration-200",
            stage === "ready"
              ? "border-hud-green/55 bg-hud-green/15 text-hud-green shadow-[0_0_28px_-8px] shadow-hud-green/50 hover:bg-hud-green/25 active:scale-[0.99]"
              : "border-border/60 bg-background/40 text-muted-foreground opacity-50",
          )}
        >
          {stage === "boot" ? "Initialising…" : stage === "ready" ? "Enter console" : "Granting access…"}
        </button>

        <p className="mt-4 text-center text-[9px] tracking-[0.18em] text-muted-foreground/70">
          TASK FORCE · BLACKSITE CLEARANCE
        </p>
      </div>
    </div>
  );
}
