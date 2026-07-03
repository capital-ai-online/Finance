# Backlog - AIF-CORE Plattform

Engineering roadmap and upcoming development iterations for the AIF-CORE platform.

---

## 🚀 Active Release Cycle: Version 0.5.4 (Beta-Phase)

### Priorisierte Tasks (High Priority)

1. **[MCP Connector] Google Workspace Integration** (Status: *Refining*)
   - Implement authentic OAuth loops and standard MCP schemas to query and compile reports directly into Google Sheets and Google Drive.
   - *Target*: Version 0.5.5

2. **[Database] Live Sync with Firestore** (Status: *Drafting*)
   - Transition static `RAW_MATERIALS_DATABASE` records to Cloud Firestore for real-time remote updates of country concentration risk indexes and base volatility.
   - *Target*: Version 0.5.6

3. **[Security] PII Masking on Diagnostic Logs** (Status: *In Progress*)
   - Add automated regex scrubbers on audit logs and telemetry responses to anonymize client emails, IP addresses, and transaction identifiers.
   - *Target*: Version 0.5.5

### Geplante Erweiterungen (Medium Priority)

4. **[Infrastructure] Render DNS & SSL Zertifikat Querprüfung** (Status: *Backlogged*)
   - **Kontext**: A-Record und CNAME wurden manuell auf Render konfiguriert und in einem frischen Browser erfolgreich zertifiziert sowie sicher aufgelöst.
   - **Aufgabe**: Kontinuierliche Überwachung und Querprüfung der SSL-Zertifizierung und DNS-Propagation für beide Domain-Einträge, um sporadische Auflösungsfehler auszuschließen.
   
5. **[Infrastructure] Redirect-Protokoll im emtra.de / Gateway** (Status: *Backlogged*)
   - **Kontext**: Der Weiterleitungsfehler (Redirect im emtra.de) wurde korrigiert.
   - **Aufgabe**: Validierung des Redirect-Verhaltens bei Anmeldungen und Session-Zyklen unter realen Netzwerkbedingungen.

6. **[Auth] SMTP Registrierungs-Workflow & E-Mail-Verifizierung** (Status: *Validated*)
   - **Kontext**: Der Registrierungs-Workflow über SMTP-E-Mails wurde erfolgreich verifiziert.
   - **Usecase-Definition**: 
     - **Ziel**: Sichere Aktivierung neuer Systemnutzer über verifizierte Mail-Server.
     - **Ablauf**: Registrierungsanfrage in der GUI -> Versand des OTP/Magic-Links über SMTP -> Benutzer klickt Aktivierungslink -> Status-Update des Accounts auf "Aktiv" -> Freischaltung der Plattform-Features.
     - **Qualitätssicherung**: Überwachung der Zustellraten und Verifizierungs-Timeouts bei Folge-Registrierungen.

7. **[Scoring] Modelerweiterung v1.3 - Recycling & Sekundär-Fokus**
   - Implement specialized weight multipliers for circular business models to reward urban mining and processing innovations.
   - *Target*: Version 0.5.7

5. **[UI/UX] PDF Export für Rohstoff-Berichte**
   - Integrate PDF exporter (similar to `ComplianceExporter`) on the `RawMaterialsDashboard` for downloading detailed multi-agent assessments as standardized PDFs.
   - *Target*: Version 0.5.8

6. **[Analytics] D3 Geografische Konzentrations-Karte**
   - Render a physical world map highlighting producer concentration bottlenecks using D3.js.
   - *Target*: Version 0.5.9

### Langfristige Tasks (Low Priority)

7. **[API] Webhook Push für Preisschwellen-Alarme**
   - Hook the existing `PriceAlert` simulator to trigger automated push notifications and email webhooks on commodities pricing spikes.
   - *Target*: Version 0.6.0

---

*End of Backlog. Tracked under Version 0.5.4.*
