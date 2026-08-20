# CAPITAL-AI API Interface & Environment Inventory

**Status:** INITIAL DISCOVERY — QA pending  
**Governance:** ESS-0015  
**Snapshot:** 2026-08-03; ADR-0097 correlation amendment 2026-08-20

## Purpose

Dieses Dokument ist die kanonische menschenlesbare Sicht auf externe Schnittstellen **und deren Konfigurationsvariablen**. Vor einer neuen Provider-Entscheidung wird zuerst vollständig inventarisiert. Es werden ausschließlich Variablennamen, Zweck, Exposure und Evidence dokumentiert — niemals Secret-Werte.

ADR-0097 ändert keine Provider-Authority und nimmt keine neue Provider-Auswahl vor. Die Änderung vom 2026-08-20 dokumentiert ausschließlich eine **bereits vorhandene FMP-Nutzung als Secondary-/Enrichment-Quelle innerhalb `server/stockFundamentals.ts`** und den neuen internen read-only Display-Contract. Der Decision-Status `EVALUATE` bleibt unverändert.

## 1. API / Interface Inventory

| ID | Provider / Interface | Kategorie | Runtime | Auth / Variable | Evidence / Code | QA | Decision |
|---|---|---|---|---|---|---|---|
| API-MARKET-BINANCE-001 | Binance Spot Public Market Data | market-data | Render backend | none (public data) | `server/binanceLandingQuickAnalysis.ts`, PR #81 | NOT_TESTED | EVALUATE |
| API-MARKET-KRAKEN-001 | Kraken API | crypto market-data / exchange | backend | none (public `api.kraken.com` ticker); ~~`KRAKEN_API_KEY`/`KRAKEN_API_SECRET`/`API_KEY`/`API_SECRET`~~ removed 2026-08-11 — never read by any code path | `server/marketData/cryptoProviderChain.ts` | NOT_TESTED | EVALUATE |
| API-MARKET-COINGECKO-001 | CoinGecko Crypto Data | market-data | backend/services | provider public/API contract | `cryptoHistoryProvider.ts`, `cryptoSnapshotProvider.ts`, `liveCryptoSnapshotConsensus.ts`, `verifiedAssetDisplay.ts` | NOT_TESTED | EVALUATE |
| API-MARKET-COINMARKETCAP-001 | CoinMarketCap | crypto market-data | backend | ~~`COINMARKETCAP_API_KEY`~~ (removed) | Removed 2026-08-11: adapter, provider-registry entry, secret-manifest key and `.env.example` declarations deleted; crypto snapshot quorum now runs CoinGecko-only (single-source, so `getLiveCryptoSnapshotConsensus` consistently reports `INSUFFICIENT_SOURCES` per fail-closed policy) | REMOVED | REMOVED |
| API-MARKET-FMP-001 | Financial Modeling Prep | market-data / fundamentals-enrichment | Render backend | `FMP_API_KEY` | `server/fmpIndices.ts`, `server/stockFundamentals.ts`, provider registry, `render.yaml`; ADR-0097 uses existing FMP capability as secondary stock-fundamentals enrichment without creating a second fundamentals authority | NOT_TESTED | EVALUATE |
| API-MARKET-ALPHAVANTAGE-001 | Alpha Vantage | market-data/fundamentals | Render backend | `ALPHA_VANTAGE_KEY` | `server/stockFundamentals.ts`, provider registry, `.env.example`, `render.yaml`; primary stock-fundamentals source for ADR-0097 | NOT_TESTED | EVALUATE |
| API-MARKET-ALPACA-001 | Alpaca | market-data candidate | production candidate | API credential(s), exact canonical variable names to verify against production config | Secret-Bereitstellung reported; no active code evidence found in the original snapshot | NOT_TESTED | EVALUATE |
| API-MARKET-COINAPI-001 | CoinAPI | market-data | backend | `COIN_API_KEY` | `.env.example`, `render.yaml`, external market-data adapters | NOT_TESTED | EVALUATE |
| API-MARKET-EODHD-001 | EODHD | market/bond evidence | backend | `EODHD_API_KEY` | `eodhdBondEvidence.ts`, `.env.example`, `render.yaml`, `verifiedAssetDisplay.ts` | NOT_TESTED | EVALUATE |
| API-MARKET-TWELVEDATA-001 | Twelve Data | market-data | backend | `TWELVEDATA_API_KEY` | `.env.example`, `render.yaml`, external market-data adapters, `traditionalQuoteEvidence.ts`, `commodityMarketEvidence.ts`, `verifiedAssetDisplay.ts` | NOT_TESTED | EVALUATE |
| API-MACRO-FRED-001 | FRED | macro/rate evidence | backend | `FRED_API_KEY` | `macroRateEvidence.ts`, ADR-0023, `.env.example`, `render.yaml` | NOT_TESTED | EVALUATE |
| API-MACRO-ECB-001 | ECB Data API | macro/rate evidence | backend | none / keyless | macro evidence architecture | NOT_TESTED | EVALUATE |
| API-NEWS-001 | News API | news/sentiment evidence | backend | `NEWS_API_KEY`; noncanonical legacy spelling ~~`News_API_KEy`~~ removed 2026-08-11 | `src/features/news/newsRoutes.ts`, `.env.example`, `render.yaml` | NOT_TESTED | EVALUATE |
| API-AI-ANTHROPIC-001 | Anthropic Claude API | ai | Render backend | `ANTHROPIC_API_KEY` | `server/anthropicClient.ts`, `agentModelRouting.ts`, `render.yaml` | PARTIAL | KEEP/EVALUATE |
| API-AI-OPENAI-001 | OpenAI API | ai | Render backend | `OPENAI_API_KEY` | `server/openaiClient.ts`, RAG embeddings, `render.yaml` | PARTIAL | KEEP/EVALUATE |
| API-AI-GEMINI-001 | Google Gemini API | ai | Render backend | `GEMINI_API_KEY` | historical snapshot evidence; current runtime state is governed by later provider-removal decisions and must not be inferred from this 2026-08-03 inventory row | PARTIAL | KEEP/EVALUATE |
| API-PAY-STRIPE-001 | Stripe API / Checkout | payments | Render backend | `STRIPE_SECRET_KEY`, publishable key, price IDs | `server/stripe.ts`, `.env.example`, `render.yaml` | PARTIAL | KEEP |
| API-PAY-STRIPE-WEBHOOK-001 | Stripe Webhook | webhook | Render/Supabase | `STRIPE_WEBHOOK_SECRET` | webhook routes / Edge Function | PARTIAL | KEEP |
| API-SUPABASE-AUTH-001 | Supabase Auth | auth | browser/backend | `VITE_SUPABASE_URL`, publishable/anon key + JWT | auth client/middleware | PARTIAL | KEEP |
| API-SUPABASE-DATA-001 | Supabase PostgREST/Data API | database | browser/backend | `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, client keys depending path | production project | PARTIAL | KEEP |
| API-SUPABASE-EF-STRIPE-SETUP | Edge Function `stripe-setup` | edge-function | Supabase | `verify_jwt=false`; alternative control to verify | production function v3 | NOT_TESTED | EVALUATE |
| API-SUPABASE-EF-STRIPE-WEBHOOK | Edge Function `stripe-webhook` | edge-function/webhook | Supabase | `verify_jwt=false`; Stripe signature expected | production function v4 | NOT_TESTED | EVALUATE |
| API-SUPABASE-EF-STRIPE-WORKER | Edge Function `stripe-worker` | edge-function | Supabase | `verify_jwt=false`; alternative control to verify | production function v3 | NOT_TESTED | EVALUATE |
| API-MAIL-IONOS-001 | IONOS SMTP | email | Render backend | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | `server/mailer.ts`, `.env.example`, `render.yaml` | PARTIAL | KEEP/EVALUATE |
| API-OAUTH-GOOGLE-001 | Google OAuth via Supabase | auth | browser/Supabase | OAuth2 / Supabase configuration | auth flow | PARTIAL | KEEP |
| API-GOOGLE-MARKETING-001 | Google Marketing/Analytics integration | marketing | browser/backend/MCP profile | `VITE_GA_MEASUREMENT_ID` + governed service credentials | ESS-0014 / ADR-0035 | IN_PROGRESS | EVALUATE |
| API-SOCIAL-001 | YouTube OAuth | social publishing | backend | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` | `.env.example`, `render.yaml` | NOT_TESTED | EVALUATE |
| API-SOCIAL-002 | TikTok OAuth | social publishing | backend | `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET` | `.env.example`, `render.yaml` | NOT_TESTED | EVALUATE |
| API-SOCIAL-003 | Instagram OAuth | social publishing | backend | `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET` | `.env.example`, `render.yaml` | NOT_TESTED | EVALUATE |
| API-SOCIAL-004 | X OAuth | social publishing | backend | `X_CLIENT_ID`, `X_CLIENT_SECRET` | `.env.example`, `render.yaml` | NOT_TESTED | EVALUATE |
| API-SOCIAL-005 | Facebook OAuth | social publishing | backend | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | `.env.example`, `render.yaml` | NOT_TESTED | EVALUATE |

