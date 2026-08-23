# SC-2 Equity Orchestrator P0 Challenger — Evidence

**Date:** 2026-08-23  
**Parent:** `SC-MD-SPT-0001` / `SC-2`  
**Authority:** ADR-0087  
**Branch:** `feature/equity-orchestrator-p0-challenger-2026-08-23`  
**Baseline:** `main@800b05261c1792fed5138a8125cf6a00b1f5af07`  
**Status:** IMPLEMENTED — PRE-PR VALIDATION IN PROGRESS

## Requirement Traceability

The Owner requested a dedicated stock/equity orchestrator with an asset-class-specific scoring model, based on the supplied Drive design, while preserving the homogeneous CAPITAL-AI value chain and avoiding parallel architectures.

Traceability:

- Owner priority — 2026-08-23 Equity Orchestrator request
- `SC-MD-SPT-0001`
- `docs/roadmaps/work-packages/SC-2_MODEL_REGISTRY_UAI.md`
- ADR-0087 — one canonical scoring architecture
- Drive source `1r49r3Eo72wfXlTTorx2uuqNUjaWtNhtm`

## Baseline Finding

At branch creation, productive stock scoring was still owned by `traditional-scoring@2.1.0`, together with Forex and Index. The existing stock implementation uses technical factors plus limited P/E/dividend/profit-margin factors. The existing repository already provides the canonical UAI, Market Evidence DQ, Model Registry, Dispatcher, Canonical Result, Ranking/Eligibility and Traceability boundaries. Therefore the Drive proposal's separate router, model registry, confidence engine, ranking engine, audit engine and API stack would have duplicated existing authorities and was not adopted.

## Implemented P0 Boundary

### New domain contracts

- `src/platform/Scoring/EquityModelContracts.ts`
  - `equity-classification/0.1.0`
  - `equity-multifactor-features/0.1.0`
  - structural industry metadata separated from investment style/profile
  - multi-valued style tags but exactly one Primary Scoring Profile
  - six top-level factor families
  - explicit anti-correlation rules and promotion requirements

### New deterministic research scorer

- `src/platform/Scoring/EquityResearchScoring.ts`
  - model `equity-multifactor/0.1.0`
  - profile-specific research weights
  - existing `market-evidence-dq/1.0.0` admission
  - no invented missing values
  - minimum four admitted families
  - minimum 70% nominal-weight coverage
  - existing effective-feature/effective-weight fingerprint helper reused
  - research result only; no `CanonicalScoreResult`, ranking or execution eligibility

### New Equity orchestration boundary

- `src/platform/Scoring/EquityOrchestrator.ts`
  - stock-only identity gate
  - supporting evidence must bind to the same UAI `assetId`
  - no provider acquisition, routing, public API, persistence or ranking authority
  - productive execution remains reserved for `ScoringDispatcher`

### Registry integration

`ScoringModelRegistry` now inventories:

`equity-multifactor@0.1.0 -> stock -> challenger -> research-only -> scoreEligible=false`.

The existing `traditional-scoring@2.1.0` remains the only canonical/champion stock model. The Registry resolver ignores the new challenger for productive requests, so no stock score or route changes in P0.

## Factor Architecture

| Family | Top-level role | Examples of correlation-bound subfeatures |
|---|---|---|
| Quality | profitability/earnings quality | margin, ROIC, FCF conversion, earnings variability |
| Valuation | relative/fundamental valuation | earnings yield, FCF yield, book-to-price, EV/EBIT |
| Growth | fundamental growth | revenue, EPS, FCF growth |
| Momentum | price-path strength | 12-1, 6-1, relative strength |
| Financial Strength | balance-sheet resilience | leverage, interest coverage, liquidity |
| Capital Allocation | owner return/reinvestment | shareholder yield, dividend coverage, buybacks, reinvestment |

Only family scores are weighted at top level. The subfeatures remain evidence/traceability inputs and cannot be independently re-added.

## Explicitly Rejected from Productive P0

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
- direct promotion to production

## Security / Data Integrity

- no new secrets or IAM changes
- no provider mutation
- no database/storage change
- no live execution or billing impact
- no demo/synthetic evidence path
- stale/unverified Evidence is fail-closed
- evidence identity mismatch throws before evaluation
- Registry challenger remains `scoreEligible=false`

## External Design Review

Primary-source review used as design input, not as a second repository authority:

- MSCI GICS hierarchy supports a four-level structural classification; CAPITAL-AI treats external classification as metadata and does not hardcode proprietary datasets.
- MSCI factor methodologies support grouping Value/Quality/Momentum-style observations and sector-relative normalization patterns; CAPITAL-AI keeps such methodology as research input pending its own validation.
- SEC EDGAR XBRL APIs are a P1 candidate for point-in-time US issuer fundamentals; no SEC adapter was added in P0.
- NIST SSDF remains the existing repository secure-development baseline; no new security policy was created.

## Validation Evidence

Implemented static invariants are covered by `tests/unit/equityOrchestratorP0.test.ts`:

- Equity challenger is research-only and cannot replace the productive stock champion.
- Primary-profile weights each sum to 1.0.
- only six top-level factor families exist; regime/sentiment/pattern are absent.
- adequate verified family coverage can produce a research composite.
- stale evidence makes the required coverage fail closed.
- cross-asset orchestration and cross-asset evidence are rejected.

Hosted GitHub CI/build/test has **not** been triggered before PR creation in accordance with repository cost policy.

## Promotion Boundary

Promotion is explicitly out of P0. A future Equity champion must be introduced atomically with removal of `stock` from the Traditional champion and with Dispatcher/CanonicalResult regression evidence. Until that Owner-approved change, any Equity composite is research-only and has no score/rank/eligibility effect.
