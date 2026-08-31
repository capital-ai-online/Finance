# CAPITAL-AI-GOV — Consolidated Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Baseline:** `main@64a3415781a50177798cbe9404b1855735e5371a`  
**Trust root:** `/AGENTS.md`  
**Role:** roadmap / execution projection — non-authorizing

## P1 — Project Architecture

**State:** `CONSOLIDATED ON CURRENT-MAIN CANDIDATE`

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

**State:** `ACTIVE IN THIS CANDIDATE`

The current project chat and terminal GOV branches are consolidated into `TASK_REGISTER.md`. Completed tasks remain traceable; pending local tasks are explicit; foreign work is converted to handoffs. Historical branches are reuse evidence only and are not independent merge sources.

This package also:

- records the Owner-directed branch naming convention as a pending Trust-Root/control clarification rather than creating a parallel project rule;
- closes stale merged Claim metadata from PR #629;
- preserves compact PR template and direct Chat/API/MCP/Connector PR transport already merged through PRs #628 and #629;
- records the Admin Panel process/dependency graph as CLIENT/OPS implementation handoff with GOV semantic ownership only.

## Dependency order

```text
P1 PVC project model
  -> P2 OPS DevelopmentChain project integration
  -> P3 coordinated FVC decision/migration, if approved

P4 task register continuously tracks local GOV follow-up and foreign handoff evidence.
```

## Definition of Done

The GOV consolidation is complete when:

- one current project roadmap and task register represent the open chat work;
- old GOV branches have no active writer claim;
- stale merged claims are terminalized through the consolidation PR;
- P1 is validation-ready on current main;
- P2/P3/Admin Panel foreign work is explicitly handed off and never falsely marked complete;
- no parallel Governance, runtime, scoring, data, release or EventMesh architecture is introduced.
