# CAPITAL-AI-FINTECH

**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `fintech`  
**Canonical project path:** `docs/projects/fintech/`  
**Role:** `PRIMARY_VALUE_CHAIN_OWNER`  
**Primary Project Value Chain ownership:** `PVC-12` through `PVC-17`  
**Current-main synchronization baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
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

- `src/platform/MarketData/ValidatedDataInput.ts` and `FintechDataHandoff.ts` as the DATA-owned upstream boundary;
- `src/platform/Scoring/ScoringModelRegistry.ts`;
- `src/platform/Scoring/ScoringDispatcher.ts`;
- `src/platform/Scoring/ScoringExecutorAdapters.ts`;
- `src/platform/Scoring/ValidatedFinancialFeatureContract.ts`;
- `src/platform/Scoring/FintechScoringTraceLineage.ts`;
- `src/types/scoringIntegrity.ts`;
- `src/platform/Ranking/contracts.ts`;
- `src/platform/Ranking/CrossAssetRanking.ts` and `BackendRankingProjection.ts`.

Project organization does not relocate runtime merely to match `docs/projects/fintech/`.

## Boundaries

- `CAPITAL-AI-DATA` retains `PVC-09..11`: UAI / Data Ingestion, Evidence Management and Data Quality.
- `CAPITAL-AI-OPS` retains `PVC-18`: EventMesh / Traceability and repository delivery/operations lifecycle. FINTECH supplies evidence-only lineage inputs but does not publish or project OPS state on its own.
- `CAPITAL-AI-FE` is a presentation consumer. Its canonical project folder is `docs/projects/frontend/`; it receives foreign handoffs for presentation-only changes.
- `CAPITAL-AI-QM`, `CAPITAL-AI-SEC` and `CAPITAL-AI-COMP` are cross-cutting validation/requirement/assessment projects and acquire no FINTECH PVC ownership through those roles.
- Canonical cross-cutting project folders are resolved from `docs/projects/README.md`.

## Current Security handoff state

- `FIN-SEC-02 / PVC-16` — `IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED` for the canonical `verified_screening` server entitlement/quota boundary.
- `FIN-SEC-03 / PVC-15` — `IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED`; Human merge of PR #929 materialized Backtest and Monte Carlo server-authoritative protected-execution decisions and bound `full_ai_analysis` to the real structured portfolio-review executor with fail-closed unavailability.

`CAPITAL-AI-SEC` retains independent Security verification and `VERIFIED/CLOSED` authority. FINTECH does not self-close Security findings.

## Current execution state

- `FIN-17` is `DONE_MAIN` via PR #946 / merge `c8a88afc7f9cfad367b592e9567654451f81e436`; backend `CrossAssetRanking` is the productive FINTECH rank/order authority.
- `FIN-12 + FIN-20` is the active REQ-COMP-034 owner-return package on `agent/fintech-fin12-fin20-lineage-20260916`, rematerialized from current main rather than from the stale historical FIN-12 branch.
- FIN-12 maps only DATA-admitted numeric observations one-to-one into the resolved existing model feature-contract version while retaining evidence/freshness/correlation metadata.
- FIN-20 verifies the same DATA evidence IDs through canonical scoring and the FIN-17 backend rank, then emits an evidence-only strict-binding handoff for OPS/PVC-18.
- `FIN-19` remains the next ordinary provider-capability follow-on after the current owner-return boundary unless then-current evidence changes priority.

See `ROADMAP.md`, `TASK_REGISTER.md` and `evidence/FIN_12_FIN_20_DATA_FEATURE_SCORE_RANK_TRACE_2026-09-16.md`.

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
