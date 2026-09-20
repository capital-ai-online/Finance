# CAPITAL-AI-DATA — Canonical Data Connections Audit

**Date:** 2026-09-03  
**Project:** `CAPITAL-AI-DATA`  
**Project stages:** `PVC-09`, `PVC-10`, `PVC-11`  
**Base main SHA:** `adba446e8c17676d1064f9a687970c23cb9aa279`  
**Branch:** `agent/data-canonical-connections-20260903`  
**Trust root:** `/AGENTS.md` v2.6.0  
**Applicable architecture:** `ADR-0041` + `ESS-0016`

## Purpose

Verify the current canonical DATA flow and close the missing executable connection between UAI, provider-neutral MarketData ingress, Evidence/Provenance/Freshness, Data Quality and the validated DATA exit. This work does not add scoring/ranking logic, does not create a second data plane and does not perform production/provider-secret mutation.

## Canonical chain

```text
Source / Provider
  -> Provider Adapter / Registry
  -> MarketDataGateway or MarketDataHistoryGateway
  -> Canonical MarketData DTO
  -> Evidence / Provenance / Freshness
  -> Data Quality
  -> ValidatedDataInput / ValidatedHistoryInput
  -> PVC-12 FINTECH boundary
```

## Current-main canonical path inventory

| Stage | Canonical surface | Audit result |
|---|---|---|
| UAI | `src/platform/Scoring/UniversalAssetAdapter.ts`, identity subset of `src/platform/Scoring/contracts.ts` | CONNECTED — identity-only; provider symbols remain mappings, not evidence |
| Snapshot contract | `src/platform/MarketData/contracts.ts` | CONNECTED — provider/feed, timestamps, correlation, quality state and evidence ID are present |
| Snapshot provider selection | `ProviderRegistry.ts` + `ProviderRouter.ts` + `ProviderMatrix.ts` | CONNECTED — enabled/capability/asset-class/allowlist/shadow gates plus RL/CB |
| Snapshot ingress | `MarketDataGateway.ts` | CONNECTED — cache is revalidated, provider output is assessed before acceptance, failures are explicit `UNAVAILABLE` |
| Snapshot DQ | `DataQualityService.ts` | CONNECTED — schema/value/correlation/timestamp/freshness checks are fail-closed |
| Evidence DQ | `evidenceQualityContracts.ts` | CONNECTED — provenance/freshness required for `VERIFIED`; missing/stale/conflicting evidence is explicit |
| History provider selection | `HistoryProviderRegistry.ts` | CONNECTED — enabled/capability/asset-class/allowlist/shadow gates |
| History ingress | `MarketDataHistoryGateway.ts` | CONNECTED — positive finite points and timestamps required; invalid providers fail over/fail closed |
| DATA exit | `ValidatedDataInput.ts` | **IMPLEMENTED IN THIS BRANCH** — executable UAI→request, snapshot→evidence/DQ→validated exit and history→validated exit bridge |
| Downstream ownership | PVC-12 `CAPITAL-AI-FINTECH` | BOUNDARY ONLY — feature engineering/scoring/ranking remains downstream and is not implemented here |

## New executable connections

`src/platform/MarketData/ValidatedDataInput.ts` establishes the previously documentation-only DATA exit contract without replacing existing components.

### UAI -> ingress requests

- `buildSnapshotRequestForUniversalAsset()` validates UAI identity and binds `symbol`, `assetClass` and non-empty `correlationId` into `SnapshotRequest`.
- `buildHistoryRequestForUniversalAsset()` applies the same identity/correlation binding to `HistoryRequest`.
- A malformed UAI or missing correlation ID fails closed.

### Snapshot -> Evidence / Freshness / DQ

`snapshotToMarketEvidenceQualityRecord()`:

- reuses `assessMarketDataSnapshot()`;
- validates UAI/snapshot asset binding;
- requires correlation lineage;
- maps admissible fresh provider output with `sourceTimestamp` + `evidenceId` to Evidence `VERIFIED`;
- maps stale to `STALE`;
- maps provider unavailable to `UNAVAILABLE`;
- maps identity/correlation/schema problems to `INVALID`;
- calls `assertMarketEvidenceContract()` before returning the Evidence envelope.

### Evidence / DQ -> validated snapshot exit

`buildValidatedDataInputFromSnapshot()` preserves the DATA status model:

- admissible verified price -> `PASS`;
- stale evidence -> `STALE`;
- unavailable required data -> `MISSING`;
- invalid evidence/identity -> `FAIL`;
- conflicting evidence mapping is `UNKNOWN`;
- not-applicable evidence mapping is `NOT_COMPUTABLE`;
- missing price stays `null` and is never converted to zero;
- `provenanceComplete` is true only when identity, correlation, provider, evidence reference, observation timestamp and retrieval timestamp are present.

### History -> validated history exit

`buildValidatedHistoryInput()` requires:

- exact UAI symbol/asset-class binding;
- non-empty correlation ID;
- positive finite close values;
- valid point timestamps;
- provider identity, evidence reference and received timestamp.

Only a `HISTORICAL` series satisfying those conditions is `PASS`; `UNAVAILABLE` becomes `MISSING`; all other invalid states are `FAIL`.

## Executable connection-test coverage added

`tests/unit/canonicalDataPipelineConnections.test.ts` covers:

