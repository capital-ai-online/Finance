# M10 Controlled Cutover Evidence — 2026-08-19

Status: IMPLEMENTATION IN PROGRESS — PR #429 / CI / HUMAN MERGE / POST-MERGE LIVE VERIFICATION PENDING  
Branch: `agent/m10-controlled-cutover`  
Baseline: `main@4c280fb53e74e38d571e4b44b620a7b33681e0be`  
Authority: ADR-0066, ESS-0022, M10 Threat Model, M10 Runbook, ADR-0069 Owner addendum 2026-08-16

## Purpose

Move expensive pull-request CI from the simplified pre-M10 automatic PR-event path to the strong M10 Owner-passkey authorization path without changing Human-only Merge authority.

This evidence is deliberately staged. The repository implementation may be reviewed and tested in a PR, but M10 is not `COMPLETE / VERIFIED PASS` until the Human-merged/default-branch workflow is deployed and the post-cutover live matrix proves the exact-head and no-unapproved-expensive-CI invariants.

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

`ci.yml` currently starts the required `build-and-test` job directly on normal `pull_request` events. Phase 5 can atomically claim one approval/head and issue a GitHub Actions dispatch, but its dispatcher defaulted to `main`, which cannot prove the required check against the approved PR head. There was also no workflow-side single-use gate preventing a manual Actions dispatch from bypassing WebAuthn.

## Controlled-Cutover design

### 1. Separate GitHub credentials

- `M10_GITHUB_TOKEN`: existing server-side read-only PR-state resolver credential. It remains restricted to repository `Finance` and Pull Requests read.
- `M10_GITHUB_DISPATCH_TOKEN`: new, separate server-side credential for repository `Finance`, scoped to GitHub Actions write (plus GitHub-required metadata read). It is used only to issue the authorized workflow dispatch.

The resolver credential is not widened to Actions write.

### 2. Exact same-repository dispatch ref

`server/m10/githubPrDispatchRef.ts` performs a second live PR lookup immediately before durable Phase-5 claim. Dispatch is denied unless:

- repository is the canonical `SvenKulessa/Finance`;
- PR is still open;
- current head SHA still equals the approved head SHA;
- the head repository is the same repository, not a fork/cross-repository head;
- current head branch/ref satisfies the explicit fail-closed Git-ref subset used by M10.

GitHub `workflow_dispatch` is then sent to this exact PR branch rather than `main`.

### 3. Phase-5 dispatch remains PENDING until workflow redemption

A successful GitHub dispatch response no longer immediately marks the consumption `DISPATCHED`. The random Phase-5 `consumptionId` remains a high-entropy, single-use capability while the durable row stays `PENDING`.

Rejected or network-ambiguous dispatch remains terminal `FAILED_UNCERTAIN`; there is no blind automatic retry.

### 4. Server-side single-use workflow gate

The dispatched workflow must redeem the exact `consumptionId` through CAPITAL-AI before checkout/npm/test/build/docker.

The gate:

1. receives consumption/approval/repository/PR/base/head/authorization-digest/action plus GitHub workflow run/ref metadata;
2. re-resolves the complete current GitHub PR state again at gate time;
3. requires current base/head still equal the dispatched/approved values;
4. re-resolves the exact same-repository current PR branch and requires the workflow `GITHUB_REF` to equal it;
5. compares current trusted changed-file-set hash and diff digest against immutable approval evidence;
6. requires the matching durable CI consumption to remain `PENDING`;
7. writes durable M5 pre-finalize audit using only a SHA-256 hash of the live consumption capability;
8. atomically calls the existing `finalize_m10_ci_dispatch(..., 'DISPATCHED')` RPC;
9. permits expensive workflow execution only for the single winner.

Unknown, mismatched, replayed or already-terminal capabilities deny. A manually initiated workflow dispatch without a valid unredeemed M10 capability cannot pass the gate.

### 5. Owner UI

The Supervisor M10 panel becomes `AUTHORITATIVE` after deployment. It requires:

- configured read-only resolver;
- configured separate Actions dispatcher;
- at least one active Owner passkey.

Owner enters a PR number, completes WebAuthn, and the server performs assertion verification + atomic claim + exact-ref dispatch. Human merge is never performed by this path.

## GitHub Actions contract

GitHub documentation reviewed for this cutover establishes:

- workflow dispatch requires a branch/tag `ref` and a fine-grained token with repository Actions `write`;
- a dispatched workflow's `GITHUB_REF` is the selected branch/tag and `GITHUB_SHA` is the last commit on it;
- a `workflow_dispatch` workflow file must exist on the default branch before API dispatch can use it;
- required status checks must be successful on the current commit SHA.

