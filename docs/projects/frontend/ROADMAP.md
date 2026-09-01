# CAPITAL-AI-FE — Project Roadmap

**Project:** `CAPITAL-AI-FE`  
**Project folder:** `docs/projects/frontend/`  
**Primary Productive PVC ownership:** `[]`  
**Role:** cross-cutting Frontend architecture, presentation and UX execution  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Detailed roadmap:** `docs/frontend/FRONTEND_ROADMAP.md`  
**Architecture authority:** `docs/frontend/FRONTEND_ARCH.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This roadmap is the thin owner-side project execution surface required by the canonical `docs/projects/` model. It does not duplicate the detailed Frontend architecture, roadmap, component inventory, accessibility, performance or design-token sources.

Detailed Frontend migration state remains canonical in `docs/frontend/**`.

## Project-surface controls

| Control | Target state | Evidence / gate |
|---|---|---|
| `FE-PROJ-01` | Canonical `docs/projects/frontend/` navigation exists | `README.md` + `ROADMAP.md` reference existing Frontend sources |
| `FE-PROJ-02` | No productive PVC ownership | no Frontend project artifact allocates a productive `PVC-*` stage |
| `FE-PROJ-03` | Frontend architecture remains singular | `docs/frontend/FRONTEND_ARCH.md` remains the architecture authority |
| `FE-PROJ-04` | Domain semantics remain owner-controlled | UI consumes scoring/data/entitlement/Governance contracts without local redefinition |
| `FE-PROJ-05` | UX quality remains evidence-backed | accessibility/performance/component inventory evidence remains traceable |

## Execution invariants

- Projection, not redefinition.
- No new productive implementation under a project folder.
- Frontend may compose and present domain outputs but cannot create local scoring, market-data, evidence, entitlement or Governance truth.
- `src/app`, `src/features`, `src/shared` and compatibility boundaries remain governed by `FRONTEND_ARCH.md` and current implementation evidence.
- Ranking/decision-support semantics remain with `CAPITAL-AI-FINTECH`; data/evidence semantics remain with `CAPITAL-AI-DATA`.
- Merge, deployment and protected external mutations retain Human/Owner and repository gates.

## Current project dependencies

| Target | Relationship |
|---|---|
| `CAPITAL-AI-FINTECH` | productive scoring/ranking/decision-support contracts consumed by UI |
| `CAPITAL-AI-DATA` | data/evidence/freshness contracts consumed by UI |
| `CAPITAL-AI-GOV` | Governance/IAM/control-plane contracts consumed by Admin/Governance UI |
| `CAPITAL-AI-OPS` | runtime/deployment/operational status contracts |
| `CAPITAL-AI-QM` | cross-cutting UX/quality evidence and improvement findings |

## Validation

For project-surface changes, the smallest sufficient validation is:

1. current `/AGENTS.md` and current `main` correlated;
2. open PR / writer / work-claim overlap checked;
3. project folder and branch slug match `docs/projects/README.md`;
4. no second Frontend architecture, scoring authority or data contract is introduced;
5. all references target existing Frontend/project artifacts;
6. shared Governance-owned registry paths are not modified by this owner branch;
7. branch is synchronized with current `main` before PR readiness;
8. PR creation is separately approved for the exact main/head snapshot.

Documentation-only project-surface work does not by itself require a pre-PR Runtime build; hosted repository checks after PR creation remain authoritative for merge readiness.

## Completion condition

The owner-side Frontend project-folder migration is complete after Human merge when:

- the Frontend project surface is present on current `main`;
- no productive PVC ownership or foreign business authority has moved to Frontend;
- existing Frontend architecture/roadmap/inventory sources remain canonical and non-duplicated;
- required hosted checks for the exact PR candidate have passed.

The shared project registry may then consume the merge as GOV-owned return evidence.
