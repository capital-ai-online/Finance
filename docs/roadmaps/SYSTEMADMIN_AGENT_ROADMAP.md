# CAPITAL-AI Systemadmin Agent Roadmap

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Current production baseline: `main@2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd` (PR #229 merge)
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
| SA3B Execution Host | **COMPLETE / VERIFIED PASS** | PR #220, #222; Issues #221/#223/#224; lifecycle cleanup verified before SA4 |
| SA4 First bounded autonomous work package | **COMPLETE / VERIFIED PASS** | PR #226; Issue #228 / run `31579519025`; PR #229; six M5 authorization/outcome events |
| SA5 Bounded external mutation design | BLOCKED | M10 VERIFIED PASS required |

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

Before the first SA4 COMMIT/PR pilot, the SA1 self-authority ring was extended to include the SA3B/SA4 workflow, OIDC verifier, broker, mandates, parsers/host runner and audit adapter. A REM cannot authorize modification of those files even if an allowlist is maliciously widened.

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

**COMPLETE / VERIFIED PASS**

Merged implementation:

- PR #220 host binding;
- PR #222 M5 writer/schema correction;
- final #222 merge `91963f59b74c8c3c3c0b33c6a23237a01ac0128e`;
- final #222 CI #951 PASS;
- corrected code deployed to Render.

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

### Lifecycle closure

The successful probe branch `agent/sa3b-host-probe-20260812b` was deleted before the live SA4 pilot. The SA4 preflight therefore passed its fail-closed cleanup check before acquiring OIDC or requesting any mutation permit.

SA3B is complete only because both the positive permit-before-side-effect proof and the negative/fail-closed proofs are combined with successful branch cleanup.

## SA4 — First bounded autonomous work-package REM

**COMPLETE / VERIFIED PASS — PR #229 MERGED**

Authority: ADR-0068 and `.ai/mandates/REM-SA4-PILOT-001.json`.

### Bounded pilot scope

The first pilot was deliberately documentation-only and one-time.

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

### SA4 live execution proof

Owner trigger:

- Issue #228;
- workflow run `31579519025`;
- exact base `main@f7dfcda36905d9a55d74f57f2140224928960379`;
- pilot branch `agent/sa4-pilot-proof-20260812b`.

Autonomous repository result:

- BRANCH created only after a dedicated durable permit;
- deterministic evidence file generated from trusted host metadata;
- COMMIT `02f012e71106d5ffd9a4baa3e6f3eba7160eb55d` created only after a separate COMMIT permit;
- committed bytes verified by SHA-256;
- Draft PR #229 created only after a separate PR permit;
- autonomous host requested no final CI, performed no deploy and performed no merge.

### Durable M5 evidence

| Capability | Authorization | Outcome | Result |
|---|---|---|---|
| BRANCH | `supabase:agent_audit_events:1b4b04cb-a86b-4612-9ef5-308e95a18c95` | `supabase:agent_audit_events:e99b9af7-74cc-4693-966f-c9b85102035d` | SUCCESS |
| COMMIT | `supabase:agent_audit_events:3c5916a1-d8c1-4ba1-9de1-d839fcc1bc85` | `supabase:agent_audit_events:bc6ecf0b-86db-4b8c-ae95-2c963a0776f5` | SUCCESS |
| PR | `supabase:agent_audit_events:41874d2e-a7b7-48c9-8287-71d75bea7d05` | `supabase:agent_audit_events:d4722de8-3242-4822-ab7d-f353880312ac` | SUCCESS / PR #229 |

All six rows share the same SA4 request/run correlation and preserve the permit-before-side-effect invariant.

### Human final gate and lifecycle closure

- PR #229 changed exactly one file and one commit;
- Governance #662: SUCCESS;
- final CI #965: SUCCESS;
- Human/Owner current-head review and both attestations completed before final CI;
- Human merge completed on 2026-08-12;
- merge commit: `2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`;
- pilot branch `agent/sa4-pilot-proof-20260812b` deleted after merge;
- trigger Issue #228 closed with reason `completed` after post-merge verification.

This proves the bounded autonomous chain:

`Owner-approved REM → Owner Issue → trusted GitHub Actions host → OIDC → BRANCH permit/outcome → COMMIT permit/outcome → Draft-PR permit/outcome → Human review → final CI → Human merge → branch delete`

### SA4 VERIFIED PASS exit gate

1. fresh Owner `[SA4-PILOT]` Issue on exact current `main`: PASS;
2. BRANCH authorization + SUCCESS outcome persisted: PASS;
3. fresh pilot branch created from exact base SHA: PASS;
4. COMMIT authorization persisted before exact file write: PASS;
5. deterministic evidence file digest verified after commit: PASS;
6. COMMIT SUCCESS outcome persisted with exact commit SHA: PASS;
7. PR authorization persisted before Draft-PR creation: PASS;
8. Draft PR created from exact pilot commit: PASS;
9. PR SUCCESS outcome persisted with exact PR number: PASS;
10. no production mutation or autonomous CI/merge: PASS;
11. Human file review + final CI + Human merge: PASS;
12. pilot branch deleted after merge: PASS;
13. evidence and traceability synchronized: completed by the SA4 status-sync change set.

## SA5 — Bounded external mutation design

**BLOCKED BY M10 VERIFIED PASS**

SA4 is no longer a blocker. External production mutation remains prohibited until a separate future ADR proves exact-target, reversible execution plus strong M10 Owner assurance and M10 reaches runtime `VERIFIED PASS`.

## Branch lifecycle

`current main → fresh scoped branch → audited actions → PR → Human review/CI → Human merge → branch delete`

Merged/superseded branches are never reused.

## Current next action

Advance the prerequisite path toward M10 runtime `VERIFIED PASS`. SA5 remains blocked and no external production mutation is authorized by completion of SA4.