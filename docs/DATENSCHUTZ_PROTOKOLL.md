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

# ⚖️ Gerichtsfestes Datenschutz- & Datenquellenprotokoll (Verzeichnis von Verarbeitungstätigkeiten nach Art. 30 DSGVO)
**Projekt**: CAPITAL-AI  
**Dokumenttyp**: Konformitäts- & Beweisprotokoll für EU-Aufsichtsbehörden & Gerichte  
**Klassifizierung**: Öffentlich / Audit-Ready  
**Version**: 1.2.0 (Ergänzt um Google Analytics 4 als einwilligungspflichtige Verarbeitungstätigkeit)  
**Letzte Prüfung**: 2. August 2026  

---

## 🏛️ Präambel
Dieses Protokoll dient der rechtsverbindlichen Dokumentation aller datenverarbeitenden Prozesse, Datenflüsse und externen Schnittstellen der Anwendung **CAPITAL-AI**. Es wurde nach den strengen Standards der europäischen Datenschutz-Grundverordnung (**EU-DSGVO**), des Bundesdatenschutzgesetzes (**BDSG**) sowie des Telekommunikation-Telemedien-Datenschutz-Gesetzes (**TDDDG**) konzipiert. 

Das System ist nach dem Grundsatz **„Privacy-by-Design“ (Art. 25 Abs. 1 DSGVO)** aufgebaut. Es stellt sicher, dass **keine unautorisierten IP-Adressen-Lecks** an US-amerikanische Drittanbieter stattfinden. Die **No-Demo-Data-Policy** (Verbot von simulierten Täuschungsdaten ohne reale Historie, ohne dies dem Nutzer sichtbar offenzulegen) gilt für sämtliche Berechnungsmodelle; ihr aktueller Umsetzungsstand ist in Abschnitt 2.1 offengelegt, einschließlich einer bekannten, dokumentierten Abweichung bei den Krypto-Scoring-Eingangsgrößen.

---

## 📊 1. Verzeichnis von Verarbeitungstätigkeiten (Art. 30 DSGVO)

### 1.1 Angaben zum Verantwortlichen (Art. 30 Abs. 1 lit. a DSGVO)
* **Verantwortliche Stelle**: AIFinancial GmbH  
* **Vertreten durch**: Geschäftsführung  
* **Anschrift**: sven.kulessa@gmail.com (für gerichtliche Zustellungen & Auskunftsersuchen)  

### 1.2 Kategorien betroffener Personen und Datenkategorien (Art. 30 Abs. 1 lit. c DSGVO)
1. **Kategorie A (Registrierte Nutzer & Abonnenten)**:
   * *Bestandsdaten*: E-Mail-Adresse (verschlüsselt in Supabase Auth).
   * *Finanzdaten*: Stripe-Abonnement-Status (Free, Starter, Pro, Enterprise), Transaktions-ID, Rechnungsland.
   * *Nutzungsdaten*: Letzter Login, gespeicherte Ticker-Favoriten.
2. **Kategorie B (Anonyme Webseitenbesucher)**:
   * *Verbindungsdaten*: IP-Adresse (vollständig anonymisiert im Server-RAM; keine persistente Speicherung in Protokolldateien).

---

## 🔌 2. Vollständige Datenquellen- & API-Matrix (No-Demo-Data Audit)

Um die Einhaltung der gesetzlichen **No-Demo-Data Policy** zu garantieren, bezieht das System ausschließlich mathematisch-reale Marktdaten über dedizierte Server-Proxys. Es existiert **keine direkte Verbindung vom Browser des Endnutzers zu Drittanbieter-APIs**.

