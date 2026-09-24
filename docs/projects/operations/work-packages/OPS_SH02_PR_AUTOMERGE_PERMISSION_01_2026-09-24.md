# OPS-SH02-PR-AUTOMERGE-PERMISSION-01

**Project:** CAPITAL-AI-OPS  
**Owner/PVC:** CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-08, PVC-18  
**Parent:** OPS-08-B-SH-02  
**Baseline:** main@42001c9968d7f0907d98781920b66e19c6a48265  
**State:** IMPLEMENTED_ON_BRANCH

## Observed failure

PR #1381 produced a stale Production-Baseline Governance failure on exact head
`5910c18ed51c13951ff916190a93fd893ec658a9`.

The leading PR Decision Evidence Reconciler did start and successfully generated
the expected fresh baseline
`sha256:2c4b33dc25b4e51933e24ba3e6605774eedba36de2a69a17e91cc95230f2c4cd`.
Before the body PATCH, however, run `35958041567` / job `107500472507`
attempted to disable the already-active GitHub auto-merge request and failed with:

`GitHub auto-merge mutation failed: Resource not accessible by integration`

The workflow job had `pull-requests: write` but only `contents: read`.
The resulting provider-mutation failure correctly stopped the body write, so the
stale baseline remained visible and PR Governance stayed red.

## Fix

The existing single leading writer remains unchanged architecturally. Its
`reconcile` job receives `contents: write` in addition to the existing
`pull-requests: write`, because the GitHub GraphQL auto-merge enable/disable
mutation requires that capability in this integration context.

No candidate code is executed with write credentials. Trusted CURRENT_MAIN code
continues to perform classification, preflight, evidence reconciliation and the
provider mutation.

## Safety invariants

- no second PR-body writer or autofix workflow;
- no bypass if auto-merge cannot be disarmed;
- no body PATCH while an unsafe provider auto-merge state cannot be reconciled;
- Human/CODEOWNER merge authority remains unchanged;
- compatibility baseline workflows remain read-only observers/relays.

## Exit evidence

- workflow permission is explicit and scoped to the existing reconcile job;
- regression test verifies both the permission and the existing
  `disablePullRequestAutoMerge` path;
- workflow-security and exact-head CI/Governance must pass;
- after merge, PR #1381 is re-correlated and must converge its stale baseline
  without the prior integration-permission failure.
