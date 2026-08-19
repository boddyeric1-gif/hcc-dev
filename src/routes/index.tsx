import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { Terminal } from "@/components/hcc/Terminal";
import { Dossier } from "@/components/hcc/Dossier";
import { StatusBar } from "@/components/hcc/StatusBar";
import { appendLog, initialState, runCommand } from "@/lib/hcc/engine";
import type { GameState } from "@/lib/hcc/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "H.C.C — Hunting Cyber Criminals" },
      {
        name: "description",
        content:
          "A terminal hacking sim: map dark web servers, breach their services, dox the operators, and hand the dossiers to the police.",
      },
      { property: "og:title", content: "H.C.C — Hunting Cyber Criminals" },
      {
        property: "og:description",
        content:
          "Take down dark web servers one command at a time. Breach, gather evidence, unmask the operator, keep your trace heat down.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

const BOOT = [
  { text: "H.C.C // HUNTING CYBER CRIMINALS", tone: "sys" as const },
  { text: "relay established · identity scrubbed · you are not here", tone: "dim" as const },
  { text: "", tone: "dim" as const },
  {
    text: "Four rooms are still open on the network. Map them, breach them,",
    tone: "dim" as const,
  },
  { text: "put a real name to every alias, then hand it all to the police.", tone: "dim" as const },
  { text: "", tone: "dim" as const },
  { text: "Type 'help' to begin. Type 'targets' to see who's out there.", tone: "sys" as const },
];

function Game() {
  const [state, setState] = useState<GameState>(() => appendLog(initialState(), BOOT));

  const run = useCallback((cmd: string) => {
    setState((s) => runCommand(s, cmd));
  }, []);

  useEffect(() => {
    if (state.selected === null) setState((s) => ({ ...s, selected: "hollowmarket" }));
  }, [state.selected]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-14">
      <header className="mb-6">
        <h1 className="font-display text-4xl leading-none text-foreground sm:text-5xl">
          H.C.C
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
          hunting cyber criminals
        </p>
      </header>

      <div className="space-y-4 lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-4 lg:space-y-0">
        <div className="space-y-4">
          <StatusBar state={state} />
          <Terminal state={state} onCommand={run} />
        </div>
        <Dossier
          state={state}
          onSelect={(id) => setState((s) => ({ ...s, selected: id }))}
          onCommand={run}
        />
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        Fiction. Every host, alias, and person here is invented.
      </p>
    </main>
  );
}
