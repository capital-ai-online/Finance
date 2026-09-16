# FIN-12 / FIN-20 — DATA → Feature → Score → Rank → OPS Trace Handoff Evidence

**Date:** 2026-09-16  
**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `docs/projects/fintech/`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Owned PVC:** `PVC-12..PVC-17`  
**Source baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
**Branch:** `agent/fintech-fin12-fin20-lineage-20260916`  
**Requirement return:** `REQ-COMP-034`  
**Disposition:** `IMPLEMENTED_BRANCH / PRE_PR_EVIDENCE_READY / OPS RETURN REQUIRED`

## Scope and authority

This package rematerializes the FINTECH owner return from fresh current main. The historical `agent/fintech-fin12-validated-feature-contract-20260916` branch that Compliance recorded as substantially behind/diverged is **not** used as current implementation or current evidence.

Authority remains unchanged:

- DATA/PVC-09..11 owns provider ingress, evidence identity, freshness, provenance and Data Quality.
- FINTECH/PVC-12..17 owns feature mapping, model resolution, scoring, canonical score semantics and ranking.
- OPS/PVC-18 owns EventMesh publication and the operational trace projection.
- Compliance owns `REQ-COMP-034` reassessment and does not receive a synthetic PASS from this package.

Relevant architecture is the accepted ADR-0087 single scoring chain:

`UAI → Evidence/Quality Gate → Feature Contract → ScoringModelRegistry → ScoringDispatcher → Domain Executor → CanonicalScoreResult → Ranking → EventMesh/Traceability`.

## FIN-12 implementation

`src/platform/Scoring/ValidatedFinancialFeatureContract.ts` adds `validated-financial-feature-mapping/1.0.0`.

The mapping consumes the existing DATA-owned `projectValidatedDataInputForFintech()` boundary rather than recreating provider/DQ logic. A successful feature contract preserves:

- exact `assetId`;
- exact `correlationId`;
- `validated-data-input/1.0.0` source contract identity;
- target `ScoringModelRegistry` model and existing `featureContractVersion`;
- provider and provider-feed identity;
- source evidence ID;
- observed/retrieved/freshness timestamps;
- admitted DATA status.

The mapping creates no calculated substitute value. It is one-to-one from one accepted DATA numeric observation to one explicitly named financial feature. The boundary fails closed for stale/missing/unknown/non-computable/incomplete provenance, missing/ambiguous source fields, duplicate feature keys and duplicate reuse of one source field.

## FIN-20 implementation

`src/platform/Scoring/FintechScoringTraceLineage.ts` adds `fintech-scoring-trace-lineage/1.0.0`.

A lineage is `READY` only when all of the following are true:

1. FIN-12 produced an admitted, provenance-complete feature mapping.
2. `CanonicalScoreResult` is `READY` for the exact same `assetId`.
3. Score `featureVersion` equals the FIN-12 target feature-contract version.
4. Registry/model/executor identifiers equal the FIN-12 resolved model.
5. Every FIN-12 source evidence ID is still present in canonical scoring evidence.
6. Dispatcher, result-contract and scoring versions are explicit.
7. FIN-17 backend ranking contains exactly one entry for the same asset.
8. Ranked feature/scoring/dispatcher/registry/model/executor/result metadata exactly matches the canonical score.
9. Ranked canonical score equals the canonical score value used by `CrossAssetRanking`.

Any mismatch returns `LINEAGE_NOT_COMPUTABLE`; no best-effort or inferred lineage is emitted.

## OPS boundary

The FIN-20 output contains an evidence-only `opsTraceHandoff` with:

- `targetProject = CAPITAL-AI-OPS`;
- `targetPvc = PVC-18`;
- exact FINTECH correlation ID;
- stable FINTECH source-lineage identity;
- source evidence IDs retained from DATA/scoring;
- source timestamp;
- explicit `STRICT_IDENTITY_CORRELATION` binding requirement.

This is deliberately not an `OperationalTraceStateSourceRecord` and it does not publish EventMesh events. The existing OPS contract requires the actual returned EventContract identity/correlation/timestamp before the operational projection can become current. That provider/runtime step remains owner-correct OPS work.

## Negative-path evidence encoded in tests

`tests/unit/fintechValidatedFeatureLineage.test.ts` covers:

- successful current DATA identity/provenance → target feature-contract mapping;
- stale DATA fails closed and emits no feature contract;
- one source observation cannot be silently double-counted under two feature names;
- exact DATA evidence/correlation survives feature → canonical score → rank → OPS handoff;
- canonical scoring that drops the DATA evidence identity fails closed;
- missing exact backend rank fails closed.

## Changed implementation surface

- `src/platform/Scoring/ValidatedFinancialFeatureContract.ts`
- `src/platform/Scoring/FintechScoringTraceLineage.ts`
- `src/platform/Scoring/index.ts`
- `tests/unit/fintechValidatedFeatureLineage.test.ts`
- `docs/projects/fintech/ROADMAP.md`
- `docs/projects/fintech/TASK_REGISTER.md`
- this evidence file

## Validation truth

Pre-PR TypeScript/Vitest execution is `NOT RUN` on the current ChatGPT GitHub-connector surface because it exposes repository mutations/reads but no dependency-complete local execution host. `NOT RUN` is not treated as PASS. The focused unit test and independent hosted repository checks are intended to execute only after correlation-gated Draft PR creation, consistent with the repository cost/CI lifecycle.

## Owner-return conclusion

FINTECH has a current-main-rematerialized, fail-closed contract for preserving accepted DATA identity/provenance into a versioned feature mapping and verifying that the same evidence reaches canonical score and backend ranking. The resulting handoff carries the exact source identities/correlation needed by the existing OPS strict-binding surface without assuming PVC-18 authority. Compliance reassessment remains downstream of integration plus the owner-correct OPS trace/evidence return.
