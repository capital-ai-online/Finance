# GitGuardian-/Snyk-Integrationsbaseline — 2026-08-14

Status: PARTIAL / RUNTIME VERIFICATION REQUIRED  
Repository: `SvenKulessa/Finance`  
Baseline: `main@5e8471de10644a5432017d28d2f4ff0657d92dd5`  
Branch: `agent/security-scanner-app-integration`

## Verifizierte Repository-Fakten

- PR #248 wurde in `main` gemerged.
- Zum Beginn dieses Arbeitsschritts waren keine Pull Requests offen.
- Auf `main` existiert keine aktive GitGuardian- oder Snyk-Workflowdatei.
- `.github/workflows/**`, Rulesets und Repository-Secrets werden durch diesen Branch nicht verändert.
- Der bestehende Required-Check-Pfad `capital-ai-ci` bleibt unverändert.

## Owner-bestätigte externe Fakten

- GitGuardian ist bereits als GitHub App integriert.
- Ein Snyk-Token ist bereits gesetzt.

Diese Aussagen wurden nicht durch Auslesen von Tokenwerten oder externen Anbieteradministrationsseiten verifiziert. Sie werden nicht als `VERIFIED PASS` hochgestuft.

## Historische Evidence

Die Recovery-Dokumentation zu PR #236–#246 hält fest, dass GitGuardian und Snyk bei betroffenen Folge-PRs erfolgreich waren, während die eigene CI-Control-Plane fehlschlug. Diese historische Aussage beweist keine aktuelle Head-SHA-gebundene Laufzeitfunktion nach PR #248.

Referenz:

- `docs/evidence/ci/PR236_BOOTSTRAP_INCIDENT_2026-08-13.md`

## Offene Nachweise

- [ ] GitGuardian-App-Zugriff ist auf `SvenKulessa/Finance` begrenzt.
- [ ] GitGuardian arbeitet ohne Repository-Schreibrechte.
- [ ] Snyk-GitHub-Integration hat `SvenKulessa/Finance` importiert.
- [ ] Snyk automatische Fix-PRs/Write-Zugriffe sind deaktiviert.
- [ ] Erster aktueller GitGuardian-Check ist an exakten PR/Head-SHA gebunden.
- [ ] Erster aktueller Snyk-Check ist an exakten PR/Head-SHA gebunden.
- [ ] Zweiter unabhängiger PR-Head bestätigt beide Scanner.
- [ ] Keine Secrets erscheinen in exportierter Evidence.
- [ ] Separate Owner-Entscheidung über eine spätere Required-Check-Promotion.

## Bewertung

| Kontrolle | Status | Begründung |
|---|---|---|
| GitGuardian App vorhanden | OWNER CONFIRMED | UI-/Permission-Evidence offen |
| Snyk Token vorhanden | OWNER CONFIRMED | Wert absichtlich nicht gelesen |
| Snyk Repository-Import | OPEN | Anbieter-Laufzeitnachweis fehlt |
| App-only Architektur | IMPLEMENTED IN GOVERNANCE | keine Workflow-/Secret-Mutation |
| Head-SHA-Laufzeittest | OPEN | benötigt neuen PR |
| Required-Check-Promotion | BLOCKED | zwei erfolgreiche PR-Heads + Owner-Freigabe fehlen |

## Nächster Schritt

Draft-PR für diesen Dokumentationsbranch öffnen. Dieser PR dient als erster aktueller Head-SHA-Test der externen Scanner. Er darf die Scannerchecks nicht selbst als Required Checks promovieren.
