# Workflow usage correlation — 2026-09-20

**Document ID:** EVID-OPS-GHA-USAGE-2026-09-20  
**Status:** EVIDENCE — NON-AUTHORIZING  
**Baseline:** `main@0478b62ba365ccae895f029a8f8ddc58bee4230e`  
**Scan roots:** `.github/workflows`, `scripts`, `package.json`, `src`, `server`, `tests`, `AGENTS.md`

Delete is allowed only when a workflow is unused in those executable surfaces. Docs/evidence mentions are not usage.

## Delete candidates (unused)

| Path | Trigger | Write | Repo references |
|---|---|---|---|
| `.github/workflows/document-hygiene-evidence-migration.yml` | `workflow_dispatch` only | no | none outside inventory/review |
| `.github/workflows/document-hygiene-evidence-once.yml` | `workflow_dispatch` only | no | none outside inventory/review |
| `.github/workflows/lockfile-remediation.yml` | `workflow_dispatch` + `if: false` | no | none outside inventory/review |

No `workflow_run` listener points at these names. No reusable `uses: ./` call exists in `.github/workflows`. Required check remains `build-and-test` / `CI`.

The two hygiene stubs share the display name `Document Hygiene Evidence Migration (disabled)`. They must be deleted in the **same** follow-up PR, otherwise the remaining twin counts as a live name reference.

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
