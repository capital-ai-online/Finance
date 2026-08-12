# ESS-0021 — Systemadmin Roadmap Executor

Status: PROPOSED
Version: 1.1.0
Date: 2026-08-12
Owner: Platform Director / Repository Owner
Scope: CAPITAL-AI DevelopmentChain cross-cutting execution profile

## 1. Purpose

ESS-0021 defines a privileged, provider-neutral **Systemadmin Roadmap Executor** that can autonomously execute larger Owner-approved Roadmap work packages from analysis through review-ready Pull Request checkpoints.

The goal is higher execution throughput without converting the model into a trust root.

Core invariant:

`Owner approves one bounded Roadmap block → agent executes scoped repository units autonomously → each unit stops at its PR checkpoint → Human reviews/merges → next unit resumes from fresh main while the mandate remains valid`

## 2. Agent identity

Canonical logical agent id:

`capital-ai-systemadmin-roadmap-executor`

Provider/model metadata is non-authoritative. The profile may execute through ChatGPT, Claude or a future client only when the provider-neutral Control Plane can attribute the action to the same logical agent and Owner mandate.

## 3. Standing authorization contract

The Systemadmin profile operates only under an active **Roadmap Execution Mandate (REM)**.

A REM is a bounded, expiring Owner authorization tied to:

- Owner actor;
- subject agent;
- Finance repository;
- base branch;
- Roadmap/ESS/ADR work-package references;
- allowed paths/targets;
- explicit capabilities;
- maximum risk;
- permitted mutation classes;
- validity window;
- kill switch;
- tests/rollback/evidence.

A REM may cover multiple explicitly named Execution Unit IDs of one Roadmap block. The REM is standing PR-creation authority for those units only. It is not a wildcard administrator grant.

## 4. Capability profile

Default delegated capabilities under a valid REM:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

`DEPLOY_REQUEST` and `PRODUCTION_MUTATION` are not granted by default.

`MERGE` is permanently outside this profile and outside the Agent IAM capability vocabulary.

Capabilities do not inherit. Each capability must be explicitly present in the REM and pass policy evaluation for the current target.

## 5. Autonomous repository workflow

The Systemadmin profile may execute the following loop without a new Human prompt per technical action:

1. read current Roadmap/main/evidence;
2. select the next mandate-covered unblocked Execution Unit;
3. perform security and overlap preflight;
4. create a fresh branch from current main;
5. implement code/documentation/tests within the per-unit scope;
6. run targeted checks;
7. perform security self-check / negative-test review;
8. commit scoped changes;
9. iterate until unit exit criteria are met;
10. open/update the review-ready PR;
11. repair pre-review CI/governance defects within scope;
12. stop at Human/Owner final review and merge boundary.

### 5.1 Autonomous Roadmap Blocks

A larger Roadmap segment is represented as an **Autonomous Roadmap Block (ARB)** with ordered Execution Units.

Invariant:

`one Execution Unit = one fresh branch = one PR checkpoint`

The block contract is defined by `docs/contracts/DEVELOPMENT_CHAIN_ROADMAP_BLOCK_CONTRACT.md` and `.ai/contracts/development-chain-roadmap-block.schema.json`.

The block contract is non-authorizing and carries no independent phase status. Canonical state stays in `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` and the traceability matrices.

### 5.2 Per-unit least privilege

For a multi-PR Roadmap block, global REM path scope alone is insufficient. Before a general code-producing executor is enabled, the runtime must enforce per Execution Unit:

- allowed paths;
- capabilities;
- maximum risk;
- mutation class;
- required tests/evidence;
- branch/base/head binding;
- PR checkpoint;
- resume-after-merge conditions.

The effective scope is the intersection of REM scope, Execution Unit scope, Agent IAM and the Systemadmin self-authority deny list.

### 5.3 Resume after Human merge

A later Execution Unit may start under the same still-valid REM without another PR-creation prompt only if:

- previous PR was Human merged;
- previous branch was deleted;
- current `main` contains the previous merge;
- REM remains valid and kill switch inactive;
- next unit is explicitly included in REM + block contract;
- Roadmap gate remains unblocked;
- no open-PR overlap exists;
- audit persistence is available.

Otherwise the agent stops fail-closed.

## 6. External mutation model

Repository mutation is the initial autonomous mutation domain.

External production mutation requires a separately authorized and technically enforceable REM-bound Control-Plane capability. A repository Roadmap block or PR checkpoint never implicitly authorizes Supabase, Render, Stripe or other production writes.

A future REM-bound production mutation can only be valid when:

- exact target and mutation type are predeclared;
- Roadmap/ADR/ESS require it;
- preconditions and rollback are deterministic;
- the mutation is bounded and reversible;
- postconditions are verifiable;
- audit correlation is complete;
- the action is not in the non-delegable Owner list;
- separate Owner mutation approval requirements of the DevelopmentChain are satisfied.

## 7. Non-delegable actions

The Systemadmin profile MUST NOT autonomously:

- merge Pull Requests;
- weaken repository protections or Human review controls;
- elevate Owner/admin IAM;
- reset/remove Owner MFA or invoke break-glass;
- expose secrets or reusable credentials;
- execute destructive production data operations;
- mutate live billing in ways that can change customer money/entitlements;
- delete production resources;
- change DNS/TLS/domain ownership;
- disable security/audit/RLS/consent controls;
- expand or extend its own mandate.

## 8. Security preflight

Each Roadmap Execution Unit begins read-only and must verify:

- current main SHA;
- current Roadmap phase/gate;
- mandate validity;
- block contract validity and binding;
- unit dependencies / previous merge and branch deletion;
- open PR/file overlap;
- relevant architecture/ESS/ADR/evidence;
- external current-state evidence where needed;
- PR check class D/C/R/M;
- per-unit capability/path/risk/mutation-class scope;
- threat model requirement;
- negative tests;
- rollback path;
- CI cost/scope;
- no reserved Owner-only action is required.

Security-critical ambiguity fails closed.

## 9. Audit contract

Every mutating action is correlated to:

`mandateId + blockId + unitId + roadmapItem + humanActor + agent + client + session + request + capability + risk + target + decision + result`

Where repository state exists, also record branch, commit and PR identifiers.

The M5 append-only audit path is the preferred durable evidence sink. Redaction/omission requirements from ADR-0059 remain mandatory.

Every mutating capability follows permit-before-side-effect and durable terminal outcome. A BRANCH permit cannot authorize COMMIT, PR or CI_REQUEST.

## 10. Kill switch

The Owner or Control Plane may revoke the active REM at any time. Kill-switch activation blocks all mutating capabilities immediately.

Automatic STOP conditions include expiry, scope drift, requested self-elevation, reserved action, repeated failed verification, unresolvable concurrent change, missing audit identity/persistence, stale base, unclosed prior PR checkpoint or security-control regression.

## 11. PR governance interaction

ADR-0039 remains the default for normal agents. ADR-0065 introduces the only Systemadmin exception: a valid Owner-approved REM counts as standing PR-creation authorization for PRs fully inside the mandate.

The Systemadmin must consume the **current canonical** Human/Owner PR policy rather than hard-code a historical checkbox/event mechanism. The stable boundary is:

`Human inspects current-head diff → required Human approval evidence → required technical CI/evidence → separate Human merge decision`

Successful CI never authorizes merge.

## 12. Branch lifecycle

Every Execution Unit uses a fresh branch from current main. After successful merge into `Finance`, the branch MUST be deleted. Closed/superseded branches are also deleted after Evidence retention. Merged branches are never reused.

A later unit cannot start until the previous unit's branch deletion is verified.

## 13. SA4B enablement requirement

SA4 proved the deterministic docs-only path. General code/test/config execution across multiple PR checkpoints requires **SA4B — Bounded Repository Code / Roadmap Block Executor**.

SA4B must implement and verify at minimum:

- Roadmap Block Contract schema validation;
- REM↔block↔unit binding;
- per-unit path/capability/risk/mutation-class enforcement;
- bounded code/patch execution without arbitrary commands from untrusted input;
- self-authority/trust-root protection;
- targeted positive/negative tests;
- BRANCH/COMMIT/PR/CI_REQUEST audit-bound permits/outcomes;
- at least two real repository Execution Units separated by Human merge and branch deletion;
- successful resume from the new `main` between units.

Until SA4B is `VERIFIED PASS`, SA4 remains proof of the control architecture only and not general code-write authority.

## 14. Verification requirements before enablement

Technical enablement requires at minimum negative tests proving:

- expired mandate → DENY;
- wrong agent → DENY;
- wrong repository/target/path → DENY;
- wrong Execution Unit / unit-path mismatch → DENY;
- missing dependency merge/branch deletion → STOP;
- missing capability → DENY;
- maximum-risk violation → DENY;
- reserved Owner action → DENY;
- self-extension/self-approval/self-authority path → DENY;
- kill switch active → DENY;
- concurrent/scope conflict without approved resolution → STOP;
- stale base → DENY;
- audit persistence failure → DENY before side effect;
- valid mandate + valid unit + valid scoped repository action → ALLOW.

## 15. Related authorities

- ESS-0019 Universal AI Agent Control Plane
- ESS-0018 Agentic Supabase Tool Governance
- ADR-0058 Provider-neutral Agent IAM
- ADR-0059 Agent Audit / OTel Correlation
- ADR-0065 Systemadmin Roadmap Execution Mandate
- ADR-0070 Autonomous Roadmap Block Execution with PR Checkpoints
- `docs/governance/SYSTEMADMIN_AGENT_ROADMAP_EXECUTION_POLICY.md`
- `docs/contracts/DEVELOPMENT_CHAIN_ROADMAP_BLOCK_CONTRACT.md`
- `docs/runbooks/SYSTEMADMIN_AUTONOMOUS_ROADMAP_BLOCK_EXECUTION.md`
- `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md`
- `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`
