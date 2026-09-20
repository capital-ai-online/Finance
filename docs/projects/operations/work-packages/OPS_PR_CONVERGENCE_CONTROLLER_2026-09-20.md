# OPS — PR Convergence Controller

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02`  
**Parent recovery contract:** `SH-02.3 / self-healing-contract/1.0.0`  
**Baseline:** `main@3a9a55262dbb8ee87dac087a863b1e3369e71d22`  
**Status:** `ACTIVE / OWNER-DIRECTED`

## Outcome

Evolve the existing `.github/workflows/pr-autofix-controller.yml` into the single PR convergence orchestration surface without creating a second Self-Healing authority. Existing specialist writers remain bounded actuators until their behavior is safely absorbed or retired.

The target control loop is:

`OBSERVE -> SNAPSHOT -> CORRELATE -> CLASSIFY -> LEASE -> ACT -> READBACK -> CONVERGED | BLOCKED | ESCALATED`

Final Pull Request merge remains Human Owner only.

## Invariants

- `/AGENTS.md@CURRENT_MAIN` remains the repository trust root.
- `SH-02.3` remains the Self-Healing finding/action/eligibility/convergence contract.
- Candidate code is never executed with write credentials.
- Every mutation is bound to one exact PR generation.
- Head, base, current main or control-plane movement invalidates prior generation evidence.
- Specialist writers do not become parallel control planes.
- Security, Compliance, provider and protected-production failures remain fail-closed.
- A skipped, blocked or unverified state is never represented as PASS.

## Work graph

| WP | Scope | Exit gate | State |
|---|---|---|---|
| CC-01 | Immutable PR generation identity | deterministic generation hash covers repository, PR, head, base, current main and control-plane version | MERGED_MAIN / PR #1134 |
| CC-02 | Shared writer lease + continuation generation lock | all PR writers share one lease namespace; dynamic post-merge sync revalidates canonical generation immediately before mutation | IMPLEMENTED_BRANCH / VALIDATION_PENDING |
| CC-03 | Dependency graph | stack, changed-file, semantic and authority edges are explicit and deterministic | QUEUED |
| CC-04 | Convergence decision reducer | one state reducer selects delegate/repair/block/escalate from observed evidence | QUEUED |
| CC-05 | Unified readback/evidence | every action records generation, before, intended delta, after and verification | QUEUED |
| CC-06 | Repair registry activation | only exact-signature trusted-main repairers with exact path allowlists can mutate | QUEUED |
| CC-07 | Specialist migration | duplicate orchestration is retired only after equivalent readback evidence | QUEUED |
| CC-08 | Fault/concurrency verification | stale event, competing writer, repeat repair and partial failure tests converge safely | QUEUED |

## CC-01 — Merged foundation

Introduce `scripts/pr/prConvergenceGeneration.mjs` as the canonical pure generation builder.

Generation identity binds:

- repository;
- Pull Request number;
- exact PR head SHA;
- exact base SHA;
- exact `CURRENT_MAIN` SHA;
- `AGENTS.md` Control Plane Version.

The current controller computes the generation from its trusted base checkout and carries it through classification/delegation/write evidence. Immediately before a registered write, the controller re-reads PR/main and the trusted `AGENTS.md` snapshot and recomputes the same generation. Any mismatch aborts before mutation.

A repository-scoped writer lease key is emitted as `capital-ai-pr-writer-<PR>`. CC-01 applied it to the controller's registered-write job and merged through PR #1134.

## CC-01 exit evidence

CC-01 is merged and validated when:

1. deterministic unit tests prove generation stability and invalidation;
2. the workflow regression test proves generation materialization and write-time revalidation;
3. current-main/base drift fails closed;
4. registered writes are serialized by the PR writer lease;
5. no existing specialist writer, Human merge gate or SH-02.3 authority is weakened.


## CC-02 — Shared writer lease + atomic continuation generation lock

This slice extends the DevelopmentChain rather than creating another orchestrator.

### Shared PR writer lease

The canonical lease namespace is:

`capital-ai-pr-writer-<PR_NUMBER>`

It now serializes:
- registered Convergence Controller writes;
- Current-State Baseline branch writes;
- deterministic legacy PR-CI branch writes;
- direct PR Production Baseline writes;
- post-deploy Production Baseline writes;
- post-merge Production Baseline writes;
- ready-for-review branch synchronization.

The dynamic post-correlation FIFO lane remains globally serialized because the target PR is selected at runtime. It compensates with exact generation/CAS readback immediately before mutation.

### Continuation generation lock

Before `update-branch`, the post-correlation lane:
1. binds exact `CURRENT_MAIN` and trusted `AGENTS.md`;
2. computes the canonical `capital-ai-pr-convergence-generation/1.0.0` identity through `scripts/pr/prConvergenceGeneration.mjs`;
3. re-reads live Main, PR head/ref/base/repository state immediately before mutation;
4. recomputes the generation and aborts on any mismatch;
5. checks whether CURRENT_MAIN is already an ancestor of the PR head;
6. submits `update-branch` only with the exact observed head SHA;
7. treats GitHub HTTP 422 as ambiguous and accepts it only when a second ancestry readback proves `ahead|identical`.

This closes the race observed after PR #1134, where a successor branch could be evaluated against a Main snapshot that moved during continuation. After PR #1136 merged, the canonical `self-healing-package-continuation.yml` is additionally generation-bound at its own READY/BLOCKED/COMPLETE issue-write boundary.

### Documentary correlation hardening

`documentary-change-impact.yml` no longer relies on an unauthenticated `git fetch origin main` after a credential-less checkout.

- current Main freshness is read through the GitHub API under `contents: read`;
- the push `before` commit is checked out separately with no persisted credential;
- its Git object is imported locally from that checkout;
- the transient nested checkout is removed before Documentary analysis/hygiene execution.

No token is persisted into the candidate working tree.

### CC-02 exit gate

CC-02 is complete only when hosted validation proves:
1. all changed workflow security checks pass;
2. the shared writer lease is present on every migrated writer;
3. stale Main/head movement invalidates the continuation generation before mutation;
4. 422 cannot be represented as convergence without ancestry evidence;
5. Documentary main correlation succeeds without persisted Git credentials;
6. no overlap or authority transfer into the active SH-02.4 or GitHub Desired-State PRs occurs.
