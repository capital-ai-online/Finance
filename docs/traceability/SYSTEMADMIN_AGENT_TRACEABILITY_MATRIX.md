# Systemadmin Agent Traceability Matrix

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Repository baseline: `main@6205868da833a6ee75b5301e78b0a2e6a118c411`

| Stage | Authority | Implementation / Evidence | Mutation boundary | Exit gate |
|---|---|---|---|---|
| SA0 Governance | ESS-0021 + ADR-0065 | PR #214 | repository governance | COMPLETE |
| SA1 Mandate Validator | ESS-0021 + ADR-0065 + ADR-0058 | PR #215; expanded trust root in SA4 bootstrap | repository only; production denied | COMPLETE / VERIFIED PASS |
| SA2 Chat Profile | ESS-0021 + SA1 | PR #216 | mutating LIVE envelope alone denied | COMPLETE / VERIFIED PASS |
| SA3A Audit Adapter | ADR-0059 + ADR-0065 | PR #218; M5 writer corrected by #222 | no permit before durable M5 audit | COMPLETE / VERIFIED PASS |
| SA3B Execution Host | ADR-0067 | PR #220 + #222; Issues #221/#223/#224; probe branch cleanup verified | BRANCH host proof only | **COMPLETE / VERIFIED PASS** |
| SA4 Bounded Pilot | ADR-0068 + REM-SA4-PILOT-001 | PR #226; Issue #228 / run `31579519025`; PR #229; six M5 events | exact doc path; BRANCH/COMMIT/Draft PR only | **COMPLETE / VERIFIED PASS** |
| M5A Repository Package | ESS-0020 + ADR-0064 + REM-M5A-REPOSITORY-001 | Work-package + DRAFT mandate in governance PR | repository code/tests/evidence only; production denied | OWNER REVIEW + REM ACTIVATION REQUIRED |
| SA5 External Mutation | future ADR + M10 | not implemented | production mutation prohibited | BLOCKED BY M10 VERIFIED PASS |

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

### SA3B lifecycle closure

The successful probe branch `agent/sa3b-host-probe-20260812b` was deleted before the live SA4 pilot. The SA4 preflight confirmed the ref was absent before OIDC acquisition or any mutation-permit request.

SA3B therefore satisfies both runtime verification and post-proof branch lifecycle cleanup.

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

## SA4 live pilot trace

### Runtime correlation

| Correlation | Value |
|---|---|
| Owner trigger | Issue #228 |
| workflow run | `31579519025` |
| workflow result | `SUCCESS` |
| exact base | `f7dfcda36905d9a55d74f57f2140224928960379` |
| branch | `agent/sa4-pilot-proof-20260812b` |
| autonomous commit | `02f012e71106d5ffd9a4baa3e6f3eba7160eb55d` |
| autonomous Draft PR | #229 |
| exact path | `docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md` |

### Durable M5 authorization/outcome pairs

| Capability | Authorization auditReference | Outcome auditReference | Result |
|---|---|---|---|
| BRANCH | `supabase:agent_audit_events:1b4b04cb-a86b-4612-9ef5-308e95a18c95` | `supabase:agent_audit_events:e99b9af7-74cc-4693-966f-c9b85102035d` | SUCCESS |
| COMMIT | `supabase:agent_audit_events:3c5916a1-d8c1-4ba1-9de1-d839fcc1bc85` | `supabase:agent_audit_events:bc6ecf0b-86db-4b8c-ae95-2c963a0776f5` | SUCCESS |
| PR | `supabase:agent_audit_events:41874d2e-a7b7-48c9-8287-71d75bea7d05` | `supabase:agent_audit_events:d4722de8-3242-4822-ab7d-f353880312ac` | SUCCESS / PR #229 |

Direct read-only Supabase verification confirmed all six correlated append-only rows. The PR outcome carries `pull_request_number=229`; the COMMIT outcome carries the exact autonomous commit SHA.

## Deterministic content boundary

The Issue cannot provide Markdown/file payload. `runSa4Pilot.mjs` generated the evidence file from trusted metadata and verified the committed bytes by SHA-256 before recording COMMIT SUCCESS.

PR #229 changed exactly one file with one autonomous commit and no additional repository path.

