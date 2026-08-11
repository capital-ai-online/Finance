# ADR-0058 — Agent Identity, Capability and Risk Authorization

Status: ACCEPTED — M4 CLOSURE HARDENING IN REVIEW
Date: 2026-08-11

## Context
Provider identities and model names are not sufficient authorization principals. CAPITAL-AI already has Supabase/tool-specific capability grants and single-use approvals under ADR-0050/0051 and ESS-0018. M4 adds a provider-neutral authorization layer above those existing controls without replacing them.

PR #198 merged the canonical M4 implementation into `main` at `69f719683b60ba6aadc0022381c6cecc430f0ea5`. Parallel M4 drafts #200 and #201 were created from the older PR-#197 baseline and are superseded by this consolidated closure state.

## Decision
Authorize attributable principals through explicit, non-inheriting DevelopmentChain capabilities and deterministic minimum risk classes.

Canonical agent capabilities are:

`READ`, `ANALYZE`, `PLAN`, `BRANCH`, `COMMIT`, `PR`, `CI_REQUEST`, `DEPLOY_REQUEST`, `PRODUCTION_MUTATION`.

`MERGE` is intentionally not an agent capability. It remains a Human/Owner-controlled repository transition.

Minimum risk classes are:

- LOW: READ, ANALYZE, PLAN;
- MEDIUM: BRANCH, COMMIT, PR, CI_REQUEST;
- HIGH: DEPLOY_REQUEST;
- CRITICAL: PRODUCTION_MUTATION.

Context may raise risk but may never lower these minimums.

Authorization is deny-by-default and binds at least:

- authenticated human actor;
- app/client identity;
- logical agent identity;
- session identity;
- request identity;
- credential-holder identity;
- target resource;
- environment;
- requested capability;
- applicable approval/step-up evidence.

Provider/model identifiers are metadata only and never grant authority.

HIGH actions require explicit, current Human Approval. CRITICAL actions require the same Human Approval plus verified Step-up. Approval evidence must be unexpired and bound to the same human actor, logical agent, capability and target resource. Agent/App/Credential principals may not self-approve.

Existing ADR-0050/0051 and ESS-0018 remain the product/tool implementation profile and are enforced in addition to this provider-neutral layer.

## M4 implementation

`src/platform/Security/agentIam.ts` implements the provider-neutral decision surface with:

- complete principal attribution including request and credential holder;
- deterministic capability minimum-risk mapping;
- exact grants only; no privilege inheritance;
- environment boundary preventing development principals from `PRODUCTION_MUTATION`;
- approval actor/agent/target/capability binding and expiration validation;
- HIGH Human Approval and CRITICAL Human Approval + Step-up semantics;
- mutation kill switch;
- explicit denial of unknown/non-agent capabilities such as `MERGE`.

`src/platform/Compliance/PolicyGate.ts` exposes the generic Agent IAM check while retaining its existing ESS-0018 read/write allowlists as a second independent policy layer.

## Alternatives
Provider-based allowlists, model-name trust, prompt-only constraints, wildcard capabilities and implicit capability inheritance are rejected.

## Security
Retrieved/tool content cannot change authorization. `DEPLOY_REQUEST` never implies `PRODUCTION_MUTATION`. `COMMIT` never implies `PR`; `PR` never implies `CI_REQUEST`; `CI_REQUEST` never implies `DEPLOY_REQUEST`. Human/Owner merge governance remains outside the agent runtime authorization model.

## Migration
M4 is additive and requires no production Supabase/Stripe/Render mutation and no new database migration. Existing Supabase capability grants and approval artifacts remain unchanged.

## Rollback
Disable mutating agent capabilities and fall back to READ/ANALYZE. Removal of the provider-neutral layer does not modify the existing ADR-0050/0051 persistence model.

## Verification
M4 closure requires green TypeScript/unit/build/governance validation plus negative tests for:

- incomplete principal attribution;
- missing exact grants;
- provider/model privilege non-inheritance;
- capability privilege non-inheritance;
- deterministic HIGH/CRITICAL minimum risk;
- missing/mismatched/expired approval evidence;
- approval subject-agent mismatch;
- missing Step-up for CRITICAL;
- self-approval;
- kill-switch enforcement;
- attempted `MERGE` delegation.

M5 remains blocked until the single M4 consolidation/closure PR is Human/Owner-reviewed and merged.
