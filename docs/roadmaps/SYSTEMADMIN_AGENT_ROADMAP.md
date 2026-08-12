# CAPITAL-AI Systemadmin Agent Roadmap

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Current repository baseline: `main@5bd5f4d78b87a89258126d0453eaf5e4bc6b6125` (PR #232 merge)
Execution baseline rule: every autonomous work item re-resolves current `main`; no roadmap SHA is standing mutation authority.
Authority: ESS-0021, ADR-0065, ADR-0058, ADR-0059, ADR-0066, ADR-0067, ADR-0068, ADR-0069

## Goal

The Systemadmin Roadmap Executor may autonomously implement Owner-approved repository Roadmap blocks only through bounded REM authority, least privilege, durable append-only audit evidence, explicit Pull-Request checkpoints, Human final review and Human-only merge.

Target operating model:

```text
OWNER-APPROVED REM FOR ONE ROADMAP BLOCK
→ execution unit 1: fresh branch → implement/test → PR → STOP
→ Human review/CI/merge → branch delete
→ execution unit 2: fresh branch from new main → implement/test → PR → STOP
→ Human review/CI/merge → branch delete
→ ...
→ optional separate external-mutation gate
```

The Roadmap and Traceability remain the only execution-state source of truth. Block contracts describe scope; they do not create status or authority.

## Stage status

| Stage | Status | Core evidence / exit requirement |
|---|---|---|
| SA0 Governance | COMPLETE | PR #214 |
| SA1 REM Validator | COMPLETE / VERIFIED PASS | PR #215 |
| SA2 Chat Execution Profile | COMPLETE / VERIFIED PASS | PR #216 |
| SA3A Append-only Audit Adapter | COMPLETE / VERIFIED PASS | PR #218 |
| SA3B Execution Host | **COMPLETE / VERIFIED PASS** | PR #220/#222; Issues #221/#223/#224; lifecycle cleanup |
| SA4 First bounded autonomous work package | **COMPLETE / VERIFIED PASS** | PR #226; Issue #228 / run `31579519025`; PR #229; BRANCH/COMMIT/PR audit pairs |
| SA4B Bounded Repository Code / Roadmap Block Executor | **PLANNED — NEXT SYSTEMADMIN ENABLEMENT GATE** | ADR-0069 + ESS-0021 v1.1 + Roadmap Block Contract; real 2-unit code/test pilot required |
| SA5 Bounded external mutation design | BLOCKED | M10 VERIFIED PASS + dedicated future ADR/Control-Plane proof |

M10 passkey-only PR authorization remains a later DevelopmentChain runtime cutover. Current Human/Owner final review and Human-only merge remain authoritative until that cutover.

## SA0 — Governance

**COMPLETE — PR #214 MERGED**

REM schema, ESS/ADR authority and branch lifecycle are on `main`.

## SA1 — REM validator / Control Plane

**COMPLETE / VERIFIED PASS — PR #215 MERGED**

Current repository capability ceiling:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

`MERGE`, generic deployment/production mutation, CRITICAL reserved execution and Owner-only mutation classes remain denied.

The Systemadmin self-authority ring protects the REM/agent-IAM/workflow/broker/audit trust root. A REM must not authorize changes to those protected paths.

Important SA4B gap: REM v1 has block-wide/global `allowedPaths`. A multi-PR code block requires technically enforced **per-Execution-Unit** path/capability/risk scope before general code autonomy is enabled.

## SA2 — Chat execution profile

**COMPLETE / VERIFIED PASS — PR #216 MERGED**

SA2 produces policy-bound envelopes. A mutating LIVE envelope alone is not authority; real mutation requires an audit-bound execution permit from the trusted host.

Required sequence remains:

- current main read-only preflight;
- fresh `agent/*` branch;
- targeted validation before COMMIT;
- completed unit + current head before PR;
- no silent scope expansion after final Human review begins;
- no autonomous merge;
- no implied production mutation.

## SA3A — Append-only audit adapter

**COMPLETE / VERIFIED PASS — PR #218 MERGED**

Canonical control:

`SA1/SA2 ALLOW → durable M5 authorization event → auditReference → audit-bound permit → exact action → durable terminal outcome event`

Every later SA4B mutation capability inherits this permit-before-side-effect invariant.

## SA3B — Execution-host binding

**COMPLETE / VERIFIED PASS**

Merged implementation/evidence:

- PR #220 host binding;
- PR #222 M5 writer/schema correction;
- Issue #221 / run `31570833507`: audit persistence failure → no permit → no branch;
- Issue #223 / run `31574111075`: OIDC → durable authorization → exact BRANCH side effect → durable SUCCESS outcome;
- Issue #224 / run `31574221718`: stale base → DENY before OIDC/broker → no branch;
- successful probe branch deleted before SA4.

This proves the trusted-host and fail-closed audit boundary, not an arbitrary code executor.

## SA4 — First bounded autonomous work package

**COMPLETE / VERIFIED PASS — PR #229 MERGED**

Authority: ADR-0068 and `.ai/mandates/REM-SA4-PILOT-001.json`.

The pilot was intentionally documentation-only and one-time. It proved:

`Owner-approved REM → Owner Issue → trusted main workflow → OIDC → BRANCH permit/outcome → COMMIT permit/outcome → Draft-PR permit/outcome → Human review → final CI → Human merge → branch delete`

Exact autonomous result:

- branch `agent/sa4-pilot-proof-20260812b`;
- deterministic path `docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md`;
- commit `02f012e71106d5ffd9a4baa3e6f3eba7160eb55d`;
- Draft PR #229;
- six correlated M5 authorization/outcome events;
- Human merge `2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`;
- branch deletion verified.

Closure Evidence: `docs/evidence/sa4/SA4_VERIFIED_PASS_CLOSURE_2026-08-12.md`.

SA4 proves the control architecture for an exact deterministic path. It **does not** prove general code/test/config mutation.

## SA4B — Bounded Repository Code / Roadmap Block Executor

**PLANNED — NEXT SYSTEMADMIN ENABLEMENT GATE**

Authority:

- ADR-0069;
- ESS-0021 v1.1;
- `docs/contracts/DEVELOPMENT_CHAIN_ROADMAP_BLOCK_CONTRACT.md`;
- `.ai/contracts/development-chain-roadmap-block.schema.json`;
- `docs/runbooks/SYSTEMADMIN_AUTONOMOUS_ROADMAP_BLOCK_EXECUTION.md`.

### SA4B purpose

Enable one Owner-approved REM to cover a coherent DEVELOPMENT Roadmap block made of multiple explicit Execution Units while preserving:

`one Execution Unit = one fresh branch = one PR checkpoint = one Human merge boundary`

The Systemadmin may autonomously iterate **inside** each unit until the review-ready PR, but it must stop at that PR checkpoint.

After Human merge and branch deletion it may resume the next named unit under the same REM without another PR-creation prompt, provided the REM, Roadmap gate, per-unit scope and audit preconditions remain valid.

### SA4B technical work packages / PR checkpoints

#### SA4B-EU1 — Per-unit contract and REM binding

Goal: make block decomposition machine-enforceable rather than descriptive only.

Required implementation:

- validate `.ai/contracts/development-chain-roadmap-block.schema.json`;
- bind one contract digest to the Owner-approved REM/approval evidence;
- enforce `blockId + unitId + roadmapItem` correlation;
- enforce per-unit allowed paths/capabilities/risk/mutation classes;
- extend self-authority protection to the new contract/validator/host trust root;
- fail closed on unknown fields, stale Roadmap baseline or unit mismatch;
- tests for wrong unit/path/capability/risk/digest/dependency.

**PR checkpoint SA4B-PR1:** review-ready PR → autonomous STOP → Human review/CI/merge → branch delete.

#### SA4B-EU2 — Bounded code/test execution host

Depends on SA4B-EU1 merged.

Required implementation:

- trusted-main execution host for repository code/test/config changes;
- no arbitrary shell/command execution from Issue/Chat/Roadmap payloads;
- exact file/path scope validation before writes;
- bounded patch/write mechanism;
- targeted test allowlist / deterministic test plan;
- BRANCH/COMMIT/PR/CI_REQUEST each require separate audit-bound permit;
- durable terminal outcome after each capability;
- bounded rollback only for exact work branch/PR generated by the run.

**PR checkpoint SA4B-PR2:** review-ready PR → autonomous STOP → Human review/CI/merge → branch delete.

#### SA4B-EU3 — Two-unit live repository pilot

Depends on SA4B-EU2 merged.

Use a non-production, non-self-authority repository scope with real code/test changes. The pilot must prove two units under one REM:

```text
EU-A branch → code/test → PR-A → Human merge → branch delete
→ re-resolve new main
→ EU-B branch → code/test → PR-B → Human merge → branch delete
```

Required positive evidence:

- per-unit scope enforced;
- current-main resume gate after PR-A;
- separate permit/outcome pairs for both units;
- CI_REQUEST bounded to each exact head;
- no branch reuse;
- no production side effect.

Required negative evidence:

- attempt EU-B before PR-A merge → STOP;
- missing PR-A branch deletion → STOP;
- cross-unit path access → DENY;
- stale main → DENY;
- self-authority path → DENY;
- audit persistence failure → DENY before side effect;
- invalid/revoked/expired REM → DENY.

**PR checkpoint SA4B-PR3:** pilot closure/evidence PR → autonomous STOP → Human review/CI/merge → branch delete.

### SA4B VERIFIED PASS exit gate

SA4B is complete only when:

1. per-unit contract enforcement merged and tested;
2. bounded code/test executor merged and tested;
3. two real separated repository units executed under one Owner-approved REM;
4. each unit stopped at its PR checkpoint;
5. each PR Human reviewed and Human merged;
6. both branches deleted;
7. resume from new main between units proven;
8. positive and negative M5 audit evidence complete;
9. no external production mutation occurred;
10. Roadmap and Traceability synchronized.

Only after this gate may the Systemadmin be described as capable of autonomous **general bounded repository Roadmap-block execution**.

## Autonomous block operating rules after SA4B

For any later DevelopmentChain block:

1. canonical Roadmap defines the block and its Execution Units;
2. Owner approves one bounded REM containing all intended unit IDs;
3. Roadmap Block Contract supplies per-unit technical boundaries but no status;
4. Systemadmin selects only the next unblocked unit;
5. fresh branch from current main;
6. implement/test/commit autonomously inside unit scope;
7. create/update review-ready PR;
8. `STOP_PR_CHECKPOINT_REACHED`;
9. Human review/CI/merge;
10. branch deletion verified;
11. re-read current main/Roadmap/REM;
12. continue next unit only if resume gate passes.

External Production Mutation always uses a separate DevelopmentChain mutation approval/handoff path.

## SA5 — Bounded external mutation design

**BLOCKED BY M10 VERIFIED PASS**

SA4B does not change this boundary. Repository code autonomy does not imply Supabase/Render/Stripe/DNS/IAM production write authority.

A future SA5 design requires:

- exact-target reversible mutation contract;
- strong Owner assurance per M10 or later accepted equivalent;
- separate production mutation capability;
- pre/post verification and rollback;
- permit-before-side-effect and durable outcome;
- explicit exclusion of non-delegable Owner actions.

## Branch lifecycle

For every Execution Unit:

`current main → fresh scoped branch → audited actions → PR → Human review/CI → Human merge → branch delete`

Merged/superseded branches are never reused. The next unit starts only after deletion evidence and from then-current `main`.

## Current next action

**SA4B is the next Systemadmin enablement gate.**

DevelopmentChain M5A remains the next product/security implementation phase. It can proceed through the normal Human-authorized Development path now; if it is to be executed as a larger autonomous Systemadmin code block, SA4B must first reach `VERIFIED PASS` and M5A must receive a dedicated Owner-approved REM + per-unit Roadmap Block Contract.

No completion of SA4/SA4B authorizes the later native Owner MFA production mutation itself; that remains behind the separate M5A Owner mutation approval gate.
