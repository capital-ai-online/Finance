# CAPITAL-AI-FINTECH

**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `fintech`  
**Canonical project path:** `docs/projects/fintech/`  
**Role:** `PRIMARY_VALUE_CHAIN_OWNER`  
**Primary Project Value Chain ownership:** `PVC-12` through `PVC-17`  
**Current-main synchronization baseline:** `main@5ae0fdd80b085740f92a5530c5561a06f760c7a3`  
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

Merged OPS PR #694 completed `OPS-02-SEC-06`, the parent inventory for Security finding `S1-R2-06 — Entitlement authority`. The two FINTECH children now have target-local implementation evidence:

- `FIN-SEC-02 / PVC-16` — `IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED` for the canonical `verified_screening` server entitlement/quota boundary;
- `FIN-SEC-03 / PVC-15` — `IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED`; Human merge of PR #929 materialized Backtest and Monte Carlo server-authoritative protected-execution decisions, bound `full_ai_analysis` to the real structured portfolio-review executor with fail-closed unavailability, and preserved the existing Buffett server authority. Merge provenance: `PR #929` / `103689c2f30536e573b7958f63b503ca428f69cf`; historical implementation branch: `agent/fintech-fin-sec-03-analysis-entitlement-20260915`.

`CAPITAL-AI-SEC` retains independent Security verification and `VERIFIED/CLOSED` authority. FINTECH does not self-close `S1-R2-06`. FIN-SEC-03 details are recorded in `evidence/FIN_SEC_03_PAID_ANALYSIS_ENTITLEMENT_2026-09-15.md`.

The bounded post-merge project-surface synchronization was Human-merged through PR #942 from `agent/fintech-fin-sec-03-post-merge-sync-20260915`. `FIN-17` remains selected as the next FINTECH P1 slice and is now `READY` after fresh `main@5ae0fdd80b085740f92a5530c5561a06f760c7a3` / open-writer recorrelation found no open Pull Request writers.

See `SECURITY_HANDOFFS.md`, `CROSS_PROJECT_DEPENDENCIES.md` and `TASK_REGISTER.md`.

## Current execution priorities

1. Independent Security verification remains open for FIN-SEC-02 and FIN-SEC-03; their FINTECH implementation/test artifacts are `EVIDENCE_READY`.
2. `FIN-17` is the single next FINTECH P1 slice and is `READY`; the required Human merge of PR #942 and fresh current-main/open-writer recorrelation are complete, so ranking-authority work may begin from the current baseline.
3. Re-correlate and continue `FIN-12` immediately after FIN-17; DATA has already provided the upstream `ValidatedDataInput` handoff.
4. Keep `FIN-19` provider capability projection synchronized to the canonical DATA/provider surface without taking over provider ingress.
5. Continue `FIN-20` end-to-end lineage after the P1 band unless current evidence changes the order.

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
