# GitGuardian-/Snyk-Integrationsbaseline — 2026-08-14

Status: PARTIAL / SNYK PR CHECK VERIFICATION ACTIVE  
Repository: `SvenKulessa/Finance`  
Aktuelle Main-Baseline: `main@d084b33d90bd416258b2887f7493607928a691e3`  
Aktueller Verifikationsbranch: `agent/snyk-pr-check-verification-1`

## Verifizierte Repository-Fakten

- PR #249 wurde als `d084b33d90bd416258b2887f7493607928a691e3` in `main` gemerged.
- Der zugehörige Remote-Branch wurde nach Merge automatisch gelöscht.
- Zum Beginn dieses Verifikationsschritts waren keine Pull Requests offen.
- Auf `main` existiert keine aktive GitGuardian- oder Snyk-Workflowdatei.
- `.github/workflows/**` und Rulesets werden durch diesen Branch nicht verändert.
- Der bestehende Required-Check-Pfad `capital-ai-ci` bleibt unverändert.

## PR #249 — erster externer Beobachtungslauf

| Scanner | Ergebnis | Evidence-Qualität |
|---|---|---|
| GitGuardian | PASS | Owner-bestätigt für PR #249 / Head `680c1d2894260447e74fc3374c94cdf969dc75a7` |
| Snyk | KEIN CHECK ERSCHIENEN | Kein Head-SHA-Nachweis; nicht als PASS wertbar |

PR #249 zählt als erster aktueller GitGuardian-Head-Nachweis, aber nicht als Snyk-Nachweis.

## Nach PR #249 Owner-bestätigte Snyk-Konfiguration

- Snyk ist mit GitHub verbunden.
- `SvenKulessa/Finance` wurde in Snyk importiert.
- PR-Check-Konfiguration wurde im importierten Repository eingestellt.
- Ein Snyk-Token ist als GitHub Secret hinterlegt.

Der Tokenwert wurde nicht gelesen, angezeigt oder in Evidence übernommen. Die reine Existenz eines Secrets beweist keine Verwendung. Da ADR-0070 eine App-only-Architektur vorsieht und kein Workflow das Secret konsumiert, wird nach erfolgreicher App-Verifikation separat geprüft, ob das Secret entfernt werden kann.

## Offene Nachweise

- [ ] GitGuardian-App-Zugriff ist auf `SvenKulessa/Finance` begrenzt.
- [ ] GitGuardian arbeitet ohne Repository-Schreibrechte.
- [x] Erster aktueller GitGuardian-Check ist an PR #249 / exakten Head-SHA gebunden — Owner-bestätigt.
- [x] Snyk-GitHub-Integration hat `SvenKulessa/Finance` importiert — Owner-bestätigt.
- [ ] Snyk automatische Fix-PRs/Write-Zugriffe sind deaktiviert.
- [ ] Erster aktueller Snyk-Check erscheint für einen exakten PR/Head-SHA.
- [ ] Zweiter unabhängiger PR-Head bestätigt GitGuardian.
- [ ] Zweiter unabhängiger PR-Head bestätigt Snyk.
- [ ] Keine Secrets erscheinen in exportierter Evidence.
- [ ] Notwendigkeit des ungenutzten GitHub Secrets ist geklärt.
- [ ] Separate Owner-Entscheidung über eine spätere Required-Check-Promotion.

## Bewertung

| Kontrolle | Status | Begründung |
|---|---|---|
| GitGuardian Laufzeit | PARTIAL PASS | ein bestätigter PR-Head |
| Snyk Repository-Import | OWNER CONFIRMED | aktueller PR-Check noch ausstehend |
| Snyk PR Checks | VERIFICATION ACTIVE | dieser Branch ist erster Test nach Konfiguration |
| App-only Architektur | IMPLEMENTED IN GOVERNANCE | keine Scanner-Workflow-Mutation |
| GitHub Secret | REVIEW REQUIRED | vorhanden, aber in App-only-Variante möglicherweise unnötig |
| Required-Check-Promotion | BLOCKED | zwei erfolgreiche PR-Heads pro Scanner + Owner-Freigabe fehlen |

## Nächster Schritt

Dieser Dokumentations-PR dient als erster Snyk-PR-Check-Test nach der anbieterseitigen Konfiguration und als zweiter GitGuardian-Beobachtungslauf. Beide Ergebnisse müssen für den exakten PR-Head festgehalten werden. Keine Promotion zu Required Checks in diesem PR.
