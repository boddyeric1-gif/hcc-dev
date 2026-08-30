# "FIELD PROOF" v1 — CUT SPECIFICATION

New cold-acquisition ad, distinct from Claude's "Intercept." Built entirely from real captured H.C.C. gameplay in `04 — Editable Sources`, plus a brand-native end card. Nothing in this project touches production game code.

- **Concept:** prove this is a real, playable game — real UI, a real puzzle, a real evidence result — then get out.
- **Master duration:** 9.53 s (9:16) / 9.47 s (1:1, 16:9)
- **Frame rate:** 30 fps · **Codec:** H.264 (CRF 16) + AAC 160 kbps
- **Sound-off safe:** all meaning carried by on-screen UI and captions.

## Timeline (9:16 master)

| # | In → out (master) | Source clip | Source in/out | Frame content | Overlay |
| --- | --- | --- | --- | --- | --- |
| 1 | 0.00 – 1.20 | HCC_Gameplay_Boot_Sequence.mov | 3.15 – 4.35 | H.C.C wordmark + bootloader lines typing (`verifying operator signature … OK`) | none — let the real UI hook |
| 2 | 1.20 – 1.90 | HCC_Gameplay_Boot_Sequence.mov | 15.60 – 16.30 | TARGETS list: Ironexchange / Dustferry / Dustsyndicate, CRITICAL chips | `F O U R   O P E N   C A S E S` |
| 3 | 1.90 – 3.70 | HCC_Gameplay_Social_Engineering.mov | 8.60 – 10.40 | Behavioural signal readout, three dialogue options, player choice turns green, `EXCHANGE 5/5 · SUSPICION 0/3` | `T A L K   Y O U R   W A Y   I N` |
| 4 | 3.70 – 4.50 | HCC_Gameplay_Social_Engineering.mov | 12.10 – 12.90 | Case header evidence bar advancing 1/4 → 2/4 | `E V I D E N C E   F I L E D` |
| 5 | 4.50 – 7.10 | HCC_Gameplay_Cipher_Wheel.mov | 11.00 – 13.60 | Cipher wheel scrubs, ciphertext resolves to `escrow archive key ironfox relay two`, COMMIT KEY → FILE EVIDENCE | `B R E A K   T H E   C I P H E R` |
| 6 | 7.10 – 9.53 | Generated end card | — | Brand card: eyebrow, headline, CTA, disclaimer | see below |

All cuts are hard cuts. No fabricated screens, no invented UI, no simulated win state — beats 3–5 are exactly what the recordings show.

## End card (generated, `cta_card.py`)

- Canvas `#04070A`, faint 60 px grid, cyan L-brackets at all four corners, slow scanline sweep.
- Eyebrow: `H.C.C — HUNTING CYBER CRIMINALS` (muted slate, letter-spaced mono).
- Headline, typed on line by line: `YOU END THE NIGHT` (white) / `KNOWING WHO` / `THEY REALLY ARE.` (cyan) — shortened treatment of the canonical primary line.
- CTA: outlined full-width button, `PLAY H.C.C FREE`.
- Disclaimer: `Fiction. Targets, operators and payloads are invented.`

## Framing / cleanup

- 9:16: `crop=1320:2347:0:400` from the 1320 × 2868 source → scale 1080 × 1920. Removes the iOS status bar and the Telegram `Close` / mini-app header; keeps the in-app tab bar.
- 1:1 and 16:9 are **not** pillarboxed — each beat uses its own crop window into the portrait source so the UI stays legible (per-segment Y offsets in `build_1x1_16x9.sh`).
- Port Mapper footage is deliberately **unused**: it displays the live-range IP `140.74.49.40`. If a future cut needs it, mask or replace with `198.51.100.x` first.
- No real handles, wallet addresses or companies appear. In-game credit balance is visible in the console header; it is fictional in-game currency and is never framed as earnings.

## Audio (original, no third-party samples)

Synthesised in NumPy, muxed as AAC:

- Continuous low electrical bed: 52 Hz + 104 Hz sines with filtered noise, ~-26 dBFS.
- Short decaying beeps on each cut: 1200 / 880 / 760 / 1480 / 640 Hz.
- Rising 180→240 Hz swell under the cipher resolve (5.6 – 7.0 s).
- 300 Hz low impact on the end-card cut; bed fades out from 9.0 s.

No music, no voice, no copyright exposure.

## Rebuild instructions

From a shell with ffmpeg, Python 3 + Pillow/NumPy and the four raw `.mov` files available:

```bash
python3 cta_card.py 1080 1920 72 cta916   # end-card frames
bash build_9x16.sh                        # vertical master
bash build_1x1_16x9.sh                    # square + landscape
```

Audio bed generation is inline in the delivery step (see the NumPy block in this spec's Audio section; reproduced in the build notes).

## Export specs

| Cut | Dimensions | Duration | Bitrate target |
| --- | --- | --- | --- |
| 9:16 | 1080 × 1920 | 9.53 s | ~1.7 Mbps (CRF 16) |
| 1:1 | 1080 × 1080 | 9.47 s | ~1.1 Mbps |
| 16:9 | 1920 × 1080 | 9.47 s | ~1.5 Mbps |

## Known gaps / next versions

- No 6 s bumper cut yet (trim beats 2 and 4 to reach ≤6 s).
- Alternate hook test: open on beat 3 (dialogue) instead of the bootloader.
- No RIG / MINING / SHOP footage exists, so the progression fantasy is represented only by case evidence, not by rig upgrades.