Primary references:

- https://docs.github.com/rest/actions/workflows#create-a-workflow-dispatch-event
- https://docs.github.com/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch
- https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

## Required-check rollout and bootstrap

`build-and-test` remains the required repository-hosted check context. The final `ci.yml` change was added only **after PR #429 existed**, so the Controlled-Cutover PR itself can run the pre-cutover full CI before the new production M10 endpoint is Human-merged/deployed.

The workflow contains one explicit, unique bootstrap exception bound to PR #429. That exception exists only to validate the cutover code/workflow before it can become the default-branch production gate. After Human merge, PR #429 cannot authorize any future open PR.

For all other PRs after cutover:

- the ordinary PR-event `build-and-test` job fails before checkout and therefore before npm/test/build/docker;
- only a valid `workflow_dispatch` with a freshly unredeemed M10 consumption capability may cross the workflow gate and enter expensive CI.

Bootstrap PR number: **#429**.

## Regression coverage in this branch

Tests cover:

- exact same-repository head-ref resolution;
- head drift denial before durable claim;
- fork/cross-repository head denial;
- strict rejection of traversal-/ambiguous Git-ref shapes such as `../main`;
- exact-ref workflow dispatch and dispatch-input binding;
- accepted dispatch remaining `PENDING` until workflow gate;
- context mismatch/replay/audit-failure denial at workflow gate;
- full changed-file-set/diff binding at workflow gate;
- structural absence of legacy checkbox/emoji/label/reaction authorization from the cutover workflow;
- authoritative UI/router wiring and separate resolver/dispatcher credential roles.

Repository test execution was intentionally deferred until after PR creation under the GitHub-cost policy. Initial CI #1851 reached the full Unit-Test phase after Governance, workflow-security, dependency audit and TypeScript had passed; it exposed a stricter negative-test expectation for malformed Git branch refs. The implementation was hardened rather than weakening that DENY assertion, and a new full CI run is required on the corrected head.

## Pre-merge operational prerequisite

**Do not Human-merge this Controlled-Cutover PR until `M10_GITHUB_DISPATCH_TOKEN` has been provisioned in Render's server-only `finance-secrets.env`.**

Required token posture:

- resource owner: `SvenKulessa`;
- repository access: only `Finance`;
- Actions: write;
- Metadata: GitHub-required read;
- no Pull Requests write, Contents write, Administration, Issues or other unrelated permissions.

If the dispatch credential is absent, the authoritative Owner UI remains fail-closed. Merging the workflow cutover without the dispatcher credential would intentionally stop expensive PR CI with no usable authorization path.

Secret provisioning is a separate production mutation and is not performed by this repository PR.

## Post-merge live exit matrix

After Human merge, production deploy and secret verification:

1. open a fresh test PR from then-current `main`;
2. prove ordinary PR-event `build-and-test` denies before checkout/npm/test/build/docker;
3. complete a real Owner passkey authorization for the exact current head;
4. prove exactly one workflow-gated `build-and-test` executes on that approved head;
5. prove the same consumption/approval cannot start a second expensive run;
6. change the PR head and prove stale approval/state cannot authorize it;
7. recover using a fresh challenge/approval on the new stable head;
8. prove manual/malformed dispatch cannot cross the server workflow gate;
9. prove legacy checkbox/emoji/text/Viewed/label/reaction signals have no CI authority;
10. correlate immutable approval, consumption, workflow-run and M5 audit evidence;
11. verify Human Merge remains separate;
12. synchronize final Roadmap/Traceability and only then mark M10 `COMPLETE / VERIFIED PASS`.

## Rollback

Before Human merge, no production behavior changes.

After merge but before post-cutover verification, fail closed. Do not restore checkbox/emoji/Viewed authorization. A rollback/fix requires a fresh branch from then-current `main`, Human authorization and verification against the current ruleset/workflow state.

## Before / After

| Control | Before | Controlled-Cutover target |
|---|---|---|
| Expensive PR CI trigger | normal PR event | Owner passkey `AUTHORIZE_PR_CI` only |
| Required check context | `build-and-test` | unchanged `build-and-test` |
| Exact PR head | PR event head | passkey-bound + re-resolved before claim and gate |
| GitHub dispatch ref | Phase-5 default `main` | exact same-repository PR branch |
| Manual workflow dispatch | no M10 workflow-side gate | single-use server capability required |
| One CI/head | DB claim foundation | DB claim + atomic workflow redemption |
| Resolver credential | PR read | unchanged PR read only |
| Dispatcher credential | not live | separate Actions write only |
| Human Merge | Human-only | unchanged Human-only |
| Legacy checkbox/emoji | retired | remains non-authoritative |
