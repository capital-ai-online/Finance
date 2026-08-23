# SC-2 Equity P1 — Evidence / Research Runtime

**Date:** 2026-08-23  
**Parent:** `SC-MD-SPT-0001` / `SC-2E Equity Orchestrator Challenger`  
**Authority:** ADR-0087  
**Branch:** `feature/equity-orchestrator-p0-challenger-2026-08-23`  
**Original baseline:** `main@800b05261c1792fed5138a8125cf6a00b1f5af07`  
**Latest main sync in branch:** `main@deaf7a5411efdc4aa4638757b7d6958a75c094cc`  
**Status:** IMPLEMENTED IN BRANCH — RESEARCH ONLY — PRE-PR VALIDATION IN PROGRESS

## Purpose

Bind the Equity P1 feature composition to existing provider/evidence paths without creating a second provider router, score route, dispatcher, persistence writer or ranking authority.

The current research runtime is:

`existing provider paths -> EquityFeatureComposer -> Vendor-derived Family Enrichment -> SEC Filing Evidence -> Comparable Filing Evidence -> EquityOrchestrator research result`

Productive scoring remains exclusively:

`ScoringModelRegistry -> ScoringDispatcher -> registered canonical Domain Executor -> CanonicalScoreResult`.

## Current Version Boundary

- Equity research model: `equity-multifactor@0.2.0`
- Equity feature contract: `equity-multifactor-features/0.2.0`
- Equity runtime: `equity-research-runtime/0.4.0`
- Market Evidence DQ: `market-evidence-dq/1.0.0`
- Productive stock champion: `traditional-scoring@2.1.0` unchanged

Equity 0.1.0 remains historical P0 evidence only. The 0.2.0 feature/model version is required because comparable SEC filing features and capital-allocation evidence can change research family scores and therefore must produce distinct replay lineage.

## Runtime Boundary

`server/equityResearchRuntime.ts`:

- refreshes existing stock fundamentals through `server/stockFundamentals.ts`;
- consumes only cached provider-attributable fundamentals after that refresh;
- requests stock history through the existing Traditional provider-ranking/fallback path;
- creates a stock UAI identity;
- composes base factor-family inputs through `EquityFeatureComposer`;
- enriches existing Quality/Valuation families through `EquityVendorDerivedFeatureComposer`;
- acquires current and bounded historical SEC CompanyFacts through one governed cached adapter;
- converts SEC-specific facts into provider-neutral filing contracts;
- derives current-period and comparable-period filing metrics;
- invokes `EquityOrchestrator` as research-only;
- returns `scoreEligible=false`, `executionEligible=false`, `publicRouteExposed=false`;
- does not emit `CanonicalScoreResult`;
- has no HTTP route or persistence writer.

## History Provenance Correction

An initial runtime draft considered `assetRegistry.getHistory()` because that compatibility path can return real Stooq history. Review found an integrity gap: `HistoryResult` carries `live|simulated` but no durable provider retrieval timestamp/source-path metadata. Labeling a cached result with runtime invocation time would have produced misleading retrieval provenance.

That draft was corrected before PR:

1. `AssetRegistry` history is not a dependency of the Equity research runtime.
2. `src/services/traditionalHistoryFallback.ts` preserves provider history points in addition to the existing `closes` projection.
3. The runtime consumes only `VerifiedTraditionalFallbackHistory` from the existing provider router.
4. Approved history candidates remain TwelveData/EODHD and retain provider, dated points, source path and retrieval timestamp.
5. If no provenance-aware history is available, Momentum and current-price-derived valuation enrichment are absent.
6. `source='simulated'` cannot enter the runtime type/dependency boundary.

No second history provider or provider-selection authority was introduced.

## Fundamental Evidence Expansion

The existing Alpha Vantage `OVERVIEW` request is reused first. The branch preserves attributable observations for:

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

## Quality / Valuation Quick Wins

`EquityVendorDerivedFeatureComposer` activates two feature keys that were already inventoried in `equity-multifactor-features/0.2.0`:

### `quality.freeCashFlowConversion`

- derived from TTM FCF/share divided by TTM EPS;
- requires a **same-provider, same-observation** provenance pair;
- uses the values from the matched provenance records rather than potentially mixed merged display values;
- requires admissible DQ evidence for both source records;
- enriches an already-existing Quality family only;
- cannot create Quality family coverage by itself.

This specifically prevents Alpha Vantage EPS and FMP FCF/share from being silently combined when their observation bases do not match.

### `valuation.freeCashFlowYield`

