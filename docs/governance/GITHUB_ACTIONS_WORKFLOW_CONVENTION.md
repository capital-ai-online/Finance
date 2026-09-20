# GitHub Actions Workflow-Runner Convention

**Document ID:** GOV-GHA-RUNNER-CONV-2026-09-20  
**Version:** 1.2.0  
**Status:** ACTIVE CONVENTION — PHASE 1b SLICE  
**Date:** 2026-09-20  
**Repository:** `capital-ai-online/Finance`  
**Baseline:** `main@0478b62ba365ccae895f029a8f8ddc58bee4230e`  
**Owner:** CAPITAL-AI Owner (`SvenKulessa`)  
**Document role:** `governance convention` (nicht Merge-/Deploy-Authority)  
**Companion inventory:** `docs/evidence/ops/WORKFLOW_RUNNER_INVENTORY_2026-09-20.md`  
**Deletion review:** `docs/security/WORKFLOW_DELETION_REVIEW.json`  
**Related:** `docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md`, ADR-0069, `scripts/security/verifyChangedWorkflowSecurity.mjs`

Does not authorize: Self-Merge, Required-Check-Rename, `ci.yml`/`pr-governance.yml` Cutover, Self-Hosted Runner, M10-Reaktivierung, Actions-API-Disable ohne Owner-UI.

Owner-Freigabe: `PR Erstellung : Freigegeben` am 2026-09-20 (Chat-Gate) für den reviewed deletion path plus drei Stub-Deletes.

---

## 1. Lagebild

| Schicht | Anzahl |
|---|---:|
| Actions-API `list_workflows` (`state: active`) | 67 vor Phase 1b |
| YAML auf `main` unter `.github/workflows/` | 38 vor Phase 1b; 35 danach |
| API-Records ohne Datei auf `main` (Orphans) | 25 vor Phase 1b; 28 danach (die drei Stubs werden Records ohne Datei) |
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

### Datei

```text
{plane}-{capability}[-{qualifier}].yml
```

Planes: `ci` | `gov` | `sec` | `ops` | `cost` | `plat` | `agent` | `proj`

- kebab-case, Extension `.yml`
- keine `-v2`/`-v3`, keine `tmp-`/`audit4-`/`pr[0-9]+-` auf `main`
- One-Shot-Hosts leben auf dem Feature-Branch und werden vor Merge nach `main` nur über den reviewed deletion path gelöscht
- `ci.yml` bleibt als kanonischer Dateiname Allowlist-Ausnahme

### `name:`

```text
{PLANE} — {Klartext, Englisch, max. 60 Zeichen}
```

### Jobs

- Job-ID kebab-case
- Required-Check-Namen (`build-and-test` und der Workflow-Name `CI`) sind eingefroren bis Phase-3-Shadow

---

## 4. Control-Plane Freeze

Nicht löschen und nicht in Phase 1/2 umbenennen:

`ci.yml`, `pr-governance.yml`, `capital-ai-ci-shadow.yml`, Autofix-/Baseline-Listener (`pr-autofix-controller.yml`, `controlled-pr-ci-autofix.yml`, `current-state-baseline-autofix.yml`, `pr-production-baseline-refresh.yml`, `pr-production-baseline-post-merge-refresh.yml`, `post-merge-production-correlation.yml`, `ops-bb2e-workflow-run-trigger.yml`).

---

## 5. Reviewed deletion path

`verifyChangedWorkflowSecurity.mjs` erlaubt `git` status `D` nur wenn alle Bedingungen gelten:

1. `docs/security/WORKFLOW_DELETION_REVIEW.json` existiert, `schemaVersion=1.0.0`
2. `ownerApproval` ist exakt `PR Erstellung : Freigegeben`
3. der Pfad steht in `allowedDeletions`
4. der Pfad ist nicht frozen
5. die Base-Revision ist dispatch-only, ohne write permissions und ohne `pull_request_target`

Human-Merge bleibt die eigentliche Review-Instanz. Der JSON-Block ist nur das maschinenlesbare Attest.

---

## 6. Phasen

| Phase | Inhalt | Dieser PR |
|---|---|---|
| 0 | Orphan-Records in der Actions-UI disablen | Owner-UI |
| 1a | Konvention + Inventar | erledigt in #1098 |
| 1b | Reviewed deletion path + drei Stub-YAMLs | **ja** |
| 2 | Rename ohne Required-Check/Listener-Bruch | nein |
| 3 | Shadow-Cutover `CI` / `PR Governance` | nein |

---

## 7. Kopf-Schablone für neue Workflows

```yaml
name: OPS — Example
run-name: OPS #${{ github.run_number }} — example

on:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ops-example-${{ github.ref }}
  cancel-in-progress: true

jobs:
  example:
    name: Example
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    steps:
      - name: …
```

---

## 8. Nicht-Ziele

- kein zweites CI neben `ci.yml`
- keine M10-Reaktivierung
- kein Self-Hosted-Runner-Setup
- keine allgemeinen Workflow-Deletes ohne Review-JSON
- `package.json#version` bleibt einzige Plattform-Versionsautorität
