# CAPITAL-AI-GOV — Consolidated Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Original consolidation baseline:** `main@1f55340d89178fb5c1ab735242f42c263918b692`  
**Current project-folder correlation baseline:** `main@a90dc644fb5c8efacdf25e464f2b20c62474501f`  
**User-Lifecycle orchestration baseline:** `main@a90dc644fb5c8efacdf25e464f2b20c62474501f`  
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

**State:** `ALL TARGET PROJECT SURFACES MATERIALIZED / CORRELATED WRITERS RELEASED`

Governance resolved canonical organizational destinations for the implemented cross-cutting projects. The mapping is organizational and non-authorizing; each target owner maintains its own project surface.

| Project | Canonical project folder | Branch slug | Current correlation | Productive PVC |
|---|---|---|---|---|
| `CAPITAL-AI-SEC` | `docs/projects/security/` | `security` | merged via PR #647 | none |
| `CAPITAL-AI-COMP` | `docs/projects/compliance/` | `compliance` | merged via PR #652; writer released via PR #661 | none |
| `CAPITAL-AI-FE` | `docs/projects/frontend/` | `frontend` | merged via PR #653; project and authority writers released via PR #661 | none |
| `CAPITAL-AI-SEO` | `docs/projects/seo/` | `seo` | merged via PR #654 | none |
| `CAPITAL-AI-SOCIAL` | `docs/projects/social-media/` | `social-media` | merged via PR #655 | none |

Existing canonical sources stay in place, including `src/platform/Security/`, `docs/compliance/CAPITAL-AI-COMP/`, `docs/frontend/`, `docs/seo/` and `docs/social-media/CAPITAL-AI-SOCIAL/`.

The previously recorded Security writer-integrity blocker is resolved: `.ai/work-claims/CAPITAL-AI-SEC-PVC-HANDOFF-CORRELATION-2026-08-31.json` is `released`, and Security project-surface PR #647 is merged.

The previously stale Compliance, Frontend and OPS writer records were correlated and terminalized through merged PR #661. Their current-main records are `released/non-exclusive`; historical blocker text remains evidence only and no longer reserves the owner paths.

### Current-main correlation update

PR #645 materialized Documentary, PR #647 Security, PR #652 Compliance, PR #653 Frontend, PR #654 SEO and PR #655 Social. PR #661 released the correlated stale OPS/FE/COMP writers, and PR #675 merged the User-Lifecycle owner-sequence recorrelation. At `main@a90dc644fb5c8efacdf25e464f2b20c62474501f`, PR #669 is the only open pull request and changes only the separate PVC-claim closure path; it has no file or semantic overlap with this decision candidate.

Exit gate for P6:

1. no runtime/authority mutation is introduced by Governance routing;
2. project-folder mappings remain internally consistent;
3. cross-cutting targets remain without productive PVC ownership;
4. all target-owner project surfaces are materialized on main;
5. stale merged owner claims are terminalized before overlapping follow-up work;
6. owner-side handoff references are normalized where still required.

## P7 — User-Lifecycle Simulation orchestration

**State:** `OWNER_DECISIONS_RECORDED IN CANDIDATE / OPS HANDOFF NEXT`

Prompt: `CAPITAL-AI-USER-LIFECYCLE-SIMULATION-2026-09-01`.

Governance owns only the execution manifest, decision gates, owner/PR dependency topology, findings routing, evidence index and final cross-owner closeout. Productive implementation remains owner-scoped:

- `CAPITAL-AI-OPS`: lifecycle harness, server/provider boundaries, Supabase Local/Mailpit, Stripe Sandbox/Test Clocks and backend/provider remediation;
- `CAPITAL-AI-FE`: login/OAuth/logout UX, pricing/entitlement projection, checkout synchronization and portal/cancellation presentation;
- `CAPITAL-AI-SEC`: independent Security assurance; no implementing owner self-verification;
- `CAPITAL-AI-COMP`: purchase/cancellation technical consumer-compliance assessment; no legal-advice claim.

Canonical orchestration artifacts live under `user-lifecycle-simulation/` and have no authority effect.

Current Owner decisions:

1. `GOV-ULS-DEC-001` — annual Pro price: `248 EUR`, current catalog; no Stripe price migration is authorized;
2. `GOV-ULS-DEC-002` — both local and global logout are required; local logout is the default and global logout is an explicit confirmed action;
3. `GOV-ULS-DEC-003` — Card-only remains the simulation default; dynamic methods need separate authorization;
4. `GOV-ULS-DEC-004` — cancellation at period end remains the simulation default;
5. `GOV-ULS-DEC-005` — Stripe `automatic_tax` stays disabled until tax registrations, Compliance clearance and separate production authorization exist.

Decisions 001/002 originate from the explicit Human/Owner instruction in the current chat. The repository files are non-authorizing projections and become the stable downstream handoff baseline only after Human merge of this scoped decision candidate.

Current downstream correlation:

- the Governance bootstrap is merged via PR #656, its writer is released via PR #661, and the owner-sequence recorrelation is merged via PR #675;
- the fulfilled PR #675 writer is released atomically by this decision candidate;
- the OPS writer blocker is released; `PR-OPS-ULS-HARNESS` is next after Human merge of the stable decision projection;
- FE project and authority writers are released; the two Owner decisions are resolved, so FE remains blocked only by the stable OPS test contract;
- the COMP project writer is released; COMP remains sequenced after OPS/FE evidence and its independent applicability/classification review;
- SEC verification starts only after OPS/FE evidence is available;
- GOV closeout starts only after all owner returns are present.

Consumer-law evidence remains conditional: official BGB §312j/§312k texts contain financial-services exceptions. CAPITAL-AI-COMP / competent legal authority must determine applicability before those technical checks can be treated as mandatory legal PASS/FAIL gates. Governance does not make that legal determination.

Production mutation, deployment, live payments and live provider configuration are outside P7 authorization. Every PR remains exact Base/Head snapshot-gated under current `/AGENTS.md`, and every merge remains Human/CODEOWNER-only.

P7 decision result and next gate:

1. PR #656 merged all six Governance orchestration artifacts;
2. PR #661 released the stale owner-writer metadata recorded by the bootstrap;
3. PR #675 merged the owner-sequence recorrelation;
4. the Owner selected `248 EUR` annual Pro pricing and local/global logout with local default;
5. this candidate records those decisions and releases the fulfilled PR #675 writer without runtime or production mutation;
6. after Human merge, `CAPITAL-AI-OPS` receives the first productive owner handoff;
7. every future PR still requires current-main recorrelation and exact Base/Head Human/Owner approval.

## Dependency order

```text
P1 PVC project model
  -> cross-cutting project surfaces materialized through PRs #645/#647/#652/#653/#654/#655
  -> stale writer cleanup before overlapping target-owner work

P7 User-Lifecycle bootstrap merged through PR #656
  -> stale owner writers released through PR #661
  -> owner sequence recorrelation merged through PR #675
  -> GOV-ULS-DEC-001 and GOV-ULS-DEC-002 recorded in the scoped decision candidate
  -> OPS lifecycle harness through an owner-scoped OPS handoff after decision-projection merge
  -> FE lifecycle projection after decisions + stable OPS contract
  -> SEC independent assurance and COMP consumer assessment after their gates
  -> GOV closeout over merged owner SHAs/evidence

P2 OPS DevelopmentChain project integration is materialized; target-local remediation continues independently.
P3 coordinated FVC decision/migration remains separate and only proceeds if approved.
P4 task register continuously tracks local GOV follow-up and foreign handoff evidence.
P5 consumes the Security PR #631 finding for PVC-05 without transferring Security verification authority.
```

## Definition of Done

The GOV consolidation and follow-up projection are complete when:

- one current project roadmap and task register represent the open GOV work;
- stale merged/superseded claims are terminalized or explicitly routed to their owners before overlapping work;
- P1 remains the canonical PVC project model;
- every known implemented CAPITAL-AI project has a materialized canonical project surface or an explicitly resolved owner-migration target;
- P2/P3/Admin Panel and foreign work are explicitly handed off and never falsely marked complete;
- the Security handoff for PVC-05 is recorded without shifting Security verification or Accepted Risk authority;
- P7 reaches `EVIDENCE_READY_FOR_HUMAN_CLOSEOUT` only after independent owner returns are correlated;
- no parallel Governance, Security, IAM, runtime, scoring, data, release, Frontend, SEO or EventMesh architecture is introduced.