## Concurrent writer boundary

Before COMMIT and again before PR authorization, the trusted host queried open PR changed files through GitHub and supplied them to the SA1 policy. Exact target-path overlap is DENY.

The successful live pilot had no concurrent PR overlap on `docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md`.

## Trust-root boundary

SA1 and SA3 self-authority protection include the SA3B/SA4 workflows, mandates, OIDC verifier, broker, audit adapter and SA4 parser/runner. A Systemadmin REM cannot authorize modifications to these paths.

## Rollback boundary

The trusted runner may delete only its exact `agent/sa4-pilot-*` branch as bounded rollback. If a Draft PR was already created and its outcome cannot be persisted, the host closes that exact Draft PR and deletes its exact branch before failing.

Rollback never targets `main`, repository protection, another PR or production infrastructure.

## Human boundary

- `CI_REQUEST` was not part of `REM-SA4-PILOT-001`;
- the autonomous host did not approve or merge PR #229;
- final CI remained behind Human/Owner current-head review and attestation;
- Governance #662 completed `SUCCESS`;
- final CI #965 completed `SUCCESS`;
- `MERGE` remained Human-only;
- Human merge produced `main@2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`;
- pilot branch deletion remained mandatory and was verified after merge.

## SA4 activation gate — SATISFIED

1. bootstrap PR #226 final CI PASS and Human merge: PASS;
2. bootstrap branch deletion: PASS;
3. successful SA3B probe branch deletion: PASS;
4. bootstrap runtime deployed to Render: PASS;
5. no exact target-path overlap before live execution: PASS.

## SA4 VERIFIED PASS exit gate — SATISFIED

1. fresh Owner Issue #228 bound to exact current `main`: PASS;
2. BRANCH authorization persisted before side effect: PASS;
3. BRANCH SUCCESS outcome persisted: PASS;
4. COMMIT authorization persisted before deterministic file mutation: PASS;
5. committed bytes verified by SHA-256: PASS;
6. COMMIT SUCCESS outcome persisted with `02f012e71106d5ffd9a4baa3e6f3eba7160eb55d`: PASS;
7. PR authorization persisted before Draft-PR creation: PASS;
8. Draft PR #229 created from the exact pilot commit: PASS;
9. PR SUCCESS outcome persisted with `pull_request_number=229`: PASS;
10. no production mutation, autonomous final CI request or autonomous merge: PASS;
11. Human review and final CI #965: PASS;
12. Human merge to `2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`: PASS;
13. `agent/sa4-pilot-proof-20260812b` deleted after merge: PASS;
14. Issue #228 closed with reason `completed`: PASS;
15. roadmap and traceability synchronized: completed by this SA4 status-sync change set.

## SA5 boundary after SA4

SA4 is no longer a prerequisite blocker. SA5 remains **BLOCKED BY M10 VERIFIED PASS**.

Completion of SA4 does not authorize external production mutation. Any future SA5 design still requires separate authority, exact-target and rollback controls, and strong M10 Owner assurance.

## M5A bounded repository package trace

| Dimension | Binding |
|---|---|
| Roadmap item | `M5A-NATIVE-MFA-AAL2-REPOSITORY-IMPLEMENTATION` |
| Executor | `capital-ai-systemadmin-roadmap-executor` |
| Mandate | `.ai/mandates/REM-M5A-REPOSITORY-001.json` |
| Initial mandate state | `DRAFT` — no execution authority |
| Work-package | `docs/roadmaps/M5A_SYSTEMADMIN_REPOSITORY_WORK_PACKAGE.md` |
| Mutation class | `REPOSITORY` only |
| Risk ceiling | `HIGH` |
| Open PR limit | 1 |
| Production mutation | DENY |
| Merge | Human-only |
| Next activation | exact-current-main binding + Owner acceptance + durable audit preflight |

Required permit sequence after activation:

`BRANCH authorization/outcome → COMMIT authorization/outcome → PR authorization/outcome → Human review → CI → Human merge → branch delete`

The package cannot enroll/remove/reset Supabase factors, mutate Auth settings, read secrets, deploy Render, alter billing/DNS, weaken repository protection or expand its own authority. Productive M5A enrollment remains a later separate Human/Owner gate.
