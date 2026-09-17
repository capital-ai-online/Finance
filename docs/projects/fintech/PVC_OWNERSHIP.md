# CAPITAL-AI-FINTECH — PVC Ownership

**Baseline:** `main@2358642ff80f128e271e02ae88401008663578b7`

## Canonical organizational ownership

| Project stage | Meaning | Primary Owner |
|---|---|---|
| `PVC-09` | UAI / Data Ingestion | CAPITAL-AI-FINTECH |
| `PVC-10` | Evidence Management | CAPITAL-AI-FINTECH |
| `PVC-11` | Data Quality | CAPITAL-AI-FINTECH |
| `PVC-12` | Feature Engineering | CAPITAL-AI-FINTECH |
| `PVC-13` | Scoring Models | CAPITAL-AI-FINTECH |
| `PVC-14` | Scoring Orchestration | CAPITAL-AI-FINTECH |
| `PVC-15` | Domain Analysis / Executor | CAPITAL-AI-FINTECH |
| `PVC-16` | Canonical Scoring | CAPITAL-AI-FINTECH |
| `PVC-17` | Ranking / Decision Support | CAPITAL-AI-FINTECH |
| `PVC-18` | EventMesh / Traceability | CAPITAL-AI-OPS |

This mapping is derived from current `docs/projects/PROJECT_VALUE_CHAIN.md` / `docs/projects/README.md` and is an organizational routing projection only. `CAPITAL-AI-DATA` is retained only as historical/compatibility terminology; it has no current Primary PVC ownership.

## Namespace separation

`PVC-*` is project-routing identity only. Existing technical `VC-*` stages under `SC-MD-SPT-0001` retain their current meanings and are never silently renumbered.

Where a handoff needs both identities, record:

- `project_namespace: PVC`;
- `project_stage: PVC-NN`;
- `technical_namespace: SC-MD-SPT-0001` and a technical `VC-*` stage only when actually applicable.

## Compatibility marker

Repository handoff compatibility still uses:

`[CROSS_PROJECT_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

The marker must be interpreted together with the explicit project namespace/stage fields and must not silently redefine technical financial VC semantics.

## FINTECH boundary

FINTECH owns productive organizational routing for PVC-09..17. PVC-09..11 retain their existing provider-ingress, evidence/provenance/freshness and Data Quality semantics; ownership consolidation does not create a second provider or DQ plane. PVC-12..17 retain Feature/Scoring/Domain/Canonical-Score/Ranking semantics. OPS remains downstream at PVC-18; Security/Quality/Compliance/Frontend remain cross-cutting or consumer roles and receive no Primary PVC ownership through this mapping.

The S1-R2-06 child handoffs currently routed to FINTECH affect PVC-15 and PVC-16, but they do not change this ownership model or transfer Security verification authority.
