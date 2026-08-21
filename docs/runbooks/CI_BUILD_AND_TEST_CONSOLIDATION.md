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

## Monatliche Budgetkontrolle

Die bestehende Kostenlogik in `.github/workflows/pr-governance.yml` bleibt zuständig für optionale
Advisory-Prüfungen. Sie wird nicht in `ci.yml` dupliziert und stellt keine zweite CI-Authority dar.

Die beiden Mechanismen erfüllen unterschiedliche Aufgaben:

- **Exact-Snapshot-Deduplizierung:** reduziert redundante Pflicht-CI desselben Snapshots.
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

## Verifikation

Vor Merge des Cost-Control-Changes:

1. aktuellen `main` erneut laden;
2. offene PRs gegen `.github/workflows/ci.yml`, ADR-0073, Runbook und Regressionstest korrelieren;
3. Workflow-Sicherheitsprüfung aus dem trusted `main` bestehen;
4. `build-and-test` muss für den neuen Workflow-Head einmal real PASSen;
5. M10-Switch muss weiterhin exakt `false` sein;
6. Production-Jobs müssen weiterhin ausschließlich `push` auf `main` akzeptieren.

Nach Merge mit einem geeigneten realen PR verifizieren:

1. erster neuer Head/Base-Snapshot führt reale scope-klassifizierte CI aus;
2. erneutes `reopened`/äquivalentes PR-Ereignis ohne Snapshot-Änderung verwendet den PASS wieder;
3. ein neuer Head oder Base-SHA erzwingt erneut reale CI;
4. Job Summary nennt den wiederverwendeten Run nachvollziehbar.

## Erwarteter Nutzen

- ein statt mehrerer vollständiger Node-/Build-Läufe für denselben exakten PR-Snapshot;
- deutlich geringere Linux-Actions-Minuten bei PR-Body-/Lifecycle-/Synchronisationsfolgen ohne
  Snapshot-Änderung;
- unveränderte technische Prüftiefe für jeden **neuen** Head/Base-Snapshot;
- M10-Passkey bleibt suspendiert;
- unveränderte Human/CODEOWNER-Mergegrenze;
- unveränderte Produktions-Main-Pipeline.
