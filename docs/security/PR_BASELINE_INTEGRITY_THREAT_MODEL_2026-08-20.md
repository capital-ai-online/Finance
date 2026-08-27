# PR Baseline Integrity Threat Model — 2026-08-20

## Scope

Dieses Threat Model beschreibt die Härtung des bestehenden CAPITAL-AI-Prozesspfads

`productionPreflight.mjs → renderPullRequestBody.mjs / updatePrProductionBaseline.mjs → validatePrBody.mjs → PR Governance`

für Produktions-, `main`- und PR-Head-Korrelation. Es wird keine zweite Baseline-Authority eingeführt. `productionPreflight.mjs` bleibt die einzige Quelle der atomaren Produktions-/main-/Head-Identität; der Auto-Refresh darf ausschließlich den daraus gerenderten kanonischen Block in einem bestehenden PR-Body ersetzen.

## Schutzobjekte

- tatsächliche Produktionsversion und immutable Deployment-SHA
- Produktionsbranch und Repository-Identität
- aktueller `main`-Commit
- exakter PR-Head-Commit
- Drift Produktion → `main` und `main` → PR-Head
- kanonischer PR-Template-Vertrag
- Human/CODEOWNER-Merge-Grenze
- Integrität aller nicht zur Produktions-Baseline gehörenden PR-Body-Inhalte

## Trust Boundaries

1. `/healthz` JSON-Payload → Preflight: externes Laufzeit-Signal, zu validieren.
2. `/healthz` `x-capital-ai-*` Header → Preflight: zweite Darstellung derselben Deployment-Identität, nicht unabhängig autorisierend.
3. Kandidaten-Branch → Governance: nicht vertrauenswürdig; darf weder Policy-Script noch kanonische Vorlage bestimmen.
4. `main` Policy-Checkout → Governance: vertrauenswürdige Policy-/Template-Quelle.
5. PR-Body → Validator: untrusted text; muss gegen die aktuell erzeugte Baseline korreliert werden.
6. Abgeschlossener `PR Governance`-Lauf → `workflow_run`-Auto-Refresh: vertrauenswürdiger Default-Branch-Workflow mit eng begrenztem `pull-requests: write`; Kandidaten-Code wird nur als Daten-Snapshot ausgecheckt und niemals ausgeführt.

## Threats und Kontrollen

### T1 — Unabhängig gerenderte Baseline-Einzelwerte

Mehrere einzelne Template-Platzhalter können aus unterschiedlichen Zeitpunkten/Quellen stammen oder manuell mit `nicht-verfügbar` ersetzt werden.

**Kontrolle:** Abschnitt 3 wird als ein atomarer `PRODUCTION_BASELINE_BLOCK` aus genau einem validierten Baseline-Objekt gerendert. Fallbackwerte sind im Renderer entfernt.

### T2 — Mix-and-match zwischen Production, main und PR-Head

Ein formal plausibler Body kann eine Produktions-SHA mit einem anderen `main`- oder Head-Zustand kombinieren.

**Kontrolle:** `Baseline-ID` ist ein SHA-256 über die kanonische Identität inklusive Production URL/Status/Version/SHA/Branch/Repo/Provider, `main`-SHA, Head-SHA/Version und beiden Drift-Zahlen. Jede relevante Änderung erzeugt eine andere ID.

### T3 — Stale PR-Body nach Push/Rebase/main-Änderung

Ephemere SHAs und Driftwerte können nach Erstellung des PR-Bodys veralten.

**Kontrolle:** Jeder Governance-Lauf erzeugt über trusted `main` einen aktuellen Preflight. Der Validator akzeptiert den Body nur, wenn sein gesamter Baseline-Block zur aktuellen Baseline-ID und den aktuellen Identitätswerten passt. Ein veralteter Body bleibt fail-closed. Nach Abschluss des Governance-Laufs darf der separate trusted-default-branch Auto-Refresh denselben Preflight erneut gegen den aktuellen PR-Head ausführen und ausschließlich den kanonischen Baseline-Block nachziehen.

