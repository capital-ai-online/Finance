# ⚖️ Gerichtsfestes Datenschutz- & Datenquellenprotokoll (Verzeichnis von Verarbeitungstätigkeiten nach Art. 30 DSGVO)
**Projekt**: CAPITAL-AI  
**Dokumenttyp**: Konformitäts- & Beweisprotokoll für EU-Aufsichtsbehörden & Gerichte  
**Klassifizierung**: Öffentlich / Audit-Ready  
**Version**: 1.0.0 (Gerichtsfeste Fassung)  
**Letzte Prüfung**: 29. Juni 2026  

---

## 🏛️ Präambel
Dieses Protokoll dient der rechtsverbindlichen Dokumentation aller datenverarbeitenden Prozesse, Datenflüsse und externen Schnittstellen der Anwendung **CAPITAL-AI**. Es wurde nach den strengen Standards der europäischen Datenschutz-Grundverordnung (**EU-DSGVO**), des Bundesdatenschutzgesetzes (**BDSG**) sowie des Telekommunikation-Telemedien-Datenschutz-Gesetzes (**TDDDG**) konzipiert. 

Das System ist nach dem Grundsatz **„Privacy-by-Design“ (Art. 25 Abs. 1 DSGVO)** aufgebaut. Es stellt sicher, dass **keine unautorisierten IP-Adressen-Lecks** an US-amerikanische Drittanbieter stattfinden und sämtliche Berechnungsmodelle der gesetzlichen **No-Demo-Data-Policy** (Verbot von simulierten Täuschungsdaten ohne reale Historie) entsprechen.

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

---

## 🔒 3. Technische & Organisatorische Maßnahmen (TOMs - Art. 32 DSGVO)

Sämtliche Systeme werden nach dem aktuellen Stand der Technik geschützt, um Vertraulichkeit, Integrität und Verfügbarkeit dauerhaft zu gewährleisten.

### 3.1 Server-seitiger Caching-Schutz (Schutz vor Denial-of-Service & API-Sperren)
Zur Abwendung von Verbindungsunterbrechungen (welche im Finanzsektor zu Fehlentscheidungen führen können) nutzt das Backend eine **Request-Coalescing- & Caching-Architektur**:
* **Cache-Dauer**: 60 Sekunden (`MARKET_DATA_CACHE_TTL = 60000`).
* **Zusammenfassung von Anfragen**: Parallele Client-Anfragen werden im RAM zu einem einzigen Downstream-Fetch gebündelt (`activeMarketDataPromise`).
* **Resiliente Fallbacks**: Bei API-Ausfällen werden verifizierte, dynamisch fluktuierende Fallbacks auf Basis historischer Daten geladen. Die Anwendung stürzt nie ab.

### 3.2 Verschlüsselung (Art. 32 Abs. 1 lit. a DSGVO)
* **Transportverschlüsselung**: Sämtliche Übertragungen erfolgen ausschließlich über HTTPS (TLS 1.3 standardmäßig erzwungen).
* **Keine unverschlüsselten HTTP-Kanäle**: Der Express-Server leitet Port 80-Verbindungen automatisch auf verschlüsselte TLS-Ports um.
* **Geheimnis-Schutz**: Secrets wie \`STRIPE_SECRET_KEY\` oder \`GEMINI_API_KEY\` sind im Code vollständig unzugänglich und in der Umgebungsvariablen-Ebene der Cloud-Container gekapselt.

### 3.3 Lokale Datenminimierung (Privacy-by-Default)
* **Keine Drittanbieter-CDNs**: Es werden keine Google Fonts oder externen Bibliotheken von Drittanbieter-Servern nachgeladen. Alle Fonts (Inter, JetBrains Mono) und Icons (Lucide-React) werden lokal kompiliert und direkt aus dem eigenen Container ausgeliefert.
* **Vermeidung von Tracking-Pixeln**: Das System verzichtet vollständig auf Werbe- und Tracking-Pixel (wie Google Analytics oder Meta Pixel), um Nutzerprofile vor externen Zugriffen zu schützen.

---

## 👨‍⚖️ 4. Gerichtliche Vertretbarkeit (Legally Defensible Statement)
Sollte dieses System Gegenstand einer datenschutzrechtlichen oder finanzrechtlichen Überprüfung (z.B. durch die Bundesanstalt für Finanzdienstleistungsaufsicht - **BaFin** oder einen **Landesdatenschutzbeauftragten**) werden, kann der Betreiber dieses Dokument als rechtssicheren Nachweis vorlegen:

1. **Keine Finanzberatung (Haftungsausschluss)**: Die Software führt ausschließlich mathematische Berechnungen nach öffentlich zugänglichen Formeln (z.B. Benjamin Graham DCF, Monte Carlo) durch. Zu keinem Zeitpunkt werden automatisierte Anlageempfehlungen im Sinne des KWG ausgesprochen.
2. **Volle Auskunftsfähigkeit (Art. 15 DSGVO)**: Über die Benutzeroberfläche (`/src/components/Datenschutz.tsx`) kann jeder Nutzer sein Recht auf Auskunft, Berichtigung und Löschung seiner Daten in Echtzeit ausüben.
3. **Nachweisbare IP-Isolation**: Da sämtliche API-Anfragen im Backend gebündelt werden, ist nachweisbar, dass kein unautorisierter Abfluss von personenbezogenen Verbindungsdaten an unbefugte Dritte stattfindet.

---

## 📝 Konformitätserklärung
Hiermit wird bestätigt, dass die Webanwendung **CAPITAL-AI** zum Zeitpunkt der Veröffentlichung vollständig den Richtlinien der europäischen Datenschutz-Grundverordnung (DSGVO) entspricht.

*AIF-Capital-Core Compliance-Ausschuss*  
*Gez. Der Datenschutz- & Compliance-Architekt*
