# DATA → FIN-12 owner return

**Date:** 2026-09-17  
**Project:** `CAPITAL-AI-DATA`  
**Folder:** `docs/projects/data/`  
**Primary Owner:** `CAPITAL-AI-DATA`  
**Primary PVC:** `PVC-09`, `PVC-10`, `PVC-11`  
**Downstream handoff:** `PVC-11 -> PVC-12`  
**Branch:** `agent/data-fin12-owner-return-20260917`  
**Write baseline:** `main@fb4d8e430bed17c89c21163c184eb3dbb0598104`  
**State:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING / HUMAN_MERGE_REQUIRED`

## Purpose

FIN-12 requires complete DATA-owned field/history returns before FINTECH may finish productive champion feature bindings. This package closes only the missing DATA contract surfaces. It does not add a FINTECH provider adapter, local Data Quality plane, score, ranking rule, model registry, dispatcher or synthetic evidence path.

The upstream authority remains:

```text
UAI / provider input
-> canonical DATA evidence + provenance + freshness
-> canonical DATA Quality status
-> ValidatedDataInput / ValidatedHistoryInput
-> PVC-11 -> PVC-12 fail-closed projection
```

The downstream FINTECH chain remains separately owned:

```text
Feature Contract
-> ScoringModelRegistry
-> ScoringDispatcher
-> Domain Executor
-> CanonicalScoreResult
-> Ranking / Eligibility
```

## Current-main correlation

The initial preflight observed `main@7fdabfcdd8719b65ed1b99504e39ccd68e1387e5`. Before the first write, `main` advanced to `fb4d8e430bed17c89c21163c184eb3dbb0598104`. The earlier write snapshot was discarded and the branch was created fresh from the later current main.

The intervening main delta was the Universe Frontend/public-route slice and did not modify `src/platform/MarketData/**`, `docs/projects/data/**`, the DATA/FINTECH Roadmaps, or the applicable DATA/scoring authorities.

At write time the remaining open Pull Requests were:

- `#1022` — CAPITAL-AI-GOV, including `/AGENTS.md` authority consolidation;
- `#1035` — CAPITAL-AI-SEO, docs-only growth readback.

Neither was treated as current-main authority. A merge of `#1022` before PR creation or merge readiness invalidates the authority snapshot and requires a complete re-read/re-correlation from then-current main.

## Predecessor disposition

Human-merged PR `#1015` already materialized explicit `SIGNED_VALUE` semantics for `ValidatedHistoryInput`. Positive-price history remains the default; finite negative sovereign-yield values are admitted only through explicit signed semantics. This package consumes that current-main capability and does not reimplement it.

The still-missing DATA returns identified by the FIN-12 boundary were:

1. crypto market-cap/volume/supply with field-level provenance, freshness and DQ;
2. traditional fundamentals with field-level validation/provenance/freshness;
3. one canonical validated-history handoff for productive crypto/traditional consumers.

## Materialized DATA contracts

### Field-level validated feature input

`src/platform/MarketData/ValidatedFeatureInput.ts` binds arbitrary numeric DATA fields to the existing canonical `MarketEvidenceQualityRecord`, UAI identity, correlation identity, provenance-lineage evaluator and Data Quality status vocabulary.

The contract is intentionally generic so productive crypto fields such as:

- `marketCapUsd`;
- `volume24hUsd`;
- `circulatingSupply`;

and traditional fundamentals such as:

- `peRatio`;
- `profitMarginPct`;
- `debtToEquity`;

use the same DATA authority instead of creating provider- or asset-class-local validation planes.

Required fields are explicit. Missing values remain `MISSING`; stale evidence remains `STALE`; conflicting evidence remains `UNKNOWN`; malformed/non-finite/identity-inconsistent fields become `FAIL`. None is upgraded to valid numeric production evidence.

### Feature handoff / computability

`src/platform/MarketData/FintechFeatureHandoff.ts` is a thin projection over the existing `projectValidatedDataInputForFintech()` PVC-11 -> PVC-12 guard. It creates no new DQ decision. It only exposes the downstream state as:

```text
COMPUTABLE
NOT_COMPUTABLE
```

Whenever the canonical handoff blocks, the projection reports `NOT_COMPUTABLE` and exports zero numeric observations.

### Canonical history handoff

`src/platform/MarketData/FintechHistoryHandoff.ts` consumes only the existing canonical `ValidatedHistoryInput`. It does not query providers, normalize provider dialects or create another history contract.

The projection rechecks the downstream boundary invariants needed for numeric FINTECH use:

- UAI identity;
- correlation identity;
- provider identity;
- evidence reference;
- provenance completeness;
- point timestamp/value validity;
- history freshness;
- source DATA status;
- explicit `POSITIVE_PRICE` vs `SIGNED_VALUE` semantics.

The same handoff therefore covers productive crypto and traditional histories, while sovereign-yield histories retain finite negative values only through the already integrated `SIGNED_VALUE` semantics.

## Fail-closed behavior

For the DATA -> FINTECH boundary this package enforces:

```text
missing  -> NOT_COMPUTABLE -> zero numeric/history export
stale    -> NOT_COMPUTABLE -> zero numeric/history export
conflict -> NOT_COMPUTABLE -> zero numeric/history export
invalid  -> NOT_COMPUTABLE -> zero numeric/history export
```

No `0`, neutral score, synthetic fallback, locally invented confidence or research result is substituted.

## Focused contract evidence

`tests/unit/validatedFeatureInputFin12.test.ts` covers:

- crypto market-cap/volume/supply with field-level evidence;
- missing required crypto field;
- stale evidence;
- conflicting evidence;
- traditional fundamentals from AlphaVantage/FMP provenance;
- non-finite traditional field fail-closed behavior.

`tests/unit/fintechHistoryHandoffFin12.test.ts` covers:

- crypto history through the canonical history contract;
- traditional history through the same contract;
- negative sovereign yields with explicit `SIGNED_VALUE`;
- stale history;
- missing provenance.

These tests are materialized repository evidence. They have not been executed in the pre-PR connector path.

## Validation truth

- focused Vitest: `NOT RUN` pre-PR;
- TypeScript: `NOT RUN` pre-PR;
- full DATA contract suite: `NOT RUN` pre-PR;
- production build: `NOT RUN` pre-PR;
- hosted GitHub checks: `PENDING / POST-PR ONLY`.

`NOT RUN` is not `PASS`.

## External systems

This package performs no provider credential, entitlement, provider activation, Supabase, Render, IAM, secret, license, deployment, production or billing mutation.

## Phase disposition

### Phase 1 — DATA owner return

Repository implementation/evidence is materialized on the scoped DATA branch. Final branch/main correlation, canonical PR rendering and Hosted CI remain required before Human/CODEOWNER merge readiness.

### Phase 2 — current-main integration gate

`BLOCKED_BY_HUMAN_CODEOWNER_MERGE` until this DATA payload is Human/CODEOWNER-merged and the four required returns are re-read directly from then-current `main`.

An open PR or branch is explicitly not current-main authority.

### Phase 3 — FINTECH FIN-12

`NOT_STARTED / PROHIBITED_UNTIL_PHASE_2_PASS`.

No FINTECH successor branch may be created from this unintegrated DATA branch. After Human/CODEOWNER merge, FINTECH must start from a fresh then-current-main branch and repeat the full authority/writer/correlation gate.