| Datenquelle (Schnittstelle) | Typ der Daten | Datenübertragungskanal | Zweck der Verarbeitung | IP-Adressen-Handling | DSGVO-Relevanz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CoinGecko API** | Krypto-Echtzeitkurse, Marktkapitalisierung, 24h-Volumen. | **Server-to-Server HTTPS** (Port 443, verschlüsselt). | Versorgung der Screener und des Interact-Spielfelds (Modul 2) mit echten Marktwerten. | **Vollständig gekapselt**. Die IP des Nutzers berührt CoinGecko nie. Anfragen werden vom Express-Server gebündelt und gecached. | Keine (keine personenbezogenen Daten übertragen). |
| **Stooq API** | Aktienkurse (US), Forex-Märkte, Edelmetalle. | **Server-to-Server HTTPS** (Schnittstellenabfrage via CSV-Stream). | Echtzeitkurse für traditionelle Anlageklassen zur Berechnung von intrinsischen DCF-Faktoren. | **Vollständig gekapselt**. Keine IP-Lecks an Stooq-Server. | Keine. |
| **Stripe Gateway** | Zahlungsabwicklung, PCI-DSS-konforme Transaktionsdaten. | **Sichere API-Verbindung** via verschlüsselte Stripe-Tokens (Lazy-loaded im Server-Backend). | Bereitstellung und Verifizierung von Premium-Funktionen (Stripe Checkout). | IP-Adresse wird verschlüsselt für Betrugsprävention auf Stripe-Servern verarbeitet (EU-Standardvertragsklauseln aktiv). | **Hoch** (Zahlungsdaten). Geregelt über Auftragsverarbeitungsvertrag (AVV) mit Stripe Payments Europe Ltd. |
| **Supabase / PostgreSQL** | Registrierungen, verschlüsselte Passwörter, historische Backtest-Historie. | **Infrastruktur-internes Netzwerk** (verschlüsselte TCP-Verbindung). | Speicherung des Premium-Abostatus und der systemweiten quantitativen Favoriten-Präferenzen. | IP-Adresse wird zur Missbrauchserkennung kurzzeitig protokolliert (Löschfrist: 7 Tage). | **Hoch**. Geregelt über AVV mit Supabase Inc. (Datenhaltung im Rechenzentrum Frankfurt, Deutschland). |
| **Google GenAI (Gemini) API** | Intelligentes News-Scoring, regulatorische Analysen. | **Server-to-Server HTTPS** via Google Cloud SDK. | Generierung von Realtime AI Newsfeeds und Modell-Routing-Entscheidungen im CAPITAL-AI. | **Vollständig anonymisiert**. Keine Nutzerdaten oder IPs werden an Google-Modelle übermittelt. | Keine. |
| **Google Analytics 4** | Reichweiten-/Nutzungsstatistik (Cookies, IP-Adresse nativ von GA4 nicht vollständig gespeichert). | **Client-seitig, HTTPS** (googletagmanager.com / google-analytics.com) — nur nach Einwilligung geladen. | Statistische Auswertung der Portalnutzung zur Produktverbesserung (Inline-Script in `index.html`, siehe `docs/runbooks/GOOGLE_ANALYTICS_SETUP.md`). | Skript wird ausschließlich nach aktivem Opt-in im CookieHub-Banner geladen (keine Google Consent-Mode-„denied"-Pings, da das Skript vor Einwilligung gar nicht erst in den DOM injiziert wird); Ereignisdaten-Aufbewahrung in GA4 auf 2 Monate begrenzt. Widerruf jederzeit über „Cookie-Einstellungen ändern" (`Datenschutz.tsx` → `window.cookiehub.openSettings()`). | **Mittel** (Nutzungsdaten). Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), kein AVV-Erfordernis ohne Auftragsverarbeitung von Bestandsdaten. |
| **CookieHub (Consent-Management-Plattform)** | Einwilligungsentscheidung (gewählte Kategorien, Zeitstempel). Kein Tracking-, Werbe- oder Profiling-Zweck. | **Client-seitig, HTTPS** (cdn.cookiehub.eu) — lädt unconditioniert, da selbst kein Tracking-Werkzeug, sondern die Instanz, die Einwilligung für andere Dienste (Google Analytics) einholt. | Einholung, Anzeige und lokale Speicherung der Cookie-Einwilligung inkl. Nachweisbarkeit gegenüber Aufsichtsbehörden. | Verarbeitet ausschließlich die Einwilligungsentscheidung, keine Inhalts- oder Profildaten des Nutzers. | Keine gesonderte Einwilligung erforderlich (funktional notwendiges Compliance-Werkzeug). Rechtsgrundlage: Art. 6 Abs. 1 lit. c DSGVO i. V. m. § 25 TDDDG (Nachweispflicht der Einwilligung). |

