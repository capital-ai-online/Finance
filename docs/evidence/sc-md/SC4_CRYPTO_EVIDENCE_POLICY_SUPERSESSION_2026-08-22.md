# SC4 — Crypto Evidence / News Policy Supersession

Status: active on implementation branch; runtime promotion remains Owner-gated
Date: 2026-08-22
Claim: `CRYPTO-EVIDENCE-PROVIDER-ADAPTERS-2026-08-22`

## Purpose

This record supersedes inconsistent or unsafe implementation behavior without creating a second scoring, evidence, risk, compliance or execution authority. Existing canonical authorities remain in force.

## Superseded behavior → canonical replacement

| Superseded behavior | Replacement |
|---|---|
| Static, synthetic or dynamically fabricated financial headlines in the AI Newsfeed Viewer | `/api/news` → `NewsApiEvidenceProvider` → `VerifiedNewsFeed`; no synthetic fallback |
| Article sentiment directly changing an asset score | Article sentiment remains clearly labelled deterministic `heuristic` presentation metadata; no direct score/ranking authority |
| Provider API keys in request URLs | Server-side secret only; header-based provider authentication |
| One transport/rate-limit implementation per evidence vendor | Shared `ResearchEvidenceProviderHttp` reusing `ProviderMatrix`, `RateLimitBudget`, `CircuitBreaker` and Supervisor provider health |
| External provider response interpreted as automatic PASS | Raw evidence only; policy/gate decisions remain separate and fail closed |
| Missing/stale/invalid provider values mapped to `0`, neutral `50` or PASS | Explicit `NOT_AVAILABLE` / `STALE` / `INVALID` with null value and provenance rules |
| Dune arbitrary/model-generated SQL or query execution | Read-only latest result of Owner-allowlisted saved query IDs with expected schema |
| Paid provider auto-upgrade, automatic overage or x402 machine payment | Disabled by policy; plan/credit/overage changes require explicit Owner approval |
| DeFiLlama premium endpoints silently replacing the accepted free evidence path | ADR-0100 free public TVL/fees/revenue path remains canonical until separately superseded |
| Browser-supplied contract address / provider protocol ID / Dune query ID | Server-side governed identity registry/configuration only |
| `LIVE` used ambiguously | `LIVE_DATA`, `LIVE_SCORING`, `LIVE_EXECUTION` are separate states with separate gates |
| Evidence charts presented as a new financial score | Evidence Coverage = data-quality/availability projection only; scoring remains `ScoringModelRegistry → ScoringDispatcher → CanonicalScoreResult` |

## Provider policy

### GoPlus
- EVM Token Security and Solana Token Security (Beta) are security evidence only.
- Public/free baseline may operate keyless within documented vendor limits; an authenticated higher-quota package is optional and Owner-gated.
- GoPlus AI-Agent/x402 billing is prohibited in the canonical path.
- EVM contract addresses and Solana mint addresses MUST come from a governed identity dataset, never symbol guessing.

### CoinGlass
- Derivatives, funding, liquidation, orderbook and unlock data are evidence only.
- API key and production/commercial entitlement are required before public production enablement.
- CoinGlass must not become execution-price authority.

### LunarCrush
- Social metrics are independent evidence and MUST NOT self-confirm via LunarCrush market-price fields.
- Social/creator endpoint entitlement is a production cost/licensing gate.

### Messari
- Non-overlapping standardized protocol/on-chain evidence only.
- ADR-0100 DeFiLlama fields remain canonical for current TVL/fees/revenue.
- x402/pay-per-request is disabled.

### Dune
- Only saved, allowlisted query IDs with declared output schemas.
- No execute-query method and no arbitrary SQL input from user/model.
- Credits/spending caps are Owner account configuration.

### NewsAPI
- Raw article/provenance evidence for Landing Page and AI Newsfeed Viewer.
- Developer/free entitlement is not production-authorized; public production use requires a production-compatible commercial plan or a separately approved replacement provider.
- Server cache reduces calls but does not change vendor license/plan obligations.

### DeFiLlama
- Existing keyless free TVL/fees/revenue evidence remains canonical.
- Premium endpoints and overage-bearing API plans remain disabled unless separately Owner-approved.

## LIVE promotion policy

### LIVE_DATA
May be enabled only when the provider is configured, contract/mint/protocol identity is governed, the vendor plan/license permits the intended use, freshness/DQ is satisfied and the public page displays provenance/status.

### LIVE_SCORING
Requires a separate Owner model-promotion approval after complete required evidence coverage, negative tests, backtest/OOS validation, anti-correlation review, effective-feature/effective-weight fingerprints and audit/formal-verification evidence. Research/challenger models do not become live merely because LIVE_DATA exists.

### LIVE_EXECUTION
Remains FT-7+ and blocked. It requires a separate architecture/security decision including exchange/custody adapters, IAM/step-up authorization, pre-trade controls, reconciliation and incident/runbooks.

## Non-authority statement

This supersession changes implementation policy and evidence projections only. It does not create an alternative dispatcher, scoring registry, canonical result, risk/compliance authority, persistence authority, queue or execution authority.
