# M4 Agent IAM — Implementation Evidence

Status: VALIDATION PENDING
Date: 2026-08-11
Baseline: `main@c093052c22ed620bc9b086ba4ec05612d7dd2150` (PR #197 merge)
Authority: ESS-0019, ESS-0018, ADR-0058, ADR-0050, ADR-0051

## Objective

Generalize the existing Supabase/tool-specific CapabilityGrant and Approval controls into a provider-neutral Agent IAM decision layer without weakening or replacing the existing domain/tool policies.

## Existing controls retained

- `src/platform/Security/capabilities.ts`: explicit tool-specific capability allowlist and persistent grants;
- `src/platform/Security/approvals.ts`: single-use, plan-hash-bound approvals;
- `src/platform/Compliance/PolicyGate.ts`: ESS-0018 read/write allowlists;
- `src/platform/Supervisor/supervisor.ts`: Policy -> Approval -> Apply -> Audit chain;
- `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`: Human/Owner merge separation.

## M4 implementation

### Provider-neutral contract

`src/platform/Security/agentIam.ts` adds:

- canonical explicit capabilities: `READ`, `ANALYZE`, `PLAN`, `BRANCH`, `COMMIT`, `PR`, `CI_REQUEST`, `DEPLOY_REQUEST`, `PRODUCTION_MUTATION`;
- no `MERGE` capability;
- risk classes `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`;
- attributable principal context: human actor, app, agent, session, request and credential holder;
- provider/model as metadata only;
- exact non-inheriting grants;
- HIGH/CRITICAL approval + step-up evidence;
- development -> production-mutation deny rule;
- mutation kill switch;
- deny-by-default result for unknown/missing/mismatched inputs.

### PolicyGate integration

`src/platform/Compliance/PolicyGate.ts` exposes `evaluateAgentPolicy()` as the provider-neutral M4 entry point. Existing ESS-0018 `evaluateReadPolicy()` / `evaluateWritePolicy()` remain unchanged in semantics and constitute an additional domain/tool gate.

Therefore an application integration must not treat generic Agent IAM ALLOW as sufficient for a specific privileged tool operation; the relevant tool/domain policy and persisted grant/approval chain still apply.

## Negative-test evidence

`tests/unit/agentIam.test.ts` covers at minimum:

- READ does not imply ANALYZE or PLAN;
- COMMIT does not imply PR;
- PR does not imply CI_REQUEST;
- CI_REQUEST does not imply DEPLOY_REQUEST;
- DEPLOY_REQUEST does not imply PRODUCTION_MUTATION;
- `MERGE` is denied as an unknown/non-agent capability;
- incomplete attribution fails closed;
- provider/model labels do not grant privilege;
- development principals cannot perform PRODUCTION_MUTATION;
- HIGH/CRITICAL operations require exact approval and step-up evidence;
- mismatched, expired, non-step-up and self-issued approval evidence is denied;
- kill switch blocks mutating capabilities while preserving explicitly granted READ.

## Production-boundary evidence

This M4 branch introduces no direct mutation of Stripe, Supabase or Render configuration and no new production secret. No database migration is added. Existing Supabase migrations remain unchanged.

## M4 exit gate

M4 remains `IN PROGRESS` until all of the following are true:

- TypeScript, unit tests, production build and governance CI pass;
- the Human/Owner reviews every changed file and marks it Viewed;
- both Owner attestation checkboxes are checked in the PR body;
- the current-head Owner review contains `💪` or `okay`;
- merge occurs only after a separate explicit Human instruction;
- post-merge `main` SHA is synchronized into ROADMAP, implementation roadmap and traceability;
- ADR-0058 implementation status is reviewed for promotion from Proposed to Accepted.

After those post-merge closure steps, M5 may become the next authorized phase.
