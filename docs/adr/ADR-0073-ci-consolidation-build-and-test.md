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
4. `capital-ai-ci-shadow.yml` wird nach dem Ruleset-Cutover stillgelegt: Der
   `pull_request`-Trigger entfällt, die Datei bleibt mit `workflow_dispatch` erhalten.
5. Kein synthetischer Reporter darf den Namen `build-and-test` erzeugen.
6. Die Ausführungsreihenfolge ist verbindlich: Live-Ruleset zuerst, Workflow-Merge danach.
7. Keine Bypass Actors, kein Direct-Main-Push und kein Force-Push werden zugelassen.

## Stilllegung statt Löschung

Die ursprüngliche Umsetzung löschte `.github/workflows/capital-ai-ci-shadow.yml`. Der
Required-Check `Sicherheit geänderter Workflows` (`pr-governance.yml` →
`scripts/security/verifyChangedWorkflowSecurity.mjs`) behandelt jede Workflow-Löschung
fail-closed als Richtlinienverstoß und kennt keinen Ausnahmepfad. Die Richtlinie wird aus
dem vertrauenswürdigen `main`-Stand geladen; ein PR kann sie für sich selbst nicht ändern.

Entschieden wurde deshalb die Stilllegung über die Trigger-Fläche:

- `on:` enthält nur noch `workflow_dispatch`;
- der Workflow erzeugt für Pull Requests keinen `capital-ai-ci`-Check mehr;
- das Kostenziel (ein statt zwei Node-/Build-Läufe pro PR) ist vollständig erreicht;
- die Workflow-Löschungs-Invariante bleibt unangetastet und muss nicht aufgeweicht werden;
- der Rollback aus ADR-0073 reduziert sich auf das Wiedereinsetzen des `pull_request`-Triggers.

Eine spätere physische Löschung der Datei bleibt möglich, erfordert aber einen eigenen,
Human/Owner-reviewten Änderungspfad für `verifyChangedWorkflowSecurity.mjs` und ist nicht
Bestandteil dieser Entscheidung.

## Betriebs-Addendum 2026-08-21 — Cost-Control bei suspendiertem M10

Die repository-weite Owner-Entscheidung in `AGENTS.md` vom 2026-08-19 suspendiert die
M10-Passkey-Autorisierung für normale PR-CI. Diese spätere Owner-Entscheidung bleibt
unverändert: `M10_CI_GATE_ENABLED` bleibt `false`; Cost-Control darf M10 weder implizit noch
explizit reaktivieren.

Zur Vermeidung nachgewiesener mehrfacher Vollausführungen desselben PR-Snapshots wird der
kanonische `build-and-test`-Pfad um eine **Exact-Snapshot-Deduplizierung** erweitert. Ein bereits
erfolgreicher CI-Lauf darf nur wiederverwendet werden, wenn alle folgenden Identitäten identisch
sind:

1. derselbe kanonische CI-Workflow (`workflow_id`),
2. dieselbe Pull-Request-Nummer,
3. exakt derselbe PR-Head-SHA,
4. exakt derselbe PR-Base-SHA,
5. der frühere Lauf ist erfolgreich abgeschlossen.

Die Base-SHA-Bindung ist eine Sicherheits- und Integritätsinvariante: Bewegt sich `main`, ist ein
früherer PASS selbst bei unverändertem Head nicht wiederverwendbar. Ein neuer Head-SHA invalidiert
die Wiederverwendung ebenfalls. In beiden Fällen läuft der vollständige scope-klassifizierte
CI-Pfad erneut.

Die Deduplizierung ist ausschließlich eine Kostenoptimierung innerhalb desselben Required Checks:

- sie erzeugt keinen zweiten Check-Namen und keinen synthetischen PASS-Reporter;
- sie ist keine Human-, Owner-, M10-, Merge- oder Deployment-Autorisierung;
- sie benötigt nur lesenden Zugriff auf GitHub-Actions-Läufe (`actions: read`);
- sie ist ausschließlich für `pull_request` aktiv;
- `push` auf `main` wird niemals aus einem PR-PASS wiederverwendet und durchläuft weiterhin die
  vollständige Produktions-Build-/Attestation-/Deployment-Kette;
- `workflow_dispatch` bleibt bei suspendiertem M10 als alternativer CI-Einstieg gesperrt.

Die bereits vorhandene monatliche Kostenkontrolle in `pr-governance.yml` bleibt für optionale
Advisory-Prüfungen zuständig. Sie wird nicht als zweite technische CI-Authority dupliziert. Die
Exact-Snapshot-Deduplizierung adressiert dagegen unmittelbar die kostenintensive Pflicht-CI und
bleibt damit innerhalb der ADR-0073-Single-`build-and-test`-Architektur.

## Sicherheitsinvarianten

- Checkout exakt des aktuellen PR-Heads.
- Read-only Workflow-Permissions; `actions: read` ist nur für den Exact-Snapshot-Lookup zulässig.
- `persist-credentials: false`.
- M10-Passkey bleibt entsprechend der aktuellen Owner-Authority suspendiert/off.
- Kostenkontrolle darf keine Autorisierungs- oder Merge-Authority erzeugen.
- Neue Commits oder ein neuer Base-SHA invalidieren eine frühere Snapshot-Wiederverwendung.
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

Für das Cost-Control-Addendum gilt zusätzlich:

- der erste neue PR-Snapshot führt die erforderliche scope-klassifizierte CI real aus;
- ein erneuter Event für exakt denselben Workflow/PR/Head/Base darf die erfolgreiche Snapshot-
  Evidence wiederverwenden und Checkout/npm/Test/Build/Docker überspringen;
- ein neuer Head oder ein neuer Base-SHA muss wieder eine reale CI-Ausführung erzwingen;
- `main`-Pushes dürfen nie über die PR-Snapshot-Wiederverwendung abgekürzt werden.

## Rollback

Vor Merge: Ruleset-Cutover zurücknehmen und PR offen lassen.
Nach Merge: frischen Recovery-Branch erstellen, in `capital-ai-ci-shadow.yml` den
`pull_request`-Trigger (`branches: [main]`, `types: [opened, synchronize, reopened, edited]`)
wieder eintragen, PASS abwarten und erst danach `capital-ai-ci` wieder als Required Check
aktivieren.

Für einen isolierten Rollback der P0-Cost-Control wird ausschließlich die Exact-Snapshot-
Deduplizierung aus `ci.yml` entfernt; `M10_CI_GATE_ENABLED=false`, die Single-`build-and-test`-
Architektur und die Produktions-Main-Pipeline bleiben dabei unverändert.
