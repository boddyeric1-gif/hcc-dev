# H.C.C. — Growth & Analytics Foundation (Audit + Plan)

## A. Current analytics capabilities

None. A full search across the codebase found no analytics, telemetry, event, session, referral, or campaign code. The only tracking-adjacent thing that exists is `src/lib/lovable-error-reporting.ts`, which reports editor/runtime errors — not product analytics.

`start_param` is read in one place (`src/components/hcc/ConsoleShell.tsx:49`), used only to pick a tab, then discarded. It is never sent to the server or stored, so today no acquisition source is recorded anywhere.

## B. Existing systems worth reusing (do not duplicate)

- **Verified identity**: `authenticateInitData(initData)` (`src/lib/telegram/stars.server.ts`) HMAC-verifies Telegram initData and returns the numeric Telegram user id. Every player-facing server function already requires it. Analytics uses the same gate — no second identity.
- **Server function pattern**: `createServerFn().inputValidator().handler()` in `src/lib/hcc/wallet.functions.ts` / `src/lib/telegram/stars.functions.ts`.
- **Single client write path**: `send()` in `src/lib/hcc/store.tsx` already switches on every gameplay action type (`buy`, `report`, `sell`, `scrub`, `mining-contract`, `prestige`, `tab`, `engage`, `op`, …). One interception point covers most of the event taxonomy — no scattered writes in UI files.
- **Authoritative payment records**: `star_purchases` table (+ `premium_pass`, `hcc_ledger`) already store every Stars charge, product, stars amount, kind, and claim time. Revenue metrics are derived from these, never from client events.
- **Profile row**: `hcc_profile` already exists per Telegram user (prestige, owned, installed, miner units, contract). Extend rather than create a parallel profile.

## C. Missing capabilities

Sessions, events, attribution/campaign capture, retention math, progression milestones, version/build id (package.json has no `version` field and no build id is injected anywhere), and any way to inspect metrics.

## D. Recommended architecture

```text
client                          server                         database
------                          ------                         --------
useAnalytics()  --batch(5s)-->  recordEvents (serverFn)  -->   hcc_event
 queue in memory                 verifies initData             hcc_session
 fire-and-forget                 clamps/whitelists names       hcc_player (extends profile idea)
                                 never touches ledger
telegram webhook  ------------>  server-side purchase events (authoritative)
```

Rules baked in: analytics calls are `void`-ed and wrapped in try/catch, never awaited in a gameplay path; a failed flush drops the batch after one retry; the event server function has **no** access to ledger mutation helpers; unknown event names are rejected server-side against a fixed taxonomy.

## E. Database changes (one migration, additive only)

- `hcc_player` — `telegram_user_id` PK, `first_seen_at`, `last_seen_at`, `total_sessions`, `acquisition_source`, `acquisition_campaign`, `acquisition_creative`, `acquisition_at`, `referred_by_player_id` (nullable, no rewards yet), `platform`, `first_purchase_at`, `last_purchase_at`, `total_stars_spent`, plus cached progression (`rank_index`, `prestige`, `rig_tier`, `miner_tier`, `op_slots`). Attribution columns are written **only when currently null** (first-touch, enforced in SQL).
- `hcc_session` — `id`, `telegram_user_id`, `started_at`, `ended_at`, `platform`, `app_version`, `source`.
- `hcc_event` — `id`, `telegram_user_id` (nullable for anonymous), `session_id`, `name`, `props jsonb`, `platform`, `app_version`, `created_at`; indexes on `(telegram_user_id, created_at)` and `(name, created_at)`.
- `hcc_progression_milestone` — `(telegram_user_id, milestone)` unique, `reached_at`. Makes "first time reached T3 / prestige 5 / channel 3" idempotent.
- Functions: `hcc_touch_player(...)` (upsert + first-touch attribution + session counter), `hcc_record_events(jsonb)` (bulk insert), `hcc_mark_milestone(...)`.
- Grants: no `anon`/`authenticated` access. These tables are service-role only, reached through server functions, matching the existing ledger posture. RLS enabled with no permissive policies.

## F. Event taxonomy

