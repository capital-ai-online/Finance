# Systemadmin Agent Traceability Matrix

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Production baseline: `main@91963f59b74c8c3c3c0b33c6a23237a01ac0128e`

| Stage | Authority | Implementation / Evidence | Mutation boundary | Exit gate |
|---|---|---|---|---|
| SA0 Governance | ESS-0021 + ADR-0065 | PR #214 | repository governance | COMPLETE |
| SA1 Mandate Validator | ESS-0021 + ADR-0065 + ADR-0058 | PR #215; expanded trust root in SA4 bootstrap | repository only; production denied | COMPLETE / VERIFIED PASS |
| SA2 Chat Profile | ESS-0021 + SA1 | PR #216 | mutating LIVE envelope alone denied | COMPLETE / VERIFIED PASS |
| SA3A Audit Adapter | ADR-0059 + ADR-0065 | PR #218; M5 writer corrected by #222 | no permit before durable M5 audit | COMPLETE / VERIFIED PASS |
| SA3B Execution Host | ADR-0067 | PR #220 + #222; Issues #221/#223/#224 | BRANCH host proof only | **TECHNICAL VERIFIED PASS / CLEANUP PENDING** |
| SA4 Bounded Pilot | ADR-0068 + REM-SA4-PILOT-001 | bootstrap branch / dedicated host, parser, runner, tests | exact doc path; BRANCH/COMMIT/Draft PR only | **BOOTSTRAP IN PROGRESS** |
| SA5 External Mutation | future ADR + M10 | not implemented | production mutation prohibited | BLOCKED BY SA4 + M10 |

## Canonical evidence chain

Every Systemadmin repository side effect must be reconstructable as:

`Owner-approved REM → Owner issue → trusted main workflow → GitHub workload identity → exact capability/path/head → durable authorization auditReference → exact side effect → durable terminal outcomeReference`

Direct ChatGPT→GitHub connector writes remain outside the autonomous Systemadmin mutation path.

## SA3B production proof

### Fail-closed audit outage

Issue #221 / run `31570833507`:

`AUDIT PERSISTENCE FAILURE → NO PERMIT → NO BRANCH`

### Positive permit-before-side-effect

Issue #223 / run `31574111075` on exact `main@91963f59b74c8c3c3c0b33c6a23237a01ac0128e`:

| Correlation | Value |
|---|---|
| capability | `BRANCH` |
| branch | `agent/sa3b-host-probe-20260812b` |
| authorization | `supabase:agent_audit_events:194f1198-492c-4d4f-b1e4-0c13a5d99d20` |
| outcome | `supabase:agent_audit_events:5ab9eefe-f472-4396-a7e7-2a3ceb029e34` |
| outcome result | `SUCCESS` |
| branch SHA | `91963f59b74c8c3c3c0b33c6a23237a01ac0128e` |

Read-only Supabase verification confirmed both real append-only rows and the outcome→authorization reference.

### Stale-base negative path

Issue #224 / run `31574221718`:

`STALE BASE → DENY BEFORE OIDC/BROKER → NO BRANCH`

Requested negative branch was independently absent.

### Remaining SA3B lifecycle item

`agent/sa3b-host-probe-20260812b` still requires deletion after evidence capture. SA4 checks this ref before OIDC and refuses execution while it exists.

## SA4 authority trace

### Mandate

`.ai/mandates/REM-SA4-PILOT-001.json`

| Field | Required |
|---|---|
| Owner | `SvenKulessa` |
| agent | `capital-ai-systemadmin-roadmap-executor` |
| repository/base | `SvenKulessa/Finance` / `main` |
| roadmap item | `SA4-FIRST-AUTONOMOUS-WORK-PACKAGE` |
| capabilities | `BRANCH`, `COMMIT`, `PR` |
| exact path | `docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md` |
| mutation class | `REPOSITORY` |
| max risk | `MEDIUM` |
| max open SA4 PRs | `1` |
| expiry | <= 7 days |
| kill switch | Owner-controlled / required |

All reserved mutation classes, including `MERGE`, remain prohibited.

## SA4 ingress trace

`validateSa4PilotIssue.mjs` accepts only:

- `version=1.0`;
- `mode=BOUNDED_DOC_PR`;
- `mandateId=REM-SA4-PILOT-001`;
- `roadmapItem=SA4-FIRST-AUTONOMOUS-WORK-PACKAGE`;
- full lowercase base SHA;
- `agent/sa4-pilot-*` branch.

Unknown fields, file payloads, arbitrary commands, alternate paths/modes and unsafe branches are denied.

## SA4 host identity trace

The OIDC verifier accepts exactly two workflow refs on `refs/heads/main`:

1. `.github/workflows/systemadmin-roadmap-executor.yml` for `REM-SA3B-PROBE-001`;
2. `.github/workflows/systemadmin-sa4-pilot.yml` for `REM-SA4-PILOT-001`.

The broker separately binds workflow ref ↔ mandate. Cross-stage token/mandate substitution returns 403.

All existing Owner/repository immutable ID, audience, issuer, signature, event and ref checks remain required.

## SA4 permit-before-side-effect matrix

| Operation | Pre-side-effect control | Side effect | Terminal evidence |
|---|---|---|---|
| BRANCH | SA1/SA2/SA3 + M5 BRANCH authorization | create exact `agent/sa4-pilot-*` branch | BRANCH SUCCESS/ERROR outcome |
| COMMIT | exact path + branch/head + targeted prevalidation + M5 COMMIT authorization | create deterministic evidence file only | COMMIT outcome with commit SHA |
| PR | open-PR inventory + exact path/head + M5 PR authorization | create one draft PR to `main` | PR outcome with PR number |

No earlier permit may authorize a later capability.

## Deterministic content boundary

The Issue cannot provide Markdown/file payload. `runSa4Pilot.mjs` generates the evidence file from trusted metadata and verifies the committed bytes by SHA-256 before recording COMMIT SUCCESS.

The exact target file is absent from bootstrap/main and is reserved for the autonomous pilot itself.

## Concurrent writer boundary

Before COMMIT and again before PR authorization, the trusted host queries open PR changed files through GitHub and supplies them to the SA1 policy. Exact target-path overlap is DENY.

At bootstrap time:

- PR #225 changes DevelopmentChain documentation only;
- PR #193 changes cost/monetization documentation only;
- neither includes the SA4 pilot evidence path.

## Trust-root boundary

SA1 and SA3 self-authority protection include the SA3B/SA4 workflows, mandates, OIDC verifier, broker, audit adapter and SA4 parser/runner. A Systemadmin REM cannot authorize modifications to these paths.

## Rollback boundary

The trusted runner may delete only its exact `agent/sa4-pilot-*` branch as bounded rollback. If a draft PR was already created and its outcome cannot be persisted, the host closes that exact draft PR and deletes its exact branch before failing.

Rollback never targets `main`, repository protection, another PR or production infrastructure.

## Human boundary

- `CI_REQUEST` is not part of `REM-SA4-PILOT-001`;
- the autonomous host does not mark the PR ready, approve or merge;
- current Human/Owner current-head review/attestation remains the final CI gate;
- `MERGE` remains Human-only;
- pilot branch deletion remains mandatory after Human merge.

## SA4 activation gate

The live pilot is blocked until:

1. bootstrap PR final CI PASS and Human merge;
2. bootstrap branch deletion;
3. successful SA3B probe branch deletion;
4. bootstrap runtime deployed to Render;
5. no exact target-path overlap exists.

Only then may a fresh Owner `[SA4-PILOT]` Issue execute the bounded autonomous work package.