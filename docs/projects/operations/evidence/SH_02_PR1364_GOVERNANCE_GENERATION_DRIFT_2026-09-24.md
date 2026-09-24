# SH-02 PR #1364 Governance Generation-Drift Evidence — 2026-09-24

**Baseline:** `main@31625df9bf114e689ec359fc5e8aecafc5a7026d`  
**Project:** `CAPITAL-AI-OPS`  
**PVC:** `PVC-02` with `PVC-08/PVC-18` support  
**Observed PR:** `#1364`  
**Classification:** PR Decision/Evidence Self-Healing generation drift

## Provider-observed sequence

| Evidence | Observation | Meaning |
|---|---|---|
| Governance #5671 / run `35947859162` | `PR #1364 enthält nicht alle Pflichtabschnitte ... ## 1 ... ## 2 ... ## 3 ...` | v1.8 structure/Decision-Evidence drift |
| PR #1363 merge | merge commit `06e018a983897494925e70d1987fb0751cc70bb6`, created `2026-09-24T02:34:29Z` | repository generation moved before Production |
| Render deploy | `dep-daq8qkh7lnhs73c453i0`, started `02:39:14Z`, finished live `02:40:41Z` on `06e018a98389...` | Production identity changed after the first #1364 repair generation |
| Governance #5672 / run `35948256539` | stale/incorrect Production baseline; expected baseline ID `sha256:45628ef9381b8f6827d00c50b33d19da7a31d46ed032cfc040158f783319c2aa` | previous body evidence became stale because Production moved |
| final #1364 baseline | generated `2026-09-24T02:41:27.475Z`, Production/main `06e018a98389...` | new generation bound to new Production identity |
| Governance #5673 / run `35948361215` | PR template v1.8 and baseline PASS | convergence verified on unchanged PR code head |

## Root cause

The observed pair of Governance failures does **not** demonstrate that structure repair left a stale baseline in the same immutable environment. The environment changed between generations:

`Repository main moved → first structure healing → Render Production moved → previous Production baseline became stale → second bounded evidence reconciliation`.

This distinction matters for Self-Healing budgets. Repeating the same repair against the same generation would be a loop and must fail closed. Re-running the same bounded action after a material generation input changes is a new remediation generation and must bind new evidence before writing.

## Canonical Self-Healing mapping

Both observed errors remain under one existing action:

`REPOSITORY_PR_DECISION_EVIDENCE_DRIFT → RECONCILE_PR_DECISION_EVIDENCE`

No second action is needed. The single writer remains:

`PR Decision Evidence Reconciler → STRUCTURE_REPAIR → PRODUCTION_BASELINE → GOVERNANCE_METADATA → DECISION_EVIDENCE → ATOMIC_BODY_WRITE`.

The existing action remains `SH-1 / ENABLED / IDEMPOTENT / maxAttempts=1` with `exact-pr-body-convergence-readback`.

## Regression added by this slice

1. The exact #1364 missing-section and stale-baseline errors are asserted to resolve to the same finding/action.
2. Decision Evidence projection is exercised across two different trusted Production baseline IDs while head/main identity remains stable.
3. The second generation must replace the first baseline, leave exactly one canonical baseline block, and become idempotent on replay.
4. The independently assured `self-healing-contract/1.2.0` and `sh-02.10-fault-convergence/1.3.0` are not mutated.

## Boundary

This slice adds evidence and regression coverage only. It creates no new workflow, writer, runtime recovery capability, Production mutation authority, merge authority, or Self-Healing fault scenario.
