# OPS-SH02-PR-EVIDENCE-CASCADE-01 — Generation-aware PR Evidence Convergence Planning

**Project:** `CAPITAL-AI-OPS`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-08, PVC-18`  
**Parent:** `OPS-08-B-SH-02 — Autonomous Self-Healing Backend & Frontend`  
**Baseline:** `main@67f9be45e41d78ca5d5c58f9be860d1887e4afad`  
**Status:** `PLANNED / OWNER_DIRECTED / NO_NEW_ACTION`  
**Priority:** P0  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Goal

Integrate the repeated PR convergence behavior observed in PRs #1371, #1373, #1374, #1375, #1376 and #1380 into the existing Self-Healing plan without adding a second PR-body writer, repository-projection writer, cadence writer, workflow, finding namespace, remediation action or merge authority.

The planning target is a deterministic **generation-aware evidence cascade** across the already-existing bounded paths:

- `REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT -> RECONCILE_REPOSITORY_PROJECTION`;
- `REPOSITORY_PR_DECISION_EVIDENCE_DRIFT -> RECONCILE_PR_DECISION_EVIDENCE`;
- registered cadence repair `MERGE_CADENCE_PATCH_V1` through the existing Release Version Gate.

## Observed evidence

| PR | Observed failure | Existing bounded fix | Planning implication |
|---|---|---|---|
| #1371 | canonical v1.8 Production-baseline IDs were missing; after the first repair trusted Production moved and the earlier baseline became stale | PR Decision Evidence Reconciler / canonical Production preflight | missing structure and later Production movement are separate generations of the same PR-body convergence path, not separate writers |
| #1373 | initial PR body still carried provisional `NOT_RUN` evidence and lacked the canonical machine baseline IDs | `RECONCILE_PR_DECISION_EVIDENCE` | post-create evidence bootstrap should converge automatically from provisional state to exact trusted baseline |
| #1374 | Full Suite failed with `CURRENT_STATE_PROJECTION_BASELINE_STALE`; the existing baseline specialist wrote head `4a960492d2ccd30e1b4879a8a3931bfb5b68dc75`, invalidating the prior PR-body baseline | `RECONCILE_REPOSITORY_PROJECTION` followed by `RECONCILE_PR_DECISION_EVIDENCE` | a repository projection repair that changes head must hand the new generation to PR-body convergence |
| #1375 | Documentary Roadmap baseline was repaired on head `acbf52c098fbfe7446409b278c7909a125c8dde5`; Governance then required a newly bound Production baseline | the same two existing SH-1 paths | the #1374 cascade is reproducible across projects and is not FE-specific |
| #1376 | fixed 10-merge gate failed at `mergeOrdinal=29`; existing cadence semantics required PATCH `0.6.3`; version materialization changed the PR head, the current-state baseline then required another head mutation, and PR-body Production evidence had to rebind again before CI/Governance passed | `MERGE_CADENCE_PATCH_V1` + `RECONCILE_REPOSITORY_PROJECTION` + `RECONCILE_PR_DECISION_EVIDENCE` | multiple already-authorized repairers need generation-aware sequencing; final Decision Evidence must follow the final exact-head check generation |
| #1380 | CI exposed `CURRENT_STATE_PROJECTION_BASELINE_STALE` for the OPS Roadmap after main moved to `bac6f422...`; the existing baseline specialist created head `a0ab9e29...`, which invalidated PR-body Production evidence. A fresh edited-event Governance run then passed after exact baseline rebinding. The automatically scheduled Decision Evidence Reconciler started, but the Human/CODEOWNER merge completed at 04:56:43Z before bootstrap readback at 04:56:48Z; the writer rejected the now-closed PR with no mutation. | `RECONCILE_REPOSITORY_PROJECTION` + `RECONCILE_PR_DECISION_EVIDENCE` + terminal-state fail-closed boundary | The generation cascade is valid; PR terminal state is an explicit convergence boundary and must suppress post-merge body mutation. |

## Generation identity

Repository/PR convergence is bound to the evidence tuple:

`(CURRENT_MAIN, PR_HEAD, PR_BASE, PRODUCTION_SHA, CONTROL_PLANE_GENERATION, PR_TEMPLATE_VERSION, PLATFORM_VERSION/CADENCE_GENERATION)`.

This tuple is an evidence identity only. It does not create a second registry, task authority or control plane.

A material change to any tuple member invalidates earlier derived evidence. The same existing bounded action may execute once for the newly correlated generation. Repeating the same action against the unchanged generation remains fail-closed.

## Planned convergence sequence

### 1. Detect

Use exact registered/reproducible failure evidence only:

- Governance missing, malformed or stale Production-baseline / Decision-Evidence;
- CI `CURRENT_STATE_PROJECTION_BASELINE_MISSING|STALE` on changed canonical project `ROADMAP.md` / `TASK_REGISTER.md`;
- registered `MERGE_CADENCE_PATCH_V1` at the fixed 10-merge boundary.

Unknown or ambiguous failures remain blocked/escalated.

### 2. Remediate with the existing owner

- PR-body evidence drift remains owned exclusively by `RECONCILE_PR_DECISION_EVIDENCE`.
- Current-state repository projection drift remains owned exclusively by `RECONCILE_REPOSITORY_PROJECTION` / the Current-State Baseline Autofix.
- Cadence PATCH materialization remains owned exclusively by the registered `MERGE_CADENCE_PATCH_V1` repairer and existing Release Version Gate.
- No generic Issue-to-code executor is activated.

### 3. Rebind after every repository mutation

After any eligible repair creates a new PR head:

1. re-read `CURRENT_MAIN`;
2. verify non-force write, exact previous-head ancestry and current-main containment;
3. recompute the convergence generation;
4. run the ordinary exact-head CI path;
5. repair a canonical project current-state baseline only through its existing specialist when reproducibly stale;
6. after the repository head is stable, rebind PR-body Production/Decision Evidence to that final head through the existing Decision Evidence Reconciler;
7. consume exact-head Governance, CI and Security results;
8. refresh the PR Decision projection after the latest Required Check becomes terminal.

A successful mutation is not convergence by itself.

### 4. Final decision-state convergence

The #1376 sequence exposed an additional projection race: required checks can become PASS while the visible PR Decision block still reflects a previous `BLOCKED` generation. PR #1380 adds the terminal-race boundary: a scheduled body reconciliation may become obsolete because the Human/CODEOWNER merge closes the PR before the writer obtains its bootstrap snapshot.

Planning therefore requires the final PR-body Decision Evidence to be derived from the latest exact-head terminal check set. Merge readiness must not rely on a stale body generation that still reports a superseded failure.

If the PR is no longer open when the single writer binds its bootstrap snapshot, reconciliation must stop with no body mutation. That terminal no-write outcome is convergence-safe and must not be reported as a failed product repair. This requirement does not grant merge authority and does not change Human/CODEOWNER or current repository merge contracts.

## Ownership and open-writer boundary

The formerly blocking writers are now terminal:

- PR #1377 merged as `adcd5609b0db58627fb2d89e58d32f7054baf918`;
- PR #1378 merged as `bac6f4224cdb4f570c415c1310a264b3081756e6`;
- PR #1380 merged as `67f9be45e41d78ca5d5c58f9be860d1887e4afad`;
- closed/unmerged #1379 remains historical evidence only.

Implementation selection must reread `CURRENT_MAIN`, deduplicate these merged outcomes and preserve their single-writer boundaries.

## Future implementation acceptance criteria

1. A #1373-shaped missing-baseline fixture delegates only to `RECONCILE_PR_DECISION_EVIDENCE`.
2. A #1371-shaped Production movement after a previously valid body is classified as a changed generation, not an infinite-loop repeat.
3. A #1374/#1375-shaped stale project baseline is repaired only by the existing baseline specialist, and the resulting new head automatically receives PR-body evidence rebind before merge readiness.
4. A #1376-shaped cadence PATCH repair can be followed by current-state baseline convergence and final PR-body rebind without manual file/body intervention.
5. Final Decision Evidence reflects terminal exact-head Required Checks rather than a superseded failed run.
6. Same-generation repeats are blocked.
7. No second PR-body writer, baseline writer, version writer, workflow or Self-Healing action is created.
8. No SH-02.12 activation occurs.
9. Protected provider/Production actions remain excluded.
10. Exact-head required checks and merge-authority boundaries remain unchanged.
11. A reconciliation scheduled before merge but reading the PR after terminal merge/close exits no-write and is treated as a safe terminal race, not an invitation to reopen or mutate the PR.

## Non-goals

- automatic merge or merge-authority expansion;
- generic code remediation from Issue text;
- production deploy/redeploy activation;
- rollback/restore activation;
- broad free-form CI autofix;
- a new Self-Healing runtime-contract or fault-suite generation in this planning slice.
