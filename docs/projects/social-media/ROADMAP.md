# CAPITAL-AI-SOCIAL — Project Roadmap

**Project:** `CAPITAL-AI-SOCIAL`  
**Project folder:** `docs/projects/social-media/`  
**Primary Productive PVC ownership:** `[]`  
**Role:** cross-cutting Social Media distribution planning and channel coordination  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Detailed roadmap:** `docs/social-media/CAPITAL-AI-SOCIAL/ROADMAP.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This roadmap is the thin owner-side project execution surface required by the canonical `docs/projects/` model. It does not duplicate the detailed Social roadmap, contracts, mappings, handoffs, work packages or reports.

Detailed Social execution state remains canonical in `docs/social-media/CAPITAL-AI-SOCIAL/**`.

## Project-surface controls

| Control | Target state | Evidence / gate |
|---|---|---|
| `SOCIAL-PROJ-01` | Canonical `docs/projects/social-media/` navigation exists | `README.md` + `ROADMAP.md` reference existing Social sources |
| `SOCIAL-PROJ-02` | No productive PVC ownership | no Social project artifact allocates a productive `PVC-*` stage or implicit `PVC-19` |
| `SOCIAL-PROJ-03` | No duplicate Social truth | existing roadmap/contracts/mappings/handoffs retain their current roles |
| `SOCIAL-PROJ-04` | Publication/platform authority remains separated | planning/distribution ownership never self-authorizes publication, credentials or provider mutation |
| `SOCIAL-PROJ-05` | Foreign work remains owner-routed | SEO/FE/OPS/GOV/COMP changes are executed by those projects |

## Execution invariants

- Social planning and channel coordination do not equal publication authority.
- External account credentials, tokens and provider mutations remain behind existing protected controls.
- Approved content contracts remain controlling for generated/distributed content.
- SEO/discoverability remains SEO-owned; public UI/product implementation remains Frontend-owned.
- Governance/publishing controls remain GOV-owned; compliance assessment remains COMP-owned.
- No project-folder migration may create `PVC-19` or any other new productive project stage.
- Merge, deployment and protected external mutations retain existing Human/Owner and repository gates.

## Current project dependencies

| Target | Relationship |
|---|---|
| `CAPITAL-AI-SEO` | discoverability/marketing coordination and source content planning |
| `CAPITAL-AI-FE` | public UI/product surfaces referenced by Social content |
| `CAPITAL-AI-OPS` | protected provider credentials, platform integrations and operational execution |
| `CAPITAL-AI-GOV` | publishing/content automation controls and approval boundaries |
| `CAPITAL-AI-COMP` | marketing/social compliance applicability and assessment |

## Validation

For project-surface changes, the smallest sufficient validation is:

1. current `/AGENTS.md` and current `main` correlated;
2. open PR / writer / work-claim overlap checked;
3. project folder and branch slug match `docs/projects/README.md`;
4. no duplicate Social roadmap, publication authority or platform authority is introduced;
5. all references target existing Social/project artifacts;
6. shared Governance-owned registry paths are not modified by this owner branch;
7. branch is synchronized with current `main` before PR readiness;
8. PR creation is separately approved for the exact main/head snapshot.

Documentation-only project-surface work does not by itself require a pre-PR Runtime build; hosted repository checks after PR creation remain authoritative for merge readiness.

## Completion condition

The owner-side Social project-folder migration is complete after Human merge when:

- the Social project surface is present on current `main`;
- no productive PVC, publication or platform authority has moved to Social;
- existing Social detail sources remain canonical and non-duplicated;
- required hosted checks for the exact PR candidate have passed.

The shared project registry may then consume the merge as GOV-owned return evidence.
