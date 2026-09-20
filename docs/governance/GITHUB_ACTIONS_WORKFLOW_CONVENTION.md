# GitHub Actions Workflow-Runner Convention

**Document ID:** GOV-GHA-RUNNER-CONV-2026-09-20  
**Version:** 1.2.1  
**Status:** ACTIVE CONVENTION — PHASE 1b POLICY SLICE  
**Date:** 2026-09-20  
**Repository:** `capital-ai-online/Finance`  
**Baseline:** `main@0478b62ba365ccae895f029a8f8ddc58bee4230e`  
**Owner:** CAPITAL-AI Owner (`SvenKulessa`)  
**Document role:** `governance convention` (nicht Merge-/Deploy-Authority)  
**Companion inventory:** `docs/evidence/ops/WORKFLOW_RUNNER_INVENTORY_2026-09-20.md`  
**Deletion review:** `docs/security/WORKFLOW_DELETION_REVIEW.json`  
**Related:** `docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md`, ADR-0069, `scripts/security/verifyChangedWorkflowSecurity.mjs`

Does not authorize: Self-Merge, Required-Check-Rename, `ci.yml`/`pr-governance.yml` Cutover, Self-Hosted Runner, M10-Reaktivierung, Actions-API-Disable ohne Owner-UI.

Owner-Freigabe: `PR Erstellung : Freigegeben` am 2026-09-20 (Chat-Gate) für den reviewed deletion path.

**Trusted-main Regel:** `pr-governance.yml` führt `verifyChangedWorkflowSecurity.mjs` aus dem Checkout `policy/` = aktuelles `main` aus, nicht aus dem PR-Head. Deshalb darf derselbe PR den Validator nicht ändern **und** Workflows löschen. Reihenfolge: (1) Policy nach `main` mergen, (2) danach Stubs in einem Folgeschnitt löschen.

---

## 1. Lagebild

| Schicht | Anzahl |
|---|---:|
| Actions-API `list_workflows` (`state: active`) | 67 |
| YAML auf `main` unter `.github/workflows/` | 38 |
| API-Records ohne Datei auf `main` (Orphans) | 25 |
| GitHub-managed `dynamic/*` | 4 |
| Self-Hosted Runner | 0 |
| Runner-Labels | `ubuntu-latest`, `ubuntu-24.04` |

---

## 2. Runner-Konvention

- Standard: `runs-on: ubuntu-24.04`
- `timeout-minutes` ist Pflicht
- `ubuntu-latest` bleibt in bestehenden Control-Plane-Dateien bis Phase 3 erlaubt (`KEEP-PIN`)
- Kein `self-hosted` ohne eigenen ADR und Owner-Gate
- Write-Jobs brauchen Environment und/oder Actor-Gate `SvenKulessa`

---

## 3. Namenskonvention

Datei: `{plane}-{capability}[-{qualifier}].yml`  
Planes: `ci` | `gov` | `sec` | `ops` | `cost` | `plat` | `agent` | `proj`

`name:`: `{PLANE} — {Klartext, Englisch, max. 60 Zeichen}`

---

## 4. Control-Plane Freeze

Nicht löschen und nicht in Phase 1/2 umbenennen:

`ci.yml`, `pr-governance.yml`, `capital-ai-ci-shadow.yml`, Autofix-/Baseline-Listener (`pr-autofix-controller.yml`, `controlled-pr-ci-autofix.yml`, `current-state-baseline-autofix.yml`, `pr-production-baseline-refresh.yml`, `pr-production-baseline-post-merge-refresh.yml`, `post-merge-production-correlation.yml`, `ops-bb2e-workflow-run-trigger.yml`).

---

## 5. Reviewed deletion path

Nach Merge dieses PRs erlaubt der Validator auf `main` `git` status `D` nur wenn:

1. `docs/security/WORKFLOW_DELETION_REVIEW.json` existiert, `schemaVersion=1.0.0`
2. `ownerApproval` ist exakt `PR Erstellung : Freigegeben`
3. der Pfad steht in `allowedDeletions`
4. der Pfad ist nicht frozen
5. die Base-Revision ist dispatch-only, ohne write permissions und ohne `pull_request_target`

---

## 6. Phasen

| Phase | Inhalt | Dieser PR |
|---|---|---|
| 0 | Orphan-Records in der Actions-UI disablen | Owner-UI |
| 1a | Konvention + Inventar | erledigt in #1098 |
| 1b-policy | Reviewed deletion path auf trusted main | **ja** |
| 1b-delete | drei Stub-YAMLs löschen | **nein** — Folgeschnitt nach Merge |
| 2 | Rename ohne Required-Check/Listener-Bruch | nein |
| 3 | Shadow-Cutover `CI` / `PR Governance` | nein |

---

## 7. Nicht-Ziele

- kein zweites CI neben `ci.yml`
- keine M10-Reaktivierung
- kein Self-Hosted-Runner-Setup
- keine Workflow-Deletes in demselben PR, der den Validator ändert
- `package.json#version` bleibt einzige Plattform-Versionsautorität
