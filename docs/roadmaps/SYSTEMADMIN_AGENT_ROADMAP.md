# CAPITAL-AI Systemadmin Agent Roadmap

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Current production baseline: `main@91963f59b74c8c3c3c0b33c6a23237a01ac0128e` (PR #222 merge)
Authority: ESS-0021, ADR-0065, ADR-0058, ADR-0059, ADR-0066, ADR-0067, ADR-0068

## Goal

The Systemadmin Roadmap Executor may autonomously implement Owner-approved repository work packages only through bounded REM authority, least privilege, durable append-only audit evidence, Human final review and Human-only merge.

## Stage status

| Stage | Status | Core evidence |
|---|---|---|
| SA0 Governance | COMPLETE | PR #214 |
| SA1 REM Validator | COMPLETE / VERIFIED PASS | PR #215 |
| SA2 Chat Execution Profile | COMPLETE / VERIFIED PASS | PR #216 |
| SA3A Append-only Audit Adapter | COMPLETE / VERIFIED PASS | PR #218 |
| SA3B Execution Host | **TECHNICAL VERIFIED PASS / CLEANUP PENDING** | PR #220, #222, Issues #221/#223/#224 |
| SA4 First bounded autonomous work package | **BOOTSTRAP IN PROGRESS / ACTIVATION BLOCKED BY SA3B BRANCH CLEANUP** | ADR-0068 + REM-SA4-PILOT-001 |
| SA5 Bounded external mutation design | BLOCKED | SA4 + M10 VERIFIED PASS required |

M10 passkey-only PR authorization target architecture was merged in PR #217, but runtime cutover remains sequentially blocked by M9. Until that cutover, current Human/Owner current-head review and attestation remain authoritative for final CI and merge.

## SA0 — Governance

**COMPLETE — PR #214 MERGED**

REM schema, ESS/ADR authority and branch lifecycle are on `main`.

## SA1 — REM validator / Control Plane

**COMPLETE / VERIFIED PASS — PR #215 MERGED**

Capability ceiling:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

`MERGE`, `DEPLOY_REQUEST`, `PRODUCTION_MUTATION`, CRITICAL execution and reserved Owner mutation classes remain denied.

### SA4 trust-root hardening

Before the first SA4 COMMIT/PR pilot, the SA1 self-authority ring is extended to include the SA3B/SA4 workflow, OIDC verifier, broker, mandates, parsers/host runner and audit adapter. A REM cannot authorize modification of those files even if an allowlist is maliciously widened.

## SA2 — Chat execution profile

**COMPLETE / VERIFIED PASS — PR #216 MERGED**

Mutating SA2 LIVE remains denied. SA2 produces policy-bound envelopes; real mutation requires the later audit-bound execution permit.

Sequence requirements remain:

- fresh `agent/*` branch;
- full preflight;
- targeted validation before COMMIT;
- completed implementation + current head before PR;
- no silent mutation after final Owner review begins;
- no production mutation.

## SA3A — Append-only audit adapter

**COMPLETE / VERIFIED PASS — PR #218 MERGED**

Canonical control:

`SA1/SA2 ALLOW → durable M5 authorization event → auditReference → audit-bound permit → exact action → second append-only outcome event`

## SA3B — Execution-host binding

**TECHNICAL VERIFIED PASS / LIFECYCLE CLEANUP PENDING**

Merged implementation:

- PR #220 host binding;
- PR #222 M5 writer/schema correction;
- final #222 merge `91963f59b74c8c3c3c0b33c6a23237a01ac0128e`;
- final #222 CI #951 PASS;
- corrected code live on Render deploy `dep-d9u1v5942hec739bsc6g`.

Host architecture:

`OWNER ISSUE → TRUSTED main WORKFLOW → STRICT REQUEST → GITHUB OIDC → CAPITAL-AI BROKER → SA1/SA2/SA3A → M5 PERMIT → GITHUB SIDE EFFECT → M5 OUTCOME`

### Real fail-closed proof

Issue #221 / run `31570833507`:

`M5 PERSISTENCE FAILURE → NO PERMIT → NO BRANCH`

### Real positive proof

Issue #223 / run `31574111075`:

- exact current main: PASS;
- OIDC: PASS;
- durable authorization: PASS;
- audit-bound BRANCH permit: PASS;
- exact branch side effect: PASS;
- terminal outcome: PASS.

Authorization:

`supabase:agent_audit_events:194f1198-492c-4d4f-b1e4-0c13a5d99d20`

Outcome:

`supabase:agent_audit_events:5ab9eefe-f472-4396-a7e7-2a3ceb029e34`

Direct read-only Supabase verification confirmed the correlated rows, request/run/branch and authorization reference.

### Separate stale-base proof

Issue #224 / run `31574221718` used stale base `156142102e7d2a97ad466aee0340f758fa4365e5`.

Result:

`STALE BASE → DENY BEFORE OIDC/BROKER → NO BRANCH`

### Remaining SA3B lifecycle gate

Successful probe branch:

`agent/sa3b-host-probe-20260812b`

must be deleted after evidence capture. The current connected GitHub action surface does not expose reference deletion, so this is not recorded as complete yet.

SA4 execution is technically guarded against bypass: the SA4 workflow checks that this exact branch is absent before acquiring OIDC or requesting any permit.

## SA4 — First bounded autonomous work-package REM

**BOOTSTRAP IN PROGRESS / LIVE PILOT BLOCKED UNTIL SA3B CLEANUP + BOOTSTRAP MERGE**

Authority: ADR-0068 and `.ai/mandates/REM-SA4-PILOT-001.json`.

### First pilot scope

The pilot is deliberately documentation-only and one-time.

Exact output path:

`docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md`

Allowed capabilities:

`BRANCH → COMMIT → PR`

Not delegated:

- `CI_REQUEST`;
- merge;
- deploy;
- production mutation;
- repository protection changes;
- IAM/MFA/break-glass;
- secrets/credential rotation;
- billing;
- DNS/TLS.

Risk ceiling: `MEDIUM`.

Max open SA4/Systemadmin PRs: `1`.

Mandate expiry: no more than seven days.

Kill switch: Owner-controlled and required.

### SA4 trusted input contract

Trigger title prefix:

`[SA4-PILOT]`

Issue body contains only:

- `version`;
- `mode = BOUNDED_DOC_PR`;
- `mandateId = REM-SA4-PILOT-001`;
- `roadmapItem = SA4-FIRST-AUTONOMOUS-WORK-PACKAGE`;
- exact current `baseSha`;
- branch `agent/sa4-pilot-*`.

No file content, command, arbitrary path, PR body or workflow definition may be supplied by the Issue.

### SA4 exact execution chain

`Owner Issue → strict parser → current-main binding → SA3B cleanup check → open-PR overlap inventory → OIDC → BRANCH auth → branch → BRANCH outcome → COMMIT auth → deterministic evidence commit → digest verification → COMMIT outcome → PR auth → draft PR → PR outcome`

Every mutating capability receives a separate durable authorization/outcome pair. Permits are capability-, mandate-, branch-, path- and head-bound and cannot be reused across operations.

The draft PR does not autonomously request final CI. Current Human/Owner review/attestation remains the gate for the single expensive `build-and-test`.

### SA4 bootstrap exit gate

Before the live autonomous pilot:

1. SA4 bootstrap branch is reviewed and final CI is PASS;
2. Human merge of bootstrap PR;
3. bootstrap branch deleted;
4. `agent/sa3b-host-probe-20260812b` deleted;
5. corrected bootstrap `main` deployed because the broker/OIDC runtime changed;
6. no concurrent PR changes the exact SA4 evidence path.

### SA4 VERIFIED PASS exit gate

1. fresh Owner `[SA4-PILOT]` Issue on exact current `main`;
2. BRANCH authorization + SUCCESS outcome persisted;
3. fresh pilot branch created from exact base SHA;
4. COMMIT authorization persisted before exact file write;
5. deterministic evidence file digest verified after commit;
6. COMMIT SUCCESS outcome persisted with exact commit SHA;
7. PR authorization persisted before draft PR creation;
8. draft PR created from exact pilot commit;
9. PR SUCCESS outcome persisted with exact PR number;
10. no production mutation or autonomous CI/merge;
11. Human file review + final CI + Human merge;
12. pilot branch deleted after merge;
13. evidence and traceability synchronized.

## SA5 — Bounded external mutation design

**BLOCKED BY SA4 + M10 VERIFIED PASS**

External production mutation remains prohibited until a separate future ADR proves exact-target, reversible execution plus strong M10 Owner assurance.

## Branch lifecycle

`current main → fresh scoped branch → audited actions → PR → Human review/CI → Human merge → branch delete`

Merged/superseded branches are never reused.

## Current next action

Complete the SA4 bootstrap PR under the existing Human review/CI/merge gate. Independently delete `agent/sa3b-host-probe-20260812b`. Only after both conditions and deployment of the bootstrap runtime may the first `[SA4-PILOT]` Issue be executed.