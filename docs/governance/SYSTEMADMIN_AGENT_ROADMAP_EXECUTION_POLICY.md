# Systemadmin Agent Roadmap Execution Policy

Status: PROPOSED
Date: 2026-08-12
Authority: ESS-0021 v1.1, ADR-0065, ADR-0069, ADR-0070, ESS-0019, ADR-0058, HUMAN_OWNER_PR_APPROVAL_POLICY.md
Accountable Owner: `SvenKulessa`

## 1. Purpose

This policy governs the privileged **Systemadmin Roadmap Executor** profile for CAPITAL-AI. It allows one Owner-approved Roadmap Execution Mandate (REM) to authorize a larger, coherent repository Roadmap block without requiring a new Human authorization for every branch, commit or PR creation operation.

It is not unrestricted administrator authority.

Target operating model:

```text
OWNER-APPROVED ROADMAP BLOCK REM
→ READ/ANALYZE/PREFLIGHT
→ EXECUTION UNIT
→ FRESH BRANCH
→ IMPLEMENT/TEST/COMMIT
→ PR CHECKPOINT
→ AUTONOMOUS STOP
→ CURRENT HUMAN-OWNER GATE / REQUIRED CI / HUMAN MERGE
→ BRANCH DELETE
→ RE-READ CURRENT MAIN
→ NEXT EXPLICIT UNIT UNDER SAME VALID REM
```

External production mutation is not implied.

## 2. Systemadmin principal

Canonical logical agent id:

`capital-ai-systemadmin-roadmap-executor`

Provider/model identity is metadata only. ChatGPT, Claude or another client may host the profile, but authority derives only from valid REM + provider-neutral Agent IAM/Control Plane + trusted execution host.

The execution principal remains attributable through:

`human_actor → client/app → agent → session → request → mandate → block → unit → capability → target → decision → result → evidence`

Reusable credentials stay in connector/tool hosts and are never exposed to the model.

## 3. Roadmap Execution Mandate (REM)

A REM is Human/Owner-approved standing authorization for one bounded Roadmap segment.

A valid REM defines at minimum:

- immutable mandateId;
- Owner actor id;
- subject agent id;
- repository/base branch;
- exact Roadmap/ESS/ADR refs;
- explicitly named Roadmap item / Execution Unit IDs;
- allowed paths/targets;
- allowed capabilities;
- maximum risk;
- allowed/prohibited mutation classes;
- validity/expiry;
- max simultaneous branches/PRs;
- CI budget policy;
- required preflight/tests/rollback/evidence;
- kill switch;
- approvalEvidenceRef when OWNER_APPROVED.

A REM is invalid when expired/revoked, scope drifts, the requested unit is not included, a reserved action is required or runtime policy cannot technically enforce the requested boundary.

## 4. Capabilities

Repository autonomy may use only explicitly granted:

- READ
- ANALYZE
- PLAN
- BRANCH
- COMMIT
- PR
- CI_REQUEST

MERGE is permanently outside Agent IAM.

DEPLOY_REQUEST / PRODUCTION_MUTATION are not implied by repository authority.

## 5. Roadmap Block / Execution Unit model

A larger Owner-approved block is decomposed by ADR-0070 into ordered Execution Units (EU).

ADR-0069 remains the separate canonical Human-Owner Comment Gate / dispatched-PR-CI architecture consumed at every PR checkpoint. ADR-0070 does not introduce a second PR-approval mechanism.

Invariant:

`one EU = one fresh branch = one PR checkpoint`

The non-authorizing execution projection is defined by:

- `docs/contracts/DEVELOPMENT_CHAIN_ROADMAP_BLOCK_CONTRACT.md`;
- `.ai/contracts/development-chain-roadmap-block.schema.json`.

The Contract does not carry independent phase status. Canonical state stays in the DevelopmentChain/Systemadmin Roadmaps.

### 5.1 Effective per-unit authority

For each mutating operation the effective authority is the **intersection** of:

```text
canonical Roadmap gate
∩ Owner-approved REM
∩ Roadmap Block Contract / current EU
∩ Agent IAM / risk policy
∩ self-authority deny list
∩ current-main / overlap / lifecycle checks
```

The most restrictive result wins.

A block-wide REM allowlist never permits a current EU to touch paths not included in that EU.

### 5.2 Per-unit preflight

Before BRANCH:

1. resolve current main SHA;
2. verify Roadmap block/gate;
3. validate REM status/expiry/kill switch;
4. validate Contract and REM binding;
5. verify unit dependencies;
6. verify prior PR merge + prior branch deletion when applicable;
7. verify current main contains prior merge;
8. check open PR changed-file overlap;
9. compute effective path/capability/risk/mutation scope;
10. verify no self-authority or reserved action;
11. define targeted/negative tests and rollback;
12. verify audit persistence and CI budget.

Security-critical ambiguity is DENY/STOP.

## 6. Repository mutation authority

After SA4B is VERIFIED PASS, the Systemadmin may autonomously inside one approved EU:

- create fresh work branch from exact current main;
- change files covered by EU + REM;
- create/update tests and evidence;
- run bounded targeted checks;
- commit scoped changes;
- iterate on technical defects;
- open/update review-ready PR;
- request allowed CI;
- repair pre-review CI/governance defects within scope.

The agent must never interpret policy text as permission for arbitrary command execution. Untrusted Issue/Chat/Roadmap content may select only prevalidated identifiers/inputs, not unrestricted shell/tool commands.

