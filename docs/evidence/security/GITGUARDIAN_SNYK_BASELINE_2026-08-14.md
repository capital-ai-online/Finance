# GitGuardian-/Snyk-Integrationsbaseline — 2026-08-14

Status: VERIFIED PASS / SNYK PROMOTED TO REQUIRED CHECKS, GITGUARDIAN-PROMOTION UNBESTÄTIGT
Repository: `SvenKulessa/Finance`
Aktuelle Main-Baseline: `main@e2830fba142e076c49b8837e0823b8526f5f4e26` (PR #253 Merge)

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

- `security/snyk (svenkulessa)` und `code/snyk (svenkulessa)` wurden anstelle von CodeQL als
  Required Checks im `main-production-protection`-Ruleset aktiviert (Owner-bestätigt). Ob
  `GitGuardian Security Checks` ebenfalls als Required Check aktiv ist, ist zum Zeitpunkt dieser
  Dokument-Fassung noch nicht Owner-bestätigt und daher als offener Nachweis unten geführt statt
  als erledigt markiert. `.github/policies/main-production-protection.expected.json`
  (`decision_2026-08-14c`) beschreibt den vorgeschlagenen Zielzustand mit allen drei Kontexten.
- CodeQL wurde geprüft und **nicht** als Required Check übernommen: `code/snyk` deckt dieselbe
  SAST-Kategorie bereits ab, ohne zusätzliche GitHub-Actions-Laufzeit zu benötigen — genau das
  Designziel von ADR-0070. Eine parallele SAST-Engine wäre Doppelarbeit, kein zusätzlicher Schutz
  im Sinne einer neuen Bedrohungskategorie.

## Owner-Entscheidung 2026-08-14b: Snyk-Token bleibt gesetzt

Der Owner hat bestätigt, dass der bestehende Snyk-Token als GitHub Repository Secret absichtlich
gesetzt ist und weiterverwendet werden soll — keine Altlast. Grep über `.github/workflows/**`
bestätigt weiterhin, dass kein Repository-Workflow das Secret direkt liest; die Verwendung erfolgt
ausschließlich anbieterseitig innerhalb der Snyk-GitHub-Integration, konsistent mit der
App-only-Architektur aus ADR-0070. Damit ist dieser Punkt geschlossen.

## Offene Nachweise (nur Owner-seitig einsehbar, kein Tool-Zugriff verfügbar)

- [ ] GitGuardian-App-Zugriff ist auf `SvenKulessa/Finance` begrenzt (App-Berechtigungen unter
  GitHub Settings → Applications, nicht per Tool abfragbar).
- [ ] GitGuardian arbeitet ohne Repository-Schreibrechte (dieselbe Quelle).
- [ ] Snyk automatische Fix-PRs/Write-Zugriffe sind im Snyk-Dashboard deaktiviert.
- [ ] `GitGuardian Security Checks` als Required Check im Ruleset bestätigen oder bewusst weglassen
  (siehe Owner-Entscheidung oben — noch offen, ob es zusätzlich zu `security/snyk` und `code/snyk`
  aktiviert wurde).

## Bewertung

| Kontrolle | Status | Begründung |
|---|---|---|
| GitGuardian Laufzeit | VERIFIED PASS | drei unabhängige PR-Heads, alle grün |
| Snyk Dependency-Scan (`security/snyk`) | VERIFIED PASS | drei unabhängige PR-Heads, alle grün |
| Snyk Code / SAST (`code/snyk`) | VERIFIED PASS | drei unabhängige PR-Heads, alle grün |
| App-only Architektur | VERIFIED | kein Workflow in `.github/workflows/**` konsumiert Snyk/GitGuardian |
| Required-Check-Promotion Snyk | OWNER-APPROVED, angewendet 2026-08-14 | `security/snyk` und `code/snyk` ersetzen CodeQL im Ruleset |
| Required-Check-Promotion GitGuardian | UNBESTÄTIGT | ADR-0070-Gate erfüllt, Owner-Bestätigung der Ruleset-Aktivierung steht noch aus |
| Snyk-Token (GitHub Secret) | VERWENDUNG BESTÄTIGT | Owner-Entscheidung 2026-08-14b, kein Repository-Workflow liest es |
| CodeQL | BEWUSST NICHT verwendet | Redundanz zu `code/snyk`, keine neue Bedrohungskategorie abgedeckt |