- derived from attributable FCF/share divided by the latest admissible real close;
- the close must come from the existing provenance-aware Traditional history path;
- market-price age must satisfy the existing Equity market-history freshness policy;
- enriches an already-existing Valuation family only;
- cannot create Valuation family coverage by itself.

The bounded absolute transforms remain research-only. They do not replace the required peer/sector-relative normalization before promotion.

## SEC Evidence Integration

P1 SEC is integrated end-to-end behind the same research boundary:

`SEC ticker/CIK -> CompanyFacts -> point-in-time XBRL selection -> MarketEvidenceQualityRecord -> provider-neutral Filing Snapshot -> Derived Metrics -> Comparable Metrics -> Family Composition`

Key controls:

- mandatory declared SEC User-Agent;
- no API key/secret;
- serialized request gap below the SEC 10 requests/s ceiling;
- ticker/CIK mapping only from SEC-published association;
- `filedAt <= asOf` look-ahead gate;
- 10-Q/10-K Instant vs Periodic vs YTD context separation;
- additional bridge-level duration validation;
- current and historical `asOf` calls reuse the same CompanyFacts cache/adapter;
- no raw SEC fact receives direct top-level score authority.

## Feature Admission — Current Branch

| Family | Evidence available in P1 branch | Promotion state |
|---|---|---|
| Quality | Profit Margin, Operating Margin, ROE; aligned TTM FCF conversion when provable | research-only |
| Valuation | P/E, Price-to-Book; FCF yield with verified FCF/share + fresh real close | research-only |
| Growth | vendor quarterly proxies; superseded within-family by comparable SEC Revenue/EPS/FCF YoY when >=2 admissible comparable observations | research-only |
| Momentum | 12-1 + 6-1 from dated verified history when >=252 points | research-only |
| Financial Strength | vendor Debt/Equity fallback; SEC Current Ratio + Debt/Equity + Interest Coverage can replace same-correlation vendor evidence when >=2 components | research-only |
| Capital Allocation | SEC share-count change + distribution coverage jointly required; reinvestment intensity remains context-only | research-only |

All bounded absolute transforms remain governed as research-only and `promotionReady=false`. Peer/sector-relative normalization remains a promotion prerequisite.

## Semantic Profile Gates

Generic 4/6 family coverage plus 70% nominal weight coverage is not sufficient when a profile-defining family is absent. Examples include:

- `income`: requires Quality + Financial Strength + Capital Allocation;
- `financial`: requires Quality + Valuation + Financial Strength;
- `quality-growth`: requires Quality + Growth;
- `semiconductor-ai-infrastructure`: requires Growth + Momentum + Financial Strength.

This prevents a model from becoming research `READY` through unrelated factors alone.

## Tests Added

Current focused fixtures cover:

- base Equity family composition and stale-evidence rejection;
- SEC CompanyFacts identity, User-Agent, caching, XBRL context and `asOf` look-ahead controls;
- filing-derived Financial Strength and cash-allocation metrics;
- SEC-to-provider-neutral bridges and duration guards;
- comparable-period Revenue/EPS/FCF growth and share-count change;
- Capital Allocation requiring independent share-count and distribution-coverage evidence;
- FCF conversion requiring aligned same-provider/same-observation provenance;
- FCF yield requiring fresh provenance-aware market history;
- derived signals not manufacturing missing Quality/Valuation family coverage;
- research runtime remaining non-public/non-executable.

## Security / Integrity Impact

- no new secret;
- no IAM/AuthN/AuthZ change;
- no database change;
- no billing/trading/execution mutation;
- no public endpoint;
- no provider-routing duplication;
- no demo/simulated history accepted;
- no `retrievedAt -> observedAt` substitution for financial-statement evidence;
- no cross-provider FCF/EPS conversion;
- no double weighting of vendor/SEC observations in the same correlation group;
- no productive score/rank/eligibility impact;
- existing Traditional stock champion remains unchanged.

## Remaining Gates After This Intermediate PR

Before any Equity promotion:

1. richer Quality evidence: earnings variability/stability and ROIC only where point-in-time inputs support deterministic reconstruction;
2. richer Valuation evidence: EV-based measures only when matching point-in-time enterprise-value inputs are governed;
3. IFRS/20-F/40-F and broader non-US coverage strategy;
4. peer/sector-relative normalization and winsorization/outlier policy;
5. survivorship/look-ahead-safe rolling/out-of-sample validation;
6. accession-level replay/post-acceptance-correction analysis for historical SEC backtests;
7. correlation/de-duplication analysis at subfeature and family level;
8. exact effective feature/weight replay evidence;
9. Owner-approved atomic removal of `stock` from Traditional champion plus Equity champion/Dispatcher binding.

Hosted GitHub CI is intentionally not triggered before PR creation.
