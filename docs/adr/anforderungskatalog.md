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

# CAPITAL-AI Anforderungskatalog & System-Analyse
### Dezentrale Agenten-Architektur, Orchestratoren & Compliance-Dokumentation (Version 0.5.4)

Dieses Dokument dient als offizieller Anforderungskatalog und Revisionsbericht für die dezentrale **CAPITAL-AI Plattform**. Es analysiert die System-Ursachen für die fehlerhafte Dokumenten-Generierung bei der Anbindung neuer Kompetenzen (Agenten) sowie die Schnittstellen-Schnittpunkte zwischen dem Master Supervisor, den Orchestratoren und den dezentralen Agenten. Zudem wird der implementierte Lösungsansatz detailliert dokumentiert.

---

## 1. Ursachenanalyse (Root-Cause Analysis)

### Problem 1: Fehlende Dokumenten-Erstellung ("Capital-AI Documentary")
* **Symptom**: Bei der Anbindung einer neuen Kompetenz wurden keine Revisionsdokumente für Änderungen, Risiken oder Ableitungen (ADR - Architectural Decision Record) erzeugt.
* **Ursache**:
  1. Der im Hintergrund laufende Dokumenten-Wächter (`documentHygiene.ts`) basierte auf einem passiven Datei-Überwachungssystem (`chokidar`) mit der Option `ignoreInitial: true`. Vorhandene oder stillschweigend erzeugte Dateien wurden beim Systemstart nicht indiziert.
  2. Es fehlte eine aktive Registrierungs-Schnittstelle (API) zur dezentralen Registrierung neuer Agenten. Der Prozess war rein dateiorientiert, wodurch neue Module nicht aktiv angemeldet oder verarbeitet wurden.
  3. Es gab keine programmgesteuerte Generierungskette, die bei einer Komponenten-Registrierung zwingend die drei notwendigen Revisionsdokumente erzeugt hat.

### Problem 2: Schnittstellen- & Telemetrie-Fehler zwischen Supervisor und Orchestratoren
* **Symptom**: Der Master Supervisor hatte im Dashboard keine Live-Sichtbarkeit über die Arbeitszustände, Abfragen (Queries) oder den Aktivitätsstatus der dezentralen Agenten während der tatsächlichen Krypto-, Memecoin- oder Rohstoff-Analysen.
* **Ursache**:
  1. Die Orchestratoren (`CryptoOrchestrator`, `MemeCoinOrchestrator`, `RawMaterialsOrchestrator`) operierten als isolierte Klassen-Instanzen im Express-Server.
  2. Es fehlte eine Rückkopplungs-Schleife (Feedback Loop) zur Systemregistrierung (`uploads/agents_registry.json`). Bei Ausführung paralleler Agenten-Anfragen wurden deren Abfragezähler (Query Counts) und Aktivitäts-Zustände nicht aktualisiert.

---

## 2. Implementierte System-Korrekturen (Architektur-Integration)

Um die Datenintegrität und Revisionssicherheit gemäß der **CAPITAL-AI Mandate (Version 0.5.4)** zu garantieren, wurden folgende Anpassungen vorgenommen:

### A. Aktive Registrierungs- & Dokumenten-Pipeline (`server/systemEvents.ts`)
* **Registrierungs-Endpunkt (`POST /api/admin/agents/register`)**:
  * Ermöglicht die dezentrale Registrierung neuer Kompetenzen inklusive Name, Rolle und zugewiesenem LLM-Routing.
  * Schreibt den Agenten direkt in die dezentrale Registry (`uploads/agents_registry.json`).
  * Generiert **sofort** und **vollautomatisch** die drei gesetzlich geforderten Revisionsdokumente unter `docs/`:
    1. **Änderungsdokument** (`docs/CHANGES_OF_<id>.md`)
    2. **Risikoanalyse** (`docs/RISK_ANALYSIS_OF_<id>.md`)
    3. **Architektur-Entscheidung (ADR)** (`docs/ADR_OF_<id>.md`)
  * Triggert manuell und direkt das Dokumenten-Hygienesystem (`documentHygiene.ts`), um die erstellten Dokumente sofort einlesen und validieren zu lassen, ohne auf den trägen Dateisystem-Wächter angewiesen zu sein.
* **Toggle-Endpunkt (`POST /api/admin/agents/toggle`)**:
  * Erlaubt dem Administrator, Agenten zur Laufzeit ein- oder auszuschalten, und persistiert diesen Zustand im System.

