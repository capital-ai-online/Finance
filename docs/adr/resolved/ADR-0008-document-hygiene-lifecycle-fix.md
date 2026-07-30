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

# ADR-0008: Behebung des Reaktivitäts- & Lebenszyklus-Ausfalls im Document Hygiene Panel

* **Status:** ACCEPTED
* **Implementation-Status:** ✅ COMPLETE (verifiziert 2026-07-30) — `useEffect` mit
  `if (!currentUserEmail) return;` und `[currentUserEmail]`-Dependency-Array bestätigt
  im aktuellen `src/components/DocumentHygienePanel.tsx` vorhanden.
* **Datum:** 2026-07-10
* **Autor:** Sven Kulessa

## Kontext
Im `DocumentHygienePanel` wurde beim Laden der Komponente ein permanentes Abfragen von Status- und Revisionsdateien gestartet, noch bevor die Identität des aktuell eingeloggten Benutzers (`currentUserEmail`) vollständig im Client-Kontext aufgelöst wurde. Da die Backend-Endpunkte der Compliance- und Hygiene-Engine (`/api/admin/hygiene/*`) restriktive administrative Zugriffsprüfungen (Prüfung gegen die `ADMIN_EMAILS` Whitelist) durchführen, führte diese verfrühte Abfrage zu unauthorisierten API-Abbrüchen und blockierte die Initialisierung des Document-Hygiene-Intervalls. Dies beeinträchtigte das lückenlose Monitoring der Dokumentenintegrität.

## Entscheidung
Wir beheben dieses Verhalten durch eine präzise Anpassung des React-Lebenszyklus im `DocumentHygienePanel` (`src/components/DocumentHygienePanel.tsx`):
1. **Lebenszyklus-Absicherung**: Der primäre `useEffect`, welcher die Backend-Abfragen (`fetchStatus` und `fetchHistoryFiles`) sowie das 3-Sekunden-Polling initialisiert, wird mit einem Conditional Early-Return abgesichert. Das Laden und die Abfrageintervalle starten erst, sobald `currentUserEmail` einen validen, nicht-leeren String enthält.
2. **Reaktivitäts-Abhängigkeit**: Der Dependency-Array des `useEffect`-Hooks wird explizit von `[]` auf `[currentUserEmail]` angepasst. Dies stellt sicher, dass bei einem dynamischen Benutzerwechsel oder nach dem verzögerten Laden der Firebase/Mock-Authentifizierungs-Sitzung die Synchronisierung der Dokumentenpflege sofort und nahtlos neu gestartet wird.

## Konsequenzen
* **Vorteile**:
  - **Ausfallsichere Initialisierung**: Keine unauthorisierten API-Fehler (HTTP 401/403) mehr durch unvollständige Authentifizierungs-Kontexte im Client.
  - **Echtzeit-Synchronisierung**: Sofortiger Start des Polling-Dienstes, sobald der globale Administrator angemeldet ist.
  - **Erhöhte Robustheit**: Einhaltung der strengen PII- und DSGVO-Schutzrichtlinien der Plattform, da administrative Abfragen nur bei nachgewiesener Sitzungs-E-Mail übermittelt werden.
* **Herausforderungen**:
  - Bei fehlerhaften Sitzungszuständen im Client, in denen `currentUserEmail` fälschlicherweise leer bleibt, ruht die Komponente im Wartezustand; dies ist jedoch ein erwünschtes Sicherheitsmerkmal (Security-by-Design).
