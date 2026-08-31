# CAPITAL-AI-FINTECH — Project Migration Matrix

Baseline: `main@1f55340d89178fb5c1ab735242f42c263918b692`

`docs/projects/fintech/` is the canonical organizational execution surface. Existing technical/runtime locations remain unchanged unless a separately justified implementation change requires movement.

| Existing surface | New project surface | Disposition |
|---|---|---|
| `docs/fintech/CAPITAL-AI-FINTECH/README.md` | `docs/projects/fintech/README.md` | supporting legacy/detail entry -> canonical project entry |
| `docs/fintech/CAPITAL-AI-FINTECH/ROADMAP.md` | `docs/projects/fintech/ROADMAP.md` | detailed V2 source -> canonical PVC roadmap |
| `docs/fintech/CAPITAL-AI-FINTECH/mappings/VALUE_CHAIN_OWNERSHIP.md` | `docs/projects/fintech/PVC_OWNERSHIP.md` | old target-VC projection superseded by explicit `PVC-*` namespace |
| `docs/fintech/CAPITAL-AI-FINTECH/handoffs/CROSS_PROJECT_HANDOFFS.md` | `docs/projects/fintech/CROSS_PROJECT_DEPENDENCIES.md` | unqualified/range markers normalized to structured PVC routing |
| `docs/fintech/CAPITAL-AI-FINTECH/work-packages/FINTECH_WORKSTREAMS_V2.md` | `docs/projects/fintech/WORK_PACKAGES.md` | FIN workstreams retained and bound to PVC stages |
| `docs/fintech/CAPITAL-AI-FINTECH/reports/FINTECH_V2_VALIDATION_2026-08-31.md` | `docs/projects/fintech/VALIDATION_REPORT.md` | validation refreshed against current main and Security handoff |
| Security PR #631 sources | `docs/projects/fintech/SECURITY_HANDOFFS.md` + evidence correlation | target-owned Security integration without Security verification takeover |

## Technical artifacts retained in place

- `src/platform/Scoring/**`;
- `src/platform/Ranking/**`;
- `src/services/ranking.service.ts`;
- asset-class/domain executor implementations;
- provider/data implementations outside FINTECH ownership;
- Quality, Security, Compliance, Frontend and Operations runtime components.

Organizational consolidation is not a physical-runtime relocation mandate.

## Namespace correction

The earlier branch described V2 `VC-12..17` as a target numbering migration conflicting with technical `SC-MD-SPT-0001`. Current main now defines the organizational namespace as `PVC-12..17`, which resolves that ambiguity without renumbering the technical chain.

Therefore:

- old target `VC-12..17` project labels are superseded as project-routing identity;
- `PVC-12..17` is canonical project ownership;
- existing technical `VC-*` meanings remain current and unchanged.