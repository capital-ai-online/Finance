# OPS-SH02-POST-MERGE-ROADMAP-CLOSURE-01 — Post-Merge Roadmap Closure Correlation

**Project:** `CAPITAL-AI-OPS`  
**Owner:** `CAPITAL-AI-OPS`  
**PVC:** `PVC-02 / PVC-04 / PVC-18`  
**Parent:** `OPS-08-B-SH-02`  
**Slice:** `SH-02.13`  
**Planning baseline:** `main@be33bde31d9e96d8cb306086428f90036350d8ea`  
**Implementation baseline:** `main@b4fe15600a20e22c0b5d58f8d358888491cdf0a0`  
**State:** `IMPLEMENTATION_ON_BRANCH / CURRENT_MAIN_CORRELATED / HUMAN_MERGE_REQUIRED`

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

## Implementation materialization — 2026-09-26

The fresh implementation branch `agent/operations-sh02-13-roadmap-closure-implementation-20260926` started from `36fd8502178f42fd3b20562f4f60290fcbb2d11f` and is synchronized through exact CURRENT_MAIN `b4fe15600a20e22c0b5d58f8d358888491cdf0a0` and materializes the existing plan without creating a peer control plane:

1. `src/platform/Supervisor/postMergeRoadmapClosure.ts` is the pure evidence-bound closure contract. It derives exactly the four planned states, detects owner-local vs foreign-owner documentation drift, binds the closure fingerprint and suppresses replay/closure-sync recursion.
2. The existing `.github/workflows/self-healing-package-continuation.yml` gains one read-only post-merge correlation step. It still runs only after successful Post-Merge Production Correlation, uses no checkout and has no contents-write/approval/merge authority.
3. The workflow correlates changed/claimed canonical work-package paths against their current-main documentation state, merged claim lifecycle and the leading `docs/architecture/ROADMAP.md` reference.
4. Deterministic drift remains the existing `REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT -> RECONCILE_REPOSITORY_PROJECTION` class. The workflow records one generation-bound, deduplicated non-authorizing issue; it does not itself write Roadmap files.
5. Foreign-owner drift is explicitly `OWNER_CORRECT_HANDOFF`; OPS does not mutate a GOV/SEC/QM/COMP/FE/FINTECH/CLIENT/DOC owner package merely because it detects the mismatch.
6. Unit regressions cover terminal, evidence-gated, partial, ambiguous, foreign-owner, replay and closure-sync cases.

### Bootstrap drift reconciliation on CURRENT_MAIN

| Merged work | Owner | Repository evidence | Work-package state after this slice | Leading-Roadmap disposition |
|---|---|---|---|---|
| PR #1463 — Security Posture + Render API Hardening | CAPITAL-AI-OPS | exact-head CI/Governance/Container/Project/PR evidence PASS; merge `82f50a97...` | `MERGED_MAIN / EVIDENCE_GATE / PROVIDER_READBACK_PENDING` | owner-local closure entry; provider gates remain open |
| PR #1465 — Production Release Authority Supersession | CAPITAL-AI-GOV | exact-head required evidence PASS; merge `bc42ef4b...` | foreign-owner package/claim still needs GOV closure | leading Roadmap records `OWNER_CORRECT_HANDOFF`; OPS does not rewrite GOV package |
| PR #1466 — Auth-Session / Profilnavigation | CAPITAL-AI-OPS | exact-head CI #6588, Governance #6100, Container #3571, Project #884, PR #967 PASS; merge/current-main `36fd850...` | `DONE_MAIN / TERMINAL` | owner-local terminal closure entry |
| PR #1467 — Supabase Migration Ledger | CAPITAL-AI-OPS | exact-head CI #6595, Governance #6106, Container #3578, Project #891, PR #973 PASS; Supabase Preview `skipped`; merge `b4fe1560...` | `MERGED_MAIN / EVIDENCE_GATE / SUPABASE_PREVIEW_NOT_PROVEN` | owner-local closure entry; provider Preview/readback remains open |

PR #1467 merged after this implementation branch started and was absorbed by a fresh-main synchronization. Its package and claim are now part of the bootstrap closure correlation; the provider Preview gate remains explicitly non-PASS.

## Implementation plan

1. Define a pure post-merge closure-correlation contract and normalized states. **IMPLEMENTED_ON_BRANCH**
2. Bind merged-PR metadata to canonical work-package identity or fail closed. **IMPLEMENTED_ON_BRANCH**
3. Evaluate repository vs downstream evidence without collapsing missing evidence into PASS. **IMPLEMENTED_ON_BRANCH**
4. Correlate persistent package state, leading Roadmap state and claim lifecycle. **IMPLEMENTED_ON_BRANCH**
5. Reuse the existing repository-projection drift/action lane; create no second writer. **IMPLEMENTED_ON_BRANCH**
6. Add idempotency/recursion guards and owner-correct handoff behavior. **IMPLEMENTED_ON_BRANCH**
7. Add deterministic tests for complete, partial, ambiguous, foreign-owner and evidence-gated merges. **IMPLEMENTED_ON_BRANCH**

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
- a touched canonical Roadmap/current-state projection with a stale main baseline is refreshed owner-correctly to exact CURRENT_MAIN; the governance freshness validator remains unchanged and fail-closed.

## Human boundary

This implementation adds correlation and non-authorizing issue evidence only. It does not grant a new repository writer or automatic mutation capability. Persistent Roadmap/work-package/claim reconciliation remains branch-only through the existing bounded repository-projection path and still requires exact-head validation plus Human/CODEOWNER merge.
