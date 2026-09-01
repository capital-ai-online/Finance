# CAPITAL-AI-FINTECH — PVC Ownership

**Baseline:** `main@6ace37bffa7912ec4f224feb69dd62ff9c629192`

## Canonical organizational ownership

| Project stage | Meaning | Primary Owner |
|---|---|---|
| `PVC-09` | UAI / Data Ingestion | CAPITAL-AI-DATA |
| `PVC-10` | Evidence Management | CAPITAL-AI-DATA |
| `PVC-11` | Data Quality | CAPITAL-AI-DATA |
| `PVC-12` | Feature Engineering | CAPITAL-AI-FINTECH |
| `PVC-13` | Scoring Models | CAPITAL-AI-FINTECH |
| `PVC-14` | Scoring Orchestration | CAPITAL-AI-FINTECH |
| `PVC-15` | Domain Analysis / Executor | CAPITAL-AI-FINTECH |
| `PVC-16` | Canonical Scoring | CAPITAL-AI-FINTECH |
| `PVC-17` | Ranking / Decision Support | CAPITAL-AI-FINTECH |
| `PVC-18` | EventMesh / Traceability | CAPITAL-AI-OPS |

This mapping is derived from current `docs/projects/PROJECT_VALUE_CHAIN.md` / `docs/projects/README.md` and is an organizational routing projection only.

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

FINTECH owns business semantics and productive implementation for PVC-12..17 only. DATA remains upstream; OPS remains downstream; Security/Quality/Compliance/Frontend remain cross-cutting or consumer roles and receive no Primary PVC ownership through this mapping.

The S1-R2-06 child handoffs currently routed to FINTECH affect PVC-15 and PVC-16, but they do not change this ownership model or transfer Security verification authority.
