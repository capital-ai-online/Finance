# M10 Controlled Cutover Evidence — 2026-08-19

Status: IMPLEMENTATION IN PROGRESS — PR #429 / FINAL OIDC-HARDENED CI / HUMAN MERGE / POST-MERGE LIVE VERIFICATION PENDING  
Branch: `agent/m10-controlled-cutover`  
Baseline: `main@4c280fb53e74e38d571e4b44b620a7b33681e0be`  
Authority: ADR-0066, ESS-0022, M10 Threat Model, M10 Runbook, ADR-0069 Owner addendum 2026-08-16

## Purpose

Move expensive pull-request CI from the simplified pre-M10 automatic PR-event path to the strong M10 Owner-passkey authorization path without changing Human-only Merge authority.

This evidence is deliberately staged. Repository implementation can be reviewed and validated in PR #429, but M10 is not `COMPLETE / VERIFIED PASS` until the Human-merged/default-branch workflow is deployed and the post-cutover live matrix proves exact-head, workload-identity and no-unapproved-expensive-CI invariants.

## Phase-6 prerequisite evidence

Phase 6 reached `VERIFIED PASS` before this branch was created:

- real Owner WebAuthn Shadow assertions succeeded against exact GitHub PR state;
- a closed PR was denied before WebAuthn;
- challenge freshness, expiry, replay and single-use behavior are covered by live/automated evidence;
- changed base/head/file-set/diff is denied by deterministic Phase-4 verifier tests;
- recovery succeeded with a fresh Owner assertion after a real PR-head change;
- Shadow produced durable M5 audit correlation;
- Shadow created zero authoritative `m10_approval_evidence` and zero `m10_ci_consumptions`;
- the single-device live head-drift timing attempt was `INCONCLUSIVE` because the drift commit arrived after a valid assertion and is not represented as a live negative PASS.

## Before

`ci.yml` started the required `build-and-test` job directly on normal `pull_request` events. Phase 5 could atomically claim one approval/head and issue a GitHub Actions dispatch, but its dispatcher defaulted to `main`, which cannot prove the required check against the approved PR head. There was no workflow-side single-use gate and no signed workload-identity check preventing a manually fabricated dispatch/input from attempting to act as the authorized runner.

## Controlled-Cutover design

### 1. Separate GitHub credentials

- `M10_GITHUB_TOKEN`: existing server-side read-only PR-state resolver credential, restricted to repository `Finance` and Pull Requests read.
- `M10_GITHUB_DISPATCH_TOKEN`: new separate server-side credential for repository `Finance`, scoped to GitHub Actions write plus GitHub-required metadata read.

The resolver credential is not widened to Actions write.

### 2. Exact same-repository dispatch ref

`server/m10/githubPrDispatchRef.ts` performs a second live PR lookup immediately before durable Phase-5 claim. Dispatch is denied unless:

- repository is canonical `SvenKulessa/Finance`;
- PR is still open;
- current head SHA still equals the approved head SHA;
- the head repository is the same repository, not a fork/cross-repository head;
- current head branch/ref satisfies the explicit fail-closed Git-ref subset used by M10.

GitHub `workflow_dispatch` is sent to this exact PR branch rather than `main`.

### 3. Phase-5 dispatch remains PENDING until workflow redemption

A successful GitHub dispatch response no longer immediately marks the consumption `DISPATCHED`. The random Phase-5 `consumptionId` remains a high-entropy, single-use capability while the durable row stays `PENDING`.

Rejected or network-ambiguous dispatch remains terminal `FAILED_UNCERTAIN`; there is no blind automatic retry.

### 4. GitHub Actions OIDC + single-use workflow gate

A `workflow_dispatch` input is not treated as sufficient workload identity. Before checkout/npm/test/build/docker, `build-and-test` requests a short-lived GitHub Actions OIDC JWT using job-level `id-token: write` and fixed audience `https://capital-ai.online/m10-workflow-gate`.

CAPITAL-AI verifies, without adding a new JWT dependency:

