# M4 — Agent IAM Evidence

Status: IMPLEMENTATION IN REVIEW
Date: 2026-08-11
Baseline: `main@c093052c22ed620bc9b086ba4ec05612d7dd2150`
Authority: ESS-0019, ADR-0058, ADR-0050, ADR-0051

## Objective

M4 generalizes CAPITAL-AI's already implemented Supabase-specific capability/grant and approval foundation into a provider-neutral authorization contract for the DevelopmentChain.

## Existing controls preserved

- `src/platform/Security/capabilities.ts`: named, revocable Supabase capabilities; no wildcard/raw SQL capability; fail-closed grant check.
- `src/platform/Security/approvals.ts`: single-use, plan-bound, expiring approval artifact.
- `src/platform/Compliance/PolicyGate.ts`: explicit read/write allowlists; deny by default.
- ADR-0050/0051 remain the product/tool IAM implementation profile.
- Human/Owner PR approval remains the repository authority for merge.

## M4 implementation

### Provider-neutral principal

`src/platform/Security/agentAuthorization.ts` binds authorization to:

- `humanActorId`
- `appId`
- `agentId`
- `sessionId`

Provider/model metadata is optional evidence only and cannot grant authority.

### Canonical execution capabilities

`READ → ANALYZE → PLAN → BRANCH → COMMIT → PR → CI_REQUEST → DEPLOY_REQUEST → PRODUCTION_MUTATION`

`MERGE` is deliberately excluded and is a Human/Owner-only transition.

### Risk model

- LOW: READ, ANALYZE, PLAN
- MEDIUM: BRANCH, COMMIT, PR, CI_REQUEST
- HIGH: DEPLOY_REQUEST
- CRITICAL: PRODUCTION_MUTATION

HIGH/CRITICAL require explicit approval. CRITICAL additionally requires verified step-up.

### Deny-by-default rules

Authorization denies when:

- principal binding is incomplete;
- capability is unknown/non-delegable;
- capability is not explicitly granted;
- HIGH/CRITICAL approval is missing;
- CRITICAL step-up is missing.

## Negative tests

`tests/unit/agentAuthorization.test.ts` verifies:

1. incomplete principal → DENY;
2. absent grant → DENY;
3. trusted-looking provider/model metadata does not create authority;
4. explicit medium capability can be allowed;
5. deployment request without approval → DENY;
6. production mutation without step-up → DENY;
7. attempted `MERGE` delegation → DENY;
8. risk mapping remains stable.

## Non-goals / safety boundary

M4 does not:

- mutate live Supabase, Stripe or Render configuration;
- replace existing Supabase `capability_grants` or approval tables;
- introduce wildcard capabilities;
- grant raw SQL/schema/project administration;
- allow an AI client to self-approve or merge its own PR.

## Exit criteria

- [ ] TypeScript/lint succeeds.
- [ ] Unit tests including M4 negative authorization tests succeed.
- [ ] Production build/predeploy checks succeed.
- [ ] Governance checks succeed.
- [ ] Owner reviews every changed file and marks it Viewed.
- [ ] Owner checks both PR Human/Owner attestations.
- [ ] Owner submits current-head review `💪` or `okay`.
- [ ] Owner explicitly merges the M4 PR.
- [ ] Post-merge ROADMAP and traceability are synchronized to the M4 merge SHA.

Until all exit criteria are met, M5 remains blocked.
