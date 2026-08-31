import { Chip } from "../ui";
import type { OpKind, Target, TargetProgress } from "@/lib/hcc/types";
import { cn } from "@/lib/utils";

const PIPE: { kind: OpKind; label: string }[] = [
  { kind: "ports", label: "PORTS" },
  { kind: "pretext", label: "PRETEXT" },
  { kind: "cipher", label: "CIPHER" },
  { kind: "ledger", label: "LEDGER" },
];

export default function OperationStage({
  target,
  progress,
  running,
  flash,
}: {
  target: Target;
  progress?: TargetProgress | undefined;
  running: OpKind | null;
  /** brief success/fail flash while an op resolves */
  flash?: "ok" | "fail" | null | undefined;
}) {
  const filed = new Set(progress?.evidence ?? []);

  return (
    <section
      className={cn(
        "panel relative overflow-hidden transition-shadow duration-300",
        flash === "ok" && "shadow-[0_0_40px_-8px] shadow-hud-green/50",
        flash === "fail" && "shadow-[0_0_40px_-8px] shadow-hud-red/50",
      )}
    >
      {/* scanline theater */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 scanlines"
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-300",
          flash === "ok" && "bg-hud-green/10",
          flash === "fail" && "bg-hud-red/15",
          !flash && "opacity-0",
        )}
        aria-hidden
      />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-hud-cyan/20 px-3 py-2">
        <div className="min-w-0">
          <p className="text-[9px] tracking-[0.28em] text-muted-foreground">OPERATION THEATER</p>
          <h2 className="font-display text-base tracking-[0.2em] text-hud-cyan text-glow truncate">
            {target.codename}
          </h2>
          <p className="truncate font-mono text-[10px] text-muted-foreground">{target.host}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone={target.threat === "CRITICAL" ? "red" : target.threat === "SEVERE" ? "amber" : "cyan"}>
            {target.threat}
          </Chip>
          <Chip tone="dim">SEC {target.security}</Chip>
          {running && (
            <Chip tone="cyan">
              LIVE · {PIPE.find((p) => p.kind === running)?.label ?? running.toUpperCase()}
            </Chip>
          )}
          {flash === "ok" && <Chip tone="green">FILED</Chip>}
          {flash === "fail" && <Chip tone="red">DROPPED</Chip>}
        </div>
      </header>

      {/* evidence pipeline */}
      <div className="relative z-10 flex items-center gap-1 px-3 py-3">
        {PIPE.map((node, i) => {
          const done = filed.has(node.kind);
          const active = running === node.kind;
          return (
            <div key={node.kind} className="flex min-w-0 flex-1 items-center gap-1">
              <div
                className={cn(
                  "flex h-9 w-full flex-col items-center justify-center rounded-md border text-[9px] tracking-[0.14em] transition-all duration-300",
                  done && "border-hud-green/55 bg-hud-green/15 text-hud-green",
                  active && !done && "border-hud-cyan/60 bg-hud-cyan/15 text-hud-cyan animate-soft-pulse",
                  !done && !active && "border-border/50 bg-background/40 text-muted-foreground",
                )}
              >
                <span>{node.label}</span>
                <span className="text-[8px] opacity-70">{done ? "FILED" : active ? "RUN" : "—"}</span>
              </div>
              {i < PIPE.length - 1 && (
                <div
                  className={cn(
                    "h-px w-2 shrink-0 sm:w-3",
                    done ? "bg-hud-green/50" : "bg-border/60",
                  )}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      {flash === "ok" && (
        <p className="relative z-10 border-t border-hud-green/25 px-3 py-1.5 text-center text-[10px] tracking-[0.22em] text-hud-green">
          EVIDENCE CAPTURED — CHAIN UPDATED
        </p>
      )}
      {flash === "fail" && (
        <p className="relative z-10 border-t border-hud-red/25 px-3 py-1.5 text-center text-[10px] tracking-[0.22em] text-hud-red">
          CHANNEL NOISE — OPERATION FAILED
        </p>
      )}
    </section>
  );
}
