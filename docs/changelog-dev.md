<!-- CAPITAL-AI DOCUMENTARY HEADER START -->
<div align="center">
  <svg viewBox="0 0 200 180" width="100" height="90" style="filter: drop-shadow(0px 0px 15px rgba(194, 157, 83, 0.35));" aria-hidden="true">
    <g stroke="#C29D53" stroke-width="2" stroke-opacity="0.6">
      <line x1="60" y1="50" x2="78" y2="93" />
      <line x1="78" y1="93" x2="60" y2="135" />
      <line x1="60" y1="135" x2="100" y2="145" />
      <line x1="100" y1="145" x2="140" y2="133" />
      <line x1="140" y1="133" x2="142" y2="90" />
      <line x1="142" y1="90" x2="140" y2="48" />
      <line x1="140" y1="48" x2="105" y2="55" />
      <line x1="105" y1="55" x2="60" y2="50" />
      <line x1="100" y1="100" x2="60" y2="50" stroke="#06B6D4" />
      <line x1="100" y1="100" x2="140" y2="48" stroke="#06B6D4" />
      <line x1="100" y1="100" x2="140" y2="133" stroke="#8B5CF6" />
      <line x1="100" y1="100" x2="60" y2="135" stroke="#8B5CF6" />
    </g>
    <circle cx="60" cy="50" r="7" fill="#E5C17C" />
    <circle cx="140" cy="48" r="7" fill="#E5C17C" />
    <circle cx="140" cy="133" r="7" fill="#E5C17C" />
    <circle cx="60" cy="135" r="7" fill="#E5C17C" />
    <circle cx="100" cy="100" r="12" fill="#BD984E" />
    <circle cx="78" cy="93" r="5" fill="#E5C17C" />
    <circle cx="142" cy="90" r="5" fill="#E5C17C" />
    <circle cx="100" cy="145" r="5" fill="#E5C17C" />
    <circle cx="105" cy="55" r="5" fill="#E5C17C" />
  </svg>
</div>

<div align="center">
  <h1 style="margin-top: 10px; margin-bottom: 2px; font-weight: 900; color: #E5C17C; letter-spacing: -0.04em; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase;">⊞ Capital-AI Documentary</h1>
  <p style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #8A9A86; margin-top: 0; text-transform: uppercase; letter-spacing: 0.1em;">Autonomous AI Document Hygienist • Version 0.5.4</p>
</div>

| System-Metadaten | Spezifikation |
| :--- | :--- |
| **Plattform-Identität** | Capital-AI Documentary (V0.5.4) |
| **Gründer & Inhaber** | **Sven Kulessa** |
| **Zentrale E-Mail** | [sven.kulessa@capital-ai.online](mailto:sven.kulessa@capital-ai.online) |
| **Echtheits-Emblem** | `⊞ CAPITAL-AI CORE` |
| **Status** | 🟢 Revisionssicher verifiziert & bereinigt |

---
<!-- CAPITAL-AI DOCUMENTARY HEADER END -->

# Changelog-dev: CAPITAL-AI Developer Logs

All updates, workarounds, and environmental parameters for local and Cloud Run container execution are logged here.

---

## [0.6.4-dev] - 2026-07-10

### Added
- **ADR-0003.5 - Identity Access Management (Sicherheitsmanagement & Compliance)**: Neues Entscheidungsdokument (`docs/adr/ADR-0003_5-identity-access-management.md`) zur Definition des Owner-IAM, erzwungener Passkey (WebAuthn/FIDO2) & 2FA Multi-Faktor-Absicherung, Step-Up Tokenisierung und geschützter Systemzonen.
- **ADR-0008 - Behebung des Reaktivitäts- & Lebenszyklus-Ausfalls im Document Hygiene Panel**: Neues Entscheidungsdokument (`docs/adr/ADR-0008-document-hygiene-lifecycle-fix.md`) zur Behebung verfrühter administrativer Status-Abfragen vor abgeschlossener Benutzer-Authentifizierung im Client.
- **Interaktiver Proof of Concept (PoC)**: Entwicklung eines voll funktionsfähigen, interaktiven Sicherheits- & Compliance-PoC (`src/components/SicherheitsmanagementPoC.tsx`), um die neuen Authentifizierungsschleifen, geschützten Zonen und anonymisierten Audit-Logs visuell zu validieren.
- **Anforderungskatalog Integration**: Einbindung des Anforderungskatalogs (`docs/adr/anforderungskatalog.md`) als prioritäres, ausstehendes Dokument (`PENDING`) im Documentary Wiki.

### Fixed
- **Lebenszyklus-Fehler im Document Hygiene Panel**: Absicherung der initialen Abfragen im `DocumentHygienePanel` via Conditional Early-Return und Erweiterung des Dependency-Arrays um `currentUserEmail`. Dies verhindert unauthorisierte Backend-API-Fehler beim Laden der Komponente.
- **Behebung von Namenskonventionsfehlern**: Bereinigung verbleibender Referenzen des Alt-Projekts `AIF-Capital-Core` in `src/components/InteractModule.tsx` hin zur einheitlichen Marken- und Systemidentität `Capital-AI`.

---

## [0.6.3-dev] - 2026-07-10

