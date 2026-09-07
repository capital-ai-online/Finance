# CAPITAL-AI Project Value Chain (PVC)

**Namespace:** `PVC-*`  
**Role:** organizational project ownership projection — non-authorizing  
**Runtime impact:** none  
**Authority impact:** none

## Namespace contract

`PVC-01` through `PVC-18` identify **project ownership and cross-project routing stages**. They do not replace the current technical financial stage identifiers governed by `SC-MD-SPT-0001`.

Until a separately authorized multi-project namespace migration is completed:

- `PVC-*` = Project Value Chain / project routing;
- current `VC-*` under `SC-MD-SPT-0001` = existing technical financial chain;
- project documentation must not silently substitute one namespace for the other;
- runtime manifests/tests/Quality projections remain unchanged by this document.

## Canonical Project Value Chain

| PVC | Stage | Primary Project Owner |
|---|---|---|
| `PVC-01` | Agent Client | `CAPITAL-AI-CLIENT` |
| `PVC-02` | Controlled Implementation | `CAPITAL-AI-OPS` |
| `PVC-03` | Documentary Engine | `CAPITAL-AI-DOC` |
| `PVC-04` | Supervisor | `CAPITAL-AI-OPS` |
| `PVC-05` | Platform Director | `CAPITAL-AI-GOV` |
| `PVC-06` | Version Management | `CAPITAL-AI-OPS` |
| `PVC-07` | Release Management | `CAPITAL-AI-OPS` |
| `PVC-08` | Production Operations | `CAPITAL-AI-OPS` |
| `PVC-09` | UAI / Data Ingestion | `CAPITAL-AI-DATA` |
| `PVC-10` | Evidence Management | `CAPITAL-AI-DATA` |
| `PVC-11` | Data Quality | `CAPITAL-AI-DATA` |
| `PVC-12` | Feature Engineering | `CAPITAL-AI-FINTECH` |
| `PVC-13` | Scoring Models | `CAPITAL-AI-FINTECH` |
| `PVC-14` | Scoring Orchestration | `CAPITAL-AI-FINTECH` |
| `PVC-15` | Domain Analysis / Executor | `CAPITAL-AI-FINTECH` |
| `PVC-16` | Canonical Scoring | `CAPITAL-AI-FINTECH` |
| `PVC-17` | Ranking / Decision Support | `CAPITAL-AI-FINTECH` |
| `PVC-18` | EventMesh / Traceability | `CAPITAL-AI-OPS` |

## Boundary invariants

1. Every PVC stage has exactly one Primary Project Owner.
2. Cross-cutting projects do not acquire Primary ownership by observing, validating or executing a delegated work package for a stage.
3. `PVC-05` does not acquire Supervisor, Version, Release, Production or EventMesh ownership/authority. Under `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION`, `CAPITAL-AI-GOV` may execute a bounded foreign-project work package while the mapped Target Project/PVC remains the Primary Owner.
4. `CAPITAL-AI-OPS` may likewise execute bounded work packages for another Target Project under `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION`; this does not alter the canonical PVC mapping or Target Project authority.
5. `PVC-11 -> PVC-12` is the Data-to-FinTech project handoff; missing/failed DQ evidence remains fail-closed.
6. `PVC-16 -> PVC-17` preserves canonical scoring before ranking/decision support.
7. `PVC-18` transports/retains traceability; it does not authorize business decisions, merge, release or deployment.
8. No implicit `PVC-19` is introduced by Governance, Quality, Security, Compliance, Frontend, SEO, Social or Knowledge projections.

## Execution delegation vs ownership

The canonical owner in this file answers **who owns the target work/domain**. It does not require that only that project's chat/executor may perform every repository edit.

`CAPITAL-AI-GOV` and `CAPITAL-AI-OPS` may execute bounded foreign-project work under `docs/governance/GOV_OPS_FOREIGN_PROJECT_EXECUTION_POLICY.md`. For such work, Target Project/PVC/Primary Owner, target Roadmap scope, applicable ADR/ESS/contracts, branch/PR project identity, assurance authority and protected-action boundaries remain those of the Target Project unless another higher/effective authority explicitly changes them.

## Transitional repository state

Current main contains project surfaces that may still use older ownership-only routing language or an older unqualified `VC-*` project label. Those surfaces are migrated by their mapped Primary Owner or, for bounded implementation work, may now be migrated by `CAPITAL-AI-GOV` or `CAPITAL-AI-OPS` under `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION` while preserving the canonical Target Project identity and contracts.