- JOSE header requires `RS256`/JWT and a known GitHub signing-key `kid`;
- signature against the fixed GitHub Actions JWKS endpoint;
- issuer `https://token.actions.githubusercontent.com`;
- fixed workflow-gate audience;
- bounded `iat`/`nbf`/`exp` freshness;
- exact repository `SvenKulessa/Finance`;
- `event_name=workflow_dispatch` and `ref_type=branch`;
- exact dispatched branch ref and exact approved head SHA;
- exact workflow run ID;
- exact workflow name/path/ref.

Only after valid OIDC identity does the server:

1. re-resolve the complete current GitHub PR state again at gate time;
2. require current base/head to equal dispatched/approved values;
3. re-resolve the exact same-repository current PR branch and require workflow `GITHUB_REF` to match it;
4. compare current trusted changed-file-set hash and diff digest against immutable approval evidence;
5. require the matching durable CI consumption to remain `PENDING`;
6. write durable M5 pre-finalize audit using SHA-256 correlation for both live consumption capability and OIDC JTI;
7. atomically call existing `finalize_m10_ci_dispatch(..., 'DISPATCHED')`;
8. permit expensive workflow execution only for the single winner.

The active OIDC JWT and raw `consumptionId` are masked and never persisted raw in M5 audit. Unknown, mismatched, replayed, already-terminal, wrong-audience, stale or forged workload identities deny before expensive CI.

### 5. Owner UI

The Supervisor M10 panel becomes `AUTHORITATIVE` after deployment. It requires:

- configured read-only resolver;
- configured separate Actions dispatcher;
- at least one active Owner passkey.

Owner enters a PR number, completes WebAuthn, and the server performs assertion verification + atomic claim + exact-ref dispatch. Human merge is never performed by this path.

## GitHub Actions contract

Current GitHub documentation reviewed for this cutover establishes:

- workflow dispatch requires a branch/tag `ref` and an Actions-write repository credential;
- a dispatched workflow's `GITHUB_REF` is the selected branch/tag and `GITHUB_SHA` is its last commit;
- a `workflow_dispatch` workflow file must exist on the default branch before API dispatch can use it;
- required status checks must be successful on the current commit SHA;
- GitHub Actions OIDC uses issuer `https://token.actions.githubusercontent.com`, exposes repository/ref/SHA/run/workflow identity claims, signs with `RS256`, and publishes its signing keys through the discovery/JWKS endpoints;
- `id-token: write` permits requesting an OIDC token and is not itself a repository-resource write permission.

Primary references:

- https://docs.github.com/rest/actions/workflows#create-a-workflow-dispatch-event
- https://docs.github.com/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch
- https://docs.github.com/actions/concepts/security/openid-connect
- https://token.actions.githubusercontent.com/.well-known/openid-configuration
- https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

## Required-check rollout and bootstrap

`build-and-test` remains the required repository-hosted check context. `ci.yml` was changed only after PR #429 existed, so the Controlled-Cutover PR can run full pre-cutover CI before the new production M10 endpoint is Human-merged/deployed.

The workflow contains one explicit bootstrap exception bound to PR #429. That exception exists only to validate cutover code/workflow before the new workflow can become the default-branch gate. After Human merge, PR #429 cannot authorize any future open PR.

For all other PRs after cutover:

- ordinary PR-event `build-and-test` fails in the first authorization step before checkout and therefore before npm/test/build/docker;
- only a valid `workflow_dispatch` with both a signed exact-workload GitHub OIDC JWT and a freshly unredeemed M10 consumption capability may enter expensive CI.

Bootstrap PR number: **#429**.

## Regression coverage

Tests cover:

- exact same-repository head-ref resolution;
- head drift denial before durable claim;
- fork/cross-repository head denial;
- strict rejection of traversal-/ambiguous Git-ref shapes such as `../main`;
- exact-ref workflow dispatch and dispatch-input binding;
- accepted dispatch remaining `PENDING` until workflow gate;
- context mismatch/replay/audit-failure denial at workflow gate;
- full changed-file-set/diff binding at workflow gate;
- GitHub OIDC valid exact-context verification;
- wrong OIDC audience/repository/ref/SHA/run/event/workflow-ref denial;
- expired OIDC token denial;
- forged-signature and non-RS256 OIDC denial;
- structural requirement that OIDC verification precedes current PR re-resolution / durable workflow consumption;
- structural absence of legacy checkbox/emoji/Viewed/reaction authorization from the cutover workflow;
- authoritative UI/router wiring and separate resolver/dispatcher credential roles.

