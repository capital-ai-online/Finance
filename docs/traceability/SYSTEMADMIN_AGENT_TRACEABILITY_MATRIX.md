# Systemadmin Agent Traceability Matrix

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Baseline: `main@083d8f25083034e3785d1a8e0c57eaf03463c907` (PR #217 merge)

| Stage | Authority | Implementation / Evidence | Mutation boundary | Exit gate |
|---|---|---|---|---|
| SA0 Governance | ESS-0021 + ADR-0065 | Systemadmin Policy, REM schema, Roadmap; PR #214 | repository docs | **COMPLETE** |
| SA1 Mandate Validator | ESS-0021 + ADR-0065 + ADR-0058 | REM validator, PolicyGate, tests; PR #215 | repository only; prod denied | **COMPLETE / VERIFIED PASS** |
| SA2 Chat Execution Profile | ESS-0021 + SA1 | Chat profile, action envelope, tests; PR #216 | mutating direct LIVE denied | **COMPLETE / VERIFIED PASS** |
| SA3A Repository Audit Adapter | ADR-0059 + ADR-0065 | audited adapter, contract, tests, runbook, evidence | no permit before durable audit; no external prod mutation | **IMPLEMENTED / PR+CI PENDING** |
| SA3B Execution-Host Binding | SA2 connector boundary + SA3 contract | tool-host middleware or CAPITAL-AI execution gateway | direct external connector bypass prohibited | **REQUIRED / NOT YET VERIFIED** |
| SA4 Pilot REM | Systemadmin Policy + REM + complete SA3 | first Owner-approved non-production REM | one bounded package; audited mutations only | BLOCKED BY SA3A+SA3B VERIFIED PASS |
| SA5 External mutation design | future ADR + ADR-0066/M10 | bounded exact-target production design | reserved Owner actions excluded | BLOCKED BY SA4 + M10 VERIFIED PASS |

## DevelopmentChain M10 relationship

PR #217 merged ADR-0066 and the passkey-only Owner authorization target architecture into `main@083d8f25083034e3785d1a8e0c57eaf03463c907`.

M10 runtime enforcement remains blocked until M9. The current Owner review/attestation CI gate therefore remains authoritative. M10 does not block SA3 or SA4 repository-only work, but M10 `VERIFIED PASS` is required for SA5 external mutation design.

## Required authorization trace

Every Systemadmin repository mutation must ultimately be reconstructable as:

`Owner approval → mandateId → Roadmap item → actor → app/agent/session/request → trace → capability/risk → target/repository/paths → policy decision → authorization audit reference → execution-host permit consumption → branch/head/commit/PR/workflow → result`

## SA1 controls

| Requirement | Enforcement | Expected |
|---|---|---|
| malformed/unknown REM | structural validator | DENY |
| invalid Owner/agent/repo/base/roadmap/capability/target/path | canonical scope | DENY |
| expired/revoked/out-of-window | validity gate | DENY |
| self-authority or reserved mutation | protected paths/classes | DENY |
| MERGE / DEPLOY / PRODUCTION / CRITICAL | capability/risk ceiling | DENY |
| PR overlap/limit or CI-budget duplicate | coordination gates | DENY |
| valid scoped HIGH repository request | REM + M4 IAM | ALLOW |

## SA2 controls

Canonical profile: `capital-ai-systemadmin-chat-execution@1.0.0`.

| Requirement | Enforcement | Expected |
|---|---|---|
| incomplete security/Roadmap/overlap/test/rollback preflight | SA2 sequence | DENY |
| wrong client/repository/base | profile constraint | DENY |
| credential exposure / untrusted scope elevation | stop condition | DENY |
| unexpected production need | stop condition | DENY |
| final Human review started | mutation freeze | DENY |
| invalid branch/commit/PR/CI sequence | sequence guard | DENY |
| MERGE / DEPLOY / PRODUCTION | exact capability surface | DENY |
| mutating direct LIVE | live-mode gate | DENY |
| valid mutating DRY_RUN | SA2 + SA1 + M4 | prepared envelope |

SA2 mutating envelopes remain `liveMutationPermitted=false`.

Final SA2 evidence:

- PR #216 head `14b9ec25dd60a34ae78a852f0a5b689b4811832b`;
- CI #919 PASS;
- Marketing #164 PASS;
- Governance #643 PASS;
- merge `a5abc1685026651f4297a487e855683a1fa1e58e`;
- branch deleted.

## SA3A repository audit traceability

Canonical adapter: `server/agentAudit/systemadminAuditedExecution.ts`.

Machine contract: `.ai/contracts/systemadmin-audit-execution-profile.json`.

Sequence:

`SA2 DRY_RUN → SA3 SELF-AUTHORITY CHECK → M5 AUTHORIZATION INSERT → auditReference → auditBoundExecutionPermitted → execution host → exact action → M5 OUTCOME INSERT`

| Requirement | SA3A enforcement | Expected |
|---|---|---|
| SA1/SA2 policy DENY | prepared decision + audit | DENY, no permit |
| audit persistence unavailable | writer throws | STOP, no permit |
| invalid audit reference | reference validation | STOP, no permit |
| SA2/SA3 control-plane path | SA3 self-authority list | DENY |
| MERGE / DEPLOY / PRODUCTION | inherited ceiling | DENY |
| valid repository action + durable audit | SA1+SA2+M5+SA3A | audit-bound permit |
| outcome without audited ALLOW | outcome guard | DENY |
| mismatching audit reference | outcome guard | DENY |
| terminal SUCCESS/ERROR | second append-only event | correlated evidence |
| prompt/full diff/raw body/reusable credential | M5 sanitizer | OMIT/REDACT |

Additional protected paths include the SA2 execution profile, both Systemadmin contracts and the M5/SA3 audit execution files.

`tests/unit/systemadminAuditedExecution.test.ts` covers durable-authorization permit creation, audit-store fail-closed, self-authority denial, MERGE/PRODUCTION denial, correlated terminal outcome and outcome-without-ALLOW denial.

## SA3B execution-host traceability

Known limitation: repository TypeScript cannot intercept every external ChatGPT GitHub connector call.

Exactly one enforcement mode must be verified before SA4:

- `TOOL_HOST_PRE_ACTION_MIDDLEWARE_CONSUMES_SA3_PERMIT`; or
- `CAPITAL_AI_GATEWAY_EXECUTES_EXACT_ACTION_AFTER_SA3_PERMIT`.

| Requirement | Required proof | Expected |
|---|---|---|
| actual execution host identified | configuration/runtime evidence | PASS |
| permit validated before side effect | positive integration evidence | PASS |
| exact capability/target/head bound | integration test | PASS |
| no permit / invalid permit | negative test | DENY |
| direct connector bypass | negative enforcement test | DENY |
| action succeeds | authorization + outcome refs | correlated append-only evidence |

Until these are proven, direct mutating ChatGPT→GitHub connector calls do not count as SA3-enforced autonomous Systemadmin execution.

## Human/Owner boundary

- Current transitional PR gate remains active until M10 controlled cutover.
- Human File Review and Human merge remain independent controls.
- Neither an SA3 permit nor green CI authorizes MERGE.

## Branch lifecycle

`fresh main branch → scoped audited work → PR → Human review → CI → Human merge → branch delete`

Merged/superseded branches are never reused.

## Current state

- SA0: COMPLETE.
- SA1: COMPLETE / VERIFIED PASS.
- SA2: COMPLETE / VERIFIED PASS.
- M10 target architecture: MERGED via PR #217; runtime still blocked by M9.
- SA3A: IMPLEMENTED on `agent/sa3-systemadmin-audit-correlation`, PR/CI pending.
- SA3B: REQUIRED / NOT YET VERIFIED.
- SA4: BLOCKED BY complete SA3 VERIFIED PASS.
- SA5: BLOCKED BY SA4 + M10 VERIFIED PASS.
