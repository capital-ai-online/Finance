# SC-2 Equity Orchestrator P0/P1 Challenger — Evidence

**Date:** 2026-08-23  
**Parent:** `SC-MD-SPT-0001` / `SC-2`  
**Authority:** ADR-0087  
**Branch:** `feature/equity-orchestrator-p0-challenger-2026-08-23`  
**Baseline:** `main@800b05261c1792fed5138a8125cf6a00b1f5af07`  
**Status:** P0 IMPLEMENTED — P1 EVIDENCE/FEATURE CONSTRUCTION IMPLEMENTED IN BRANCH — PRE-PR VALIDATION PENDING

## Requirement Traceability

The Owner requested a dedicated stock/equity orchestrator with an asset-class-specific scoring model, based on the supplied Drive design, while preserving the homogeneous CAPITAL-AI value chain and avoiding parallel architectures.

Traceability:

- Owner priority — 2026-08-23 Equity Orchestrator request and continuation instruction
- `SC-MD-SPT-0001`
- `docs/roadmaps/work-packages/SC-2_MODEL_REGISTRY_UAI.md`
- `docs/roadmaps/work-packages/SC-2E_EQUITY_ORCHESTRATOR_CHALLENGER.md`
- ADR-0087 — one canonical scoring architecture
- Drive source `1r49r3Eo72wfXlTTorx2uuqNUjaWtNhtm`

## Baseline Finding

At branch creation, productive stock scoring was still owned by `traditional-scoring@2.1.0`, together with Forex and Index. The existing stock implementation uses technical factors plus limited P/E/dividend/profit-margin factors. The repository already provides canonical UAI, Market Evidence DQ, Model Registry, Dispatcher, Canonical Result, Ranking/Eligibility and Traceability boundaries. Therefore the source proposal's separate router, model registry, confidence engine, ranking engine, audit engine and API stack were not adopted.

The first P1 review found additional already-available stock evidence that was not being projected into Equity factor families. Alpha Vantage `OVERVIEW` can provide additional quality, valuation and growth observations without increasing the provider-call count for the first expansion. FMP remains a bounded enrichment path for leverage/free-cash-flow-per-share, but financial evidence is not admitted as VERIFIED unless an actual provider observation/as-of timestamp is present.

## Implemented P0 Boundary

### Domain contracts

- `src/platform/Scoring/EquityModelContracts.ts`
  - `equity-classification/0.1.0`
  - `equity-multifactor-features/0.1.0`
  - structural industry metadata separated from investment style/profile
  - multi-valued style tags but exactly one Primary Scoring Profile
  - six top-level factor families
  - explicit anti-correlation rules and promotion requirements

### Deterministic research scorer

- `src/platform/Scoring/EquityResearchScoring.ts`
  - model `equity-multifactor/0.1.0`
  - profile-specific research weights
  - existing `market-evidence-dq/1.0.0` admission
  - no invented missing values
  - minimum four admitted families
  - minimum 70% nominal-weight coverage
  - profile-specific semantic required-family gates
  - existing effective-feature/effective-weight fingerprint helper reused
  - research result only; no `CanonicalScoreResult`, ranking or execution eligibility

### Equity orchestration boundary

- `src/platform/Scoring/EquityOrchestrator.ts`
  - stock-only identity gate
  - supporting evidence must bind to the same UAI `assetId`
  - no provider acquisition, routing, public API, persistence or ranking authority
  - productive execution remains reserved for `ScoringDispatcher`

### Registry integration

`ScoringModelRegistry` inventories:

`equity-multifactor@0.1.0 -> stock -> challenger -> research-only -> scoreEligible=false`.

The existing `traditional-scoring@2.1.0` remains the only canonical/champion stock model. The Registry resolver ignores the challenger for productive requests, so no stock route or productive score changed.

## Implemented P1 Evidence / Feature Construction

### Existing stock fundamentals expanded without another Alpha Vantage call

`server/stockFundamentals.ts` now preserves provider-attributable fields already present in the existing `OVERVIEW` response:

- P/E
- Price-to-Book
- Dividend Yield
- Profit Margin
- Operating Margin TTM
- Return on Equity TTM
- Quarterly Revenue Growth YoY
- Quarterly Earnings Growth YoY
- EPS TTM

FMP remains bounded fallback/enrichment for fields including Debt-to-Equity and Free Cash Flow per Share. The adapter only binds an FMP `observedAt` when the payload actually contains a provider date. Retrieval time is never relabeled as financial observation time.

### New `EquityFeatureComposer`

`src/platform/Scoring/EquityFeatureComposer.ts` is a pure composition layer over already-acquired evidence. It performs no provider I/O and creates no second DQ authority.

Implemented family construction:

