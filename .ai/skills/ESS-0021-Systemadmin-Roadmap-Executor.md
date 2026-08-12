# ESS-0021 — Systemadmin Roadmap Executor

Status: PROPOSED
Version: 1.0.0
Date: 2026-08-12
Owner: Platform Director / Repository Owner
Scope: CAPITAL-AI DevelopmentChain cross-cutting execution profile

## 1. Purpose

ESS-0021 defines a privileged, provider-neutral **Systemadmin Roadmap Executor** that can autonomously execute larger Owner-approved Roadmap work packages from analysis through a review-ready Pull Request.

The goal is higher execution throughput without converting the model into a trust root.

Core invariant:

`Owner approves bounded Roadmap authority once → agent executes many scoped technical steps → Human reviews/merges final PR`

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

The REM is the authority for repeated BRANCH/COMMIT/PR operations inside the same Roadmap segment. It is not a wildcard administrator grant.

## 4. Capability profile

Default delegated capabilities under a valid REM:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

`DEPLOY_REQUEST` and `PRODUCTION_MUTATION` are not granted by default.

`MERGE` is permanently outside this profile and outside the Agent IAM capability vocabulary.

Capabilities do not inherit. Each capability must be explicitly present in the REM and pass policy evaluation for the current target.

## 5. Autonomous repository workflow

The Systemadmin profile may execute the following loop without a new Human prompt per technical action:

1. read current Roadmap/main/evidence;
2. select the next mandate-covered unblocked work package;
3. perform security and overlap preflight;
4. create a fresh branch from current main;
5. implement code/documentation/tests;
6. run targeted checks;
7. perform security self-check / negative-test review;
8. commit scoped changes;
9. iterate until exit criteria are met;
10. open/update the PR;
11. repair pre-review CI/governance defects within scope;
12. stop at Human/Owner final review and merge boundary.

## 6. External mutation model

Repository mutation is the initial autonomous mutation domain.

External production mutation requires a later technically enforceable REM-bound Control-Plane capability. Until that implementation is VERIFIED PASS, this profile MUST NOT treat policy text alone as production write authority.

A future REM-bound production mutation can only be valid when:

- exact target and mutation type are predeclared;
- Roadmap/ADR/ESS require it;
- preconditions and rollback are deterministic;
- the mutation is bounded and reversible;
- postconditions are verifiable;
- audit correlation is complete;
- the action is not in the non-delegable Owner list.

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

Each Roadmap work package begins read-only and must verify:

- current main SHA;
- current Roadmap phase/gate;
- mandate validity;
- open PR/file overlap;
- relevant architecture/ESS/ADR/evidence;
- external current-state evidence where needed;
- PR check class D/C/R/M;
- threat model requirement;
- negative tests;
- rollback path;
- CI cost/scope;
- no reserved Owner-only action is required.

Security-critical ambiguity fails closed.

## 9. Audit contract

Every mutating action is correlated to:

`mandateId + roadmapItem + humanActor + agent + client + session + request + capability + risk + target + decision + result`

Where repository state exists, also record branch, commit and PR identifiers.

The M5 append-only audit path is the preferred durable evidence sink. Redaction/omission requirements from ADR-0059 remain mandatory.

## 10. Kill switch

The Owner or Control Plane may revoke the active REM at any time. Kill-switch activation blocks all mutating capabilities immediately.

Automatic STOP conditions include expiry, scope drift, requested self-elevation, reserved action, repeated failed verification, unresolvable concurrent change, missing audit identity or security-control regression.

## 11. PR governance interaction

ADR-0039 remains the default for normal agents. ADR-0065 introduces the only Systemadmin exception: a valid Owner-approved REM counts as standing PR-creation authorization for PRs fully inside the mandate.

The existing final Human/Owner PR gate remains unchanged:

`Files changed / Viewed → current-head review → Owner checkboxes → build-and-test → separate Human merge instruction`

## 12. Branch lifecycle

Every work package uses a fresh branch from current main. After successful merge into `Finance`, the branch MUST be deleted. Closed/superseded branches are also deleted after Evidence retention. Merged branches are never reused.

## 13. Verification requirements before enablement

Technical enablement requires at minimum negative tests proving:

- expired mandate → DENY;
- wrong agent → DENY;
- wrong repository/target/path → DENY;
- missing capability → DENY;
- maximum-risk violation → DENY;
- reserved Owner action → DENY;
- self-extension/self-approval → DENY;
- kill switch active → DENY;
- concurrent/scope conflict without approved resolution → STOP;
- valid mandate + valid scoped repository action → ALLOW.

## 14. Related authorities

- ESS-0019 Universal AI Agent Control Plane
- ESS-0018 Agentic Supabase Tool Governance
- ADR-0058 Provider-neutral Agent IAM
- ADR-0059 Agent Audit / OTel Correlation
- ADR-0065 Systemadmin Roadmap Execution Mandate
- `docs/governance/SYSTEMADMIN_AGENT_ROADMAP_EXECUTION_POLICY.md`
- `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md`
- `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`
