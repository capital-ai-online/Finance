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

- `src/platform/Scoring/ScoringModelRegistry.ts`;
- `src/platform/Scoring/ScoringDispatcher.ts`;
- `src/platform/Scoring/ScoringExecutorAdapters.ts`;
- `src/types/scoringIntegrity.ts`;
- `src/platform/Ranking/contracts.ts`;
- `src/platform/Ranking/CrossAssetRanking.ts`;
- `src/services/ranking.service.ts`.

Project organization does not relocate runtime merely to match `docs/projects/fintech/`.

## Boundaries

- `CAPITAL-AI-DATA` retains `PVC-09..11`: UAI / Data Ingestion, Evidence Management and Data Quality. FINTECH consumes validated exits but does not extend provider-specific normalization, provenance or DQ locally.
- `CAPITAL-AI-OPS` retains `PVC-18`: EventMesh / Traceability and repository delivery/operations lifecycle.
- `CAPITAL-AI-FE` is a presentation consumer. Its canonical project folder is `docs/projects/frontend/`; the FIN-17 backend-order consumer cutover is Human-merged and terminal for the current ranking-authority split.
- `CAPITAL-AI-QM`, `CAPITAL-AI-SEC` and `CAPITAL-AI-COMP` are cross-cutting validation/requirement/assessment projects and acquire no FINTECH PVC ownership through those roles.
- Canonical cross-cutting project folders are resolved from `docs/projects/README.md`; current routes include `docs/projects/quality-management/`, `docs/projects/security/`, `docs/projects/compliance/` and `docs/projects/frontend/`.

## Current Security handoff state

Merged OPS PR #694 completed `OPS-02-SEC-06`, the parent inventory for Security finding `S1-R2-06 — Entitlement authority`. The two FINTECH children have target-local implementation evidence:

- `FIN-SEC-02 / PVC-16` — `IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED` for the canonical `verified_screening` server entitlement/quota boundary;
- `FIN-SEC-03 / PVC-15` — `IMPLEMENTED / EVIDENCE_READY / SECURITY VERIFICATION REQUESTED`; Human merge of PR #929 materialized Backtest and Monte Carlo server-authoritative protected-execution decisions, bound `full_ai_analysis` to the real structured portfolio-review executor with fail-closed unavailability, and preserved the existing Buffett server authority. Merge provenance: `PR #929` / `103689c2f30536e573b7958f63b503ca428f69cf`.

`CAPITAL-AI-SEC` retains independent Security verification and `VERIFIED/CLOSED` authority. FINTECH does not self-close `S1-R2-06`. FIN-SEC-03 details are recorded in `evidence/FIN_SEC_03_PAID_ANALYSIS_ENTITLEMENT_2026-09-15.md`.

## FIN-17 terminal state

The previous FIN-17 P1 blocker is complete on current main:

- backend FINTECH rank/order authority: Human-merged PR #946 (`c8a88afc7f9cfad367b592e9567654451f81e436`);
- FE `RankingBoard` backend-order consumer cutover: Human-merged PR #951 (`3aa41faa2742dfc2601339b000e660f271380cf1`);
- evidence: `evidence/FIN_17_BACKEND_RANKING_AUTHORITY_2026-09-15.md`.

FIN-17 is `DONE_MAIN / TERMINAL` for this bounded authority split and is not reopened as current implementation work.

## Current execution priorities

1. Independent Security verification remains open for FIN-SEC-02 and FIN-SEC-03; their FINTECH implementation/test artifacts are `EVIDENCE_READY`.
2. `FIN-12` is the selected FINTECH P1 item. Current-main correlation found that the existing DATA validated exit is necessary but not yet sufficient for every productive champion feature input.
3. FINTECH is dependency-held at the `CAPITAL-AI-DATA / PVC-09..11` ownership boundary until canonical validated coverage exists for productive crypto market-cap/volume/supply fields, traditional fundamentals, productive crypto/traditional history consumers and signed sovereign-yield value semantics. Exact evidence: `evidence/FIN_12_VALIDATED_FEATURE_BOUNDARY_RECORRELATION_2026-09-16.md`.
4. After the DATA return lands on then-current main, complete FIN-12 feature-contract bindings and focused fail-closed compatibility tests, then continue `FIN-20` end-to-end lineage.
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