# SC4 — Crypto Evidence / News Policy Supersession

Status: active on implementation branch; Option B approved, runtime promotion remains gate-driven
Date: 2026-08-22
Claim: `CRYPTO-EVIDENCE-PROVIDER-ADAPTERS-2026-08-22`

## Purpose

This record supersedes inconsistent, paid-by-default or unsafe evidence behavior without creating a second scoring, evidence, risk, compliance or execution authority. Existing canonical authorities remain in force.

## Owner decision — 2026-08-22

Approved: **Option B — LIVE_SCORING without LIVE_EXECUTION under the documented gates.**

This approval authorizes promotion once the category-specific evidence/DQ/backtest/audit gates are satisfied. It does not waive a failed or missing gate and does not authorize real orders, custody or exchange execution.

## Superseded behavior → canonical replacement

| Superseded behavior | Replacement |
|---|---|
| NewsAPI.org as Landing Page / AI Newsfeed production source | GDELT DOC 2.0 keyless article discovery/provenance; NewsAPI provider/key/policy removed |
| Static, synthetic or dynamically fabricated financial headlines | `/api/news` → `GdeltNewsEvidenceProvider` → `VerifiedNewsFeed`; no synthetic fallback |
| Article sentiment directly changing an asset score | Headline sentiment remains clearly labelled deterministic `heuristic` presentation metadata; no score/ranking authority |
| CoinGlass derivatives evidence | Kraken Futures Public Charts analytics for governed markets; DEX Screener supplements DEX liquidity/activity |
| LunarCrush social evidence | No paid social provider. Missing social evidence remains explicit and may block Meme promotion |
| Messari default protocol evidence | DeFiLlama free canonical fields + Owner-allowlisted Dune Free-Tier evidence; no paid/x402 default |
| One transport/rate-limit implementation per evidence vendor | Shared `ResearchEvidenceProviderHttp` reusing `ProviderMatrix`, `RateLimitBudget`, `CircuitBreaker` and Supervisor health |
| External provider response interpreted as automatic PASS | Raw evidence only; policy/gate decisions remain separate and fail closed |
| Missing/stale/invalid values mapped to `0`, neutral `50` or PASS | Explicit `NOT_AVAILABLE` / `STALE` / `INVALID` with null value and provenance rules |
| Dune arbitrary/model-generated SQL or query execution | Owner-allowlisted saved-query latest-result GET only, bounded columns/rows, Free-Tier attestation required |
| Paid provider auto-upgrade, automatic overage or x402 machine payment | Prohibited; no active paid crypto-evidence provider in this supersession |
| Browser-supplied contract/mint/provider market/Dune query identity | Server-side governed identity registry only |
| `LIVE` used ambiguously | `LIVE_DATA`, `LIVE_SCORING`, `LIVE_EXECUTION` are separate states with separate gates |
| Evidence charts presented as a new financial score | Evidence Coverage = data-quality/availability projection only; scoring remains `ScoringModelRegistry → ScoringDispatcher → CanonicalScoreResult` |

## Active provider policy

### GoPlus Free
- EVM Token Security and Solana Token Security are security evidence only.
- Canonical CAPITAL-AI use is the documented free/public baseline with a local ceiling of 30 calls/minute.
- Authenticated higher-quota, AI-Agent billing and x402 are not part of the active architecture.
- Contract/mint identity MUST come from `CryptoEvidenceIdentityRegistry`.

### Sourcify API v2
- Open-source EVM source/bytecode verification lookup only.
- `exact_match` / `match` proves source-bytecode verification status, **not** formal verification, external audit completion or exploit safety.
- API v1 is forbidden/deprecated; only v2 may be used.

### Kraken Futures Public Charts
- Keyless read-only evidence for governed Kraken futures market symbols.
- Allowed evidence families: open interest, funding, liquidation volume, liquidity and slippage plus public candles where separately needed.
- No private Kraken endpoint, API trading key, order or execution method is permitted in this package.

### DEX Screener Public API
- Keyless DEX pool/activity evidence for governed chain/token identities.
- Local rate limit remains below the vendor-documented public token/pair limit.
- DEX Screener observations are market evidence and do not replace contract-security or canonical price-consensus authority.

### Dune Free Tier
- `DUNE_FREE_TIER_ONLY=true` and explicit `DUNE_FREE_TIER_ATTESTED=true` are required before runtime calls.
- Only saved query IDs in both the Owner-reviewed identity registry and `DUNE_ALLOWED_QUERY_IDS` may be read.
- Only `GET /v1/query/{query_id}/results` is supported; no execute-query, pipeline, raw SQL or model-generated query method exists.
- Requested columns and result rows are bounded; `ignore_max_credits_per_request` is never used.
- Owner must keep Dune extra-credit spending disabled/capped so the Free-Tier boundary cannot silently incur charges.

### GDELT DOC 2.0
- Keyless article discovery/provenance for Landing Page and AI Newsfeed Viewer.
- CAPITAL-AI projects headline, source/domain, publication time and publisher URL only.
- Publisher article bodies are not scraped/re-published; publisher copyright/licensing remains outside GDELT metadata discovery.
- Headline heuristics remain presentation metadata only.

### DeFiLlama
- Existing keyless free TVL/fees/revenue evidence remains canonical under ADR-0100.
- Premium endpoints and paid subscription APIs remain disabled unless separately superseded.

## Excluded providers

The following providers are not active in the SC4 runtime, ProviderMatrix or secret configuration:

- NewsAPI.org
- CoinGlass
- LunarCrush
- Messari

Reintroduction requires a new cost/licensing decision and a new supersession; a stray environment variable must never reactivate them.

## LIVE promotion policy

### LIVE_DATA
May be enabled only when identity, source usage rights, freshness/DQ and public-page provenance are satisfied. Keyless/free does not waive DQ or licensing rules.

### LIVE_SCORING — Owner-approved Option B
Promotion is authorized **only after** complete required evidence coverage, negative tests, backtest/OOS validation, anti-correlation review, effective-feature/effective-weight fingerprints and audit/formal-verification evidence for the relevant category/model. Until those conditions are demonstrably satisfied the challenger remains non-score-eligible.

### LIVE_EXECUTION
Remains FT-7+ and blocked. No order placement, exchange mutation, custody action or broker connection is authorized by Option B.

## Non-authority statement

This supersession changes provider/evidence policy and UI projections only. It does not create an alternative dispatcher, scoring registry, canonical result, risk/compliance authority, persistence authority, queue or execution authority.
