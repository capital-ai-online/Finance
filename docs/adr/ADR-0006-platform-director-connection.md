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

# ADR-0006: Nächste architektonische Schritte zur Anbindung eines Plattform-Direktors innerhalb der Plattform

* **Status:** ACCEPTED
* **Datum:** 2026-07-10
* **Autor:** Sven Kulessa

## Kontext
Im Zuge der Skalierung der autonomen quantitative Analyseagenten (Graham-DCF, Monte-Carlo, Sentiment-Radar etc.) bedarf es einer zentralen, übergeordneten Governance-Instanz innerhalb des Backends—dem **Plattform-Direktor (Platform Director)**. Der Plattform-Direktor fungiert als zentraler System-Supervisor, der Ressourcen verwaltet, Agenten-Workflows steuert, Sicherheitsrichtlinien dynamisch anwendet, das System vor Überlastung (Rate Limiting) schützt und ein verlässliches Failover-Routing etabliert. Dieses Dokument skizziert die konkreten nächsten architektonischen Meilensteine zur Anbindung dieses Direktors.

## Entscheidung
Wir legen die folgenden vier Kernschritte zur schrittweisen Implementierung und Anbindung des Plattform-Direktors fest:

### Schritt 1: Definition des Platform Director API-Contracts & Zustandsmodells
- **Maßnahme**: Entwurf eines robusten Zustandsmodells im Backend zur permanenten Erfassung aller aktiven Systemkomponenten (Scanners, LLM-Knoten, API-Pipelines).
- **Schnittstellen**:
  - `GET /api/director/health`: Ermittelt die aktuelle Auslastung und den Latenzstatus aller angebundenen Agenten-Subsysteme.
  - `POST /api/director/route`: Nimmt Anfragen entgegen und entscheidet über das optimale Ziel-Routing basierend auf DSGVO-Vorgaben und Benutzerrechten (z.B. Zuweisung von Premium-Anfragen an High-Performance-Modelle).

### Schritt 2: Implementierung des dynamischen Load-Balancing & Failover-Managers
- **Maßnahme**: Einbettung einer intelligenten Routing-Logik im Express-Server. Wenn eine Schnittstelle (z.B. Google Search Grounding für Sentiment) verzögert antwortet oder ein API-Limit erreicht ist, leitet der Plattform-Direktor die Abfrage automatisch an ein redundantes Ausweich-Modell (z.B. Wechsel von Gemini 1.5 Flash auf Gemini 2.0 / alternative Scanners) weiter.
- **Vorteil**: Erhöhte Ausfallsicherheit der Applikation im Live-Betrieb bei hoher Last.

### Schritt 3: Einbau des Governance- & Rate-Limit-Wächters (DSGVO-Compliance)
- **Maßnahme**: Der Direktor überwacht die Einhaltung der Datenschutzrichtlinien. Er maskiert PII (Personally Identifiable Information) in Logfiles, bevor Anfragen an externe LLM-Schnittstellen gesendet werden.
- **Sicherheits-Bypass**: Definition einer granularen Access-Control-List (ACL) für Sven Kulessa (`sven.kulessa@gmx.net` und `sven.kulessa@gmail.com`), um administrativen System-Eingriff und Telemetrie-Einsicht in Echtzeit zu gestatten.

### Schritt 4: Implementierung des Director Control Centers im Admin-Panel
- **Maßnahme**: Erweiterung des Admin-Panels in der Benutzeroberfläche um eine interaktive Dashboard-Ansicht für den Plattform-Direktor.
- **Funktionen**:
  - Echtzeit-Statusanzeige aller Agenten-Auslastungen.
  - Manuelle Override-Schalter, um bestimmte Daten-Pipelines temporär zu stoppen, zu drosseln oder umzurouten (z.B. bei API-Wartungen).
  - Live-Ansicht anonymisierter System-Audit-Logs zur Performance-Analyse.

## Konsequenzen
* **Vorteile**:
  - Maximale Skalierbarkeit durch Entkopplung von API-Client und Server-Routing.
  - Gewährleistung strengster Datenschutzstandards durch automatische Vorprüfung der Payloads durch den Plattform-Direktor.
  - Vereinfachte Diagnose und Wartung des Gesamtsystems durch die Admin-Bedienschnittstelle.
* **Nachteile/Risiken**:
  - Der Plattform-Direktor stellt einen potenziellen Single Point of Failure (SPOF) dar; daher muss dieser hochverfügbar und schlank implementiert werden.
  - Minimaler Latenz-Overhead durch die zwischengeschaltete Routing- und Validierungsebene.
