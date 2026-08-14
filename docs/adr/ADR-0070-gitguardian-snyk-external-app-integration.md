# ADR-0070 — GitGuardian und Snyk als externe GitHub-Sicherheitsdienste

Status: ACCEPTED  
Datum: 2026-08-14  
Owner: SvenKulessa  
Repository: `SvenKulessa/Finance`  
Baseline: `main@5e8471de10644a5432017d28d2f4ff0657d92dd5`

## Kontext

Nach dem PR-#236-Bootstrap-Incident dürfen neue Sicherheitskontrollen die aktive CI-Control-Plane nicht erneut selbstreferenziell ersetzen. GitGuardian ist bereits als GitHub App angebunden; ein Snyk-Token ist nach Owner-Angabe bereits gesetzt. Die Integration soll zunächst ohne neue GitHub-Actions-Workflows erfolgen.

## Entscheidung

GitGuardian und Snyk werden als externe GitHub-Apps beziehungsweise anbieterseitige Repository-Integrationen betrieben.

- keine neuen Scanner-Workflows in `.github/workflows/**`;
- kein Tokenwert in Source, Dokumentation, PR-Body, Logs oder Evidence;
- der vorhandene Snyk-Token wird von diesem PR weder gelesen noch verändert;
- Anbieterzugriff wird auf `SvenKulessa/Finance` begrenzt;
- minimal erforderlicher read-only Zugriff auf Code, Metadaten und Pull Requests;
- keine Contents-Schreibrechte und keine automatischen Fix-PRs in der ersten Stufe;
- GitGuardian und Snyk starten als beobachtende externe Checks;
- kein Check wird vor zwei Head-gebundenen erfolgreichen PR-Läufen und separater Owner-Freigabe als Required Check promoviert;
- Anbieterfehler dürfen den bestehenden Required Check `capital-ai-ci` in der Beobachtungsphase nicht ersetzen;
- Merge bleibt Human/Owner-only; ab M10 gilt zusätzlich der kanonische Passkey-Verifier.

## Trust Boundaries

Repository-Inhalte werden an die ausgewählten Anbieter zur Sicherheitsanalyse übertragen. Ergebnisse der Anbieter sind nicht vertrauenswürdige externe Eingaben, bis Repository, PR, Head-SHA, Scanneridentität und Zeitpunkt geprüft wurden.

## Sicherheitsinvarianten

1. Least privilege und Repository-Scoping.
2. Keine Secret-Ausgabe oder Token-Inventarisierung im Repository.
3. Keine automatische Remediation mit Schreibrechten in Stufe 1.
4. Keine Promotion eines Anbieterchecks während desselben PRs, der seine Integration einführt.
5. Promotion und Rollback sind separate Owner-Mutationen.
6. Branch nach erfolgreichem Human-Merge löschen.

## Konsequenzen

Vorteile:

- keine zusätzliche GitHub-Actions-Laufzeit für die Scanner;
- kein neuer PR-kontrollierter Workflow-Trust-Root;
- zentrale Anbieter-Dashboards und historische Analyse.

Nachteile:

- externe Plattformabhängigkeit;
- Checknamen und Verfügbarkeit liegen teilweise außerhalb des Repositories;
- vollständige Reproduzierbarkeit erfordert exportierte, redigierte Evidence.

## Rollback

1. Anbietercheck aus Required Checks entfernen, sofern später promoviert.
2. Repository im jeweiligen Anbieter deaktivieren.
3. GitHub-App-Zugriff auf `SvenKulessa/Finance` entziehen.
4. Token nur anbieterseitig widerrufen/rotieren; niemals in Repository-Evidence kopieren.
5. Bestehenden `capital-ai-ci`-Pfad unverändert weiterverwenden.