1. UAI -> SnapshotRequest -> ProviderRegistry -> MarketDataGateway -> Evidence/DQ -> `ValidatedDataInput`;
2. UAI -> HistoryRequest -> HistoryProviderRegistry -> MarketDataHistoryGateway -> `ValidatedHistoryInput`;
3. wrong provider asset identity -> `FAIL`;
4. stale provider output is not silently promoted; when the Gateway cannot supply admissible current data, downstream remains non-PASS;
5. live-looking data without evidence provenance -> `FAIL`;
6. unavailable required price remains `MISSING` with `null`, never numeric zero.

These tests are present on the branch but have not been executed by a repository checkout/CI in this chat. No PASS is claimed for unexecuted Vitest/lint/build checks.

## Existing canonical consumers verified

### Traditional quote evidence

`src/services/traditionalQuoteEvidence.ts` already routes stock/forex through `MarketDataGateway` using `TwelveDataMarketDataProvider` and routes index quotes through the same Gateway using `FmpIndexMarketDataProvider`. Stale/unavailable states remain explicit and `executionPriceEligible=false`.

### Crypto spot consensus

`src/services/cryptoSpotConsensus.ts` builds a `ProviderRegistry`, validates each provider against `ProviderMatrix`, obtains each provider observation through `MarketDataGateway`, and only then converts canonical snapshots into consensus observations. No raw provider payload enters the consensus evaluator.

### Modern history endpoint

`server/routes/historyRoutes.ts` exposes `/api/market-data/history/:symbol` through `HistoryProviderRegistry` + `MarketDataHistoryGateway` and bounded validated requests.

## Compatibility / residual paths — explicitly not canonicalized by this branch

The audit also found historical compatibility paths. Their existence must not be confused with the canonical DATA chain above.

### Stock fundamentals provider module

`server/stockFundamentals.ts` remains a dedicated DATA-owned provider module for Alpha Vantage/FMP fundamentals. It performs field validation, canonical credential resolution, cache/rate guard and field-level provenance, but its HTTP transport is not currently expressed through `MarketDataGateway` because fundamentals are a separate capability and the current `ProviderMatrix` does not define Alpha/FMP fundamentals entries for `ResearchEvidenceProviderHttp`.

This branch does not manufacture a second transport or duplicate ProviderMatrix policy. A future fundamentals transport convergence must first add the appropriate provider-matrix identities and preserve existing field-level provenance before replacing this module's transport.

### Backtest compatibility history

`/api/backtest-history` is explicitly documented in `server/routes/historyRoutes.ts` as a compatibility consumer. It calls `assetRegistry.getHistory()`, whose historical implementation can directly query CoinGecko/Stooq and can return a clearly labelled `simulated` fallback. The current traditional scoring path rejects simulated history for scoring, but this compatibility path is not the canonical modern HistoryGateway path.

No simulated history is accepted by the new `ValidatedHistoryInput` boundary.

### Alpha Vantage quote compatibility endpoint

`server/routes/alphaVantageRoutes.ts` remains an extracted compatibility/provider-facing HTTP adapter for `/api/alpha-vantage-quote`. It is separate from the canonical MarketDataGateway quote paths already used by traditional quote evidence and crypto consensus. The older inline `server.application.ts` residue is lower-precedence compatibility code according to existing composition tests.

No claim is made that these compatibility endpoints are part of the new canonical DATA exit.

## Writer / PR correlation

At the initial current-main precheck:

- open PR #725: Security tests/evidence only;
- open PR #726: SEO documentation only;
- open PR #727: Governance CI drift repair;
- no changed-file overlap with this DATA branch.

Historical DATA claims for Provider Gateway and Alpha Runtime still appear active in old claim JSON, but their implementation branches are absent and PR #639 / PR #640 are merged. They are stale coordination metadata rather than active current writers.

## Invariant checks by construction

- Provider output is not promoted by the new bridge until existing DQ/Evidence validation succeeds.
- Missing data remains `null`/`MISSING`, never zero.
- Missing evidence cannot become `PASS`.
- `STALE`, `UNKNOWN` and `FAIL` are non-PASS states.
- Provenance completeness is explicit.
- No score, rank, confidence multiplier, model weight or feature-engineering authority is introduced by `ValidatedDataInput.ts`.
- No productive Quality Center dependency is introduced in the DATA hot path.
- No second MarketData/Evidence/DQ plane is created.

## Validation state

Repository mutations performed only on `agent/data-canonical-connections-20260903`.

Pre-PR validation still required before any PR request:

- targeted Vitest for `canonicalDataPipelineConnections.test.ts`;
- relevant UAI/MarketData/Evidence/DQ tests;
- `npm run lint`;
- `npm run build`;
- `npm run predeploy:check` only if final correlation classifies the final diff as runtime/provider-impacting.

Hosted checks remain independent and may not be pre-claimed.

## Current conclusion

The canonical DATA components now have an executable, versioned bridge from UAI through canonical MarketData/Evidence/DQ contracts to a validated DATA exit. Existing quote, consensus and modern-history canonical paths already use the relevant Gateway boundaries. Compatibility provider/history residues remain explicit and isolated; they are not silently treated as canonical validated inputs.

The next downstream integration step—changing FINTECH/scoring consumers to require `ValidatedDataInput` rather than legacy domain inputs—belongs to `CAPITAL-AI-FINTECH / PVC-12+` and is outside DATA scoring authority.
