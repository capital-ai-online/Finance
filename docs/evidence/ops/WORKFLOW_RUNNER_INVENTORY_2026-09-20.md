# Workflow-Runner Inventory — 2026-09-20

**Document ID:** EVID-OPS-GHA-INV-2026-09-20  
**Status:** EVIDENCE — NON-AUTHORIZING  
**Baseline:** `main@081490f1eed9b19bde7bc427cb4a0dee6d2373da`  
**Source:** GitHub Actions API `list_workflows` + tree `.github/workflows`  
**Convention:** `docs/governance/GITHUB_ACTIONS_WORKFLOW_CONVENTION.md`

This file records the correlation snapshot used for the Phase-1 convention PR. It does not authorize merge, deploy, or Actions-API disable.

## Counts

- 67 registered workflows, all `state: active`
- 38 YAML files on baseline `main`
- 25 orphan API records (file absent on `main`)
- 4 GitHub-managed `dynamic/*` workflows
- 0 self-hosted runners
- ~19 572 historical workflow runs in the repository (includes `workflow_run` fan-out)

## Phase-1 deletions in the associated PR

| Path | Why removable |
|---|---|
| `.github/workflows/document-hygiene-evidence-migration.yml` | 303 B echo stub, `name` contains `(disabled)`, dispatch only |
| `.github/workflows/document-hygiene-evidence-once.yml` | 255 B echo stub, duplicate display name |
| `.github/workflows/lockfile-remediation.yml` | dispatch + `if: 'false'`, historical PR #30 record |

No other live workflow path is claimed for deletion in this slice.

## Orphan API records (disable in Actions UI — not this PR)

| ID | Historical path |
|---|---|
| 325553945 | `.github/workflows/audit4-charts-syntax-fix.yml` |
| 325542870 | `.github/workflows/audit4-f003-finalize.yml` |
| 325551734 | `.github/workflows/audit4-finalize.yml` |
| 337726028 | `.github/workflows/m10-pr-authorization-guard.yml` |
| 351152924 | `.github/workflows/node-toolchain-branch-transformer-executor.yml` |
| 351153680 | `.github/workflows/node-toolchain-branch-transformer-executor-v2.yml` |
| 351154590 | `.github/workflows/node-toolchain-branch-transformer-executor-v3.yml` |
| 354705171 | `.github/workflows/pr859-dependency-audit-fix.yml` |
| 351090216 | `.github/workflows/qs-lockfile-remediation.yml` |
| 325970386 | `.github/workflows/render-runtime-remediation-apply.yml` |
| 325568257 | `.github/workflows/screening-slo-propagate-once.yml` |
| 325555481 | `.github/workflows/screening-slo-propagation.yml` |
| 355357001 | `.github/workflows/sec-class-r-prepr-validation.yml` |
| 355361674 | `.github/workflows/sec-effective-change-identity-v2.yml` |
| 355361307 | `.github/workflows/sec-effective-change-identity.yml` |
| 355355908 | `.github/workflows/sec-vitest-lock-materialize.yml` |
| 333743903 | `.github/workflows/security-snyk.yml` |
| 325558019 | `.github/workflows/slo-propagate-once.yml` |
| 360604187 | `.github/workflows/tmp-dependency-lock-resolve.yml` |
| 337361678 | `.github/workflows/tmp-p0-final-platform-version-codemod.yml` |
| 337358171 | `.github/workflows/tmp-p0-platform-version-codemod.yml` |
| 337386317 | `.github/workflows/tmp-p1a-contract-governance-validation.yml` |
| 337371365 | `.github/workflows/tmp-p1a-documentary-validation.yml` |
| 337382088 | `.github/workflows/tmp-p1a-repository-governance-validation.yml` |
| 337394618 | `.github/workflows/tmp-p1a-runtime-admin-validation.yml` |

## Dynamic platform workflows (keep)

| Path | Name |
|---|---|
| `dynamic/dependabot/dependabot-updates` | Dependabot Updates |
| `dynamic/dependabot/update-graph` | Dependency Graph |
| `dynamic/github-code-scanning/codeql` | CodeQL |
| `dynamic/github-code-scanning/code-security-risk-assessment` | Security Risk Assessment |

## Runner observation

All inspected live jobs use GitHub-hosted `ubuntu-latest` or `ubuntu-24.04`. No custom runner group and no `[self-hosted]` label were present on the baseline tree.
