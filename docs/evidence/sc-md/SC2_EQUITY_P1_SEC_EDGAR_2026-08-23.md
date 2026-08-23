# SC-2 Equity P1 — SEC EDGAR CompanyFacts Evidence

**Date:** 2026-08-23  
**Parent:** `SC-MD-SPT-0001` / `SC-2E Equity Orchestrator Challenger`  
**Authority:** ADR-0087  
**Branch:** `feature/equity-orchestrator-p0-challenger-2026-08-23`  
**Status:** IMPLEMENTED END-TO-END — RESEARCH-ONLY / NO PRODUCTIVE PROMOTION

## Purpose

Add filing-backed US equity evidence without creating a second scoring, provider-routing, DQ or persistence architecture.

Implemented chain:

`SEC ticker/CIK association -> SEC CompanyFacts -> point-in-time fact selection -> MarketEvidenceQualityRecord -> provider-neutral EquityFilingEvidenceSnapshot -> deterministic Derived Metrics -> correlation-aware Equity Filing Feature Composition -> Equity Research Runtime`

The chain remains research-only. It does not create `CanonicalScoreResult`, ranking/eligibility authority or execution authorization.

## Primary Source Contract

The implementation follows SEC-published developer requirements:

- `data.sec.gov` CompanyFacts is a public JSON API and requires no API key;
- ticker/CIK associations are obtained from the SEC-published company ticker file;
- automated clients must declare a User-Agent identifying the application/contact;
- SEC Fair Access currently limits automated access to no more than 10 requests per second;
- CompanyFacts/submission data is updated as filings are disseminated.

Runtime configuration:

`SEC_EDGAR_USER_AGENT="CAPITAL-AI support@capital-ai.online"`

This value is non-secret and remains a normal runtime environment setting, not a secret-file value.

## 1. SEC CompanyFacts Adapter

`server/secEdgarCompanyFacts.ts`

Contract version:

`sec-edgar-companyfacts-evidence/0.1.0`

### Access controls

- declared User-Agent is mandatory; missing configuration -> `SOURCE_UNAVAILABLE`;
- requests are serialized with a default 150 ms minimum start gap, below the SEC 10 requests/second ceiling;
- ticker map cache: 24h;
- CompanyFacts cache: 6h;
- request timeout: 8s;
- provider health is projected through the existing Supervisor provider-health authority.

### Identity

- symbol is normalized to uppercase;
- CIK is resolved only from the SEC-published ticker association;
- no guessed CIK or company-name matching fallback;
- CIK is normalized to the SEC 10-digit format;
- a missing ticker association fails closed.

## 2. Point-in-Time / Look-Ahead Boundary

`fetchEvidence({ symbol, asOf })` only admits a fact when:

`fact.filed <= asOf`

`filedAt` is the evidence availability timestamp. `periodEnd` remains separate accounting-period metadata and is not treated as the date on which the fact became knowable.

This prevents a future 10-Q/10-K value from being selected in a historical `asOf` evaluation.

CompanyFacts remains a current aggregation of filing facts; accession-level replay and post-acceptance correction behavior remain explicit backtesting gates before productive promotion.

## 3. XBRL Context Disambiguation

A single 10-Q may contain multiple contexts for the same concept and period end. Array order is not accepted as semantic authority.

Each field declares one context:

- `instant` — balance-sheet/share-count observations;
- `periodic` — income/EPS/interest observations;
- `ytd` — cash-flow/distribution observations.

Candidate ordering is deterministic and distinguishes quarterly, annual and YTD durations before a fact becomes research evidence.

## 4. Raw Fact Inventory

The US-GAAP/dei evidence inventory includes:

- Revenue;
- Net Income;
- Operating Income;
- Current Assets;
- Current Liabilities;
- Shareholders' Equity;
- current/non-current Long-Term Debt;
- Interest Expense;
- Operating Cash Flow;
- Capital Expenditure;
- Dividends Paid;
- Common Share Repurchases;
- Common Shares Outstanding;
- Diluted EPS.

Each selected fact retains value/unit, taxonomy/tag, context, period start/end, filing date, form, accession, optional frame and a `MarketEvidenceQualityRecord`.

Only 10-Q, 10-Q/A, 10-K and 10-K/A are admitted in version 0.1.0. IFRS/20-F/40-F support remains a later coverage task.

## 5. Provider-neutral Bridge

`server/equitySecEvidenceBridge.ts`

Contract version:

`equity-sec-evidence-bridge/0.1.0`

The bridge removes SEC-specific coupling from the scoring platform. Only fields covered by the generic `EquityFilingEvidenceSnapshot` are mapped. Raw SEC fields that do not yet participate in a governed derivation remain visible as ignored/deferred evidence rather than being silently scored.

The bridge preserves:

- UAI asset identity;
- reporting context;
- filing availability;
- accession;
- Market Evidence DQ record.

## 6. Deterministic Filing-derived Metrics

`src/platform/Scoring/EquityFilingDerivedMetrics.ts`

Contract version:

