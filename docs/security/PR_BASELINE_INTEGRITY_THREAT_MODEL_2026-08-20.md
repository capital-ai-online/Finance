# PR Baseline Integrity Threat Model — 2026-08-20

## Scope

Dieses Threat Model beschreibt die Härtung des bestehenden CAPITAL-AI-Prozesspfads

`productionPreflight.mjs → renderPullRequestBody.mjs → validatePrBody.mjs → PR Governance`

für Produktions-, `main`- und PR-Head-Korrelation. Es wird keine zweite Baseline-Authority eingeführt.

## Schutzobjekte

- tatsächliche Produktionsversion und immutable Deployment-SHA
- Produktionsbranch und Repository-Identität
- aktueller `main`-Commit
- exakter PR-Head-Commit
- Drift Produktion → `main` und `main` → PR-Head
- kanonischer PR-Template-Vertrag
- Human/CODEOWNER-Merge-Grenze

## Trust Boundaries

1. `/healthz` JSON-Payload → Preflight: externes Laufzeit-Signal, zu validieren.
2. `/healthz` `x-capital-ai-*` Header → Preflight: zweite Darstellung derselben Deployment-Identität, nicht unabhängig autorisierend.
3. Kandidaten-Branch → Governance: nicht vertrauenswürdig; darf weder Policy-Script noch kanonische Vorlage bestimmen.
4. `main` Policy-Checkout → Governance: vertrauenswürdige Policy-/Template-Quelle.
5. PR-Body → Validator: untrusted text; muss gegen die aktuell erzeugte Baseline korreliert werden.

## Threats und Kontrollen

### T1 — Unabhängig gerenderte Baseline-Einzelwerte

Mehrere einzelne Template-Platzhalter können aus unterschiedlichen Zeitpunkten/Quellen stammen oder manuell mit `nicht-verfügbar` ersetzt werden.

**Kontrolle:** Abschnitt 3 wird als ein atomarer `PRODUCTION_BASELINE_BLOCK` aus genau einem validierten Baseline-Objekt gerendert. Fallbackwerte sind im Renderer entfernt.

### T2 — Mix-and-match zwischen Production, main und PR-Head

Ein formal plausibler Body kann eine Produktions-SHA mit einem anderen `main`- oder Head-Zustand kombinieren.

**Kontrolle:** `Baseline-ID` ist ein SHA-256 über die kanonische Identität inklusive Production URL/Status/Version/SHA/Branch/Repo/Provider, `main`-SHA, Head-SHA/Version und beiden Drift-Zahlen. Jede relevante Änderung erzeugt eine andere ID.

### T3 — Stale PR-Body nach Push/Rebase/main-Änderung

Ephemere SHAs und Driftwerte können nach Erstellung des PR-Bodys veralten.

**Kontrolle:** Jeder Governance-Lauf erzeugt über trusted `main` einen aktuellen Preflight. Der Validator akzeptiert den Body nur, wenn sein gesamter Baseline-Block zur aktuellen Baseline-ID und den aktuellen Identitätswerten passt. Ein veralteter Body bleibt fail-closed, bis er über denselben Preflight/Renderer-Pfad neu erzeugt wird.

### T4 — Body-only-Sonderpfad mit künstlicher Baseline

Der frühere `edited`-Pfad erzeugte eine Minimal-Baseline mit leeren Produktionswerten und synthetischen Driftwerten.

**Kontrolle:** Der Sonderpfad ist entfernt. `opened`, `reopened`, `synchronize`, `ready_for_review` und `edited` verwenden denselben trusted-main `productionPreflight.mjs`.

### T5 — Kandidaten-Branch liefert seine eigene Policy

Ein PR könnte seine eigene Preflight-/Validator-Implementierung abschwächen.

**Kontrolle:** PR Governance führt `../policy/scripts/pr/productionPreflight.mjs` und `../policy/scripts/pr/validatePrBody.mjs` aus dem separaten `main`-Checkout aus. Kandidatencode wird für diesen Vertrag nicht ausgeführt.

### T6 — Kandidaten-Branch liefert seine eigene PR-Vorlage

Der bestehende Draft-PR-Workflow verwendete den Renderer aus `main`, ließ den Renderer aber implizit `.github/pull_request_template.md` aus dem Kandidaten-Arbeitsverzeichnis lesen.

**Kontrolle:** `PR_TEMPLATE_PATH` wird explizit auf `../policy/.github/pull_request_template.md` gesetzt.

### T7 — Widerspruch zwischen `/healthz` JSON und Headers

Wenn Payload und `x-capital-ai-*` Header unterschiedliche Deployment-Werte enthalten, darf keine Quelle still bevorzugt werden.

**Kontrolle:** Bei Doppelbelegung müssen `version`, `commitSha`, `branch`, `repoSlug` und `provider` exakt übereinstimmen. Widerspruch führt fail-closed zum Abbruch.

### T8 — Fehlende Produktionsidentität

Fehlende Version/Branch/Repository-Daten können zu geratenen oder nicht verfügbaren Body-Werten führen.

**Kontrolle:** Normale PR-Preflights verlangen vollständige Produktionsversion, immutable 40-Zeichen-SHA, Branch `main` und Repository-Slug. `nicht-verfügbar`, `unbekannt` oder `legacy-unavailable` sind keine gültigen normalen PR-Baselines.

## Keine automatische PR-Schreibberechtigung im untrusted PR-Workflow

Der `pull_request`-Governance-Workflow behält `pull-requests: read`. Es wird bewusst kein PR-Head-kontrollierter Auto-Rewriter mit Write-Token eingeführt. Korrektur erfolgt vor der PR-Erstellung bzw. durch erneutes Rendern über den bestehenden trusted Prozessweg.

## Negative Tests

- Änderung einer Head-SHA verändert die Baseline-ID.
- Ein Baseline-Objekt mit nicht passender ID wird abgelehnt.
- Der atomare Renderblock enthält keine Fallbackwerte.
- Workflow-Security bleibt zuständig für unveränderliche Action-SHAs und Minimalberechtigungen.

## Rollback

Keine externe Produktionsmutation. Rollback erfolgt per `git revert` der Governance-Commits. Ein Rollback, der wieder unabhängige Baseline-Fallbackwerte, Kandidaten-Templates oder die synthetische Body-only-Baseline als gültige Authority einführt, ist kein akzeptabler Sicherheitszustand.
