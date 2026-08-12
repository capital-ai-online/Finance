# Systemadmin Agent Traceability Matrix

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Baseline: `main@8de5a538ae9d2f0afc7b2e505ddda427ceb77780` (PR #218 merge)

| Stage | Authority | Implementation / Evidence | Mutation boundary | Exit gate |
|---|---|---|---|---|
| SA0 Governance | ESS-0021 + ADR-0065 | REM/governance package; PR #214 | repository governance | **COMPLETE** |
| SA1 Mandate Validator | ESS-0021 + ADR-0065 + ADR-0058 | REM validator + PolicyGate; PR #215 | repository only; production denied | **COMPLETE / VERIFIED PASS** |
| SA2 Chat Profile | ESS-0021 + SA1 | execution profile/action envelope; PR #216 | direct mutating LIVE denied | **COMPLETE / VERIFIED PASS** |
| SA3A Audit Adapter | ADR-0059 + ADR-0065 | append-only audited execution adapter; PR #218 | no permit before M5 audit | **COMPLETE / VERIFIED PASS** |
| SA3B Execution Host | ADR-0067 + SA3A | GitHub Actions OIDC host + broker + probe REM + tests | initial real side effect = BRANCH only | **IMPLEMENTED / PR+CI+POST-MERGE PROBE PENDING** |
| SA4 Pilot REM | Systemadmin policy + complete SA3 | first bounded product work package | BRANCH/COMMIT/PR only after host proof | BLOCKED BY SA3B VERIFIED PASS |
| SA5 External mutation | future ADR + M10 | bounded reversible production design | reserved Owner actions excluded | BLOCKED BY SA4 + M10 VERIFIED PASS |

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

`validateExecutionIssue.mjs` accepts only JSON with these fields:

- `version = 1.0`;
- `mode = BRANCH_PROBE`;
- `mandateId = REM-SA3B-PROBE-001`;
- `roadmapItem = SA3B-HOST-PROBE`;
- exact lowercase 40-char `baseSha`;
- branch matching `agent/sa3b-host-probe-*`.

Unknown fields, arbitrary commands, alternate modes, malformed JSON, unsafe branch names and oversized bodies are DENY.

The workflow loads the trusted mandate from `main`; no executable mandate object is accepted from the Issue.

## SA3B permit-before-side-effect traceability

| Requirement | Enforcement | Expected |
|---|---|---|
| issue not created by Owner | workflow job `if` | no host job |
| wrong title | workflow job `if` | no host job |
| malformed/expanded request | strict parser | DENY before OIDC/side effect |
| stale base SHA | trusted checkout comparison | DENY |
| wrong probe REM | trusted mandate binding | DENY |
| invalid OIDC | broker verifier | 401 / no permit |
| actor/request/run mismatch | broker binding | 403 / no permit |
| SA1/SA2/SA3 policy DENY | audited authorization | DENY, no permit |
| M5 authorization persistence unavailable | SA3A writer | STOP, no permit |
| valid authorization | durable M5 reference | audit-bound BRANCH permit |
| branch attempted before permit | workflow-order contract | impossible in trusted workflow |
| GitHub branch API fails | workflow + outcome | ERROR outcome, job fail |
| terminal outcome persistence fails after branch | workflow rollback | branch deleted + job fail |
| successful branch | outcome endpoint | SUCCESS append-only evidence |
| MERGE/COMMIT/PR/CI/deploy/prod in probe | workflow/parser/REM surface | unavailable |

## Initial probe mandate

`.ai/mandates/REM-SA3B-PROBE-001.json` is Owner-approved only for host verification:

- capability `BRANCH` only;
- risk `MEDIUM`;
- target Finance;
- exact roadmap item `SA3B-HOST-PROBE`;
- expiry 2026-08-19;
- all reserved Human mutation classes prohibited;
- no content commit, PR, CI request, deployment or merge.

This probe is not SA4 product work.

## Tests / evidence mapping

| Security property | Test / evidence |
|---|---|
| exact OIDC claims/signature | `tests/unit/githubActionsOidc.test.ts` |
| invalid signature/audience/actor/repo/workflow/ref/time | `githubActionsOidc.test.ts` negative matrix |
| exact Issue schema | `tests/unit/systemadminExecutionIssue.test.ts` |
| shell/branch/mode/unknown field rejection | `systemadminExecutionIssue.test.ts` |
| broker route mounted | `tests/server/applicationRouteComposition.contract.test.ts` |
| authorize before branch and outcome after branch | `tests/unit/systemadminExecutionHostWorkflow.test.ts` |
| no git push / PR/deploy permissions | workflow contract test |
| outcome failure rollback | workflow contract test + post-merge probe |
| durable audit correlation | post-merge M5 probe evidence |

## Self-authority boundary

The SA3 audited path additionally protects:

- both Systemadmin contracts;
- `REM-SA3B-PROBE-001.json`;
- SA3B workflow;
- ADR-0067;
- SA2/SA3 audit files;
- OIDC verifier;
- broker router;
- Issue parser.

The SA3B probe is BRANCH-only, so it has no file-write capability. Before SA4 gains COMMIT/PR authority, the same SA3B trust roots must also be incorporated into the broader SA1 self-authority layer.

## SA3B post-merge acceptance

SA3B remains `IN PROGRESS` after PR merge until:

1. final-head CI/workflow security PASS;
2. Human merge + implementation branch deletion;
3. `main` deployment exposes broker;
4. real Owner BRANCH_PROBE reaches host;
5. authorization reference predates branch creation;
6. SUCCESS outcome reference exists;
7. invalid/no-permit negative path creates no branch;
8. probe branch is deleted;
9. evidence and Roadmap are synchronized.

## Human boundary

- direct autonomous merge remains prohibited;
- green CI is evidence, not merge authority;
- current Owner review/attestation gate remains until M10 runtime cutover;
- SA4 remains blocked until full SA3B VERIFIED PASS.