### 1.1 Internal verified-display contract (ADR-0097)

This inventory primarily tracks external providers. For traceability, ADR-0097 adds one internal read contract that composes existing provider evidence without changing their decision status:

| Interface | Runtime | Purpose | Evidence |
|---|---|---|---|
| `GET /api/registry/assets/:symbol/verified-display` | Render backend | Progressive per-symbol display value + provenance/fundamentals where applicable | `server/routes/verifiedAssetDisplayRoutes.ts`, `src/services/verifiedAssetDisplay.ts` |

`GET /api/registry/assets` remains metadata-only. The verified-display endpoint is not a scoring authority and is not execution-price eligible.

## 2. Environment Variable Inventory

### AI
- `GEMINI_API_KEY` — historical inventory entry; later runtime/provider-removal decisions are authoritative for current usage.
- `ANTHROPIC_API_KEY` — SECRET — server-only.
- `OPENAI_API_KEY` — SECRET — server-only; also used for RAG embeddings.

### Market Data / FinTech / Macro / News
- `ALPHA_VANTAGE_KEY` — SECRET — Alpha Vantage; primary stock-fundamentals source in the ADR-0097 display path.
- `FMP_API_KEY` — SECRET — Financial Modeling Prep; index market data and existing secondary stock-fundamentals enrichment in `server/stockFundamentals.ts`.
- `COINMARKETCAP_API_KEY` — REMOVED 2026-08-11 — CoinMarketCap integration decommissioned.
- `COIN_API_KEY` — SECRET — CoinAPI.
- `EODHD_API_KEY` — SECRET — EODHD.
- `TWELVEDATA_API_KEY` — SECRET — Twelve Data.
- `FRED_API_KEY` — SECRET — FRED macro evidence.
- `NEWS_API_KEY` — SECRET — canonical News API variable.
- `News_API_KEy` — REMOVED 2026-08-11.
- `KRAKEN_API_KEY` / `KRAKEN_API_SECRET` / generic `API_KEY` / `API_SECRET` — REMOVED 2026-08-11 as unreferenced legacy aliases.
- Alpaca credential variable(s) — production/config evidence must remain governed by the current deployment configuration and later architecture records.

