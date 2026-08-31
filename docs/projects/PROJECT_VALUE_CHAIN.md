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
2. Cross-cutting projects do not acquire Primary ownership by observing or validating a stage.
3. `PVC-05` does not absorb Supervisor, Version, Release, Production or EventMesh execution.
4. `PVC-11 -> PVC-12` is the Data-to-FinTech project handoff; missing/failed DQ evidence remains fail-closed.
5. `PVC-16 -> PVC-17` preserves canonical scoring before ranking/decision support.
6. `PVC-18` transports/retains traceability; it does not authorize business decisions, merge, release or deployment.
7. No implicit `PVC-19` is introduced by Governance, Quality, Security, Compliance, Frontend, SEO, Social or Knowledge projections.

## Transitional repository state

Current main contains `docs/projects/agent-client/**` using an older unqualified `VC-01` project label. That content remains until `CAPITAL-AI-CLIENT` migrates its own project documentation to `PVC-01`. Governance defines the namespace here but does not edit the foreign CLIENT project on its behalf.

The same owner-controlled migration rule applies to OPS, DOC, DATA and FINTECH project surfaces.
