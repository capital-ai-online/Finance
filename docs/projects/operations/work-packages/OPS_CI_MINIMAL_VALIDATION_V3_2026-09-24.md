# OPS-CI-MINIMAL-VALIDATION-V3 — Minimal affected-file build/test

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Supporting PVC:** `PVC-06 — Version Management`, `PVC-07 — Release Management`  
**Assurance:** `CAPITAL-AI-QM`, `CAPITAL-AI-SEC`  
**Fresh baseline:** `main@13c27d69ba5564e32eea089455d3ccf60860c391`  
**Branch:** `agent/operations-ci-minimal-validation-v3-20260924`  
**State:** `IMPLEMENTED_ON_BRANCH / HOSTED_VALIDATION_PENDING / HUMAN_MERGE_REQUIRED`

## Objective

Reduce ordinary Pull Request `build-and-test` latency toward 45–60 seconds by
testing the affected execution surface instead of treating risk level and unit
test breadth as the same decision.

The existing D/C/R scope classifier, `NONE / FOCUSED / FULL` planner and
exact-snapshot reuse remain the single CI architecture.

## Implemented selection model

### FRONTEND / application

- changed/import-graph Vitest;
- direct known consumers where applicable;
- TypeScript;
- production build for production-impacting source.

### SERVER / runtime

- validation profile remains fail-closed FULL risk;
- Vitest breadth is `changed`, not repository-wide merely because the path is
  high risk;
- deterministic runtime/security sentinels execute explicitly;
- production build and predeploy verification execute;
- Docker hardening remains active;
- the expensive PR Docker image build remains separate from main FULL.

### DATABASE

For `supabase/migrations/*.sql`:

- changed Vitest graph;
- direct migration-specific regression tests;
- `scripts/pr/supabaseMigrationLedgerReconciliation.test.mjs` runs fail-fast;
- unrelated website build/predeploy is not required for SQL-only migration
  scope;
- unknown database surfaces still fail closed through the normal unknown path.

### WORKFLOW / GOVERNANCE

Ordinary workflow + `scripts/pr/**` validation changes:

- workflow security remains owned by the existing PR Governance path;
- Node PR validator tests execute;
- the application Vitest repository suite is not started merely because a
  workflow and PR validator changed together;
- `.github/workflows/ci.yml` itself remains a global FULL trigger.

### FULL

FULL Vitest remains for:

- main pushes;
- dependency manifests;
- central Vite/TypeScript/test infrastructure;
- `ci.yml` and existing provider-control global triggers;
- unknown/unclassified non-documentary paths;
- runtime-consumed documentary artifacts whose impact cannot be reduced to
  known test-only consumers.

## Fail-fast ordering

The branch adds:

1. main-only GitHub OIDC/Sigstore availability verification before Node/npm
   installation and the expensive full suite;
2. migration-ledger validation before TypeScript/general focused tests for
   database changes;
3. targeted runtime/security sentinel tests rather than using the complete
   Vitest repository as the high-risk signal.

Workflow-security remains in the canonical PR Governance runner and is not
duplicated into `ci.yml`.

## Test-contract consolidation

`tests/unit/productionCiRunnerConsolidation.test.ts` remains the canonical
current production-CI contract because it is still consumed by the Node
toolchain supersession path.

Its coverage now includes the still-relevant invariants formerly duplicated by:

- `tests/unit/ciDeploymentControlPlane.test.ts`;
- `tests/unit/ciDeploymentGuards.test.ts`.

Those two duplicate test files are removed. Historical evidence remains in Git
history and historical documentation.

## Workflow cleanup boundary

The repository still contains inert tombstones
`.github/workflows/oss-code-review.yml` and
`.github/workflows/pr-label-classification.yml`. They already have no
automatic trigger and allocate no normal runner.

Physical deletion is not performed in this OPS slice because the trusted
workflow-security contract requires a current reviewed deletion entry in
`docs/security/WORKFLOW_DELETION_REVIEW.json`. No fresh Security/Owner deletion
review is fabricated.

`.github/workflows/capital-ai-ci-shadow.yml` is additionally frozen by the
workflow-security contract and remains a separate Security/Governance
retirement task.

## Acceptance / validation

1. planner/classifier matrix proves docs, frontend, server, DB, workflow/GOV,
   global and unknown behavior;
2. current production-CI contract remains deterministic after duplicate test
   removal;
3. changed `ci.yml` passes the canonical workflow-security and Governance
   gates;
4. exact PR-head hosted CI proves the complete main/PR safety path;
5. post-change timings are compared with the bounded real baseline without
   inventing savings.

Final merge authority remains Human/CODEOWNER.
