# AIF-CORE v0.5.0 — Staging Build Changelog

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

## Known remaining items (not yet addressed — flagged, not fixed, due to scope)
- `PerformanceDashboard.tsx`: simulated CPU/memory/registry metrics (`Math.random()`-based) — internal ops dashboard, not user-facing financial data, but still misrepresents itself as live monitoring.
- `Charts.tsx`: a `simulatedVol` factor blended into chart rendering.
- `HeatmapVisual.tsx`: `Math.random()`-based daily change values in the heatmap.
- `CryptoEnterpriseEvaluator.tsx` "On-Chain" tab (`whaleMetrics`): hardcoded per-symbol on-chain figures, not yet backed by a real provider.
- `getAssetPattern()` (Screener.tsx and others): chart-pattern names are either keyword-matched on a handful of symbols or a deterministic hash-based fallback for everything else — not real pattern-recognition.
