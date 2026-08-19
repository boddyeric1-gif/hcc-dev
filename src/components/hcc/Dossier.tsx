import { TARGETS } from "@/lib/hcc/targets";
import { progressOf } from "@/lib/hcc/engine";
import type { GameState } from "@/lib/hcc/types";

export function Dossier({
  state,
  onSelect,
  onCommand,
}: {
  state: GameState;
  onSelect: (id: string) => void;
  onCommand: (cmd: string) => void;
}) {
  const target = TARGETS.find((t) => t.id === state.selected) ?? TARGETS[0];
  if (!target) return null;
  const p = progressOf(state, target.id);

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex gap-1 overflow-x-auto border-b border-border p-2">
        {TARGETS.map((t) => {
          const tp = progressOf(state, t.id);
          const active = t.id === target.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tp.seized ? "✓ " : ""}
              {t.codename}
            </button>
          );
        })}
      </div>

      <div className="space-y-4 p-4">
        <header>
          <h2 className="font-display text-2xl leading-tight text-foreground">{target.codename}</h2>
          <p className="text-xs text-muted-foreground">
            {target.host} · tier {target.tier} · {target.crime}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">{target.brief}</p>
        </header>

        <div>
          <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            services
          </h3>
          <ul className="mt-2 space-y-2">
            {target.ports.map((port) => {
              const cracked = p.cracked.includes(port.id);
              if (!p.scanned)
                return (
                  <li key={port.id} className="text-sm text-muted-foreground">
                    :?????? <span className="text-terminal-dim">unmapped</span>
                  </li>
                );
              return (
                <li key={port.id} className="text-sm">
                  <button
                    type="button"
                    disabled={cracked || p.seized}
                    onClick={() => onCommand(`crack ${target.id} ${port.id}`)}
                    className="w-full rounded-md border border-border px-3 py-2 text-left transition-colors hover:border-primary/60 disabled:opacity-60 disabled:hover:border-border"
                  >
                    <span className="text-primary">:{port.id}</span>{" "}
                    <span className="text-foreground/80">{port.service}</span>
                    <span className="block text-xs text-muted-foreground">
                      {cracked ? port.evidence : "sealed — tap to breach"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            operator
          </h3>
          {p.doxed ? (
            <p className="mt-2 text-sm leading-relaxed">
              <span className="text-terminal-ok">{target.operator.realName}</span>
              <span className="text-muted-foreground">
                {" "}
                — {target.operator.location}. {target.operator.note}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              alias {target.operator.alias} · identity withheld until the evidence chain is complete
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Action label="scan" onClick={() => onCommand(`scan ${target.id}`)} disabled={p.scanned} />
          <Action
            label="dox"
            onClick={() => onCommand(`dox ${target.id}`)}
            disabled={p.doxed || p.cracked.length < target.ports.length}
          />
          <Action
            label="report"
            onClick={() => onCommand(`report ${target.id}`)}
            disabled={!p.doxed || p.seized}
          />
        </div>
      </div>
    </section>
  );
}

function Action({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-primary/40 px-4 py-2 text-xs uppercase tracking-[0.14em] text-primary transition-colors hover:bg-primary/10 disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
    >
      {label}
    </button>
  );
}
