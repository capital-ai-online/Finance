# FIN-12 — Validated DATA → Feature Contract recorrelation

**Date:** 2026-09-16  
**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `docs/projects/fintech/`  
**Primary Owner:** `CAPITAL-AI-FINTECH`  
**Primary PVC:** `PVC-12`  
**Correlation baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
**Branch:** `agent/fintech-fin12-feature-boundary-20260916`  
**Trust root:** `/AGENTS.md` v2.11.0  
**Applicable architecture:** `ADR-0087`; `ADR-0041`; `ESS-0016`

## Purpose

Re-correlate the FINTECH P1 queue after the Human merges that completed FIN-17 and determine the smallest owner-correct executable FIN-12 step from current `main`. This evidence does not create a second DATA plane, provider adapter, Data Quality authority, feature registry, scoring registry or dispatcher.

## Current-main queue correction

`FIN-17` is no longer the next FINTECH slice:

- FINTECH backend ranking authority was Human-merged through PR #946 (`merge c8a88afc7f9cfad367b592e9567654451f81e436`).
- Frontend backend-order consumption was Human-merged through PR #951 (`merge 3aa41faa2742dfc2601339b000e660f271380cf1`).
- `docs/projects/fintech/evidence/FIN_17_BACKEND_RANKING_AUTHORITY_2026-09-15.md` is present on current `main`.

Therefore FIN-17 is `DONE_MAIN / TERMINAL` for the bounded backend-authority + FE-consumer split, and FIN-12 becomes the next FINTECH P1 work item after current-main/open-writer recorrelation.

At branch creation, current `main` was `96e305aa076e5c8e2eb49ee4051770f756ef2fbc` and no open Pull Request writer was present.

## Existing DATA handoff

Current DATA provides `ValidatedDataInput/1.0.0` and `ValidatedHistoryInput` through `src/platform/MarketData/ValidatedDataInput.ts` plus the PVC-11 → PVC-12 projection in `src/platform/MarketData/FintechDataHandoff.ts`.

The existing boundary correctly preserves identity, correlation, provider/evidence provenance, freshness/DQ state and explicit fail-closed status. A blocked input does not export numeric FINTECH observations, and missing/stale/non-computable states are not silently converted to numeric defaults.

That handoff is necessary for FIN-12, but the previous project statement that it made the complete FIN-12 exit immediately implementable was too broad.

## Productive feature-builder correlation

### Crypto — `crypto-technical-features/0.7.0`

`src/services/verifiedCryptoTechnicalScoring.ts` builds productive factors from verified history and snapshot data. In addition to price-path factors, the contract uses market-cap/volume and supply dimensions such as `marketCapUsd`, `volume24hUsd`, `circulatingSupply`, `maxSupply` / `totalSupply`.

Current `ValidatedDataInput` snapshot composition exposes the canonical validated price observation; it does not provide a FINTECH-consumable validated field contract for these additional productive crypto dimensions. FINTECH must not recreate provider-specific normalization/provenance/DQ for those fields.

### Traditional — `traditional-features/2.1.0`

`src/services/traditionalAssetScoring.ts` derives technical factors from history and may consume stock fundamentals including `peRatio`, `dividendYieldPct` and `profitMarginPct`. The DATA audit already identifies fundamentals as a separate DATA-owned capability whose existing provider module is not yet converged onto the canonical gateway/validated-exit surface.

FINTECH can map validated fundamentals into the feature contract once DATA returns a canonical validated field boundary, but it must not take over Alpha Vantage/FMP provider ingress or field-level provenance authority.

### Commodity — `commodity-market-evidence/1.0.0`

`src/services/commodityMarketEvidence.ts` already uses `HistoryProviderRegistry` + `MarketDataHistoryGateway`, so it is structurally closest to a FIN-12 consumer migration. It still converts the returned canonical history directly into the commodity evidence contract instead of consuming `ValidatedHistoryInput` explicitly.

This local mapping is executable after the shared validated-history semantics required by all productive consumers are confirmed; it is not sufficient by itself to close FIN-12.

### Sovereign benchmark — `sovereign-benchmark-yield-features/1.0.0`

`src/services/eodhdBondEvidence.ts` intentionally accepts any finite government-yield observation, including legitimate negative yields. Current `buildValidatedHistoryInput()` requires positive finite `close` values because its history semantics are price-oriented.

FINTECH must not weaken or fork that DATA validation rule locally. A DATA-owned validated history/evidence contract needs explicit value semantics that can represent sovereign yields, including negative finite values, without treating them as invalid prices.

## Ownership boundary / required DATA return

The complete FIN-12 exit gate — every productive feature builder behind a tested fail-closed validated DATA compatibility boundary — cannot be truthfully closed solely inside `CAPITAL-AI-FINTECH / PVC-12` on this baseline.

The required upstream return belongs to `CAPITAL-AI-DATA / PVC-09..11`, canonical folder `docs/projects/data/`:

1. canonical validated field/evidence coverage for the productive crypto snapshot dimensions used by the champion feature contract, preserving identity, correlation, provider/evidence provenance, freshness and DQ;
2. canonical validated fundamentals coverage for the productive traditional stock fields currently used by `traditional-features/2.1.0`, preserving field-level provenance;
3. canonical validated history/value semantics capable of distinguishing price-series positivity rules from legitimate signed observations such as sovereign yields;
4. a DATA-owned canonical validated-history bridge for productive crypto/traditional history consumers, or an equivalent accepted DATA contract that lets FINTECH consume validated history without duplicating provider schemas or DQ logic.

Missing, stale, conflicting, unavailable and non-computable values must remain explicit; no synthetic/default feature value may be introduced.

## FINTECH continuation after DATA return

Once the DATA return is on then-current `main`, FINTECH can continue on a fresh/current branch by:

- binding each productive champion feature contract to the returned validated DATA contract;
- validating exact asset identity, correlation/provenance and feature-contract version compatibility before execution;
- failing closed for invalid/missing/stale/non-computable inputs;
- keeping `ScoringModelRegistry` and `ScoringDispatcher` as the single productive model-selection/execution authorities;
- adding focused positive/negative compatibility tests for crypto, traditional, commodity and sovereign champion inputs.

## Validation / evidence state

- Current Project / folder / PVC / Primary Owner: `CAPITAL-AI-FINTECH` / `docs/projects/fintech/` / `PVC-12` / `CAPITAL-AI-FINTECH` — correlated from current-main project mapping.
- Initial branch baseline: `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`.
- Open Pull Requests at branch creation: none.
- Runtime/application mutation in this recorrelation: none.
- Provider, credential, billing, license or production mutation: none.
- Local TypeScript/Vitest/Lint/Build: `NOT RUN` — no dependency-complete repository checkout/runner is exposed by the current connector surface in this chat; no PASS is claimed.
- Hosted GitHub checks: `NOT RUN` before PR creation.

## Disposition

`FIN-12` remains `PARTIAL / P1`, but its next state is now `SELECTED / DATA CONTRACT RETURN REQUIRED` rather than `AFTER FIN-17`. FINTECH stops runtime implementation at the DATA ownership boundary instead of creating parallel normalization, provenance or Data Quality semantics.
