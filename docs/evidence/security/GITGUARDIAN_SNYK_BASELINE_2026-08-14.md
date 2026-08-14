# GitGuardian-/Snyk-Integrationsbaseline — 2026-08-14

Status: PARTIAL / SECOND SNYK HEAD VERIFICATION ACTIVE  
Repository: `SvenKulessa/Finance`  
Aktuelle Main-Baseline: `main@efefd4298ea8e6a2dc712d03192e894a19ae4464`  
Aktueller Verifikationsbranch: `agent/snyk-pr-check-verification-2`

## Verifizierte Repository-Fakten

- PR #249 wurde als `d084b33d90bd416258b2887f7493607928a691e3` gemerged.
- PR #250 wurde als `efefd4298ea8e6a2dc712d03192e894a19ae4464` gemerged.
- Beide zugehörigen Remote-Branches wurden nach Merge automatisch gelöscht.
- Zum Beginn dieses Verifikationsschritts waren keine Pull Requests offen.
- Auf `main` existiert keine aktive GitGuardian- oder Snyk-Workflowdatei.
- `.github/workflows/**`, Rulesets und Secrets werden durch diesen Branch nicht verändert.
- `capital-ai-ci` bleibt unverändert.

## Head-SHA-Evidence

| PR | Head-SHA | GitGuardian | Snyk | Pipeline |
|---|---|---|---|---|
| #249 | `680c1d2894260447e74fc3374c94cdf969dc75a7` | PASS — Owner-bestätigt | kein Check | Merge erfolgreich |
| #250 | `7a6c72bc6aa19bae2721b330c53ba962cb53e730` | PASS — in „alle Tests erfolgreich“ enthalten | PASS — Check in Pipeline enthalten | alle Tests PASS, Merge erfolgreich |

PR #249 zählt als erster GitGuardian-Head. PR #250 zählt als zweiter GitGuardian-Head und erster Snyk-Head. Dieser neue PR ist der zweite unabhängige Snyk-Head.

## Owner-bestätigte Snyk-Konfiguration

- Snyk ist mit GitHub verbunden.
- `SvenKulessa/Finance` wurde importiert.
- PR-Check-Konfiguration wurde im importierten Repository eingestellt.
- Ein Snyk-Token ist als GitHub Secret hinterlegt.
- Für PR #250 erschien der Snyk-Check in der Pipeline und war erfolgreich.

Der Tokenwert wurde nicht gelesen, angezeigt oder in Evidence übernommen. Da ADR-0070 eine App-only-Architektur vorsieht und kein Repository-Workflow das Secret konsumiert, bleibt die Notwendigkeit des Secrets nach Abschluss der zweiten Head-Verifikation separat zu entscheiden.

## Offene Nachweise

- [ ] GitGuardian-App-Zugriff ist auf `SvenKulessa/Finance` begrenzt.
- [ ] GitGuardian arbeitet ohne Repository-Schreibrechte.
- [x] Erster GitGuardian-Head: PR #249.
- [x] Zweiter GitGuardian-Head: PR #250.
- [x] Snyk-GitHub-Integration hat `SvenKulessa/Finance` importiert — Owner-bestätigt.
- [ ] Snyk automatische Fix-PRs/Write-Zugriffe sind deaktiviert.
- [x] Erster Snyk-Head: PR #250.
- [ ] Zweiter unabhängiger Snyk-Head: aktueller PR.
- [ ] Keine Secrets erscheinen in exportierter Evidence.
- [ ] Notwendigkeit des GitHub Secrets ist geklärt.
- [ ] Separate Owner-Entscheidung über eine spätere Required-Check-Promotion.

## Bewertung

| Kontrolle | Status | Begründung |
|---|---|---|
| GitGuardian Laufzeit | VERIFIED PASS | zwei unabhängige PR-Heads Owner-bestätigt |
| Snyk Repository-Import | VERIFIED ACTIVE | PR #250 lieferte Pipeline-Check |
| Snyk PR Checks | PARTIAL PASS | ein erfolgreicher Head; zweiter läuft |
| App-only Architektur | IMPLEMENTED IN GOVERNANCE | keine Scanner-Workflow-Mutation |
| GitHub Secret | REVIEW REQUIRED | vorhanden, aber möglicherweise nicht benötigt |
| Required-Check-Promotion | BLOCKED | zweiter erfolgreicher Snyk-Head + separate Owner-Freigabe fehlen |

## Nächster Schritt

Dieser Dokumentations-PR dient ausschließlich als zweiter unabhängiger Snyk-Head-Test. Nach erfolgreichem Snyk-Check und Merge kann die Scanner-Laufzeitintegration geschlossen werden. Required-Check-Promotion und Secret-Entfernung bleiben separate sicherheitsrelevante Owner-Entscheidungen.