Die vorstehende Matrix betrifft ausschließlich die **Marktpreis-Rohdaten** (Kurse, Marktkapitalisierung, Handelsvolumen). Die Weiterverarbeitung dieser Rohdaten zu einem Bewertungs-Score ist gesondert in Abschnitt 2.1 dokumentiert.

### 2.1 Bekannte Abweichung: Krypto-Scoring-Eingangsgrößen (Offenlegung)

Das Enterprise-Architektur-Audit ARCH-AUDIT-0002 (`docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md`, Kapitel 6, Befund AUD2-F-001) hat festgestellt, dass der Krypto- und Meme-Coin-Bewertungs-Score seine Eingangsgrößen (u. a. Marktkapitalisierungs-Einordnung, Liquiditätsbewertung, Tokenomics, Sicherheits-Einschätzung, Entwickleraktivität, Umsatz, Adoption) **nicht** aus den in der obigen Matrix genannten Live-Datenquellen bezieht, sondern algorithmisch aus einem Zeichen-Hash des Tickersymbols ableitet (`src/services/scoring.service.ts`, `src/services/cryptoScoringService.ts`, `src/services/memeCoinScoringService.ts`).

Diese Abweichung wird seit dem 31. Juli 2026 im Produktivsystem aktiv gegenüber dem Nutzer offengelegt: Betroffene API-Antworten führen ein Feld `scoreBasis: 'synthetic'`, und die konsumierenden Oberflächen (u. a. `CryptoScoringEnterprise.tsx`, `Screener.tsx`, `Watchlist.tsx`, `DeFiOrchestration.tsx`) zeigen einen sichtbaren Warnhinweis, dass der jeweilige Score **nicht marktdatenbasiert und nicht als Grundlage für Anlageentscheidungen geeignet** ist. Diese Kennzeichnung ist eine Sofortmaßnahme; die geplante Anbindung der Eingangsgrößen an reale Marktdaten ist als Maßnahme S1/S2 im 60-Tage-Horizont von ARCH-AUDIT-0002 (Kapitel 14.3) dokumentiert und noch nicht umgesetzt.

Die übrigen in diesem Protokoll beschriebenen Datenflüsse (Marktpreis-Abfrage, Backtest-Historie, Portfolio-Analyse) sind von diesem Befund nicht betroffen; deren Herkunft wird bereits seit der No-Demo-Data-Bereinigung vom 31. Juli 2026 über ein `source`-Feld (`'live' | 'simulated'`) offengelegt.

---

## 🔒 3. Technische & Organisatorische Maßnahmen (TOMs - Art. 32 DSGVO)

Sämtliche Systeme werden nach dem aktuellen Stand der Technik geschützt, um Vertraulichkeit, Integrität und Verfügbarkeit dauerhaft zu gewährleisten.

### 3.1 Server-seitiger Caching-Schutz (Schutz vor Denial-of-Service & API-Sperren)
Zur Abwendung von Verbindungsunterbrechungen (welche im Finanzsektor zu Fehlentscheidungen führen können) nutzt das Backend eine **Request-Coalescing- & Caching-Architektur**:
* **Cache-Dauer**: 60 Sekunden (`MARKET_DATA_CACHE_TTL = 60000`).
* **Zusammenfassung von Anfragen**: Parallele Client-Anfragen werden im RAM zu einem einzigen Downstream-Fetch gebündelt (`activeMarketDataPromise`).
* **Resiliente Fallbacks**: Bei API-Ausfällen wird auf einen statischen, klar als `dataSource: 'fallback'` gekennzeichneten Datenstand zurückgegriffen (`server.ts`). Es findet **keine** künstliche Kursfluktuation im Fallback-Fall statt (No-Demo-Data-Policy) — die Anwendung stürzt nie ab, meldet den Fallback-Zustand aber ehrlich statt ihn als Live-Daten zu tarnen.

