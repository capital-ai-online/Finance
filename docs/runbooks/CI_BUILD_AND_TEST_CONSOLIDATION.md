# Runbook — CI-Konsolidierung auf build-and-test

Status: OWNER ACTION REQUIRED BEFORE MERGE  
ADR: ADR-0073

## Vorher

Required Checks:

- `capital-ai-ci`
- `build-and-test`
- `GitGuardian Security Checks`

## Nachher

Required Checks:

- `build-and-test`
- `GitGuardian Security Checks`

## Owner-Schritte

1. Live-Ruleset `main-production-protection` öffnen.
2. Nur `capital-ai-ci` aus Required status checks entfernen.
3. Prüfen, dass `build-and-test` und GitGuardian erhalten bleiben.
4. Keine Bypass Actors hinzufügen.
5. Einstellung speichern.
6. Im Konsolidierungs-PR bestätigen, dass der Ruleset-Cutover abgeschlossen ist.
7. Erst danach Merge freigeben.

## Fail-Closed

Falls `capital-ai-ci` vor dem Merge weiterhin Required ist, darf der PR nicht gemergt werden.
Nach einem Merge würde sonst jeder neue PR auf einen nicht mehr gemeldeten Check warten.

## Umsetzung im Repository

`.github/workflows/capital-ai-ci-shadow.yml` wird **nicht gelöscht**, sondern stillgelegt:

- `on:` enthält nur noch `workflow_dispatch`;
- der Workflow meldet für Pull Requests keinen `capital-ai-ci`-Check mehr;
- Jobinhalt, Pinning, Read-only-Permissions und `persist-credentials: false` bleiben unverändert.

Grund: Der Required-Check `Sicherheit geänderter Workflows` verbietet Workflow-Löschungen
fail-closed und ohne Ausnahmepfad (`scripts/security/verifyChangedWorkflowSecurity.mjs`,
geladen aus dem vertrauenswürdigen `main`-Stand). Die Stilllegung erreicht dasselbe Ziel,
ohne diese Sicherheitsinvariante aufzuweichen.

## P0 Cost-Control — Exact-Snapshot-Deduplizierung

Seit der Owner-Entscheidung vom 2026-08-19 ist die M10-Passkey-Autorisierung für normale PR-CI
suspendiert. Dieser Zustand bleibt bestehen:

```text
M10_CI_GATE_ENABLED=false
```

Die Kostenkontrolle ist davon technisch und autoritativ getrennt. Sie entscheidet nicht, **wer**
CI ausführen darf, sondern nur, ob exakt derselbe bereits erfolgreich geprüfte PR-Snapshot noch
einmal die kostenintensiven Schritte ausführen muss.

### Wiederverwendbare Identität

Ein früherer `build-and-test`-PASS ist nur wiederverwendbar bei identischer Kombination:

```text
CI workflow_id
+ pull request number
+ pull_request.head.sha
+ pull_request.base.sha
+ previous conclusion = success
```

Dadurch gilt:

- neuer Commit/Head-SHA → vollständige CI;
- Rebase/Main-Sync bzw. neuer Base-SHA → vollständige CI;
- anderer PR → vollständige CI;
- anderer Workflow → vollständige CI;
- früherer Failure/Cancelled Run → vollständige CI;
- exakt gleicher erfolgreicher Snapshot → Checkout/npm/Test/Build/Docker werden übersprungen.

### Sicherheitsgrenzen

- Cost-Control läuft nur für `pull_request`.
- `push` auf `main` läuft weiterhin vollständig und kann keinen PR-PASS übernehmen.
- Produktions-Attestation, Render-Deployment und Deployment-Identity bleiben unverändert an den
  erfolgreichen `main`-Push gebunden.
- `workflow_dispatch` bleibt bei M10 OFF gesperrt.
- Der Lookup besitzt ausschließlich `actions: read`; keine Actions-/Contents-Schreibrechte werden
  eingeführt.
