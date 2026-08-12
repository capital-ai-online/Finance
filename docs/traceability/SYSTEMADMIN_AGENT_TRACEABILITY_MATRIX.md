# Systemadmin Agent Traceability Matrix

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Canonical stage status: `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md`
Execution baseline rule: every mutating unit resolves current `main`; historical SHAs below are evidence, not authority.

| Stage | Authority | Implementation / Evidence | Mutation boundary | Exit gate |
|---|---|---|---|---|
| SA0 Governance | ESS-0021 + ADR-0065 | PR #214 | repository governance | COMPLETE |
| SA1 Mandate Validator | ESS-0021 + ADR-0065 + ADR-0058 | PR #215; expanded trust root in SA4 bootstrap | repository only; production denied | COMPLETE / VERIFIED PASS |
| SA2 Chat Profile | ESS-0021 + SA1 | PR #216 | mutating LIVE envelope alone denied | COMPLETE / VERIFIED PASS |
| SA3A Audit Adapter | ADR-0059 + ADR-0065 | PR #218; M5 writer corrected by #222 | no permit before durable M5 audit | COMPLETE / VERIFIED PASS |
| SA3B Execution Host | ADR-0067 | PR #220 + #222; Issues #221/#223/#224; probe cleanup | BRANCH host proof / trusted OIDC path | COMPLETE / VERIFIED PASS |
| SA4 Bounded Docs Pilot | ADR-0068 + REM-SA4-PILOT-001 | PR #226; Issue #228 / run `31579519025`; PR #229; six M5 events | exact docs path; BRANCH/COMMIT/Draft PR | COMPLETE / VERIFIED PASS |
| SA4B Repository Code / Roadmap Block Executor | ADR-0069 + ESS-0021 v1.1 | `docs/traceability/SA4B_AUTONOMOUS_ROADMAP_BLOCK_TRACEABILITY.md` | per-EU repository code/test/config only; no production mutation | **PLANNED / NOT YET ENABLED** |
| SA5 External Mutation | future ADR + M10 | not implemented | production mutation prohibited | BLOCKED BY M10 VERIFIED PASS |

## Canonical evidence chain

Every Systemadmin repository side effect must be reconstructable as:

`Owner-approved REM → Roadmap block/unit → trusted main host → workload identity → exact capability/path/head → durable authorization auditReference → exact side effect → durable terminal outcomeReference`

For SA4B and later repository blocks the correlation additionally includes `blockId + unitId`.

Direct ChatGPT→GitHub connector writes remain outside the autonomous Systemadmin mutation path and must not be represented as SA VERIFIED PASS runtime evidence.

## SA3B production proof

### Fail-closed audit outage

Issue #221 / run `31570833507`:

`AUDIT PERSISTENCE FAILURE → NO PERMIT → NO BRANCH`

### Positive permit-before-side-effect

Issue #223 / run `31574111075`:

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

The successful probe branch was deleted before SA4. This branch-lifecycle closure is part of the VERIFIED PASS evidence.

## SA4 authority and live pilot trace

Mandate: `.ai/mandates/REM-SA4-PILOT-001.json`.

Key boundaries:

- roadmap item `SA4-FIRST-AUTONOMOUS-WORK-PACKAGE`;
- capabilities `BRANCH`, `COMMIT`, `PR`;
- exact path `docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md`;
- mutation class `REPOSITORY`;
- max risk `MEDIUM`;
- max open SA4 PRs `1`;
- all reserved mutation classes including MERGE prohibited.

Runtime correlation:

| Correlation | Value |
|---|---|
| Owner trigger | Issue #228 |
| workflow run | `31579519025` |
| exact base | `f7dfcda36905d9a55d74f57f2140224928960379` |
| branch | `agent/sa4-pilot-proof-20260812b` |
| autonomous commit | `02f012e71106d5ffd9a4baa3e6f3eba7160eb55d` |
| autonomous Draft PR | #229 |
| Human merge | `2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd` |

Durable authorization/outcome pairs:

