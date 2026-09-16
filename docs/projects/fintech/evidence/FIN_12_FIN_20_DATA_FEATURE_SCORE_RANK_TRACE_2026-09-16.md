# FIN-12 / FIN-20 — preparatory DATA → Feature → Score → Rank lineage evidence

**Date:** 2026-09-16  
**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `docs/projects/fintech/`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Owned PVC:** `PVC-12..PVC-17`  
**Current-main correlation baseline:** `main@8d2c0c2b5cc815f332f184c2927940406bbc132a`  
**Branch:** `agent/fintech-fin12-fin20-lineage-20260916`  
**Requirement:** `REQ-COMP-034`  
**Disposition:** `PREPARATORY_ONLY / DATA_RETURN_REQUIRED / NOT_EXIT_EVIDENCE`

## Current-main correction

PR #1004 was Human-merged after this branch was originally created. Current main now records FIN-12 as `PARTIAL / P1 — SELECTED / DATA CONTRACT RETURN REQUIRED` and explicitly holds productive FINTECH continuation until `CAPITAL-AI-DATA / PVC-09..11` returns complete validated field/history semantics for the productive champion feature inputs.

Accordingly, this branch no longer claims that FIN-12, FIN-20 or REQ-COMP-034 is complete. The canonical `README.md`, `ROADMAP.md`, `TASK_REGISTER.md` and `WORK_PACKAGES.md` remain exactly at current-main state. The older branch-local state that marked FIN-12/FIN-20 `IMPLEMENTED_BRANCH` is superseded by the current-main correlation and is not merge evidence.

## Preparatory implementation retained

`src/platform/Scoring/ValidatedFinancialFeatureContract.ts` defines a fail-closed mapping helper for DATA observations that are already admitted by the existing DATA-owned `FintechDataHandoff`. It performs no provider normalization, Data Quality decision, feature estimation or synthetic fallback. A successful mapping preserves asset/correlation identity, provider/feed, evidence identity, timestamps, freshness and the target model feature-contract version. Missing, stale, ambiguous or reused observations fail closed.

`src/platform/Scoring/FintechScoringTraceLineage.ts` defines a fail-closed lineage checker that verifies one already-admitted feature mapping against `CanonicalScoreResult` and the existing FIN-17 backend ranking projection. It emits only an `EVIDENCE_ONLY` OPS handoff descriptor; it does not publish EventMesh events, create `OperationalTraceStateSourceRecord`, or take PVC-18 authority.

These modules are intentionally **not exported from the canonical `src/platform/Scoring/index.ts` barrel in this correction** and no productive scoring/ranking route is wired to them. They remain bounded preparatory code until the required DATA return is integrated and FIN-12 is re-correlated from then-current main.

## Validation scope

`tests/unit/fintechValidatedFeatureLineage.test.ts` is fixture-level negative/positive contract coverage only. It demonstrates that the preparatory helpers:

- preserve exact identity/correlation/evidence for an already-valid numeric observation;
- fail closed for stale DATA;
- reject silent reuse of one source observation as multiple features;
- preserve evidence through canonical score and backend ranking fixtures;
- fail closed when scoring drops the required DATA evidence identity; and
- fail closed when the exact backend rank is absent.

The tests do **not** prove complete productive champion feature coverage. In particular, they do not satisfy the current-main DATA-return requirements for crypto market-cap/volume/supply, traditional fundamentals, productive crypto/traditional validated-history semantics, or signed sovereign-yield semantics.

## Owner boundaries

- `CAPITAL-AI-DATA / PVC-09..11` remains owner of ingress, evidence/provenance, freshness and Data Quality semantics.
- `CAPITAL-AI-FINTECH / PVC-12..17` remains owner of feature/scoring/ranking processing after accepted DATA input exists.
- `CAPITAL-AI-OPS / PVC-18` remains owner of EventMesh / operational traceability.
- `CAPITAL-AI-COMP` remains owner of REQ-COMP-034 reassessment.

No foreign-owner work is marked complete by this evidence.

## Validation truth

The original PR head `2e146d8b78227b237018cd0b8e96b6cd62f4d05a` completed its hosted CI, Governance and Container Security workflows successfully. Those checks predate the current-main merge correction and are not reused as exact-head PASS for the corrected head. New exact-head hosted status must be read after the branch update; `NOT RUN` or pending is never reported as `PASS`.

## Exit condition for future FIN-12 / FIN-20 continuation

FIN-12 productive binding resumes only after the DATA-owned return described on current main is integrated. Then-current correlation must prove that every productive champion feature input can consume canonical validated DATA semantics without FINTECH-local provider/DQ bypass. FIN-20 can then be reassessed against the actual FIN-12 bindings and owner-correct OPS trace return. Until that point, this file is preparatory evidence only and MUST NOT be used to close REQ-COMP-034.