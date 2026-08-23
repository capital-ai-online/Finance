# SC-2 Equity P1 — SEC EDGAR CompanyFacts Evidence

**Date:** 2026-08-23  
**Parent:** `SC-MD-SPT-0001` / `SC-2E Equity Orchestrator Challenger`  
**Authority:** ADR-0087  
**Branch:** `feature/equity-orchestrator-p0-challenger-2026-08-23`  
**Status:** RAW EVIDENCE ADAPTER IMPLEMENTED — FACTOR PROMOTION NOT PERFORMED

## Purpose

Add a keyless, filing-backed US equity evidence source without creating a second scoring, provider-routing, DQ or persistence architecture.

The adapter is server-side and evidence-only:

`SEC ticker/CIK association -> SEC CompanyFacts -> point-in-time fact selection -> MarketEvidenceQualityRecord`

It does not produce `EquityFactorFamilyInput`, `CanonicalScoreResult`, rank, eligibility or execution authorization.

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

## Adapter

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

The SEC itself states that ticker/CIK association files are periodically updated and are not guaranteed complete. CAPITAL-AI therefore treats absence as unavailable evidence, not as permission to infer an identity.

## Point-in-Time / Look-Ahead Boundary

`fetchEvidence({ symbol, asOf })` only admits a fact when:

`fact.filed <= asOf`

`filedAt` is the evidence availability timestamp. `periodEnd` remains separate accounting-period metadata and is not treated as the date on which the fact became knowable.

This prevents a future 10-Q/10-K value from being selected in a historical `asOf` evaluation.

CompanyFacts remains a current aggregation of filing facts; a later backtesting phase must still validate immutable accession-level replay assumptions and post-acceptance correction behavior before productive model promotion.

## XBRL Context Disambiguation

A single 10-Q may contain multiple contexts for the same concept and period end. Array order is not accepted as semantic authority.

Each field declares one context:

- `instant` — balance-sheet/share-count observations; rows without duration are preferred;
- `periodic` — income/EPS/interest observations; for 10-Q the duration nearest one quarter is preferred, for 10-K the duration nearest one year;
- `ytd` — cash-flow/distribution observations; the longest duration within the latest filing/period is preferred.

Candidate ordering is deterministic:

1. latest admissible `filed` date;
2. latest period end;
3. latest accession;
4. context-specific duration rank;
5. governed tag priority;
6. governed unit priority.

This specifically prevents quarterly Revenue/Net Income and YTD Operating Cash Flow/Capex/Dividends/Buybacks from being interchanged.

## Raw Fact Inventory

The first US-GAAP/dei evidence inventory includes:

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

Each selected fact retains:

- field;
- value/unit;
- taxonomy/tag;
- context;
- period start/end;
- filing date;
- form;
- accession;
- frame where present;
- `MarketEvidenceQualityRecord` with `evidenceRef`.

Only 10-Q, 10-Q/A, 10-K and 10-K/A are admitted in version 0.1.0. IFRS/20-F/40-F support is intentionally not inferred from US-GAAP tags and remains a future coverage item.

## Freshness

Current research freshness uses a 190-day maximum age from `filedAt` to evaluation time.

- within policy -> `VERIFIED`;
- older -> `STALE`;
- missing required identity/source -> `SOURCE_UNAVAILABLE`.

This is a research evidence policy, not a final factor-model policy. Field-specific freshness may be refined before promotion.

## Status Semantics

- `READY` — all first-stage core fields (Revenue, Net Income, Operating Cash Flow, Current Assets, Current Liabilities, Equity) are verified;
- `PARTIAL` — at least one verified fact, core set incomplete;
- `STALE` — no verified fact, but stale filing evidence exists;
- `SOURCE_UNAVAILABLE` — no admissible source result.

Provider status never changes model weights or eligibility.

## Tests

`tests/unit/secEdgarCompanyFacts.test.ts` covers offline fixtures for:

- CIK padding, User-Agent headers and evidence lineage;
- deterministic latest fact selection;
- Quarter vs YTD context selection within the same 10-Q;
- historical `asOf` look-ahead prevention;
- stale filing behavior;
- cache reuse without additional SEC requests;
- mandatory declared User-Agent;
- fail-closed unknown ticker/CIK mapping.

No live SEC request is required by the unit tests.

## Security / Governance Impact

- no API key or secret introduced;
- no production setting mutated;
- no public route;
- no DB/persistence change;
- no score/rank/eligibility impact;
- no second provider router;
- no LLM/AI extraction;
- no ticker/CIK inference;
- no simulated evidence;
- existing `traditional-scoring@2.1.0` stock champion remains unchanged.

## Next Evidence Work

The SEC adapter is raw evidence only. Before factor-family promotion:

1. define deterministic derived-feature contracts for Current Ratio, Interest Coverage and other Financial Strength metrics;
2. align cash-flow/net-income periods before FCF conversion or earnings-quality derivation;
3. derive Capital Allocation only from validated payout/buyback/reinvestment evidence, not Dividend Yield alone;
4. add comparable prior-period facts for multi-period growth/share-count change;
5. add IFRS/non-US coverage strategy;
6. validate accession-level point-in-time replay/backtesting;
7. keep all derived outputs behind the existing Equity challenger and `scoreEligible=false` until model promotion gates pass.
