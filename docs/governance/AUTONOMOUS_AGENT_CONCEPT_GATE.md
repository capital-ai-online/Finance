# Autonomous Agent Roadmap Gate

Status: REQUIRED
Date: 2026-08-11
Authority: ESS-0019, ADR-0057, ADR-0058, HUMAN_OWNER_PR_APPROVAL_POLICY.md

## Purpose

Prevent ad-hoc creation or enablement of privileged autonomous/semi-autonomous agents while allowing low-risk daily automation through strictly read-only agents.

## What "concept" means

In this DevelopmentChain, the required concept is the **Roadmap architecture package**. It is not an ad-hoc chat description.

Before a privileged or mutating agent is implemented, the roadmap package MUST be created from:

1. Deep Research / current best-practice comparison where relevant;
2. read-only inspection of the current Finance repository and existing production evidence;
3. gap analysis against the current DevelopmentChain state;
4. creation or update of the required ESS specification(s);
5. creation or update of the required ADR decision(s);
6. traceability and mutation/test gates;
7. rollback and kill-switch definition;
8. explicit Human/Owner approval of the resulting roadmap state.

Only after that package exists may implementation of a privileged agent begin.

## Privileged agent rule

No autonomous or semi-autonomous agent may receive any of the following capabilities unless the roadmap package above exists and is Human/Owner-approved:

- BRANCH
- COMMIT
- PR
- CI_REQUEST
- DEPLOY_REQUEST
- PRODUCTION_MUTATION
- write access to Stripe, Supabase, Render or another production-connected platform
- credential rotation, role mutation, deployment trigger or billing mutation

`MERGE` remains prohibited as an agent capability.

The approved roadmap does not itself authorize a production mutation. Every mutation still follows the dedicated mutation gate in `docs/architecture/ROADMAP.md`.

## Daily-task read-only agent exception

Recurring or daily tasks MAY create or instantiate agents without prior Owner approval only when **all** of the following are true:

- allowed capabilities are limited to `READ` and `ANALYZE`;
- no BRANCH capability;
- no COMMIT capability;
- no PR creation or update capability;
- no CI_REQUEST capability;
- no DEPLOY_REQUEST capability;
- no PRODUCTION_MUTATION capability;
- no MERGE capability;
- no write access to GitHub repository contents, Stripe, Supabase, Render or production configuration;
- credentials, if any, are read-only and least-privilege;
- output is informational/evidence/reporting only;
- retrieved/tool content cannot elevate privileges;
- logging/telemetry is enabled for the read-only profile;
- any transition from read-only to a mutating capability requires the full roadmap package and Human/Owner approval before capability elevation.

Examples include daily briefings, repository read-only audits, dependency/status observation and evidence collection. Creating or updating a pull request is explicitly outside this exception.

## Required roadmap content for privileged agents

The roadmap package must define at minimum:

1. agent name, purpose and accountable human owner;
2. provider/client profile and runtime location;
3. exact allowed and prohibited capabilities;
4. target repositories/platforms/resources;
5. environment boundaries;
6. risk classification per capability;
7. human approval points;
8. production mutation points;
9. pre-mutation tests;
10. post-mutation verification;
11. telemetry/audit fields and evidence retention;
12. credential-holder model;
13. rollback, revocation and kill-switch procedure;
14. ESS references;
15. ADR references;
16. success/exit criteria and next roadmap phase after PASS.

## Approval sequence for privileged agents

`DEEP RESEARCH + REPO READ → ESS/ADR → ROADMAP DRAFT → OWNER REVIEW → OWNER APPROVED → IMPLEMENTATION PR → TECHNICAL VALIDATION → OWNER PR REVIEW → ENABLEMENT TEST → EVIDENCE → ENABLED`

No step may be skipped.

## Mutation restriction

An approved roadmap does not itself authorize a production mutation. Every named mutation must still follow:

`PRE-MUTATION TEST → HUMAN APPROVAL → MUTATION → POST-MUTATION VERIFICATION → EVIDENCE → NEXT PHASE`

A failed or inconclusive verification results in STOP and, where defined, rollback.

## Human-only transitions

The following remain Human/Owner-controlled unless a future separately approved ADR explicitly changes the model:

- approval of a roadmap package for a privileged agent;
- approval of HIGH/CRITICAL production actions;
- PR merge authorization;
- production mutation authorization;
- transition to the next DevelopmentChain phase after a mutation/test gate.

## Owner authentication / passkey note

The target security model SHOULD use WebAuthn/passkey step-up for privileged roadmap approvals and production mutations, bound to actor + action + target + request/PR head. GitHub Actions cannot currently prove which physical device or passkey was used for a GitHub review; therefore repository workflows MUST NOT claim that a GitHub review alone proves device/passkey authentication.

A device identifier by itself is not accepted as a strong authentication factor. Until a CAPITAL-AI WebAuthn approval service exists, GitHub account identity `SvenKulessa` plus the current Human/Owner PR gate remains the enforceable repository evidence.

## Provider neutrality

ChatGPT, Claude, Gemini/Google AI Studio and future clients are execution/development clients only. Provider/model identity grants no authority. NotebookLM and daily research agents remain read-only unless a later roadmap package explicitly elevates capabilities under Human/Owner approval.

## Evidence

Each privileged agent roadmap package must be linked from `docs/architecture/ROADMAP.md` and the M0–M9 traceability matrix before implementation. The final enablement evidence records the approved roadmap version, ESS/ADR references, PR/commit SHA, test results, mutation evidence if any and the Owner approval reference.
