# Systemadmin Agent Traceability Matrix

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Baseline: `main@d8ccc3c5e136d51ae36b57b103119b25f4a42b8b` (PR #215 merge)

| Stage | Authority | Implementation / Evidence | Mutation boundary | Exit gate |
|---|---|---|---|---|
| SA0 Governance | ESS-0021 + ADR-0065 | Systemadmin Policy, REM schema, Systemadmin Roadmap, AGENTS/Concept Gate updates; PR #214 | repository docs only | **COMPLETE** — merged at `d342654715b4f1aef23e9fbaf3230b54f327e0a2` |
| SA1 Mandate Validator | ESS-0021 + ADR-0065 + ADR-0058 | `roadmapExecutionMandate.ts`, PolicyGate entry point, unit tests, `docs/evidence/sa1/*`; PR #215 | repository/control-plane code only; production mutation hard-denied | **COMPLETE / VERIFIED PASS** — CI #909 + Governance #634 PASS, merged at `d8ccc3c5e136d51ae36b57b103119b25f4a42b8b` |
| SA2 Chat Execution Profile | ESS-0021 + ESS-0019 + SA1 | `systemadminExecutionProfile.ts`, machine-readable profile, tests, runbook, `docs/evidence/sa2/*`, CI/Owner-gate race remediation | policy/action-envelope DRY_RUN for READ/ANALYZE/PLAN/BRANCH/COMMIT/PR/CI_REQUEST; LIVE mutation denied | **IMPLEMENTED / PR+CI PENDING** |
| SA3 Audit | ADR-0059 | M5 append-only audit correlation with `mandateId` + SA2 action envelope | no mutation before durable audit reference; no secret/raw credential evidence | BLOCKED BY SA2 VERIFIED PASS |
| SA4 Pilot REM | Systemadmin Policy + REM schema | first Owner-approved non-production REM | one bounded Roadmap work package; max one open PR | BLOCKED BY SA3; Human-reviewed PR merged + branch deleted + evidence complete |
| SA5 External mutation design | future dedicated ADR + M10 assurance | REM-bound exact-target production authorization | bounded/reversible only; reserved Owner actions excluded | BLOCKED BY SA4 + strong Owner approval assurance |

## Required authorization trace

Every Systemadmin mutating operation must ultimately be reconstructable as:

`Owner approval → mandateId → Roadmap item → agent/client/session/request → capability → risk → target → policy decision → audit reference → mutation → result/evidence`

SA1 validates mandate/scope prerequisites. SA2 adds the Chat execution sequence and secret-free action envelope. SA3 must make durable append-only audit a prerequisite for LIVE mutation.

## SA1 runtime traceability

| Requirement | Runtime enforcement | Expected result |
|---|---|---|
| malformed/unknown REM field | `validateRoadmapExecutionMandate()` | DENY |
| missing `authorityRefs` | structural validator | DENY |
| `OWNER_APPROVED` without `approvalEvidenceRef` | structural validator | DENY |
| draft/revoked/complete REM | scope validator | DENY |
| expired/not-yet-valid REM | validity-window check | DENY |
| wrong Owner | canonical actor binding | DENY |
| wrong agent | canonical Systemadmin binding | DENY |
| wrong repository/base | canonical repository/base binding | DENY |
| roadmap item outside REM | roadmap membership | DENY |
| capability outside REM | capability membership | DENY |
| `MERGE` | unknown Agent IAM capability + reserved mutation | DENY |
| `DEPLOY_REQUEST` | SA1 capability ceiling | DENY |
| `PRODUCTION_MUTATION` | SA1 capability ceiling | DENY |
| effective CRITICAL risk | SA1 risk ceiling | DENY |
| target outside allowlist | exact target membership | DENY |
| path outside allowlist | exact / `prefix/**` matcher | DENY |
| traversal/unsafe wildcard | path canonicalization | DENY |
| Systemadmin trust-root change covered by SA1 | protected self-authority paths | DENY |
| reserved Owner mutation | canonical reserved-class denylist | DENY |
| missing mutation classification | mutating-capability requirement | DENY |
| concurrent open-PR exact file overlap | changed-file conflict check | DENY |
| new PR exceeds mandate limit | PR CREATE counter | DENY |
| existing PR UPDATE at limit | PR operation distinction | ALLOW if otherwise in scope |
| CI budget exceeded | CI_REQUEST guard | DENY |
| unchanged head already validated | duplicate-CI guard | DENY |
| valid scoped HIGH repository action | REM-derived approval + existing Agent IAM | ALLOW |

## SA2 Chat execution traceability

Canonical profile:

`capital-ai-systemadmin-chat-execution@1.0.0`

Canonical execution client constraint:

`appId = chatgpt-github-connector`

The app/client id constrains the execution surface only. It is not authorization evidence.

| Requirement | SA2 enforcement | Expected result |
|---|---|---|
| SA1 not VERIFIED PASS | execution checkpoint | DENY |
| current main unresolved | mutation preflight | DENY |
| Roadmap unresolved | PLAN/mutation preflight | DENY |
| security preflight failed/missing | mutation preflight | DENY |
| overlap check missing | mutation preflight | DENY |
| D/C/R/M class unresolved | mutation preflight | DENY |
| rollback missing | mutation preflight | DENY |
| targeted tests undefined | mutation preflight | DENY |
| wrong ChatGPT app/client id | profile client constraint | DENY |
| provider/model label changed | metadata only | no authority change |
| credential exposure detected | profile stop condition | DENY |
| untrusted content requests scope elevation | profile stop condition | DENY |
| production mutation becomes necessary | profile stop condition | DENY |
| final Human/Owner review already started | mutation freeze | DENY |
| BRANCH when branch already exists | sequence guard | DENY |
| COMMIT without fresh `agent/*` branch | sequence guard | DENY |
| COMMIT without targeted validation PASS | sequence guard | DENY |
| PR before implementation complete | sequence guard | DENY |
| PR without current head SHA | sequence guard | DENY |
| PR when work-package PR already open | sequence guard | DENY |
| CI_REQUEST without open PR/number/head | sequence guard | DENY |
| MERGE / DEPLOY_REQUEST / PRODUCTION_MUTATION | exact SA2 capability surface | DENY |
| LIVE mutating BRANCH/COMMIT/PR/CI_REQUEST before SA3 | live-mode gate | DENY |
| valid DRY_RUN mutating action | SA2 + SA1 + M4 | ALLOW action-envelope preparation |
| valid LIVE READ/ANALYZE | SA2 + SA1 + M4 | ALLOW when REM permits |

## SA2 action-envelope evidence

A successful SA2 preparation records only non-secret authorization/coordination fields:

- profile id/version;
- `mandateId`;
- Roadmap item;
- Human actor;
- app/client id;
- agent/session/request ids;
- capability/risk;
- target repository/resource and requested paths;
- branch/head/PR identifiers when available;
- `requiresHumanMerge = true`;
- `liveMutationPermitted = false` for SA2 mutating actions.

Raw tokens, passwords, API keys and reusable credentials are not envelope fields.

## Required SA2 negative-test traceability

`tests/unit/systemadminExecutionProfile.test.ts` covers at minimum:

- exact capability surface;
- valid DRY_RUN PR action envelope;
- mutating LIVE action denial before SA3;
- allowed REM-bound LIVE READ;
- wrong app/client denial;
- provider/model metadata non-authority;
- missing mutation preflight;
- invalid/missing branch state;
- missing targeted validation;
- incomplete implementation/head state before PR;
- missing PR state before CI request;
- credential exposure;
- untrusted scope elevation;
- unexpected production requirement;
- mutation after final Owner review start;
- MERGE/DEPLOY_REQUEST/PRODUCTION_MUTATION;
- inherited SA1 target/path/CI-budget denial.

Supporting evidence: `docs/evidence/sa2/SA2_CHAT_EXECUTION_PROFILE_EVIDENCE.md`.

## CI/Owner-gate and Google-Marketing traceability

| Finding / invariant | Evidence | Remediation in PR #216 | Exit condition |
|---|---|---|---|
| PR #215 Google-Marketing guard #155 failed | static guard failure | reproduced and diagnosed, not reclassified | current-head guard PASS |
| initial PR #216 Google-Marketing guard #157 failed | same static step | exact protected paths + robust central CI evidence validation | current-head guard PASS |
| Systemadmin `src/platform/Security/*` change triggered unrelated marketing guard | path filter contained `src/platform/Security/**` | replace broad wildcard with exact `types.ts` + `authMiddleware.ts`; add consent bridge explicitly | unrelated Systemadmin file no longer sufficient trigger |
| central CI lost post-build production CSP test | `securityResponse.production.test.ts` skips when `dist/index.html` is absent | restore dedicated `npx vitest run tests/unit/securityResponse.production.test.ts` after build | dedicated test PASS |
| first checkbox event could observe later live body | owner gate re-read PR body via API | evaluate exact `github.event.pull_request.body` snapshot | earlier event cannot become authorized later |
| multiple checkbox edits can dispatch multiple workflow runs | GitHub `edited` events | event snapshot + concurrency; only final snapshot with both attestations can authorize expensive build | one expensive build for reviewed head |
| future central CI/package changes could silently break marketing evidence | guard did not watch `ci.yml`/`package.json` | add both to protected path set and statically prove `build → production CSP test → predeploy` | guard PASS on such changes |

The failed #155/#157 runs remain historical failure evidence. Their root cause is remediated only when the final PR #216 head passes the hardened guard and central CI.

## PR authorization traceability

ADR-0039 remains default. For the Systemadmin profile only, a valid REM becomes standing authorization for covered PR creation **after SA1–SA3 enablement gates are satisfied and the SA4 pilot mandate is Owner-approved**.

Systemadmin PR evidence must record:

- `mandateId`;
- covered Roadmap item;
- base main SHA;
- scope/paths;
- check class;
- security preflight result;
- tests/evidence;
- any open overlap/drift finding.

Final Human current-head review, Owner checkboxes, CI and separate Human merge authority remain unchanged.

## Branch lifecycle traceability

`fresh main branch → scoped commits → PR → Human merge → branch deleted`

Branch deletion after successful merge is a required closure condition. Closed/superseded branches are deleted after necessary Evidence retention. Merged branches are never reused.

## Current state

SA0 is COMPLETE through PR #214. SA1 is COMPLETE / VERIFIED PASS through PR #215 at `main@d8ccc3c5e136d51ae36b57b103119b25f4a42b8b`. SA2 implementation plus CI remediation is on `agent/sa2-systemadmin-chat-execution-profile` and remains **not LIVE-mutation-enabled** until final Owner review, hardened repository CI PASS, Human merge and subsequent SA3 audit correlation. SA3–SA5 remain blocked.
