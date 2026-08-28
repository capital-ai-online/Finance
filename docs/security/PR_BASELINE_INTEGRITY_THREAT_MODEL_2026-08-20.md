# PR Baseline Integrity Threat Model — 2026-08-20

## Scope

Dieses Threat Model beschreibt die Härtung des bestehenden CAPITAL-AI-Prozesspfads

`productionPreflight.mjs → renderPullRequestBody.mjs / updatePrProductionBaseline.mjs → validatePrBody.mjs → PR Governance`

für Produktions-, `main`- und PR-Head-Korrelation. Es wird keine zweite Baseline-Authority eingeführt. `productionPreflight.mjs` bleibt die einzige Quelle der atomaren Produktions-/main-/Head-Identität; der Auto-Refresh darf ausschließlich den daraus gerenderten kanonischen Block in einem bestehenden PR-Body ersetzen.

Seit dem Follow-up vom 28.08.2026 besitzt der trusted Default-Branch-Writer zwei zulässige Reconciliation-Auslöser: abgeschlossene PR-Governance für einen einzelnen PR sowie erfolgreich abgeschlossene Main-CI nach verifiziertem Render-Produktionsdeploy. Der zweite Trigger darf erst schreiben, wenn Trigger-SHA, aktueller `main`-SHA und die über `/healthz` bestätigte Produktions-SHA exakt identisch sind.

## Schutzobjekte

- tatsächliche Produktionsversion und immutable Deployment-SHA
- Produktionsbranch und Repository-Identität
- aktueller `main`-Commit
- exakter PR-Head-Commit
- Drift Produktion → `main` und `main` → PR-Head
- kanonischer PR-Template-Vertrag
- Human/CODEOWNER-Merge-Grenze
- Integrität aller nicht zur Produktions-Baseline gehörenden PR-Body-Inhalte
- Synchronisationszustand review-bereiter Same-Repository-PRs gegen aktuellen `main`
- Bindung eines Post-Deploy-Reconciliation-Laufs an einen tatsächlich verifizierten Production-Deploy

## Trust Boundaries

1. `/healthz` JSON-Payload → Preflight: externes Laufzeit-Signal, zu validieren.
2. `/healthz` `x-capital-ai-*` Header → Preflight: zweite Darstellung derselben Deployment-Identität, nicht unabhängig autorisierend.
3. Kandidaten-Branch → Governance: nicht vertrauenswürdig; darf weder Policy-Script noch kanonische Vorlage bestimmen.
4. `main` Policy-Checkout → Governance: vertrauenswürdige Policy-/Template-Quelle.
5. PR-Body → Validator: untrusted text; muss gegen die aktuell erzeugte Baseline korreliert werden.
6. Abgeschlossener `PR Governance`-Lauf → `workflow_run`-Auto-Refresh: vertrauenswürdiger Default-Branch-Workflow mit eng begrenztem `pull-requests: write`; Kandidaten-Code wird nur als Daten-Snapshot ausgecheckt und niemals ausgeführt.
7. Erfolgreicher `CI`-Main-Lauf → Post-Deploy-Reconciliation: privilegierter `workflow_run`-Pfad. Er wird nur akzeptiert, wenn der Trigger ein `push` auf `main` ist, der CI-Lauf erfolgreich abgeschlossen wurde, der Job `Deployment verifiziert / Render-Produktion` erfolgreich war und `/healthz` denselben immutable SHA wie Trigger und aktueller `main` meldet.
8. Same-Repository-PR-Metadaten → Branch-Sync: Branchname ist keine Identität. Konventionelle `feat/fix/...`-Work-Branches werden deshalb nur automatisch synchronisiert, wenn der PR-Autor dem Repository-Owner entspricht; Provider-Präfixe bleiben separat begrenzt.

## Threats und Kontrollen

### T1 — Unabhängig gerenderte Baseline-Einzelwerte

Mehrere einzelne Template-Platzhalter können aus unterschiedlichen Zeitpunkten/Quellen stammen oder manuell mit `nicht-verfügbar` ersetzt werden.

**Kontrolle:** Abschnitt 3 wird als ein atomarer `PRODUCTION_BASELINE_BLOCK` aus genau einem validierten Baseline-Objekt gerendert. Fallbackwerte sind im Renderer entfernt.

### T2 — Mix-and-match zwischen Production, main und PR-Head

