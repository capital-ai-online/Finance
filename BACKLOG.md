# Backlog - CAPITAL-AI Plattform

Engineering roadmap, strategic milestones, and future development cycles for the CAPITAL-AI platform.

---

## 🚀 Active Release Cycle: Version 0.6.0 (Beta-Phase)

### Priorisierte Tasks (High Priority)

1. **[MCP Connector] Google Workspace Integration** (Status: *Refining*)
   - Implement dynamic OAuth loops and standard Model Context Protocol (MCP) schemas to query, write, and sync quantitative reports directly with Google Sheets and Google Drive.
   - *Target*: Version 0.6.1

2. **[Database] Live Sync with Firestore** (Status: *Drafting*)
   - Transition static `RAW_MATERIALS_DATABASE` and crypto-asset files to Google Cloud Firestore for real-time remote updates, historical parameter sync, and secure storage.
   - *Target*: Version 0.6.2

3. **[Security] PII Masking on Diagnostic Logs** (Status: *In Progress*)
   - Deploy automated regex-based string sanitizers across all telemetry endpoints and log files to mask emails, masked IP addresses, and session IDs.
   - *Target*: Version 0.6.1

### Geplante Erweiterungen (Medium Priority)

4. **[Infrastructure] Render DNS & SSL Zertifikat Querprüfung** (Status: *Backlogged*)
   - **Aufgabe**: Kontinuierliche Überwachung und Validierung der SSL-Zertifizierung und DNS-Propagation für beide Domain-Einträge (`emtra.de`), um sporadische Auflösungsfehler auszuschließen.
   
5. **[Infrastructure] Redirect-Protokoll im emtra.de / Gateway** (Status: *Backlogged*)
   - **Aufgabe**: Validierung des Redirect-Verhaltens bei Anmeldungen und Session-Zyklen unter realen Netzwerkbedingungen im Gateway.

6. **[Auth] SMTP Registrierungs-Workflow & E-Mail-Verifizierung** (Status: *Validated*)
   - **Usecase-Definition**: 
     - **Ziel**: Sichere Aktivierung neuer Systemnutzer über verifizierte Mail-Server.
     - **Ablauf**: Registrierungsanfrage in der GUI -> Versand des OTP/Magic-Links über SMTP -> Benutzer klickt Aktivierungslink -> Status-Update des Accounts auf "Aktiv" -> Freischaltung der Plattform-Features.

7. **[Scoring] Modelerweiterung v1.3 - Recycling & Sekundär-Fokus**
   - Implement specialized weight multipliers for circular business models to reward urban mining and processing innovations.
   - *Target*: Version 0.6.3

8. **[UI/UX] PDF Export für Rohstoff-Berichte**
   - Integrate PDF exporter (similar to `ComplianceExporter`) on the `RawMaterialsDashboard` for downloading detailed multi-agent assessments as standardized PDFs.
   - *Target*: Version 0.6.4

9. **[Analytics] D3 Geografische Konzentrations-Karte**
   - Render a physical world map highlighting producer concentration bottlenecks using D3.js.
   - *Target*: Version 0.6.5

### Langfristige Tasks (Low Priority)

10. **[API] Webhook Push für Preisschwellen-Alarme**
    - Hook the existing `PriceAlert` simulator to trigger automated push notifications and email webhooks on commodities pricing spikes.
    - *Target*: Version 0.6.6

---

## 🌟 Strategischer Meilenstein: Version 0.7.0 (Vermarktung, Tokenökonomie & Skalierung)

Dieses Kapitel dokumentiert die Konzepte zur Kundengenerierung, Passiv-Einkommen-Erschließung, Neugestaltung des Preismodells, Etablierung eines ökonomischen Betriebssystems (OS) mit nativem Asset-Token sowie Vertrauensaufbau über externe Auditoren.

### 1. Konzepte zur Kundengenerierung & Lead-Acquisition

*   **Founder Acquisition via Trial Versionen**:
    *   **Konzept**: Bereitstellung einer zeitlich oder funktional limitierten, kostenfreien Testversion ("Trial-Modus") der CAPITAL-AI Analysemodule für Gründer, VC-Analysten und Krypto-Investoren.
    *   **Umsetzung**: Nach einer schnellen, verifizierten SMTP-Registrierung erhält der Nutzer 7 Tage lang Vollzugriff auf das Krypto- und Rohstoff-Scoring (beschränkt auf 5 Analysen pro Tag).
*   **Lernvideos & YouTube-Akquise**:
    *   **Konzept**: Organische Kundengewinnung durch strukturierte "How-To"-Videos auf YouTube und Einbettung direkt im Dashboard der Plattform.
    *   **Inhalte**: 
        *   *Video 1*: "Wie man geopolitische Rohstoffrisiken mit Multi-Agenten-AI quantifiziert."
        *   *Video 2*: "Graham & Buffett Valuation automatisiert im Krypto- und Aktienbereich anwenden."
    *   **Einbettung**: Ein neues Tab oder ein schwebendes Widget "Lern-Zentrale" auf der CAPITAL-AI Website bettet diese Videos via YouTube-iFrame direkt ein, um die Verweildauer zu erhöhen und Nutzer zu konvertieren.

