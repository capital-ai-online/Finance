# M4 Agent IAM — Implementation Plan

Status: IN PROGRESS
Date: 2026-08-11
Authority: ADR-0058, ADR-0050, ADR-0051, ESS-0019
Roadmap phase: M4 Agent IAM

## Objective

Implement the provider-neutral Agent IAM control boundary required by the CAPITAL-AI DevelopmentChain. Authorization is based on attributable principals, explicit capabilities and risk classes, never on provider/model identity or prompt instructions.

## Canonical capabilities

- READ
- ANALYZE
- PLAN
- BRANCH
- COMMIT
- PR
- CI_REQUEST
- DEPLOY_REQUEST
- PRODUCTION_MUTATION

`MERGE` is intentionally not an agent capability. Merge remains a separately authorized Human/Owner-controlled action under `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`.

## Risk classes

| Class | Default handling |
|---|---|
| LOW | permitted only when explicitly granted |
| MEDIUM | permitted only when explicitly granted and attributable |
| HIGH | explicit approval / step-up required |
| CRITICAL | explicit Human/Owner authorization / step-up required; agent self-approval forbidden |

All unspecified capabilities and principals are denied by default.

## Identity binding

Every authorization decision must be attributable to:

1. human actor;
2. app/client;
3. agent/session;
4. tool credential holder;
5. requested capability;
6. risk class;
7. target resource/action.

Provider names and model names are metadata only and MUST NOT become authorization principals.

## Implementation slices

### M4.1 Capability contract

Create a typed canonical capability/risk contract and a deny-by-default authorization result. No implicit inheritance between capabilities is allowed.

Acceptance:
- unknown capability => DENY;
- missing principal => DENY;
- missing grant => DENY;
- capability grants are explicit and enumerable.

### M4.2 Principal context

Introduce an attributable AgentPrincipalContext that binds human actor, client, agent/session and credential holder. Retrieved or model-generated content cannot mutate this context.

Acceptance:
- principal context is immutable for an authorization decision;
- provider/model metadata cannot elevate privilege;
- missing attribution fails closed.

### M4.3 Risk authorization

Map requested capabilities/actions to LOW/MEDIUM/HIGH/CRITICAL handling. HIGH and CRITICAL actions require explicit approval/step-up evidence according to policy.

Acceptance:
- no self-approval;
- expired/missing approval => DENY;
- approval is scoped to actor, action and target;
- approval cannot be reused for a different capability.

### M4.4 Git capability separation

Agent execution may receive BRANCH, COMMIT, PR and CI_REQUEST independently. MERGE remains outside the agent capability vocabulary and is enforced through the Human/Owner PR gate.

Acceptance:
- agent can prepare a PR without merge authority;
- successful CI does not create merge authority;
- `💪` / `okay` Owner review remains required for the current PR head;
- a new push invalidates prior current-commit approval evidence.

### M4.5 Production boundary

DEPLOY_REQUEST and PRODUCTION_MUTATION remain separate capabilities. Development agents must not directly mutate Stripe, Supabase or Render production configuration. Such work is represented as production handoff/instructions until separately authorized in the production path.

Acceptance:
- DEPLOY_REQUEST does not imply PRODUCTION_MUTATION;
- production mutation without explicit production authorization => DENY;
- no development credential can silently become a production credential.

### M4.6 Negative tests and evidence

Add tests proving privilege non-inheritance and denial of unauthorized HIGH/CRITICAL actions.

Minimum negative cases:
- READ does not imply ANALYZE/PLAN/write;
- COMMIT does not imply PR;
- PR does not imply CI_REQUEST;
- CI_REQUEST does not imply DEPLOY_REQUEST;
- DEPLOY_REQUEST does not imply PRODUCTION_MUTATION;
- no capability implies MERGE;
- provider/model identity does not grant capabilities;
- retrieved content cannot alter authorization;
- agent cannot approve itself;
- missing/expired step-up fails closed.

## M4 closure gate

M4 can move to COMPLETE only when:

- capability and principal contracts are implemented;
- deny-by-default enforcement is code-backed;
- negative tests are green;
- Human/Owner merge separation is preserved;
- ROADMAP and M0–M9 traceability are updated with implementation evidence;
- no production Stripe/Supabase/Render mutation was introduced from the development branch;
- the PR passes technical/governance checks and the Human/Owner gate.

After M4 closure, M5 Observability/Telemetry/Audit becomes the next authorized phase.
