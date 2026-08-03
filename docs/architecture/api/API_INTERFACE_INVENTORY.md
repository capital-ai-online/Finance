# CAPITAL-AI API Interface Inventory

**Status:** INITIAL SEED — QA pending  
**Governance:** ESS-0015  
**Snapshot:** 2026-08-03

## Purpose

Dieses Dokument ist die menschenlesbare Sicht auf das API-Inventar. Es enthält nur nachgewiesene oder explizit als Kandidat markierte Integrationen. Ein Eintrag ist erst `decision-ready`, wenn ESS-0015-QA-Evidence vorliegt.

## Inventory

| ID | Provider / Interface | Kategorie | Runtime | Auth | Evidence / Code | QA | Decision |
|---|---|---|---|---|---|---|---|
| API-MARKET-BINANCE-001 | Binance Spot Public Market Data | market-data | Render backend | none (public data) | `server/binanceLandingQuickAnalysis.ts`, PR #81 | NOT_TESTED | EVALUATE |
| API-MARKET-COINGECKO-001 | CoinGecko Crypto Data | market-data | backend/services | provider public/API contract | `cryptoHistoryProvider.ts`, `cryptoSnapshotProvider.ts`, `liveCryptoSnapshotConsensus.ts` | NOT_TESTED | EVALUATE |
| API-MARKET-FMP-001 | Financial Modeling Prep | market-data | Render backend | API key | `server/fmpIndices.ts`, `traditionalQuoteEvidence.ts`, provider registry | NOT_TESTED | EVALUATE |
| API-MARKET-ALPHAVANTAGE-001 | Alpha Vantage | market-data/fundamentals | Render backend | API key | `server/stockFundamentals.ts`, provider registry | NOT_TESTED | EVALUATE |
| API-MARKET-ALPACA-001 | Alpaca | market-data candidate | production candidate | API key | kein Code-Evidence im aktuellen Repo gefunden; Secret-Bereitstellung allein ist keine Aktivierung | NOT_TESTED | EVALUATE |
| API-AI-ANTHROPIC-001 | Anthropic Claude API | ai | Render backend | API key | `server/anthropicClient.ts`, `agentModelRouting.ts` | PARTIAL | KEEP/EVALUATE |
| API-AI-OPENAI-001 | OpenAI API | ai | Render backend | API key | `server/openaiClient.ts`, `agentModelRouting.ts` | PARTIAL | KEEP/EVALUATE |
| API-AI-GEMINI-001 | Google Gemini API | ai | Render backend | API key | `server/ai.ts`, `agentModelRouting.ts` | PARTIAL | KEEP/EVALUATE |
| API-PAY-STRIPE-001 | Stripe API / Checkout | payments | Render backend | secret key | `server/stripe.ts` | PARTIAL | KEEP |
| API-PAY-STRIPE-WEBHOOK-001 | Stripe Webhook | webhook | Render backend | Stripe signature | `/api/stripe/webhook`, `/billing/webhook` | PARTIAL | KEEP |
| API-SUPABASE-AUTH-001 | Supabase Auth | auth | browser/backend | publishable key + JWT | `supabaseClient`, auth middleware | PARTIAL | KEEP |
| API-SUPABASE-DATA-001 | Supabase PostgREST/Data API | database | browser/backend | RLS/JWT/service-role depending path | production project `ryzywoktpmyhwzxmstyu` | PARTIAL | KEEP |
| API-SUPABASE-EF-STRIPE-SETUP | Edge Function `stripe-setup` | edge-function | Supabase | `verify_jwt=false`; alternative control to verify | production Supabase function v3 | NOT_TESTED | EVALUATE |
| API-SUPABASE-EF-STRIPE-WEBHOOK | Edge Function `stripe-webhook` | edge-function/webhook | Supabase | `verify_jwt=false`; Stripe signature expected to verify | production Supabase function v4 | NOT_TESTED | EVALUATE |
| API-SUPABASE-EF-STRIPE-WORKER | Edge Function `stripe-worker` | edge-function | Supabase | `verify_jwt=false`; alternative control to verify | production Supabase function v3 | NOT_TESTED | EVALUATE |
| API-MAIL-IONOS-001 | IONOS SMTP | email | Render backend | SMTP credentials | `server/mailer.ts` | PARTIAL | KEEP/EVALUATE |
| API-OAUTH-GOOGLE-001 | Google OAuth via Supabase | auth | browser/Supabase | OAuth2 | Landing/App auth flow | PARTIAL | KEEP |
| API-GOOGLE-MARKETING-001 | Google Marketing/Analytics integration | marketing | browser/backend/MCP profile | consent + service credentials by sub-interface | ESS-0014 / ADR-0035 | IN_PROGRESS | EVALUATE |

## Immediate QA priorities

1. Supabase Edge Functions with `verify_jwt=false`: inspect function bodies and prove alternative authentication/authorization.
2. Stripe dual webhook paths: verify there is no duplicate-processing risk and idempotency holds across Render/Supabase paths.
3. Market data provider overlap: CoinGecko, FMP, Alpha Vantage, Binance and future Alpaca — compare asset coverage, latency, cost, provenance and failover semantics.
4. Multi-LLM routing: verify provider fallback preserves prompt contract and output provenance.
5. SMTP/auth flows: negative tests and rate-limit/abuse controls.

## Production Supabase evidence

The current production project exposes RLS-enabled public tables including `subscriptions`, `profiles`, IAM/security audit tables, `user_quota`, `compliance_runs`, `score_snapshots`, `alert_subscriptions`, `agent_evaluation_runs` and `screening_slo_evidence`. These data-plane interfaces must be mapped to the application endpoints that read/write them during the detailed QA pass.

## Decision constraint

No provider listed as `EVALUATE` becomes a new canonical FinTech data path until the ESS-0015 QA report and the subsequent provider architecture ADR are complete.
