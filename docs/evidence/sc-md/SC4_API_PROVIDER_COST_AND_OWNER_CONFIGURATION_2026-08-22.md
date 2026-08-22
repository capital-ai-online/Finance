# SC4 — API Provider Cost, Manual Configuration and Owner Gates

Status: working evidence
Date: 2026-08-22
Claim: CRYPTO-EVIDENCE-PROVIDER-ADAPTERS-2026-08-22

This evidence package tracks provider configuration, cost boundaries, manual owner steps and provider-specific policy gates for the extended crypto evidence chain.

## Architectural rule

Providers are evidence sources only. They MUST NOT become ScoringDispatcher, CanonicalScoreResult, Risk/Compliance, trading, settlement or execution authorities. Missing, stale, invalid or unavailable provider fields remain explicit and MUST NOT become 0, PASS or a neutral default.

## Provider configuration classes

- DeFiLlama public API: keyless free endpoints only in the current canonical path.
- GoPlus Security: security evidence. Free/public limits may be used only within documented fair-use/rate limits; authenticated paid/CU modes require an explicit cost gate.
- CoinGlass: API key and paid plan required for the endpoints used by the extended evidence package. Commercial production use requires a commercial-use plan.
- LunarCrush: API key required. Social/creator endpoints used by the research package are plan-gated and therefore not treated as free production evidence.
- Messari: API key required. Endpoint availability is subscription-tier dependent; x402/pay-per-request MUST remain disabled unless separately authorized.
- Dune: API key required. Query executions and result exports consume credits. Only allowlisted saved query IDs and schemas are permitted; arbitrary SQL is forbidden.
- NewsAPI: API key required. Developer tier is development/testing only and MUST NOT be used by capital-ai.online production. Production landing/newsfeed requires a paid production-compatible NewsAPI subscription or a separately approved replacement provider.

## Cost controls

1. No provider is allowed to auto-upgrade a plan.
2. x402 or machine-initiated payment is disabled by policy unless a separate Owner approval explicitly authorizes it.
3. Provider rate-limit/circuit-breaker budgets are local safety ceilings, not permission to exceed a vendor plan.
4. No paid overage may be enabled by repository configuration alone.
5. Dune query IDs are allowlisted; query cost caps and account/team spending caps remain manual Owner configuration.
6. NewsAPI production overage billing must remain disabled or capped unless the Owner explicitly approves it.
7. DeFiLlama premium endpoints remain disabled until a separate API-plan cost decision supersedes ADR-0100.

## Owner/manual TODO ledger

- [ ] Create/verify NewsAPI production account and API key; choose production-compatible plan before enabling public landing-page traffic.
- [ ] Create/verify CoinGlass API key and commercial-use plan if the website will expose CoinGlass-backed data to end users.
- [ ] Create/verify LunarCrush API key and a plan that includes social/creator endpoints for commercial use.
- [ ] Create/verify Messari API key and confirm the exact endpoint entitlement used by the production adapter; do not enable x402.
- [ ] Create/verify Dune API key, establish team/query ownership, configure saved queries, spending caps and allowlisted query IDs.
- [ ] Decide whether GoPlus stays on its free/security API allowance or receives an authenticated package; no wallet/x402 auto-payment.
- [ ] Add provider secrets to the canonical production secret file via the existing secret-management process; never VITE_*.
- [ ] Curate asset -> chain -> contract-address mappings for GoPlus; no guessed addresses.
- [ ] Curate protocol identifiers and Dune query IDs/output schemas.
- [ ] Complete dataset/page governance for every public evidence visualization: source attribution, timestamp/freshness, status, methodology, entitlement and data-use/licensing note.
- [ ] Complete Audit/Formal-Verification evidence mapping. Audit presence, formal verification, oracle integrity and exploit status MUST be source-backed; GoPlus facts alone are not a blanket PASS.
- [ ] Approve a separate model-promotion/runtime supersession before any Meme/DeFi/other crypto research category is described as productive LIVE scoring or execution.

## LIVE vocabulary boundary

`LIVE_DATA` (fresh provider evidence visible in UI) is distinct from `LIVE_SCORING` (productive model promotion) and from `LIVE_EXECUTION` (broker/exchange/order execution). This work package may enable LIVE_DATA after provider/secret/entitlement gates. LIVE_SCORING requires model-promotion evidence and Owner approval. LIVE_EXECUTION remains FT-7+ and is outside this evidence package.
