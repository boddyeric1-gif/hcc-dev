import { useMemo, useState } from "react";

import { HudButton, Panel } from "../ui";
import { buildCipher, mulberry } from "@/lib/hcc/puzzles";
import type { OpDifficulty } from "@/lib/hcc/puzzles";
import { audio } from "@/lib/hcc/audio";
import { cn } from "@/lib/utils";
import type { Target } from "@/lib/hcc/types";

const ALPHA = "abcdefghijklmnopqrstuvwxyz";

const shiftText = (t: string, by: number) =>
  t.replace(/[a-z]/g, (ch) =>
    String.fromCharCode(((ch.charCodeAt(0) - 97 + by + 26) % 26) + 97),
  );

function WheelRing({
  radius,
  letters,
  rotation,
  activeIndex,
  tone,
}: {
  radius: number;
  letters: string;
  rotation: number;
  activeIndex: number;
  tone: "outer" | "inner";
}) {
  const cx = 50;
  const cy = 50;
  return (
    <g
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "50px 50px",
        transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={
          tone === "outer"
            ? "color-mix(in oklch, var(--hud-cyan) 35%, transparent)"
            : "color-mix(in oklch, var(--hud-green) 30%, transparent)"
        }
        strokeWidth="0.6"
      />
      {letters.split("").map((ch, i) => {
        const ang = -90 + (i / 26) * 360;
        const rad = (ang * Math.PI) / 180;
        const x = cx + Math.cos(rad) * radius;
        const y = cy + Math.sin(rad) * radius;
        const active = i === activeIndex;
        return (
          <text
            key={`${tone}-${ch}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={active ? 4.2 : 3.2}
            fontFamily="JetBrains Mono, monospace"
            fill={
              active
                ? tone === "outer"
                  ? "var(--hud-cyan)"
                  : "var(--hud-green)"
                : "color-mix(in oklch, var(--foreground) 45%, transparent)"
            }
            style={{ fontWeight: active ? 700 : 400 }}
          >
            {ch}
          </text>
        );
      })}
    </g>
  );
}

export default function Cipher({
  target,
  diff,
  seed,
  onDone,
  onFlash,
}: {
  target: Target;
  diff: OpDifficulty;
  seed: number;
  onDone: (s: boolean) => void;
  onFlash?: (f: "ok" | "fail" | null) => void;
}) {
  const { plain, key } = useMemo(
    () => buildCipher(mulberry(seed), target.operator.alias),
    [seed, target.operator.alias],
  );
  const cipher = useMemo(() => shiftText(plain, key), [plain, key]);
  const [shift, setShift] = useState(0);
  const [left, setLeft] = useState(diff.cipherAttempts);
  const [state, setState] = useState<"open" | "win" | "lose">("open");
  const preview = shiftText(cipher, -shift);

  // outer ring shows cipher alphabet; inner shows aligned plain
  const outerRot = -shift * (360 / 26);
  const innerRot = 0;

  return (
    <Panel label="CIPHER WHEEL" className="p-3">
      <p className="mb-3 text-xs text-muted-foreground">
        Rotate the substitution wheel until the intercepted archive header reads as plain language. Key is
        unique per intercept.
      </p>

      <div className="relative mx-auto mb-3 aspect-square w-full max-w-[280px]">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx="50" cy="50" r="46" fill="color-mix(in oklch, var(--card) 80%, black)" stroke="color-mix(in oklch, var(--hud-cyan) 20%, transparent)" strokeWidth="0.4" />
          <WheelRing radius={38} letters={ALPHA} rotation={outerRot} activeIndex={shift} tone="outer" />
          <WheelRing radius={26} letters={ALPHA} rotation={innerRot} activeIndex={0} tone="inner" />
          {/* read window */}
          <rect x="46" y="6" width="8" height="14" rx="1" fill="none" stroke="var(--hud-cyan)" strokeWidth="0.7" opacity="0.9" />
          <circle cx="50" cy="50" r="12" fill="color-mix(in oklch, var(--background) 90%, black)" stroke="color-mix(in oklch, var(--hud-cyan) 25%, transparent)" strokeWidth="0.5" />
          <text x="50" y="49" textAnchor="middle" dominantBaseline="middle" fontSize="5" fill="var(--hud-cyan)" fontFamily="JetBrains Mono, monospace">
            {shift}
          </text>
          <text x="50" y="56" textAnchor="middle" fontSize="2.6" fill="color-mix(in oklch, var(--foreground) 50%, transparent)">
            SHIFT
          </text>
        </svg>
        {state === "win" && (
          <div className="pointer-events-none absolute inset-0 rounded-full bg-hud-green/10 animate-soft-pulse" />
        )}
      </div>

      <div className="mb-3 rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] break-all">
        <div className="mb-1 text-[9px] tracking-[0.2em] text-muted-foreground">INTERCEPT</div>
        <div className="text-muted-foreground/70">{cipher}</div>
        <div className="mt-2 mb-1 text-[9px] tracking-[0.2em] text-muted-foreground">DECODE @ {shift}</div>
        <div className={cn(state === "win" ? "text-hud-green text-glow" : "text-hud-cyan")}>{preview}</div>
      </div>

      <input
        type="range"
        min={0}
        max={25}
        value={shift}
        disabled={state !== "open"}
        onChange={(e) => {
          setShift(Number(e.target.value));
          audio.sfx("key");
        }}
        className="mb-3 w-full accent-[var(--hud-cyan)]"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] tracking-[0.18em] text-muted-foreground">ATTEMPTS {left}</span>
        {state === "open" ? (
          <HudButton
            size="sm"
            onClick={() => {
              if (shift === key) {
                setState("win");
                onFlash?.("ok");
                audio.sfx("ok");
                return;
              }
              const rem = left - 1;
              setLeft(rem);
              audio.sfx("fail");
              if (rem <= 0) {
                setState("lose");
                onFlash?.("fail");
              }
            }}
          >
            Commit key
          </HudButton>
        ) : (
          <HudButton tone={state === "win" ? "green" : "red"} size="sm" onClick={() => onDone(state === "win")}>
            {state === "win" ? "File evidence" : "Withdraw"}
          </HudButton>
        )}
      </div>
    </Panel>
  );
}
