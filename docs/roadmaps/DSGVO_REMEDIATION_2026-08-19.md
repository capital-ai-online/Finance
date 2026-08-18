# DSGVO Remediation Roadmap — 2026-08-19

**Baseline:** `main` @ `345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`  
**Branch:** `agent/dsgvo-remediation-controller-rights`  
**Owner/Controller:** Sven Michael Kulessa, von Lepel Straße 3a, 27259 Freistatt, Deutschland  
**Status:** In Umsetzung

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
- [ ] Öffentliche Datenschutzerklärung verwendet ausschließlich diese Identität.
- [ ] Impressum verwendet dieselbe Identität und § 5 DDG statt § 5 TMG.
- [ ] VVT/Datenschutzprotokoll verwendet dieselbe Identität.
- [ ] Produktbezeichnungen wie CAPITAL-AI werden nicht als juristische Person dargestellt.

### P0-2 — Compliance-Auszeichnung

- [ ] Entferne öffentliche Aussagen wie „DSGVO VERIFIZIERT“, „gerichtsfest“, „Zertifiziert (Art. 32)“ und fingierte richterliche Freigaben.
- [ ] Ersatzstatus: intern dokumentierte Datenschutzkontrollen, ausdrücklich ohne behördliche/rechtliche Zertifizierung.
- [ ] Regression-Test verhindert Wiedereinführung unbelegter Zertifizierungs-Claims.

### P0-3 — Transparenz / Art. 13

- [ ] Processing Registry deckt mindestens Account/Profile, Billing, Consent-Evidence, Security/IAM, Analytics/Ads, Social Publishing, Alerts und Privacy Requests ab.
- [ ] Pro Verarbeitung: Zweck, Datenkategorien, Rechtsgrundlage, Empfänger, Transferhinweis und Speicher-/Löschkriterium.
- [ ] Technische Datenflüsse ohne PII werden nicht fälschlich als personenbezogene Verarbeitung ausgezeichnet.

### P0-4 — Betroffenenrechte

- [ ] Authentifizierter Self-Service-Datenexport.
- [ ] Authentifizierte Datenschutzanfragen für Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Übertragbarkeit.
- [ ] Requests werden versioniert/statusbehaftet gespeichert und mit einer Bearbeitungsfrist versehen.
- [ ] Datenschutzerklärung behauptet keine Echtzeit-Löschung, solange keine vollständig transaktionale Erasure-Orchestrierung vorhanden ist.

### P0-5 — Consent-Semantik

- [ ] Datenschutzinformation wird als `acknowledgement` und nicht als pauschale Einwilligungs-Rechtsgrundlage klassifiziert.
- [ ] Marketing bleibt eine eigenständige optionale Einwilligung.
- [ ] AGB-Annahme wird als Vertragsannahme klassifiziert.
- [ ] Neue Privacy-Acknowledgements werden gegen Notice-Version `2026-08-19` protokolliert.

### P1-1 — Retention-as-Code

- [ ] Kurzlebige OAuth-/Step-up-Artefakte werden automatisierbar bereinigt.
- [ ] Security Events erhalten eine dokumentierte technische Maximalaufbewahrung.
- [ ] Veraltete Quota-Daten und nicht bestätigte Alert-Anmeldungen werden bereinigbar.
- [ ] Abgeschlossene Privacy Requests erhalten eine Accountability-Retention.
- [ ] Retention-Funktion ist service-role-only und idempotent.

### P1-2 — Vendor-/Transfer-Governance

- [ ] Provider und mögliche Drittlandtransfers werden in der Processing Registry transparent aufgeführt.
- [ ] Repository behauptet keine AVV/SCC/Region-Zusicherung ohne separat gepflegten Vertragsnachweis.
- [ ] Offene Vendor-Evidence wird als organisatorischer Nachweis außerhalb des Sourcecodes gekennzeichnet.

### P1-3 — Logging / PII

- [ ] Neue Privacy-Endpunkte loggen keine Rohdaten aus Anfragen oder Exporten.
- [ ] Dokumentation weist darauf hin, dass Security-Logs personenbezogene Daten enthalten können.
- [ ] Bestehende PII-Logging-Stellen werden als separater Hardening-Track weitergeführt, falls sie nicht in diesem Branch ohne risikoreiche Querschnittsänderung sicher geändert werden können.

## Release Gate

Vor PR-Erstellung:

1. Branch gegen den dann aktuellen `main` vergleichen.
2. Neue Main-Änderungen auf Überschneidungen mit Datenschutz-, Auth-, Supabase-, Routing- und Legal-Dateien prüfen.
3. Bei Überschneidungen Branch-Dateien erneut anpassen.
4. Diff auf verbotene Compliance-Claims und inkonsistente Verantwortlichenangaben prüfen.
5. Tests/CI prüfen; lokale CLI-Ausführung ist in der aktuellen Agent-Laufzeit nicht verfügbar, daher wird GitHub-CI als Ausführungsnachweis verwendet, sobald der PR existiert.

## Nicht durch Sourcecode allein beweisbar

Folgende Punkte bleiben organisatorische/legal-evidence Aufgaben und werden nicht als „erfüllt“ ausgezeichnet, solange keine Belege vorliegen:

- AVV/DPA je Auftragsverarbeiter,
- aktuelle Standardvertragsklauseln / Angemessenheitsmechanismen je Drittlandtransfer,
- tatsächliche Hosting-Regionen und Subprozessoren,
- externe Datenschutz- oder ISO-Zertifizierung,
- abschließende juristische Prüfung der Rechtsgrundlagen und Aufbewahrungsfristen.
