# Autonomous Agent Concept Gate

Status: PROPOSED FOR M4 CLOSURE
Date: 2026-08-11
Authority: ESS-0019, ADR-0057, ADR-0058, HUMAN_OWNER_PR_APPROVAL_POLICY.md

## Purpose

Prevent ad-hoc creation or enablement of autonomous/semi-autonomous agents before their operating model is predefined, documented in the DevelopmentChain roadmap and explicitly approved by the Human/Owner.

## Binding rule

No autonomous or semi-autonomous agent may be created, enabled, connected to production credentials, granted mutation capability or allowed to execute a roadmap phase solely because a chat, prompt, model or tool proposes it.

Before implementation starts, an agent concept MUST exist and MUST be Human/Owner-approved.

## Required concept content

Every agent concept must define:

1. agent name, purpose and accountable human owner;
2. provider/client profile and runtime location;
3. exact allowed capabilities;
4. explicitly prohibited capabilities;
5. target repositories/platforms/resources;
6. environment boundaries;
7. risk classification per capability;
8. human approval points;
9. production mutation points;
10. pre-mutation tests;
11. post-mutation verification;
12. telemetry/audit fields and evidence retention;
13. credential-holder model;
14. rollback, revocation and kill-switch procedure;
15. success/exit criteria;
16. next roadmap phase that becomes eligible after PASS.

## Approval sequence

`CONCEPT DRAFT → OWNER REVIEW → OWNER APPROVED → IMPLEMENTATION PR → TECHNICAL VALIDATION → OWNER PR REVIEW → ENABLEMENT TEST → EVIDENCE → ENABLED`

No step may be skipped.

## Mutation restriction

An approved agent concept does not itself authorize a production mutation. Every named mutation must still follow the ROADMAP mutation gate:

`PRE-MUTATION TEST → HUMAN APPROVAL → MUTATION → POST-MUTATION VERIFICATION → EVIDENCE → NEXT PHASE`

A failed or inconclusive verification results in STOP and, where defined, rollback.

## Human-only transitions

The following remain Human/Owner-controlled unless a future separately approved ADR explicitly changes the model:

- approval of a new agent concept;
- approval of HIGH/CRITICAL production actions;
- PR merge authorization;
- production mutation authorization;
- transition to the next DevelopmentChain phase after a mutation/test gate.

`MERGE` is not an agent capability.

## Provider neutrality

ChatGPT, Claude, Gemini/Google AI Studio and future clients are execution or development clients only. Provider/model identity grants no authority. NotebookLM remains research/evidence-only unless a future Human/Owner-approved concept explicitly changes its profile.

## Evidence

Each approved concept must be linked from `docs/architecture/ROADMAP.md` and the M0–M9 traceability matrix before implementation. The final enablement evidence must record the approved concept version, PR/commit SHA, test results, mutation evidence if any and the Owner approval reference.
