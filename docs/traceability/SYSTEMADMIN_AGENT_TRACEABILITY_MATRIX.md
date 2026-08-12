# Systemadmin Agent Traceability Matrix

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Baseline: `main@156142102e7d2a97ad466aee0340f758fa4365e5` (PR #220 merge)

| Stage | Authority | Implementation / Evidence | Mutation boundary | Exit gate |
|---|---|---|---|---|
| SA0 Governance | ESS-0021 + ADR-0065 | REM/governance package; PR #214 | repository governance | **COMPLETE** |
| SA1 Mandate Validator | ESS-0021 + ADR-0065 + ADR-0058 | REM validator + PolicyGate; PR #215 | repository only; production denied | **COMPLETE / VERIFIED PASS** |
| SA2 Chat Profile | ESS-0021 + SA1 | execution profile/action envelope; PR #216 | direct mutating LIVE denied | **COMPLETE / VERIFIED PASS** |
| SA3A Audit Adapter | ADR-0059 + ADR-0065 | append-only audited execution adapter; PR #218 | no permit before M5 audit | **COMPLETE / VERIFIED PASS; writer contract remediation active** |
| SA3B Execution Host | ADR-0067 + SA3A | PR #220 merged; GitHub Actions OIDC host deployed; Issue #221 / run `31570833507` | BRANCH only; no audit = no branch | **FAIL-CLOSED LIVE PASS / POSITIVE PATH BLOCKED** |
| SA4 Pilot REM | Systemadmin policy + complete SA3 | first bounded product work package | BRANCH/COMMIT/PR only after host proof | **BLOCKED BY SA3B VERIFIED PASS** |
| SA5 External mutation | future ADR + M10 | bounded reversible production design | reserved Owner actions excluded | **BLOCKED BY SA4 + M10 VERIFIED PASS** |

## Verified predecessors

### SA2

PR #216 final head `14b9ec25dd60a34ae78a852f0a5b689b4811832b`:

- CI #919 PASS;
- Google-Marketing #164 PASS;
- Governance #643 PASS;
- merge `a5abc1685026651f4297a487e855683a1fa1e58e`;
- branch deleted.

### M10 architecture

PR #217 merged passkey-only Human/Owner PR authorization architecture at `083d8f25083034e3785d1a8e0c57eaf03463c907`. Runtime cutover remains blocked until M9.

### SA3A

PR #218 final head `4178f76c1c33b50b957cd073d83ed9eeb0493642`:

- CI #926 PASS;
- Governance #647 PASS;
- merge `8de5a538ae9d2f0afc7b2e505ddda427ceb77780`;
- branch deleted.

### SA3B implementation

PR #220:

- final reviewed head `c4c7d00b33e521dfd12b14ddfdc097288a80f385`;
- CI #936 PASS;
- Governance #653 PASS;
- merge `156142102e7d2a97ad466aee0340f758fa4365e5`;
- implementation branch deleted;
- Render deploy `dep-d9u19jjm8hqs73e95la0` reached `live` on the same merge SHA.

## End-to-end authorization trace

Every future Systemadmin repository side effect must be reconstructable as:

`Owner-approved REM → Owner execution request → trusted host → workload identity → mandate/roadmap → actor/app/agent/session/request → capability/risk/target → policy decision → durable authorization auditReference → exact side effect → durable terminal outcomeReference`

## SA3B host architecture

ADR-0067 selects:

`GitHub Issue ingress → GitHub Actions main workflow → GitHub OIDC → CAPITAL-AI Broker → SA3A → GitHub side effect`

Repository TypeScript still cannot intercept ordinary direct ChatGPT GitHub connector writes. Therefore direct connector writes remain **outside** the autonomous Systemadmin execution path.

### OIDC identity binding

| Claim / property | Required value | Failure |
|---|---|---|
| issuer | `https://token.actions.githubusercontent.com` | DENY |
| audience | `capital-ai-systemadmin-execution` | DENY |
| repository | `SvenKulessa/Finance` | DENY |
| repository_id | `1284319285` | DENY |
| actor | `SvenKulessa` | DENY |
| actor_id when present | `84307769` | DENY |
| repository_owner_id | `84307769` | DENY |
| event_name | `issues` | DENY |
| ref | `refs/heads/main` | DENY |
| workflow_ref | `SvenKulessa/Finance/.github/workflows/systemadmin-roadmap-executor.yml@refs/heads/main` | DENY |
| JWT algorithm/signature | RS256 / GitHub JWKS | DENY |
| `exp` / `iat` / `nbf` | valid current window | DENY |

Implementation: `server/systemadmin/githubActionsOidc.ts`.

## SA3B ingress contract

`validateExecutionIssue.mjs` accepts only JSON with:

- `version = 1.0`;
- `mode = BRANCH_PROBE`;
- `mandateId = REM-SA3B-PROBE-001`;
- `roadmapItem = SA3B-HOST-PROBE`;
- exact lowercase 40-char `baseSha`;
- branch matching `agent/sa3b-host-probe-*`.

Unknown fields, arbitrary commands, alternate modes, malformed JSON, unsafe branch names and oversized bodies are DENY.

## Real post-merge host trace — Issue #221

Workflow run `31570833507` executed on trusted `main@156142102e7d2a97ad466aee0340f758fa4365e5`.

| Step | Runtime result | Security interpretation |
|---|---|---|
| Owner/title ingress | PASS | authorized host job started |
| strict JSON parser | PASS | untrusted body constrained |
| exact main SHA | PASS | stale-base protection active |
| trusted REM binding | PASS | Issue cannot inject authority |
| GitHub OIDC | PASS | workload identity available |
| broker request | reached | production host reachable |
| durable M5 audit insert | **FAIL — `Unregistered API key`** | broker returned 503 |
| BRANCH side effect | **SKIPPED** | no permit → no mutation |
| requested branch existence | **ABSENT** | fail-closed invariant proven |

Negative security evidence:

`M5 PERSISTENCE FAILURE → NO auditBoundExecutionPermit → NO BRANCH`

This is an actual production fail-closed PASS.

## Production blocker correlation

Render broker telemetry for run `31570833507` records:

`[AgentAudit][SECURITY] durable audit persistence failed: Unregistered API key`

Supabase project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`) is `ACTIVE_HEALTHY`; the service-side privileged credential is therefore a separate Owner-controlled production-secret blocker.

No credential value belongs in repository evidence.

## M5 writer/schema contract drift

The live probe triggered a read-only comparison of:

- canonical migration `supabase/migrations/20260811230540_m5_agent_audit_events.sql`;
- actual production `public.agent_audit_events`;
- `server/agentAudit/agentAuditWriter.ts`.

Canonical DB vocabulary:

`human_actor_id, intent, scope, authorization_decision, approval_reference, step_up_reference, tool_name, repository, branch, commit_sha, pull_request_number, ci_run_id, attributes`

Pre-remediation writer aliases:

`actor_id, decision, approval_id, tool_id, pr_number, workflow_run_id, metadata`

The table/migration are authoritative. No schema rollback/replacement is authorized.

Corrective branch:

`fix/sa3b-m5-audit-schema-contract`

Required corrective controls:

| Requirement | Remediation |
|---|---|
| exact DB vocabulary | canonical row mapping in `agentAuditWriter.ts` |
| required intent | explicit caller-provided `intent` |
| required scope | structured caller-provided `scope` |
| external actor is not UUID | DB `human_actor_id = NULL`; sanitized external ID in `attributes` |
| external approval/step-up ref not UUID | UUID column `NULL`; sanitized external ref retained |
| generic audit caller | canonical intent/scope mapping |
| Systemadmin caller | roadmap/REM/target/path scope mapping |
| future schema drift | migration↔writer contract test |
| legacy aliases | negative runtime row assertions |

## Permit-before-side-effect traceability

| Requirement | Enforcement | Expected |
|---|---|---|
| issue not created by Owner | workflow job `if` | no host job |
| wrong title | workflow job `if` | no host job |
| malformed/expanded request | strict parser | DENY before side effect |
| stale base SHA | trusted checkout comparison | DENY |
| wrong probe REM | trusted mandate binding | DENY |
| invalid OIDC | broker verifier | 401 / no permit |
| actor/request/run mismatch | broker binding | 403 / no permit |
| SA1/SA2/SA3 policy DENY | audited authorization | DENY, no permit |
| M5 authorization persistence unavailable | SA3A writer | STOP, no permit — **runtime proven #221** |
| valid authorization | durable M5 reference | audit-bound BRANCH permit — positive proof pending |
| branch attempted before permit | workflow-order contract | impossible in trusted workflow |
| GitHub branch API fails | workflow + outcome | ERROR outcome, job fail |
| terminal outcome persistence fails after branch | workflow rollback | branch deleted + job fail |
| successful branch | outcome endpoint | SUCCESS append-only evidence |
| MERGE/COMMIT/PR/CI/deploy/prod in probe | workflow/parser/REM surface | unavailable |

## Initial probe mandate

`.ai/mandates/REM-SA3B-PROBE-001.json` remains limited to:

- capability `BRANCH` only;
- risk `MEDIUM`;
- target Finance;
- exact roadmap item `SA3B-HOST-PROBE`;
- expiry 2026-08-19;
- all reserved Human mutation classes prohibited;
- no content commit, PR, CI request, deployment or merge.

## Tests / evidence mapping

| Security property | Test / evidence |
|---|---|
| exact OIDC claims/signature | `tests/unit/githubActionsOidc.test.ts` |
| invalid signature/audience/actor/repo/workflow/ref/time | OIDC negative matrix |
| exact Issue schema | `tests/unit/systemadminExecutionIssue.test.ts` |
| authorize before branch and outcome after branch | `tests/unit/systemadminExecutionHostWorkflow.test.ts` |
| live no-audit/no-branch behavior | Issue #221 / run `31570833507` |
| exact M5 row vocabulary | `tests/unit/agentAudit.test.ts` |
| migration↔writer drift | `tests/unit/agentAuditSchemaContract.test.ts` |
| durable positive audit correlation | fresh post-remediation host probe pending |

## SA3B completion gate

SA3B stays `IN PROGRESS` until:

1. writer-schema remediation final CI PASS + Human merge;
2. remediation branch deletion;
3. corrected `main` deployed;
4. valid Owner-controlled privileged Supabase credential restored/verified;
5. fresh positive BRANCH_PROBE receives authorization auditReference before side effect;
6. branch equals current `main` SHA;
7. SUCCESS outcome reference exists;
8. probe branch deleted;
9. separate invalid/stale/no-permit probe again creates no branch;
10. evidence/Roadmap synchronized.

## Human boundary

- direct autonomous merge remains prohibited;
- green CI is evidence, not merge authority;
- production secret repair/rotation is Owner-controlled;
- current Owner PR review/attestation gate remains until M10 runtime cutover;
- SA4 remains blocked until full SA3B VERIFIED PASS.
