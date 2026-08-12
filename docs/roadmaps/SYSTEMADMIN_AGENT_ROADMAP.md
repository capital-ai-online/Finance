# CAPITAL-AI Systemadmin Agent Roadmap

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Current repository baseline: `main@2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd` (PR #229 merge)
Current production baseline: Render deploy `dep-d9u392nlk1mc73fg1hk0` — `live` — commit `2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`
Authority: ESS-0021, ADR-0065, ADR-0058, ADR-0059, ADR-0066, ADR-0067, ADR-0068

## Goal

The Systemadmin Roadmap Executor may autonomously implement Owner-approved repository work packages only through bounded REM authority, least privilege, durable append-only audit evidence, Human final review and Human-only merge.

The agent is never the trust root. Provider/model identity does not create authority.

## Stage status

| Stage | Status | Core evidence |
|---|---|---|
| SA0 Governance | **COMPLETE** | PR #214 |
| SA1 REM Validator | **COMPLETE / VERIFIED PASS** | PR #215 |
| SA2 Chat Execution Profile | **COMPLETE / VERIFIED PASS** | PR #216 |
| SA3A Append-only Audit Adapter | **COMPLETE / VERIFIED PASS** | PR #218 |
| SA3B Execution Host | **COMPLETE / VERIFIED PASS** | PR #220, #222; Issues #221/#223/#224; branch cleanup verified |
| SA4 First bounded autonomous work package | **COMPLETE / VERIFIED PASS** | PR #226 bootstrap; Issue #228 / run `31579519025`; PR #229; closure evidence |
| SA5 Bounded external mutation design | **BLOCKED BY M10 + DEDICATED AUTHORITY** | future ADR/REM; no production mutation delegated |

M10 passkey-only PR authorization target architecture exists, but runtime cutover remains sequentially blocked by M9. Until M10 reaches `VERIFIED PASS`, the current Human/Owner current-head review and attestation remain authoritative for final expensive CI and merge.

## SA0 — Governance

**COMPLETE — PR #214 MERGED**

REM schema, ESS/ADR authority and branch lifecycle are on `main`.

## SA1 — REM validator / Control Plane

**COMPLETE / VERIFIED PASS — PR #215 MERGED**

Logical capability ceiling defined by ESS-0021 / ADR-0065:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

Capabilities do not inherit. Every actual execution requires explicit REM and host support for the exact operation.

`MERGE`, unrestricted `DEPLOY_REQUEST`, unrestricted `PRODUCTION_MUTATION`, CRITICAL execution and reserved Owner mutation classes remain denied.

Self-authority protection covers Systemadmin workflows, mandates, OIDC verifier, broker, audit adapter and trusted runner/parser paths.

## SA2 — Chat execution profile

**COMPLETE / VERIFIED PASS — PR #216 MERGED**

SA2 produces policy-bound execution envelopes. A model/client alone cannot convert an envelope into mutation authority.

Required repository sequence remains:

- fresh scoped branch from current `main`;
- full read-only preflight;
- targeted validation before COMMIT;
- completed implementation + current head before PR;
- no silent mutation after final Owner review begins;
- no production mutation without separate exact authority.

## SA3A — Append-only audit adapter

**COMPLETE / VERIFIED PASS — PR #218 MERGED**

Canonical control:

```text
SA1/SA2 ALLOW
→ durable M5 authorization event
→ auditReference
→ audit-bound permit
→ exact side effect
→ durable terminal outcome event
```

## SA3B — Execution-host binding

**COMPLETE / VERIFIED PASS**

Merged implementation:

- PR #220 host binding;
- PR #222 M5 writer/schema correction.

Real fail-closed proof:

- Issue #221 / run `31570833507`: `M5 PERSISTENCE FAILURE → NO PERMIT → NO BRANCH`.

Real positive proof:

- Issue #223 / run `31574111075`;
- OIDC/request binding PASS;
- durable authorization PASS;
- audit-bound BRANCH permit PASS;
- exact branch side effect PASS;
- terminal SUCCESS outcome PASS.

Authorization:

`supabase:agent_audit_events:194f1198-492c-4d4f-b1e4-0c13a5d99d20`

Outcome:

`supabase:agent_audit_events:5ab9eefe-f472-4396-a7e7-2a3ceb029e34`

Separate stale-base proof:

- Issue #224 / run `31574221718`;
- `STALE BASE → DENY BEFORE OIDC/BROKER → NO BRANCH`.

Final lifecycle check confirms `agent/sa3b-host-probe-20260812b` is absent.

**SA3B lifecycle exit gate is complete.**

## SA4 — First bounded autonomous work package

**COMPLETE / VERIFIED PASS**

Authority: ADR-0068 and `.ai/mandates/REM-SA4-PILOT-001.json`.

### Bootstrap

PR #226 Human-merged the bounded SA4 host and trust-root hardening at:

`f7dfcda36905d9a55d74f57f2140224928960379`

The bootstrap runtime was deployed before the live pilot.

### Real autonomous pilot

Owner Issue #228 triggered Workflow `31579519025` from exact base `f7dfcda36905d9a55d74f57f2140224928960379`.

The trusted host autonomously executed:

```text
BRANCH
→ durable BRANCH outcome
→ COMMIT authorization
→ deterministic exact file commit
→ digest verification
→ durable COMMIT outcome
→ PR authorization
→ Draft PR
→ durable PR outcome
```

Exact output path:

`docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md`

Exact autonomous commit:

`02f012e71106d5ffd9a4baa3e6f3eba7160eb55d`

Exact PR:

`#229`

The host did **not** request final CI, approve, mark ready, merge, deploy or mutate production.

### Human boundary / closure

PR #229 was reviewed and merged by the Human/Owner. Merge SHA:

`2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`

Main CI #966 / run `31580214920`: PASS.

Pilot branch `agent/sa4-pilot-proof-20260812b`: absent after merge.

Render deploy `dep-d9u392nlk1mc73fg1hk0`: live on the same merge SHA.

Closure Evidence:

`docs/evidence/sa4/SA4_VERIFIED_PASS_CLOSURE_2026-08-12.md`

### Proven capability boundary

SA4 verifies a **deterministic, allowlisted repository work package** with:

`BRANCH → COMMIT → Draft PR`

It proves the execution-control architecture for those exact operations, including permit-before-side-effect and outcome correlation.

It does **not** prove arbitrary application-code generation or arbitrary patch ingestion. The SA4 runner deliberately generated one trusted deterministic documentation artifact. Therefore a future autonomous M5A/code work package must have:

1. a dedicated Owner-approved REM for the exact DEVELOPMENT item;
2. explicit allowed code/test paths and risk ceiling;
3. technically enforceable patch/code-generation boundary;
4. self-authority denyset;
5. required targeted/negative tests;
6. audit-bound BRANCH/COMMIT/PR operations;
7. Human final review and Human-only merge.

Direct model→GitHub writes outside that bounded host must not be mislabeled as SA4-verified autonomous execution.

## SA5 — Bounded external mutation design

**BLOCKED**

SA4 completion does not grant external production mutation authority.

External mutation remains prohibited until a separate architecture proves exact-target, reversible, auditable execution with adequate Human/Owner assurance. M10 `VERIFIED PASS` remains a prerequisite for the intended higher-assurance external mutation design unless a later Human-approved ADR explicitly defines an equivalent or stronger gate.

Reserved Human actions remain outside delegation, including Owner MFA/break-glass, destructive production data, live money/entitlements, production-resource deletion, DNS/TLS/domain ownership and security-control weakening.

## Branch lifecycle

Every work package follows:

```text
current main
→ fresh scoped branch
→ audited allowed actions
→ PR
→ Human review / required CI
→ Human merge
→ branch delete
```

Merged/superseded branches are never reused. Ephemeral clones/worktrees are cleaned after required Evidence retention.

## Current next action

SA3B and SA4 are closed as `COMPLETE / VERIFIED PASS`.

The next DEVELOPMENT business/security phase is M5A, but the existing `REM-SA4-PILOT-001` is **not** authority for M5A code. Before the Systemadmin Executor may autonomously implement M5A application code, create/approve a dedicated M5A repository REM and provide a technically bounded execution path for the exact code/test scope.

External M5A Supabase factor enrollment remains separately Human/Owner-approved and is not implied by repository authority.