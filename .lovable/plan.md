# H.C.C — Rebuild to match the console UI from your video

The current build is a single terminal page. The version in the video is a full
mobile console app: boot screen, stat header, bottom tab navigation, target
list, interactive field tools (mini-games), a case file, and a persistent event
stream. This plan rebuilds it to that shape and pushes past it.

## Structure

```text
BOOT SCREEN  ->  CONSOLE
  H.C.C framed logo         ┌ header: HCC badge / ONLINE pill / target lock
  "CONSOLE OFFLINE"         │ tab content (scrolls)
  INITIATE MACHINE          ├ encrypted event stream (collapsible)
                            └ tabs: COMMAND TARGETS TOOLS CASE FILE EXPORT
```

## Screens

**Boot** — dormant framed logo, CONSOLE OFFLINE, INITIATE MACHINE button with a
decrypt sequence that types into the event stream before the console unlocks.

**COMMAND** — big INTEL score counter (animated count-up), operator rank
(GHOST I -> V), three stat cards (live targets / evidence % / takedowns),
mission brief, live network telemetry sparkline, SELECT A TARGET button and a
power toggle.

**TARGETS** — four fictional darknet nodes (SilkBazaar SB-17, ViperRansom VR-04,
DeepDox DD-66, ShadowBroker SH-12) each with node IP, threat level, security %,
allegation line, and an evidence-integrity progress bar. SELECT locks the target.

**TOOLS** — field toolkit list; each tool expands into a focused operation panel
with ABORT / BEGIN, and dims the rest of the screen:
- Network Infiltration — port-mapper mini-game: pick live ports out of a
  scanning grid, each hit injects a trace beacon (+integrity).
- Social Engineering — pick the safest pretext from three options; wrong choice
  raises trace heat instead of evidence.
- Brute Force Decryption — rapid-tap cipher wheel against a timer.
- Access Ledger Correlation (new) — match wallet transactions to timestamps.
Each success raises evidence integrity and writes lines to the event stream.

**CASE FILE** — allegation, simulated node, status, and four VERIFIED evidence
chips that fill in as tools succeed. At 100% the package compiles and the
seizure resolves.

**EXPORT** — formatted evidence package plus a live JSON manifest of run state,
matching the manifest view in the video.

## Beyond the video

- Trace heat meter with counter-intrusion consequences (keeps the existing risk
  loop, surfaced in the header).
- Rank progression and per-case bounties feeding the INTEL score.
- Persistent run state in localStorage so progress survives a refresh.
- Keyboard/desktop layout: two columns on wide screens, tabs become a sidebar.
- Reduced-motion respect on the scanline, telemetry, and typing effects.

## Technical notes

- Stays fully client-side, no backend. One reducer in `src/lib/hcc/` holds
  state (phase, targets, evidence, log, heat, rank, score); components stay
  presentational.
- Existing terminal command engine is kept as the COMMAND tab's optional shell
  so typed commands still work alongside the touch UI.
- New tokens in `src/styles.css`: darker chrome panels, cyan primary, crimson
  alert, green verified, panel grid/scanline textures, mono display face —
  no hardcoded colors in components.
- Mini-games are separate components under `src/components/hcc/tools/`, each
  reporting a single `onComplete(result)` to the reducer.
- Vitest coverage for the reducer: evidence accumulation, heat penalties, rank
  thresholds, case completion.