### T4 — Body-only-Sonderpfad mit künstlicher Baseline

Der frühere `edited`-Pfad erzeugte eine Minimal-Baseline mit leeren Produktionswerten und synthetischen Driftwerten.

**Kontrolle:** Der Sonderpfad ist entfernt. `opened`, `reopened`, `synchronize`, `ready_for_review` und `edited` verwenden denselben trusted-main `productionPreflight.mjs`. Auch der Auto-Refresh erzeugt keine eigene Baseline und ruft ausschließlich diesen Preflight aus `main` auf.

### T5 — Kandidaten-Branch liefert seine eigene Policy

Ein PR könnte seine eigene Preflight-/Validator-Implementierung abschwächen.

**Kontrolle:** PR Governance führt `../policy/scripts/pr/productionPreflight.mjs` und `../policy/scripts/pr/validatePrBody.mjs` aus dem separaten `main`-Checkout aus. Der Auto-Refresh führt `productionPreflight.mjs` und `updatePrProductionBaseline.mjs` ebenfalls ausschließlich aus dem separaten `main`-Checkout aus. Kandidatencode wird für diesen Vertrag nicht ausgeführt.

### T6 — Kandidaten-Branch liefert seine eigene PR-Vorlage

Der bestehende Draft-PR-Workflow verwendete den Renderer aus `main`, ließ den Renderer aber implizit `.github/pull_request_template.md` aus dem Kandidaten-Arbeitsverzeichnis lesen.

**Kontrolle:** `PR_TEMPLATE_PATH` wird explizit auf `../policy/.github/pull_request_template.md` gesetzt. Der Auto-Refresh erzeugt keinen vollständigen Body neu und akzeptiert nur einen bereits vorhandenen kanonischen Template-Marker.

### T7 — Widerspruch zwischen `/healthz` JSON und Headers

Wenn Payload und `x-capital-ai-*` Header unterschiedliche Deployment-Werte enthalten, darf keine Quelle still bevorzugt werden.

**Kontrolle:** Bei Doppelbelegung müssen `version`, `commitSha`, `branch`, `repoSlug` und `provider` exakt übereinstimmen. Widerspruch führt fail-closed zum Abbruch.

### T8 — Fehlende Produktionsidentität

Fehlende Version/Branch/Repository-Daten können zu geratenen oder nicht verfügbaren Body-Werten führen.

**Kontrolle:** Normale PR-Preflights verlangen vollständige Produktionsversion, immutable 40-Zeichen-SHA, Branch `main` und Repository-Slug. `nicht-verfügbar`, `unbekannt` oder `legacy-unavailable` sind keine gültigen normalen PR-Baselines.

### T9 — Write-Token in einem PR-kontrollierten Workflow

Ein automatischer Body-Rewriter innerhalb eines normalen `pull_request`-Workflows würde einem vom Kandidaten beeinflussten Workflow-Kontext Schreibrechte geben. `pull_request_target` würde zwar Default-Branch-Code verwenden, ist durch die Repository-Workflow-Security für PR-kontrollierte Pfade ausdrücklich verboten.

**Kontrolle:** `pr-governance.yml` bleibt `pull-requests: read`. Die Schreiboperation liegt ausschließlich in `pr-production-baseline-refresh.yml`, ausgelöst über `workflow_run` nach `PR Governance`. Dieser Workflow wird aus dem Default Branch geladen, verwendet immutable gepinnte Actions, persistiert keine Checkout-Credentials und beschränkt Mutationen auf offene Same-Repository-PRs mit Base `main`.

### T10 — Auto-Refresh-Schleife durch neuen Zeitstempel

Ein Body-Write löst `edited → PR Governance → workflow_run` erneut aus. Würde jeder Preflight-Zeitstempel ungeprüft geschrieben, entstünde eine Endlosschleife.

