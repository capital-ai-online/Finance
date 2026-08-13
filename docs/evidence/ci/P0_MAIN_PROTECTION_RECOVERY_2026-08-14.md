# P0 Main Protection Recovery — 2026-08-14

Status: SHADOW VALIDATION
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
