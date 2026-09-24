# OPS-SH02-POST-MERGE-ROADMAP-CLOSURE-01 — Post-Merge Roadmap Closure Correlation

**Project:** `CAPITAL-AI-OPS`  
**Owner:** `CAPITAL-AI-OPS`  
**PVC:** `PVC-02 / PVC-04 / PVC-18`  
**Parent:** `OPS-08-B-SH-02`  
**Slice:** `SH-02.13`  
**Baseline:** `main@be33bde31d9e96d8cb306086428f90036350d8ea`  
**State:** `PLANNED / OWNER-DIRECTED / IMPLEMENTATION_NOT_STARTED`

## Outcome

After every Human/CODEOWNER merge into `main`, the existing post-merge convergence path shall correlate the new exact `CURRENT_MAIN` against the canonical Roadmap and work-package identities affected by the merged Pull Request. A work item may be projected as complete only when the merged result satisfies its explicit exit evidence and all required post-merge evidence gates.

The design extends the existing Self-Healing/Post-Merge convergence model. It does not create a second Roadmap authority, backlog, scheduler, writer, Supervisor, merge plane or direct-main mutation path.

## Required correlation

For a merged Pull Request the correlator must bind one immutable generation containing at least:

- merged PR number and exact merge commit SHA;
- fresh `CURRENT_MAIN` and proof that the merge commit is reachable from it;
- canonical Project, Owner and PVC resolved from current main;
- canonical Roadmap/work-package identity carried by trusted repository metadata;
- work-package exit gate and acceptance criteria from current main;
- exact required-check and repository evidence attributable to the merged head;
- post-merge Production/runtime evidence when the work package explicitly requires it.

PR body text, comments, historical branches and stale work claims are evidence only. They cannot independently create a work-package identity or mark work complete.

## Completion states

The post-merge correlator is fail-closed:

- `DONE_MAIN / TERMINAL`: every required repository exit criterion is proven and no required downstream evidence remains.
- `MERGED_MAIN / EVIDENCE_GATE`: code is on current main, but an explicit Production/runtime/Security/QM/Compliance/domain exit criterion is still pending.
- `PARTIAL_MAIN / ACTIVE`: the merged PR completes only part of the canonical work package.
- `BLOCKED_CORRELATION`: work-package identity, Owner/PVC, exit evidence or generation binding is missing, ambiguous or contradictory.
- already-terminal work with the same closure fingerprint is a no-op.

No state may be upgraded from missing, `NOT_RUN`, `BLOCKED` or failed evidence.

## Immediate live state vs persistent repository state

“Directly erledigt” is implemented in two bounded layers:

1. **Immediate read-only projection.** The existing exact-`CURRENT_MAIN` live Roadmap projection may derive a terminal display state immediately after the merged generation is verified. This is non-authorizing and performs no repository write.
2. **Persistent canonical reconciliation.** If a canonical `ROADMAP.md`, work-package file or associated active work claim requires status materialization, the existing branch-only repository repair/continuation lane creates one bounded follow-up change. That change still requires ordinary validation and Human/CODEOWNER merge before it becomes current main.

Direct commits to `main`, agent self-merge and a special Roadmap bypass are prohibited.

## Idempotency and recursion protection

The closure fingerprint is derived from:

`(mergedPrNumber, mergeCommitSha, workPackageId, exitEvidenceDigest)`.

The same fingerprint must never create a second reconciliation mutation. A Roadmap-closure synchronization PR is metadata convergence only and must not recursively create a new productive work item or re-close the work package that caused it.

Associated stale work claims are released when touched after terminal merge state (`status=released`, `exclusive=false`) according to the current trust root.

## Ownership boundary

The correlator may read application-wide Roadmap/work-package state, but productive mutation remains owner-correct. A foreign-owner Roadmap or work package is returned as an owner-correct handover with exact identity, evidence, dependency and exit condition; OPS does not silently seize foreign project scope.

Security, Compliance, QM, domain and protected-provider gates remain independent and fail closed. Human/CODEOWNER merge remains final authority.

## Reuse requirements

Implementation must preferentially extend the existing paths rather than add peers:

- Post-Merge Production Correlation / canonical continuation lane;
- `REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT -> RECONCILE_REPOSITORY_PROJECTION`;
- exact-`CURRENT_MAIN` live Roadmap state projection;
- canonical Project/Owner/PVC resolution;
- existing work-claim and overlap semantics.
- canonical PR Decision Evidence Reconciler and its Production-Baseline specialist for PR-body projection drift.

When required-check evidence disagrees, SH-02.13 must classify the failing
surface before remediation. A successful exact-head build/test does not justify
rewriting a failed Governance gate as PASS. Deterministic PR-body projection
drift is handed to `CAPITAL-AI-GOV / PVC-05` and, once corrected, the affected
PR is re-correlated against fresh CURRENT_MAIN and fresh exact-head Governance
evidence. The observed #1403/#1405 marker-free v1.8 baseline bootstrap is the
reference regression case.

No new generic scheduler, queue, workflow family, Roadmap registry or merge authority is permitted.

## Implementation plan

1. Define a pure post-merge closure-correlation contract and normalized states.
2. Bind merged-PR metadata to exactly one canonical work-package identity or fail closed.
3. Evaluate exit evidence, including downstream gates explicitly required by the package.
4. Feed the verified state into the existing live Roadmap projection.
5. Reuse the existing branch-only repository-projection repair path for persistent terminalization and work-claim release.
6. Add idempotency/recursion guards and owner-correct handoff behavior.
7. Add deterministic tests for complete, partial, ambiguous, stale, foreign-owner and evidence-gated merges.

## Acceptance / exit evidence

SH-02.13 is complete only when tests prove all of the following:

- a fully completed merged PR becomes terminal only after fresh `CURRENT_MAIN` correlation;
- a partial merge cannot close its parent work package;
- a required Production/runtime/Security/QM/Compliance/domain gate prevents premature completion;
- missing or ambiguous work-package identity fails closed;
- foreign-owner scope produces handoff rather than local mutation;
- replaying the same closure fingerprint is idempotent;
- closure-sync PRs cannot recursively create closure work;
- persistent repository changes remain branch-only and Human/CODEOWNER-merged;
- the live Roadmap projection can reflect verified completion without direct-main mutation;
- no second Roadmap/Self-Healing/control plane is introduced.
- build/test PASS plus Governance FAIL is preserved as two distinct evidence states rather than collapsed into one result;
- the #1403 marker-free v1.8 Production-Baseline regression routes to the existing GOV single-writer repair and cannot create an OPS-side PR-body writer;
- after the GOV repair is Human-merged, #1403 is re-correlated on fresh CURRENT_MAIN/exact-head evidence before its work-package state can advance.

## Human boundary

This planning slice changes documentation/projection only. It does not activate a new automatic mutation capability. Productive implementation and any later persistent Roadmap reconciliation remain subject to current `/AGENTS.md@CURRENT_MAIN`, exact-head validation and Human/CODEOWNER merge.
