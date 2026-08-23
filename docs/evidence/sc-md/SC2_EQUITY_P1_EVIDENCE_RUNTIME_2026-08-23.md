# SC-2 Equity P1 — Evidence / Research Runtime

**Date:** 2026-08-23  
**Parent:** `SC-MD-SPT-0001` / `SC-2E Equity Orchestrator Challenger`  
**Authority:** ADR-0087  
**Branch:** `feature/equity-orchestrator-p0-challenger-2026-08-23`  
**Baseline:** `main@800b05261c1792fed5138a8125cf6a00b1f5af07`  
**Status:** IMPLEMENTED IN BRANCH — RESEARCH ONLY — PRE-PR VALIDATION PENDING

## Purpose

Bind the Equity P1 feature composition to existing provider/evidence paths without creating a second provider router, score route, dispatcher, persistence writer or ranking authority.

The runtime remains outside productive scoring authority:

`existing provider paths -> EquityFeatureComposer -> EquityOrchestrator research result`

Productive scoring remains exclusively:

`ScoringModelRegistry -> ScoringDispatcher -> registered canonical Domain Executor -> CanonicalScoreResult`.

## Runtime Boundary

`server/equityResearchRuntime.ts`:

- refreshes existing stock fundamentals through `server/stockFundamentals.ts`;
- consumes only cached provider-attributable fundamentals after that refresh;
- requests stock history through the existing Traditional provider-ranking/fallback path;
- creates a stock UAI identity;
- composes admissible factor-family inputs through `EquityFeatureComposer`;
- invokes `EquityOrchestrator` as research-only;
- returns `scoreEligible=false`, `executionEligible=false`, `publicRouteExposed=false`;
- does not emit `CanonicalScoreResult`;
- has no HTTP route or persistence writer.

## History Provenance Correction

An initial runtime draft considered `assetRegistry.getHistory()` because that compatibility path can return real Stooq history. Review found an integrity gap: `HistoryResult` carries `live|simulated` but no durable provider retrieval timestamp/source-path metadata. Labeling a cached result with the runtime invocation time would have produced misleading retrieval provenance.

That draft was corrected before PR:

1. `AssetRegistry` history is not a dependency of the Equity research runtime.
2. `src/services/traditionalHistoryFallback.ts` was extended backward-compatibly to preserve its already-returned provider history points in addition to the existing `closes` projection.
3. The runtime consumes only `VerifiedTraditionalFallbackHistory` from the existing provider router.
4. The approved history candidates remain TwelveData/EODHD and retain provider, dated points, source path and retrieval timestamp.
5. If no provenance-aware history is available, Momentum is absent; it is never neutral-filled.
6. `source='simulated'` cannot enter the runtime type/dependency boundary.

No second history provider or provider-selection authority was introduced.

## Fundamental Evidence Expansion

The existing Alpha Vantage `OVERVIEW` request is reused first. The branch now preserves attributable observations for:

- P/E;
- Price-to-Book;
- Dividend Yield;
- Profit Margin;
- Operating Margin TTM;
- Return on Equity TTM;
- Quarterly Revenue Growth YoY;
- Quarterly Earnings Growth YoY;
- EPS TTM.

FMP remains bounded fallback/enrichment for fields including leverage and free-cash-flow-per-share. FMP `observedAt` is populated only when the provider payload contains an actual date; `retrievedAt` is never substituted as financial observation time.

## Feature Admission

Current research composition can admit:

| Family | Evidence available in P1 branch | Promotion state |
|---|---|---|
| Quality | Profit Margin, Operating Margin, ROE | research-only |
| Valuation | P/E, Price-to-Book | research-only |
| Growth | quarterly Revenue/Earnings YoY | research-only |
| Momentum | 12-1 + 6-1 from dated verified history when >=252 points | research-only |
| Financial Strength | Debt-to-Equity where provider observation date is admissible | research-only |
| Capital Allocation | not composed | blocked pending coverage/buyback/reinvestment evidence |

All bounded absolute transforms remain governed by `research-bounded-absolute/0.1.0` and explicitly `promotionReady=false`. Peer/sector-relative normalization remains a promotion prerequisite.

## Semantic Profile Gates

Generic 4/6 family coverage plus 70% nominal weight coverage is not sufficient when a profile-defining family is absent. Examples include:

- `income`: requires Quality + Financial Strength + Capital Allocation;
- `financial`: requires Quality + Valuation + Financial Strength;
- `quality-growth`: requires Quality + Growth;
- `semiconductor-ai-infrastructure`: requires Growth + Momentum + Financial Strength.

This prevents a model from becoming research `READY` through unrelated factors alone.

## Tests Added

`tests/unit/equityFeatureComposer.test.ts` covers:

- composition of five verified families;
- stale fundamentals fail-closed;
- Capital Allocation not inferred from Dividend Yield;
- Income remains NOT_COMPUTABLE at 70% generic coverage without Capital Allocation.

`tests/unit/equityResearchRuntime.test.ts` covers:

- provenance-aware history binding and no productive/public authority;
- missing verified history means no Momentum family;
- missing fundamentals produce no fabricated replacement values.

## Security / Integrity Impact

- no new secret;
- no IAM/AuthN/AuthZ change;
- no database change;
- no billing/trading/execution mutation;
- no public endpoint;
- no provider-routing duplication;
- no demo/simulated history accepted;
- no `retrievedAt -> observedAt` substitution;
- no score/rank/eligibility impact;
- existing Traditional stock champion remains unchanged.

## Remaining Gates

Before any Equity promotion:

1. richer Capital Allocation, Financial Strength, Quality, Valuation and multi-period Growth evidence;
2. SEC/XBRL or equivalent point-in-time filing evidence where appropriate;
3. non-US coverage policy;
4. peer/sector-relative normalization and outlier/winsorization policy;
5. survivorship/look-ahead-safe rolling/out-of-sample validation;
6. correlation/de-duplication analysis;
7. exact effective feature/weight replay evidence;
8. Owner-approved atomic removal of `stock` from Traditional champion plus Equity champion/Dispatcher binding.

Hosted GitHub CI has not been triggered before PR creation.
