# SC4 — API Provider Cost, Manual Configuration and Owner Gates

Status: verified planning evidence
Date: 2026-08-22
Claim: `CRYPTO-EVIDENCE-PROVIDER-ADAPTERS-2026-08-22`

This evidence package records provider configuration, cost boundaries, manual Owner steps and provider-specific policy gates for the extended crypto evidence chain. Vendor prices and entitlements are time-sensitive and MUST be rechecked before purchase/production activation.

## Architectural rule

Providers are evidence sources only. They MUST NOT become ScoringDispatcher, CanonicalScoreResult, Risk/Compliance, trading, settlement or execution authorities. Missing, stale, invalid or unavailable provider fields remain explicit and MUST NOT become 0, PASS or a neutral default.

## Provider cost / entitlement snapshot — 2026-08-22

| Provider | Current canonical use | Key/manual setup | Production cost boundary |
|---|---|---|---|
| DeFiLlama | TVL / fees / revenue | No key for current public endpoints | Current path: free public endpoints. Paid API currently advertised at USD 250/month with 1M calls/month; overage USD 0.60/1,000 calls. Paid path remains disabled. |
| GoPlus | EVM + Solana token security | No key required for documented free baseline; access token optional for higher limits | Standard Security API documented as free at 30 calls/min. Agent/x402/CU payment paths are prohibited. |
| CoinGlass | OI / funding / liquidations / orderbook / unlocks | API key required | Public commercial use requires a commercial plan. Current first explicitly commercial tier: Standard USD 299/month; higher tiers exist. |
| LunarCrush | social / sentiment / creators / spam | API key required | Required social/creator API is paid. Pricing varies by billing term; current site advertises discounted plans from roughly USD 72/month while standard monthly prices are higher. Exact endpoint entitlement must be confirmed before purchase. |
| Messari | non-overlapping protocol/on-chain usage | API key required | Some API access exists on unpaid/subscription tiers but endpoint entitlement is tier-dependent. x402 pay-per-request endpoints exist and are policy-disabled. Confirm the exact protocol endpoint before activation. |
| Dune | allowlisted protocol-specific on-chain queries | API key + saved query IDs + credit cap | Free account includes a monthly credit allocation, but API query/results consume credits and failed executions can consume credits. Additional credits currently priced separately; spending cap is mandatory before production use. |
| NewsAPI | Landing Page + AI Newsfeed Viewer article provenance | API key required | Developer USD 0 tier is development/testing only and not production-authorized. Current Business tier: USD 449/month, 250k requests/month; optional overage can create additional charges and must be disabled/capped unless Owner-approved. |

## Source-of-truth links

- NewsAPI: `https://newsapi.org/pricing`, `https://newsapi.org/register`
- CoinGlass: `https://www.coinglass.com/pricing`, `https://www.coinglass.com/user/ApiKey`
- LunarCrush: `https://lunarcrush.com/pricing`, API authentication documentation under `https://lunarcrush.com/developers/`
- Messari: `https://messari.io/account/api`, `https://docs.messari.io/`
- Dune: `https://dune.com/settings/api`, `https://docs.dune.com/`
- GoPlus: `https://docs.gopluslabs.io/reference/api-overview`, `https://docs.gopluslabs.io/reference/support`
- DeFiLlama: `https://defillama.com/docs/api`, `https://defillama.com/subscription`

## Cost controls

1. No provider is allowed to auto-upgrade a plan.
2. x402 or machine-initiated payment is disabled by policy unless a separate Owner approval explicitly authorizes it.
3. Provider rate-limit/circuit-breaker budgets are local safety ceilings, not permission to exceed a vendor plan.
4. No paid overage may be enabled by repository configuration alone.
5. Dune query IDs are allowlisted; query cost caps and account/team spending caps remain manual Owner configuration.
6. NewsAPI production overage billing must remain disabled or capped unless the Owner explicitly approves it.
7. DeFiLlama premium endpoints remain disabled until a separate API-plan cost decision supersedes ADR-0100.
8. Messari x402/pay-per-request remains disabled even when an API key is configured.
9. GoPlus Agent/x402/CU payment endpoints are not used by the canonical provider adapter.
10. Any vendor plan/price change is treated as configuration drift and must be reviewed before renewed/expanded production use.

## Owner/manual TODO ledger

- [ ] Create/verify NewsAPI production account and API key; choose production-compatible plan before enabling public landing-page traffic.
- [ ] Create/verify CoinGlass API key and commercial-use plan if the website will expose CoinGlass-backed data to end users.
- [ ] Create/verify LunarCrush API key and a plan that includes social/creator endpoints for commercial use.
- [ ] Create/verify Messari API key and confirm the exact endpoint entitlement used by the production adapter; do not enable x402.
- [ ] Create/verify Dune API key, establish team/query ownership, configure saved queries, spending caps and allowlisted query IDs.
- [ ] Decide whether GoPlus stays on its free/security API allowance or receives an authenticated higher-quota package; no wallet/x402 auto-payment.
- [ ] Add approved new provider secrets to the canonical production secret manifest/file through the existing security process; never `VITE_*`.
- [ ] Curate asset → chain → exact EVM contract or Solana mint mappings for GoPlus; no guessed addresses.
- [ ] Curate protocol identifiers and Dune query IDs/output schemas.
- [ ] Complete dataset/page governance for every public evidence visualization: source attribution, timestamp/freshness, status, methodology, entitlement and data-use/licensing note.
- [ ] Complete Audit/Formal-Verification evidence mapping. Audit presence, formal verification, oracle integrity and exploit status MUST be source-backed; GoPlus facts alone are not a blanket PASS.
- [ ] Approve a separate model-promotion/runtime supersession before any Meme/DeFi/other crypto research category is described as productive LIVE_SCORING.

## LIVE vocabulary boundary

`LIVE_DATA` (fresh provider evidence visible in UI) is distinct from `LIVE_SCORING` (productive model promotion) and from `LIVE_EXECUTION` (broker/exchange/order execution). This work package may enable LIVE_DATA after provider/secret/entitlement gates. LIVE_SCORING requires model-promotion evidence and Owner approval. LIVE_EXECUTION remains FT-7+ and is outside this evidence package.
