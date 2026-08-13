# PR #236 Bootstrap Incident und Recovery

Status: RECOVERY PREPARED
Datum: 2026-08-13
Repository: `SvenKulessa/Finance`
Owner: `SvenKulessa`
Referenz: `docs/adr/ADR-0069-human-owner-comment-gate-and-dispatched-pr-ci.md`

## 1. Zusammenfassung

Zwischen PR #236 und PR #240 wurde die Pull-Request-CI von einem direkt auf dem PR-Head laufenden `build-and-test` auf einen trusted-main, dispatch-basierten Human/Owner-Gate-Pfad umgestellt. Das Sicherheitsziel war korrekt: Kandidatencode sollte keine Schreibrechte erhalten und Human-Evidence sollte an `(PR, Head-SHA)` gebunden werden.

Die Umsetzung erzeugte jedoch einen selbstreferenziellen Trust Root: Das aktive GitHub-Ruleset verlangte weiterhin den Required Check `build-and-test`, während dieser Check nun synthetisch vom Human-Gate reserviert und durch einen Workflow aktualisiert wurde, der ausschließlich aus `main` geladen wurde. Ein Defekt in diesem trusted-main Workflow konnte dadurch seine eigene Reparatur blockieren.

## 2. Verifizierte Baselines

### Letzter Stand vor PR #236

- `main`: `5bd5f4d78b87a89258126d0453eaf5e4bc6b6125`
- Tree: `5d95c7e21b7dcded2fb023047e01ca629b37b75d`
- PR #236 Base: exakt dieser Commit

In diesem Stand enthält `.github/workflows/ci.yml`:

- `pull_request: types: [edited]`;
- Human-/Owner-Vorprüfung direkt im PR-Workflow;
- current-head Review `💪`/`okay`;
- `build-and-test` als normalen GitHub-Actions-Job auf dem PR-Head;
- keinen separaten trusted-main `workflow_dispatch` für den Required Check;
- keinen synthetischen `build-and-test` Check-Run.

### Fehlerhafter main-Stand

- `main`: `74f4eb98345f994854f56e7296b9491241718b57`
- Merge PR #240

Dort waren zusätzlich aktiv:

- `.github/workflows/human-owner-comment-gate.yml`
- `.github/workflows/pr-build-and-test.yml`
- `.github/workflows/pr-auto-classification.yml`
- `docs/adr/ADR-0069-human-owner-comment-gate-and-dispatched-pr-ci.md`

## 3. Ereigniskette

### PR #236

Führte den trusted-main Human/Owner-Kommentar-Gate-Bootstrap ein. Der PR dokumentierte selbst, dass der neue Mechanismus erst nach seinem Merge live wirksam werden könne.

### PR #237 / #238 / #239

Mehrere Folgefehler mussten korrigiert werden:

- GitHub API `403 Resource not accessible by integration`;
- Check-Reporting auf falschem SHA;
- Rechtepartition zwischen Seed/Verification;
- YAML-/Shell-Fehler im Dispatch.

Diese Folge-PRs zeigen, dass der Bootstrap eine kritische Control-Plane während des laufenden Betriebs ersetzte, ohne unabhängigen Recovery-Kanal.

### PR #240

Konsolidierte die neue ADR-0069-Architektur auf `main`. Dabei entstand bzw. blieb im trusted Preflight der fehlerhafte Cross-Checkout-Befehl:

```bash
git fetch --no-tags ../policy main:refs/remotes/origin/main
```

Das `policy`-Checkout befand sich auf einem konkreten Commit im detached-HEAD-Zustand. Der lokale Pfad stellte deshalb keinen fetchbaren Remote-Ref `main` bereit. Ergebnis:

```text
fatal: couldn't find remote ref main
```

### PR #243

Enthielt bereits den korrekten Fix:

- Human-Evidence und PR-Preflight als getrennte Jobs;
- Entfernung des Cross-Checkout-Fetches;
- serielle Kette `Governance → Human Gate → PR Build/Test → Auto-Status`.

PR #243 wurde jedoch am 2026-08-12 geschlossen und nicht gemerged.

### PR #245 / #246

Der verbliebene Defekt blockierte anschließend normale Weiterentwicklung, obwohl Human-/Owner-Evidence, GitGuardian und Snyk erfolgreich waren. PR #246 reproduzierte den gleichen Fehler erneut.

## 4. Zweite Regression: PR-Template-Synchronisierung

`PR Auto-Status` verglich `github.event.workflow_run.name` mit statischen Workflow-Namen. Durch dynamische `run-name`-Werte entsprach der Eventname nicht mehr der Bedingung; der Job wurde `skipped`.

Folge:

- `{{...}}`-Platzhalter blieben in manuell erzeugten PRs stehen;
- Machine-Evidence konnte inkonsistent werden;
- der PR-Body war nicht zuverlässig kanonisch synchronisiert.

## 5. Connector-Schreibblockaden

Zusätzlich wurden einzelne ChatGPT-GitHub-Connector-Schreiboperationen vor GitHub durch eine Plattform-Sicherheitsklassifizierung blockiert, unter anderem PR-Erstellung und einzelne Workflow-Schreibvorgänge. Diese Sperren sind vom GitHub-Ruleset getrennt und dürfen nicht durch Repository-Bypass-Regeln kompensiert werden.

## 6. Recovery-Entscheidung

Der Recovery-Branch stellt zunächst den vollständigen Repository-Tree auf den verifizierten Stand unmittelbar vor PR #236 zurück.

Recovery-Commit:

- Commit: `55c08679cc0f184a898466597aeaf5ba7f9168c3`
- Parent: `74f4eb98345f994854f56e7296b9491241718b57`
- Tree: `5d95c7e21b7dcded2fb023047e01ca629b37b75d`

Damit bleibt die Git-Historie vollständig erhalten. Es gibt keinen Force-Push und keine direkte Mutation von `main`.

Auf diesem Snapshot werden ausschließlich diese Recovery-Dokumentation und eine korrigierte ADR-0069 ergänzt.

## 7. Verifikation des Rollback-Ziels

Statisch verifiziert:

1. der Recovery-Tree ist byte-/SHA-identisch zum Tree des PR-#236-Base-Commits;
2. der Pre-#236-Workflow besitzt einen normalen `build-and-test` Job direkt im PR-Workflow;
3. der Required Check hängt damit nicht von einem separat aus `main` dispatchten Workflow ab;
4. `human-owner-comment-gate.yml` und `pr-build-and-test.yml` existieren in diesem Snapshot nicht;
5. der konkrete Cross-Checkout-Fehler kann dort nicht auftreten.

Eine endgültige GitHub-seitige Laufzeitverifikation ist erst möglich, wenn der Recovery-PR gegen `main` geöffnet wird und GitHub die Checks für dessen Head ausführt.

## 8. Dauerhafte Invarianten nach Recovery

- Ein Required Check darf nicht ausschließlich von der Version eines Workflows abhängen, die durch denselben Required Check geschützt und erst nach Merge aktiv würde.
- Bootstrap darf keine aktive Merge-/CI-Control-Plane ersetzen, bevor eine unabhängige Recovery- und Abnahme-Stufe existiert.
- Neue Governance-Control-Planes müssen im Shadow-/Observation-Modus validiert werden, bevor sie Required-Check-Autorität übernehmen.
- Der bestehende funktionierende Required Check bleibt während einer Migration aktiv.
- Erst nach nachgewiesenem Parallel-PASS darf ein neuer Check serverseitig Required werden.
- Rollback eines Governance-Checks muss über normalen Branch/PR/Revert möglich bleiben.
- Keine Agenten- oder Workflow-Logik darf selbständig Rulesets oder Bypass-Actors abschwächen.

## 9. Auswirkungen auf Roadmap

Die PR-#236–#240-Bootstrapserie war dokumentiert und Human-autorisiert, wurde aber als Governance-/SA4B-Zwischenarbeit in die laufende DEVELOPMENT Chain eingeschoben. Die kanonische Roadmap wurde danach nicht vollständig auf den finalen `main@74f4eb...` synchronisiert.

Nach Recovery müssen Roadmap und Traceability den Vorfall als Governance-Incident referenzieren. Der fachliche Systemadministrator-/DevelopmentChain-Stand darf erst nach erfolgreicher Recovery-CI neu bewertet werden; verloren gegangene funktionale Änderungen nach PR #236 werden anschließend gezielt und einzeln aus der Historie wieder eingeführt, nicht durch erneuten Voll-Bootstrap.

## 10. Definition of Done

Recovery ist abgeschlossen, wenn:

1. Recovery-PR Human-reviewed und gemerged ist;
2. der normale PR-Head `build-and-test` ohne synthetischen trusted-main Reporter PASS liefert;
3. Main-CI nach Merge PASS liefert;
4. keine Bootstrap-Workflows aus PR #236–#240 mehr aktiv sind;
5. ADR-0069 in der korrigierten Fassung gilt;
6. GitGuardian/Snyk anschließend in einem frischen Branch erneut integriert werden;
7. Roadmap/Traceability auf den tatsächlich wiederhergestellten Stand synchronisiert werden;
8. der Recovery-Branch nach Human-Merge gelöscht wird.
