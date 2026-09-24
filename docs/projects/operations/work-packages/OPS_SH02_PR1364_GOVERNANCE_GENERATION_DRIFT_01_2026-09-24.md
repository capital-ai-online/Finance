# OPS-SH02-PR1364-GOVERNANCE-GENERATION-DRIFT-01

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Supporting PVC:** `PVC-08`, `PVC-18`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Execution baseline:** `main@31625df9bf114e689ec359fc5e8aecafc5a7026d`  
**Status:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING`

## Goal

Bind the real PR #1364 Governance failure sequence into the existing PR Self-Healing convergence architecture without adding a second writer, workflow, remediation action, finding namespace, or fault-suite generation.

## Observed provider evidence

PR #1364 stayed on the same code head while its PR-body evidence moved through three Governance runs:

1. Governance #5671 failed because the v1.8 body did not contain all three canonical visible H2 sections.
2. The existing PR Decision Evidence Reconciler repaired the structure.
3. PR #1363 had merged as `06e018a983897494925e70d1987fb0751cc70bb6`, but Render Production did not move to that SHA until deploy `dep-daq8qkh7lnhs73c453i0` ran from `02:39:14Z` to `02:40:41Z`.
4. Governance #5672 then correctly rejected the earlier PR-body baseline as stale after Production identity changed.
5. The same Decision Evidence Reconciler refreshed the production baseline; Governance #5673 passed without a PR code-head change.

The second failure is therefore a **new evidence generation caused by external Production movement**, not proof of a second PR-body writer or a failed atomic structure/baseline write.

## Existing architecture reused

The current executable contract already maps both relevant conditions to the same bounded action:

- v1.8 Decision/Evidence structure drift → `REPOSITORY_PR_DECISION_EVIDENCE_DRIFT`;
- stale Production baseline → `REPOSITORY_PR_DECISION_EVIDENCE_DRIFT`;
- preferred action → `RECONCILE_PR_DECISION_EVIDENCE`;
- tier → `SH-1`;
- activation → `ENABLED`;
- budget → one bounded attempt per correlated generation;
- verification → `exact-pr-body-convergence-readback`;
- writer → the existing PR Decision Evidence Reconciler under the shared per-PR writer lease.

`RECONCILE_PR_GOVERNANCE_METADATA` remains superseded/HELD. No new remediation action is created.

## Implementation slice

- add a classifier regression that models the exact #1364 sequence and proves both failures route to the same finding/action;
- add a Decision Evidence regression that proves a Production identity change after a prior valid projection is treated as a new baseline generation, replaces the previous baseline exactly once, and becomes idempotent after convergence;
- record the observed provider timeline as reusable evidence;
- project the finding into the parent SH-02 work package without modifying `self-healing-contract/1.2.0` or `sh-02.10-fault-convergence/1.3.0`;
- release the stale terminal #1306 coordination claim when touched, preserving its terminal PR/merge provenance.

## Acceptance criteria

- exact #1364 structure and stale-baseline messages remain separately classifiable but resolve to the same Self-Healing action;
- a changed Production identity produces a different baseline ID and replaces the previous canonical baseline in one body projection;
- the newly converged body contains exactly one machine-readable baseline block;
- repeating the same generation is idempotent;
- no workflow or productive Self-Healing contract/fault-suite file changes;
- no overlap with open PR #1367 or #1369;
- final branch is re-correlated to fresh CURRENT_MAIN and hosted exact-head checks are reported truthfully;
- final merge remains Human/CODEOWNER-only.
