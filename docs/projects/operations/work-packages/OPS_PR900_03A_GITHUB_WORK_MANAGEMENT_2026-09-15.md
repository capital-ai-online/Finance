# OPS-PR900-03A — GitHub Work-Management Inventory & Package Materialization

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Parent:** `OPS-PR900-03 — GitHub Enterprise capability matrix`  
**Status:** `MATERIALIZED_BRANCH / PRE_PR_CORRELATION_READY`  
**Inventory baseline:** `main@ed584e36138427bb637af523df6e8ead994f6bda`  
**Branch:** `agent/operations-github-work-management-20260915`  
**Trust root:** `/AGENTS.md@current-main`

## Purpose and authority boundary

GitHub Work Management is coordination/navigation only. It does not become a second authority for Roadmap, Project/PVC ownership, platform version, Governance, Security, Release, Deployment, PR creation or merge decisions.

Current-main correlation uses `/AGENTS.md`, `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md`, the OPS Roadmap/Work-Package register, accepted `ESS-0019`, and accepted `ADR-0030`. `ADR-0062` is `PROPOSED` on the inventory baseline and is not used as authority.

## Current connected GitHub capability inventory

`NOT_AVAILABLE_ON_CURRENT_CONNECTOR` means only that the current execution surface does not expose the required capability. It never means the GitHub object does not exist. Repository feature flags likewise prove only that a feature is enabled; they do not enumerate Organization-level objects, fields or Wiki pages.

| Category | Classification | Reproducible evidence |
|---|---|---|
| Issues | `AVAILABLE` | Finance Issue search returned real Issues including `#499`, `#500`, `#564`, `#565`; create/update Issue actions are exposed. Repository metadata reports `has_issues=true`. No Issue mutation was executed. |
| Labels | `PARTIAL_SURFACE — ISSUE_LABEL_ASSIGNMENT_AVAILABLE / ENUMERATION_NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | Issue/PR label assignment actions are exposed; repository-label enumeration via generic fetch is rejected and no dedicated label inventory/create action is exposed. |
| Milestones | `PARTIAL_SURFACE — ISSUE_MILESTONE_ASSIGNMENT_AVAILABLE / OBJECT_ENUMERATION_MUTATION_NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | Issue update can set a milestone number; milestone enumeration via generic fetch is rejected and no dedicated milestone object create/list/edit action is exposed. |
| Issue Types | `NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | Issue create/update schemas expose no native Issue Type field and no Issue-Type inventory/mutation action is present. |
| Organization Issue Fields | `NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | No organization Issue-field inventory/mutation action is exposed. |
| Organization Projects / Project Fields | `REPOSITORY_FEATURE_ENABLED / OBJECT_SURFACE_NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | Repository metadata reports `has_projects=true`; no Organization Projects/Project Fields inventory or mutation action is exposed by the connector. |
| Wiki Pages / Navigation | `REPOSITORY_FEATURE_ENABLED / PAGE_SURFACE_NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | Repository metadata reports `has_wiki=true`; no Wiki page inventory/mutation action is exposed by the connector. |

No category is `EMPTY_VERIFIED`: unavailable object classes cannot be completely enumerated from this surface, so absence is not claimed.

Current `main` also contains no `.github/ISSUE_TEMPLATE/` entry. This proves only that a repository-resident Issue Template/Form surface is not materialized on this snapshot; it does not describe Organization-level defaults or provider objects that the connector cannot enumerate.

## Taxonomy preference

1. native GitHub Issue Types;
2. structured Organization Issue Fields;
3. Labels only for remaining facets;
4. Milestone only as a non-versioned delivery cohort;
5. Project Status only as workflow state.

This follows current GitHub capability design: Issue Types identify work kind, Organization Issue Fields provide shared structured metadata across projects, and project-local duplicates of the same semantic field are avoided. Built-in Project workflows are preferred over custom automation where they satisfy the required lifecycle.

