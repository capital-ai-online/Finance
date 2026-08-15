# Systemadmin Agent Roadmap Execution Policy

Status: PROPOSED
Date: 2026-08-12
Authority: ESS-0021, ADR-0065, ESS-0019, ADR-0058, HUMAN_OWNER_PR_APPROVAL_POLICY.md
Accountable Owner: `SvenKulessa`

## 1. Purpose

This policy introduces a privileged **Systemadmin Roadmap Executor** profile for CAPITAL-AI. The purpose is to let an approved agent execute larger, coherent Roadmap work packages autonomously inside ChatGPT/connected execution clients without requiring a new human authorization for every branch, commit or Pull Request.

The profile is not an unrestricted administrator. Authority is delegated through a bounded, expiring, auditable **Roadmap Execution Mandate (REM)**.

The target operating model is:

`OWNER-APPROVED ROADMAP MANDATE → READ/ANALYZE → SECURITY PREFLIGHT → BRANCH → IMPLEMENT → TEST → COMMIT → PR → OWNER REVIEW → CI → HUMAN MERGE`

## 2. Systemadmin principal

Canonical logical agent id:

`capital-ai-systemadmin-roadmap-executor`

Provider/model identity is metadata only. ChatGPT, Claude or another client may host the profile, but the authority derives only from a valid REM plus the provider-neutral Agent IAM/Control Plane.

The execution principal MUST remain attributable through:

`human_actor → client/app → agent → session → request → mandate → capability → target → decision → result → evidence`

Credentials remain in the connector/tool host. Raw reusable credentials MUST NOT be exposed to the model.

## 3. Roadmap Execution Mandate (REM)

A REM is a Human/Owner-approved standing authorization for one bounded Roadmap segment. It replaces repeated per-PR creation prompts only within its exact scope.

The following single-use section rule applies to every human or agentic administrator principal. A mutation grant is valid for exactly one named Roadmap section/work package and exactly one bound administrator principal. It MUST bind approval id, current `main` SHA, branch, targets, enumerated operations, risk ceiling, expiry, pre/post checks, rollback and audit path. The Execution Host MUST atomically consume the grant before the first side effect. Success, failure, cancellation or rollback permanently consumes it; retry requires a new Owner approval. Replay, concurrent consumption or any principal/scope/SHA/target/operation/risk/time drift is `DENY`.

A valid REM MUST define at minimum:

- immutable `mandateId`;
- Owner actor id;
- subject agent id;
- repository and base branch;
- exact Roadmap/ESS/ADR references;
- allowed paths and target resources;
- allowed capabilities;
- maximum risk class;
- explicitly permitted mutation classes;
- prohibited/reserved mutation classes;
- validity window / expiry;
- maximum simultaneous branches/PRs;
- CI-budget policy reference;
- precondition/security checks;
- required tests;
- rollback strategy;
- kill-switch / revocation procedure;
- audit/evidence requirements.

A mandate is invalid when expired, revoked, its Roadmap state changed materially, the branch base is stale in a security-relevant way, or the requested action exceeds any declared scope.

## 4. Capabilities under an active REM

The Systemadmin Agent MAY receive the following capabilities without a new per-action Human prompt when they are explicitly listed in the active REM:

- `READ`
- `ANALYZE`
- `PLAN`
- `BRANCH`
- `COMMIT`
- `PR`
- `CI_REQUEST`

This permits the agent to take an approved Roadmap work package from current-state analysis through a review-ready Pull Request, including multiple scoped commits and automated remediation of technical failures before final Owner review.

`MERGE` is not and MUST NOT become an Agent IAM capability.

A section grant may contain multiple operations only when every operation is fully enumerated before approval. It is not a reusable standing administrator session and cannot authorize newly discovered follow-up work.

## 5. Repository mutation authority

Repository mutations are the default autonomous mutation class for this profile.

The agent MAY autonomously:

- create a fresh work branch from current `main`;
- change files covered by the REM;
- create/update tests and Evidence;
- commit scoped changes;
- update its own PR while the final Human/Owner review has not yet been issued;
- create a Draft or review-ready PR when the work package exit criteria are met;
- inspect CI and repair failures that remain inside the approved scope;
- synchronize Roadmap/ADR/ESS/Evidence inside the same approved work package.

A scope expansion beyond the REM is a STOP condition and requires a new or amended Owner-approved mandate.

## 6. External platform mutation authority

External production mutation is **not implied** by repository-write authority.

A REM MAY explicitly grant `PRODUCTION_MUTATION` only for a named, bounded and reversible mutation whose exact target and mutation class are declared before execution and whose Control-Plane implementation can technically enforce the mandate.

Before any delegated production mutation, all of the following MUST be true:

1. the Roadmap/ADR/ESS explicitly requires the exact mutation;
2. the REM explicitly includes `PRODUCTION_MUTATION`, target and mutation class;
3. the mandate approval used strong Owner step-up once the M10/WebAuthn approval service exists; until then such delegated production mutation remains disabled unless a separately accepted interim ADR says otherwise;
4. a read-only pre-mutation baseline passes;
5. the change is bounded, reversible and idempotent/replay-protected where applicable;
6. rollback is executable before mutation;
7. post-mutation verification is deterministic;
8. audit evidence records mandate, actor, agent, request, target, result and rollback state.

