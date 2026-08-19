import type { GameState } from "@/lib/hcc/types";

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
    <span className="text-sm text-foreground">{value}</span>
  </div>
);

export function StatusBar({ state }: { state: GameState }) {
  const heat = Math.min(100, state.heat);
  const tone =
    heat > 70 ? "bg-terminal-bad" : heat > 40 ? "bg-terminal-warn" : "bg-terminal-ok";

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="grid grid-cols-4 gap-3">
        <Stat label="rep" value={String(state.rep)} />
        <Stat label="credits" value={`${state.credits}`} />
        <Stat label="cracker" value={`v${state.upgrades.cracker}`} />
        <Stat label="scrubbers" value={String(state.upgrades.scrubbers)} />
      </div>
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            trace heat
          </span>
          <span className="text-xs text-muted-foreground">{heat}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${tone}`}
            style={{ width: `${heat}%` }}
          />
        </div>
      </div>
    </section>
  );
}