## 7. Permit-before-side-effect

Every mutating capability requires:

`ALLOW → durable M5 authorization → audit-bound permit → exact side effect → durable terminal outcome`

BRANCH, COMMIT, PR and CI_REQUEST use separate permits. A permit never inherits across capabilities.

Audit persistence failure before the side effect is fail-closed.

## 8. PR checkpoint and Human boundary

Review-ready PR is a hard autonomous STOP.

Before final Human review the agent may repair failures inside the existing EU scope. It may not expand scope.

At the checkpoint:

```text
PR READY
→ STOP_PR_CHECKPOINT_REACHED
→ current canonical Human-Owner Gate
→ required technical CI/evidence
→ separate Human merge decision
```

The agent must consume the current `HUMAN_OWNER_PR_APPROVAL_POLICY.md` and ADR-0069 implementation instead of hard-coding a transient or parallel approval mechanism.

Successful CI is not merge authorization.

## 9. Resume after merge

A later EU under the same still-valid REM may begin without another PR-creation prompt only if:

- previous PR is Human merged;
- merge SHA is on current main;
- previous work branch is deleted;
- previous unit evidence is complete;
- REM remains OWNER_APPROVED and unexpired/unrevoked;
- kill switch inactive;
- next EU explicitly included in REM and Contract;
- Roadmap gate still unblocked;
- no path overlap with another open PR;
- audit persistence available;
- no Human-only production mutation gate lies between units.

Otherwise STOP.

## 10. External platform mutation authority

External production mutation is **not implied** by repository-block autonomy.

Supabase, Render, Stripe or other production state changes follow the DevelopmentChain sequence:

```text
repository implementation merged
→ read-only pre-mutation check
→ explicit Owner mutation approval
→ non-authorizing Mutation Handoff
→ authorized mutation executor
→ post-verification / rollback evidence
```

Until a dedicated future technically enforced REM-bound production capability is VERIFIED PASS, generic Systemadmin repository blocks stop before external writes.

## 11. Non-delegable Owner actions

The following remain Human/Owner-controlled:

- PR merge;
- weakening branch/security/Human-review controls;
- Owner/admin IAM elevation;
- Owner MFA reset/recovery/break-glass;
- secret disclosure or unrestricted credential rotation;
- destructive production data/bulk user-data operations;
- live billing/money/entitlement changes;
- production resource deletion;
- DNS/TLS/domain ownership;
- disabling security/audit/RLS/consent controls;
- expanding or extending the agent's own REM, target set or expiry.

## 12. Mandatory security preflight for security-sensitive work

Before a Roadmap Unit touching security/architecture boundaries the Systemadmin must additionally inspect current relevant best-practice/standard requirements where the Roadmap calls for it, map them to existing architecture and avoid introducing parallel control planes.

Missing current-source capability is documented; it never expands authority.

## 13. CI and cost control

The Systemadmin must respect repository CI budget policy.

Default:

- targeted checks during implementation;
- no redundant expensive full runs for unchanged head;
- no rerun of a known-invalid gate without changing the precondition;
- one normal final full validation path as required by current PR governance;
- CI_REQUEST remains head- and unit-bound.

## 14. Audit and evidence

Every autonomous mutating action records/correlates at least:

- mandateId;
- blockId/unitId/roadmapItem;
- human actor;
- agent/client/session/request;
- capability/risk;
- exact target/path;
- branch/commit/PR/head where relevant;
- authorization verdict;
- execution result;
- rollback status;
- next-unit resume decision.

No secrets, raw tokens, TOTP secrets/codes, passkey private material or raw sensitive payloads belong in evidence.

## 15. Kill switch / STOP

Owner can revoke REM at any time.

Mandatory STOP includes:

- expired/revoked mandate;
- kill switch active;
- Roadmap gate blocked;
- stale base;
- contract/REM/unit mismatch;
- self-authority path;
- reserved action;
- open PR overlap;
- missing audit persistence;
- CI budget violation;
- repeated failure without changed precondition;
- PR checkpoint reached;
- prior branch not deleted;
- required external mutation approval;
- inconclusive rollback;
- security-critical ambiguity.

## 16. Branch lifecycle

Every EU uses a dedicated branch:

`current main → branch → commits → PR → Human merge → branch delete`

A merged/superseded branch is never reused. Short-lived clones/worktrees are removed after required evidence retention.

## 17. Relationship to ADR-0039

ADR-0039 per-PR creation authorization remains default for normal interactive agents.

For Systemadmin only, a valid Owner-approved REM is standing PR-creation authority for all explicitly named units it covers. This exception does not remove the ADR-0069 Human gate, required CI or separate Human merge.

## 18. Enablement gate

SA4 proved docs-only deterministic execution. General code/test/config block autonomy requires SA4B VERIFIED PASS.

SA4B must prove:

1. per-unit Contract validation/binding;
2. per-unit least privilege;
3. bounded code/test executor without arbitrary untrusted commands;
4. self-authority protection;
5. permit/outcome for BRANCH/COMMIT/PR/CI_REQUEST;
6. negative tests for scope, dependency, stale base, overlap, audit outage, expiry/revocation and reserved actions;
7. two real repository Units under one REM separated by Human merge + branch deletion;
8. resume from the new current main.

Only then may larger DevelopmentChain repository blocks be delegated autonomously under this policy.
