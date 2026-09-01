# CAPITAL-AI Project Execution Model

**Scope:** repository-wide project organization and execution projection  
**Trust root:** `/AGENTS.md`  
**Status:** CANONICAL PROJECT ORGANIZATION — NON-AUTHORIZING  
**Namespace:** `PVC-*` = Project Value Chain  
**Runtime impact:** none

## Purpose

`docs/projects/` is the canonical organizational execution surface for CAPITAL-AI projects. It answers **who owns, plans, coordinates and evidences project work**. It does not create technical Authority, replace ADR/ESS/control identities, or relocate working runtime components merely for organizational consistency.

Authority continues to resolve through `/AGENTS.md`, the existing Governance Control Plane, accepted ADR/ESS authorities and the canonical registries. Project roadmaps remain non-authorizing execution projections.

## Mandatory separation

```text
/AGENTS.md + ADR/ESS/AUTH/CTRL
  -> what is allowed / required

docs/projects/<project>/
  -> who owns and coordinates project execution

DevelopmentChain
  -> how an authorized change progresses through repository delivery

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

Project-folder routing is an organizational mapping only. It does not create technical Authority, merge authority, deployment authority, Domain Ownership transfer or permission for one project to materialize another project's project surface.

The canonical repository routing is:

| Project | PVC relationship | Canonical project folder | Branch project-folder slug | Materialization owner | Main surface state |
|---|---|---|---|---|---|
| `CAPITAL-AI-CLIENT` | `PVC-01` Primary Owner | `docs/projects/agent-client/` | `agent-client` | `CAPITAL-AI-CLIENT` | present |
| `CAPITAL-AI-OPS` | `PVC-02/04/06/07/08/18` Primary Owner | `docs/projects/operations/` | `operations` | `CAPITAL-AI-OPS` | present |
| `CAPITAL-AI-DOC` | `PVC-03` Primary Owner | `docs/projects/documentary/` | `documentary` | `CAPITAL-AI-DOC` | present via PR #645 |
| `CAPITAL-AI-GOV` | `PVC-05` Primary Owner + cross-cutting Governance | `docs/projects/governance/` | `governance` | `CAPITAL-AI-GOV` | present |
| `CAPITAL-AI-DATA` | `PVC-09..11` Primary Owner | `docs/projects/data/` | `data` | `CAPITAL-AI-DATA` | present |
| `CAPITAL-AI-FINTECH` | `PVC-12..17` Primary Owner | `docs/projects/fintech/` | `fintech` | `CAPITAL-AI-FINTECH` | present |
| `CAPITAL-AI-QM` | cross-cutting; no productive PVC | `docs/projects/quality-management/` | `quality-management` | `CAPITAL-AI-QM` | present |
| `CAPITAL-AI-SEC` | cross-cutting; no productive PVC | `docs/projects/security/` | `security` | `CAPITAL-AI-SEC` | present |
| `CAPITAL-AI-COMP` | cross-cutting; no productive PVC | `docs/projects/compliance/` | `compliance` | `CAPITAL-AI-COMP` | owner migration gap |
| `CAPITAL-AI-FE` | cross-cutting presentation consumer; no productive PVC | `docs/projects/frontend/` | `frontend` | `CAPITAL-AI-FE` | owner migration gap |
| `CAPITAL-AI-SEO` | cross-cutting SEO/marketing domain; no productive PVC | `docs/projects/seo/` | `seo` | `CAPITAL-AI-SEO` | owner migration gap |
| `CAPITAL-AI-SOCIAL` | cross-cutting Social distribution; no productive PVC | `docs/projects/social-media/` | `social-media` | `CAPITAL-AI-SOCIAL` | owner migration gap |

For previously unresolved cross-cutting projects, the folder basename deliberately reuses the stable repository domain basename already associated with that project (`security`, `compliance`, `frontend`, `seo`, `social-media`) instead of introducing an additional project-name alias namespace. The `CAPITAL-AI-SEC` `security` branch/project-folder convention is also already present in merged repository work-claim evidence; this mapping makes the organizational destination explicit.

A project folder may be canonically resolved even when it is not yet materialized on `main`. Absence of the target folder is an owner migration gap, not a competing identity and not permission for CAPITAL-AI-GOV or another project to create the foreign project surface.

The branch slug is always derived from the canonical project-folder basename. Domain/runtime/normative artifacts remain at their existing canonical paths unless a separate, owner-scoped migration proves that relocation is required. In particular, project navigation does not replace `src/platform/Security/`, `docs/compliance/CAPITAL-AI-COMP/`, `docs/frontend/`, `docs/seo/` or `docs/social-media/CAPITAL-AI-SOCIAL/`.

## Standard project surface

Each mature project SHOULD expose under `docs/projects/<project>/`:

- `README.md` — scope, owner and non-goals;
- `ROADMAP.md` — canonical project execution roadmap, non-authorizing;
- PVC ownership declaration;
- work packages / task register;
- cross-project dependencies and handoffs;
- evidence references;
- validation / Definition of Done.

Existing projects are migrated incrementally by their Primary Owner or, for cross-cutting projects, by the project owner responsible for that domain surface. Missing files are a migration gap, not permission for another project to execute foreign work.

## DevelopmentChain relationship

The DevelopmentChain remains governed by existing `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` and `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS` authorities. Organizationally, its recurring execution lifecycle belongs to `CAPITAL-AI-OPS`; Governance continues to own governance controls and Platform Director (`PVC-05`).

The target integration is specified in [`PROJECT_EXECUTION_MODEL.md`](./PROJECT_EXECUTION_MODEL.md). Actual creation/migration of `docs/projects/operations/**` is owned by `CAPITAL-AI-OPS`.

## Cross-project execution

Foreign work uses the repository handoff marker and the structured `PVC-*` field defined in [`CROSS_PROJECT_HANDOFF_CONTRACT.md`](./CROSS_PROJECT_HANDOFF_CONTRACT.md). A handoff never authorizes the source project to implement or mark foreign execution `DONE`, `VERIFIED` or `CLOSED`.

## Migration rule

Use this order:

1. logical project ownership;
2. contract/reference correction;
3. evidence and dependency validation;
4. physical relocation only when required by proven duplicate architecture, wrong-owner business logic, a direct bypass, an invalid dependency cycle or a safely removable legacy compatibility path.

Completed and historical work remains discoverable. No source task is silently deleted during project migration.
