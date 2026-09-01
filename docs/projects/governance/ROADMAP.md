# CAPITAL-AI-GOV — Consolidated Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Original consolidation baseline:** `main@1f55340d89178fb5c1ab735242f42c263918b692`  
**Current project-folder correlation baseline:** `main@22c4b53f83313eb03090ef0867f8f793b98e5fcc`  
**Trust root:** `/AGENTS.md`  
**Role:** roadmap / execution projection — non-authorizing

## P1 — Project Architecture

**State:** `CONSOLIDATED ON MAIN VIA PR #630 / MAINTAINED`

Deliverables:

- `docs/projects/` as canonical organizational project execution surface;
- `PVC-01..PVC-18` as qualified Project Value Chain namespace;
- one Primary Project Owner per PVC stage;
- cross-cutting projects excluded from productive PVC ownership unless separately authorized;
- DevelopmentChain separated from project ownership and technical runtime;
- cross-project compatibility marker retained while structured `project_stage: PVC-NN` removes ambiguity;
- no current technical `SC-MD-SPT-0001` stage renumbered by P1.

Current maintenance extends P1 only by resolving missing organizational project-folder identities; it does not create new Authority or relocate runtime/domain artifacts.

## P2 — DevelopmentChain Integration

**State:** `OPS PROJECT SURFACE MATERIALIZED / TARGET-LOCAL REMEDIATION CONTINUES`

Target project: `CAPITAL-AI-OPS`.

GOV defines the lifecycle and ownership contract in `../PROJECT_EXECUTION_MODEL.md`. `docs/projects/operations/` is present on main and binds the recurring DevelopmentChain lifecycle to OPS organizational execution without replacing existing DevelopmentChain, CI, release, production or Human approval authorities.

Historical M0-M10 artifacts remain discoverable. M10 remains `SUSPENDED / OFF`. Technical/security remediation in OPS remains owner-scoped and is not completed by GOV.

Handoff: `P2_DEVELOPMENT_CHAIN_HANDOFF.md` plus current `CROSS_PROJECT_HANDOFFS.md` return evidence.

## P3 — Financial VC Namespace Migration

**State:** `ASSESSED / CROSS_PROJECT DECISION REQUIRED`

Current `SC-MD-SPT-0001` remains active with technical financial `VC-01..VC-18`. Recommended target, only if all affected owners approve a coordinated migration: `FVC-01..FVC-18` for the financial technical chain while `PVC-*` remains project ownership/routing.

GOV does not perform foreign technical migration. DATA, FINTECH, DOC, QM and OPS are explicit dependencies/owners.

Assessment: `P3_FVC_NAMESPACE_ASSESSMENT.md`.

## P4 — Governance execution backlog consolidation

**State:** `MERGED VIA PR #630 / MAINTENANCE`

The project-chat and terminal GOV branch consolidation is represented in `TASK_REGISTER.md`. Completed tasks remain traceable; pending local tasks are explicit; foreign work is converted to handoffs. Historical branches are reuse evidence only and are not independent merge sources.

PR #630 established the Owner-directed branch naming convention, consolidated project/PVC artifacts and the Admin Panel handoffs. New work uses one fresh scoped branch and one current claim rather than reopening historical GOV writers.

## P5 — CAPITAL-AI-SEC inbound handoff: MFA/AAL lifecycle drift

**State:** `REFERRED_NOT_EXECUTED / TARGET ACCEPTED`

Source: `CAPITAL-AI-SEC`, PR `#631`, merged at `main@b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6`.

Target scope is strictly `PVC-05 Platform Director`. The Security finding is `MFA/AAL lifecycle drift`. Governance owns only target-local reconciliation, implementation and evidence inside PVC-05; CAPITAL-AI-SEC retains Security requirement/finding ownership and independent verification.

Required constraints:

- reuse current `/AGENTS.md`, Authority Registry, Control Catalog, ADR/ESS and identity/approval contracts;
- no second Security, Governance or IAM authority surface;
- missing/conflicting authority or evidence remains fail-closed;
- no agent self-approves Accepted Risk or Security VERIFIED/CLOSED;
- any foreign PVC remediation is handed off rather than implemented by GOV;
- Human/CODEOWNER merge and existing production mutation gates remain unchanged.

Inbound handoff artifact: `SECURITY_HANDOFF_CAPITAL_AI_SEC.md`.