Ein formal plausibler Body kann eine Produktions-SHA mit einem anderen `main`- oder Head-Zustand kombinieren.

**Kontrolle:** `Baseline-ID` ist ein SHA-256 über die kanonische Identität inklusive Production URL/Status/Version/SHA/Branch/Repo/Provider, `main`-SHA, Head-SHA/Version und beiden Drift-Zahlen. Jede relevante Änderung erzeugt eine andere ID.

### T3 — Stale PR-Body nach Push/Rebase/main-Änderung

Ephemere SHAs und Driftwerte können nach Erstellung des PR-Bodys veralten.

**Kontrolle:** Jeder Governance-Lauf erzeugt über trusted `main` einen aktuellen Preflight. Der Validator akzeptiert den Body nur, wenn sein gesamter Baseline-Block zur aktuellen Baseline-ID und den aktuellen Identitätswerten passt. Ein veralteter Body bleibt fail-closed. Nach Abschluss des Governance-Laufs darf der separate trusted-default-branch Auto-Refresh denselben Preflight erneut gegen den aktuellen PR-Head ausführen und ausschließlich den kanonischen Baseline-Block nachziehen. Nach einem später erfolgreich verifizierten Production-Deploy wird zusätzlich ein repositoryweiter Reconciliation-Pass für bereits mit aktuellem `main` synchronisierte Same-Repository-PRs ausgeführt.

### T4 — Body-only-Sonderpfad mit künstlicher Baseline

Der frühere `edited`-Pfad erzeugte eine Minimal-Baseline mit leeren Produktionswerten und synthetischen Driftwerten.

**Kontrolle:** Der Sonderpfad ist entfernt. `opened`, `reopened`, `synchronize`, `ready_for_review` und `edited` verwenden denselben trusted-main `productionPreflight.mjs`. Auch beide Auto-Refresh-Pfade erzeugen keine eigene Baseline und rufen ausschließlich diesen Preflight aus `main` auf.

### T5 — Kandidaten-Branch liefert seine eigene Policy

Ein PR könnte seine eigene Preflight-/Validator-Implementierung abschwächen.

**Kontrolle:** PR Governance führt `../policy/scripts/pr/productionPreflight.mjs` und `../policy/scripts/pr/validatePrBody.mjs` aus dem separaten `main`-Checkout aus. Der Auto-Refresh führt `productionPreflight.mjs` und `updatePrProductionBaseline.mjs` ebenfalls ausschließlich aus dem separaten `main`-Checkout aus. Kandidatencode wird für diesen Vertrag nicht ausgeführt. Im Post-Deploy-Matrixpfad wird der Candidate ausschließlich unter seinem exakten Head-SHA ausgecheckt; ausgeführt werden nur Scripts aus dem an denselben Main-SHA gebundenen `policy`-Checkout.

### T6 — Kandidaten-Branch liefert seine eigene PR-Vorlage

Der bestehende Draft-PR-Workflow verwendete den Renderer aus `main`, ließ den Renderer aber implizit `.github/pull_request_template.md` aus dem Kandidaten-Arbeitsverzeichnis lesen.

**Kontrolle:** `PR_TEMPLATE_PATH` wird explizit auf `../policy/.github/pull_request_template.md` gesetzt. Der Auto-Refresh erzeugt keinen vollständigen Body neu und akzeptiert nur einen bereits vorhandenen kanonischen Template-Marker.

### T7 — Widerspruch zwischen `/healthz` JSON und Headers

Wenn Payload und `x-capital-ai-*` Header unterschiedliche Deployment-Werte enthalten, darf keine Quelle still bevorzugt werden.

**Kontrolle:** Bei Doppelbelegung müssen `version`, `commitSha`, `branch`, `repoSlug` und `provider` exakt übereinstimmen. Widerspruch führt fail-closed zum Abbruch. Der Post-Deploy-Reconciliation-Pfad korreliert zusätzlich JSON-`deployment.commitSha` und `x-capital-ai-commit` vor jeder PR-Matrixbildung.

### T8 — Fehlende Produktionsidentität

Fehlende Version/Branch/Repository-Daten können zu geratenen oder nicht verfügbaren Body-Werten führen.

**Kontrolle:** Normale PR-Preflights verlangen vollständige Produktionsversion, immutable 40-Zeichen-SHA, Branch `main` und Repository-Slug. `nicht-verfügbar`, `unbekannt` oder `legacy-unavailable` sind keine gültigen normalen PR-Baselines.

