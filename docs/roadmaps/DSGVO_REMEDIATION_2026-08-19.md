# DSGVO Remediation Roadmap — 2026-08-19

**Portfolio role:** `HISTORICAL_REMEDIATION_WITH_RESIDUALS`  
**Project execution/status source:** `docs/projects/compliance/ROADMAP.md` plus the roadmap of each affected Primary Owner  
**Folder-to-PVC mapping:** `docs/projects/README.md` + `docs/projects/PROJECT_VALUE_CHAIN.md`  
**Baseline:** `main` @ `345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`  
**Branch:** `agent/dsgvo-remediation-controller-rights`  
**Owner/Controller:** Sven Michael Kulessa, von Lepel Straße 3a, 27259 Freistatt, Deutschland  
**Status:** `MERGED IMPLEMENTATION / REMEDIATION EVIDENCE — PR #414`; unresolved vendor/legal/advisor items require current revalidation and owner routing rather than continued status ownership by this historical branch roadmap

> **Current-state note (2026-09-01):** PR #414 is merged. The baseline, branch distance and CI checklist below are retained as historical execution evidence from the remediation cycle. They are not a current-main or current-portfolio status source. Any still-open item must be revalidated against current Authority/evidence and entered into the applicable current project roadmap/task surface before execution.

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
- [x] Maschinenlesbares Vendor-Inventar für Supabase, Render, Stripe, IONOS, Google, YouTube, Instagram, TikTok, X, Threads, LinkedIn und Facebook angelegt.
- [x] Technisch beobachtete Regionen werden getrennt von vertraglich zugesicherten Regionen gespeichert.
- [x] Onboarding-Preflight verhindert strukturell ungültige bzw. falsch als verifiziert markierte Evidence.
- [x] Strict-Gate für DPA-/Subprocessor-/SCC-/TIA-/Region-Evidence implementiert.
- [ ] Kandidaten einzeln mit dem Controller bestätigen und Legal Role / tatsächliche Produktionsnutzung vervollständigen.
- [ ] Vertragliche Evidence-Hashes und kontrollierte Ablageorte ergänzen.
- [ ] Relevante Drittlandtransfers und TIA-Ergebnisse vervollständigen.

### P1-3 — Logging / PII

- [x] Neue Privacy-Endpunkte loggen keine Rohdaten aus Anfragen oder Exporten.
- [x] Dokumentation weist darauf hin, dass Security-Logs personenbezogene Daten enthalten können.
- [x] Konkret identifizierte Subscription-Logs geben E-Mail/User-ID nicht mehr im Klartext aus.
- [x] Regression-Test schützt die bereinigten Subscription-Logging-Stellen.

### P1-4 — Supabase Advisor Hardening

- [x] Leaked-Password-Protection als vom Controller akzeptierte Free-Tier-Restriktion dokumentiert; kein falscher PASS-Claim.
- [x] Policy-lose `agent_audit_events`-/SEO-Tabellen als absichtliches server-only deny-by-default bewertet; keine künstlich permissiven Policies.
- [x] Vier veraltete `auth.role()`-Service-Role-Policies im PR auf explizites `TO service_role` umgestellt.
- [x] Fehlenden FK-Index für `seo_content_inventory.primary_keyword_id` im PR ergänzt.
- [x] `unused_index`-Befunde bis zu belastbarer Produktions-Workload-Evidence zurückgestellt.
- [ ] `promo_redemptions`-Identitäts-/Idempotenzmodell fachlich klären, bevor ein Primary Key festgelegt wird.
- [ ] Follow-up-Advisor-Migration erst nach separater Produktionsfreigabe anwenden und danach Advisors erneut verifizieren.

## Release Gate — historischer Branch-Snapshot

### Main-Korrelation

Am 19. August 2026 wurde der Branch nach den Vendor-Evidence-/Advisor-Follow-up-Änderungen erneut gegen `main` geprüft.

- `main` stand weiterhin auf `345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`.
- Branch war zuletzt **27 Commits voraus und 0 Commits zurück**; Merge-Base weiterhin identisch mit `main`.
- Seit Branch-Erstellung wurden damit keine neuen Main-Commits gemerged.
- Es existierten zu diesem Snapshot folglich keine zwischenzeitlichen Main-Änderungen, die mit Auth-, Supabase-, Routing-, Legal-, Privacy- oder Vendor-Evidence-Dateien dieses Branches korreliert werden mussten.

### PR-/CI-Gate — historischer Snapshot

- [x] Branch nach Follow-up-Änderungen gegen damaligen `main` verglichen.
- [x] Keine damaligen Main-Korrelationen festgestellt.
- [x] Diff enthält Regression-Tests für Controller-Identity, DDG-Referenz, Compliance-Claims und PII-Logging.
- [x] Vendor-Evidence-Onboarding-Preflight in `npm test` integriert.
- [x] PR #414 wurde anschließend gemerged; der PR-Abschluss dokumentiert die finalen Repository-/CI- und Produktions-Evidenzen des damaligen Kandidaten.

Diese Angaben sind Merge-/Remediation-Evidence. Sie dürfen nicht als aktueller Build-/CI-PASS für spätere Änderungen verwendet werden.

## Nicht durch Sourcecode allein beweisbar

Folgende Punkte bleiben organisatorische/legal-evidence Aufgaben und werden nicht als „erfüllt“ ausgezeichnet, solange keine Belege vorliegen:

- AVV/DPA je tatsächlichem Auftragsverarbeiter,
- aktuelle Standardvertragsklauseln / Angemessenheitsmechanismen je Drittlandtransfer,
- vollständige Subprocessor-Kette und Change-Notification-Nachweis,
- vertraglich zugesicherte Processing-/Hosting-Regionen,
- externe Datenschutz- oder ISO-Zertifizierung,
- abschließende juristische Prüfung der Rechtsgrundlagen, Transferbewertungen und Aufbewahrungsfristen.
