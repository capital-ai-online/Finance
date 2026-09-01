# CAPITAL-AI-FINTECH — Project Migration Matrix

**Baseline:** `main@6ace37bffa7912ec4f224feb69dd62ff9c629192`

`docs/projects/fintech/` is the canonical organizational execution surface. Existing technical/runtime locations remain unchanged unless a separately justified implementation change requires movement.

| Existing surface | Current project surface | Disposition |
|---|---|---|
| `docs/fintech/CAPITAL-AI-FINTECH/README.md` | `docs/projects/fintech/README.md` | supporting legacy/detail entry -> canonical project entry |
| `docs/fintech/CAPITAL-AI-FINTECH/ROADMAP.md` | `docs/projects/fintech/ROADMAP.md` | detailed V2 source -> canonical PVC roadmap |
| `docs/fintech/CAPITAL-AI-FINTECH/mappings/VALUE_CHAIN_OWNERSHIP.md` | `docs/projects/fintech/PVC_OWNERSHIP.md` | old target-VC projection superseded by explicit `PVC-*` namespace |
| `docs/fintech/CAPITAL-AI-FINTECH/handoffs/CROSS_PROJECT_HANDOFFS.md` | `docs/projects/fintech/CROSS_PROJECT_DEPENDENCIES.md` | unqualified/range markers normalized to structured PVC routing |
| `docs/fintech/CAPITAL-AI-FINTECH/work-packages/FINTECH_WORKSTREAMS_V2.md` | `docs/projects/fintech/WORK_PACKAGES.md` + `TASK_REGISTER.md` | workstreams retained and complemented by an atomic current execution queue |
| `docs/fintech/CAPITAL-AI-FINTECH/reports/FINTECH_V2_VALIDATION_2026-08-31.md` | `docs/projects/fintech/VALIDATION_REPORT.md` | canonical current validation projection; dated historical reports remain evidence |
| Security PR #631 sources | `docs/projects/fintech/SECURITY_HANDOFFS.md` + historical evidence | baseline Security integration retained without verification takeover |
| OPS PR #694 / `OPS-02-SEC-06` | `SECURITY_HANDOFFS.md` + `CROSS_PROJECT_DEPENDENCIES.md` + `TASK_REGISTER.md` | newly triggered S1-R2-06 FINTECH child work projected as `REFERRED_NOT_EXECUTED` |
| Governance project-routing controls | current `/AGENTS.md`, `docs/projects/README.md`, `CROSS_PROJECT_HANDOFF_CONTRACT.md` | target-folder/Primary-Owner routing synchronized to current project surfaces |
| older FinTech `ASSET_PROVIDER_MATRIX.md` | `docs/projects/fintech/PROVIDER_CAPABILITY_MATRIX.md` | provider/capability/fallback findings retained and synchronized to `provider-matrix/1.10.0` |
| older FinTech cross-roadmap mapping | `CROSS_PROJECT_DEPENDENCIES.md` + this matrix + work packages/task register | semantic ownership/dependencies retained without replaying stale roadmap authority |
| older FinTech branch as a whole | `BRANCH_CORRELATION_2026-08-31.md` | historical branch correlation retained; stale main-bound assertions are not replayed |
| current project sync | `evidence/PROJECT_SURFACE_CORRELATION_2026-09-01.md` | current-main project-routing/provider/Security correlation evidence |

## Historical branch replacement record

The prior V2 work branch `fintech/capital-ai-fintech-v2-ownership-20260831` was created before the current project-identifiable agent branch convention. Its project-surface content was carried to the conforming historical candidate `agent/fintech-v2-security-sync-20260831`.

The older consolidation branch `fintech/capital-ai-fintech-consolidation-20260831` remains history/reuse evidence only and is not a parallel merge authority. See `BRANCH_CORRELATION_2026-08-31.md`.

The current project-surface sync uses the fresh branch:

`agent/fintech-project-surface-sync-20260901`

from the source baseline recorded above. This branch does not replace or rewrite historical branch evidence.

## Technical artifacts retained in place

- `src/platform/Scoring/**`;
- `src/platform/Ranking/**`;
- `src/services/ranking.service.ts`;
- asset-class/domain executor implementations;
- provider/data implementations outside FINTECH ownership;
- Quality, Security, Compliance, Frontend and Operations runtime components.

Organizational consolidation is not a physical-runtime relocation mandate.

## Current cross-project routing correction

Canonical project-folder routing is resolved from `docs/projects/README.md`. Current target surfaces include:

- Frontend: `docs/projects/frontend/`;
- Compliance: `docs/projects/compliance/`;
- Quality Management: `docs/projects/quality-management/`;
- Security: `docs/projects/security/`.

Legacy domain documentation/runtime locations such as `docs/frontend/` or `docs/compliance/CAPITAL-AI-COMP/` may remain valid domain surfaces, but they are not the canonical project-folder identity for cross-project execution routing.

## Namespace correction

Earlier FinTech material described V2 `VC-12..17` as a target numbering migration conflicting with technical `SC-MD-SPT-0001`. Current project organization uses `PVC-12..17`, resolving that ambiguity without renumbering the technical chain.

Therefore:

- old target `VC-12..17` project labels are superseded as project-routing identity;
- `PVC-12..17` is canonical FINTECH project ownership;
- existing technical `VC-*` meanings remain current and unchanged.
