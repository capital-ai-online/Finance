# Systemadmin Agent Traceability Matrix

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Baseline: `main@d342654715b4f1aef23e9fbaf3230b54f327e0a2` (PR #214 merge)

| Stage | Authority | Implementation / Evidence | Mutation boundary | Exit gate |
|---|---|---|---|---|
| SA0 Governance | ESS-0021 + ADR-0065 | Systemadmin Policy, REM schema, Systemadmin Roadmap, AGENTS/Concept Gate updates; PR #214 | repository docs only | **COMPLETE** — merged at `d342654715b4f1aef23e9fbaf3230b54f327e0a2` |
| SA1 Mandate Validator | ESS-0021 + ADR-0065 + ADR-0058 | `roadmapExecutionMandate.ts`, PolicyGate entry point, unit tests, `docs/evidence/sa1/*` | repository/control-plane code only; production mutation hard-denied | **IMPLEMENTED / CI+MERGE PENDING** |
| SA2 Execution Profile | ESS-0021 + ESS-0019 | `capital-ai-systemadmin-roadmap-executor` execution profile | READ/ANALYZE/PLAN/BRANCH/COMMIT/PR/CI_REQUEST only | BLOCKED BY SA1 VERIFIED PASS |
| SA3 Audit | ADR-0059 | M5 append-only audit correlation with `mandateId` | no secret/raw credential evidence | BLOCKED BY SA2; append-only correlation VERIFIED PASS required |
| SA4 Pilot REM | Systemadmin Policy + REM schema | first Owner-approved non-production REM | one bounded Roadmap work package; max one open PR | BLOCKED BY SA3; Human-reviewed PR merged + branch deleted + evidence complete |
| SA5 External mutation design | future dedicated ADR + M10 assurance | REM-bound exact-target production authorization | bounded/reversible only; reserved Owner actions excluded | BLOCKED BY SA4 + strong Owner approval assurance |

## Required authorization trace

Every Systemadmin mutating operation must be reconstructable as:

`Owner approval → mandateId → Roadmap item → agent/client/session/request → capability → risk → target → policy decision → mutation → result/evidence`

SA1 validates the mandate/scope prerequisites. Durable append-only `mandateId` correlation is completed and verified in SA3.

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
| Systemadmin trust-root change | protected self-authority paths | DENY |
| reserved Owner mutation | canonical reserved-class denylist | DENY |
| missing mutation classification | mutating-capability requirement | DENY |
| concurrent open-PR exact file overlap | changed-file conflict check | DENY |
| new PR exceeds mandate limit | PR CREATE counter | DENY |
| existing PR UPDATE at limit | PR operation distinction | ALLOW if otherwise in scope |
| CI budget exceeded | CI_REQUEST guard | DENY |
| unchanged head already validated | duplicate-CI guard | DENY |
| valid scoped HIGH repository action | REM-derived approval + existing Agent IAM | ALLOW |

## Required negative-test traceability

`tests/unit/roadmapExecutionMandate.test.ts` covers at minimum:

- missing/malformed REM;
- unknown fields;
- missing authority/approval evidence;
- expired/revoked/draft REM;
- wrong Owner/agent/repository/roadmap item;
- unknown/non-granted capability;
- MERGE;
- deploy/production mutation;
- risk above mandate;
- target/path mismatch and traversal;
- self-authority modification;
- all reserved Human/Owner mutation classes;
- missing mutation class;
- concurrent writer overlap;
- open-PR limit;
- kill-switch availability;
- CI budget and duplicate unchanged-head request;
- valid scoped HIGH repository PR action.

Supporting isolated pre-PR evidence is recorded in `docs/evidence/sa1/SA1_REM_VALIDATOR_EVIDENCE.md`. Full repository CI remains authoritative for the final head.

## PR authorization traceability

ADR-0039 remains default. For the Systemadmin profile only, a valid REM is standing authorization for covered PR creation **after SA1–SA3 enablement gates are satisfied**.

The PR must record:

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

SA0 is **COMPLETE** through PR #214. SA1 implementation is present on `agent/sa1-rem-validator-control-plane` and remains **not enabled** until final Owner review, repository CI PASS and Human merge. SA2–SA5 remain blocked.
