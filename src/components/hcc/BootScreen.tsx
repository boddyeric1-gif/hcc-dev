import { useEffect, useState } from "react";

const LINES = [
  "H.C.C BOOTLOADER v4.11 — HUNTING CYBER CRIMINALS",
  "verifying operator signature ............ OK",
  "mounting encrypted evidence volume ...... OK",
  "spinning up relay chain [7 hops] ........ OK",
  "syncing task force case queue ........... 4 ACTIVE",
  "thermal telemetry ....................... NOMINAL",
  "mining controller ....................... IDLE",
  "",
  "WARNING: everything below this line is fiction.",
  "Targets, operators and payloads are invented.",
];

export default function BootScreen({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= LINES.length) return;
    const t = window.setTimeout(() => setShown((s) => s + 1), shown === 0 ? 260 : 170);
    return () => window.clearTimeout(t);
  }, [shown]);

  const ready = shown >= LINES.length;

  return (
    <div className="hud-grid relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-hud-cyan/10 blur-2xl animate-sweep" />
      <div className="w-full max-w-lg">
        <h1 className="font-display text-5xl tracking-[0.3em] text-hud-cyan text-glow animate-flicker">H.C.C</h1>
        <p className="mt-1 mb-6 text-[10px] tracking-[0.42em] text-muted-foreground">HUNTING CYBER CRIMINALS</p>
        <div className="panel min-h-[220px] p-4 font-mono text-[11px] leading-relaxed">
          {LINES.slice(0, shown).map((l, i) => (
            <p key={i} className={l.startsWith("WARNING") ? "text-hud-amber" : "text-hud-green/85"}>
              {l || "\u00a0"}
            </p>
          ))}
          {!ready && <span className="inline-block h-3 w-2 animate-pulse bg-hud-green align-middle" />}
        </div>
        <button
          type="button"
          disabled={!ready}
          onClick={onDone}
          className="mt-6 w-full rounded-md border border-hud-green/50 bg-hud-green/10 py-3 text-[11px] tracking-[0.3em] text-hud-green uppercase transition-all hover:bg-hud-green/20 disabled:opacity-30 glow-cyan"
        >
          {ready ? "Enter console" : "Initialising…"}
        </button>
      </div>
    </div>
  );
}