### Added
- **ADR-0007 - Compliance-Wertschöpfungskette**: Neues Entscheidungsdokument (`docs/adr/ADR-0007-compliance-value-chain.md`) zur Bereitstellung einer lückenlosen Compliance-Wertschöpfungskette (Ingestion, PII-Maskierung, deterministische Formeln, manipulationssichere Logs, PDF-Berichtzertifizierung).

### Fixed
- **Behebung von Namenskonventionsfehlern**: Korrektur der alten Systembezeichnung `AIF-Capital-Core` im DSGVO-Konformitätszertifikat (`docs/DATENSCHUTZ_PROTOKOLL.md`) zu `Capital-AI Compliance-Ausschuss` zur Wahrung einer einheitlichen Marken- und Systemidentität.

---

## [0.6.2-dev] - 2026-07-10

### Added
- **Dauerhafter Admin-Bypass / Auto-Login (Google AI Preview & Dev)**: Implizierter Auto-Login für die E-Mail-Adresse `sven.kulessa@gmx.net` mitsamt der Systemstufe `Enterprise` im Preview- und Entwicklungsmodus (erkannt via hostname `run.app` oder `localhost`), um Admin-Optionen out-of-the-box im Google AI Developer Space dauerhaft anzuzeigen.
- **ADR-0005 - Ökosystem-Frontend-Modul-Einbindung**: Neues Architekturdokument (`docs/adr/ADR-0005-frontend-module-integration.md`) zur standardisierten Einbindung des Front-Ends via Module Federation und sicheren postMessage Event-Bussen im Capital-AI FinTech-Ökosystem.
- **ADR-0006 - Anbindung des Plattform-Direktors**: Neues Architekturdokument (`docs/adr/ADR-0006-platform-director-connection.md`) zur Definition der nächsten architektonischen Meilensteine bei der Anbindung einer übergeordneten Server-Governance-Schicht (Platform Director).

### Changed
- **ADR-Historienindex**: Synchroner Eintrag der neuen Entscheidungsdokumente in der `/docs/adr/adr_history.json`.

---

## [0.6.1-dev] - 2026-07-10

### Changed
- **Entfernung der CORE-Branding-Kennzeichnung**: Die statische Bezeichnung "CORE" wurde auf allen Hauptebenen der Benutzeroberfläche (Landingpage, Hauptdashboard-Header und Navigationsschublade) vollständig entfernt und durch die einheitliche Revisionsnummer `VERSION 0.5.4` ersetzt.
- **Deaktivierung des Header-Dropdown-Panels**: Das ausklappbare Profil-Dropdown-Panel in der oberen Navigationsleiste hinter dem Suchfeld wurde mitsamt dem ChevronDown-Ausklapppfeil vollständig entfernt, um die visuelle Hierarchie zu beruhigen. Alle Profil- und Systemoptionen verbleiben exklusiv in der ausfahrbaren Drawer-Seitenleiste.

### Added
- **Architekturdokumentation (ADR-0004)**: Ein neues detailliertes Architekturentscheidungs-Dokument (`docs/adr/ADR-0004-branding-and-panel-removal.md`) wurde angelegt, um diese Branding- und Navigationsanpassung revisionssicher und dauerhaft zu protokollieren. Der ADR-Index `docs/adr/adr_history.json` wurde synchron aktualisiert.

---

## [0.6.0-dev] - 2026-07-04

### Added
- **Kraken Pro Referral Card**: Added custom visual cards displaying the partner referral text and outbound action buttons inside `Dashboard.tsx` and `ImpressumAgb.tsx`.
- **Real-Time Push-Up Notifications**: Added `Watchlist.tsx` for real-time asset monitoring, connected it to the `RealtimeAiNewsfeed` update loop, and implemented low-latency synthesizer alerts via the standard browser `AudioContext` interface.

### Changed
- **Modul 1 Designation Removal**: Completely removed all visible, literal, and comment mentions of "Modul 1" or "Module 1" across the application files (`Dashboard.tsx`, `CapitalAiLogo.tsx`, `LandingPage.tsx`, `GuestCliffhangerModal.tsx`, `RawMaterialsDashboard.tsx`, `RealTimeRiskAssessment.tsx`). Rebranded modules/titles to either "CORE" or specific technical labels (e.g. "Rohstoff-Analyse").
- **Global Support E-Mail Integration**: Swapped support address to `support@capital-ai.online`. Added global header anchor in `Dashboard.tsx`, registered custom tooltip items in retractable drawer navigation, and appended styling blocks in footer.
- **Impressum Direct Contact update**: Adjusted contact state values inside `ImpressumAgb.tsx` to route business communications to `sven.kulessa@capital-ai.online`.

## [0.5.4-dev] - 2026-07-02

### Changed
- **Platform Version**: Updated version identifier across all user-facing pages, system documents, and export templates to **Version 0.5.4**.
- **Audit-Trail Box Removal**: Removed the "Audit-Trail & Begründung" info box from the Crypto Scoring Enterprise overview per client request.

### Fixed / Ignored
- **Stripe & Supabase Environmental Variables**: Unset environment variables for Stripe and Supabase are gracefully ignored/bypassed in this development and preview sandbox. Mock state fallbacks and local context handling are leveraged for uninterrupted execution.