The full list from the brief is implemented as a frozen `EVENT_NAMES` union in `src/lib/analytics/events.ts` (lifecycle, onboarding, gameplay, mining, upgrades, tools, perks, channels, progression, shop, cosmetics, monetization, operative pass, retention, errors). Server rejects anything outside it. Metadata is whitelisted per event family (ids, numbers, tier, prestige) — no free-form user text, no Telegram profile fields beyond the numeric id.

Throttling: view-type events (`shop_item_viewed`, `upgrade_viewed`, `cosmetic_viewed`) are deduped per session; `mining_claimed` fires on claim only, never per tick; no event is emitted from the 2s mining interval or any render loop.

## G. Telegram attribution approach

Telegram Ads does **not** hand a Mini App a campaign name. The only supported carrier is the start parameter: `https://t.me/HCCGameBot/app?startapp=<payload>` arrives as `initDataUnsafe.start_param`. So attribution works by giving each ad creative its own link.

- Payload format: `src-camp-creative` (e.g. `tgads-cyberop-a`), plus the existing bare tab names which keep working exactly as today.
- `ConsoleShell` keeps its current tab routing; a parser additionally extracts source/campaign/creative and hands it to the session-start call.
- First-touch only: the DB writes acquisition fields when they are null, so a later organic open never overwrites the ad that brought the player in.
- Bot deep links (`miniAppUrl`) get an optional source tag so `/start` opens are distinguishable from ad opens.

## H. Monetization tracking

- `stars_purchase_started` / `stars_purchase_failed` are client events (intent signals only).
- `stars_purchase_completed`, `operative_pass_purchase_completed` are emitted **server-side from the existing webhook**, right after `recordStarPayment` reports a new charge — so they can't be faked and can't double-fire on Telegram retries.
- Revenue metrics query `star_purchases` directly. The analytics tables are never a source of truth for money and the events server function cannot call any ledger helper.

## I. Retention

UTC-date based, computed from `hcc_event`/`hcc_session`: a player is "active on day N" if they have at least one session that day. `Dn = active on (acquisition_date + n days)`. D1/D3/D7/D14/D30. Multiple sessions in a day count once.

## J. Admin/reporting

Phase 1 is deliberately small: a set of SQL views (`hcc_metrics_daily`, `hcc_metrics_funnel`, `hcc_metrics_retention`, `hcc_metrics_revenue`) plus one read-only server function returning the summary block (total players, active today / 7d, new today / 7d, paying players, total stars, first-time purchasers, pass sales, top products, D1/D7, average progression, top drop-off). No dashboard UI this phase; results are read via query. If you want a page later, it's one component over the same function.

## K. Security & privacy

Only the numeric Telegram id, gameplay counters, and the campaign tag we generate ourselves. No names, usernames, photos, messages, contacts or location. Anonymous (non-Telegram) sessions get a random client id and can never claim a Telegram id — the id always comes from verified initData server-side. Analytics endpoints are write-only for events and cannot mutate credits.

## L. Performance

In-memory queue, flushed every 5s / 20 events / on `pagehide`, capped at 100 queued events. All writes fire-and-forget. Nothing in the game awaits analytics; a total analytics outage is invisible to the player.

## M. Test plan (added to the existing 44, none removed)

Event name validation, metadata whitelisting, batching/throttle/dedupe, attribution parsing, first-touch persistence (second open does not overwrite), anonymous vs authenticated association, analytics failure does not throw into gameplay, platform + version fields present, retention date math, and a check that the purchase-event path grants nothing.

## N. Implementation order

1. Migration (tables, functions, grants, views).
2. `src/lib/analytics/` — event taxonomy, attribution parser, queue/hook, server functions.
3. Version id: add `version` to `package.json` and inject it as a build-time constant.
4. Wire events at existing seams: `store.tsx` `send()`, `ConsoleShell` tab + boot, `Onboarding`, `StarsShop`, `useWallet` error path, telegram webhook.
5. Tests, typecheck, build, security scan, report — no deploy without your approval.

## Assumptions to confirm

- "Tier" for analytics = the existing rank index (0–4 from intel thresholds), with rig/miner tier taken from installed item tiers. There is no separate T1–T5 player tier field today.
- Ad attribution relies on one `startapp` link per creative, since Telegram supplies no campaign metadata to Mini Apps.
