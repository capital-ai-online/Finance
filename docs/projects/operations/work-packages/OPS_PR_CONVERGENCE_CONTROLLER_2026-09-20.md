# OPS — PR Convergence Controller

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02`  
**Parent recovery contract:** `SH-02.3 / self-healing-contract/1.0.0`  
**Baseline:** `main@7c087994f8569028b05102dd426323f7a571ddad`  
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
| CC-01 | Immutable PR generation identity | deterministic generation hash covers repository, PR, head, base, current main and control-plane version | IMPLEMENTING |
| CC-02 | Shared writer lease | all branch/PR mutators use one repository-wide PR lease key | QUEUED |
| CC-03 | Dependency graph | stack, changed-file, semantic and authority edges are explicit and deterministic | QUEUED |
| CC-04 | Convergence decision reducer | one state reducer selects delegate/repair/block/escalate from observed evidence | QUEUED |
| CC-05 | Unified readback/evidence | every action records generation, before, intended delta, after and verification | QUEUED |
| CC-06 | Repair registry activation | only exact-signature trusted-main repairers with exact path allowlists can mutate | QUEUED |
| CC-07 | Specialist migration | duplicate orchestration is retired only after equivalent readback evidence | QUEUED |
| CC-08 | Fault/concurrency verification | stale event, competing writer, repeat repair and partial failure tests converge safely | QUEUED |

## CC-01 — Current slice

Introduce `scripts/pr/prConvergenceGeneration.mjs` as the canonical pure generation builder.

Generation identity binds:

- repository;
- Pull Request number;
- exact PR head SHA;
- exact base SHA;
- exact `CURRENT_MAIN` SHA;
- `AGENTS.md` Control Plane Version.

The current controller computes the generation from its trusted base checkout and carries it through classification/delegation/write evidence. Immediately before a registered write, the controller re-reads PR/main and the trusted `AGENTS.md` snapshot and recomputes the same generation. Any mismatch aborts before mutation.

A repository-scoped future writer lease key is emitted as `capital-ai-pr-writer-<PR>`. CC-01 applies it to the controller's own registered-write job; CC-02 migrates remaining specialist writers to that same key.

## Exit gate

CC-01 is complete only when:

1. deterministic unit tests prove generation stability and invalidation;
2. the workflow regression test proves generation materialization and write-time revalidation;
3. current-main/base drift fails closed;
4. registered writes are serialized by the PR writer lease;
5. no existing specialist writer, Human merge gate or SH-02.3 authority is weakened.
