# CREATIVE TEST LOG

Record every paid or organic creative test here. One row per creative per platform per flight. Fill in what you have; leave unknowns blank rather than estimating.

| Date | Platform | Campaign / ad name | Creative used | Impressions | Clicks | CTR | Game opens | First target engagements | Cost | Cost per engaged player | D1 retention | D7 retention | Stars purchases | Conclusion / next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

## Field definitions

- **Platform** — TikTok, Meta, Telegram Ads, Reddit, YouTube, X, organic, etc.
- **Campaign / ad name** — exact name in the ad platform, so it reconciles with billing.
- **Creative used** — exact filename from `02 — Posters` or `03 — Video Ads`.
- **Impressions / Clicks / CTR** — from the ad platform. CTR = clicks ÷ impressions.
- **Game opens** — attributed Mini App / web opens from the admin metrics console.
- **First target engagements** — new players who started their first operation.
- **Cost** — spend for that creative in that flight, in USD.
- **Cost per engaged player** — cost ÷ first target engagements. The headline efficiency number.
- **D1 / D7 retention** — from the retention view in the admin metrics console, filtered to the attributed cohort.
- **Stars purchases** — server-confirmed purchases only. Never count client-reported ones.
- **Conclusion / next action** — kill, scale, re-cut hook, new variant, change audience.

## Attribution

Every ad must use a distinct `startapp` deep link so source, campaign and creative are locked on first touch. Record the exact parameter string alongside the ad name.

| Ad name | startapp parameter |
| --- | --- |
|  |  |

## Reading the results

- Judge creative on **cost per engaged player** and **D1 retention** together, not CTR. A cheap click that never starts an operation is not a win.
- Give a creative a minimum meaningful sample before killing it; note the threshold you used.
- Only compare creatives tested in the same window on the same platform.
- Log the losers too. The negative results are the point of this file.
