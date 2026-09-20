# SH-02.3E — Evidence Integrity & Control-Panel Projection

**Project:** `CAPITAL-AI-OPS`  
**Parent:** `OPS-08-B-SH-02 / SH-02.3 / self-healing-contract/1.0.0`  
**Primary PVC:** `PVC-08`; supporting `PVC-02`, `PVC-04`, `PVC-18`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@ac45e05da2e2c4eb95dd2cd63d0e22712538a5c2`  
**Branch:** `agent/operations-sh02-3e-evidence-integrity-main-sync-20260920`  
**Dependency:** open PR #1147 owns the parent SH-02 architecture/work-graph projection paths; this slice has zero changed-file overlap with those paths and must be re-correlated after #1147 changes state.  
**Status:** `IMPLEMENTED_BRANCH / VALIDATION_PENDING / DEPENDENCY_CORRELATION_REQUIRED`

## Purpose

Strengthen the existing Self-Healing state machine without creating an Evidence control plane, duplicate work registry, parallel READY/PASS semantics or new merge authority.

The canonical execution relationship remains:

`/AGENTS.md@CURRENT_MAIN → CAPITAL-AI-ASH-01 → self-healing-contract/* → SH-02 work packages → remediation → verification/evidence/readback → Control Panel projection → Human Owner merge`.

The Control Panel is a read-only orchestration projection. It may visualize canonical work-package declarations and effective PVC-18 trace state, but it cannot manufacture task state, Evidence, authorization, readiness, verification, convergence or merge authority.

## Evidence Integrity Invariant

No relevant `PASS`, `VERIFIED`, `CONVERGED` or `READY` claim may exist unless its evidence is simultaneously:

1. reproducible;
2. current;
3. bound to an immutable generation identity;
4. traceable to an authoritative observed source;
5. integrity-bound through stable SHA-256 digests;
6. read back after mutation when readback is required;
7. contradiction-free;
8. independently assured by QM/Security where the action or domain requires it.

Missing or invalid evidence fails closed. Explicit non-positive states include `PENDING`, `NOT_EXECUTED`, `NOT_AVAILABLE`, `STALE`, `IDENTITY_MISMATCH`, `READBACK_FAILED`, `BLOCKED` and `FAIL`.

## Work graph entry

| WP | Scope | Owner/PVC | Dependencies | Exit gate | State |
|---|---|---|---|---|---|
| SH-02.3E | Evidence Integrity + read-only Control Panel projection | OPS / PVC-08,18 | SH-02.3 | bare PASS cannot converge; evidence generation/source/integrity/readback predicates are mandatory; SH-3 requires independent QM + Security assurance; Control Panel derives package declarations from canonical work-package documents and effective state only from PVC-18 | IMPLEMENTED_BRANCH / VALIDATION_PENDING |

This child package is intentionally materialized separately while PR #1147 owns the parent SH-02 architecture/work-package files. After #1147 reaches a terminal state, the parent work graph may consume this child entry through normal current-main correlation; this file never becomes a second Self-Healing authority.

## Implementation

### Executable Self-Healing contract

`src/platform/Supervisor/selfHealingContract.ts` remains the only finding/action/eligibility/convergence contract.

This slice adds:

- `self-healing-evidence/1.0.0` as a subordinate evidence schema inside that contract;
- PR/runtime/provider generation identities;
- authoritative source identity and observation timestamp;
- input/result/record SHA-256 integrity identities;
- reproducibility/current/generation/source/integrity predicates;
- mandatory post-mutation readback semantics;
- contradiction detection;
- required QM/Security assurance states;
- explicit non-positive verification states;
- fail-closed `VERIFICATION_EVIDENCE_INVALID` semantics.

A `VerificationResult.status === PASS` is no longer sufficient for convergence.

### Independent assurance

Self-Healing consumes independent assurance; it does not self-issue it.

- Required assurance domains are expressed as `QM` and/or `SECURITY`.
- A required assurance domain must be `VERIFIED`.
- SH-3 protected rollback/restore requires both QM and Security assurance before `CONVERGED` can be emitted.
- This does not transfer Security or QM ownership to OPS.

### Control Panel

The existing Admin Process Graph is extended as a read-only presentation consumer:

- canonical SH-02 package rows are parsed from repository work-package documents;
- the new SH-02.3E child package is parsed from this file;
- declared document state is displayed explicitly as projection-only metadata;
- effective state remains `UNKNOWN — fail closed` unless supplied by the canonical PVC-18 `OperationalTraceStateEnvelope`;
- dependency edges are derived from package declarations;
- the browser gains no decision, mutation, merge, deployment or evidence authority.

## Parallel-writer boundary

Open PR #1147 changes:

- `docs/architecture/AUTONOMOUS_SELF_HEALING_PLATFORM.md`;
- `docs/projects/operations/ROADMAP.md`;
- `docs/projects/operations/WORK_PACKAGES.md`;
- `docs/projects/operations/work-packages/OPS_08_B_SH_02_AUTONOMOUS_SELF_HEALING_PLATFORM_2026-09-20.md`;
- related policy-homogeneity claim/evidence/test paths.

SH-02.3E intentionally changes none of those files. Semantic dependency is explicit and must be re-read before readiness.

## Exit gates

SH-02.3E is eligible for `READY_FOR_HUMAN_DECISION` only when:

- exact current-main correlation is fresh;
- #1147 is re-correlated and no changed-file/authority conflict exists;
- focused Self-Healing contract tests pass;
- Process Graph projection tests pass;
- TypeScript/build and required hosted checks for the exact final head pass;
- a bare or stale `PASS` demonstrably cannot produce `VERIFIED` or `CONVERGED`;
- required SH-3 QM/Security assurance is fail-closed;
- the Control Panel remains projection-only;
- no auto-merge or Human Owner authority is introduced.

Final merge remains Human/CODEOWNER-only.
