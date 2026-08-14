# GitGuardian-/Snyk-Integrationsbaseline — 2026-08-14

Status: VERIFIED PASS / PROMOTED TO REQUIRED CHECKS
Repository: `SvenKulessa/Finance`
Aktuelle Main-Baseline: `main@6205868da833a6ee75b5301e78b0a2e6a118c411` (PR #251 Merge)

## Korrektur 2026-08-14 (Sicherheitsaudit-Nachtrag)

Die vorherige Fassung dieses Dokuments stufte Snyk als „PARTIAL / SECOND SNYK HEAD
VERIFICATION ACTIVE" ein und behauptete für PR #249, es sei „kein Check erschienen". Das war
falsch. Eine direkte Abfrage der GitHub-Commit-Status-API (nicht der Checks-API — Snyk meldet
über die ältere Status-API, die in der PR-UI unter „Show all checks" statt im Actions-Tab
erscheint und beim vorherigen Review offenbar übersehen wurde) zeigt für alle drei zuletzt
gemergten PRs vollständige, head-gebundene Snyk- und GitGuardian-Evidence:

| PR | Head-SHA | `security/snyk` | `code/snyk` | GitGuardian |
|---|---|---|---|---|
| #249 | `680c1d2894260447e74fc3374c94cdf969dc75a7` | ✅ „No manifest changes detected in 1 project" | ✅ „No new Code Analysis issues found" | ✅ |
| #250 | `7a6c72bc6aa19bae2721b330c53ba962cb53e730` | ✅ „1 security test has passed" | ✅ „No new Code Analysis issues found" | ✅ |
| #251 | `b81ee47ce08a04b5a87fa74667e8adca627cdaad` | ✅ „1 security test has passed" | ✅ „No new Code Analysis issues found" | ✅ |

Wichtiger Nebenbefund: `code/snyk` ist **Snyk Code**, also ein SAST-Check (semantische
Quellcode-Schwachstellenanalyse) — nicht nur Dependency-Scanning. Das war beim Schreiben der
vorherigen Fassung nicht als eigene Kategorie erkannt.

## Owner-bestätigte Konfiguration

- GitGuardian ist als GitHub App verbunden und liefert `GitGuardian Security Checks`.
- Snyk ist mit GitHub verbunden, `SvenKulessa/Finance` importiert, PR-Check-Konfiguration aktiv.
- Auf `main` existiert keine aktive GitGuardian- oder Snyk-Workflowdatei — beide laufen
  vollständig anbieterseitig, exakt wie in ADR-0070 vorgesehen.
- Ein Snyk-Token liegt weiterhin als GitHub Repository Secret; der Tokenwert wurde zu keinem
  Zeitpunkt gelesen, angezeigt oder in Evidence übernommen.

## Owner-Entscheidung 2026-08-14: Promotion zu Required Checks

Der in ADR-0070 definierte Promotion-Gate („kein Check wird vor zwei Head-gebundenen
erfolgreichen PR-Läufen und separater Owner-Freigabe als Required Check promoviert") ist mit drei
statt zwei unabhängigen, head-gebundenen PASS-Läufen erfüllt. Der Owner hat die Promotion
freigegeben:

- `GitGuardian Security Checks`, `security/snyk (svenkulessa)` und `code/snyk (svenkulessa)`
  wurden zusammen mit `capital-ai-ci` und `build-and-test` als Required Checks im
  `main-production-protection`-Ruleset aktiviert (siehe
  `.github/policies/main-production-protection.expected.json`, `decision_2026-08-14c`).
- CodeQL wurde geprüft und **nicht** als Required Check übernommen: `code/snyk` deckt dieselbe
  SAST-Kategorie bereits ab, ohne zusätzliche GitHub-Actions-Laufzeit zu benötigen — genau das
  Designziel von ADR-0070. Eine parallele SAST-Engine wäre Doppelarbeit, kein zusätzlicher Schutz
  im Sinne einer neuen Bedrohungskategorie.

## Offene Nachweise (nur Owner-seitig einsehbar, kein Tool-Zugriff verfügbar)

- [ ] GitGuardian-App-Zugriff ist auf `SvenKulessa/Finance` begrenzt (App-Berechtigungen unter
  GitHub Settings → Applications, nicht per Tool abfragbar).
- [ ] GitGuardian arbeitet ohne Repository-Schreibrechte (dieselbe Quelle).
- [ ] Snyk automatische Fix-PRs/Write-Zugriffe sind im Snyk-Dashboard deaktiviert.
- [ ] Notwendigkeit des GitHub-Secrets `SNYK_*` ist geklärt — da die Integration App-/
  Status-API-basiert läuft und kein Repository-Workflow das Secret konsumiert (bestätigt durch
  Grep über `.github/workflows/**`), ist der Token vermutlich nicht mehr erforderlich. Löschung
  bleibt eine separate Owner-Entscheidung, da der Zweck des konkreten Secrets ohne Einsicht in
  die Snyk-Projektkonfiguration nicht abschließend bestätigt werden kann.

## Bewertung

| Kontrolle | Status | Begründung |
|---|---|---|
| GitGuardian Laufzeit | VERIFIED PASS | drei unabhängige PR-Heads, alle grün |
| Snyk Dependency-Scan (`security/snyk`) | VERIFIED PASS | drei unabhängige PR-Heads, alle grün |
| Snyk Code / SAST (`code/snyk`) | VERIFIED PASS | drei unabhängige PR-Heads, alle grün |
| App-only Architektur | VERIFIED | kein Workflow in `.github/workflows/**` konsumiert Snyk/GitGuardian |
| Required-Check-Promotion | OWNER-APPROVED, angewendet 2026-08-14 | ADR-0070-Gate mit drei statt zwei Heads übererfüllt |
| CodeQL | BEWUSST NICHT verwendet | Redundanz zu `code/snyk`, keine neue Bedrohungskategorie abgedeckt |