### T9 — Write-Token in einem PR-kontrollierten Workflow

Ein automatischer Body-Rewriter innerhalb eines normalen `pull_request`-Workflows würde einem vom Kandidaten beeinflussten Workflow-Kontext Schreibrechte geben. `pull_request_target` würde zwar Default-Branch-Code verwenden, ist durch die Repository-Workflow-Security für PR-kontrollierte Pfade ausdrücklich verboten.

**Kontrolle:** `pr-governance.yml` bleibt `pull-requests: read`. Die Schreiboperation liegt ausschließlich in `pr-production-baseline-refresh.yml`, ausgelöst über `workflow_run` nach `PR Governance` oder nach erfolgreich verifizierter Main-CI. Dieser Workflow wird aus dem Default Branch geladen, verwendet immutable gepinnte Actions, persistiert keine Checkout-Credentials und beschränkt Mutationen auf offene Same-Repository-PRs mit Base `main`. Der Post-Deploy-Pfad verwirft zusätzlich PRs, deren Head den aktuellen `main` nicht bereits enthält.

### T10 — Auto-Refresh-Schleife durch neuen Zeitstempel

Ein Body-Write löst `edited → PR Governance → workflow_run` erneut aus. Würde jeder Preflight-Zeitstempel ungeprüft geschrieben, entstünde eine Endlosschleife.

**Kontrolle:** `productionBaselineBody.mjs` vergleicht die komplette atomare Baseline mit dem bereits vorhandenen Block unter Beibehaltung dessen `generatedAt`. Ist die Baseline-Identität unverändert, erfolgt kein Write. Ein neuer Zeitstempel wird nur geschrieben, wenn sich ein durch die Baseline-ID gebundener Identitätswert geändert hat. Der Post-Deploy-Pfad startet Governance nur bei `changed == true`; unveränderte PRs verursachen keinen Re-Run.

### T11 — Race zwischen Preflight, Main-Fortschritt, Head-Push und Human-Body-Edit

Zwischen Preflight und PATCH können `main`, PR-Head oder der übrige PR-Body verändert werden.

**Kontrolle:** Der Updater liest PR und `main` vor der Mutation erneut, verlangt exakte Übereinstimmung von Live-Head/Live-main mit der erzeugten Baseline und überspringt stale Snapshots ohne Write. Unmittelbar vor PATCH wird der aktuelle Body erneut gelesen und nur dessen Baseline-Block ersetzt, sodass bereits erfolgte Human-Edits außerhalb des Blocks erhalten bleiben. Die REST-API bietet für PR-Bodies keinen feldbezogenen Compare-and-Swap; das verbleibende minimale Zeitfenster zwischen letztem GET und PATCH ist ein dokumentiertes Residualrisiko und darf nicht durch breitere Schreibrechte kompensiert werden.

### T12 — Baseline-Refresh läuft vor Abschluss des neuen Produktionsdeployments

Nach einem Main-Merge können Branch-Sync und PR-Governance schneller fertig sein als der neue Render-Deploy. Der Governance-getriggerte Auto-Refresh schreibt dann korrekt `Production=alter SHA / main=neuer SHA`. Ohne späteren Trigger bleibt diese Baseline nach erfolgreichem Deploy erneut stale.

**Kontrolle:** `PR Production Baseline Auto-Refresh` hört zusätzlich auf abgeschlossene `CI`-Runs. Der repositoryweite Write-Pfad wird nur bei `CI + push + main + success` aktiviert, prüft explizit den erfolgreichen Job `Deployment verifiziert / Render-Produktion` und verlangt anschließend `source CI SHA == aktueller main SHA == /healthz Production SHA`. Ein überholter CI-Lauf wird ohne Mutation beendet. Erst danach werden offene Same-Repository-PRs betrachtet.

### T13 — Post-Deploy-Reconciliation schreibt in noch nicht synchronisierte PR-Heads

Ein offener PR kann beim Produktionsdeploy noch auf einem älteren Main-Stand stehen. Würde der Reconciler trotzdem eine Baseline schreiben, würde er eine scheinbar aktuelle Production/Main-Korrelation mit einem Head kombinieren, der ADR-0036 noch nicht erfüllt.