### 3.2 Verschlüsselung (Art. 32 Abs. 1 lit. a DSGVO)
* **Transportverschlüsselung**: Sämtliche Übertragungen erfolgen ausschließlich über HTTPS (TLS 1.3 standardmäßig erzwungen).
* **Keine unverschlüsselten HTTP-Kanäle**: Der Express-Server leitet Port 80-Verbindungen automatisch auf verschlüsselte TLS-Ports um.
* **Geheimnis-Schutz**: Secrets wie \`STRIPE_SECRET_KEY\` oder \`GEMINI_API_KEY\` sind im Code vollständig unzugänglich und in der Umgebungsvariablen-Ebene der Cloud-Container gekapselt.

### 3.3 Lokale Datenminimierung (Privacy-by-Default)
* **Keine Drittanbieter-CDNs**: Es werden keine Google Fonts oder externen Bibliotheken von Drittanbieter-Servern nachgeladen. Alle Fonts (Inter, JetBrains Mono) und Icons (Lucide-React) werden lokal kompiliert und direkt aus dem eigenen Container ausgeliefert.
* **Kein Tracking ohne Einwilligung**: Das System verzichtet vollständig auf Werbe-Pixel (z. B. Meta Pixel). Google Analytics wird seit dem 2. August 2026 optional eingesetzt, aber technisch ausschließlich nach aktivem Opt-in des Nutzers über das CookieHub-Consent-Banner geladen (siehe Abschnitt 2 und `docs/runbooks/GOOGLE_ANALYTICS_SETUP.md`) — ohne Einwilligung findet keinerlei Übertragung an Google statt.

---

## 👨‍⚖️ 4. Gerichtliche Vertretbarkeit (Legally Defensible Statement)
Sollte dieses System Gegenstand einer datenschutzrechtlichen oder finanzrechtlichen Überprüfung (z.B. durch die Bundesanstalt für Finanzdienstleistungsaufsicht - **BaFin** oder einen **Landesdatenschutzbeauftragten**) werden, kann der Betreiber dieses Dokument als rechtssicheren Nachweis vorlegen:

1. **Keine Finanzberatung (Haftungsausschluss)**: Die Software führt ausschließlich mathematische Berechnungen nach öffentlich zugänglichen Formeln (z.B. Benjamin Graham DCF, Monte Carlo) durch. Zu keinem Zeitpunkt werden automatisierte Anlageempfehlungen im Sinne des KWG ausgesprochen.
2. **Volle Auskunftsfähigkeit (Art. 15 DSGVO)**: Über die Benutzeroberfläche (`/src/components/Datenschutz.tsx`) kann jeder Nutzer sein Recht auf Auskunft, Berichtigung und Löschung seiner Daten in Echtzeit ausüben.
3. **Nachweisbare IP-Isolation**: Da sämtliche API-Anfragen im Backend gebündelt werden, ist nachweisbar, dass kein unautorisierter Abfluss von personenbezogenen Verbindungsdaten an unbefugte Dritte stattfindet.

---

## 📝 Konformitätserklärung
Hiermit wird bestätigt, dass die Webanwendung **CAPITAL-AI** zum Zeitpunkt der Veröffentlichung vollständig den Richtlinien der europäischen Datenschutz-Grundverordnung (DSGVO) entspricht.

*Capital-AI Compliance-Ausschuss*  
*Gez. Der Datenschutz- & Compliance-Architekt*