# H.C.C — Console rebuild + Rig, Shop, and Mining Rig

Rebuilds the game to match (and go past) the console UI from your video, then
adds the three new systems: a 3D hacker setup that visibly evolves, a shop that
sells every upgrade, and a dedicated crypto mining rig.

## Shell

```text
BOOT  ->  CONSOLE
  H.C.C framed logo        ┌ header: HCC badge / ONLINE pill / credits / heat
  CONSOLE OFFLINE          │ tab content (scrolls)
  INITIATE MACHINE         ├ encrypted event stream (collapsible)
                           └ tabs: COMMAND · TARGETS · TOOLS · RIG · MINING ·
                                   SHOP · CASE FILE
```

## Existing tabs (from the video, rebuilt)

**Boot** — dormant framed logo, CONSOLE OFFLINE, INITIATE MACHINE with a decrypt
sequence typing into the event stream before the console unlocks.

**COMMAND** — animated INTEL counter, operator rank (GHOST I→V), stat cards
(live targets / evidence % / takedowns), mission brief, live telemetry
sparkline, target-lock button.

**TARGETS** — SilkBazaar SB-17, ViperRansom VR-04, DeepDox DD-66, ShadowBroker
SH-12: node IP, threat, security %, allegation, evidence-integrity bar.

**TOOLS** — field toolkit; each tool opens a focused operation panel with
ABORT / BEGIN: Network Infiltration (port mapper), Social Engineering (pretext
choice), Brute Force Decryption (rapid-tap cipher), Access Ledger Correlation.
Success raises evidence integrity; failure raises trace heat.

**CASE FILE** — allegation, node, status, four VERIFIED evidence chips, package
compile and seizure at 100%.

## New: RIG

A real-time 3D view of your desk, rendered with React Three Fiber. Camera orbits
a dark apartment setup: desk, monitors, tower, keyboard, router, ambient
neon. Every purchase changes the scene — extra monitors mount, the tower gains
a windowed side panel and lit fans, cable runs and RGB spill appear, the desk
upgrades from particle board to steel. Tapping a component opens its spec card
(model, tier, what it boosts) and a shortcut to its shop entry.

Stats derived from installed hardware: crack success, heat dissipation, scan
speed, hash rate. Cosmetic slots too — case lighting color, deskmat, poster,
figurine, monitor wallpaper.

## New: SHOP (grey market)

Categorised storefront with credits balance, tier gating by rank, and owned /
installed states:
- **Rig hardware** — CPU, GPU, RAM, storage, cooling, PSU, monitors, chair, desk
- **Field tools** — better cracker, proxy layers, scrubbers, new tool unlocks
- **Perks** — passive traits (slower heat, higher bounty, faster mining)
- **Mining parts** — ASICs, GPU rigs, shelving, PSUs, fans, power contracts
- **Customization** — lighting, wallpapers, case skins, room decor

Each item card shows a 3D preview, the exact stat delta, and BUY / INSTALL.

## New: MINING RIG

A second 3D room: shelving racks you physically populate with purchased
hardware. Choose the asset mined (BTC / ETH / a fictional privacy coin) with
different rates and volatility, manage power draw against your electricity
contract, and manage heat — overheated cards throttle, then fail. Fans, AC
units, and airflow layout are purchasable fixes. Mining accrues while you run
field ops, so the two loops feed each other: mined coin buys hardware, hardware
makes takedowns easier.

## Visual direction

Cyberpunk × Matrix crossed with the grounded, photographic look of Crypto Mining
Simulator: physically based materials (brushed aluminium, smoked glass, matte
plastic), HDRI-lit interiors, bloom on emissives, volumetric-feeling haze,
shallow depth of field, screen-space reflections on the desk. Not low-poly, not
voxel. Colour palette stays cyan / crimson / verified-green on near-black.

## Technical notes

- 3D uses React Three Fiber + drei, with `@react-three/postprocessing` for
  bloom, SSAO, DOF, and vignette. Scenes are client-only (dynamic import behind
  a hydration gate) so SSR isn't broken.
- High-detail hardware is authored as GLB assets with PBR textures, hosted via
  Lovable Assets on the CDN and lazy-loaded per scene with Draco/KTX2
  compression. Where a specific licensed model isn't available, the part is
  built from high-density parametric geometry with real PBR maps rather than
  substituting a low-poly stand-in.
- Performance budget: instanced GPUs/fans, texture atlases, adaptive DPR, and a
  quality toggle (Ultra / Balanced / Performance) since this must stay smooth on
  your phone.
- Game state is one typed reducer in `src/lib/hcc/` (phase, targets, evidence,
  heat, credits, inventory, installed rig, mining state, log). Components are
  presentational. Progress persists to localStorage; a save-to-account option
  can be added later with Lovable Cloud if you want cross-device saves.
- Mining accrual is computed from elapsed time on load, not a ticking loop, so
  it stays correct across refreshes.
- Vitest covers the economy: hash-rate math, power/heat curves, offline accrual,
  purchase validation, rank thresholds.

## Sequencing

1. Console shell, boot, COMMAND / TARGETS / TOOLS / CASE FILE with the new visual
   system and event stream.
2. Economy + SHOP + inventory/install model.
3. RIG 3D scene wired to installed hardware.
4. MINING RIG 3D scene, coin selection, power and heat simulation.
