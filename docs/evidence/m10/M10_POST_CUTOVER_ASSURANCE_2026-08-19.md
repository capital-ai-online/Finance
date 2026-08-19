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

## Live observations — first stable head

Initial probe head: `da92c86d4aeff96dfeec65a9eada1f98cead2351`.

- Ordinary PR CI run `#1872` failed exactly at `M10 CI-Autorisierung vor teuren Schritten prüfen`; checkout, classifier, npm, TypeScript, Unit, build, CSP, predeploy and Docker/image steps were skipped.
- Governance run `#1194` passed.
- One real authoritative Owner WebAuthn authorization created exactly one consumed approval/consumption chain for the initial head.
- Authorized GitHub workflow run `32228796660` / CI `#1873` was a `workflow_dispatch` on the exact same-repository branch and exact approved head.
- Production M5 audit recorded `m10_ci_workflow_gate_claim` with `githubOidcVerified=true`, `currentPrStateReResolved=true` and `singleUseWorkflowGate=true` before the consumption transitioned to `DISPATCHED`.
- CI `#1873` passed. Because the probe is class D, Node/npm/audit/TypeScript/Unit/build/Docker remained intentionally skipped after the successful authorization gate.
- A second real Owner authorization on the unchanged initial head created a second immutable approval, but the CI consumer returned `DEDUPE_HEAD`: the second approval remained unconsumed and no second consumption, accepted dispatch or workflow-gate success was created.
- Exactly-once correlation on the initial head after duplicate test: 2 approvals, 1 consumption, 1 accepted dispatch, 1 successful workflow-gate claim.

## Mandatory post-cutover live matrix

### PC-1 — ordinary PR event must be cheap DENY

Expected:

- the initial `pull_request`-triggered `build-and-test` starts only far enough to create the required check context;
- `M10 CI-Autorisierung vor teuren Schritten prüfen` returns DENY;
- checkout, npm install, dependency audit, TypeScript, Unit, Production Build, CSP, deployment readiness, Docker and image build do not run.

Status: **PASS — LIVE**. CI `#1872` denied at the first M10 step and all expensive steps were skipped.

### PC-2 — real authoritative Owner passkey authorization

Expected:

- CAPITAL-AI authoritative M10 panel resolves this open PR and exact current head;
- real Owner WebAuthn assertion succeeds;
- immutable `m10_approval_evidence` is created for action `AUTHORIZE_PR_CI`;
- exactly one matching `m10_ci_consumptions` row is claimed;
- GitHub workflow dispatch targets this exact same-repository branch/head.

Status: **PASS — LIVE** on initial head `da92c86d4aeff96dfeec65a9eada1f98cead2351`.

### PC-3 — exactly one authorized current-head CI

Expected:

- dispatched `build-and-test` runs on the approved head SHA;
- workflow obtains a valid GitHub Actions OIDC identity;
- production workflow gate verifies signed identity + current GitHub PR state + immutable approval + PENDING consumption;
- the single winner atomically transitions `PENDING -> DISPATCHED` before checkout/npm/build;
- classified CI then runs and completes successfully.

Status: **PASS — LIVE**. Run `32228796660` / CI `#1873` completed successfully on the exact approved initial head; OIDC/current-state/single-use gate evidence is present in M5 audit.

### PC-4 — replay / duplicate authorization

Expected:

- the same approval/consumption cannot start a second expensive run;
- duplicate/replayed consumption is DENY/DEDUPE before expensive CI.

Status: **PASS — LIVE**. A second Owner assertion on the unchanged initial head produced an immutable approval but was rejected by the consumer with `DEDUPE_HEAD`; the second approval remains unconsumed. No second consumption, accepted dispatch or workflow-gate success exists.

### PC-5 — malformed/manual dispatch

Expected:

- a dispatch without the valid conjunction of exact-context GitHub OIDC identity and unredeemed M10 consumption cannot enter expensive CI.

Deterministic forged/malformed OIDC and capability cases are already covered by the Controlled-Cutover regression suite. Live assurance will verify the actual production workflow boundary without weakening or fabricating credentials.

Status: PENDING final correlation. No forged credential or synthetic bypass will be introduced into production solely for assurance.

### PC-6 — stale approval after PR-head change

Expected:

- after this probe head is changed by a harmless documentation commit, the previous approval/state cannot authorize the new head;
- stale base/head/file-set/diff context is DENY.

Status: **IN PROGRESS**. This commit intentionally advances the probe head after PC-1..PC-4. The second duplicate-test approval remains unconsumed and is cryptographically/contextually bound to old head `da92c86d4aeff96dfeec65a9eada1f98cead2351`. After the new head is observed, assurance must confirm that this stale approval creates no consumption/dispatch for the new head and that the ordinary synchronize event is again cheap-DENY.

### PC-7 — fresh recovery on new stable head

Expected:

- a fresh Owner challenge/assertion against the new stable head succeeds;
- exactly one new authorized CI run may execute for that new approved head.

Status: PENDING until PC-6 stale-state isolation is verified on the newly advanced head.

### PC-8 — legacy signals remain non-authoritative

Expected:

- checkbox, Viewed, emoji/reaction, label and PR text have no CI authority;
- Human Merge remains separate from `AUTHORIZE_PR_CI`.

Status: PENDING final structural/audit correlation; no legacy signal is used in this probe.

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

Status: IN PROGRESS.

## Safety / rollback

This probe is documentation-only and does not mutate production runtime or external configuration. Expected M10 approval/consumption rows are part of the production authorization contract under test. If the authoritative path fails, fail closed: do not restore automatic expensive PR CI or legacy checkbox/emoji authorization. Any runtime/workflow repair requires a separate fresh-main Human-authorized branch and PR.

## Before / After target

| Control | Pre-live-proof state | Current proof state |
|---|---|---|
| Ordinary PR event | Cutover implementation merged | PC-1 live PASS: cheap DENY before expensive steps |
| Owner passkey | authoritative code deployed | PC-2 live PASS on initial head |
| CI dispatch | implemented | PC-3 live PASS: exactly one exact-head dispatch |
| Runner identity | implemented OIDC gate | signed exact-context OIDC accepted; M5 correlated |
| Consumption | atomic foundation | single `PENDING -> DISPATCHED` winner proven |
| Replay | deterministic tests | PC-4 live PASS: duplicate head DEDUPE, no second dispatch |
| Head drift | deterministic tests | PC-6 in progress using this docs-only head advance |
| Recovery | Phase-6 Shadow PASS | PC-7 pending on new stable head |
| Human Merge | separate by policy | remains separate; probe remains Draft/open |
| M10 status | not COMPLETE | COMPLETE only after remaining live matrix + traceability |
