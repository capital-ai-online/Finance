# CAPITAL-AI v0.5.0 — Staging Build Changelog

## 1. Data Integrity / Versioning
- `package.json`, `metadata.json` → version `0.5.0`.
- New `src/lib/dataIntegrity.ts`: frozen `DATA_INTEGRITY_MODE = "no-demo-data"` constant, `assertDataIntegrityMode()` (throws at boot if tampered with), `withIntegrityTag()` used on every data-serving API response.

## 2. No-Demo-Data-Policy violations removed
1. `src/lib/assetRegistry.ts` — hardcoded fundamentals + GBM-simulated history removed. Now a live-data-only cache populated exclusively from real CoinGecko/Stooq fetches.
2. `src/lib/cryptoScoring.ts` — `generateCryptoInputs()` no longer fabricates ~18/22 factors from a symbol hash. Only trend/momentum/volume (real) are populated; everything else is `null` with `dataCoverage`/`missingFactors` reported transparently. High-conviction decisions are capped when data coverage < 50%.
3. `/api/news` — Gemini-fallback and hardcoded fake-news-with-real-publisher-names removed. Real NewsAPI.org only; `NOT_IMPLEMENTED`/501 or `NO_DATA`/503 otherwise.
4. `CryptoEnterpriseEvaluator.tsx` — `Math.random()` orderbook depth chart disabled, replaced with an honest "no real data source" placeholder.
5. `/api/market-data` — `Math.random()` fallback reverted to `NO_DATA`/503 (matching prior production behavior).
6. `/api/backtest-history` — no longer calls the GBM-based `assetRegistry.getHistory()`; uses real Stooq CSV history + Alpha Vantage as secondary source.
7. `Screener.tsx` — removed fabricated per-timeframe price/score multipliers (`getAdjustedAsset`) and a hardcoded "always show Bullish Engulfing as 8.5+" override; timeframe view now shows real, unmodified live values.
8. `RealtimeAiNewsfeed.tsx` — removed a second, independent fake-news generator (hardcoded headlines + fake "routed to Claude/Gemini/GPT-4o/Llama/Grok" attribution, fabricated EPS/margin figures). Now sources exclusively from the real `/api/news`.
9. `RealtimeAiNewsfeed.tsx` — removed a non-functional mock Stripe checkout (`alert()` popup claiming "STRIPE SAFE DIRECT-CONNECT ACTIVE" with fabricated SCA/MiFID II claims) that never called Stripe. Now redirects to the real Checkout flow.

## 3. Security hardening
- `src/lib/authMiddleware.ts` — new `requireAuth` (verifies Supabase JWT) and `requireAdmin` (Owner/Enterprise only).
- `/api/orchestrator/stats|config|reset` — previously fully unauthenticated (leaked per-user IPs, allowed anyone to reconfigure or wipe rate limiting). Now Owner/Enterprise-only.
- `/api/stripe/create-checkout-session`, `/api/stripe/create-portal-session`, `/api/stripe/user-subscription` — previously trusted a client-supplied `email`. Now require a verified Supabase JWT; frontend call sites (`Checkout.tsx`, `ProfilePage.tsx`, `Abonnements.tsx`, `Dashboard.tsx`) updated to send `Authorization: Bearer <token>`.
- `Dashboard.tsx` — the "Request Orchestrator" admin tab is now hidden from the sidebar (and its content gated) unless `subscriptionTier === 'Enterprise'` or the account is the platform owner.
- Global Express error handler + `unhandledRejection`/`uncaughtException` process guards added — a single bad request can no longer crash the whole server for all users.
- Basic security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) and a 1 MB JSON body cap added.

## 4. Outage reduction
- `RequestOrchestrator` defaults raised (concurrencyLimit 3→8, maxQueueSize 10→50, maxRequestsPerWindow 30→60/min) — the previous limits were shared globally across all endpoints (cheap cached reads and expensive Gemini calls alike), causing frequent false-positive 429s under modest concurrent load.
- `/api/news` now wrapped in the request orchestrator like other heavy endpoints.

## 5. Free-tier enforcement (Pricing.md)
- New `src/lib/freeTierLimits.ts` + `sql/001_user_quota.sql` — server-side, Supabase-backed quota enforcement (Free: 3 screenings/5 days, Starter: 5/day, Pro: 20/day, Enterprise: unlimited). Previously not enforced server-side at all.
- New endpoints: `POST /api/quota/consume`, `GET /api/quota/status`.
- `Screener.tsx` — "Screener starten" now calls `/api/quota/consume` first and shows an upgrade prompt when the limit is reached.

## 6. Supabase login fix (root cause)
- `.env.example` previously did not document `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` at all.
- `Dockerfile` builder stage never declared these as `ARG`/`ENV`, so Vite baked an empty value into the production bundle regardless of what was set in Render's dashboard — this is why login kept asking for "2 Supabase variables" even though they were configured. Fixed: builder stage now declares the matching `ARG`s (Render auto-populates these from the dashboard Environment tab when names match) and exports them as `ENV` before `npm run build`.
- New `render.yaml` documents all required variables.

## 7. Alpha Vantage / NewsAPI
- Alpha Vantage: non-standard `HTTP 444` → `404`. Otherwise already production-ready (server-side key, redacted logs).
- NewsAPI: real-only, see item 2.3 above.

## 8. BACKLOG — Supabase "Invalid API key" after rotating to new key format (2026-06-30)

**Symptom:** Google OAuth login completed successfully server-side (Supabase
Auth logs showed clean `302` on `/authorize` and `/callback`, user created
in the DB, `login` event logged) but the browser was silently bounced back
to the login screen with no visible error. Email/password login showed the
error **"Invalid API key"** directly.

