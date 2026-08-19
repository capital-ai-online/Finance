# M10 Post-Cutover Assurance — 2026-08-19

Status: LIVE EXIT ASSURANCE IN PROGRESS  
Branch: `agent/m10-post-cutover-assurance`  
Baseline: `main@00be77c39ed0bf24bb6328fa941b35adf3999b7f`  
Production baseline: Render `Finance` live on the same Controlled-Cutover merge commit before probe creation  
Authority: ADR-0066, ESS-0022, M10 Threat Model, `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`

## Purpose

Prove the Human-merged and production-deployed M10 Controlled Cutover against a fresh real pull request. This probe changes documentation only and exists to exercise the authorization boundary; it does not change runtime, workflows, credentials, database schema, billing, IAM or production configuration.

The probe PR is not itself Merge authority. Human Merge remains separate. After the live exit matrix is complete, this probe should be closed rather than used as a shortcut to merge evidence. Durable final M10 closure/traceability is synchronized through a separate fresh-main documentation work package after the live matrix is complete.

## Preflight

- Controlled-Cutover PR #429 was Human-merged to `main@00be77c39ed0bf24bb6328fa941b35adf3999b7f`.
- Render deployed that exact merge commit to production before this assurance branch was created.
- `M10_GITHUB_TOKEN` remains the read-only trusted PR-state resolver credential.
- `M10_GITHUB_DISPATCH_TOKEN` was Owner-confirmed as separately provisioned for Actions write and the service was redeployed before #429 merge.
- Production `ci.yml` now treats ordinary `pull_request` events as non-authoritative and denies before checkout/npm/test/build/docker.
- Authorized expensive PR CI requires `workflow_dispatch` on the exact same-repository PR branch/head, GitHub Actions OIDC workload identity, and one unredeemed M10 consumption capability.
- Open PR #430 is SC-2/C2b and has no path overlap with this M10 evidence file.

## Current GitHub/OIDC benchmark

The production design is aligned to GitHub's current Actions security model:

- `id-token: write` permits a job to request a GitHub OIDC JWT and does not grant repository-resource write access by itself;
- GitHub OIDC identity exposes workload claims including repository, ref, SHA, event, run ID and workflow reference;
- the workflow gate binds those signed workload claims conjunctively with the one-time M10 consumption;
- an ordinary PR event is therefore intentionally insufficient to authorize expensive CI.

## Mandatory post-cutover live matrix

### PC-1 — ordinary PR event must be cheap DENY

Expected:

- the initial `pull_request`-triggered `build-and-test` starts only far enough to create the required check context;
- `M10 CI-Autorisierung vor teuren Schritten prüfen` returns DENY;
- checkout, npm install, dependency audit, TypeScript, Unit, Production Build, CSP, deployment readiness, Docker and image build do not run.

Status: PENDING.

### PC-2 — real authoritative Owner passkey authorization

Expected:

- CAPITAL-AI authoritative M10 panel resolves this open PR and exact current head;
- real Owner WebAuthn assertion succeeds;
- immutable `m10_approval_evidence` is created for action `AUTHORIZE_PR_CI`;
- exactly one matching `m10_ci_consumptions` row is claimed;
- GitHub workflow dispatch targets this exact same-repository branch/head.

Status: PENDING.

### PC-3 — exactly one authorized current-head CI

Expected:

- dispatched `build-and-test` runs on the approved head SHA;
- workflow obtains a valid GitHub Actions OIDC identity;
- production workflow gate verifies signed identity + current GitHub PR state + immutable approval + PENDING consumption;
- the single winner atomically transitions `PENDING -> DISPATCHED` before checkout/npm/build;
- classified CI then runs and completes successfully.

Status: PENDING.

### PC-4 — replay / duplicate authorization

Expected:

- the same approval/consumption cannot start a second expensive run;
- duplicate/replayed consumption is DENY/DEDUPE before expensive CI.

Status: PENDING.

### PC-5 — malformed/manual dispatch

Expected:

- a dispatch without the valid conjunction of exact-context GitHub OIDC identity and unredeemed M10 consumption cannot enter expensive CI.

Deterministic forged/malformed OIDC and capability cases are already covered by the Controlled-Cutover regression suite. Live assurance will verify the actual production workflow boundary without weakening or fabricating credentials.

Status: PENDING.

### PC-6 — stale approval after PR-head change

Expected:

- after this probe head is changed by a harmless documentation commit, the previous approval/state cannot authorize the new head;
- stale base/head/file-set/diff context is DENY.

Status: PENDING.

### PC-7 — fresh recovery on new stable head

Expected:

- a fresh Owner challenge/assertion against the new stable head succeeds;
- exactly one new authorized CI run may execute for that new approved head.

Status: PENDING.

### PC-8 — legacy signals remain non-authoritative

Expected:

- checkbox, Viewed, emoji/reaction, label and PR text have no CI authority;
- Human Merge remains separate from `AUTHORIZE_PR_CI`.

Status: PENDING.

### PC-9 — audit correlation and final exit gate

Expected final evidence correlation:

- immutable approval evidence;
- exact-head consumption lifecycle;
- GitHub workflow run / OIDC workload correlation;
- M5 append-only audit events;
- no more than one expensive CI per approved head;
- recovery PASS;
- no weak fallback authority.

Only after these checks and final Roadmap/Evidence/Traceability synchronization may M10 be marked `COMPLETE / VERIFIED PASS`.

## Safety / rollback

This probe is documentation-only and does not mutate production. If the authoritative path fails, fail closed: do not restore automatic expensive PR CI or legacy checkbox/emoji authorization. Any runtime/workflow repair requires a separate fresh-main Human-authorized branch and PR.

## Before / After target

| Control | Pre-live-proof state | Required post-cutover proof |
|---|---|---|
| Ordinary PR event | Cutover implementation merged | cheap DENY before expensive steps |
| Owner passkey | authoritative code deployed | immutable exact-head approval |
| CI dispatch | implemented | exactly one exact-head dispatch |
| Runner identity | implemented OIDC gate | signed exact-context OIDC accepted |
| Consumption | atomic foundation | single PENDING -> DISPATCHED winner |
| Replay | deterministic tests | production duplicate DENY |
| Head drift | deterministic tests | stale live state DENY |
| Recovery | Phase-6 Shadow PASS | fresh authoritative approval PASS |
| Human Merge | separate by policy | remains separate |
| M10 status | not COMPLETE | COMPLETE only after full live matrix + traceability |