**Kontrolle:** Für jeden offenen Same-Repository-PR wird vor Matrixaufnahme GitHubs Compare-Status `main...head` geprüft. Nur `ahead` oder `identical` gelten als current-main-ancestor. `behind`/`diverged` werden fail-closed übersprungen. Der Candidate-Job wiederholt `git merge-base --is-ancestor` vor dem Preflight.

### T14 — Konventionelle ChatGPT-Branches fallen aus dem automatischen Main-Sync

Die historische Branch-Allowlist erkannte nur `agent/*`, `claude/*`, `grok/*`, `ai/*`. Tatsächlich erzeugte Owner-/ChatGPT-Arbeit verwendet zusätzlich konventionelle Branches wie `feat/*`, `fix/*`, `chore/*` oder `refactor/*`. Review-bereite PRs konnten dadurch nach einem Main-Merge unbemerkt stale bleiben.

**Kontrolle:** Der Sync-Workflow akzeptiert zusätzlich konventionelle Work-Präfixe, aber nur bei Same-Repository-PRs gegen `main`, deren PR-Autor exakt dem Repository-Owner entspricht. Damit wird Branchname nicht zur Identitätsauthority. Forks bleiben ausgeschlossen, Drafts bleiben bei automatischem Main-Push aus Kostenkontrollgründen unberührt, und `expected_head_sha` bindet jede Update-Branch-Mutation weiterhin an den beobachteten immutable Head.

### T15 — Governance-Re-Run nach Post-Deploy-Write ist nicht an denselben Snapshot gebunden

Ein pauschales Re-Run des letzten Governance-Workflows könnte einen anderen PR, Head oder Base-Snapshot wiederverwenden.

**Kontrolle:** Nach einem tatsächlichen Baseline-Write werden Live-PR und Live-main erneut gegen die Matrix-SHAs geprüft. Anschließend wird nur ein bereits abgeschlossener Lauf des stabilen Workflow-Pfads `.github/workflows/pr-governance.yml` ausgewählt, dessen PR-Nummer, Head-SHA und Base-SHA exakt dem gebundenen Snapshot entsprechen. Fehlt ein solcher Run, wird fail-closed abgebrochen. GitHub verlangt für Workflow-Re-Runs `Actions: write`; diese Berechtigung bleibt auf den trusted Writer begrenzt.

### T16 — Dynamischer `run-name` wird fälschlich als Workflow-Identität verwendet

GitHub unterscheidet zwischen dem statischen Workflow-`name`, der im `workflow_run.workflows`-Trigger als Source-Allowlist verwendet wird, und dem optionalen `run-name`, der den einzelnen Lauf in der Actions-Oberfläche bezeichnet. `CI` und `PR Governance` verwenden dynamische `run-name`-Werte. Eine zusätzliche Prüfung auf `workflow_run.name == 'CI'`, `workflow_run.name == 'PR Governance'` oder `run.name === 'PR Governance'` kann dadurch einen zulässigen Lauf verwerfen, obwohl der native Source-Filter bereits den richtigen Workflow gebunden hat. Der reale Main-CI für `2a3dba2397c775ba39831173d6ca7210634fb446` reproduzierte genau diesen Fehler: CI und Render-Deploy waren erfolgreich, der nachgelagerte Baseline-Run wurde jedoch `skipped`.

**Kontrolle:** Die Source-Authority bleibt ausschließlich `on.workflow_run.workflows: ['PR Governance', 'CI']`. Innerhalb des trusted Writers wird der zulässige Pfad anhand der nicht-präsentationalen Ereignismerkmale (`pull_request` bzw. `push + main + success`) und weiterhin über exakte SHAs, Deployment-Job und `/healthz` korreliert. Für die Suche eines bereits abgeschlossenen Governance-Laufs wird der stabile Repository-Pfad `.github/workflows/pr-governance.yml` statt dessen dynamischem Run-Namen verwendet. Regressionstests verbieten die drei fehlerhaften Run-Name-Vergleiche explizit.

## Keine automatische PR-Schreibberechtigung im untrusted PR-Workflow

Der `pull_request`-Governance-Workflow behält `pull-requests: read`. Es wird bewusst kein PR-Head-kontrollierter Auto-Rewriter mit Write-Token eingeführt. Der Auto-Refresh ist ein separater trusted-default-branch `workflow_run`-Pfad und darf ausschließlich den kanonischen Produktions-Baseline-Block verändern. PR-Erstellung, Merge und Produktionsmutation bleiben außerhalb seiner Autorität. Branch-Synchronisation bleibt ausschließlich im separaten `sync-agent-pr-branches.yml`-Pfad mit GitHubs Update-Branch-API.