**Kontrolle:** `productionBaselineBody.mjs` vergleicht die komplette atomare Baseline mit dem bereits vorhandenen Block unter Beibehaltung dessen `generatedAt`. Ist die Baseline-Identität unverändert, erfolgt kein Write. Ein neuer Zeitstempel wird nur geschrieben, wenn sich ein durch die Baseline-ID gebundener Identitätswert geändert hat.

### T11 — Race zwischen Preflight, Main-Fortschritt, Head-Push und Human-Body-Edit

Zwischen Preflight und PATCH können `main`, PR-Head oder der übrige PR-Body verändert werden.

**Kontrolle:** Der Updater liest PR und `main` vor der Mutation erneut, verlangt exakte Übereinstimmung von Live-Head/Live-main mit der erzeugten Baseline und überspringt stale Snapshots ohne Write. Unmittelbar vor PATCH wird der aktuelle Body erneut gelesen und nur dessen Baseline-Block ersetzt, sodass bereits erfolgte Human-Edits außerhalb des Blocks erhalten bleiben. Die REST-API bietet für PR-Bodies keinen feldbezogenen Compare-and-Swap; das verbleibende minimale Zeitfenster zwischen letztem GET und PATCH ist ein dokumentiertes Residualrisiko und darf nicht durch breitere Schreibrechte kompensiert werden.

## Keine automatische PR-Schreibberechtigung im untrusted PR-Workflow

Der `pull_request`-Governance-Workflow behält `pull-requests: read`. Es wird bewusst kein PR-Head-kontrollierter Auto-Rewriter mit Write-Token eingeführt. Der neue Auto-Refresh ist ein separater trusted-default-branch `workflow_run`-Pfad und darf ausschließlich den kanonischen Produktions-Baseline-Block verändern. PR-Erstellung, Merge, Branch-Mutation und Produktionsmutation bleiben außerhalb seiner Autorität.

## Korrelation mit dem bestehenden Main-Sync

`sync-agent-pr-branches.yml` bleibt die einzige vorhandene automatische Branch-Synchronisation nach `main`-Fortschritt. Für review-bereite Agenten-PRs gilt damit:

`main push/merge → update-branch → synchronize → PR Governance → trusted baseline auto-refresh → edited → PR Governance`

Der abschließende Governance-Lauf muss ohne weiteren Body-Write bestehen. Draft-PRs bleiben gemäß bestehender Kostenpolicy bei `main`-Push bewusst unsynchronisiert und erhalten erst nach einem autorisierten Synchronisationsereignis eine neue Head-gebundene Baseline.

## Negative Tests

- Änderung einer Head-SHA verändert die Baseline-ID.
- Ein Baseline-Objekt mit nicht passender ID wird abgelehnt.
- Der atomare Renderblock enthält keine Fallbackwerte.
- Gleiche Baseline-Identität bei neuerem Preflight-Zeitstempel erzeugt keinen Body-Write.
- Änderung von `main`/Head ersetzt ausschließlich den kanonischen Baseline-Block; übriger Body bleibt unverändert.
- Doppelte oder fehlende Baseline-Marker werden vom Auto-Refresh fail-closed abgelehnt.
- Fork-/Cross-Repository-PRs erhalten keinen Write-Pfad.
- Geänderter Live-main oder Live-Head nach dem Preflight führt zu Skip statt stale Write.
- Workflow-Security bleibt zuständig für unveränderliche Action-SHAs, Minimalberechtigungen und das Verbot von `pull_request_target`.

## Rollback

Keine externe Produktionsmutation. Rollback erfolgt per `git revert` der Governance-Commits. Der Auto-Refresh kann durch Revert von `.github/workflows/pr-production-baseline-refresh.yml` und der zugehörigen Helper-Skripte entfernt werden, ohne `productionPreflight.mjs`, `validatePrBody.mjs` oder die atomare Baseline-ID zurückzubauen. Ein Rollback, der wieder unabhängige Baseline-Fallbackwerte, Kandidaten-Templates, die synthetische Body-only-Baseline oder einen PR-kontrollierten Write-Token als gültige Authority einführt, ist kein akzeptabler Sicherheitszustand.