Repository tests were intentionally deferred until after PR creation under GitHub cost policy.

CI history before OIDC hardening:

- CI #1851 reached Unit Tests after Governance, workflow-security, dependency audit and TypeScript had passed; it exposed a too-permissive branch-ref validator. The DENY assertion was retained and implementation hardened.
- Corrected head `697ed5b1f88a0fcf88fe8af02a9a306a5f82ab32` passed Governance #1170 and full Class-R CI #1852: repository integrity, npm ci, production dependency audit, TypeScript, full Unit Tests, Production Build, CSP, Deployment Readiness, Docker Hardening and production Docker image all passed.
- A subsequent enterprise security review identified workflow-dispatch-input exposure as a reason to require signed GitHub Actions workload identity in addition to the one-time M10 capability. OIDC hardening was added before merge; a new complete Class-R run on that final OIDC head is mandatory before merge readiness.

## Pre-merge operational prerequisite

**Do not Human-merge PR #429 until `M10_GITHUB_DISPATCH_TOKEN` has been provisioned in Render's server-only `finance-secrets.env`.**

Required token posture:

- resource owner: `SvenKulessa`;
- repository access: only `Finance`;
- Actions: write;
- Metadata: GitHub-required read;
- no Pull Requests write, Contents write, Administration, Issues or unrelated permissions.

If the dispatch credential is absent, the authoritative Owner UI remains fail-closed. Merging the workflow cutover without the dispatcher credential would intentionally stop expensive PR CI with no usable authorization path.

Secret provisioning is a separate production mutation and is not performed by this repository PR.

## Post-merge live exit matrix

After Human merge, production deploy and secret verification:

1. open a fresh test PR from then-current `main`;
2. prove ordinary PR-event `build-and-test` denies before checkout/npm/test/build/docker;
3. complete a real Owner passkey authorization for the exact current head;
4. prove exactly one workflow-gated `build-and-test` executes on that approved head with valid GitHub OIDC workload identity;
5. prove the same consumption/approval cannot start a second expensive run;
6. prove a manual/malformed dispatch without valid OIDC + unredeemed consumption cannot enter expensive CI;
7. change the PR head and prove stale approval/state cannot authorize it;
8. recover using a fresh challenge/approval on the new stable head;
9. prove legacy checkbox/emoji/text/Viewed/label/reaction signals have no CI authority;
10. correlate immutable approval, consumption, OIDC/workflow-run and M5 audit evidence;
11. verify Human Merge remains separate;
12. synchronize final Roadmap/Traceability and only then mark M10 `COMPLETE / VERIFIED PASS`.

## Rollback

Before Human merge, no production behavior changes.

After merge but before post-cutover verification, fail closed. Do not restore checkbox/emoji/Viewed authorization. A rollback/fix requires a fresh branch from then-current `main`, Human authorization and verification against current ruleset/workflow state.

## Before / After

| Control | Before | Controlled-Cutover target |
|---|---|---|
| Expensive PR CI trigger | normal PR event | Owner passkey `AUTHORIZE_PR_CI` only |
| Required check context | `build-and-test` | unchanged `build-and-test` |
| Exact PR head | PR event head | passkey-bound + re-resolved before claim and gate |
| GitHub dispatch ref | Phase-5 default `main` | exact same-repository PR branch |
| Runner identity | GitHub event only / dispatch input | signed exact-context GitHub Actions OIDC |
| Manual workflow dispatch | no M10 workflow-side gate | OIDC + single-use server capability required |
| One CI/head | DB claim foundation | DB claim + atomic workflow redemption |
| Resolver credential | PR read | unchanged PR read only |
| Dispatcher credential | not live | separate Actions write only |
| Long-lived workflow-gate secret | N/A | none introduced |
| Human Merge | Human-only | unchanged Human-only |
| Legacy checkbox/emoji | retired | remains non-authoritative |
