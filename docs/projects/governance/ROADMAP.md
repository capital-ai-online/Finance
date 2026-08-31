# CAPITAL-AI-GOV — Consolidated Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Baseline:** `main@1f55340d89178fb5c1ab735242f42c263918b692`  
**Trust root:** `/AGENTS.md`  
**Role:** roadmap / execution projection — non-authorizing

## P1 — Project Architecture

**State:** `CONSOLIDATED ON MAIN VIA PR #630`

Deliverables:

- `docs/projects/` as canonical organizational project execution surface;
- `PVC-01..PVC-18` as qualified Project Value Chain namespace;
- one Primary Project Owner per PVC stage;
- cross-cutting projects excluded from Primary PVC ownership unless separately authorized;
- DevelopmentChain separated from project ownership and technical runtime;
- cross-project compatibility marker retained while structured `project_stage: PVC-NN` removes ambiguity;
- no current technical `SC-MD-SPT-0001` stage renumbered by P1.

Exit gate: exact-candidate documentation/governance validation, no parallel writer, final main synchronization and Human/Owner PR-create approval.

## P2 — DevelopmentChain Integration

**State:** `REFERRED_NOT_EXECUTED`

Target project: `CAPITAL-AI-OPS`.

GOV defines the target lifecycle and ownership contract in `../PROJECT_EXECUTION_MODEL.md`. Actual execution requires the OPS owner to create/migrate `docs/projects/operations/` and bind the DevelopmentChain there without replacing existing DevelopmentChain, CI, release, production or Human approval authorities.

Historical M0-M10 artifacts remain discoverable. M10 remains `SUSPENDED / OFF`.

Handoff: `P2_DEVELOPMENT_CHAIN_HANDOFF.md`.

## P3 — Financial VC Namespace Migration

**State:** `ASSESSED / CROSS_PROJECT DECISION REQUIRED`

Current `SC-MD-SPT-0001` remains active with technical financial `VC-01..VC-18`. Recommended target, only if all affected owners approve a coordinated migration: `FVC-01..FVC-18` for the financial technical chain while `PVC-*` remains project ownership/routing.

GOV does not perform foreign technical migration. DATA, FINTECH, DOC, QM and OPS are explicit dependencies/owners.

Assessment: `P3_FVC_NAMESPACE_ASSESSMENT.md`.

## P4 — Governance execution backlog consolidation

**State:** `MERGED VIA PR #630 / MAINTENANCE`

The project-chat and terminal GOV branch consolidation is represented in `TASK_REGISTER.md`. Completed tasks remain traceable; pending local tasks are explicit; foreign work is converted to handoffs. Historical branches are reuse evidence only and are not independent merge sources.

PR #630 established the Owner-directed branch naming convention, consolidated project/PVC artifacts and the Admin Panel handoffs. Its work claim is terminalized as `merged` in the current Security-handoff follow-up because the merged/deleted branch no longer represents a live writer.

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

## Dependency order

```text
P1 PVC project model
  -> P2 OPS DevelopmentChain project integration
  -> P3 coordinated FVC decision/migration, if approved

P4 task register continuously tracks local GOV follow-up and foreign handoff evidence.
P5 consumes the Security PR #631 finding for PVC-05 without transferring Security verification authority.
```

## Definition of Done

The GOV consolidation and follow-up projection are complete when:

- one current project roadmap and task register represent the open GOV work;
- old GOV branches have no active writer claim;
- stale merged claims are terminalized;
- P1 remains the canonical PVC project model;
- P2/P3/Admin Panel foreign work is explicitly handed off and never falsely marked complete;
- the Security handoff for PVC-05 is recorded without shifting Security verification or Accepted Risk authority;
- no parallel Governance, Security, IAM, runtime, scoring, data, release or EventMesh architecture is introduced.
