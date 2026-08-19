import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import type { LogLine } from "@/lib/hcc/types";

const TONE: Record<string, string> = {
  sys: "text-terminal-sys",
  ok: "text-terminal-ok",
  warn: "text-terminal-warn",
  bad: "text-terminal-bad",
  dim: "text-terminal-dim",
  user: "text-terminal-user",
};

export default function EventStream({ log, className }: { log: readonly LogLine[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [log.length]);

  return (
    <div ref={ref} className={cn("no-scrollbar overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed", className)}>
      {log.length === 0 && <p className="text-muted-foreground">Awaiting operator input…</p>}
      {log.map((l) => (
        <p key={l.id} className="flex gap-2">
          <span className="shrink-0 text-muted-foreground/50">{l.stamp}</span>
          <span className={cn("min-w-0 break-words", TONE[l.tone])}>{l.text}</span>
        </p>
      ))}
    </div>
  );
}
