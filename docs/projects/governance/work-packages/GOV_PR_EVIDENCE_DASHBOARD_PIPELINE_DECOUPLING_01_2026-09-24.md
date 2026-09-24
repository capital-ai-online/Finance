# GOV-PR-EVIDENCE-DASHBOARD-PIPELINE-DECOUPLING-01

**Project:** CAPITAL-AI-GOV  
**Owner/PVC:** CAPITAL-AI-GOV / PVC-05  
**Requested:** 2026-09-24  
**State:** IMPLEMENTED_ON_BRANCH / HUMAN_MERGE_REQUIRED  
**Branch:** `agent/governance-evidence-dashboard-pipeline-decoupling-20260924`  
**Base:** `main@332861e4ae19f80c3bdc15dccf3733cdc52c265f`

## Problem

The leading PR Decision Evidence Reconciler writes dynamic Live Dashboard, Decision Evidence and Production-Baseline state into an open PR body. The Required `PR Governance` workflow currently treats `pull_request.edited` as a validation trigger and also regenerates Production Preflight state before validating those dynamic body values.

That couples a read-only Evidence projection to real Required pipeline execution. A body-only Evidence refresh can therefore consume runner minutes or turn Governance red even though the PR code snapshot and build/test result did not change.

## Bounded repair

The existing writer topology is preserved. No second PR-body writer, scheduler or merge authority is added.

1. `PR Governance` no longer subscribes to `pull_request.edited`.
2. Its concurrency identity is exact PR number + head SHA + base SHA, not body action.
3. The Required Governance runner no longer executes `productionPreflight.mjs`.
4. `validatePrBody.mjs` supports `PR_BODY_VALIDATION_MODE=static-contract`.
5. In `static-contract` mode the Required gate still fails closed on:
   - canonical template version;
   - exactly three required top-level sections;
   - technical traceability containers;
   - priority/version metadata;
   - unresolved template placeholders;
   - durable Work-Claim evidence where applicable;
   - explicit Human/CODEOWNER merge boundary.
6. Dynamic Decision status, dashboard synchronization and Production-Baseline identity are excluded from the Required Governance decision in this mode.
7. Full validator mode remains available for explicit dynamic-evidence verification outside the Required PR Governance gate.
8. The existing PR Decision Evidence Reconciler remains the only mutable owner of Live Dashboard / Decision Evidence / Production Baseline.

## Cost and failure effect

A Reconciler body PATCH no longer creates a fresh Required Governance runner lifecycle. Production health is not queried by the Required Governance runner merely to validate a projection. Code changes still trigger the Required Governance check normally.

This separates:
- **code/policy validation** — merge-gating;
- **live Evidence projection** — informational/read-only, reconciler-owned.

## Security boundary

This change does not remove Required Governance, Security, build/test or Human/CODEOWNER merge gates. Workflow-security validation, PVC/project checks, claim evidence and stable PR-contract validation remain fail-closed.

No dynamic Evidence value is converted into authorization.

## Exit evidence

- `pull_request.edited` absent from Required PR Governance triggers;
- no Production Preflight step in Required PR Governance;
- Required workflow invokes `validatePrBody.mjs` with `static-contract`;
- tests assert exact-snapshot concurrency and no body-edit coupling;
- current PR itself passes Required Governance, build/test and applicable Security checks before Human/CODEOWNER merge.
