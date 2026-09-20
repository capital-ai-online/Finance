# GitHub Actions Workflow-Runner Convention

**Document ID:** GOV-GHA-RUNNER-CONV-2026-09-20  
**Version:** 1.1.0  
**Status:** ACTIVE CONVENTION — DOCUMENTATION SLICE  
**Date:** 2026-09-20  
**Repository:** `capital-ai-online/Finance`  
**Baseline:** `main@df7b970e40ca5b3bd1046ae595af060e0f4b7317`  
**Owner:** CAPITAL-AI Owner (`SvenKulessa`)  
**Document role:** `governance convention` (nicht Merge-/Deploy-Authority)  
**Companion inventory:** `docs/evidence/ops/WORKFLOW_RUNNER_INVENTORY_2026-09-20.md`  
**Related:** `docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md`, ADR-0069, `scripts/security/verifyChangedWorkflowSecurity.mjs`

Does not authorize: Self-Merge, Required-Check-Rename, `ci.yml`/`pr-governance.yml` Cutover, Self-Hosted Runner, M10-Reaktivierung, Actions-API-Disable ohne Owner-UI, Workflow-Datei-Löschung.

Owner-Freigabe für den Dokumentations-Slice: `PR Erstellung : Freigegeben` am 2026-09-20 (Chat-Gate).

**Policy-Korrektur:** `verifyChangedWorkflowSecurity.mjs` bewertet jede Workflow-Löschung (`git status D`) als FAIL. Es gibt kein Review-Token im Validator. Deshalb bleiben die drei Stub-YAMLs in diesem PR erhalten. Löschung ist ein eigener Owner-reviewed Security-Schnitt (Policy zuerst, dann Datei).

---

## 1. Lagebild

Stand der Korrelation:

| Schicht | Anzahl |
|---|---:|
| Actions-API `list_workflows` (`state: active`) | 67 |
| YAML auf `main` unter `.github/workflows/` | 38 |
| API-Records ohne Datei auf `main` (Orphans) | 25 |
| GitHub-managed `dynamic/*` | 4 |
| Self-Hosted Runner | 0 |
| Runner-Labels | `ubuntu-latest`, `ubuntu-24.04` |

`docs/evidence/m0/WORKFLOW_ACTION_INVENTORY_2026-08-10.md` ist stale (7 Dateien) und bleibt historische Evidence.

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
- One-Shot-Hosts leben auf dem Feature-Branch und werden vor Merge nach `main` gelöscht — aber nur nach Anpassung von `verifyChangedWorkflowSecurity.mjs`
- `ci.yml` bleibt als kanonischer Dateiname Allowlist-Ausnahme

### `name:`

```text
{PLANE} — {Klartext, Englisch, max. 60 Zeichen}
```

Kein Dateipfad als Name. Kein `(disabled)` im Namen als Dauerzustand — Datei erst löschen, wenn die Security-Policy Löschungen reviewed zulässt.

### `run-name:`

PR-/Run-gebundene Workflows setzen ein `run-name:` mit Plane und PR- oder Run-Nummer.

### Jobs

- Job-ID kebab-case
- Job-`name:` ist der Status-Check-Name
- Required-Check-Namen (`build-and-test` und der Workflow-Name `CI`) sind eingefroren bis Phase-3-Shadow

---

## 4. Control-Plane Freeze

Nicht in diesem Slice umbenennen:

| Datei | Grund |
|---|---|
| `ci.yml` | Required Check `build-and-test`; `workflow_run`-Quelle |
| `pr-governance.yml` | Template-Contract; Listener filtert den Pfad |
| Autofix-/Baseline-Listener | hängen an Name und/oder Pfad |

Listener (Cutover nur Phase 3): `pr-autofix-controller.yml`, `controlled-pr-ci-autofix.yml`, `current-state-baseline-autofix.yml`, `pr-production-baseline-refresh.yml`, `pr-production-baseline-post-merge-refresh.yml`, `post-merge-production-correlation.yml`, `ops-bb2e-workflow-run-trigger.yml`.

---

## 5. Phasen

| Phase | Inhalt | Dieser PR |
|---|---|---|
| 0 | Orphan-Records in der Actions-UI disablen | Owner-UI, nicht Repo |
| 1a | Konvention + Inventar kanonisieren | **ja** |
| 1b | Stub-YAMLs löschen | **nein** — blockiert durch Workflow-Security |
| 2 | Rename ohne Required-Check/Listener-Bruch | nein |
| 3 | Shadow-Cutover `CI` / `PR Governance` | nein |
| 4 | Policy-as-Code inkl. reviewed deletion path | eigener SEC/Owner-PR |

Nicht gelöscht: Hygiene-Stubs, Lockfile-Stub, SA4-/Systemadmin-Hosts, Self-Heal-Diagnose, Node-Toolchain-Supersession.

---

## 6. Orphans

25 Actions-API-Records ohne Datei auf `main` bleiben `state: active`. Disable ist eine UI-/API-Aktion des Owners. IDs stehen im Companion-Inventar.

Dynamics (`Dependabot Updates`, `Dependency Graph`, `CodeQL`, `Security Risk Assessment`) bleiben unangetastet.

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

Actions bleiben SHA-gepinnt. `workflow_run`-Listener dokumentieren Quell-`name:` und Quell-Pfad im Kommentar.

---

## 8. Nicht-Ziele

- kein zweites CI neben `ci.yml`
- keine M10-Reaktivierung
- kein Self-Hosted-Runner-Setup
- keine Aufweichung von `verifyChangedWorkflowSecurity.mjs` in diesem PR
- `package.json#version` bleibt einzige Plattform-Versionsautorität
