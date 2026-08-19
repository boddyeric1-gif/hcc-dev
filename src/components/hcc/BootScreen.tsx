import { useEffect, useRef, useState } from "react";

import { audio } from "@/lib/hcc/audio";

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

const AUTH_LINES = [
  "negotiating curve25519 key exchange .....",
  "handshake accepted — session sealed",
  "spoofing biometric template ............ MATCH",
  "cross-checking task force roster ....... CLEARED",
  "granting clearance BLACKSITE / TIER-3",
];

export default function BootScreen({ onDone }: { onDone: (handle: string) => void }) {
  const [shown, setShown] = useState(0);
  const [stage, setStage] = useState<"boot" | "creds" | "auth">("boot");
  const [handle, setHandle] = useState("");
  const [passkey, setPasskey] = useState("");
  const [authStep, setAuthStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const handleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stage !== "boot") return;
    if (shown >= LINES.length) {
      const t = window.setTimeout(() => setStage("creds"), 420);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setShown((s) => s + 1), shown === 0 ? 260 : 150);
    return () => window.clearTimeout(t);
  }, [shown, stage]);

  useEffect(() => {
    if (stage === "creds") handleRef.current?.focus();
  }, [stage]);

  useEffect(() => {
    if (stage !== "auth") return;
    if (authStep >= AUTH_LINES.length) {
      const t = window.setTimeout(() => onDone(handle.trim().toUpperCase()), 520);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      audio.sfx("key");
      setAuthStep((s) => s + 1);
    }, 340);
    return () => window.clearTimeout(t);
  }, [stage, authStep, handle, onDone]);

  const submit = () => {
    const h = handle.trim();
    if (h.length < 3) {
      setError("Handle must be at least 3 characters.");
      audio.sfx("fail");
      return;
    }
    if (passkey.length < 4) {
      setError("Passkey must be at least 4 characters.");
      audio.sfx("fail");
      return;
    }
    setError(null);
    audio.start();
    audio.resume();
    audio.sfx("unlock");
    setStage("auth");
  };

  const glyphs = "▚▞▜▙▟▛◆◇▲▼".split("");
  const masked = passkey
    .split("")
    .map((_, i) => glyphs[(i * 7 + passkey.length) % glyphs.length])
    .join("");

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

          {stage === "creds" && (
            <div className="mt-4 space-y-2 border-t border-hud-cyan/20 pt-3">
              <p className="text-hud-cyan/80">// operator credentials required</p>
              <label className="flex items-center gap-2">
                <span className="w-[86px] shrink-0 text-muted-foreground">HANDLE:</span>
                <span className="text-hud-green">&gt;</span>
                <input
                  ref={handleRef}
                  value={handle}
                  maxLength={18}
                  onChange={(e) => {
                    setHandle(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, "").toUpperCase());
                    audio.sfx("key");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="GHOSTHAND"
                  className="w-full bg-transparent text-hud-green caret-hud-green outline-none placeholder:text-hud-green/25"
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="w-[86px] shrink-0 text-muted-foreground">PASSKEY:</span>
                <span className="text-hud-green">&gt;</span>
                <div className="relative w-full">
                  <input
                    value={passkey}
                    maxLength={32}
                    type="password"
                    onChange={(e) => {
                      setPasskey(e.target.value);
                      audio.sfx("key");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    className="w-full bg-transparent text-transparent caret-hud-green outline-none"
                    autoComplete="off"
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center tracking-[0.2em] text-hud-cyan">
                    {masked || <span className="text-hud-green/25">••••••••</span>}
                  </span>
                </div>
              </label>
              {error && <p className="text-hud-red">{error}</p>}
              <p className="text-[10px] text-muted-foreground">
                Local flavour only — nothing is transmitted and there is no account.
              </p>
            </div>
          )}

          {stage === "auth" && (
            <div className="mt-4 space-y-1 border-t border-hud-cyan/20 pt-3">
              {AUTH_LINES.slice(0, authStep).map((l, i) => (
                <p key={i} className="text-hud-cyan/85">
                  {l}
                </p>
              ))}
              {authStep >= AUTH_LINES.length && (
                <p className="text-hud-green">WELCOME, {handle.trim().toUpperCase()}.</p>
              )}
            </div>
          )}

          {stage === "boot" && shown < LINES.length && (
            <span className="inline-block h-3 w-2 animate-pulse bg-hud-green align-middle" />
          )}
        </div>

        <button
          type="button"
          disabled={stage !== "creds"}
          onClick={submit}
          className="mt-6 w-full rounded-md border border-hud-green/50 bg-hud-green/10 py-3 text-[11px] tracking-[0.3em] text-hud-green uppercase transition-all hover:bg-hud-green/20 disabled:opacity-30 glow-cyan"
        >
          {stage === "boot" ? "Initialising…" : stage === "creds" ? "Authenticate" : "Granting access…"}
        </button>
      </div>
    </div>
  );
}