| Capability | Authorization | Outcome | Result |
|---|---|---|---|
| BRANCH | `supabase:agent_audit_events:1b4b04cb-a86b-4612-9ef5-308e95a18c95` | `supabase:agent_audit_events:e99b9af7-74cc-4693-966f-c9b85102035d` | SUCCESS |
| COMMIT | `supabase:agent_audit_events:3c5916a1-d8c1-4ba1-9de1-d839fcc1bc85` | `supabase:agent_audit_events:bc6ecf0b-86db-4b8c-ae95-2c963a0776f5` | SUCCESS |
| PR | `supabase:agent_audit_events:41874d2e-a7b7-48c9-8287-71d75bea7d05` | `supabase:agent_audit_events:d4722de8-3242-4822-ab7d-f353880312ac` | SUCCESS / PR #229 |

SA4 verified that a deterministic docs-only work package can use separate permits, Human final review/merge and branch deletion. It did **not** verify arbitrary code/test/config mutation.

## SA4B authority trace

Canonical planning artifacts:

- `docs/adr/ADR-0069-autonomous-roadmap-block-pr-checkpoint-execution.md`;
- `.ai/skills/ESS-0021-Systemadmin-Roadmap-Executor.md` v1.1;
- `docs/contracts/DEVELOPMENT_CHAIN_ROADMAP_BLOCK_CONTRACT.md`;
- `.ai/contracts/development-chain-roadmap-block.schema.json`;
- `docs/runbooks/SYSTEMADMIN_AUTONOMOUS_ROADMAP_BLOCK_EXECUTION.md`;
- `docs/traceability/SA4B_AUTONOMOUS_ROADMAP_BLOCK_TRACEABILITY.md`.

### SA4B planned PR checkpoints

| Unit | Goal | Autonomous boundary | Human checkpoint |
|---|---|---|---|
| SA4B-EU1 | per-unit contract + REM/digest binding + policy enforcement | repository governance/control-plane implementation only | SA4B-PR1 review/CI/merge + branch delete |
| SA4B-EU2 | bounded code/test executor + audit-bound BRANCH/COMMIT/PR/CI_REQUEST | no arbitrary untrusted commands; no production mutation | SA4B-PR2 review/CI/merge + branch delete |
| SA4B-EU3 | real two-unit repository pilot under one REM | two separate fresh branches and PR stops | SA4B-PR3 closure/evidence merge + branch delete |

### SA4B minimum negative evidence

- wrong contract digest → DENY;
- wrong block/unit → DENY;
- path allowed by REM but not current EU → DENY;
- self-authority path → DENY;
- missing capability/risk overflow → DENY;
- stale base → DENY;
- open PR overlap → STOP;
- audit failure → DENY before side effect;
- arbitrary command payload → no execution;
- next unit before previous merge → STOP;
- next unit while previous branch exists → STOP;
- revoked/expired REM → DENY;
- MERGE → DENY;
- production mutation → separate-approval STOP.

### SA4B live pilot exit evidence

SA4B may become `COMPLETE / VERIFIED PASS` only after two real code/test repository Execution Units under one Owner-approved REM prove:

`EU-A branch → commit/test → PR-A → Human merge → branch delete → new main → EU-B branch → commit/test → PR-B → Human merge → branch delete`

with correlated M5 permit/outcome evidence and no external production mutation.

## M5A handoff trace after SA4B

The DevelopmentChain Roadmap defines the first planned larger repository block:

`DC-M5A-NATIVE-MFA-AAL2-REPOSITORY`

with `M5A-EU1`, `M5A-EU2`, `M5A-EU3` and PR checkpoints `M5A-PR1..PR3`.

Systemadmin-autonomous M5A execution requires:

1. SA4B `VERIFIED PASS`;
2. dedicated Owner-approved M5A REM containing exactly the intended EU IDs;
3. validated Roadmap Block Contract bound to that REM;
4. exact current-main path allowlists for each EU;
5. per-EU positive/negative tests;
6. BRANCH/COMMIT/PR/CI_REQUEST audit evidence;
7. Human review/merge at each PR checkpoint;
8. branch deletion before next unit.

Native Owner MFA enrollment remains outside repository authority and uses the separate M5A production mutation approval path.

## Source-of-truth rule

This matrix maps requirements to evidence only. Stage status is authoritative in `SYSTEMADMIN_AGENT_ROADMAP.md`; Development phase status is authoritative in `DEVELOPMENT_CHAIN_ROADMAP.md`. Runtime contracts, Issues and PR bodies do not create an alternative status.
