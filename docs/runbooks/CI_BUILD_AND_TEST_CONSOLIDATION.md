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

## P2B Runbook — Production-CI auf zwei Runner konsolidieren

Dieses P2B-Runbook **ersetzt für die Runner-Topologie** die vorstehende historische Aussage
„unveränderte Produktions-Main-Pipeline“. Gemeint war dort die unveränderte Sicherheitssemantik;
P2B konsolidiert nun bewusst die technische Runner-Topologie.

### Solltopologie nach P2B

```text
push main
→ build-and-test
   → Full Scope R
   → npm ci / audit / lint / unit / build / CSP / predeploy / Docker
   → verifySupplyChainProvenance --require-ci
   → cosign sign-blob
   → cosign verify-blob
   → standalone verifyDeploymentIdentity.mjs bundeln
   → SHA-benanntes Supply-Chain-Artefakt hochladen
→ deploy-production [environment: production]
   → SHA-benanntes Artefakt desselben Workflow-Laufs herunterladen
   → release-manifest.sourceCommit == github.sha prüfen
   → Render Hook ref=github.sha
   → standalone Deployment-Identity-Verifier
   → Deployment-Evidence hochladen
```

Es existieren danach keine separaten Jobs mehr mit den IDs:

- `supply-chain-attestation`
- `verify-deployment-identity`

Ihre Sicherheitsfunktionen sind in den zwei verbleibenden Trust Boundaries erhalten.

### Production-Environment-Grenze

`deploy-production` bleibt der einzige Job mit:

```yaml
environment: production
```

Der Job darf **kein** Repository-Checkout, `npm ci`, `npm run build` oder andere Dependency-
Lifecycle-Ausführung enthalten. Er konsumiert ausschließlich das durch den erfolgreichen Main-
Build erzeugte Workflow-Artefakt.

Vor dem Render-Hook muss zwingend gelten:

```text
release-manifest.sourceCommit == github.sha
standalone deployment verifier exists
```

Erst danach darf `RENDER_DEPLOY_HOOK_URL` mit `ref=${github.sha}` aufgerufen werden.

### Supply-Chain-Handoff

`build-and-test` erzeugt den vollständigen Build nur einmal. `npm run predeploy:check` erzeugt die
bestehende SBOM-/Provenance-Kette. Danach wird mit `--require-ci` die gehostete Builder-Bindung
erzwungen und die Provenance mit Sigstore/Fulcio/Rekor signiert und sofort gegen die erwartete
Workflow-Identität verifiziert.

Der standalone Deployment-Verifier wird aus dem bereits versionierten
`scripts/deployment/verifyDeploymentIdentity.ts` mit dem vorhandenen `esbuild` erzeugt. Dadurch
entsteht **keine zweite Verifikationslogik**.

### Erwartete Runner-/Installationswirkung

Pro erfolgreichem `main`-Push:

| Metrik | Vor P2B | Nach P2B |
|---|---:|---:|
| `ubuntu-latest` Jobs in `ci.yml` | 4 | 2 |
| `npm ci` | 3 | 1 |
| `npm run build` | 2 | 1 |
| `npm run predeploy:check` | 2 | 1 |
| Repository-Checkouts | 3 | 1 |

### P2B Pre-Merge-Verifikation

1. `M10_CI_GATE_ENABLED` bleibt exakt `false`.
2. `tests/unit/productionCiRunnerConsolidation.test.ts` muss PASS sein.
3. `ci.yml` besitzt genau zwei `runs-on: ubuntu-latest`.
4. Workflow-Security aus trusted `main` muss alle geänderten Workflows akzeptieren.
5. Alle externen Actions bleiben immutable auf 40-stellige SHAs gepinnt.
6. `build-and-test` besitzt weiterhin `id-token: write` für OIDC/Sigstore.
7. `deploy-production` besitzt keine Contents-Schreibrechte und keinen Checkout/npm/build-Pfad.
8. Required Checks bleiben `build-and-test` + GitGuardian; keine Ruleset-Mutation für P2B.
9. Vor PR/Draft-PR erneut aktuellen `main` und alle offenen PRs korrelieren.

### P2B Post-Merge-Verifikation

Der erste reale Main-Push nach Merge muss zeigen:

1. `build-and-test` real PASS einschließlich Provenance `--require-ci`.
2. Cosign `sign-blob` und `verify-blob` PASS.
3. Supply-Chain-Artefakt enthält SBOM, Provenance, Sigstore-Bundle, Release-Manifest und standalone
   Deployment-Verifier.
4. `deploy-production` lädt exakt dieses Artefakt und akzeptiert dessen Release-Manifest-SHA.
5. Render wird mit exakt `github.sha` ausgelöst.
6. `/healthz` meldet anschließend denselben SHA und Status `ok`.
7. Deployment-Identity-Evidence wird unter dem SHA-benannten 90-Tage-Artefakt gespeichert.

### P2B Rollback

Ein isolierter Rollback darf die frühere Vier-Runner-Struktur wiederherstellen, aber niemals:

- Sigstore-Signatur/Verifikation entfernen,
- den `production`-Environment-Schutz umgehen,
- `ref=${github.sha}` aufweichen,
- post-deploy Exact-SHA-Verifikation entfernen,
- M10 reaktivieren,
- Required-Check-Namen verändern.

Die Implementierungs-Evidence ist in
`docs/evidence/P2B_PRODUCTION_CI_RUNNER_CONSOLIDATION_2026-08-21.md` dokumentiert.