## Korrelation mit dem bestehenden Main-Sync

`sync-agent-pr-branches.yml` bleibt die einzige automatische Branch-Synchronisation nach `main`-Fortschritt. Für review-bereite vertrauenswürdig klassifizierte Same-Repository-PRs gilt damit:

`main push/merge → update-branch → synchronize → PR Governance → trusted baseline auto-refresh`

Parallel läuft der Main-CI-/Deployment-Pfad:

`main push/merge → CI/build → Render deploy → Deployment verifiziert → post-deploy baseline reconciliation → ggf. exact-head/base PR Governance re-run`

Dadurch ist die Reihenfolge der beiden asynchronen Pfade nicht sicherheitskritisch: Vor abgeschlossenem Deploy darf die Governance-Baseline Production→Main-Drift enthalten; nach verifiziertem Deploy zieht der zweite Pfad alle bereits synchronisierten offenen Same-Repository-PRs idempotent auf `Production=main` nach. Nicht synchronisierte PRs werden nicht künstlich repariert, sondern bleiben bis zum Main-Sync fail-closed.

Draft-PRs bleiben gemäß bestehender Kostenpolicy bei `main`-Push bewusst unsynchronisiert und erhalten erst nach einem autorisierten Synchronisationsereignis eine neue Head-gebundene Baseline.

## Negative Tests

- Änderung einer Head-SHA verändert die Baseline-ID.
- Ein Baseline-Objekt mit nicht passender ID wird abgelehnt.
- Der atomare Renderblock enthält keine Fallbackwerte.
- Gleiche Baseline-Identität bei neuerem Preflight-Zeitstempel erzeugt keinen Body-Write.
- Änderung von `main`/Head ersetzt ausschließlich den kanonischen Baseline-Block; übriger Body bleibt unverändert.
- Doppelte oder fehlende Baseline-Marker werden vom Auto-Refresh fail-closed abgelehnt.
- Fork-/Cross-Repository-PRs erhalten keinen Write-Pfad.
- Geänderter Live-main oder Live-Head nach dem Preflight führt zu Skip statt stale Write.
- Post-Deploy-Reconciliation verlangt `CI + push + main + success` und einen erfolgreichen Job `Deployment verifiziert / Render-Produktion`.
- Source-CI-SHA, aktueller Main-SHA und `/healthz` Production-SHA müssen exakt übereinstimmen.
- Überholte CI-Runs erzeugen keine PR-Matrix und keinen Write.
- PR-Heads ohne aktuellen Main-Ancestor (`behind`/`diverged`) werden vom Post-Deploy-Reconciler ausgeschlossen.
- Candidate-Code wird im privilegierten Reconciliation-Workflow nicht ausgeführt; Policy-Skripte stammen aus dem gebundenen Main-Checkout.
- Governance-Re-Run erfordert exakte PR-Nummer, Head-SHA und Base-SHA.
- Dynamische `run-name`-Werte dürfen weder den CI-/Governance-Source-Pfad noch die Auswahl des Governance-Re-Runs bestimmen.
- Konventionelle `feat/fix/...`-Branches erhalten Auto-Sync nur bei Repository-Owner-Autorenschaft; Fork-/fremde Standard-Branches bleiben ausgeschlossen.
- Workflow-Security bleibt zuständig für unveränderliche Action-SHAs, Minimalberechtigungen und das Verbot von `pull_request_target`.

## Rollback

Keine externe Produktionsmutation. Rollback erfolgt per `git revert` der Governance-Commits. Der Post-Deploy-Reconciliation-Trigger kann durch Revert der Änderungen an `.github/workflows/pr-production-baseline-refresh.yml` entfernt werden; die erweiterte Branch-Erkennung durch Revert von `.github/workflows/sync-agent-pr-branches.yml`. `productionPreflight.mjs`, `validatePrBody.mjs` und die atomare Baseline-ID bleiben dabei unverändert autoritativ. Ein Rollback, der wieder unabhängige Baseline-Fallbackwerte, Kandidaten-Templates, die synthetische Body-only-Baseline oder einen PR-kontrollierten Write-Token als gültige Authority einführt, ist kein akzeptabler Sicherheitszustand.