- Kein synthetischer `build-and-test`-Reporter und kein zweiter Required Check werden angelegt.
- Die Deduplizierung ist keine Merge-, M10-, Owner-, Human- oder Deployment-Autorisierung.

### Erwartetes Verhalten

Erster Lauf für Snapshot A:

```text
M10-Statuscheck (OFF)
→ Cost-Control: kein PASS gefunden
→ Checkout
→ Scope D/C/R
→ notwendige Tests/Build/Docker
→ build-and-test PASS
```

Zweiter Event ohne Head-/Base-Änderung:

```text
M10-Statuscheck (OFF)
→ Cost-Control: exakter PASS gefunden
→ Snapshot-Evidence referenzieren
→ Checkout/npm/Test/Build/Docker SKIP
→ build-and-test PASS
```

Nach Main-Sync oder neuem Commit:

```text
Head oder Base verändert
→ vorheriger PASS nicht wiederverwendbar
→ vollständige CI
```

## P1 Cost-Control — PR-Governance auf einen Runner konsolidieren

`pr-governance.yml` hatte bisher mehrere getrennte Linux-Jobs für dieselbe PR-Identität:

- Kosten-Gate,
- Repository-Konventionen (optional),
- Sicherheit geänderter Workflows,
- PR-Vorlagenvertrag.

Diese logischen Prüfungen werden in einem einzigen Job
`PR Governance (Kosten / Workflow / Vorlage)` ausgeführt. Das reduziert die Anzahl separat
abgerechneter Ubuntu-Jobs und entfernt doppelte Checkouts/Node-Initialisierungen, ohne die
Prüfinhalte oder Required Checks zu schwächen.

### Gemeinsamer Runner-Pfad

```text
PR event
→ trusted main als policy auschecken
→ PR head als candidate auschecken
→ main in candidate importieren
→ Node einmal einrichten
→ Scope mit trusted-main classifier
→ Monatsbudget prüfen
→ Workflow-Security falls erforderlich
→ optionales Repository-Advisory falls Budget erlaubt
→ Production Baseline
→ kanonischen PR-Body validieren
```

### Ereignisregeln

**opened / reopened / synchronize / ready_for_review**

- genau ein Governance-Runner;
- Scope-, Cost-, Workflow- und Template-Prüfung im selben Job;
- Repository-Advisory nur, wenn das bestehende Cost-Gate es zulässt.

**edited**

- genau ein Governance-Runner;
- Scope, Cost-Gate, Workflow-Security und Advisory werden übersprungen;
- Production Baseline + PR-Body-Vertrag laufen erneut vollständig.

**merge_group**

- kein PR-Governance-Runner; identisches Verhalten zur bisherigen Job-Level-Begrenzung auf
  `pull_request`.

### Monatsbudget-Gate

Die bestehende Kostenlogik bleibt erhalten:

```text
BUDGET_MINUTES=3000
REACTIVATE_AT=2026-09-01T00:00:00Z
```

Das Gate steuert ausschließlich `repository:validate:advisory`. Es darf weder `build-and-test`,
Workflow-Security, PR-Body-Validierung noch Merge-Entscheidungen abschalten.

### Trusted-main-Härtung

Die Scope-Klassifikation wird jetzt mit
`../policy/scripts/pr/classifyPrScope.mjs` aus dem trusted-main Checkout ausgeführt, während das
Arbeitsverzeichnis weiterhin `candidate` ist. Damit kann ein PR nicht durch eine eigene Änderung
des Klassifikators seinen Prüfumfang selbst reduzieren.

Workflow-Security verwendet weiterhin
`../policy/scripts/security/verifyChangedWorkflowSecurity.mjs` und bleibt fail-closed.

### Required Checks

P1 benötigt **keine Ruleset-Mutation**. Der kanonische Sollzustand enthält weiterhin nur:

- `build-and-test`,
- `GitGuardian Security Checks`.

Die früheren Governance-Jobnamen waren keine Required-Check-Kontexte.

## Monatliche Budgetkontrolle

