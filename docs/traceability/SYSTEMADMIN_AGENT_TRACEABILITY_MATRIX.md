# Systemadmin Agent Traceability Matrix

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Repository baseline: `main@2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`
Production baseline: Render deploy `dep-d9u392nlk1mc73fg1hk0` — `live` — commit `2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`

| Stage | Authority | Implementation / Evidence | Mutation boundary | Exit gate |
|---|---|---|---|---|
| SA0 Governance | ESS-0021 + ADR-0065 | PR #214 | repository governance | **COMPLETE** |
| SA1 Mandate Validator | ESS-0021 + ADR-0065 + ADR-0058 | PR #215; trust-root protection extended by PR #226 | repository policy/control plane | **COMPLETE / VERIFIED PASS** |
| SA2 Chat Profile | ESS-0021 + SA1 | PR #216 | envelope alone cannot mutate | **COMPLETE / VERIFIED PASS** |
| SA3A Audit Adapter | ADR-0059 + ADR-0065 | PR #218; writer correction PR #222 | no permit before durable M5 audit | **COMPLETE / VERIFIED PASS** |
| SA3B Execution Host | ADR-0067 | PR #220 + #222; Issues #221/#223/#224; branch cleanup | exact BRANCH host proof | **COMPLETE / VERIFIED PASS** |
| SA4 Bounded Pilot | ADR-0068 + REM-SA4-PILOT-001 | PR #226; Issue #228 / run `31579519025`; PR #229; closure evidence | deterministic exact doc path; BRANCH/COMMIT/Draft PR | **COMPLETE / VERIFIED PASS** |
| SA5 External Mutation | future ADR + strong Owner assurance | not implemented | production mutation prohibited | **BLOCKED** |

## Canonical evidence chain

Every Systemadmin repository side effect must be reconstructable as:

```text
Owner-approved REM
→ trusted Owner request
→ trusted main workflow / execution host
→ workload identity
→ exact capability/path/head
→ durable authorization auditReference
→ exact side effect
→ durable terminal outcomeReference
```

Direct model/connector writes outside the bounded host remain outside SA3B/SA4 autonomous execution evidence.

## SA3B production proof

### Audit outage negative path

Issue #221 / run `31570833507`:

`AUDIT PERSISTENCE FAILURE → NO PERMIT → NO BRANCH`

### Positive permit-before-side-effect path

Issue #223 / run `31574111075` on base `91963f59b74c8c3c3c0b33c6a23237a01ac0128e`:

| Correlation | Value |
|---|---|
| capability | `BRANCH` |
| branch | `agent/sa3b-host-probe-20260812b` |
| authorization | `supabase:agent_audit_events:194f1198-492c-4d4f-b1e4-0c13a5d99d20` |
| outcome | `supabase:agent_audit_events:5ab9eefe-f472-4396-a7e7-2a3ceb029e34` |
| outcome result | `SUCCESS` |

### Stale-base negative path

Issue #224 / run `31574221718`:

`STALE BASE → DENY BEFORE OIDC/BROKER → NO BRANCH`

### Lifecycle closure

Final branch lookup confirmed `agent/sa3b-host-probe-20260812b` is absent.

**SA3B: COMPLETE / VERIFIED PASS.**

## SA4 authority trace

Mandate:

`.ai/mandates/REM-SA4-PILOT-001.json`

Bound scope:

| Field | Bound value |
|---|---|
| Owner | `SvenKulessa` |
| agent | `capital-ai-systemadmin-roadmap-executor` |
| repository/base | `SvenKulessa/Finance` / `main` |
| roadmap item | `SA4-FIRST-AUTONOMOUS-WORK-PACKAGE` |
| capabilities | `BRANCH`, `COMMIT`, `PR` |
| exact path | `docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md` |
| mutation class | `REPOSITORY` |
| max risk | `MEDIUM` |
| merge | prohibited / Human-only |
| production mutation | prohibited |

## SA4 real execution trace

Owner Issue #228 → Workflow run `31579519025` → base `f7dfcda36905d9a55d74f57f2140224928960379`.

### Permit-before-side-effect matrix

| Operation | Authorization | Side effect | Outcome |
|---|---|---|---|
| BRANCH | `supabase:agent_audit_events:1b4b04cb-a86b-4612-9ef5-308e95a18c95` | create `agent/sa4-pilot-proof-20260812b` | `supabase:agent_audit_events:e99b9af7-74cc-4693-966f-c9b85102035d` |
| COMMIT | `supabase:agent_audit_events:3c5916a1-d8c1-4ba1-9de1-d839fcc1bc85` | exact deterministic evidence commit `02f012e71106d5ffd9a4baa3e6f3eba7160eb55d` | `supabase:agent_audit_events:bc6ecf0b-86db-4b8c-ae95-2c963a0776f5` |
| PR | `supabase:agent_audit_events:41874d2e-a7b7-48c9-8287-71d75bea7d05` | create Draft PR #229 | `supabase:agent_audit_events:d4722de8-3242-4822-ab7d-f353880312ac` |

The issue could not provide arbitrary commands, file payloads, arbitrary paths or PR metadata. Trusted host code generated the deterministic evidence file and verified its committed bytes.

## SA4 Human boundary / closure

- PR #229 was not autonomously merged.
- Human/Owner performed final review and merge.
- Merge SHA: `2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`.
- Main CI #966 / run `31580214920`: `success`.
- Pilot branch: absent after merge.
- Render deploy `dep-d9u392nlk1mc73fg1hk0`: `live` on the same merge SHA.

Closure Evidence:

`docs/evidence/sa4/SA4_VERIFIED_PASS_CLOSURE_2026-08-12.md`

**SA4: COMPLETE / VERIFIED PASS.**

## Proven vs. unproven capability boundary

### Proven by real host evidence

- current-main binding;
- stage-specific OIDC/workflow binding;
- REM/path/branch/head constraints;
- separate durable authorization before BRANCH/COMMIT/PR;
- separate durable terminal outcome after BRANCH/COMMIT/PR;
- deterministic exact-file commit;
- Draft PR creation;
- Human-only final review/merge;
- branch cleanup.

### Not proven by the SA4 pilot

- arbitrary application-code generation;
- arbitrary patch ingestion;
- general-purpose file allowlists beyond the pilot contract;
- autonomous `CI_REQUEST` through the SA4 host;
- deployment or external production mutation.

A future DEVELOPMENT code work package therefore requires a dedicated REM and technically bounded code/patch execution contract before it may inherit the SA4 `VERIFIED PASS` label.

## Current DEVELOPMENT handoff implication

M5A is the next DEVELOPMENT phase, but `REM-SA4-PILOT-001` cannot authorize M5A code. A Systemadmin-based M5A implementation requires a new Owner-approved mandate and exact execution-path coverage for the intended application/test files.

External Supabase factor enrollment remains a separate Human/Owner production mutation gate.

## Human boundary

- `MERGE` is not an agent capability.
- Owner/Admin IAM elevation, Owner MFA/break-glass, secret disclosure, destructive production data, live money/entitlement, production-resource deletion, DNS/TLS/domain ownership and security-control weakening remain reserved.
- A valid REM cannot authorize modification of its own authority/trust root.

## Branch lifecycle

`current main → fresh scoped branch → audited bounded actions → PR → Human review/CI → Human merge → branch delete`

Merged/superseded branches are never reused.