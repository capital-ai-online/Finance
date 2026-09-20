# CAPITAL-AI-FINTECH — Value Chain Ownership Mapping

Status: `SUPERSEDED AS PROJECT-ROUTING MAP / RETAINED FOR TRACEABILITY`

The initial V2 branch used unqualified target `VC-12..VC-17` project labels. Current main now defines the organizational Project Value Chain as the qualified `PVC-*` namespace.

Canonical current mapping:

`docs/projects/fintech/PVC_OWNERSHIP.md`

Current ownership is:

- `PVC-09` UAI / Data Ingestion -> CAPITAL-AI-FINTECH
- `PVC-10` Evidence Management -> CAPITAL-AI-FINTECH
- `PVC-11` Data Quality -> CAPITAL-AI-FINTECH
- `PVC-12` Feature Engineering -> CAPITAL-AI-FINTECH
- `PVC-13` Scoring Models -> CAPITAL-AI-FINTECH
- `PVC-14` Scoring Orchestration -> CAPITAL-AI-FINTECH
- `PVC-15` Domain Analysis / Executor -> CAPITAL-AI-FINTECH
- `PVC-16` Canonical Scoring -> CAPITAL-AI-FINTECH
- `PVC-17` Ranking / Decision Support -> CAPITAL-AI-FINTECH

Former DATA ownership of `PVC-09..11` is historical provenance only. Current productive routing is `CAPITAL-AI-FINTECH / PVC-09..17`; downstream `PVC-18` remains CAPITAL-AI-OPS.

Existing technical `VC-*` meanings under `SC-MD-SPT-0001` are separate and unchanged. This file must not be used to renumber them.