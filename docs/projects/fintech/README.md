# CAPITAL-AI-FINTECH

**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `fintech`  
**Role:** `PRIMARY_VALUE_CHAIN_OWNER`  
**Primary Project Value Chain ownership:** `PVC-12` through `PVC-17`  
**Current-main synchronization baseline:** `main@1f55340d89178fb5c1ab735242f42c263918b692`  
**Trust root:** `/AGENTS.md`  
**Project model:** `docs/projects/README.md` + `docs/projects/PROJECT_VALUE_CHAIN.md`

## Purpose

CAPITAL-AI-FINTECH owns the organizational execution chain from Financial Feature Engineering through Ranking / Decision Support. It reuses the existing technical scoring authorities and does not create a second registry, dispatcher, score-result contract or ranking architecture.

```text
CAPITAL-AI-DATA / PVC-09..11
  -> validated input / evidence / DQ
CAPITAL-AI-FINTECH / PVC-12..17
  -> Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor
  -> CanonicalScoreResult
  -> Ranking / Decision Support
CAPITAL-AI-OPS / PVC-18
  -> EventMesh / Traceability
```

## Primary PVC ownership

| Stage | Capability |
|---|---|
| `PVC-12` | Feature Engineering |
| `PVC-13` | Scoring Models |
| `PVC-14` | Scoring Orchestration |
| `PVC-15` | Domain Analysis / Domain Executor |
| `PVC-16` | Canonical Scoring |
| `PVC-17` | Ranking / Decision Support |

`PVC-*` is the organizational project-routing namespace. It does **not** renumber or supersede the technical `VC-*` stages under `SC-MD-SPT-0001`.

## Runtime reuse

FINTECH reuses:

- `src/platform/Scoring/ScoringModelRegistry.ts`;
- `src/platform/Scoring/ScoringDispatcher.ts`;
- `src/platform/Scoring/ScoringExecutorAdapters.ts`;
- `src/types/scoringIntegrity.ts`;
- `src/platform/Ranking/contracts.ts`;
- `src/platform/Ranking/CrossAssetRanking.ts`;
- `src/services/ranking.service.ts`.

No runtime implementation is moved merely to match the organizational project folder.

## Boundaries

- `CAPITAL-AI-DATA` retains `PVC-09..11`: UAI / Data Ingestion, Evidence Management and Data Quality.
- `CAPITAL-AI-OPS` retains `PVC-18`: EventMesh / Traceability and the repository delivery/operations lifecycle.
- `CAPITAL-AI-FE` is a presentation consumer and receives a separate handoff for removal of frontend-local ranking business ordering.
- `CAPITAL-AI-QM`, `CAPITAL-AI-SEC` and `CAPITAL-AI-COMP` are cross-cutting validation/requirement/assessment projects and acquire no FINTECH PVC ownership through those roles.

## Security handoff integration

Security source: CAPITAL-AI-SEC PR #631, merged at `b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6`; the current main additionally contains PR #632 and is `1f55340d89178fb5c1ab735242f42c263918b692`.

Security owns requirements, findings, negative-test expectations and independent verification. FINTECH owns implementation/evidence only where a concrete item affects `PVC-12..17` FINTECH code.

Current correlation finds **no concrete open Security finding directly routed to CAPITAL-AI-FINTECH**. S1-R2-06 may create a future child handoff if the OPS entitlement inventory identifies FINTECH-owned protected capability code. Such a child item remains `REFERRED_NOT_EXECUTED` until explicitly implemented and may only become Security `VERIFIED/CLOSED` after independent CAPITAL-AI-SEC verification.

See `SECURITY_HANDOFFS.md`.

## Canonical project documents

- `ROADMAP.md`
- `PVC_OWNERSHIP.md`
- `WORK_PACKAGES.md`
- `CROSS_PROJECT_DEPENDENCIES.md`
- `SECURITY_HANDOFFS.md`
- `MIGRATION_MATRIX.md`
- `VALIDATION_REPORT.md`
- `evidence/SECURITY_HANDOFF_CORRELATION_2026-08-31.md`

The older `docs/fintech/CAPITAL-AI-FINTECH/**` package remains a detailed supporting inventory/evidence source during migration; this `docs/projects/fintech/` surface is the canonical organizational project execution entry point.