### 2. Passives Einkommen & Refinanzierung über gezielte Werbung

*   **Datenschutzkonforme, Technische Werbung**:
    *   **Konzept**: Integration dezenter, hochrelevanter Werbebanner für Fachpublikum (z.B. über datenschutzfreundliche Netzwerke wie *Carbon Ads* oder *EthicalAds*), die sich optisch perfekt in das edle, dunkle Glassmorphismus-Design der Plattform einfügen.
    *   **Zielgruppe**: Entwickler, Finanzanalysten, Krypto-Trader und Gründer. Keine ablenkende oder blinkende Werbung, sondern exklusive Sponsoren-Flächen (z.B. in der Fußzeile oder den Seitenleisten der Analysetools).

### 3. Pricing-Modell & Stripe-Restrukturierung (Kredit-System)

*   **Problemstellung**: Feste monatliche Abonnements decken die variablen API-Kosten (z.B. durch intensive Gemini-2.5-Pro Multi-Agenten-Cascades) bei "Power-Usern" unzureichend ab, während Gelegenheitsnutzer von hohen Fixkosten abgeschreckt werden.
*   **Lösung: Einführung eines Kredit-Systems**:
    *   **Struktur**: Nutzer erwerben über Stripe Guthaben-Pakete (z.B. 100 Credits für 10 € oder monatliche Abos inklusive Freikontingent).
    *   **Kostenstruktur pro Aktion**:
        *   *Einfaches Krypto-Scoring*: 1 Credit
        *   *Multi-Agenten Rohstoff-Klassifizierung & Live-Audit*: 5 Credits
        *   *Generierung & Download eines verifizierten PDF-Audits*: 3 Credits
    *   **Vorteil**: Berechenbare Marge und verbrauchsbasierte Abrechnung für maximale wirtschaftliche Sicherheit.

### 4. Eigenes ökonomisches OS mit Asset-Token auf dem Markt

*   **Vision**: Entwicklung eines dezentralen, ökonomischen Betriebssystems (Sovereign Economic OS), auf dem Unternehmen und Gründer finanzielle und materielle Ressourcen tokenisieren und handeln können.
*   **Aufwands- & Kostenschätzung (Grob-Eruierung)**:
    *   **Smart Contract & Token-Architektur (ERC-20 / ERC-3643 Compliance Token)**:
        *   *Aufwand*: Konzeption, rechtliche Absicherung (MiCA-Konformität in der EU), Token-Spezifikation, Solidity-Entwicklung und Auditierung der Verträge.
        *   *Kosten*: Ca. 15.000 € – 30.000 € (inklusive externem Smart-Contract-Audit).
    *   **Dezentrale Settlement-Schnittstelle (Web3 Gateway)**:
        *   *Aufwand*: Anbindung von Wallets (MetaMask, Coinbase Wallet) im Frontend, Integration von On/Off-Ramp-Anbietern (z.B. Transak, MoonPay) zur nahtlosen Wandlung von Euro/Dollar in den nativen Plattform-Token.
        *   *Kosten*: Ca. 10.000 € – 20.000 €.
    *   **Rechtliche Strukturierung & BaFin-Lizenzierung/Anzeige**:
        *   *Aufwand*: Einholung rechtlicher Gutachten zur Einordnung des Asset-Tokens (Utility Token vs. Security Token) zur Gewährleistung absoluter DSGVO- und MiCA-Konformität.
        *   *Kosten*: Ca. 25.000 € – 60.000 € (stark abhängig von der endgültigen Jurisdiktion).
    *   **Gesamtkalkulation für MVP des Ökonomischen OS**: Ca. 50.000 € – 110.000 € Entwicklungs- und Zulassungskosten bei einer geschätzten Projektdauer von 4 bis 6 Monaten.

### 5. Vertrauensbildung & Referenzen über externe AI-Audit-Anbieter

*   **Zusammenarbeit mit AI-Zertifizierern**:
    *   **Konzept**: Kooperation mit renommierten externen Organisationen für Algorithmen- und AI-Zertifizierung (z.B. TÜV SÜD AI Audit, PwC AI Risk Assessment oder spezialisierte Krypto-Auditoren).
    *   **Implementierung**: Einblendung eines verifizierten Gütesiegels ("Audited AI Core" / "BaFin Compliant Algorithm") in der Fußzeile der Exporter und im Compliance-Center, um das Vertrauen von institutionellen Kunden und Investoren signifikant zu steigern.

---

*End of Backlog. Tracked and transitioned to Version 0.6.0. Roadmap targets configured for Version 0.7.0.*
