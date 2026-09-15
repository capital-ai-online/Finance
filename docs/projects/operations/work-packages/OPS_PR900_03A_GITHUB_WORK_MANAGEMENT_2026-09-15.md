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

Current-main correlation uses `/AGENTS.md`, `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md`, the OPS Roadmap/Work-Package register, accepted `ESS-0019`, and accepted `ADR-0030`. `ADR-0062` is `PROPOSED` on this baseline and is not used as authority.

## Current connected GitHub capability inventory

`NOT_AVAILABLE_ON_CURRENT_CONNECTOR` means only that the current execution surface does not expose the required capability. It never means the GitHub object does not exist.

| Category | Classification | Reproducible evidence |
|---|---|---|
| Issues | `AVAILABLE` | Finance Issue search returned real Issues including `#499`, `#500`, `#564`, `#565`; create/update Issue actions are exposed. No Issue mutation was executed. |
| Labels | `PARTIAL_SURFACE — ISSUE_LABEL_ASSIGNMENT_AVAILABLE / ENUMERATION_NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | Issue/PR label assignment actions are exposed; repository-label enumeration via generic fetch is rejected and no dedicated label inventory/create action is exposed. |
| Milestones | `PARTIAL_SURFACE — ISSUE_MILESTONE_ASSIGNMENT_AVAILABLE / OBJECT_ENUMERATION_MUTATION_NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | Issue update can set a milestone number; milestone enumeration via generic fetch is rejected and no dedicated milestone object create/list/edit action is exposed. |
| Issue Types | `NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | Issue create/update schemas expose no native Issue Type field and no Issue-Type inventory/mutation action is present. |
| Organization Issue Fields | `NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | No organization Issue-field inventory/mutation action is exposed. |
| Organization Projects / Project Fields | `NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | No Organization Projects/Project Fields action is exposed by the connector. |
| Wiki Pages / Navigation | `NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | No Wiki inventory/mutation action is exposed by the connector. |

No category is `EMPTY_VERIFIED`: the unavailable object classes cannot be completely enumerated from this surface, so absence cannot be claimed.

## Taxonomy preference

1. native GitHub Issue Types;
2. structured Organization Issue Fields;
3. Labels only for remaining facets;
4. Milestone only as a non-versioned delivery cohort;
5. Project Status only as workflow state.

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

## Validation

After materialization, re-read all changed files, compare branch to then-current main, verify merge base/ahead/behind/exact changed files, refresh open writers and re-check semantic/namespace/authority/Security overlap. Unexecuted runtime/build/hosted checks remain `NOT_RUN`.
