# SC-2 Equity P1 — SEC EDGAR CompanyFacts Evidence

**Date:** 2026-08-23  
**Parent:** `SC-MD-SPT-0001` / `SC-2E Equity Orchestrator Challenger`  
**Authority:** ADR-0087  
**Branch:** `feature/equity-orchestrator-p0-challenger-2026-08-23`  
**Equity model:** `equity-multifactor@0.2.0` — challenger / research-only  
**Runtime:** `equity-research-runtime/0.4.0`  
**Status:** CURRENT + COMPARABLE SEC EVIDENCE IMPLEMENTED — NO PRODUCTIVE PROMOTION

## Purpose

Provide filing-backed US equity evidence without creating a second scoring, provider-routing, DQ, ranking or persistence architecture.

Implemented SEC chain:

`SEC ticker/CIK -> CompanyFacts -> point-in-time fact selection -> MarketEvidenceQualityRecord -> provider-neutral Filing Snapshot -> Derived Metrics -> Comparable Filing Metrics -> correlation-aware Equity Family Composition -> Equity Research Runtime`

The chain remains research-only. It does not create `CanonicalScoreResult`, productive ranking/eligibility or execution authorization.

## 1. Primary Source / Access Contract

`server/secEdgarCompanyFacts.ts` uses SEC-published JSON endpoints only.

- no SEC API key;
- mandatory declared `SEC_EDGAR_USER_AGENT`;
- ticker -> CIK from the SEC-published association only;
- no guessed/fuzzy identity fallback;
- requests serialized with 150 ms minimum start gap by default, below the SEC Fair Access ceiling of 10 requests/s;
- ticker map cache: 24h;
- CompanyFacts cache: 6h;
- request timeout: 8s;
- provider health projected through the existing Supervisor authority.

`SEC_EDGAR_USER_AGENT` is non-secret runtime configuration; no new secret authority is introduced.

## 2. Point-in-Time / Look-Ahead Boundary

`fetchEvidence({ symbol, asOf })` admits a fact only if:

`fact.filed <= asOf`

`filedAt`, accounting `periodEnd` and `retrievedAt` remain distinct. A future 10-Q/10-K fact therefore cannot enter a historical research evaluation merely because CompanyFacts exposes it today.

CompanyFacts is an aggregated current API; immutable accession-level replay and post-acceptance correction behavior remain explicit backtesting gates before productive promotion.

## 3. XBRL Context / Defense-in-Depth

Admitted v0.1.0 forms:

- `10-Q`, `10-Q/A`;
- `10-K`, `10-K/A`.

Contexts are explicit:

- `instant` — balance-sheet/share-count observations;
- `periodic` — quarterly/annual income, EPS and interest observations;
- `ytd` — cumulative cash-flow/distribution observations.

Selection and downstream bridges independently validate context/duration semantics. A 10-Q fact labelled `periodic` but carrying a 6-/9-month duration is rejected before provider-neutral feature derivation.

## 4. Raw Fact Inventory

US-GAAP/dei inventory includes:

- Revenue, Net Income, Operating Income;
- Current Assets / Current Liabilities;
- Shareholders' Equity;
- current/non-current Long-Term Debt;
- Interest Expense;
- Operating Cash Flow / Capital Expenditure;
- Dividends Paid / Common Share Repurchases;
- Common Shares Outstanding;
- Diluted EPS.

Each selected fact retains value/unit, taxonomy/tag, context, period start/end, filing date, form, accession, optional frame and `MarketEvidenceQualityRecord`.

IFRS/20-F/40-F remains outside this version rather than being inferred from US-GAAP tags.

## 5. Provider-neutral Current Filing Bridge

`server/equitySecEvidenceBridge.ts` converts SEC-specific output into `EquityFilingEvidenceSnapshot`.

The bridge preserves:

- UAI asset identity;
- reporting context;
- filing availability;
- accession;
- existing Market Evidence DQ records.

Only fields covered by the generic filing contract are mapped. Other SEC facts remain ignored/deferred instead of receiving implicit score semantics.

## 6. Current-period Derived Metrics

`EquityFilingDerivedMetrics.ts` derives only from compatible admissible filing inputs:

- Current Ratio;
- Non-current / Total Long-Term-Debt-to-Equity;
- Interest Coverage;
- YTD Free Cash Flow;
- YTD Shareholder Distributions;
- Distribution Coverage;
- Reinvestment Intensity.

No absent fact becomes zero. Instant ratios require matching period ends; duration metrics require matching start/end/context. Derived output remains `scoreEligible=false`, `executionEligible=false`, `normalizationRequired=true`.

## 7. Correlation-aware Current Filing Composition

`EquityFilingFeatureComposer.ts` may replace vendor-derived Financial Strength only when at least two independent SEC-derived components are admissible.

Possible components:

- liquidity quality from Current Ratio;
- debt-to-equity quality;
- interest-coverage quality.

Source precedence is limited to the same economic correlation group:

`PRIMARY_FILING_EVIDENCE_OVER_VENDOR_DERIVED_FOR_SAME_CORRELATION_GROUP`

