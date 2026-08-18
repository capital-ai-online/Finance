# DSGVO Remediation Roadmap — 2026-08-19

**Baseline:** `main` @ `345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`  
**Branch:** `agent/dsgvo-remediation-controller-rights`  
**Owner/Controller:** Sven Michael Kulessa, von Lepel Straße 3a, 27259 Freistatt, Deutschland  
**Status:** Implementation abgeschlossen; PR/CI-Gate ausstehend

## Ziel

Die im DSGVO-Audit identifizierten P0/P1-Abweichungen werden so behoben, dass technische Datenschutzkontrollen, öffentlich sichtbare Datenschutzauszeichnung und interne Accountability-Dokumentation denselben belegbaren Systemzustand beschreiben.

Das Ziel ist **keine Selbsterklärung einer Zertifizierung**. Die Anwendung darf nur solche Compliance-Status darstellen, die durch Repository-Evidence oder eine tatsächlich vorhandene externe Zertifizierung belegbar sind.

## Leitplanken / Enterprise-Benchmark

- DSGVO: Art. 5, 6, 12–20, 25, 30, 32 und 42.
- Deutschland: § 5 DDG sowie § 25 TDDDG.
- Privacy-Management-Benchmark: ISO/IEC 27701:2025 (PIMS/Accountability).
- Privacy-Risk-Benchmark: NIST Privacy Framework; PF 1.1 ist zum Roadmap-Zeitpunkt noch nicht als finale Version veröffentlicht und wird daher nur als Entwicklungsbenchmark verwendet.
- Security/Privacy-by-Design: least privilege, fail closed, data minimisation, auditable consent evidence, explicit retention and privacy request workflow.

## Prioritäten und Definition of Done

### P0-1 — Kanonische Verantwortlichen-Identität

- [x] Verantwortlicher fachlich festgelegt: Sven Michael Kulessa, Privatperson.
- [x] Öffentliche Datenschutzerklärung verwendet ausschließlich diese Identität.
- [x] Impressum verwendet dieselbe Identität und § 5 DDG statt § 5 TMG.
- [x] VVT/Datenschutzprotokoll verwendet dieselbe Identität.
- [x] Produktbezeichnungen wie CAPITAL-AI werden nicht als juristische Person dargestellt.

### P0-2 — Compliance-Auszeichnung

- [x] Öffentliche Aussagen wie „DSGVO VERIFIZIERT“, „gerichtsfest“, „Zertifiziert (Art. 32)“ und fingierte richterliche Freigaben entfernt.
- [x] Ersatzstatus: intern dokumentierte Datenschutzkontrollen, ausdrücklich ohne behördliche/rechtliche Zertifizierung.
- [x] Regression-Test verhindert Wiedereinführung unbelegter Zertifizierungs-Claims.

### P0-3 — Transparenz / Art. 13

- [x] Processing Registry deckt mindestens Account/Profile, Billing, Consent-Evidence, Security/IAM, Analytics/Ads, Social Publishing, Alerts, Quota und Privacy Requests ab.
- [x] Pro Verarbeitung: Zweck, Datenkategorien, Rechtsgrundlage, Empfänger, Transferhinweis und Speicher-/Löschkriterium.
- [x] Technische Datenflüsse ohne PII werden nicht fälschlich als personenbezogene Verarbeitung ausgezeichnet.

### P0-4 — Betroffenenrechte

- [x] Authentifizierter Self-Service-Datenexport.
- [x] Authentifizierte Datenschutzanfragen für Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Übertragbarkeit.
- [x] Requests werden statusbehaftet gespeichert und mit einer Bearbeitungsfrist versehen.
- [x] Datenschutzerklärung behauptet keine Echtzeit-Löschung; Erasure ist ein kontrollierter Request-Workflow.

### P0-5 — Consent-Semantik

- [x] Datenschutzinformation wird als `acknowledgement` und nicht als pauschale Einwilligungs-Rechtsgrundlage klassifiziert.
- [x] Marketing bleibt eine eigenständige optionale Einwilligung.
- [x] AGB-Annahme wird als Vertragsannahme klassifiziert.
- [x] Neue Privacy-Acknowledgements werden gegen Notice-Version `2026-08-19` protokolliert.
- [x] Export-Sicherheitsdialog verwendet Kenntnisnahme statt einer fingierten DSGVO-Einwilligung.

### P1-1 — Retention-as-Code

- [x] Kurzlebige OAuth-/Step-up-Artefakte werden automatisierbar bereinigt.
- [x] Security Events erhalten eine dokumentierte technische Maximalaufbewahrung.
- [x] Veraltete Quota-Daten und nicht bestätigte Alert-Anmeldungen werden bereinigbar.
- [x] Abgeschlossene Privacy Requests erhalten eine Accountability-Retention.
- [x] Retention-Funktion ist service-role-only und idempotent.

### P1-2 — Vendor-/Transfer-Governance

- [x] Provider und mögliche Drittlandtransfers werden in der Processing Registry transparent aufgeführt.
- [x] Repository behauptet keine AVV/SCC/Region-Zusicherung ohne separat gepflegten Vertragsnachweis.
- [x] Offene Vendor-Evidence wird als organisatorischer Nachweis außerhalb des Sourcecodes gekennzeichnet.

### P1-3 — Logging / PII

- [x] Neue Privacy-Endpunkte loggen keine Rohdaten aus Anfragen oder Exporten.
- [x] Dokumentation weist darauf hin, dass Security-Logs personenbezogene Daten enthalten können.
- [x] Konkret identifizierte Subscription-Logs geben E-Mail/User-ID nicht mehr im Klartext aus.
- [x] Regression-Test schützt die bereinigten Subscription-Logging-Stellen.

## Release Gate

### Main-Korrelation

Am 19. August 2026 wurde der Branch nach Abschluss der Codeänderungen erneut gegen `main` geprüft.

- `main` stand weiterhin auf `345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`.
- Seit Branch-Erstellung wurden damit **keine neuen Main-Commits** gemerged.
- Es existieren folglich keine zwischenzeitlichen Main-Änderungen, die mit Auth-, Supabase-, Routing-, Legal- oder Privacy-Dateien dieses Branches korrelieren oder neu eingearbeitet werden müssten.

### PR-/CI-Gate

- [x] Branch gegen aktuellen `main` verglichen.
- [x] Keine zwischenzeitlichen Main-Korrelationen festgestellt.
- [x] Diff enthält Regression-Tests für Controller-Identity, DDG-Referenz, Compliance-Claims und PII-Logging.
- [ ] GitHub-CI nach PR-Erstellung erfolgreich.

Lokale CLI-Ausführung ist in der aktuellen Agent-Laufzeit nicht verfügbar; der GitHub-PR-CI-Lauf ist deshalb der ausführbare Build/Test-Nachweis für diesen Branch.

## Nicht durch Sourcecode allein beweisbar

Folgende Punkte bleiben organisatorische/legal-evidence Aufgaben und werden nicht als „erfüllt“ ausgezeichnet, solange keine Belege vorliegen:

- AVV/DPA je Auftragsverarbeiter,
- aktuelle Standardvertragsklauseln / Angemessenheitsmechanismen je Drittlandtransfer,
- tatsächliche Hosting-Regionen und Subprozessoren,
- externe Datenschutz- oder ISO-Zertifizierung,
- abschließende juristische Prüfung der Rechtsgrundlagen und Aufbewahrungsfristen.