**Root cause:** The Supabase dashboard was used to **disable the legacy
JWT-based API keys** (anon/service_role) and generate new-format keys
(`sb_publishable_...` / `sb_secret_...`). The codebase was still reading
the old env var names (`VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
— those values were still syntactically valid JWTs, so nothing looked
"missing", but Supabase actively rejects them once legacy keys are turned
off. A stray corrupted `SUPABASE_SERVICE_ROLE_KEY` (two JWTs concatenated
into one 4-segment string) was found and re-copied as a secondary fix.
A wrong variable name (`SUPABASE_PUBLISHABLE_KEY` without the `VITE_`
prefix — not read anywhere in the code) was also set at one point and had
to be removed in favor of the correctly prefixed `VITE_SUPABASE_PUBLISHABLE_KEY`.

**Fast fix checklist for next time this happens:**
1. Supabase Dashboard → Project Settings → API Keys → check whether "Legacy
   JWT-based API keys" shows as disabled. If yes, that's almost certainly it.
2. Confirm these exact 4 Render env vars exist (name AND value, no typos,
   no missing `VITE_` prefix, no stray whitespace from copy/paste):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (new format: `sb_publishable_...`)
   - `SUPABASE_SECRET_KEY` (new format: `sb_secret_...`)
   - `GEMINI_API_KEY` (server-only, **no** `VITE_` prefix — would leak into
     the browser bundle otherwise)
3. Re-copy both Supabase key values fresh from the dashboard (via the copy
   button, not manual selection) directly before pasting into Render — do
   not "correct" an existing value in place.
4. Remove any leftover un-prefixed `SUPABASE_PUBLISHABLE_KEY` /
   `SUPABASE_ANON_KEY` variables — dead weight, not read anywhere.
5. Render → Manual Deploy → **"Clear build cache & deploy"** — a plain
   Restart or "Deploy latest commit" is not sufficient, since `VITE_*`
   vars are baked into the bundle at build time (see item 6 above).
6. Test in a fresh Incognito tab (both email and Google login).

**Code-level fix already applied** (`src/supabaseClient.ts`, `server.ts`):
both the frontend client and the server client now prefer the new key env
vars and fall back to the legacy names automatically, so this class of bug
should not recur even if legacy keys are re-enabled/disabled again later.

## Known remaining items (not yet addressed — flagged, not fixed, due to scope)
- `PerformanceDashboard.tsx`: simulated CPU/memory/registry metrics (`Math.random()`-based) — internal ops dashboard, not user-facing financial data, but still misrepresents itself as live monitoring.
- `Charts.tsx`: a `simulatedVol` factor blended into chart rendering.
- `HeatmapVisual.tsx`: `Math.random()`-based daily change values in the heatmap.
- `CryptoEnterpriseEvaluator.tsx` "On-Chain" tab (`whaleMetrics`): hardcoded per-symbol on-chain figures, not yet backed by a real provider.
- `getAssetPattern()` (Screener.tsx and others): chart-pattern names are either keyword-matched on a handful of symbols or a deterministic hash-based fallback for everything else — not real pattern-recognition.

## 9. Market Scoring Audit Layer + new data sources (2026-07-01)

Ported the standalone `market_data_validation_layer` / `market_scoring_audit_layer`
/ `market_reporting_orchestration_layer` skill spec (YAML/JSON/MD/Python
reference design) into production as `src/lib/marketScoringAudit.ts`.

**What it does:**
- `validateMarketRecord()` — Layer 1: required-field, non-physical-value
  (negative price/volume), and freshness checks on any market record.
- `auditScoreWeights()` — Layer 2: verifies a scoring formula's weights sum
  to 1.0 and every component stayed in its valid 0–1 range BEFORE the score
  is trusted and returned. Wired into `/api/charts-scoring` — if this ever
  fails (e.g. someone reintroduces a hardcoded override that bypasses the
  declared formula), the endpoint now returns `500` with the audit trail
  instead of silently serving an unverified number.
- `buildAuditTrail()` — Layer 3 (condensed): combines validation + audit
  results into an inline `auditTrail` field on the API response, instead of
  writing markdown/json report files to disk (not a fit for a
  request-scoped Express handler — see file header for rationale).

**New data sources:**
- **Kraken + Binance cross-validation** (`crossValidateCryptoSources`):
  public, keyless ticker endpoints for BTC/ETH are compared against the
  CoinGecko price on every `/api/market-data` fetch. A >2% deviation is
  flagged (`asset.sourceIntegrity.flagged`) and logged — never silently
  auto-corrected. This is the direct implementation of the
  "source_integrity" responsibility from `market_datavalidatoon_layer.md`.
- **CoinMarketCap proxy** (`GET /api/coinmarketcap/quotes`): supplemental
  crypto source (freemium, 300 req/day), server-cached 5 minutes. Does
  **not** replace CoinGecko as the primary source in `/api/market-data`.

**Bonus fix found while wiring this in:** `fetchLiveMarketData()`'s Stooq
branch was fabricating `peRatio`, `debtToEquity`, `marketCap`,
`dividendYield`, and `grahamScore` for stocks via `price % N` formulas —
numbers that look like real fundamentals but are pure noise (Stooq's
`sdnjg1v` feed doesn't provide fundamentals at all). Same issue for
forex/commodity fallback volume. All now correctly report as `undefined`
("N/A" in the UI, which already handled this case) instead of a
plausible-looking fabricated value — a direct No-Demo-Data-Policy fix.
