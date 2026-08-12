# ADR-0065 — Systemadmin Roadmap Execution Mandate

**Status:** Proposed  
**Date:** 2026-08-12  
**Decision owners:** CAPITAL-AI Owner / Platform Director / Security & Compliance  
**Supersedes:** ADR-0039 §1 only for the Systemadmin profile while a valid Owner-approved REM is active  
**Related:** ESS-0019, ESS-0021, ADR-0058, ADR-0059, ADR-0063

## Context

CAPITAL-AI currently requires explicit Human authorization before every Pull Request created by an interactive agent. This provides a strong authorization boundary, but it also creates repeated low-information approval steps when a Roadmap package already defines a larger coherent implementation sequence.

The desired operating model is to let one privileged Systemadmin Agent execute an Owner-approved Roadmap segment autonomously through analysis, branch creation, implementation, testing, commits and Pull Request creation while preserving the existing Human review and merge boundary.

The current Control Plane already defines provider-neutral principal attribution, explicit capabilities, risk classes, approvals, kill switch and append-only audit correlation. The missing element is a bounded standing authorization that is wider than one PR but narrower than unrestricted administrator authority.

External risk-management guidance supports this direction only when roles, scope, oversight and least privilege remain explicit. NIST AI RMF emphasizes defined human/AI roles and documented human oversight. OWASP's Excessive Agency guidance recommends minimizing extension privileges and requiring Human approval for high-impact actions.

## Decision

### 1. Introduce the Systemadmin Roadmap Executor

CAPITAL-AI introduces the logical agent profile:

`capital-ai-systemadmin-roadmap-executor`

The profile is provider-neutral. ChatGPT, Claude or another execution client can host it only when actions remain attributable to the same logical agent and Control-Plane policy.

### 2. Introduce Roadmap Execution Mandates (REM)

A Human/Owner-approved **Roadmap Execution Mandate** is the standing authorization for one bounded Roadmap segment.

A REM binds at minimum:

- Owner actor;
- subject agent;
- repository/base branch;
- Roadmap/ESS/ADR scope;
- paths and target resources;
- allowed capabilities;
- maximum risk;
- allowed and prohibited mutation classes;
- validity/expiry;
- tests, rollback and Evidence;
- kill switch.

The REM is not transferable to another agent, repository, Roadmap item or target.

### 3. Partial exception to ADR-0039

ADR-0039's explicit per-PR creation authorization remains the default for all normal interactive agents.

For the Systemadmin Roadmap Executor only, a valid REM counts as standing authorization to create and update Pull Requests whose complete scope is covered by that mandate. No additional per-PR creation prompt is required.

A material scope expansion, mandate expiry/revocation or target/path mismatch immediately restores the default ADR-0039 behavior and requires new Human authorization.

### 4. Autonomous repository mutation scope

Under a valid REM the Systemadmin profile may autonomously use:

`READ → ANALYZE → PLAN → BRANCH → COMMIT → PR → CI_REQUEST`

This includes iterative remediation before the final Human/Owner PR review.

`MERGE` remains unavailable to agents.

### 5. External production mutation is separately constrained

This ADR does not convert policy text into immediate production-write authority.

`PRODUCTION_MUTATION` can only be delegated later when the Control Plane technically validates REM identity, scope, expiry, exact target, mutation class, risk, rollback and audit evidence.

Until that technical enforcement exists and is VERIFIED PASS, Systemadmin autonomy stops at repository/branch/PR mutation and non-production environments.

### 6. Reserved Human/Owner actions

The following remain non-delegable under this ADR:

- PR merge;
- weakening repository/security/Human-review controls;
- Owner/admin IAM elevation;
- Owner MFA reset/recovery/break-glass;
- secret disclosure and unrestricted credential rotation;
- destructive production database/data operations;
- live billing mutations affecting money/entitlement;
- production resource deletion;
- DNS/TLS/domain ownership changes;
- disabling RLS/audit/security/consent controls;
- expansion or extension of the REM by the subject agent.

### 7. Mandatory security preflight

Before each Roadmap work package the agent performs a read-only security preflight against current main, Roadmap state, open PR overlap, relevant ADR/ESS/Evidence, risk/check class, tests, rollback and CI scope.

Any security-critical ambiguity fails closed.

### 8. Human review and merge remain independent controls

Systemadmin PRs continue to use the existing Owner gate:

`Files changed / Viewed → current-head review (💪/okay) → Owner checkboxes last → build-and-test`

Successful CI does not authorize merge. Merge remains a separate Human/Owner instruction.

### 9. Branch lifecycle becomes mandatory

Every Systemadmin work package uses a fresh branch from current main. After successful merge into `Finance`, that branch MUST be deleted. Closed/superseded work branches are also removed after necessary Evidence retention. A merged branch is never reused.

## Consequences

### Positive

- One meaningful Owner decision can authorize a complete Roadmap work package rather than repeated low-value per-PR prompts.
- The agent can autonomously iterate through implementation and technical remediation up to a review-ready PR.
- Existing current-head Owner review, CI and merge separation remain intact.
- Mandate scope, expiry, targets and kill switch provide a narrower trust boundary than a permanent administrator role.
- Audit correlation can bind every mutation to one approved Roadmap mandate.

### Trade-offs

- Standing authority increases blast radius if mandate scope is too broad.
- REM creation/review therefore becomes a security-critical governance action.
- Control-Plane support is required before external production mutations can safely use standing authorization.
- Roadmap packages must be written with sufficiently concrete boundaries to be enforceable.

## Threat model

Primary threats:

1. **Scope creep:** agent changes files/targets not covered by the mandate.
2. **Self-elevation:** agent edits its own grant, expiry, target set or policy.
3. **Prompt/tool injection:** retrieved content attempts to alter authority.
4. **Stale-roadmap execution:** agent acts on an obsolete baseline.
5. **Concurrent writer conflict:** another PR changes the same protected area.
6. **Repeated CI consumption:** autonomous retries exceed budget without changing preconditions.
7. **Production blast radius:** a broad mandate is interpreted as generic admin authority.

Required mitigations:

- exact mandate binding and deny-by-default;
- current-main/read-only preflight;
- path/target allowlists;
- explicit reserved Human actions;
- no self-approval/self-extension;
- kill switch and expiry;
- audit correlation;
- negative tests;
- one-run CI discipline;
- no delegated external production mutation until technical REM enforcement is verified.

## Rollback

This governance package is repository-only. Rollback is a protected Git revert of ADR-0065, ESS-0021 and related policy updates.

If a Systemadmin REM has already been enabled, rollback additionally requires immediate mandate revocation/kill-switch activation before reverting repository policy.

No production platform mutation is authorized by accepting this ADR alone.

## References

- NIST AI Risk Management Framework — human roles, oversight and continuous risk management.
- OWASP GenAI Security Project, LLM06:2025 Excessive Agency — least privilege and Human approval for high-impact actions.