Until the technical Control Plane supports REM-bound production authorization, the Systemadmin Agent's autonomous mutation authority is limited to repository/branch/PR state and explicitly non-production environments.

## 7. Non-delegable Owner actions

The following remain Human/Owner-controlled even when a REM exists unless a future dedicated ADR explicitly changes one item with equivalent or stronger authentication:

- Pull Request merge;
- weakening branch protection, CODEOWNERS, required checks or Human/Owner gates;
- Owner/admin role elevation or IAM policy weakening;
- Owner MFA reset, recovery/break-glass activation or factor removal;
- secret/API-key/credential disclosure or unrestricted credential rotation;
- destructive production database operations or bulk user-data deletion;
- live billing/price/subscription/credit mutations that can directly change customer money or entitlement;
- production resource deletion;
- DNS/TLS/domain ownership changes;
- disabling security, audit, RLS, append-only or consent controls;
- expanding the agent's own mandate, capabilities, target set or expiry;
- reusing, transferring or replaying a consumed section approval.

The agent can prepare these changes and their runbooks, but it must stop before execution.

## 8. Mandatory security preflight

Before opening or mutating a work branch, the Systemadmin Agent MUST perform a read-only preflight:

1. resolve current `main` SHA and Roadmap state;
2. identify the next unblocked work package;
3. check open PR changed-file overlap;
4. inspect relevant code, ADR, ESS, Evidence and production state read-only where needed;
5. perform Deep Research/current best-practice review for security/architecture-sensitive work where relevant;
6. classify PR class D/C/R/M;
7. classify every requested capability/risk;
8. verify mandate validity and path/target scope;
9. verify no reserved Owner-only action is required;
10. define tests, negative tests, rollback and evidence;
11. estimate CI scope and avoid redundant full runs.

Any inconclusive security-critical precondition is DENY/STOP, not an invitation to guess.

## 9. Autonomous execution loop

Within a valid REM the agent MAY execute continuously:

`ROADMAP READ → PREFLIGHT → BRANCH → IMPLEMENT → TARGETED TESTS → SECURITY SELF-CHECK → COMMIT → REPEAT UNTIL WORK PACKAGE COMPLETE → PR`

After PR creation:

- the agent may repair CI/governance defects before final Human/Owner review;
- every new commit invalidates any earlier current-head Owner review;
- once the Owner has performed the final current-head review/Viewed attestations, the agent must not silently expand scope;
- merge remains a separate Human/Owner action.

## 10. CI and cost control

The Systemadmin Agent MUST respect the repository CI budget policy.

Default behavior:

- targeted local/read-only/static checks during implementation;
- no intentional repeated expensive full CI runs for the same unchanged head;
- one normal final `build-and-test` run after the Human/Owner gate unless a remediation commit makes revalidation necessary;
- do not rerun a known-invalid gate without changing the failing precondition.

## 11. Audit and evidence

Every autonomous mutating action MUST be correlated to the active mandate and, where the M5 audit path is available, record at least:

- `mandateId`;
- Roadmap item/work-package id;
- human actor id;
- agent/client/session/request ids;
- capability;
- risk class;
- target resource;
- branch/commit/PR identifiers where applicable;
- authorization verdict;
- execution result;
- rollback status when applicable.

No secrets, raw tokens, full sensitive prompts or raw private request/response bodies belong in audit evidence.

## 12. Kill switch and revocation

Owner can revoke a REM at any time. Revocation immediately removes all mutating capabilities for the mandate.

Automatic STOP/revocation conditions include:

- mandate expiry;
- target/path scope mismatch;
- attempted reserved action;
- unexplained production drift affecting the work package;
- security-control regression;
- unresolvable concurrent-writer conflict;
- repeated verification failure;
- missing audit correlation;
- credential/identity ambiguity.

## 13. Branch lifecycle

Every Systemadmin work package uses a dedicated branch. A cloned repository/work branch is temporary execution state, not a persistent product artifact.

Mandatory lifecycle:

`current main → new scoped branch → commits → PR → successful Human merge → branch deletion`

After a successful PR merge into the Finance repository, the work branch MUST be deleted. A branch from a closed/superseded PR MUST also be removed after necessary Evidence has been retained. The agent MUST NOT reuse an old merged branch for a new Roadmap item.

## 14. Relationship to ADR-0039 and current PR governance

ADR-0039's per-PR creation authorization remains the default for normal interactive agents.

For the Systemadmin Agent only, an active Owner-approved REM is the PR-creation authorization for all PRs that remain inside the mandate. The agent does not ask again before each scoped PR.

This exception does **not** remove:

- Files-changed/Viewed Human review;
- current-head `💪`/`okay` Owner review;
- scope-appropriate CI;
- separate Human merge authority.

## 15. Enablement gate

This policy does not itself enable the agent.

Enablement requires:

1. ESS-0021 + ADR-0065 + Roadmap package merged;
2. Control-Plane support for REM validation where technical enforcement is required;
3. negative tests for scope, expiry, self-elevation, reserved actions and kill switch;
4. M5 audit correlation verified for Systemadmin actions;
5. Human/Owner approval of the first concrete REM.

Only then may the Systemadmin Agent operate without per-PR creation prompts inside that mandate.
