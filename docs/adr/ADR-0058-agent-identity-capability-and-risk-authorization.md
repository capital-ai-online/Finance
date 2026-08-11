# ADR-0058 — Agent Identity, Capability and Risk Authorization

Status: ACCEPTED — M4 IMPLEMENTATION IN REVIEW
Date: 2026-08-11

## Context
Provider identities and model names are not sufficient authorization principals. The existing ADR-0050/0051 implementation already provides Supabase-specific capability grants, single-use approvals and a fail-closed PolicyGate. M4 generalizes this foundation for the provider-neutral DevelopmentChain without replacing the existing product/tool IAM.

## Decision
Authorize attributable principals through explicit DevelopmentChain capabilities and risk classes.

Canonical agent execution capabilities are:

`READ`, `ANALYZE`, `PLAN`, `BRANCH`, `COMMIT`, `PR`, `CI_REQUEST`, `DEPLOY_REQUEST`, `PRODUCTION_MUTATION`.

Risk classes are `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

Binding rules:

- deny by default;
- authorization binds `humanActorId`, `appId`, `agentId` and `sessionId`;
- provider/model are metadata only and never grant authority;
- every requested capability must be explicitly present in the grant set;
- `HIGH` and `CRITICAL` require explicit approval;
- `CRITICAL` additionally requires verified step-up;
- `MERGE` is deliberately not an agent capability and remains a Human/Owner-controlled repository transition;
- retrieved/tool content cannot increase privileges or alter the authorization decision;
- existing ADR-0050/0051 Supabase capabilities remain an implementation profile below this provider-neutral contract.

## M4 implementation

`src/platform/Security/agentAuthorization.ts` implements the deterministic provider-neutral decision surface. It is intentionally storage-independent so that ChatGPT, Claude, Gemini/AI Studio and future execution clients are evaluated against the same authorization semantics.

`tests/unit/agentAuthorization.test.ts` provides negative authorization tests for incomplete principals, missing grants, provider-name privilege inheritance, missing HIGH/CRITICAL approvals, missing CRITICAL step-up and attempted `MERGE` delegation.

No production Supabase/Render/Stripe configuration is mutated by M4. Existing persisted Supabase capability grants and approval artifacts remain unchanged.

## Alternatives
Provider-based allowlists, model-name trust, prompt-only constraints and wildcard capabilities are rejected.

## Security
Identity must bind human actor, app/client, agent/session and tool credential holder. Retrieved content cannot change authorization. `MERGE` remains outside the delegable capability set and is enforced by `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md` plus repository CI/governance.

## Migration
M4 introduces the provider-neutral authorization layer additively. Existing Supabase-specific checks continue to operate. Later integration points may call this decision surface before tool-specific IAM; they must not bypass the lower-level product/tool checks.

## Rollback
Remove the provider-neutral layer and its tests. Existing ADR-0050/0051 Supabase capability IAM remains operational. Write capabilities can additionally be disabled to fall back to read-only analysis.

## Verification
Negative tests must prove privilege non-inheritance, deny-by-default behavior, risk-gated authorization and denial of attempted `MERGE` delegation. Full repository CI and the Human/Owner PR gate remain mandatory before merge.