Exit gate for this roadmap item: GOV may report `IMPLEMENTED` or `EVIDENCE_READY` only after exact-candidate positive/negative evidence is assembled; Security `VERIFIED/CLOSED` remains exclusively an independent CAPITAL-AI-SEC decision.

## P6 — Cross-cutting project-folder correlation

**State:** `IN_CANDIDATE — GOVERNANCE ROUTING ONLY`

Implemented cross-cutting projects already have established domain/runtime surfaces but five still lack the repository-standard `docs/projects/` navigation layer. Governance resolves their canonical organizational destinations using stable existing domain basenames rather than inventing a second alias namespace:

| Project | Canonical project folder | Branch slug | Productive PVC |
|---|---|---|---|
| `CAPITAL-AI-SEC` | `docs/projects/security/` | `security` | none |
| `CAPITAL-AI-COMP` | `docs/projects/compliance/` | `compliance` | none |
| `CAPITAL-AI-FE` | `docs/projects/frontend/` | `frontend` | none |
| `CAPITAL-AI-SEO` | `docs/projects/seo/` | `seo` | none |
| `CAPITAL-AI-SOCIAL` | `docs/projects/social-media/` | `social-media` | none |

The mapping is organizational and non-authorizing. Existing canonical sources stay in place, including `src/platform/Security/`, `docs/compliance/CAPITAL-AI-COMP/`, `docs/frontend/`, `docs/seo/` and `docs/social-media/CAPITAL-AI-SOCIAL/`.

A missing project folder remains a target-owner migration gap. GOV records the routing and handoff but does not create or complete foreign project surfaces.

Additional integrity finding: `.ai/work-claims/CAPITAL-AI-SEC-PVC-HANDOFF-CORRELATION-2026-08-31.json` remains `active` on current main while referencing merged PR #631. SEC must terminalize that stale writer metadata in its own scope before new protected SEC work is merge-ready.

### Current-main correlation update

PR #645 has materialized the separate Primary-Owner `CAPITAL-AI-DOC` project surface at `docs/projects/documentary/` on `main@22c4b53f83313eb03090ef0867f8f793b98e5fcc`. Documentary is therefore no longer part of the open folder-materialization gap; P6 now concerns only SEC, COMP, FE, SEO and SOCIAL.

Artifacts:

- `../README.md` — canonical folder/branch-slug mapping;
- `P1_PROJECT_ARCHITECTURE_MIGRATION_MATRIX.md` — before/after migration state;
- `CROSS_PROJECT_HANDOFFS.md` — complete target-owner referrals and DOC return evidence;
- `TASK_REGISTER.md` — owner/status/exit-gate traceability.

Exit gate for P6:

1. exact candidate contains no runtime/authority mutation;
2. no open PR or active writer conflicts with the GOV-owned routing files;
3. project-folder mappings are internally consistent across README, P1 matrix, handoffs and task register;
4. cross-cutting targets remain without productive PVC ownership;
5. applicable documentation/governance validation passes;
6. final main re-sync and exact-snapshot Human/Owner PR-create approval are completed.

## Dependency order

```text
P1 PVC project model
  -> DOC project surface materialized via PR #645
  -> P6 resolve remaining cross-cutting organizational project-folder identities
     -> target-owner SEC / COMP / FE / SEO / SOCIAL project-navigation migrations
     -> owner-side handoff-reference normalization

P2 OPS DevelopmentChain project integration is materialized; target-local remediation continues independently.
P3 coordinated FVC decision/migration remains separate and only proceeds if approved.
P4 task register continuously tracks local GOV follow-up and foreign handoff evidence.
P5 consumes the Security PR #631 finding for PVC-05 without transferring Security verification authority.
```

## Definition of Done

The GOV consolidation and follow-up projection are complete when:

- one current project roadmap and task register represent the open GOV work;
- old GOV branches have no active writer claim;
- GOV-owned stale merged/superseded claims are terminalized and foreign stale writer findings are explicitly handed off;
- P1 remains the canonical PVC project model;
- every known implemented CAPITAL-AI project has either a materialized canonical project surface or an explicitly resolved owner-migration target;
- P2/P3/Admin Panel and project-folder foreign work are explicitly handed off and never falsely marked complete;
- the Security handoff for PVC-05 is recorded without shifting Security verification or Accepted Risk authority;
- no parallel Governance, Security, IAM, runtime, scoring, data, release, Frontend, SEO or EventMesh architecture is introduced.