### Supabase
- `VITE_SUPABASE_URL` — PUBLIC CONFIG — browser-visible endpoint.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — PUBLIC/PUBLISHABLE credential.
- `VITE_SUPABASE_ANON_KEY` — PUBLIC/PUBLISHABLE legacy/client credential; usage and coexistence with publishable key to review.
- `SUPABASE_SECRET_KEY` — SECRET — server-only.
- `SUPABASE_SERVICE_ROLE_KEY` — HIGH-PRIVILEGE SECRET — server-only, never browser-exposed.

### Stripe
- `STRIPE_SECRET_KEY` — SECRET.
- `VITE_STRIPE_PUBLISHABLE_KEY` / deployment `STRIPE_PUBLISHABLE_KEY` — PUBLIC/PUBLISHABLE; naming drift to resolve.
- `STRIPE_WEBHOOK_SECRET` — SECRET.
- Stripe price IDs — CONFIG IDs, non-secret.

### SMTP
- `SMTP_HOST` — CONFIG.
- `SMTP_PORT` — CONFIG.
- `SMTP_USER` — SENSITIVE CONFIG.
- `SMTP_PASSWORD` — SECRET.
- `SMTP_FROM` — CONFIG.

### Security / Runtime
- `TOTP_ENCRYPTION_KEY` — HIGH-PRIVILEGE SECRET.
- `METRICS_TOKEN` — SECRET.
- `APP_URL` — CONFIG.
- `AI_STUDIO_ORIGIN` — RETIRED; must not be restored.
- `VITE_GA_MEASUREMENT_ID` — PUBLIC CONFIG.
- `ORCHESTRATOR_ADMIN_TOKEN` — RETIRED; must not be restored.

### Social OAuth
- `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`
- `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET`
- `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`
- `X_CLIENT_ID`, `X_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`

Client IDs are identifiers; client secrets are SECRET and server-only.

## 3. Configuration Drift Findings

The original 2026-08-03 inventory contains historical drift findings. ADR-0097 adds one correlation clarification:

- **FMP role clarification (2026-08-20):** FMP is not only an index/market-data integration; existing code also uses `FMP_API_KEY` through `server/stockFundamentals.ts` as a secondary/enrichment source. This is reuse of an existing integration, not a new canonical-provider decision.
- Existing provider QA/entitlement findings remain governed by ESS-0015 and subsequent architecture decisions; this amendment does not silently promote an `EVALUATE` provider to canonical status.

## 4. Inventory Completion Rule

Before any new FinTech-provider architecture ADR is accepted, ESS-0015 QA must reconcile four evidence planes:

1. repository variable declarations and call sites (`process.env`, `getCleanEnv`, `import.meta.env`),
2. deployment environment declarations (Render),
3. Supabase secrets / Edge Function configuration where applicable,
4. external-provider/API inventory and runtime request evidence.

A variable is classified as `ACTIVE` only when both configuration and runtime/code consumer evidence exist. Variables with only configuration evidence are `CONFIGURED_UNVERIFIED`; code-only variables are `REQUIRED_NOT_DEPLOYMENT_VERIFIED`; obsolete aliases are `LEGACY_CANDIDATE`.

## 5. Immediate QA priorities

1. Complete repository-wide environment-variable extraction and map every variable to every call site.
2. Reconcile Render environment names against `.env.example` without exposing values.
3. Verify current Alpaca production variable names and consumer under the later Alpaca integration state.
4. Test every active market-data provider for auth, entitlement, latency, freshness, provenance, rate limit and failure semantics.
5. Keep ADR-0097 display values fail-closed when provider QA/entitlement prevents a verified observation.
6. Only after the inventory is complete, make new provider-architecture decisions.

## Decision constraint

No provider listed as `EVALUATE` becomes a new canonical FinTech data path solely because ADR-0097 consumes an already existing adapter. Provider promotion remains subject to ESS-0015 inventory, QA and the applicable provider architecture ADR.
