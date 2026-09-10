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
- Anbieterfehler dürfen den in Promotion befindlichen Shadow-Check `capital-ai-ci` (Stand 2026-08-14: Promotion-Gate erfüllt, serverseitiges Ruleset noch nicht aktiviert — siehe `docs/evidence/ci/P0_MAIN_PROTECTION_RECOVERY_2026-08-14.md`) in der Beobachtungsphase nicht ersetzen;
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

## Nachtrag 2026-08-14 — Owner-Freigabe der Promotion, CodeQL bewusst nicht gewählt

`GitGuardian Security Checks`, `security/snyk (svenkulessa)` und `code/snyk (svenkulessa)`
erreichten mit PR #249, #250 und #251 drei statt der geforderten zwei unabhängigen,
head-gebundenen PASS-Läufe (Detail-Evidence: `docs/evidence/security/GITGUARDIAN_SNYK_BASELINE_2026-08-14.md`).
Der Owner hat die Promotion freigegeben; `security/snyk` und `code/snyk` sind als Required Checks
im `main-production-protection`-Ruleset angewendet — das ist der in Punkt 4/5 der
Sicherheitsinvarianten vorausgesetzte separate Owner-Mutationsschritt. Ob `GitGuardian Security
Checks` ebenfalls promoviert wurde, ist zum Zeitpunkt dieses Nachtrags noch nicht bestätigt (siehe
offene Nachweise in der Detail-Evidence).

Parallel wurde GitHub Advanced Security CodeQL geprüft, weil der Owner es testweise dem Ruleset
hinzugefügt hatte. `code/snyk` ist Snyk Code — ein SAST-Check, der dieselbe Bedrohungskategorie
(semantische Quellcode-Schwachstellen) abdeckt wie CodeQL, ohne zusätzliche
GitHub-Actions-Laufzeit zu benötigen. Der Owner hat sich gegen CodeQL als zusätzlichen Required
Check entschieden, um keine zweite, redundante SAST-Engine parallel pflegen zu müssen. Diese
Entscheidung ist keine Schwächung — sie ersetzt keinen bestehenden Kontrollpfad, sondern
verzichtet auf eine Ergänzung, deren Kategorie bereits abgedeckt ist.

## Nachtrag 2026-08-15 — Snyk-Required-Check-Demotion (Kontingent erschöpft)

`security/snyk (svenkulessa)` und `code/snyk (svenkulessa)` begannen, unabhängig vom tatsächlichen
Scan-Ergebnis, dauerhaft mit `error` / „You have used your limit of private tests" zu antworten
(Snyk-seitig erschöpftes Kontingent für private Repository-Scans, keine Erkenntnis über den
Code-Zustand). Das blockierte real mindestens 3 gleichzeitig offene Pull Requests (#295, #296,
#297), da beide Kontexte als Required Checks im `main-production-protection`-Ruleset standen.

Der Owner hat am 2026-08-15 `security/snyk` und `code/snyk` aus dem Required-Checks-Set des
Rulesets entfernt — das ist exakt der in Abschnitt „Rollback" Punkt 1 dieses ADRs vorgesehene
Schritt („Anbietercheck aus Required Checks entfernen, sofern später promoviert"), keine Abweichung
vom hier festgelegten Vorgehen. `GitGuardian Security Checks` bleibt unverändert Required Check.
Snyk selbst (App-Integration, Repository-Scanning) bleibt aktiv; nur die Merge-blockierende
Required-Check-Bindung wurde entfernt. `.github/policies/main-production-protection.expected.json`
wurde entsprechend aktualisiert (`decision_2026-08-15`), und die 3 betroffenen offenen Pull
Requests wurden geschlossen und mit identischem Branch/Commit als neue Pull Requests (#298, #299,
#300) neu eröffnet, um eine saubere Status-Check-Auswertung unter dem aktualisierten Ruleset zu
erhalten. Siehe `docs/evidence/security/SNYK_REQUIRED_CHECK_DEMOTION_2026-08-15.md`.

## Nachtrag 2026-09-10 — Snyk vollständig retirieren

Der Human/Owner hat am 2026-09-10 entschieden, Snyk nicht mehr zu verwenden. Damit sind **alle Snyk-bezogenen operativen Entscheidungen und Anweisungen dieses ADR ab diesem Datum `RETIRED` und nicht mehr autorisierend**. Die GitGuardian-bezogenen Entscheidungen dieses ADR bleiben davon unberührt und weiterhin wirksam.

Für den aktuellen Repository-Zustand gilt daher:

- keine Snyk-GitHub-Actions-Workflows, Snyk-Tokens, Snyk-Required-Checks, Snyk-UI-Empfehlungen oder aktiven Snyk-Runbooks;
- keine neue Snyk-Integration oder Reaktivierung ohne eine neue explizite Human/Owner-Entscheidung;
- historische Snyk-Angaben in diesem ADR, in Evidence, Incident-Records, archivierten Roadmaps und terminalen Work Claims bleiben ausschließlich zur Audit-/Traceability-Erhaltung bestehen und sind `HISTORICAL / NON-AUTHORIZING`;
- GitGuardian bleibt der externe Secret-Scanning-/Honeytoken-Pfad und wird weiterhin ohne zusätzlichen GitGuardian-Scanner-Workflow unter `.github/workflows/**` betrieben;
- eine etwa noch installierte externe Snyk-App oder ein anbieterseitiger Snyk-Zugang ist kein Repository-Inhalt und muss, falls vorhanden, als separate explizite Owner-Mutation außerhalb dieses Repository-Branches entfernt bzw. widerrufen werden.

Dieser Nachtrag ersetzt keine historische Evidence und schreibt frühere Zustände nicht rückwirkend um; er beendet ausschließlich die aktuelle und zukünftige Snyk-Nutzung innerhalb des Geltungsbereichs dieses ADR.
