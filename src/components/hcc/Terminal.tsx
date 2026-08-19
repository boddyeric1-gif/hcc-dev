import { useEffect, useRef, useState } from "react";
import type { GameState, LogLine } from "@/lib/hcc/types";

const TONE: Record<LogLine["tone"], string> = {
  sys: "text-terminal-sys",
  ok: "text-terminal-ok",
  warn: "text-terminal-warn",
  bad: "text-terminal-bad",
  user: "text-terminal-user",
  dim: "text-terminal-dim",
};

export function Terminal({
  state,
  onCommand,
}: {
  state: GameState;
  onCommand: (cmd: string) => void;
}) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [state.log]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = value.trim();
    if (!cmd) return;
    setHistory((h) => [...h, cmd]);
    setCursor(null);
    setValue("");
    onCommand(cmd);
  };

  const recall = (dir: -1 | 1) => {
    if (history.length === 0) return;
    const next =
      cursor === null
        ? dir === -1
          ? history.length - 1
          : null
        : Math.min(history.length - 1, Math.max(0, cursor + dir));
    setCursor(next);
    setValue(next === null ? "" : (history[next] ?? ""));
  };

  return (
    <section className="flex min-h-[26rem] flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          relay shell
        </span>
        <span className="text-[10px] text-muted-foreground">tor · 7 hops</span>
      </div>
      <div className="scanlines flex-1 space-y-1 overflow-y-auto px-4 py-3 text-[13px] leading-relaxed">
        {state.log.map((line) => (
          <pre key={line.id} className={`whitespace-pre-wrap font-mono ${TONE[line.tone]}`}>
            {line.text}
          </pre>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border px-4 py-3">
        <span className="text-primary">hcc&gt;</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              recall(-1);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              recall(1);
            }
          }}
          spellCheck={false}
          autoComplete="off"
          aria-label="terminal command"
          placeholder="type help"
          className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </form>
    </section>
  );
}
