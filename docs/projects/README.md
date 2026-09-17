# CAPITAL-AI Project Folder to PVC Mapping

**Scope:** organizational connection between project folders and PVC units  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Status:** CANONICAL PROJECT ORGANIZATION — NON-AUTHORIZING  
**Namespace:** `PVC-*` = Project Value Chain  
**Runtime impact:** none

## Purpose

`docs/projects/` answers **which project folder owns which PVC unit**. It does not create technical Authority, replace ADR/ESS/control identities, or relocate working runtime components.

Development execution resolves only through `/AGENTS.md@CURRENT_MAIN`. Accepted ADR/ESS/domain/security/compliance/data/scoring and provider controls remain subject-matter constraints when required by that trust root; they do not create a second development lifecycle or instruction surface.

## Mandatory separation

```text
/AGENTS.md@CURRENT_MAIN
  -> how development execution is resolved

docs/projects/<project>/ + PROJECT_VALUE_CHAIN.md
  -> which folder owns which PVC unit

ADR / ESS / domain / security / compliance / data / scoring controls
  -> subject-matter constraints within delegated scope

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
| `CAPITAL-AI-FINTECH` | `PVC-09`..`PVC-17` | Data ingestion/evidence/Data Quality through Ranking/Decision Support |

`CAPITAL-AI-DATA` is superseded as an independent **productive PVC owner**. `docs/projects/data/` remains materialized by `CAPITAL-AI-DATA` as a historical/compatibility project surface so provenance, navigation and migration evidence retain a stable project identity; that materialization metadata does not grant productive PVC ownership, task authority or execution authority.

Cross-cutting projects such as `CAPITAL-AI-QM`, `CAPITAL-AI-SEC`, `CAPITAL-AI-COMP`, `CAPITAL-AI-FE`, `CAPITAL-AI-SEO` and `CAPITAL-AI-SOCIAL` own no productive PVC stage solely because they validate, constrain, present or distribute outputs.

Execution remains owner-correct under `/AGENTS.md@CURRENT_MAIN`. Work whose Authority or implementation belongs to another project is not silently taken over locally; it produces the owner-correct handover defined by the trust root. No handover transfers Primary PVC or Domain ownership.

## Canonical project-folder routing

Project-folder routing is an organizational mapping only. It does not create technical Authority, merge authority, deployment authority or Domain Ownership transfer.

`Materialization owner` and `Main surface state` are mapping metadata required by the Project Value Chain consistency check. They record which project identity materializes its own folder surface and whether that README currently exists. **Materialization ownership is not productive PVC ownership.** A superseded compatibility folder may therefore retain its historical project identity while declaring no productive PVC stages.

`Display name`, `Symbol` and `Color` are canonical **presentation metadata** for chat and Pull Request presentation. They are explicitly preserved by `/AGENTS.md` as non-authorizing style/graphics. They do not replace `Project`, canonical project folder, PVC or Owner identity. Color is supplementary only.

| Project | PVC relationship | Canonical project folder | Branch project-folder slug | Display name | Symbol | Color | Materialization owner | Main surface state |
|---|---|---|---|---|---|---|---|---|
| `CAPITAL-AI-CLIENT` | `PVC-01` Primary Owner | `docs/projects/agent-client/` | `agent-client` | Agent Client | 🧪 | `#58AC60` | `CAPITAL-AI-CLIENT` | present |
| `CAPITAL-AI-OPS` | `PVC-02/04/06/07/08/18` Primary Owner | `docs/projects/operations/` | `operations` | Operations | ✈️ | `#845CDC` | `CAPITAL-AI-OPS` | present |
| `CAPITAL-AI-DOC` | `PVC-03` Primary Owner | `docs/projects/documentary/` | `documentary` | Documentary | 📋 | `#5CB060` | `CAPITAL-AI-DOC` | present |
| `CAPITAL-AI-GOV` | `PVC-05` Primary Owner + cross-cutting Governance | `docs/projects/governance/` | `governance` | Governance | 🧠 | `#A1A1AA` | `CAPITAL-AI-GOV` | present |
| `CAPITAL-AI-FINTECH` | `PVC-09..17` Primary Owner | `docs/projects/fintech/` | `fintech` | FinTech | 📊 | `#E080AC` | `CAPITAL-AI-FINTECH` | present |
| `CAPITAL-AI-DATA` | superseded; no productive PVC | `docs/projects/data/` | `data` | Data (historical) | 📁 | `#8058CC` | `CAPITAL-AI-DATA` | present — historical compatibility surface |
| `CAPITAL-AI-QM` | cross-cutting; no productive PVC | `docs/projects/quality-management/` | `quality-management` | Quality Management | 🩺 | `#4480E8` | `CAPITAL-AI-QM` | present |
| `CAPITAL-AI-SEC` | cross-cutting; no productive PVC | `docs/projects/security/` | `security` | Security | 💻 | `#E04C4C` | `CAPITAL-AI-SEC` | present |
| `CAPITAL-AI-COMP` | cross-cutting; no productive PVC | `docs/projects/compliance/` | `compliance` | Compliance | ⚖️ | `#E84848` | `CAPITAL-AI-COMP` | present |
| `CAPITAL-AI-FE` | cross-cutting; no productive PVC | `docs/projects/frontend/` | `frontend` | Frontend | 🎨 | `#DC7CA8` | `CAPITAL-AI-FE` | present |
| `CAPITAL-AI-SEO` | cross-cutting; no productive PVC | `docs/projects/seo/` | `seo` | SEO | ✒️ | `#E8C464` | `CAPITAL-AI-SEO` | present |
| `CAPITAL-AI-SOCIAL` | cross-cutting; no productive PVC | `docs/projects/social-media/` | `social-media` | Social Media | ♡ | `#E8C45C` | `CAPITAL-AI-SOCIAL` | present |

The branch slug is derived from the canonical project-folder basename where `/AGENTS.md@CURRENT_MAIN` requires project-identifiable branch metadata. Domain/runtime/normative artifacts remain at their existing canonical paths unless an owner-scoped migration proves relocation is required.

Presentation consumers MUST resolve `Project`, `Canonical project folder`, `Display name`, `Symbol` and `Color` from exactly one routing row in this file. Source and Target project presentation MUST each resolve independently through this same mapping source. Consumers fail closed on missing/duplicate project rows or malformed presentation metadata. Color MUST use exact `#RRGGBB` form and MUST never be the sole semantic cue. No second project-presentation registry may be introduced.

## Procedural authority boundary

Historical post-PVC routing, DevelopmentChain, foreign-execution, PR/CI and handoff overlays are non-authorizing for development execution. This file plus `PROJECT_VALUE_CHAIN.md` remains the organizational mapping surface; execution procedure comes only from `/AGENTS.md@CURRENT_MAIN`.
