# Systemadmin Agent Traceability Matrix

Status: PROPOSED
Date: 2026-08-12
Baseline: `main@4ef148b86773e5756641417ec7b6a7cc9ae0b188`

| Stage | Authority | Implementation / Evidence | Mutation boundary | Exit gate |
|---|---|---|---|---|
| SA0 Governance | ESS-0021 + ADR-0065 | Systemadmin Policy, REM schema, Systemadmin Roadmap, AGENTS/Concept Gate updates | repository docs only | Human/Owner merge of governance package |
| SA1 Mandate Validator | ESS-0021 + ADR-0065 + ADR-0058 | provider-neutral REM validator + negative tests | repository/control-plane code only | scope/expiry/identity/risk/kill-switch tests PASS |
| SA2 Execution Profile | ESS-0021 + ESS-0019 | `capital-ai-systemadmin-roadmap-executor` execution profile | READ/ANALYZE/PLAN/BRANCH/COMMIT/PR/CI_REQUEST only | autonomous branch→PR pilot technically PASS |
| SA3 Audit | ADR-0059 | M5 append-only audit correlation with `mandateId` | no secret/raw credential evidence | append-only correlation VERIFIED PASS |
| SA4 Pilot REM | Systemadmin Policy + REM schema | first Owner-approved non-production REM | one bounded Roadmap work package; max one open PR | Human-reviewed PR merged + branch deleted + evidence complete |
| SA5 External mutation design | future dedicated ADR + M10 assurance | REM-bound exact-target production authorization | bounded/reversible only; reserved Owner actions excluded | strong Owner approval + pre/post/rollback/audit VERIFIED PASS |

## Required authorization trace

Every Systemadmin mutating operation must be reconstructable as:

`Owner approval → mandateId → Roadmap item → agent/client/session/request → capability → risk → target → policy decision → mutation → result/evidence`

## Required negative-test traceability

| Requirement | Expected result |
|---|---|
| missing REM | DENY |
| expired REM | DENY |
| revoked REM | DENY |
| wrong Owner/agent/repository | DENY |
| path outside allowlist | DENY |
| target outside allowlist | DENY |
| capability not granted | DENY |
| risk above mandate maximum | DENY |
| `MERGE` request | DENY |
| repository protection weakening | DENY |
| Owner IAM/MFA/break-glass request | DENY |
| secret disclosure request | DENY |
| destructive production data request | DENY |
| live billing money/entitlement mutation | DENY |
| self-extension of REM | DENY |
| kill switch active | DENY |
| valid scoped branch/commit/PR action | ALLOW |

## PR authorization traceability

ADR-0039 remains default. For the Systemadmin profile only, a valid REM is standing authorization for covered PR creation.

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

SA0 is prepared on `agent/systemadmin-roadmap-executor-governance` but remains **not enabled** until Human/Owner review and merge. SA1–SA5 are blocked.
