# CAPITAL-AI Project Value Chain (PVC)

**Namespace:** `PVC-*`  
**Role:** organizational project ownership projection — non-authorizing  
**Runtime impact:** none  
**Authority impact:** none  
**Development trust root:** `/AGENTS.md@CURRENT_MAIN`

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
| `PVC-09` | UAI / Data Ingestion | `CAPITAL-AI-FINTECH` |
| `PVC-10` | Evidence Management | `CAPITAL-AI-FINTECH` |
| `PVC-11` | Data Quality | `CAPITAL-AI-FINTECH` |
| `PVC-12` | Feature Engineering | `CAPITAL-AI-FINTECH` |
| `PVC-13` | Scoring Models | `CAPITAL-AI-FINTECH` |
| `PVC-14` | Scoring Orchestration | `CAPITAL-AI-FINTECH` |
| `PVC-15` | Domain Analysis / Executor | `CAPITAL-AI-FINTECH` |
| `PVC-16` | Canonical Scoring | `CAPITAL-AI-FINTECH` |
| `PVC-17` | Ranking / Decision Support | `CAPITAL-AI-FINTECH` |
| `PVC-18` | EventMesh / Traceability | `CAPITAL-AI-OPS` |

`CAPITAL-AI-DATA` is superseded as an independent Project Owner. Historical references to its former `PVC-09..11` ownership remain evidence only; current routing for those stages is `CAPITAL-AI-FINTECH`.

## Boundary invariants

1. Every PVC stage has exactly one Primary Project Owner.
2. Cross-cutting projects do not acquire Primary ownership by observing, validating, constraining, presenting or handing off work for a stage.
3. Project/PVC ownership is resolved from current main; no executor, chat, branch, PR, EventMesh state or presentation metadata may invent or transfer ownership.
4. Work whose Authority or implementation belongs to another project creates the owner-correct handover required by `/AGENTS.md@CURRENT_MAIN`; it is not silently taken over by GOV, OPS, SEC or another foreign project.
5. `CAPITAL-AI-SEC` owns no productive PVC stage and evaluates Security `SECURITY_FOUNDATION_FIRST`; Security findings/requirements remain cross-cutting constraints and foreign implementation is handed to the resolved owner unless the implementation itself is canonically SEC-owned.
6. `CAPITAL-AI-QM` remains independent Quality authority; product-layer priority cannot override its Quality verdict.
7. `CAPITAL-AI-FINTECH` owns `PVC-09..17`, including provider ingress/evidence/Data Quality organizational routing plus Domain/Scoring authority for its downstream stages; Frontend cannot define FinTech truth.
8. COMP/Supply-Chain remains obligation/control-first; product-layer priority cannot override Compliance obligations.
9. `PVC-11 -> PVC-12` is an internal FINTECH fail-closed Data-to-Feature boundary; missing/failed DQ evidence remains fail-closed.
10. `PVC-16 -> PVC-17` preserves canonical scoring before ranking/decision support.
11. `PVC-18` is a read-only Runtime/Evidence/Traceability projection for development handover visibility; it does not approve, merge, mutate Authority, replace `/AGENTS.md` or authorize business/release/deployment decisions.
12. No implicit `PVC-19` is introduced by Governance, Quality, Security, Compliance, Frontend, SEO, Social or Knowledge projections.

## Development execution model

The PVC defines ownership and routing only. It is **not** a development lifecycle.

All development execution across `PVC-01..18` resolves exclusively through `/AGENTS.md@CURRENT_MAIN`. Historical DevelopmentChain, bounded foreign-execution delegation, standalone PR/CI sequencing and other procedural overlays have no execution or fallback role.

A relationship may be classified as `primary_pvc`, `cross_cutting` or `foreign_execution`. `foreign_execution` is a relationship classification, not permission to seize foreign Owner scope. If implementation/Authority belongs elsewhere, the current project emits an owner-correct correlation-ID handover with dependencies, evidence, exit gate and continuation condition as required by the trust root.

## Transitional repository state

Historical/current documents may temporarily contain stale references to superseded procedure or former DATA ownership. Such text is migration drift only and cannot override `/AGENTS.md@CURRENT_MAIN`. Current organizational projections MUST be reconciled to `CAPITAL-AI-FINTECH / PVC-09..17`; immutable historical evidence may retain the former mapping for provenance.
