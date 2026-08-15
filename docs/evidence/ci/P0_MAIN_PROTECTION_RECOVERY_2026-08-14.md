# P0 Main Protection Recovery — 2026-08-14

Status: VERIFIED PASS — RETIREMENT AUTHORIZED 2026-08-15
Repository: `SvenKulessa/Finance`
Baseline: `main@3fb7e668ab997909b2c34a020f08d701dc7a3409`
Authority: `ADR-0069-human-owner-comment-gate-and-dispatched-pr-ci.md`

## Ausgangslage

Nach dem Human-Merge von Recovery-PR #247 wurde das zuvor blockierende GitHub Ruleset entfernt. Der Post-Merge-Main-CI-Lauf war erfolgreich, `main` ist jedoch serverseitig aktuell nicht durch ein Ruleset geschützt.

Der frühere Ruleset-Sollvertrag verlangte den generischen Kontext `build-and-test`. Dieser Name war im PR-#236–#240-Incident sowohl für einen echten Actions-Job als auch für synthetisch erzeugte Check-Evidence verwendet worden und ist deshalb nicht mehr als eindeutige Trust-Root-Identität geeignet.

## P0 Entscheidung

Der bestehende funktionierende `.github/workflows/ci.yml` bleibt während der Migration unverändert.

Zusätzlich wird ein nicht privilegierter technischer Shadow-Workflow eingeführt:

- Workflow: `.github/workflows/capital-ai-ci-shadow.yml`
- Check-Kontext: `capital-ai-ci`
- `contents: read` בלבד
- kein `checks: write`
- kein `pull-requests: write`
- kein `issues: write`
- kein Deployment
- kein synthetischer Check-Reporter
- exakter PR-Head-Checkout
- `persist-credentials: false`
- Repository-Integrität, Dependency Audit, Lint, Tests, Build, CSP/Predeploy und bei Runtime-/Workflow-Scope Docker-Hardening plus Image-Invarianten

## Promotion Gate

Ein neues GitHub Ruleset darf `capital-ai-ci` erst als Required Check verwenden, wenn mindestens ein realer Pull Request diesen Check auf seinem aktuellen Head erfolgreich ausgeführt hat.

Zielzustand des späteren Rulesets:

- Pull Request required
- Required Check `capital-ai-ci`
- strict status checks
- non-fast-forward protection
- deletion protection
- keine Bypass Actors

Die Ruleset-Aktivierung ist eine separate Human/Owner-Admin-Mutation nach erfolgreichem Shadow-PASS.

## Fail-Closed Bedingungen

Keine Promotion, wenn `capital-ai-ci`:

- fehlt;
- unerwartet `skipped` ist;
- fehlschlägt;
- einen falschen Head prüft;
- nicht eindeutig GitHub Actions zugeordnet werden kann;
- durch einen synthetischen Reporter gleichen Namens erzeugt wird.

## Exit Gate P0

1. Shadow-PR auf aktuellem `main` geöffnet;
2. `capital-ai-ci` auf aktuellem PR-Head PASS;
3. bestehender Legacy-CI-Pfad weiterhin funktionsfähig;
4. GitHub Ruleset anschließend separat mit `capital-ai-ci` aktiviert;
5. Test-PR beweist Merge-Protection ohne Bypass;
6. Evidence auf `VERIFIED PASS` aktualisiert;
7. P0-Branch nach Human-Merge gelöscht.


## Abschluss-Evidence 2026-08-15

Die Shadow-Phase hat ihren Zweck erfüllt:

| Pull Request | build-and-test | capital-ai-ci Shadow | Ergebnis |
|---|---:|---:|---|
| #308 | Run `31862280230` PASS | Run `31862280254` PASS | unabhängige parallele technische Evidence |
| #309 | Run `31863283061` PASS | Run `31863283041` PASS | Application-/Test-Scope; Governance ebenfalls PASS |

Owner-Entscheidung: Konsolidierungsoption 1. `build-and-test` bleibt technischer Trust Root,
`capital-ai-ci` wird stillgelegt. Die Stilllegung erfolgt über die Trigger-Fläche des
Shadow-Workflows (nur noch `workflow_dispatch`); die Workflow-Datei wird nicht gelöscht, weil
`scripts/security/verifyChangedWorkflowSecurity.mjs` Workflow-Löschungen fail-closed untersagt.
Damit die Stilllegung keinen dauerhaft fehlenden Required Check erzeugt, gilt folgende zwingende
Reihenfolge:

1. Live-Ruleset `main-production-protection` öffnen.
2. Required Check `capital-ai-ci` entfernen.
3. `build-and-test` und `GitGuardian Security Checks` unverändert Required lassen.
4. Speichern und verifizieren, dass keine Bypass Actors hinzugefügt wurden.
5. Erst danach den Workflow-Retirement-PR mergen.
6. Mit dem nächsten realen PR nachweisen, dass Merge ohne `build-and-test` weiterhin blockiert.

Rollback vor Merge: Ruleset-Änderung rückgängig machen und diesen PR nicht mergen.
Rollback nach Merge: frischer Recovery-Branch, `pull_request`-Trigger des Shadow-Workflows wieder
eintragen, anschließend `capital-ai-ci` erst nach PASS erneut Required setzen.
