# CAPITAL-AI-FINTECH

**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `fintech`  
**Canonical project path:** `docs/projects/fintech/`  
**Role:** `PRIMARY_VALUE_CHAIN_OWNER`  
**Primary Project Value Chain ownership:** `PVC-12` through `PVC-17`  
**Current-main synchronization baseline:** `main@6ace37bffa7912ec4f224feb69dd62ff9c629192`  
**Trust root:** `/AGENTS.md`  
**Project model:** `docs/projects/README.md` + `docs/projects/PROJECT_VALUE_CHAIN.md`

## Purpose

CAPITAL-AI-FINTECH owns the organizational execution chain from Financial Feature Engineering through Ranking / Decision Support. It reuses the existing technical scoring authorities and does not create a second registry, dispatcher, score-result contract, entitlement authority or ranking architecture.

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

`PVC-*` is the organizational project-routing namespace. It does not renumber or supersede the technical `VC-*` stages under `SC-MD-SPT-0001`.

## Runtime reuse

FINTECH reuses, among other existing runtime assets:

- `src/platform/Scoring/ScoringModelRegistry.ts`;
- `src/platform/Scoring/ScoringDispatcher.ts`;
- `src/platform/Scoring/ScoringExecutorAdapters.ts`;
- `src/types/scoringIntegrity.ts`;
- `src/platform/Ranking/contracts.ts`;
- `src/platform/Ranking/CrossAssetRanking.ts`;
- `src/services/ranking.service.ts`.

Project organization does not relocate runtime merely to match `docs/projects/fintech/`.

## Boundaries

- `CAPITAL-AI-DATA` retains `PVC-09..11`: UAI / Data Ingestion, Evidence Management and Data Quality.
- `CAPITAL-AI-OPS` retains `PVC-18`: EventMesh / Traceability and repository delivery/operations lifecycle.
- `CAPITAL-AI-FE` is a presentation consumer. Its canonical project folder is `docs/projects/frontend/`; it receives foreign handoffs for presentation-only changes such as removal of frontend-local ranking ordering or bearer-aware consumer integration.
- `CAPITAL-AI-QM`, `CAPITAL-AI-SEC` and `CAPITAL-AI-COMP` are cross-cutting validation/requirement/assessment projects and acquire no FINTECH PVC ownership through those roles.
- Canonical cross-cutting project folders are resolved from `docs/projects/README.md`; current routes include `docs/projects/quality-management/`, `docs/projects/security/`, `docs/projects/compliance/` and `docs/projects/frontend/`.

## Current Security handoff state

Merged OPS PR #694 completed `OPS-02-SEC-06`, the parent inventory for Security finding `S1-R2-06 — Entitlement authority`. The former conditional dependency is now concrete FINTECH work:

- `FIN-SEC-02 / PVC-16` — canonical verified-score/context/batch routes must consume the accepted `verified_screening` server entitlement/quota boundary;
- `FIN-SEC-03 / PVC-15` — Backtest and Monte Carlo need authoritative protected-execution decisions, `full_ai_analysis` needs an explicit productive binding, and the existing Buffett server authority must be preserved while consumer integration is corrected through the proper downstream handoff.

Both remain `REFERRED_NOT_EXECUTED` until separately implemented on scoped FINTECH work items. `CAPITAL-AI-SEC` retains independent Security verification and `VERIFIED/CLOSED` authority.

See `SECURITY_HANDOFFS.md`, `CROSS_PROJECT_DEPENDENCIES.md` and `TASK_REGISTER.md`.

## Current execution priorities

1. Finish the current-main project-surface sync (`FIN-SYNC-01`).
2. Execute the newly triggered `FIN-SEC-02` / `FIN-SEC-03` Security child remediations as separate P1/HIGH work items.
3. Continue `FIN-17` ranking-authority consolidation.
4. Continue `FIN-12` validated DATA → feature-contract boundary.
5. Keep `FIN-19` provider capability projection synchronized to the canonical DATA/provider surface without taking over provider ingress.

## Canonical project documents

- `ROADMAP.md`
- `PVC_OWNERSHIP.md`
- `WORK_PACKAGES.md`
- `TASK_REGISTER.md`
- `CROSS_PROJECT_DEPENDENCIES.md`
- `SECURITY_HANDOFFS.md`
- `PROVIDER_CAPABILITY_MATRIX.md`
- `MIGRATION_MATRIX.md`
- `VALIDATION_REPORT.md`
- `evidence/`

The older `docs/fintech/CAPITAL-AI-FINTECH/**` package remains a supporting inventory/evidence source during migration; `docs/projects/fintech/` is the canonical organizational project execution entry point.