### B. Dynamische Telemetrie-Schnittstelle (Orchestrator-Rückkopplung)
* **Aktive Live-Meldungen (`updateAgentActivity`)**:
  * Es wurde eine zentrale Synchronisations-Funktion eingeführt, die den Status eines Agenten (`ACTIVE` / `IDLE`), seine aktuelle Teilaufgabe und die kumulierten Abfragen (QueriesCount) in Echtzeit aktualisiert.
  * Die drei Kern-Orchestratoren (`CryptoOrchestrator`, `MemeCoinOrchestrator`, `RawMaterialsOrchestrator`) wurden so erweitert, dass sie vor dem Start paralleler Agenten-Aufgaben deren Status auf `ACTIVE` setzen, die Abfrage-Zähler inkrementieren und nach Abschluss des Analyse-Prozesses wieder in den Zustand `IDLE` versetzen.
  * Dies behebt den Schnittstellen-Fehler vollständig. Der Supervisor hat im Dashboard nun eine exakte Live-Ansicht aller Agenten-Aktivitäten.

### C. Administrator-UI im Supervisor Dashboard (`SupervisorDashboard.tsx`)
* **Agent-Monitoring & Steuerung**: Die UI greift nun direkt auf den Server-Endpunkt `/api/admin/agents` zu, zeigt Live-Zähler und Echtzeit-Tasks an und ermöglicht das sofortige manuelle Stoppen oder Starten von Agenten.
* **Formular "Neu Kompetenz anbinden"**: Ein hochmodernes, nahtlos integriertes Formular im Agenten-Tab erlaubt Administratoren die sofortige Anbindung neuer Kompetenzen. Nach der Übermittlung werden die Revisionsdokumente erzeugt, validiert und der neue Agent erscheint betriebsbereit in der Live-Liste.

---

## 3. Anforderungskatalog für zukünftige Agenten-Anbindungen

Jede künftige Anbindung eines neuen Agenten oder einer neuen System-Kompetenz an die CAPITAL-AI Plattform MUSS zwingend die folgenden Anforderungen erfüllen:

```
┌────────────────────────────────────────────────────────────────────────┐
│               CAPITAL-AI AGENTEN-ANBINDUNG: PRÜFPROTOKOLL              │
├────────────────────────────────────────────────────────────────────────┤
│  1. [ ] API-REGISTRIERUNG                                              │
│        Der Agent muss über die Supervisor-Schnittstelle registriert    │
│        werden, um eine eindeutige System-ID zu erhalten.               │
│                                                                        │
│  2. [ ] REVISIONSSICHERE DOKUMENTATION                                 │
│        Für jeden Agenten müssen im 'docs/' Verzeichnis drei Markdown-   │
│        Dateien vorliegen:                                              │
│        - CHANGES_OF_<id>.md (Änderungen & Zwecke)                      │
│        - RISK_ANALYSIS_OF_<id>.md (Compliance & DSGVO-Risiken)         │
│        - ADR_OF_<id>.md (Architektur-Entscheidung & LLM-Auswahl)       │
│                                                                        │
│  3. [ ] COMPLIANCE-HYGIENE-PRÜFUNG                                     │
│        Die Dokumente müssen die gesetzlichen Header-Daten enthalten.    │
│        Das System 'documentHygiene.ts' muss die Dokumente validieren   │
│        und den Status "COMPLIANT" vergeben.                            │
│                                                                        │
│  4. [ ] TELEMETRIE-INTEGRATION                                         │
│        Bei Aufruf des Agenten im Orchestrator muss 'updateAgentActivity'│
│        aufgerufen werden, um Status und Queries an das Master-         │
│        Supervisor Dashboard zu melden (Daten-Echtzeit-Sicherheit).     │
│                                                                        │
│  5. [ ] NO MOCK DATA POLICY                                            │
│        Sämtliche Auswertungen müssen auf echten Live-Daten basieren.   │
│        Die Anzeige simulierter Daten im Dashboard ist untersagt.       │
└────────────────────────────────────────────────────────────────────────┘
```

### Detaillierte Spezifikation der Revisionsdokumente:
1. **Änderungsdokument (`CHANGES_OF_<id>.md`)**:
   - Muss den genauen Zeitpunkt der Anbindung, den verantwortlichen Administrator und den funktionalen Scope (Zuständigkeitsbereich) festhalten.
2. **Risikoanalyse (`RISK_ANALYSIS_OF_<id>.md`)**:
   - Muss mögliche Halluzinationsrisiken des Modells, Datenabfluss-Risiken gemäß DSGVO sowie Latenz-Auswirkungen klassifizieren (Kategorien: Gering, Mittel, Hoch) und Gegenmaßnahmen definieren.
3. **Architektur-Entscheidung (`ADR_OF_<id>.md`)**:
   - Muss die technologische Begründung für das gewählte LLM-Routing (z.B. Gemini 2.5 Flash für hohe Geschwindigkeit vs. Claude 3.5 Sonnet für komplexe Codegenerierung) nachvollziehbar dokumentieren.

---
*Dokumentenstatus: **PENDING** / Version: **0.5.4 (Beta-Phase)***  
*Erstellt am: **10. Juli 2026** von: **AI Studio Coding Agent** für: **Sven Kulessa (sven.kulessa@gmail.com)***