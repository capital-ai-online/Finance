# ADR-0058 — Agent Identity, Capability and Risk Authorization

Status: ACCEPTED / M4 IMPLEMENTATION IN PROGRESS
Date: 2026-08-11

## Context
Provider identities and model names are not sufficient authorization principals. Existing ADR-0050/0051 already provide domain-specific Supabase capability grants and single-use approvals, but the DevelopmentChain additionally requires a provider-neutral control-plane contract above those domain grants.

## Decision
Authorize attributable principals through explicit DevelopmentChain capabilities and risk classes. Canonical agent capabilities are READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST, DEPLOY_REQUEST and PRODUCTION_MUTATION. Risk classes are LOW, MEDIUM, HIGH and CRITICAL. Authorization is deny-by-default.

The execution principal MUST bind human actor, client/app, agent session and credential holder. Provider/model metadata may be recorded but is never sufficient authorization.

HIGH actions require explicit human approval. CRITICAL actions require explicit human approval plus verified step-up. DEPLOY_REQUEST has a minimum risk of HIGH; PRODUCTION_MUTATION has a minimum risk of CRITICAL.

`MERGE` is intentionally not an agent capability. Pull-request merge remains a separate Human/Owner-controlled repository transition enforced by the PR checklist/review gate introduced in PR #197. AI clients may prepare, validate and update PRs but cannot receive a grant equivalent to MERGE.

Existing ADR-0050/0051 remain the domain implementation foundation. Their Supabase capabilities are evaluated in addition to, not instead of, this provider-neutral execution authorization.

## Implementation
M4 adds `src/platform/Security/agentAuthorization.ts` as a pure provider-neutral authorization layer with:

- attributable `AgentExecutionPrincipal`;
- enumerated capability and risk contracts;
- explicit grants only;
- deny on unknown capability;
- HIGH approval requirement;
- CRITICAL approval + step-up requirement;
- non-representability of MERGE as an agent capability.

Negative unit tests prove missing identity, absent grant, unknown/MERGE capability, missing approval and missing step-up are denied.

## Alternatives
Provider-based allowlists, model-name trust, prompt-only constraints and wildcard capabilities are rejected.

## Security
Retrieved content cannot change authorization. AI self-approval is forbidden. Human approval evidence must match the bound human actor. Domain-specific grants remain separately enforceable.

## Migration
No database migration is introduced by this provider-neutral layer. Existing Supabase grant/approval tables remain unchanged. Future provider profiles must map into this contract before invoking domain tools.

## Rollback
Disable write capabilities and fall back to READ/ANALYZE-only execution. Removing this additive module does not alter existing Supabase grant storage.

## Verification
M4 exit requires green TypeScript/unit/build validation plus negative tests for privilege non-inheritance, unknown capability denial, MERGE denial, HIGH approval and CRITICAL step-up enforcement. ROADMAP and traceability must be updated before M4 closure.
