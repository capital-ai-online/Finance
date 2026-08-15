# ADR-0073 — Konsolidierung der technischen PR-CI auf build-and-test

- **Status:** ACCEPTED — OWNER CUTOVER HANDOFF REQUIRED
- **Datum:** 2026-08-15
- **Scope:** GitHub Actions, Required Checks, CI-Kosten und Merge-Sicherheit
- **Autorität:** Owner-Auswahl „1“ nach dokumentierter Lösungsmatrix

## Kontext

`capital-ai-ci-shadow.yml` wurde als unabhängiger Beobachtungspfad eingeführt, nachdem der
frühere synthetische `build-and-test`-Bootstrap zu einer selbstblockierenden Trust-Root-Migration
geführt hatte. Der heutige echte `build-and-test`-Job in `.github/workflows/ci.yml` prüft
denselben technischen Kernumfang und bindet zusätzlich das current-head Human-/Owner-Gate ein.

Der Parallelbetrieb verdoppelt Dependency-Installation, Audit, TypeScript, Tests und Build und
verbraucht damit unnötig GitHub-Actions-Minuten.

## Evidence

- PR #308: `build-and-test` PASS und `capital-ai-ci` PASS.
- PR #309: `build-and-test` PASS und `capital-ai-ci` PASS.
- Beide Pfade checken den exakten PR-Head aus, nutzen `persist-credentials: false` und besitzen
  keine schreibende Check-Reporter-Funktion.
- `build-and-test` umfasst Integrität, npm ci/audit, TypeScript, Tests, Produktions-Build,
  CSP/Predeploy sowie scopeabhängige Docker-Prüfung.

## Entscheidung

1. `build-and-test` bleibt einziger repository-hosted technischer Required Check.
2. Human-/Owner-Vorprüfung, Head-Bindung und beide Attestations bleiben unverändert.
3. `GitGuardian Security Checks` bleibt Required Check.
4. `capital-ai-ci-shadow.yml` wird nach dem Ruleset-Cutover entfernt.
5. Kein synthetischer Reporter darf den Namen `build-and-test` erzeugen.
6. Die Ausführungsreihenfolge ist verbindlich: Live-Ruleset zuerst, Workflow-Merge danach.
7. Keine Bypass Actors, kein Direct-Main-Push und kein Force-Push werden zugelassen.

## Sicherheitsinvarianten

- Checkout exakt des aktuellen PR-Heads.
- Read-only Workflow-Permissions.
- `persist-credentials: false`.
- Fail-closed Owner-Gate vor kostenintensivem PR-Build.
- Neue Commits invalidieren die Head-Freigabe.
- Separate menschliche Merge-Anweisung bleibt erforderlich.
- Workflow-/Ruleset-Reparatur erfolgt über frischen Branch und normalen PR.

## Cutover-Runbook

Vor dem Merge dieses ADR-/Workflow-PRs muss der Owner:

1. Repository → Settings → Rules → Rulesets → `main-production-protection`.
2. Unter Required status checks ausschließlich `capital-ai-ci` entfernen.
3. `build-and-test` und `GitGuardian Security Checks` beibehalten.
4. Strict status checks, PR-Pflicht, Non-Fast-Forward und Codeowner-Schutz unverändert lassen.
5. Keine Bypass Actors hinzufügen.
6. Ruleset speichern und den angezeigten Sollzustand gegen
   `.github/policies/main-production-protection.expected.json` prüfen.
7. Erst anschließend den PR mergen.

## Verifikation nach Merge

Der nächste reale Pull Request muss zeigen:

- `build-and-test` auf dem aktuellen Head PASS;
- GitGuardian PASS;
- kein erwarteter oder hängender `capital-ai-ci`-Kontext;
- Merge bleibt ohne Owner-Gate oder ohne `build-and-test` blockiert.

## Rollback

Vor Merge: Ruleset-Cutover zurücknehmen und PR offen lassen.
Nach Merge: frischen Recovery-Branch erstellen, Shadow-Workflow wiederherstellen, PASS abwarten und
erst danach `capital-ai-ci` wieder als Required Check aktivieren.
