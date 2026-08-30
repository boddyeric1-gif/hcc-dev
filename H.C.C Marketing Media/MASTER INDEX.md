# H.C.C MARKETING MEDIA — MASTER INDEX

Permanent source of truth for H.C.C. marketing and media.
Non-production workspace: nothing here affects gameplay, player data, economy, analytics, onboarding, Stars, or Telegram systems.

Last updated: 2026-08-30

## How this library works

- Original uploaded files are preserved exactly. Each asset is stored on the CDN and represented here by a `<filename>.asset.json` pointer containing its permanent URL.
- Never replace or regenerate an asset in place. New versions get new filenames with a version suffix.
- Every asset is cataloged in `02 — Posters/POSTER CATALOG.md` or `03 — Video Ads/VIDEO CATALOG.md`.

## Folders

| Folder | Contents |
| --- | --- |
| 01 — Campaign Strategy | Positioning, messaging, CTA, creative concepts, channel plan |
| 02 — Posters | Static poster creative + full catalog metadata |
| 03 — Video Ads | Video creative + full catalog metadata |
| 04 — Editable Sources | Project files, build scripts, raw gameplay footage, cut specifications |
| 05 — Brand System | Visual/verbal brand rules for all future marketing |
| 06 — Performance | Creative test log and results |

## Available assets

### Posters

| Filename | Role | Ratio | Description |
| --- | --- | --- | --- |
| HCC_Poster1_TheReveal_1080x1920.png | Poster 1 — The Hook / The Reveal | 9:16 | Session log payoff: four operations closed, identity confirmed. Primary top-of-funnel hook. |
| HCC_Poster2_TheClimb_1080x1920.png | Poster 2 — The Progression / The Climb | 9:16 | Rank ladder Script Kiddie → Phantom. Progression/aspiration angle. |
| HCC_Poster2_TheClimb_1080x1350.png | Poster 2 — The Progression / The Climb | 4:5 | Feed-optimized crop of The Climb. |
| HCC_Poster3_TheOpenCase_1080x1920.png | Poster 3 — The Target / The Open Case | 9:16 | Open case file, 2/4 operations logged. Curiosity/unfinished-business angle. |
| HCC_Poster3_TheOpenCase_1080x1350.png | Poster 3 — The Target / The Open Case | 4:5 | Feed-optimized crop of The Open Case. |

Note: no 1080×1350 crop of Poster 1 has been provided yet. Do not fabricate one.

### Video ads — "Intercept." (8s)

| Filename | Ratio | Dimensions | Description |
| --- | --- | --- | --- |
| HCC_Ad_Intercept_9x16_1080x1920.MP4 | 9:16 | 1080×1920 | Vertical primary cut for Stories/Reels/TikTok/Telegram. |
| HCC_Ad_Intercept_1x1_1080x1080.MP4 | 1:1 | 1080×1080 | Square feed cut. |
| HCC_Ad_Intercept_16x9_1920x1080.mp4 | 16:9 | 1920×1080 | Landscape cut for YouTube/in-stream/desktop placements. |

### Video ads — "Field Proof" (9.5s, in-house, real gameplay)

| Filename | Ratio | Dimensions | Description |
| --- | --- | --- | --- |
| HCC_Ad_FieldProof_9x16_1080x1920.mp4 | 9:16 | 1080×1920 | Primary cold-acquisition cut: boot hook → open cases → social-engineering choice → evidence filed → cipher resolved → CTA. All real captured UI. |
| HCC_Ad_FieldProof_1x1_1080x1080.mp4 | 1:1 | 1080×1080 | Square feed adaptation, reframed per beat. |
| HCC_Ad_FieldProof_16x9_1920x1080.mp4 | 16:9 | 1920×1080 | Landscape adaptation for YouTube/desktop. |

Timeline, overlays, audio plan and export specs: `04 — Editable Sources/FieldProof v1 Project/CUT SPECIFICATION.md`.

### Editable sources — raw gameplay footage

Unedited Telegram Mini App screen captures, 1320×2868 portrait, recorded 2026-08-30. Full details in `04 — Editable Sources/RAW FOOTAGE CATALOG.md`.

| Filename | Duration | Content |
| --- | --- | --- |
| HCC_Gameplay_Boot_Sequence.mov | 21.2 s | Bootloader cold open — wordmark, signature verify, initialising. |
| HCC_Gameplay_Cipher_Wheel.mov | 29.7 s | CIPHER WHEEL operation against Ironexchange. |
| HCC_Gameplay_Social_Engineering.mov | 25.4 s | SOCIAL ENGINEERING dialogue exchange, suspicion track. |
| HCC_Gameplay_Port_Mapper.mov | 32.7 s | PORT MAPPER signal-strength probe grid. |

### Editable sources — project files

| File | Purpose |
| --- | --- |
| FieldProof v1 Project/CUT SPECIFICATION.md | Full timeline, source timestamps, overlays, audio plan, export specs |
| FieldProof v1 Project/build_9x16.sh | Rebuilds the vertical master from the raw captures |
| FieldProof v1 Project/build_1x1_16x9.sh | Rebuilds the square and landscape adaptations |
| FieldProof v1 Project/cta_card.py | Generates the brand end-card frame sequence |

No layered poster project files provided yet.

## Campaign positioning (canonical copy)

- Primary: **"You start as nobody. You end the night knowing who they really are."**
- Secondary: **"Build the operation. Run the hunt. Own the night."**
- CTA: **"PLAY H.C.C FREE"**
- Legal line: *Fiction. Targets, operators and payloads are invented.*