| Family | Current research inputs | Admission rule |
|---|---|---|
| Quality | Profit Margin, Operating Margin, ROE | at least 2 admissible components |
| Valuation | P/E, Price-to-Book | admissible attributable evidence |
| Growth | quarterly Revenue/Earnings YoY growth | admissible attributable evidence |
| Momentum | 12-1 and 6-1 returns | at least 252 real history points + fresh history evidence |
| Financial Strength | Debt-to-Equity | admissible attributable evidence |
| Capital Allocation | deliberately not composed yet | Dividend Yield alone is insufficient |

The composer projects raw provider provenance into the existing `MarketEvidenceQualityRecord` contract with explicit fundamental/history freshness. Missing or stale evidence is omitted rather than zero-filled.

### Research-only normalization boundary

Current raw-to-family transforms are explicitly marked:

`research-bounded-absolute/0.1.0`

and the composer returns `promotionReady=false`.

This normalization exists only to make the challenger deterministic and testable while peer/sector-relative normalization is developed. It is a promotion blocker and must be superseded before productive Equity scoring.

### Profile semantic gates

Generic family count and nominal weight coverage are no longer sufficient on their own. The scorer now blocks READY when the economic family that defines a profile is absent.

Examples:

- `quality-growth` -> Quality + Growth
- `value` -> Valuation + Financial Strength
- `momentum` -> Momentum + Financial Strength
- `income` -> Quality + Financial Strength + Capital Allocation
- `financial` -> Quality + Valuation + Financial Strength
- `semiconductor-ai-infrastructure` -> Growth + Momentum + Financial Strength

This prevents false readiness such as an Income profile reaching 70% generic coverage while having no validated capital-allocation evidence.

## Factor Architecture

| Family | Top-level role | Examples of correlation-bound subfeatures |
|---|---|---|
| Quality | profitability/earnings quality | margin, ROIC, FCF conversion, earnings variability |
| Valuation | relative/fundamental valuation | earnings yield, FCF yield, book-to-price, EV/EBIT |
| Growth | fundamental growth | revenue, EPS, FCF growth |
| Momentum | price-path strength | 12-1, 6-1, relative strength |
| Financial Strength | balance-sheet resilience | leverage, interest coverage, liquidity |
| Capital Allocation | owner return/reinvestment | shareholder yield, dividend coverage, buybacks, reinvestment |

Only family scores are weighted at top level. Subfeatures remain evidence/traceability inputs and cannot be independently re-added.

## Explicitly Rejected from Productive P0/P1

- separate Asset Class Router
- second Model Registry
- second Scoring Dispatcher
- second DQ/Confidence Engine
- second Ranking/Audit authority
- NestJS migration or new API stack
- hardcoded GICS dataset
- caller-controlled subclass routing
- additive Regime Score
- sentiment or pattern score bonus
- Dividend Yield as a stand-alone Capital Allocation quality score
- direct promotion to production

## Security / Data Integrity

- no new secrets or IAM changes
- no database/storage mutation
- no live execution or billing impact
- no demo/synthetic evidence path
- stale/unverified Evidence is fail-closed
- evidence identity mismatch throws before evaluation
- financial `retrievedAt` is never substituted as `observedAt`
- Registry challenger remains `scoreEligible=false`
- bounded normalization is explicitly non-promotable

## External Design Review

Primary-source review used as design input, not as a second repository authority:

- MSCI Factor Advanced methodology separates Value, Quality and Momentum and uses sector-relative standardization/winsorization patterns.
- Alpha Vantage Fundamental Data documents Company Overview plus Income Statement, Balance Sheet and Cash Flow capabilities; P1 reuses additional fields from the already existing Overview request first.
- SEC EDGAR XBRL APIs remain the preferred later candidate for authentication-free US issuer Company Facts/XBRL evidence behind the existing DQ boundary.
- FMP TTM ratios are updated around new financial statements; CAPITAL-AI still requires attributable observation/as-of timestamps before verified admission.
- NIST SSDF remains the existing repository secure-development baseline; no new security policy was created.

## Validation Scope Added

Existing `tests/unit/equityOrchestratorP0.test.ts` covers the P0 registry/orchestrator/model boundaries.

New `tests/unit/equityFeatureComposer.test.ts` covers:

- verified fundamentals + 12-1/6-1 history composing into five families;
- Capital Allocation remaining absent without coverage/buyback/reinvestment evidence;
- stale fundamentals being rejected rather than neutral-filled;
- Income profile staying `NOT_COMPUTABLE` at exactly 70% nominal coverage when Capital Allocation is missing.

Hosted GitHub CI/build/test has **not** been triggered before PR creation in accordance with repository cost policy.

## Remaining Promotion Boundary

Promotion remains out of scope. Before a productive Equity champion can exist, the branch/next work must still establish richer factor evidence, SEC/other point-in-time coverage where appropriate, peer/sector normalization, outlier policy, survivorship/look-ahead-safe backtesting and an explicit Owner-approved atomic routing cutover. Until then every Equity composite remains research-only with no score/rank/eligibility effect.
