# ADR-0058 — Agent Identity, Capability and Risk Authorization

Status: ACCEPTED / M4 IMPLEMENTED PENDING HUMAN REVIEW
Date: 2026-08-11

## Context
Provider identities and model names are not sufficient authorization principals. Existing ADR-0050/0051 and ESS-0018 provide the Supabase-specific capability/grant implementation profile, but the DevelopmentChain requires a provider-neutral authorization layer above individual tools/providers.

## Decision
Authorize attributable principals through explicit capability grants and risk classes. Canonical capabilities are READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST, DEPLOY_REQUEST and PRODUCTION_MUTATION. Risk classes are LOW, MEDIUM, HIGH and CRITICAL. Deny by default. Provider/model identity never grants authority.

The M4 implementation is `src/platform/Security/agentAuthorization.ts` and is intentionally a pure policy layer. It binds an authorization request to:

- human actor;
- app/client;
- agent identity;
- session identity;
- tool credential holder;
- explicit capability grant evidence;
- risk class;
- optional human approval evidence.

HIGH/CRITICAL operations require human approval evidence. CRITICAL operations additionally require verified step-up. Agent self-approval is forbidden. Approval must match both the target agent and the requested capability and must be unexpired.

`MERGE` is deliberately excluded from `AgentCapability`. It remains a Human/Owner-controlled transition governed by `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`. AI clients may prepare and validate PRs but cannot receive a MERGE capability from this policy layer.

Existing ADR-0050/0051 remain the implementation foundation for concrete Supabase capabilities and are generalized, not replaced, by this ADR.

## Risk classification

| Capability | Risk |
|---|---|
| READ | LOW |
| ANALYZE | LOW |
| PLAN | MEDIUM |
| BRANCH | MEDIUM |
| COMMIT | HIGH |
| PR | HIGH |
| CI_REQUEST | HIGH |
| DEPLOY_REQUEST | HIGH |
| PRODUCTION_MUTATION | CRITICAL |

## Alternatives
Provider-based allowlists, model-name trust and prompt-only constraints are rejected. A wildcard capability is rejected. A generic SQL/schema/project mutation capability is rejected.

## Security
Identity must bind human actor, app/client, agent/session and tool credential holder. Retrieved content cannot change authorization. Missing identity, missing grant, missing approval, expired/mismatched approval or missing required step-up fail closed.

## Migration
M4 adds the provider-neutral policy core and negative tests without changing existing provider-specific grants, RLS, production credentials or deployment identity. Existing Supabase capabilities continue through ADR-0050/0051 until individually migrated or wrapped by the provider-neutral control plane.

## Rollback
Remove the provider-neutral policy module/tests and fall back to the existing provider-specific read-only/capability layers. No production schema or provider configuration is changed by M4.

## Verification
`tests/unit/agentAuthorization.test.ts` proves:

- deterministic risk classification;
- incomplete identity denial;
- explicit-grant requirement;
- HIGH-risk human approval requirement;
- self-approval denial;
- approval subject/capability mismatch denial;
- CRITICAL step-up requirement;
- properly approved HIGH-risk allow path;
- MERGE remains outside the agent capability namespace.

M4 is not COMPLETE until CI/Governance pass and the Human/Owner gate for the M4 pull request is satisfied.