If later required, the intended milestone is `GitHub Work Management Pilot`. It must not represent a platform, Release or Deployment version. Platform version remains governed by `package.json#version` and the Release Version Gate.

## Wiki contract

Intended navigation only:

`Home -> CAPITAL-AI Projects -> CAPITAL-AI-OPS -> OPS-PR900-03A/03B`

Wiki pages may contain navigation/backlinks only and must not duplicate normative Roadmap/ADR/ESS/Governance/Security/Release content.

## OPS-PR900-03B

**Flow:** `Taxonomy -> Issue Intake -> Organization Project -> Milestone -> PR -> Done -> Wiki Navigation`  
**State:** `BLOCKED / NOT_STARTED`

03B may execute only after 03A is completed against then-current main and the required object/mutation/readback surfaces are actually available. Because Organization Project/Project Fields, milestone object management and Wiki navigation are not safely available on the current connector, no partial pilot is represented as success.

## Writer correlation at branch creation

Against `main@ed584e36138427bb637af523df6e8ead994f6bda`:

- open Pull Requests: `0`;
- active non-main branches: `agent/fintech-fin-sec-03-post-merge-sync-20260915`, `agent/security-codeql-autofix-alert-8-20260915`, `agent/security-fin-sec-03-independent-verification-20260915`, `agent/security-uls-stable-id-reverification-20260915`;
- changed-file overlap with the four OPS target documentation surfaces: none observed;
- no current semantic/namespace/authority conflict was identified for this bounded coordination-only package.

Historical work-management writer statements are search hints only; no matching active branch or open PR exists on this snapshot.

## Current-main readback after synchronization

The bounded branch was synchronized after the inventory baseline and re-read against `main@5ae0fdd80b085740f92a5530c5561a06f760c7a3`.

Pre-evidence-update branch head `4ac23c8c827b2c545b46f9542432ecd0c309c57c` had:

- merge base: `5ae0fdd80b085740f92a5530c5561a06f760c7a3`;
- branch status: `ahead`;
- ahead: `5` commits;
- behind: `0` commits;
- open Pull Requests: `0`;
- exactly four net changed files relative to the merge base:
  - `docs/projects/operations/ROADMAP.md`;
  - `docs/projects/operations/WORK_PACKAGES.md`;
  - `docs/projects/operations/work-packages/OPS_PR900_03A_GITHUB_WORK_MANAGEMENT_2026-09-15.md`;
  - `docs/projects/operations/work-packages/README.md`.

Repository metadata on the same current-state pass reports `has_issues=true`, `has_projects=true` and `has_wiki=true`. These flags are retained separately from connector object-level capability, so enabled provider features are not misreported as fully inventoried object state.

Current branch discovery shows this branch as the only `operations` GitHub-work-management writer. Other visible non-main branches are scoped to FinTech, Governance/QM or Security work; no open PR writer exists for this package. No evidence was found that would transfer ownership or create a competing work-management authority.

## Validation

- requested metadata categories: capability-classified with explicit unavailable/partial states;
- current Project/PVC/Owner mapping: resolved to `CAPITAL-AI-OPS / PVC-02` with `PVC-18` supporting traceability;
- authority boundary: Roadmap/ADR/ESS/version/PR/merge authority remains outside GitHub work-management metadata;
- current-main synchronization: verified `behind=0` before this evidence-only update;
- changed-file scope: four OPS documentation/package surfaces only before this evidence-only update; this update changes only the existing package-detail file and does not broaden the material scope;
- open Pull Requests: `0` at current correlation;
- runtime/build/hosted checks: `NOT_RUN` because this is documentation/coordination-only pre-PR work and no runtime source is changed.

Before any PR approval request, re-read then-current main and branch head, recompute the exact changed-file set and `capital-ai-effective-change/v1`, refresh open writers and re-check semantic/namespace/authority/Security overlap. `NOT_RUN` remains distinct from `PASS`.