SEC/FMP/AlphaVantage leverage observations are therefore not additively stacked. With insufficient SEC coverage, the existing vendor fallback remains.

Current cash-allocation metrics alone do not manufacture Capital Allocation.

## 8. Comparable Prior-period Evidence

`server/equitySecComparableEvidence.ts` obtains a bounded historical `asOf` for approximately the same fiscal period one year earlier using the **same cached CompanyFacts adapter**. This adds no second SEC endpoint or provider authority.

Provider-neutral comparable admission requires:

- same asset identity;
- admissible `VERIFIED` evidence;
- same context and unit;
- current/prior period-end separation between 330 and 400 days;
- maximum 21-day duration/calendar tolerance for comparable periodic observations;
- fail-closed rejection of misclassified 10-Q YTD durations.

`EquityComparableFilingMetrics.ts` can derive:

- Revenue Growth YoY;
- Diluted EPS Growth YoY;
- Free Cash Flow Growth YoY;
- Share Count Change YoY.

Missing or incompatible prior periods stay missing.

## 9. Comparable Feature Composition

`EquityComparableFilingFeatureComposer.ts` applies two correlation rules:

### Growth

Comparable SEC Revenue/EPS/FCF growth may replace same-correlation vendor quarterly growth only when at least two independent comparable growth observations are admissible. Vendor and SEC growth are not stacked.

### Capital Allocation

Capital Allocation requires **both**:

1. verified YoY Share Count Change; and
2. current Distribution Coverage backed by OCF, Capex, Dividends and Buybacks.

Neither signal is sufficient alone. Reinvestment Intensity remains context-only until peer/profile normalization determines defensible semantics.

## 10. Runtime Integration

`equity-research-runtime/0.4.0` composes:

- AlphaVantage/FMP fundamentals;
- provenance-aware TwelveData/EODHD history;
- aligned vendor-derived Quality/Valuation enrichment;
- current SEC CompanyFacts;
- current filing-derived metrics;
- comparable prior SEC evidence/metrics;
- Equity research scoring/orchestration.

Adjacent non-SEC enrichment is documented in `SC2_EQUITY_P1_EVIDENCE_RUNTIME_2026-08-23.md`:

- `quality.freeCashFlowConversion` requires same-provider/same-observation TTM FCF/share + EPS provenance;
- `valuation.freeCashFlowYield` requires attributable FCF/share + fresh real history close.

Neither may create missing family coverage alone.

Still absent by design:

- public Equity score route;
- persistence writer;
- productive `CanonicalScoreResult`;
- ranking/eligibility change;
- registry champion promotion;
- execution authority.

`traditional-scoring@2.1.0` remains the productive stock champion.

## 11. Validation Fixtures

Offline/focused tests cover:

- CIK/User-Agent/evidence lineage;
- latest-fact and Quarter-vs-YTD selection;
- historical `asOf` look-ahead prevention;
- stale evidence and cache behavior;
- unknown ticker fail-closed;
- SEC -> provider-neutral filing bridge;
- Current Ratio/Debt/Interest Coverage derivation;
- period/context mismatch rejection;
- SEC Financial Strength replacement vs vendor fallback;
- comparable prior `asOf` and fiscal-period tolerances;
- Revenue/EPS/FCF YoY and Share Count Change;
- Capital Allocation requiring independent evidence;
- research runtime remaining non-public/non-executable.

Relevant tests include:

- `tests/unit/secEdgarCompanyFacts.test.ts`
- `tests/unit/equitySecEvidenceBridge.test.ts`
- `tests/unit/equityFilingDerivedMetrics.test.ts`
- `tests/unit/equityFilingFeatureComposer.test.ts`
- `tests/unit/equitySecComparableEvidence.test.ts`
- `tests/unit/equityComparableFilingMetrics.test.ts`
- `tests/unit/equityComparableFilingFeatureComposer.test.ts`
- `tests/unit/equityResearchComparableRuntime.test.ts`
- `tests/unit/equityResearchRuntime.test.ts`

## 12. Security / Governance Impact

- no API key/secret introduced;
- no production setting mutated;
- no public route;
- no DB/persistence change;
- no IAM/AuthN/AuthZ change;
- no productive score/rank/eligibility impact;
- no second provider router or DQ authority;
- no LLM extraction;
- no ticker/CIK inference;
- no simulated evidence;
- no cross-correlation stacking of SEC/vendor features;
- productive Stock champion unchanged.

## 13. P1 SEC Completion Boundary

P1 SEC is complete for current and comparable prior-period US CompanyFacts acquisition, provider-neutral derivation and research-runtime composition.

Separate post-intermediate-PR gates remain:

1. Earnings Variability/Stability and ROIC only from defensible point-in-time reconstruction;
2. EV-based valuation only with matching point-in-time enterprise-value inputs;
3. IFRS/20-F/40-F/non-US strategy;
4. peer/sector-relative normalization and winsorization;
5. survivorship/look-ahead-controlled rolling/OOS backtesting;
6. accession-level replay/post-acceptance correction analysis;
7. correlation/stability review;
8. explicit Owner-approved atomic Champion promotion.
