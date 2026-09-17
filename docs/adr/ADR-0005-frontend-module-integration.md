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

# ADR-0005: Einbindung eines Capital-AI Front-End Moduls im Capital-AI FinTech Ökosystem

* **Status:** ACCEPTED
* **Datum:** 2026-07-10
* **Autor:** Sven Kulessa

## Kontext
Das Capital-AI FinTech Ökosystem wächst zu einer modularen, verteilten Systemlandschaft heran. Um die Benutzeroberfläche (Front-End) der quantitativen Analysetools, Sentiment-Radar-Panels und Risikomodelle nahtlos und performant in dieses Ökosystem zu integrieren, bedarf es einer einheitlichen, standardisierten Integrationsarchitektur. Das Ziel ist es, das in React und Vite entwickelte Front-End-Modul als autarken Baustein bereitzustellen, der sowohl als eigenständige Applikation (SPA) als auch als eingebettetes Modul innerhalb größerer FinTech-Portale und Partner-Plattformen agieren kann.

## Entscheidung
Wir legen die folgenden architektonischen Standards für die Einbindung des Front-End-Moduls im FinTech-Ökosystem fest:

1. **Micro-Frontend-Föderation (Webpack/Vite Module Federation)**:
   - Das Front-End wird als "Remote"-Modul konfiguriert. Bestimmte Kern-Views (wie der Graham-DCF-Rechner, die Monte-Carlo-Simulation und das Krypto-Sentiment-Screener-Panel) werden als exportierbare Komponenten deklariert.
   - Dies ermöglicht es Host-Anwendungen des Ökosystems, diese Panels dynamisch und ohne vollständigen Seiten-Reload zur Laufzeit zu laden und zu rendern.

2. **Sicheres Cross-Origin Messaging (PostMessage-API)**:
   - Für Szenarien, in denen das Modul in einem isolierten `iframe` betrieben wird, wird eine standardisierte, bidirektionale PostMessage-Schnittstelle implementiert.
   - Ein dedizierter Event-Bus im Front-End fängt Host-Befehle (z.B. Wechsel des ausgewählten Assets, Filteränderungen oder Theme-Umschaltungen) ab und sendet Ergebnisdaten (Score-Alarme, Export-Trigger) zurück an den Host.

3. **Zentralisiertes SSO & Token-Propagation**:
   - Die Authentifizierung wird über einen übergeordneten Identity Provider (Supabase Auth / Firebase Auth) geteilt.
   - Das Front-End-Modul akzeptiert JWT-Bearer-Token über URL-Parameter (verschlüsselt), HTTP-Header oder geteilte LocalStorage-Bereiche der Haupt-FinTech-Domain, um eine nahtlose Anmeldung (Single Sign-On) ohne erneute Passworteingabe zu gewährleisten.

4. **Styles-Kapselung & CSS-Präfixe**:
   - Um Style-Kollisionen im Ökosystem zu vermeiden, wird Tailwind CSS so konfiguriert, dass ein eindeutiger Namespace/Prefix (z.B. `aif-`) für alle CSS-Klassen verwendet wird, falls das Modul nicht im isolierten Shadow DOM eingebunden wird.

## Konsequenzen
* **Vorteile**:
  - Maximale Flexibilität bei der Bereitstellung und Integration bei Partnern.
  - Unabhängige Update-Zyklen des Front-End-Moduls ohne Beeinträchtigung des restlichen FinTech-Backbones.
  - Reibungslose und konsistente Benutzerführung durch automatisches Single-Sign-On.
* **Nachteile/Risiken**:
  - Erhöhte Komplexität beim CORS- und Content-Security-Policy (CSP) Management.
  - Notwendigkeit einer akkuraten API-Versionierung zur Vermeidung von Breaking Changes zwischen Host und Remote.
