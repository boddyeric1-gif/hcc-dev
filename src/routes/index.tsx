import { createFileRoute } from "@tanstack/react-router";

import ConsoleShell, { RESERVED_START_PARAMS } from "@/components/hcc/ConsoleShell";
import { AnalyticsProvider } from "@/lib/analytics/useAnalytics";
import { GameProvider } from "@/lib/hcc/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "H.C.C — Hunting Cyber Criminals | Spy Hacking Sim" },
      {
        name: "description",
        content:
          "Take down fictional dark web servers, build a 3D hacker rig, run a crypto mining farm and close cases in H.C.C.",
      },
      { property: "og:title", content: "H.C.C — Hunting Cyber Criminals" },
      {
        property: "og:description",
        content:
          "A cyberpunk hacking simulation: map ports, break ciphers, expose operators and upgrade your 3D rig and mining farm.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <AnalyticsProvider reservedStartParams={RESERVED_START_PARAMS}>
      <GameProvider>
        <ConsoleShell />
      </GameProvider>
    </AnalyticsProvider>
  );
}
