# H.C.C — Visual, Market, Audio and Login Upgrade

Four upgrades to the existing console: brighter and richer 3D, a deeper mining market, a full sound layer, and a hacker-style operator login.

## 1. Brighter, higher-fidelity 3D

Both scenes (RIG desk, MINING farm) currently render dark because lighting is tuned for a night environment with strong vignette.

- Raise exposure: ACES Filmic tone mapping with a tuned exposure value, plus a lifted ambient/hemisphere light and a brighter environment intensity so surfaces read clearly.
- Add a per-scene BRIGHTNESS slider in the RIG and MINING panels (persisted with the save) so the room can be lit to taste on any display.
- Post-processing stack (quality-gated): stronger selective Bloom, SSAO for contact darkening, subtle depth-of-field off by default, softened Vignette, and film-grain-free clean output.
- Volumetric feel: layered fog plus soft light shafts from the ceiling/rack lights instead of flat fog.
- Reflections: screen-space-style reflective floor with roughness/metalness tuning, higher-resolution contact shadows, and better PBR values on metal panels and glass.
- Quality presets stay: Performance drops SSAO/volumetrics, Balanced keeps bloom + SSAO, Ultra runs everything.

## 2. Deeper mining market

Extend the coin model beyond price drift:

- Per-coin difficulty that rises as network hashrate grows and slowly retargets over time, cutting yield per MH/s.
- Volatility regimes: calm, trending and spike states that drive realistic price movement per coin (GHST wildest, BTC steadiest).
- Order book spread: separate bid/ask, so selling takes a spread hit; larger sells slip further.
- Contract rules: power contracts gain tier rates, peak/off-peak pricing windows, capacity overage penalties and an early-switch fee — so contract choice actually changes profitability.
- New MINING panel readouts: difficulty, 24h change, spread, break-even price, projected daily net, and a simple price history sparkline.
- Upgrades matter more: efficiency (W per MH), cooling headroom and contract terms all feed the net figure, with a clear "what's limiting you" line.

## 3. Sound and music

- Ambient rig hum, fan whirr and coil whine layered by number of running units, with intensity tied to load and heat.
- UI SFX: tab switches, purchases, terminal keystrokes, alerts, successful ops, and a heat-warning tone.
- Background music: crisp sci-fi ambient loop, ducked while alerts play.
- All audio generated with the Web Audio API (synth-based drones, filtered noise fans, arpeggiated pads) so nothing depends on external files or licensing.
- Mute and separate music/SFX volume controls in the header, saved with the game.

## 4. Operator login sequence

Replaces the current single "Enter console" button:

- Boot lines run, then a credential prompt: OPERATOR HANDLE and PASSKEY, typed into a terminal-style field with a blinking caret and per-character clatter.
- Passkey masked as glyphs; an authentication animation shows key exchange, biometric spoof and clearance grant lines before unlocking.
- The handle personalises the app: header callsign, log lines addressed to the operator, and case files signed with it.
- Stored locally with the save; a "switch operator" action in the CASE tab returns to the login screen. No accounts or backend — this is flavour, not authentication.

## Technical notes

- New: `src/lib/hcc/audio.ts` (Web Audio engine + React hook), `src/lib/hcc/market.ts` (difficulty, volatility, spread, contract rules).
- Updated: `SceneFrame.tsx` (tone mapping, SSAO, volumetrics, brightness), `RigScene.tsx` / `MiningScene.tsx` (lighting and materials), `MiningTab.tsx` (market UI), `BootScreen.tsx` (login), `state.ts` / `types.ts` (operator, audio and brightness settings), `catalog.ts` (contract terms).
- Audio starts only after the login click, satisfying browser autoplay rules.
