# Server-Authoritative Credit Ledger

## Phase 1 audit — where credits change today

All credit changes happen in one place: the client reducer in `src/lib/hcc/state.ts`, persisted to `localStorage` under `hcc.save.v2`. Nothing about credits is server-checked.

| Source | Change | Current implementation |
| --- | --- | --- |
| Starting balance | +2,500 | `initialState()` |
| Bounty / takedown | `+bounty * (1 + bountyBonus)` | `report` action |
| Coin sale | `+gross` from market quote | `sell` action |
| Mining power cost | `-cost` every 2s tick | `mining-accrue` (client interval) |
| Heat blowout fine | `-35%` of balance | `withHeat` |
| Log scrub | `-600` | `scrub` |
| Contract switch fee | `-fee` | `mining-contract` |
| Shop purchase | `-item.price` | `buy` |
| Prestige milestone grant | `+reward.effect.grant` | `prestige` |
| Stars credit pack | `+credits` | server-verified in `stars.server.ts`, then `grant-credits` on the client |
| Operative Pass daily drop | `+credits` | server-verified (`hcc_claim_daily`), then `grant-credits` |
| Test/admin grants | none exist | — |

Two things follow from this. First, only Telegram players have an identity (HMAC-verified `initData`); a browser player has none, so there is nobody to hold a server balance for. Second, bounties, coin prices, targets and mining rigs are all simulated in the browser, so the server cannot verify a payout it did not simulate.

## The approach

Make the backend the sole owner of the balance for every Telegram-authenticated player, and make the server derive or bound every amount itself. Game simulation stays in the client exactly as it is — this is a hardening pass, not a rebuild.

- **Wallet + ledger tables** keyed by Telegram user id. Balance lives in `hcc_wallet`; every mutation is an append-only `hcc_ledger` row (amount, type, reason, reference, idempotency key, resulting balance, metadata).
- **One atomic RPC** (`hcc_apply`) does check-balance → insert ledger → update balance in a single statement with row locking. Insufficient funds returns a rejection, never a negative balance. Duplicate idempotency key returns the original result and grants nothing.
- **Server-owned entitlements.** Owned items, installed slots, miner counts and prestige level move to a server profile row, so purchases can be validated server-side (identity, item exists, not already owned, price read from the server-side catalog, sufficient funds). The client sends "buy item X", never a price or a balance.
- **Server-derived earnings.** Because owned items are now server truth, the server can recompute the mining rate itself with the existing pure `deriveMining` logic against a server timestamp and the server-recorded `last_accrual_at`, apply elapsed-time caps, and settle the payout. The client no longer decides mining income. Bounties are settled by a server call that recomputes the payout from the server-side rank/multiplier model and bounds it to what is possible at the player's rank; each takedown is idempotent on target id.
- **Stars and the Pass keep their existing flow.** `pre_checkout_query`, `successful_payment`, charge-id uniqueness and `star_purchases` are untouched; the credit grant is simply routed through `hcc_apply` with the charge id as the idempotency key. The daily drop uses the existing `hcc_claim_daily` date check and grants through the same RPC, keyed on user + UTC day. Pricing and the Stars catalog are unchanged.
- **One-time migration.** On first authenticated load, a `migrated_at` flag decides: if unset, the server accepts the local balance once (clamped to a sane ceiling), records it as `legacy_migration`, and sets the flag. Every load after that ignores local credits entirely — server balance wins, no reconciliation, no top-ups.
- **Offline players.** Outside Telegram there is no identity and no server wallet; the game keeps working as today in local-only mode and is clearly not the authoritative economy. Nothing in this mode can move a server balance.

## Client behaviour

The store gains a wallet layer: on boot it fetches the authoritative balance and entitlements and overwrites local values; spends and rewards call the server and apply the returned balance. The UI keeps rendering `credits` from state so no screens are redesigned — only a small sync/"reconnecting" affordance is added where the balance is shown.

## Testing

Existing 31 tests stay. New tests cover: starting balance, reward, spend, insufficient funds, no negatives, duplicate transaction, duplicate Stars charge, daily drop once per UTC day, expired pass rejected, migration exactly once, second migration grants zero, client-supplied balance and price ignored, concurrent spends cannot overspend, mining and operation payouts not duplicatable, ledger sum equals balance.

## Technical notes

- New tables `hcc_wallet`, `hcc_ledger`, `hcc_profile`, all keyed by `telegram_user_id`, with grants and RLS that deny direct API access — every read and write goes through security-definer RPCs called by server functions after `initData` verification.
- New server functions in `src/lib/hcc/wallet.functions.ts` / `wallet.server.ts`: `getWallet`, `syncEntitlements`, `purchaseItem`, `settleTakedown`, `settleMining`, `sellCoin`, `migrateLegacyBalance`.
- Migration is additive; no existing table is altered destructively and no player data is reset.

## Known limit, stated plainly

The server can bound and derive payouts, but it does not re-simulate targets or the coin market, so a determined player can still influence *when* legitimate payouts happen — not their price, their size beyond the server's caps, or their count. Closing that fully means running the simulation server-side, which is the rebuild you asked me not to do.
