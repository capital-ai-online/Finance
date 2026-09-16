# OPS-02-CI-01 — Stale PR Event Race Guard Evidence

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Parent work package:** `OPS-02-CI-01 — Build/Test Cost & Scope Reduction`  
**State:** `IMPLEMENTED_ON_BRANCH / HOSTED_RACE_EVIDENCE_PENDING`  
**Correlation baseline:** `main@a793c86136c56f82f065c07f854c7c588e1ff7db`  
**Branch:** `agent/operations-ci-stale-head-guard-20260916`  
**Authority:** `/AGENTS.md@current-main`, ADR-0073, ESS-0001-CONTRACTS Chapter 12  
**Production mutation:** none

## 1. Real incident evidence

PR #989 exposed a stale Pull Request event race immediately after PR #988 changed the CI cost/profile control surface and was Human-merged to `main`.

Observed sequence:

1. PR #989 was synchronized to the new main and reached head `904fb594caf3054707d1f570a36d4d27fcd950d3`.
2. CI run #3898 and Container Security run #976 started for that current head.
3. A later-delivered `ready_for_review` event still carried the older event head `d0d2a1e7ec11cc742847fc042eb69fb911249d30`.
4. The affected workflows used PR-number-only concurrency groups with `cancel-in-progress: true`.
5. The stale event therefore shared the concurrency group with the newer snapshot and cancelled the newer CI/Container attempts before their substantive steps executed.
6. The authoritative current-head runs had to be retried. CI #3898 attempt 2 subsequently completed successfully for `904fb594...`, including TypeScript and 24/24 focused Vitest tests.

This is not a normal scope skip. It is an ordering/concurrency race where event delivery order and snapshot freshness differ.

## 2. Remediation contract

The fix preserves the existing Required Check architecture and `cancel-in-progress` optimization but changes its identity boundary.

For PR-triggered checks, cancellation is now isolated to the exact event snapshot:

`(workflow, PR number, event head SHA, event base SHA)`

`PR Governance` additionally includes the Pull Request event action so a body-only `edited` event cannot cancel a normal code-validation event for the same head/base snapshot.

Each active automatic PR workflow in this slice reads the live Pull Request before checkout or expensive work and compares:

- live PR state = `open`;
- live `head.sha` = event `pull_request.head.sha`;
- live `base.sha` = event `pull_request.base.sha`.

A mismatch is classified as a stale event and terminates on a cheap no-op path. It must not execute checkout/dependency installation/tests/build/container analysis or workflow analysis for obsolete evidence.

## 3. Covered workflow surfaces

| Workflow | Snapshot-aware concurrency | Live snapshot guard | Expensive stale work blocked |
|---|---|---|---|
| `.github/workflows/ci.yml` | PR + head + base | yes | checkout, npm, TypeScript, tests, build, Docker |
| `.github/workflows/container-security.yml` | PR + head + base | yes | checkout, Docker build, SBOM, Trivy |
| `.github/workflows/pr-governance.yml` | PR + head + base + action | yes | policy/candidate checkout, Node/npm and governance validation |
| `.github/workflows/zizmor.yml` | PR + head + base | yes | checkout and zizmor analysis |

The other PR-number-related concurrency surfaces were correlated rather than mechanically rewritten:

- `.github/workflows/sync-agent-pr-branches.yml` has its own isolated sync concurrency group and cannot cancel CI/Container/Governance/zizmor. Its `ready_for_review` path reads the live `headRefOid` before mutation and sends that SHA as `expected_head_sha` to GitHub's Update-Branch API. A stale/changed head is already handled as `422` without a second sync path, which is exactly what the PR #989 race demonstrated.
- `.github/workflows/capital-ai-ci-shadow.yml` has no automatic `pull_request` trigger and runs only through `workflow_dispatch`, so it is outside the stale automatic-PR-event race surface.
- trusted `workflow_run` baseline refresh paths have separate live PR/head/base correlation and do not share the Required Check concurrency groups addressed here; they are not widened into this bounded fix.

## 4. Preserved invariants

- `build-and-test` remains the canonical technical Required Check; no synthetic reporter or replacement context is introduced.
- `Hardened image / HIGH+CRITICAL CVE gate` and `PR Governance (Kosten / Workflow / Vorlage)` retain their existing check identities.
- Same-snapshot duplicate runs within the same workflow concurrency group may still be cancelled by `cancel-in-progress: true`.
- Exact-snapshot PASS reuse in `ci.yml` remains bound to workflow, PR number, head SHA, base SHA and prior success.
- A changed live head or base cannot reuse old evidence and cannot be cancelled by a stale older snapshot.
- `push` to `main` remains on the existing full CI/build/attestation/deployment path.
- No GitHub ruleset, provider permission, credential, billing, Security product or Production setting is changed by this repository slice.
- Human/CODEOWNER merge authority remains unchanged.

## 5. Repository validation contract

`scripts/pr/prEventSnapshotConcurrency.test.mjs` statically locks the following properties:

1. PR concurrency keys contain event head and event base identity rather than only PR number.
2. live Pull Request readback is present before expensive work.
3. stale no-op guards occur before repository checkout in CI, Container Security and zizmor.
4. Governance includes event action identity in addition to head/base.
5. existing Required Check names and `cancel-in-progress: true` remain present.
6. the previous PR-number-only concurrency strings are absent from the protected automatic surfaces.
7. the separate branch-sync workflow retains live `headRefOid` + `expected_head_sha` protection and the shadow CI remains manual-only.

Because this slice changes `.github/workflows/ci.yml` and other workflow-control surfaces, the trusted-base planner must classify its hosted validation fail-closed rather than allowing the candidate to self-demote its checks.

## 6. Evidence status and exit

### Pre-PR

Connector readback and deterministic changed-file inspection are available. Repository-native Node/Vitest/zizmor execution is `NOT RUN` before PR creation on this execution surface and is not represented as PASS.

### Hosted PR evidence

After Draft PR creation, the authoritative hosted checks must prove the candidate workflow syntax/security and full control-surface validation on the exact PR head. The real post-remediation race exit remains open until a current-head run coexists with a delayed older event without that older event cancelling the newer snapshot.

The behavioral exit is:

- current live head/base retains its Required Check run;
- delayed stale head/base receives an isolated concurrency key;
- stale live-head guard stops obsolete expensive work;
- no current-head `build-and-test` is cancelled by the stale event;
- current-head exact-snapshot evidence remains usable under ADR-0073.

No artificial paid benchmark run is required merely to manufacture the race. Organic or otherwise already-occurring event overlap may provide the final hosted race evidence.

## 7. Rollback

If snapshot-aware grouping causes missing/pending Required Checks or otherwise destabilizes GitHub Actions semantics, remediate on a fresh then-current-main branch. Preserve the stable Required Check names and main force-full path. Do not recover mergeability by disabling Required Checks or by restoring PR-number-only cancellation without an alternative stale-event guard proven against the same race.