Die Kostenlogik in `.github/workflows/pr-governance.yml` bleibt zuständig für optionale
Advisory-Prüfungen. Sie wird nicht in `ci.yml` dupliziert und stellt keine zweite CI-Authority dar.

Die Mechanismen erfüllen unterschiedliche Aufgaben:

- **P0 Exact-Snapshot-Deduplizierung:** reduziert redundante Pflicht-CI desselben Snapshots.
- **P1 Single-Runner-Governance:** reduziert per-job Rundungs-/Runner-Overhead für Governance.
- **Monatsbudget-Gate:** begrenzt optionale/advisory Zusatzarbeit nach bestehender Governance.

## Rollback

Frischen Branch erstellen und den `pull_request`-Trigger wieder eintragen:

```yaml
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, edited]
  workflow_dispatch:
```

`capital-ai-ci` erst nach einem realen PASS wieder als Required Check setzen.

Für einen isolierten Rollback der P0-Cost-Control nur den Step
`P0 CI-Kostenkontrolle — exakten PR-Snapshot wiederverwenden`, den zugehörigen `actions: read`-
Scope und die Skip-Conditions entfernen. **M10 bleibt dabei OFF**, sofern keine separate spätere
Owner-Entscheidung gemäß `AGENTS.md` seine Reaktivierung autorisiert.

Für einen isolierten P1-Rollback `pr-governance.yml` auf die letzte verifizierte Mehrjob-Struktur
zurücksetzen. Dabei weder Required Checks noch M10 noch `ci.yml` verändern.

## Verifikation

Vor Merge des Cost-Control-Changes:

1. aktuellen `main` erneut laden;
2. offene PRs gegen `.github/workflows/ci.yml`, `.github/workflows/pr-governance.yml`, ADR-0073,
   Runbook und Regressionstests korrelieren;
3. Workflow-Sicherheitsprüfung aus dem trusted `main` bestehen;
4. `build-and-test` muss für den neuen Workflow-Head einmal real PASSen;
5. M10-Switch muss weiterhin exakt `false` sein;
6. Production-Jobs müssen weiterhin ausschließlich `push` auf `main` akzeptieren;
7. `pr-governance.yml` darf genau einen `runs-on: ubuntu-latest`-Job besitzen;
8. Workflow-Security und PR-Template-Vertrag müssen im konsolidierten Job erhalten bleiben;
9. Required-Check-Sollzustand muss weiterhin nur `build-and-test` + GitGuardian enthalten.

Nach Merge mit einem geeigneten realen PR verifizieren:

1. erster neuer Head/Base-Snapshot führt reale scope-klassifizierte CI aus;
2. erneutes `reopened`/äquivalentes PR-Ereignis ohne Snapshot-Änderung verwendet den PASS wieder;
3. ein neuer Head oder Base-SHA erzwingt erneut reale CI;
4. Job Summary nennt den wiederverwendeten Run nachvollziehbar;
5. ein normaler PR erzeugt nur einen PR-Governance-Ubuntu-Job;
6. ein PR mit `.github/workflows/**`-Änderung führt Workflow-Security weiterhin fail-closed aus;
7. ein `edited`-Event führt den Baseline-/PR-Body-Vertrag erneut aus, ohne zusätzliche Governance-
   Runner zu starten.

## Erwarteter Nutzen

- ein statt mehrerer vollständiger Node-/Build-Läufe für denselben exakten PR-Snapshot;
- ein statt bis zu drei oder vier getrennten Ubuntu-Jobs pro normalem PR-Governance-Event;
- keine doppelten Policy-/Candidate-Checkouts zwischen Governance-Jobs;
- Node-Initialisierung nur einmal pro Governance-Event;
- unveränderte technische Prüftiefe für jeden **neuen** Head/Base-Snapshot;
- Workflow-Scope-Klassifikation zusätzlich gegen PR-Manipulation gehärtet;
- M10-Passkey bleibt suspendiert;
- unveränderte Human/CODEOWNER-Mergegrenze;
- unveränderte Produktions-Main-Pipeline.
