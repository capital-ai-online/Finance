# CAPITAL-AI Runbook: Google Analytics, AdSense und CookieHub

## Document ID

RUNBOOK-0003

## Status

Aktiv — Repository-Implementierung gemäß **ESS-0014** und **ADR-0042**.

CAPITAL-AI verwendet **Google Consent Mode v2 im Basic Mode**:

- CookieHub ist Consent Source of Truth;
- ohne Opt-in wird kein Google-Tag geladen und kein Google-Netzwerkrequest ausgelöst;
- GA4 wird nur durch die Kategorie `analytics` aktiviert;
- AdSense wird nur durch die Kategorie `marketing` aktiviert;
- alle Consent-Mode-v2-Felder starten fail-closed mit `denied`;
- ein Widerruf setzt die Signale zurück, deaktiviert GA und lädt die Seite neu.

Die frühere Runbook-Aussage, Consent Mode v2 solle nicht verwendet werden, ist durch ESS-0014 und
ADR-0042 ersetzt. Advanced Consent Mode mit cookieless pings bleibt ausdrücklich ausgeschlossen.

## Bezug

- `.ai/skills/ESS-0014-Google-Marketing-MCP-Governance.md`
- `docs/adr/ADR-0035-protected-google-marketing-integration-strict-csp.md`
- `docs/adr/ADR-0040-csp-runtime-remediation-safe-rollout.md`
- `docs/adr/ADR-0042-basic-consent-mode-v2-google-tag-gating.md`
- `docs/DATENSCHUTZ_PROTOKOLL.md`

---

## 1. Architektur

### 1.1 HTML Shell

`index.html` enthält nur:

- CookieHub Production SDK;
- inerte öffentliche IDs als Meta-Tags;
- den First-Party-Consent-Bridge;
- den CookieHub-Initializer.

Es gibt **keinen** direkt ausführbaren GA4- oder AdSense-Third-Party-Loader im HTML.

```html
<script src="https://cdn.cookiehub.eu/c2/75f66920.js"></script>
<meta name="ga-measurement-id" content="%VITE_GA_MEASUREMENT_ID%" />
<meta name="adsense-publisher-id" content="ca-pub-1353017943074018" />
<script src="/google-analytics-consent.js"></script>
<script src="/cookiehub-init.js"></script>
```

Alle produktiven Script-Tags erhalten serverseitig denselben Request-Nonce gemäß ADR-0035/
ADR-0040.

### 1.2 First-Party Bridge

`public/google-analytics-consent.js`:

1. erzeugt lokal `dataLayer`/`gtag`;
2. setzt Consent Mode v2 auf denied, ohne ein Google-Script zu laden;
3. registriert CookieHub-Events auf `document`;
4. liest `analytics` und `marketing` aus CookieHub;
5. injiziert die jeweiligen Google-Tags erst nach Opt-in;
6. verhindert Mehrfachinjektion;
7. behandelt Fehler fail-closed;
8. löscht bei Analytics-Widerruf erreichbare `_ga`-/`_ga_*`-Cookies;
9. lädt nach einem Widerruf neu, weil ausgeführte Third-Party-Skripte nicht sicher entladen werden
   können.

### 1.3 Consent Mapping

| CookieHub-Kategorie | Google-Signal / Dienst | Verhalten |
|---|---|---|
| `necessary` | `security_storage=granted` | Immer aktiv, nur Sicherheits-/Consent-Funktion |
| `analytics` | `analytics_storage` + GA4 | GA4 erst nach Opt-in |
| `marketing` | `ad_storage`, `ad_user_data`, `ad_personalization` + AdSense | AdSense erst nach Opt-in |
| `preferences` | derzeit nicht genutzt | Bleibt denied |

`allow_google_signals` und `allow_ad_personalization_signals` bleiben in der GA4-Konfiguration
bewusst deaktiviert. AdSense wird getrennt über `marketing` gesteuert.

---

## 2. GA4 Property und Measurement-ID

1. Google Analytics öffnen und die Produktions-Property auswählen.
2. Web-Datenstream für `https://capital-ai.online` prüfen.
3. Measurement-ID im Format `G-XXXXXXXXXX` kopieren.
4. Erweiterte Messung nur für tatsächlich benötigte Events aktivieren.
5. Datenaufbewahrung auf den fachlich/rechtlich erforderlichen Mindestzeitraum reduzieren.
6. Google-Signals, Ads-Verknüpfungen und Remarketing nur nach eigener Freigabe aktivieren.

Die Measurement-ID ist öffentlich, aber ihre Zuordnung zur korrekten Property muss kontrolliert
werden.

---

## 3. Build-Time Environment

Vite ersetzt `VITE_*`-Variablen zur Build-Zeit.

