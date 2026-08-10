# ADR-0054 — Crypto Market Data Provider Evidence & Kraken Scoring Integration

- **Status:** Proposed / Implementation in PR #184
- **Date:** 2026-08-10
- **Scope:** Crypto market-data provider topology, provenance, scoring integration and provider-failure semantics
- **Related:** ADR-0032 (No-Demo-Data / provenance), ADR-0046 (modern Supabase key contracts), R-001

## Context

CAPITAL-AI consumes crypto data from several providers. The production runtime already had a resilient price fallback chain (Binance → Kraken → Coinbase), while CoinMarketCap and CoinGecko supplied broader market snapshots. However:

1. Kraken was only a compatibility/fallback price source and did not contribute an explicitly provenance-scoped scoring factor.
2. `kraken-api@1.0.2` was deprecated and should not remain as a direct dependency when Node 24 provides native `fetch` and Kraken exposes public REST market-data endpoints.
3. CoinMarketCap snapshot code used a legacy quotes endpoint/response assumption and could create excessive requests under repeated scoring.
4. Exchange-local 24h volume and global aggregated 24h volume are semantically different and must never be combined into one consensus observation.
5. Production logs on 2026-08-10 showed CoinMarketCap HTTP 429 responses while CoinGecko later returned 50 market assets successfully.

## Decision

### 1. Kraken uses public REST, not the deprecated npm wrapper

CAPITAL-AI SHALL use Kraken Spot REST public market-data endpoints directly via native `fetch`. No Kraken private API key is required for read-only scoring evidence.

`GET https://api.kraken.com/0/public/Ticker`

Private Kraken credentials, trading, withdrawals or account APIs are outside this ADR and require a separate execution/trading architecture and IAM decision.

### 2. Kraken becomes a first-class exchange-liquidity evidence provider

A new `krakenSpotMarketEvidence` service produces only verified exchange-local observations:

- USD spot price;
- 24h price change derived from current/open price;
- base-asset 24h volume;
- USD notional 24h volume derived from Kraken VWAP × base volume;
- deterministic `exchange_liquidity` score;
- provider, pair, observed/retrieved timestamps, evidence ID and semantic scope.

The semantic scope is explicitly:

`single-exchange-spot-24h-liquidity-usd`

This evidence contributes a dedicated `exchange_liquidity` scoring factor. It is NOT treated as global market volume.

### 3. Global volume/supply stays quorum-gated

CoinGecko and CoinMarketCap provide semantically comparable global snapshot fields. Only fields with cross-provider `CONSENSUS` may produce:

- `avg_daily_volume`;
- `supply_dynamics`.

One provider alone is insufficient. Source conflict, missing evidence or provider outage leaves the factor undefined and the scorer dynamically renormalizes remaining verified factors.

### 4. CoinMarketCap contract and rate behavior

The canonical quotes endpoint is migrated to the current v3 contract:

`/v3/cryptocurrency/quotes/latest`

The parser remains tolerant of previous object-keyed and current array-style result shapes during transition.

To prevent provider-credit/rate exhaustion:

- only symbols supported by the two-provider quorum call CoinMarketCap;
- successful snapshots are cached for two minutes;
- HTTP 429 activates a global cooldown honoring `Retry-After` where present and otherwise using a conservative one-hour cooldown;
- a 429 never produces fallback financial evidence.

### 5. CoinGecko semantics

CoinGecko remains an independent global snapshot provider and primary bulk crypto-market provider. Current production evidence shows successful delivery of 50 assets after transient HTTP 429 throttling. Provider throttling is therefore treated as availability degradation, not as permission to synthesize values.

### 6. Scoring weights

The existing global-volume weight is split without changing the total score weight:

- `avg_daily_volume`: 0.12 → 0.08
- `exchange_liquidity`: new 0.04

All scoring weights continue to sum to 1.00. Missing Kraken coverage does not penalize unsupported assets through invented zeros; the missing weight is renormalized across evidence-backed factors.

## Security and integrity invariants

- No private Kraken trading credentials in browser code or public endpoints.
- No deprecated `kraken-api` runtime dependency.
- No AssetRegistry/bootstrap price, volume, market-cap or supply value may become provider evidence.
- Kraken exchange volume never participates in CoinGecko/CoinMarketCap global-volume consensus.
- Provider HTTP errors, 429 responses, timeouts and malformed payloads fail closed to missing factors.
- All provider-derived scoring data is attributable to provider and semantic scope.

## Validation gates before merge

PR #184 MUST NOT merge until all of the following are green:

1. TypeScript compilation.
2. Full unit-test suite including Kraken evidence and global-provider consensus tests.
3. Production Vite/server build.
4. Docker image build and runtime metadata/hardening checks.
5. npm install-script allowlist validation and vulnerability gate.
6. CoinGecko production evidence: API returns usable market assets.
7. CoinMarketCap production evidence: variable is loaded and provider returns usable data; if HTTP 429 persists, the PR remains operationally blocked for full provider-integrity sign-off even though the code correctly fails closed.
8. Post-deploy-only gate after merge approval: Kraken public REST returns usable ticker evidence from the Render runtime and IAM/Supabase probes remain healthy.

## Rollback

Remove the Kraken evidence service and `exchange_liquidity` factor, restore the previous scoring weight, and keep the existing provider fallback chain. No database rollback is required for this ADR.