`equity-filing-derived-metrics/0.1.0`

Implemented research metrics:

- Current Ratio;
- Non-current Long-Term-Debt / Equity;
- Total Long-Term-Debt / Equity;
- Interest Coverage;
- YTD Free Cash Flow;
- YTD Shareholder Distributions;
- Distribution Coverage;
- Reinvestment Intensity.

Rules:

- only admissible VERIFIED evidence is used;
- asset identity must match;
- instant ratios require the same period end;
- duration ratios require the same period start/end and context;
- absent facts are never converted to zero;
- incompatible periods produce explicit mismatch diagnostics;
- derived metrics have no productive score authority and remain `normalizationRequired=true`.

## 7. Correlation-aware Feature Composition

`src/platform/Scoring/EquityFilingFeatureComposer.ts`

Contract version:

`equity-filing-feature-composition/0.1.0`

The SEC filing layer may replace vendor-derived Financial Strength only when at least two independent filing-derived components are admissible. Current implementation can compose:

- Current Ratio Quality;
- Debt-to-Equity Quality;
- Interest Coverage Quality.

Source precedence is restricted to the same economic correlation group:

`PRIMARY_FILING_EVIDENCE_OVER_VENDOR_DERIVED_FOR_SAME_CORRELATION_GROUP`

This means SEC/FMP/AlphaVantage leverage observations are **not** stacked additively.

If SEC evidence is incomplete, the existing vendor-derived Financial Strength fallback remains unchanged.

### Capital Allocation boundary

Free Cash Flow, Shareholder Distributions, Distribution Coverage and Reinvestment Intensity are retained as research telemetry but do **not** yet create a Capital Allocation family. A second independent governed observation such as share-count change and/or peer-relative normalization is required before this family may become score-bearing.

## 8. Research Runtime Integration

`server/equityResearchRuntime.ts`

Runtime version:

`equity-research-runtime/0.2.0`

The runtime now composes:

- AlphaVantage/FMP fundamentals;
- provenance-aware TwelveData/EODHD price history;
- SEC CompanyFacts evidence;
- provider-neutral filing derived metrics;
- correlation-aware filing feature composition;
- existing Equity Research Scoring / Orchestrator.

Still explicitly absent:

- public SEC/Equity score route;
- persistence writer;
- productive `CanonicalScoreResult`;
- ranking/eligibility change;
- registry champion promotion;
- execution authority.

`traditional-scoring@2.1.0` remains the productive stock champion.

## 9. Status / Freshness Semantics

Current SEC research freshness uses a 190-day maximum age from `filedAt` to evaluation time.

- within policy -> `VERIFIED`;
- older -> `STALE`;
- missing required identity/source -> `SOURCE_UNAVAILABLE`.

Provider status never changes model weights or eligibility.

## 10. Validation Coverage

Offline/unit coverage now spans:

- CIK padding, User-Agent headers and evidence lineage;
- deterministic latest fact selection;
- Quarter vs YTD context selection;
- historical `asOf` look-ahead prevention;
- stale filing behavior;
- cache reuse without extra SEC requests;
- mandatory declared User-Agent;
- fail-closed unknown ticker/CIK mapping;
- provider-specific SEC -> provider-neutral Filing Evidence bridge;
- aligned Current Ratio / Debt-to-Equity / Interest Coverage derivation;
- incompatible period rejection;
- SEC primary-source override of correlated vendor leverage;
- fallback preservation when SEC component coverage is insufficient;
- Capital Allocation telemetry deferral;
- Research Runtime SEC binding with no public/productive authority.

Relevant tests:

- `tests/unit/secEdgarCompanyFacts.test.ts`
- `tests/unit/equityFilingDerivedMetrics.test.ts`
- `tests/unit/equitySecEvidenceBridge.test.ts`
- `tests/unit/equityFilingFeatureComposer.test.ts`
- `tests/unit/equityResearchRuntime.test.ts`

## Security / Governance Impact

- no API key or secret introduced;
- no production setting mutated;
- no public route;
- no DB/persistence change;
- no productive score/rank/eligibility impact;
- no second provider router;
- no LLM/AI extraction;
- no ticker/CIK inference;
- no simulated evidence;
- existing `traditional-scoring@2.1.0` stock champion remains unchanged.

## P1 SEC Completion Boundary

P1 SEC is complete for **current-period, point-in-time CompanyFacts acquisition, provider-neutral derivation and research-runtime composition**.

Separate follow-on work remains:

1. accession/period-history projection for comparable prior periods;
2. share-count-change and richer Capital Allocation modeling;
3. period-aligned earnings-quality/FCF-conversion and ROIC research;
4. point-in-time market-value joins for FCF-yield / EV-based valuation;
5. IFRS/non-US filing strategy;
6. peer/sector-relative normalization and winsorization;
7. survivorship/look-ahead-controlled rolling/OOS backtesting;
8. explicit Owner-approved champion promotion.

These are model-quality/promotion gates and do not reopen the SEC adapter/runtime integration itself.
