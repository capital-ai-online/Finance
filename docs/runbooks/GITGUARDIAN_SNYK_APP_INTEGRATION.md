# GitGuardian-/Snyk-App-Integration — Owner-Runbook

Status: PRE-MUTATION / OWNER ACTION REQUIRED  
Datum: 2026-08-14  
ADR: `docs/adr/ADR-0070-gitguardian-snyk-external-app-integration.md`

## Zielzustand

- GitGuardian überwacht ausschließlich `SvenKulessa/Finance`.
- Snyk importiert ausschließlich `SvenKulessa/Finance`.
- Beide Anbieter arbeiten in Stufe 1 ohne Repository-Schreibrechte.
- Keine neuen GitHub-Actions-Workflows.
- Keine Required-Check-Promotion in diesem Arbeitsschritt.

## Vorprüfung

- [x] PR #248 ist gemerged.
- [x] `main`-Baseline ist `5e8471de10644a5432017d28d2f4ff0657d92dd5`.
- [x] Keine offenen PRs zum Prüfzeitpunkt.
- [x] GitGuardian-App ist laut Owner bereits installiert.
- [x] Snyk-Token ist laut Owner bereits gesetzt; Wert wurde nicht gelesen.
- [ ] Exakte GitGuardian-App-Berechtigungen im GitHub-UI geprüft.
- [ ] Snyk-GitHub-App/Repository-Import im Snyk-UI geprüft.

## GitGuardian prüfen

1. GitHub → Settings → Applications → Installed GitHub Apps → GitGuardian.
2. Repository access auf **Only select repositories** begrenzen.
3. Ausschließlich `SvenKulessa/Finance` auswählen.
4. Read-only Zugriff beibehalten.
5. Zusätzliche GitGuardian-Write-App/Honeytoken-Schreibrechte nicht aktivieren.
6. Historischen Scan und PR-Scanning im GitGuardian-Dashboard prüfen.
7. Keine Finding-Inhalte mit Secrets in PR-Kommentare kopieren.

## Snyk anbinden

1. Im Snyk-Dashboard GitHub als Source öffnen.
2. `SvenKulessa/Finance` als einziges Ziel importieren.
3. Open-Source-/Dependency-Scanning aktivieren.
4. automatische Fix-PRs, Merge-Automation und Contents-Write deaktiviert lassen.
5. vorhandenen Token nur im Snyk-/GitHub-Secret-Speicher belassen.
6. keine Workflowdatei erzeugen und keinen Tokenwert anzeigen.
7. initialen Scan starten und Projekt/Commit-SHA notieren.

## Verifikation

Für zwei unterschiedliche PR-Heads dokumentieren:

| Feld | GitGuardian | Snyk |
|---|---|---|
| Repository | `SvenKulessa/Finance` | `SvenKulessa/Finance` |
| PR | auszufüllen | auszufüllen |
| Head-SHA | auszufüllen | auszufüllen |
| Checkname | auszufüllen | auszufüllen |
| Ergebnis | auszufüllen | auszufüllen |
| Zeitpunkt UTC | auszufüllen | auszufüllen |
| Anbieter-Link | redigierter Dashboard-/Check-Link | redigierter Dashboard-/Check-Link |

Akzeptanz:

- Check gehört zum exakten PR-Head.
- Kein Secret erscheint in Log, Kommentar oder Evidence.
- Anbieterfehler beeinflusst `capital-ai-ci` in Stufe 1 nicht.
- Zwei aufeinanderfolgende PR-Heads liefern verwertbare Ergebnisse.

## Promotion

Erst nach separater Owner-Freigabe:

1. exakte stabile Checknamen ermitteln;
2. Ruleset-Baseline exportieren;
3. Rollback verifizieren;
4. Checks einzeln im Shadow-Modus beobachten;
5. Required-Check-Mutation separat durchführen und protokollieren.

## Rollback

- Repository im Anbieter deaktivieren.
- GitHub-App-Repositoryzugriff entziehen.
- späteren Required Check zuerst aus Ruleset entfernen.
- Token anbieterseitig widerrufen/rotieren, falls Kompromittierung vermutet wird.
- keine Änderung am kanonischen `capital-ai-ci`-Check.