```text
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Entwicklung

Wert in `.env` setzen. `.env` darf nicht committed werden.

### Produktion / Render

1. Environment Variable in Render setzen oder prüfen;
2. neuen Build/Deploy auslösen;
3. im ausgelieferten HTML prüfen, dass der Meta-Tag eine gültige `G-...`-ID enthält.

Fehlt die Variable oder bleibt `%VITE_GA_MEASUREMENT_ID%` unverarbeitet, lädt GA4 fail-closed nicht.

---

## 4. CookieHub Production Configuration

Repository-Code kann das externe CookieHub-Dashboard nicht verändern. Der Repository-Owner prüft:

1. Domain-Code `75f66920` gehört zu `capital-ai.online`;
2. Production-Domain ist verifiziert;
3. Kategorie-IDs heißen exakt `analytics` und `marketing`;
4. Google Analytics 4 ist `analytics` zugeordnet;
5. Google AdSense ist `marketing` zugeordnet;
6. Ablehnen ist auf derselben Ebene und ebenso leicht erreichbar wie Akzeptieren;
7. Einwilligungen werden mit Zeitstempel/Version protokolliert;
8. Preference Center ist dauerhaft erreichbar;
9. Deutsch ist aktiviert;
10. die aktuellen Google-CMP-/IAB-TCF-Anforderungen für AdSense in EWR/UK/CH sind erfüllt.

### Keine doppelte Consent-Implementierung

Der First-Party-Bridge sendet die Consent-Mode-v2-Signale. Während dieser aktiv ist:

- keine zusätzliche manuelle `gtag('consent', ...)`-Implementierung;
- kein zweiter Cookie-Banner;
- kein paralleler GTM-Consent-Tag;
- CookieHub-GCM-Automatik nur aktivieren, wenn die First-Party-Bridge in einem eigenen ADR ersetzt
  und die doppelte Signalgebung ausgeschlossen wurde.

---

## 5. Verifikation

Tests immer in einem neuen privaten Browserprofil oder nach Löschen der Site-Daten durchführen.

### 5.1 Vor jeder Einwilligung

Im Network-Tab darf kein Request an folgende Ziele erscheinen:

```text
www.googletagmanager.com
google-analytics.com
pagead2.googlesyndication.com
doubleclick.net
```

Zusätzlich:

- keine `_ga`-/`_ga_*`-Cookies;
- `dataLayer` enthält Consent Default `denied`;
- CookieHub-Banner/Preference Center ist sichtbar oder erreichbar.

### 5.2 Nur Analytics akzeptiert

- genau ein `gtag/js?id=G-...`-Request;
- GA4 Realtime zeigt den Testbesuch;
- kein AdSense-Loader;
- `analytics_storage=granted`;
- alle Ad-Signale bleiben `denied`.

### 5.3 Marketing akzeptiert

- AdSense-Loader wird genau einmal geladen;
- `ad_storage`, `ad_user_data`, `ad_personalization` sind `granted`;
- keine doppelte Script-Injektion nach erneutem Speichern der Einstellungen.

### 5.4 Widerruf

1. Datenschutzseite öffnen;
2. `Cookie-Einstellungen ändern` wählen;
3. Analytics/Marketing widerrufen;
4. nach Reload prüfen, dass keine Google-Tags mehr im neuen Dokument geladen werden;
5. `_ga`-/`_ga_*`-Cookies prüfen.

---

## 6. Repository-Gates

```text
npx tsx scripts/security/verifyGoogleMarketingInvariants.ts
npx vitest run tests/unit/securityResponse.test.ts tests/unit/googleMarketingConsent.test.ts
npm run lint
npm run build
NODE_ENV=production CSP_MODE=report-only npx vitest run tests/unit/securityResponse.production.test.ts
```

Der Protected Marketing Workflow führt diese Prüfungen bei relevanten Änderungen aus.

---

## 7. Webscan-Nachprüfung

Nach Merge und produktivem Deploy:

1. Cloudflare-/Browser-Cache leeren, falls erforderlich;
2. Scan ohne vorhandene CookieHub-Einwilligung starten;
3. Findings `Kein Cookie-Consent-Tool` und `Google Analytics ohne Consent-Gate` erneut prüfen;
4. Browser-Network-Evidence zusätzlich dokumentieren;
5. falls der Scanner trotz nachgewiesener Netzwerksperre nur Quelltext-Heuristiken nutzt, den
   Befund als Scanner-False-Positive dokumentieren — nicht die Implementierung verschleiern.

Ein Score von 100 ist ein Sekundärziel. Primär gilt das reale Netzwerk- und Consent-Verhalten.

---

## 8. Troubleshooting

### CookieHub-Banner erscheint nicht

- Domain-Code und Produktionsdomain im CookieHub-Dashboard prüfen;
- Browser-Konsole auf CSP-/Hostname-Fehler prüfen;
- `window.cookiehub.isReady()` prüfen;
- sicherstellen, dass CookieHub nur einmal geladen wird;
- Cloudflare-/Browser-Cache leeren.

### GA4 lädt trotz Opt-in nicht

- `VITE_GA_MEASUREMENT_ID` wurde beim Build gesetzt;
- ID entspricht `G-[A-Z0-9]+`;
- CookieHub-Kategorie heißt exakt `analytics`;
- `cookiehub_onStatusChange` wird auf `document` ausgelöst;
- CSP blockiert `www.googletagmanager.com` nicht.

### Google-Request vor Opt-in

- nach weiteren GA/GTM/AdSense-Snippets im Repository suchen;
- Browser-Erweiterungen ausschließen;
- CookieHub-/GTM-Doppelinstallation ausschließen;
- ausgeliefertes Produktions-HTML statt nur den Main-Branch prüfen;
- Deploy-Commit gegen `/healthz`/Deployment Identity abgleichen.

---

## 9. Offene externe Schritte

| Schritt | Verantwortlich | Status |
|---|---|---|
| CookieHub-Domain/Category Mapping prüfen | Repository-Owner | Production Handoff |
| Google-CMP-/TCF-Anforderungen für AdSense prüfen | Repository-Owner / Compliance | Production Handoff |
| Render Build mit gültiger Measurement-ID | Repository-Owner | Nach Merge |
| Browser-Network-Evidence erstellen | Reviewer / Owner | Nach Deploy |
| Webscan wiederholen | Reviewer / Owner | Nach Deploy |
