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

# ADR-0004: Entfernung des "Core"-Schriftzugs und des aufklappbaren Profil-Panels aus der Kopfzeile

* **Status:** ACCEPTED
* **Datum:** 2026-07-10
* **Autor:** Sven Kulessa

## Kontext
Im ursprünglichen Header-Layout der Benutzeroberfläche befand sich unter dem prominenten "Capital-AI"-Schriftzug das statische Schlagwort "CORE". Zudem enthielt die Header-Leiste ein ausklappbares Profil-Dropdown-Panel (gekennzeichnet durch ein Abwärtspfeil-Symbol), das durch Klick auf das Logo-Modul geöffnet wurde. Im Zuge der Bereinigung der Nutzeroberfläche und zur Vermeidung redundanter Navigationselemente sollte die Versionsnummer direkt auf der Landingpage angezeigt, das Wort "Core" entfernt und das aufklappbare Panel vollständig deaktiviert werden.

## Entscheidung
1. **Entfernung der CORE-Branding-Bezeichnung**: Der statische Schriftzug "CORE" unter dem Markenlogo wurde auf allen Hauptebenen (Landingpage sowie Hauptdashboard und Navigationsschublade) entfernt und durch die aktuelle, einheitliche Beta-Kennzeichnung `VERSION 0.5.4` ersetzt.
2. **Deaktivierung des Header-Dropdown-Panels**: Das Profil-Dropdown-Panel in der oberen Menüleiste (das sich hinter der globalen Suche befand) wurde mitsamt seinem Ausklapp-Pfeil (ChevronDown) entfernt. Das Logo- und Branding-Modul fungiert nun als saubere, nicht-interaktive Statusanzeige.
3. **Zentralisierung der Navigation**: Alle Profil-, Abonnement-, Datenschutz- und Administrationsoptionen verbleiben exklusiv in der ausfahrbaren Seitenleiste (Drawer-Menü), um ein aufgeräumtes und ergonomisches Bedienkonzept zu gewährleisten.

## Konsequenzen
- Erhöhte visuelle Ruhe im Header-Bereich.
- Keine überlappenden UI-Komponenten oder redundanten Dropdowns hinter der Suchleiste.
- Vollständig dokumentierter und revisionssicher nachvollziehbarer Änderungsstand unter `docs/`.
