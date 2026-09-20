# Workflow usage correlation — 2026-09-20

**Document ID:** EVID-OPS-GHA-USAGE-2026-09-20  
**Status:** EVIDENCE — NON-AUTHORIZING  
**Scan baseline:** `main@0478b62ba365ccae895f029a8f8ddc58bee4230e`  
**Execution baseline:** `main@4a2f43842f380c6da6d088bbea57729bae383be7`  
**Scan roots:** `.github/workflows`, `scripts`, `package.json`, `src`, `server`, `tests`, `AGENTS.md`

Delete is allowed only when a workflow is unused in those executable surfaces. Docs/evidence mentions are not usage.

## Executed deletions (this follow-up)

Owner direction 2026-09-20: `S1 jetzt, nach Human-Merge S3`.  
Allowlist source: `docs/security/WORKFLOW_DELETION_REVIEW.json` after Human-merged PR #1099.

| Path | Trigger | Write | Repo references | Branch state |
|---|---|---|---|---|
| `.github/workflows/document-hygiene-evidence-migration.yml` | `workflow_dispatch` only | no | none outside inventory/review | deleted on `docs/gov-unused-echo-workflow-delete-20260920` |
| `.github/workflows/document-hygiene-evidence-once.yml` | `workflow_dispatch` only | no | none outside inventory/review | deleted on `docs/gov-unused-echo-workflow-delete-20260920` |
| `.github/workflows/lockfile-remediation.yml` | `workflow_dispatch` + `if: false` | no | none outside inventory/review | deleted on `docs/gov-unused-echo-workflow-delete-20260920` |

No `workflow_run` listener points at these names. No reusable `uses: ./` call exists in `.github/workflows`. Required check remains `build-and-test` / `CI`.

The two hygiene stubs shared the display name `Document Hygiene Evidence Migration (disabled)` and were deleted in the same follow-up so no twin display-name remains.

GitHub Actions API records for deleted YAML files may remain `state: active` until the Owner disables them in the Actions UI. That disable is S2 / Owner-UI and is not part of this slice.

## Keep — still used or still an operational host

| Path | Why not unused |
|---|---|
| `ci.yml` / `pr-governance.yml` / shadow / autofix / baseline / `ops-bb2e-*` | Control plane or `workflow_run` listeners |
| `self-heal-ci.yml` | Owner diagnostic host (`workflow_dispatch` + `gh`); not an echo stub |
| `systemadmin-sa4-pilot.yml` | `issues` trigger and write permissions; `if: false` is a documented contract, not absence |
| `systemadmin-work-package-runner.yml` / `systemadmin-roadmap-executor.yml` | Live owner dispatch hosts |
| `node-toolchain-write-boundary-supersession.yml` | Write-capable owner remediation host |
| `set-variables.yml` | `push` to `main` plus dispatch |
| remaining scheduled/PR workflows | Automatic triggers |

Orphan API records (file already absent on `main`) are not YAML deletes. They are Actions-UI disable only.
