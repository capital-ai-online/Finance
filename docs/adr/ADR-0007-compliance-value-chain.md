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

# ADR-0007: Bereitstellung einer vollen Capital-AI Compliance Wertschöpfungskette

* **Status:** ACCEPTED
* **Datum:** 2026-07-10
* **Autor:** Sven Kulessa

## Kontext
Im modernen FinTech- und Kapitalmarktregulierungs-Umfeld (z.B. MiFID II, BaFin, DSGVO) ist die bloße Anzeige von statischen Berichten unzureichend. Um eine revisionssichere, automatisierte und lückenlose Compliance-Prüfung zu garantieren, muss die gesamte Wertschöpfungskette der Datenströme, Score-Berechnungen, Audit-Loggings und Export-Zertifizierungen digital abgebildet werden. Dieses Dokument definiert die Schritte zur Bereitstellung einer durchgängigen **Capital-AI Compliance Wertschöpfungskette**.

## Entscheidung
Wir etablieren eine 5-stufige, integrierte Compliance-Wertschöpfungskette (Compliance Value Chain) innerhalb der Plattform-Architektur:

### Stufe 1: Daten-Ingestion & Validierungs-Gateway (Datenintegrität)
- **Maßnahme**: Jede in das System einfließende Markt- oder Asset-Information wird über ein strikt typisiertes Gateway validiert. 
- **Zweck**: Ausschluss von manipulierten Daten oder Fake-Werten (Einhaltung der "No-Mock-Data-Policy"). Unvollständige Abfragen werden sofort isoliert und im Audit-Log vermerkt.

### Stufe 2: Anonymisierung & PII-Maskierung (Datenschutz-by-Design)
- **Maßnahme**: Alle einfließenden Abfragen von Nutzern werden vor der Weiterleitung an externe Analysedienste (z.B. Google GenAI / LLM API-Schnittstellen) bereinigt.
- **Zweck**: Vollständiger Schutz personenbezogener Daten (Art. 32 DSGVO). Personenbezogene Verbindungsdaten werden im RAM-Bypassing-Verfahren gefiltert, sodass IP-Adressen oder Nutzeridentitäten niemals externe Server erreichen.

### Stufe 3: Deterministische Berechnungs-Engines & Sentiment-Verifizierung
- **Maßnahme**: Berechnungsformeln (wie Graham-DCF oder Risikokoeffizienten) laufen deterministisch auf dem Server. KI-gestützte Sentiment-Analysen müssen über nachvollziehbates Grounding (wie Google Search Grounding) mit genauer Quellenangabe belegt werden.
- **Zweck**: Einhaltung der finanzrechtlichen Offenlegungspflichten und Gewährleistung einer lückenlos nachvollziehbaren Berechnungs-Historie.

### Stufe 4: Unveränderbares Event-Logging (Immutable Audit Trail)
- **Maßnahme**: Jede kritische Transaktion, jeder PDF-Export und jeder Administrator-Eingriff wird in einem manipulationssicheren, strukturierten Protokoll mit Zeitstempel aufgezeichnet (z.B. in der `AuditLogs` Tabelle/Komponente).
- **Zweck**: Erbringung rechtssicherer Nachweise gegenüber Regulierungsbehörden (BaFin, DSGVO-Aufsicht).

### Stufe 5: Automatisierte Konformitäts-Zertifizierung & PDF-Export
- **Maßnahme**: Die Export-Engine generiert interaktive Compliance-Zertifikate (PDFs) mit einem eindeutigen kryptografischen Hash-Präfix, das die Echtheit des Berichts fälschungssicher bestätigt.
- **Zweck**: Bereitstellung direkt verwertbarer Konformitätsberichte für Anleiheemittenten, Fondsmanager und institutionelle Mandanten.

## Konsequenzen
* **Vorteile**:
  - Nahtloser Übergang von quantitativer Rohdatenanalyse zu einer auditierten, rechtlich defensiblen Berichterstattung.
  - Deutlich reduziertes Haftungsrisiko für den Plattformbetreiber durch präventive Offenlegungsausschlüsse.
  - Steigerung des Kundenvertrauens im institutionellen Enterprise-Segment durch verifizierte, quellengestützte KI-Auswertungen.
* **Herausforderungen**:
  - Erhöhte Anforderungen an die Performance der PDF-Generierungs- und Logging-Engines.
  - Kontinuierliche Abstimmung der Systemgrenzen auf die sich wandelnden europäischen Regulierungsentwürfe (z.B. EU AI Act).
