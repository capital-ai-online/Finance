# M7 — Deployment Identity & Production Platform Mutation Runbook

Status: PLANNED — EXECUTION BLOCKED BY M6
Date: 2026-08-12
Authority: ADR-0061, `docs/architecture/ai-agent/AI_AGENT_DEPLOYMENT_IDENTITY.md`, DEVELOPMENT Chain Execution Policy

## Goal

Establish a bounded, attributable production deployment path that binds a verified source/artifact identity to the exact Render deployment/runtime identity and governs every required external platform mutation through explicit Owner approval, auditable execution and rollback.

## Security Boundary

Production deploy authority is separate from AI-agent repository authority.

No provider/model/tool receives implicit `PRODUCTION_MUTATION` because it can create code, branches, PRs or CI requests.

`MERGE` remains Human/Owner-only.

## Scope

### Primary M7 scope

- Render production deployment identity;
- environment-scoped deployment credentials/hooks/bridge;
- branch/source/artifact binding;
- rotation/revocation;
- controlled deploy verification;
- health/readiness and rollback evidence.

### Conditional scope

Stripe or Supabase mutations are included **only** when a dedicated ADR/runbook/work item explicitly names the exact resource and operation.

### Human-reserved scope

IONOS / DNS / TLS / domain ownership remains Human/Owner-only unless a future dedicated ADR introduces equivalent or stronger assurance.

## Required Trust Chain

```text
verified main source SHA
→ M6 verified artifact/provenance
→ protected deployment request
→ environment-scoped deployment identity
→ exact Render service/environment
→ deployed artifact/commit identity
→ health/readiness verification
→ immutable deployment evidence
```

## Phase 0 — Read-only Preflight

Before any repository or platform change:

1. confirm M6 `COMPLETE / VERIFIED PASS`;
2. resolve current `main` and M6 artifact/provenance evidence;
3. identify exact Render service(s), environment(s), deploy path and currently deployed commit/artifact;
4. inspect current credential/hook ownership, rotation and revocation model without exposing values;
5. identify whether GitHub OIDC can be used directly; where not possible, document the narrow secret bridge and its owner/revocation path;
6. inspect current health/readiness/rollback mechanism;
7. classify each proposed platform mutation individually;
8. prepare a DevelopmentChain Mutation Handoff for each externally mutating target;
9. define last-known-good deploy and rollback trigger;
10. check for active deploy/config writers.

Unknown target/account/environment → `STOP`.

## Repository Implementation

On a fresh branch from current `main`, implement only the repository-side controls required for M7, such as:

- deployment identity verification;
- expected source/artifact binding;
- workflow/environment guardrails;
- deploy request metadata;
- post-deploy health/readiness verification;
- rollback tooling/reference;
- redacted evidence generation.

Workflow/runtime changes are Check Class R and receive the full required validation.

## External Mutation Work Order

Every Render/Supabase/Stripe state change uses:

- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`;
- `.ai/contracts/development-chain-mutation-handoff.schema.json`.

Required binding includes:

- exact platform/account/project/service/environment;
- exact allowed operation;
- expected post-state;
- pre/post checks;
- rollback plan;
- idempotency/concurrency key;
- expiry;
- separate Human Mutation Approval Evidence.

The Handoff itself does not authorize execution.

## Owner Mutation Gate

After repository implementation + required CI and immediately before external mutation:

1. rerun read-only platform precheck;
2. show exact target and proposed state transition;
3. verify rollback is executable;
4. obtain explicit Human/Owner mutation approval;
5. bind approval evidence to the exact target/operation/risk/time window.

Any material drift after approval invalidates or reopens the approval gate.

## Authorized Execution

Preferred autonomous sequence after the Systemadmin Execution Host is independently verified:

```text
validated Handoff
→ REM / IAM / reserved-action policy
→ durable authorization audit
→ exact host permit
→ one bounded platform mutation
→ durable outcome audit
→ post-verification
```

Do not accept arbitrary command strings from issue/comment/model output as mutation instructions.

## Render Verification

After each approved Render mutation/deploy, prove at least:

- exact service/environment targeted;
- expected commit/artifact/source identity deployed;
- health endpoint PASS;
- readiness/deployment status PASS;
- no unexpected environment/config drift;
- runtime identity corresponds to approved source/artifact;
- rollback target remains available;
- audit/evidence correlation complete.

## Stripe Conditional Verification

If M7 explicitly includes a Stripe mutation:

- exact account + live/test mode;
- exact webhook/config/credential resource;
- no live Money/Entitlement mutation unless separately Human-reserved approval explicitly covers it;
- webhook signing/idempotency/mapping checks;
- revocation/rollback path;
- no secret value in evidence.

## Supabase Conditional Verification

If M7 explicitly includes a Supabase mutation:

- exact project/reference;
- exact Auth/DB/config resource;
- no opportunistic repetition of M5/M5A changes;
- RLS/IAM/security advisor implications reviewed where applicable;
- rollback and data-integrity impact proven.

## Required Negative Tests

- deploy request from non-`main` or unverified source → DENY;
- source/provenance/artifact mismatch → DENY;
- wrong Render service/environment → DENY;
- expired/missing Owner mutation approval → DENY;
- Handoff target mismatch → DENY;
- duplicate/replayed mutation request → DENY/DEDUPE;
- execution without durable audit permit → DENY;
- agent attempts `MERGE` → DENY;
- arbitrary platform operation outside Handoff → DENY;
- health/readiness failure → rollback/STOP.

## Rollback

### Deployment rollback

Restore the last-known-good **verified immutable artifact/deployment reference**, then rerun health/readiness/source-identity verification.

### Configuration rollback

Restore the previously captured redacted configuration state through an explicitly authorized rollback operation. Rotate/revoke compromised bridge credentials when relevant.

### Repository rollback

Use a new revert branch from current `main`; never revive a merged implementation branch.

## Evidence

Create `docs/evidence/m7/*` with:

- M6 prerequisite evidence;
- exact source/artifact/deploy identity;
- platform baseline;
- Handoff ID;
- Human Approval Evidence ref;
- authorization/outcome audit refs;
- mutation result;
- post-verification;
- rollback state;
- branch deletion state.

## Exit Gate

M7 is `COMPLETE / VERIFIED PASS` only when:

1. M6 prerequisite is verified;
2. repository controls are merged and validated;
3. every required external mutation is separately Human-approved;
4. every required external mutation is `VERIFIED PASS` or safely `FAILED / ROLLED BACK` with the phase still blocked;
5. production deployment identity binds exact verified source/artifact to runtime;
6. negative tests pass;
7. rollback is proven;
8. Evidence and Roadmap/Traceability are synchronized;
9. work branches are deleted.

Only a fully `VERIFIED PASS` M7 unblocks M8.