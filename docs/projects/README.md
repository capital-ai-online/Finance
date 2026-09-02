# CAPITAL-AI Project Folder to PVC Mapping

**Scope:** organizational connection between project folders and PVC units  
**Trust root:** `/AGENTS.md`  
**Status:** CANONICAL PROJECT ORGANIZATION — NON-AUTHORIZING  
**Namespace:** `PVC-*` = Project Value Chain  
**Runtime impact:** none

## Purpose

`docs/projects/` answers **which project folder owns which PVC unit**. It does not create technical Authority, replace ADR/ESS/control identities, or relocate working runtime components.

Authority continues to resolve through `/AGENTS.md`, the existing Governance Control Plane, accepted ADR/ESS authorities and the canonical registries.

## Mandatory separation

```text
/AGENTS.md + ADR/ESS/AUTH/CTRL
  -> what is allowed / required

docs/projects/<project>/ + PROJECT_VALUE_CHAIN.md
  -> which folder owns which PVC unit

existing runtime components
  -> where technical behavior executes
```

A project folder MUST NOT become a second Governance, Data, Scoring, EventMesh, Release, Frontend or other productive runtime architecture.

## Project Value Chain namespace

The organizational project chain uses the qualified namespace `PVC-01` through `PVC-18` defined in [`PROJECT_VALUE_CHAIN.md`](./PROJECT_VALUE_CHAIN.md).

The `PVC-*` namespace is intentionally distinct from the existing technical financial stage identifiers currently used by `SC-MD-SPT-0001`. Project placement therefore cannot renumber or supersede technical financial stages.

## Primary project ownership

| Project | Primary PVC stages | Role |
|---|---|---|
| `CAPITAL-AI-CLIENT` | `PVC-01` | Agent Client |
| `CAPITAL-AI-OPS` | `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18` | Controlled implementation and operations lifecycle |
| `CAPITAL-AI-DOC` | `PVC-03` | Documentary Engine |
| `CAPITAL-AI-GOV` | `PVC-05` | Platform Director plus cross-cutting Governance |
| `CAPITAL-AI-DATA` | `PVC-09`, `PVC-10`, `PVC-11` | Data ingestion, evidence and Data Quality |
| `CAPITAL-AI-FINTECH` | `PVC-12`..`PVC-17` | Feature Engineering through Ranking/Decision Support |

Cross-cutting projects such as `CAPITAL-AI-QM`, `CAPITAL-AI-SEC`, `CAPITAL-AI-COMP`, `CAPITAL-AI-FE`, `CAPITAL-AI-SEO` and `CAPITAL-AI-SOCIAL` own no productive PVC stage solely because they validate, constrain, present or distribute outputs.

## Canonical project-folder routing

Project-folder routing is an organizational mapping only. It does not create technical Authority, merge authority, deployment authority or Domain Ownership transfer.

| Project | PVC relationship | Canonical project folder | Branch project-folder slug |
|---|---|---|---|
| `CAPITAL-AI-CLIENT` | `PVC-01` Primary Owner | `docs/projects/agent-client/` | `agent-client` |
| `CAPITAL-AI-OPS` | `PVC-02/04/06/07/08/18` Primary Owner | `docs/projects/operations/` | `operations` |
| `CAPITAL-AI-DOC` | `PVC-03` Primary Owner | `docs/projects/documentary/` | `documentary` |
| `CAPITAL-AI-GOV` | `PVC-05` Primary Owner + cross-cutting Governance | `docs/projects/governance/` | `governance` |
| `CAPITAL-AI-DATA` | `PVC-09..11` Primary Owner | `docs/projects/data/` | `data` |
| `CAPITAL-AI-FINTECH` | `PVC-12..17` Primary Owner | `docs/projects/fintech/` | `fintech` |
| `CAPITAL-AI-QM` | cross-cutting; no productive PVC | `docs/projects/quality-management/` | `quality-management` |
| `CAPITAL-AI-SEC` | cross-cutting; no productive PVC | `docs/projects/security/` | `security` |
| `CAPITAL-AI-COMP` | cross-cutting; no productive PVC | `docs/projects/compliance/` | `compliance` |
| `CAPITAL-AI-FE` | cross-cutting; no productive PVC | `docs/projects/frontend/` | `frontend` |
| `CAPITAL-AI-SEO` | cross-cutting; no productive PVC | `docs/projects/seo/` | `seo` |
| `CAPITAL-AI-SOCIAL` | cross-cutting; no productive PVC | `docs/projects/social-media/` | `social-media` |

The branch slug is always derived from the canonical project-folder basename. Domain/runtime/normative artifacts remain at their existing canonical paths unless a separate, owner-scoped migration proves that relocation is required.

## Withdrawn post-mapping contracts

After Human Merge of this remediation, the following post-PVC policy overlays are withdrawn and MUST NOT be treated as current policy:

- Cross-Project Handoff Contract
- Project Execution Model contract
- Roadmap Registry policy surface
- Owner Device Authorization cutover/handoff contracts
- P1/P2/P3 post-mapping assessment/handoff contracts created after the folder-PVC connection

The remaining current surface is this mapping plus `PROJECT_VALUE_CHAIN.md`.
