# Autonomous Agent Roadmap Gate

Status: REQUIRED
Date: 2026-08-12
Authority: ESS-0019, ESS-0021, ADR-0057, ADR-0058, ADR-0065, HUMAN_OWNER_PR_APPROVAL_POLICY.md

## Purpose

Prevent ad-hoc creation or enablement of privileged autonomous/semi-autonomous agents while allowing low-risk daily automation through strictly read-only agents and a separately governed Systemadmin Roadmap Executor profile.

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

The approved roadmap does not itself authorize a generic production mutation. Every mutation must remain inside the exact authority model defined by the approved roadmap, ADRs and the active mandate/policy.

## Systemadmin Roadmap Executor profile

The only privileged profile that may operate from a standing Roadmap authorization instead of repeated per-PR creation prompts is:

`capital-ai-systemadmin-roadmap-executor`

Authority: ESS-0021, ADR-0065 and `SYSTEMADMIN_AGENT_ROADMAP_EXECUTION_POLICY.md`.

The profile MUST operate under an active Human/Owner-approved **Roadmap Execution Mandate (REM)**. The REM is a bounded, expiring, attributable authorization tied to one Roadmap segment, one repository/base branch, explicit paths/targets, explicit capabilities, maximum risk, mutation classes, tests, rollback, audit and kill switch.

A REM does not grant generic administrator authority.

### Standing repository authorization

Within a valid REM, the Systemadmin profile MAY autonomously use the explicitly granted repository capabilities:

- READ
- ANALYZE
- PLAN
- BRANCH
- COMMIT
- PR
- CI_REQUEST

The agent may therefore execute a covered Roadmap work package from read-only analysis through a review-ready Pull Request without requesting a new Human authorization for each branch, commit or PR.

This standing authority is valid only while every action remains inside the mandate. Expiry, revocation, scope drift, target mismatch, self-elevation attempt or a material Roadmap change invalidates it and causes STOP.

### External platform mutation

External production mutation is not implied by repository standing authority.

`PRODUCTION_MUTATION` may be delegated only after the Control Plane can technically enforce REM identity, exact target, mutation class, expiry, risk, preconditions, rollback and postcondition evidence. Until that capability is VERIFIED PASS, the Systemadmin Agent is autonomous only for repository/branch/PR mutations and explicitly non-production environments.

### Non-delegable Owner boundary

The following remain Human/Owner-controlled under this profile:

- PR merge;
- weakening repository protections/Human gates;
- Owner/admin IAM elevation;
- Owner MFA reset/removal and break-glass;
- secret disclosure or unrestricted credential rotation;
- destructive production data operations;
- live billing money/entitlement mutation;
- production resource deletion;
- DNS/TLS/domain ownership change;
- disabling security/audit/RLS/consent controls;
- expansion or extension of the subject agent's own REM.

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

For a Systemadmin Roadmap Executor, the package additionally MUST include or reference a machine-readable REM conforming to `docs/governance/ROADMAP_EXECUTION_MANDATE.schema.json` before enablement.

## Approval sequence for privileged agents

Default privileged-agent sequence:

`DEEP RESEARCH + REPO READ → ESS/ADR → ROADMAP DRAFT → OWNER REVIEW → OWNER APPROVED → IMPLEMENTATION PR → TECHNICAL VALIDATION → OWNER PR REVIEW → ENABLEMENT TEST → EVIDENCE → ENABLED`

Systemadmin sequence after ESS-0021/ADR-0065 enablement:

`DEEP RESEARCH + REPO READ → ROADMAP PACKAGE → OWNER APPROVES REM → SYSTEMADMIN EXECUTES COVERED WORK PACKAGES → PR → OWNER REVIEW/CI → HUMAN MERGE`

No step may bypass mandate validation, Owner final PR review or merge authority.

## Mutation restriction

For normal privileged agents, every production mutation still follows:

`PRE-MUTATION TEST → HUMAN APPROVAL → MUTATION → POST-MUTATION VERIFICATION → EVIDENCE → NEXT PHASE`

For the Systemadmin profile, a future technically enforced REM MAY represent the Human approval for a specifically enumerated bounded/reversible production mutation class. Until that enforcement is VERIFIED PASS, production mutation continues to require a separate Human approval exactly as before.

A failed or inconclusive verification results in STOP and, where defined, rollback.

## Human-only transitions

The following remain Human/Owner-controlled unless a future separately approved ADR explicitly changes the model:

- approval of a roadmap package / REM for a privileged Systemadmin agent;
- PR merge authorization;
- non-delegable Owner actions listed above;
- transition to the next DevelopmentChain phase after a failed/inconclusive mutation/test gate;
- expansion or renewal of the Systemadmin REM.

## Owner authentication / passkey note

The target security model SHOULD use WebAuthn/passkey step-up for privileged roadmap/REM approvals and production mutations, bound to actor + action + target + request/PR head where applicable. GitHub Actions cannot currently prove which physical device or passkey was used for a GitHub review; therefore repository workflows MUST NOT claim that a GitHub review alone proves device/passkey authentication.

A device identifier by itself is not accepted as a strong authentication factor. Until a CAPITAL-AI WebAuthn approval service exists, GitHub account identity `SvenKulessa` plus the current Human/Owner PR gate remains the enforceable repository evidence, and delegated production mutation remains disabled unless a separately accepted interim ADR provides equivalent assurance.

## Provider neutrality

ChatGPT, Claude, Gemini/Google AI Studio and future clients are execution/development clients only. Provider/model identity grants no authority. NotebookLM and daily research agents remain read-only unless a later roadmap package explicitly elevates capabilities under Human/Owner approval.

## Evidence

Each privileged agent roadmap package must be linked from `docs/architecture/ROADMAP.md` and the M0–M10 traceability matrix before implementation. The final enablement evidence records the approved roadmap version, ESS/ADR references, REM identifier where applicable, PR/commit SHA, test results, mutation evidence if any and the Owner approval reference.

## Branch lifecycle

Privileged mutating work uses a fresh branch from current `main`. After successful merge into the Finance repository, the branch MUST be deleted. Closed/superseded work branches are removed after necessary Evidence retention. Merged branches are never reused for a new Roadmap item.
