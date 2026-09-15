# CAPITAL-AI Runbook: CookieConsent v3 und Google Analytics

## Scope und Aktivierung

FE-CONSENT-V3, Owner-Variante A vom 2026-09-15: CookieHub wird durch selbst gehostetes CookieConsent 3.1.0 ersetzt; AdSense ist pausiert. Aktivierung erst nach Human Merge und autorisierter Production-Promotion. Dieser Stand beschreibt den Zielzustand des Migrationsbranches, nicht einen nachgewiesenen Production-Zustand.

Parent contracts: ESS-0014, ADR-0035/ADR-0040 und deren begrenzter Owner-Änderungszusatz; ADR-0042 dokumentiert die Basic-Mode-Implementierung. Kein Google-Netzwerkverkehr vor Opt-in, keine cookieless Advanced-Mode-Pings.

## Auslieferung und Konfiguration

- `public/vendor/cookieconsent/3.1.0/`: unveränderte JS-/CSS-Dateien und MIT-Lizenz aus Upstream-Commit `e6279509aab5b96be198297b0283b321ad76b0a9`; `SOURCE.json` und der bestehende Marketing-Guard prüfen die Identität.
- `public/cookieconsent-init.js`: alleinige Konfiguration und Initialisierung.
- `public/cookieconsent-theme.css`: konsumiert bestehende Web-Design-Tokens.
- `index.html`: lokale Consent-Bridge zuerst; SDK und Initializer danach als geordnete `defer`-Scripts mit CSP-Nonce. Vite kopiert `public/` in den Build. Kein zusätzlicher Runtime-CDN und kein externer CMP-Account erforderlich.
- `public/google-analytics-consent.js`: alleinige Google-Consent-Bridge. Die lokale Default-Queue erzeugt keine Netzwerkanfrage.

Die Zustimmung wird im Cookie `capital_ai_consent_v3`, Revision 1, für maximal 182 Tage gespeichert: Pfad `/`, host-only, Secure, SameSite=Lax. `necessary` ist erforderlich, `analytics` optional und standardmäßig aus. CookieHub-Zustimmungen werden nicht importiert. Abgelaufene oder ungültige Zustimmung autorisiert keine Messung. Die Anwendung hat keine aktive Werbekategorie.

GA4 verwendet weiterhin `VITE_GA_MEASUREMENT_ID` als öffentliche Build-Time-ID über das Meta-Tag `ga-measurement-id`. Ein leerer, ungültiger oder nicht aufgelöster Wert lädt kein GA. Vor Deployment muss der korrekte Build-Time-Wert unabhängig geprüft werden; Repository-Konfiguration beweist keinen Live-Providerstatus. Die AdSense-Publisher-ID bleibt als inerte Metadaten für Traceability erhalten und erzeugt keinen Request.

## Schnittstellen und Lifecycle

- `CookieConsent.validConsent()` und `acceptedCategory('analytics')` müssen beide strikt `true` liefern.
- `cc:onConsent` auf `window`: erste Entscheidung und Wiederkehr mit gespeicherter Entscheidung.
- `cc:onChange` auf `window`: gespeicherte Änderung; nach einem tatsächlichen Analytics-Widerruf deaktiviert die Bridge GA, bereinigt erreichbare `_ga`/`_ga_*`-Cookies und startet den Dokumentkontext einmal neu.
- `capital-ai:consent-ready`: internes Bereitschaftssignal nach erfolgreichem `run()`, damit auch ein erster Besuch ohne Zustimmung alte GA-Cookies bereinigt. Das Event enthält keinen autorisierenden Consent-Payload; die Bridge liest stets das SDK.
- Checkbox-Bearbeitung und Schließen des Dialogs lösen keinen Widerrufs-Reload aus.
- Wiederkehrende gültige Analytics-Einwilligung bewahrt vorhandene GA-Cookies; jeder Loader ist idempotent und trägt den Response-Nonce.
- `openCookieConsentSettings()` öffnet den Vendor-Dialog; `openCookieHubSettings` bleibt nur als Alias für bestehende und parallele Consumer erhalten.
- Der zusätzliche Button „Cookie-Einstellungen“ wird außerhalb des React-Roots auf jeder Route angeboten.

Alle Werbesignale (`ad_storage`, `ad_user_data`, `ad_personalization`) bleiben auch nach „Alle akzeptieren“ `denied`. Es gibt keinen aktiven AdSense-Loader. Eine Wiederaktivierung benötigt einen neuen geschützten Änderungsscope und providerbestätigte CMP-/TCF-Eignung.

## Nachweisgrenzen und Compliance-Handoff

Die lokale Browserentscheidung ist keine zentrale, serverseitig unveränderliche Consent-Historie. CookieConsent enthält keinen eigenen Consent-Logging-Server. Dieser Slice erfindet keinen anonymen Logging-Endpunkt und verbindet die Browserentscheidung nicht still mit authentifizierten Registrierungs-/AGB-Nachweisen. COMP muss die Nachweisstrategie bewerten; eine gegebenenfalls erforderliche Speicherung ist separat über vorhandene Privacy-/Audit-Verträge zu spezifizieren.

Der alte CookieHub-Account und dortige historische Nachweise werden nicht gelöscht. Es wird keine Übernahme, Vollständigkeit oder Legal-/Google-Zertifizierung behauptet. Aktuelle CookieHub-Bezüge in älteren SEO-/COMP-Inventuren benötigen nach dem Cutover Owner-Returns; historische Evidence bleibt unverändert.

## Validierung

Lokale ausführbare Checks:

```sh
node --test scripts/security/cookieConsentRuntime.test.mjs
node scripts/security/verifyGoogleMarketingInvariants.ts
node scripts/security/verifyGoogleMarketingProtectedWiring.mjs --force
```

Der bestehende Vitest-Einstieg `tests/unit/googleMarketingConsent.test.ts` führt dieselbe reale Node-Verhaltenssuite aus; Fehler propagieren. Bestehende CI-/Build-/Predeploy-Gates bleiben eingebunden.

Noch erforderlich auf vollständigem Checkout mit Repository-Abhängigkeiten:

```sh
npm run lint
npx vitest run tests/unit/googleMarketingConsent.test.ts tests/unit/securityResponse.test.ts tests/unit/googleMarketingGuardConsolidation.test.ts
npm run frontend:architecture:check
npm run build
NODE_ENV=production CSP_MODE=report-only npx vitest run tests/unit/securityResponse.production.test.ts
```

Browser-Gate gegen die exakte ausgelieferte Version:

1. Frischer Zustand: Banner sichtbar, kein Google-Tag/Request; Ablehnen und Akzeptieren gleich erreichbar.
2. Analytics erlauben: ein GA4-Loader, keine AdSense-Anfrage, Werbesignale denied.
3. Wiederöffnen und Reload: gespeicherte Auswahl erhalten; keine doppelte GA-Initialisierung.
4. Analytics abwählen und speichern: Entscheidung persistiert vor einmaligem Reload, GA-Cookies soweit erreichbar entfernt; Neustart ohne Google-Requests.
5. Mobile `/login`, Landing und `/datenschutz`: Touch, Fokus, Overlay, Scroll und erneuter Dialogaufruf funktionieren. Anmeldedaten und Session-Cookies werden nicht gelöscht.

VM-Verhaltenstests sind keine Browser-/Netzwerk-/Production-Evidence. Bei SDK-/CSP-Fehlern bleiben optionale Dienste geschlossen; nicht durch eine schwächere CSP oder Vorab-Tracking reparieren.

## Rollback

Rollback bleibt ein geschützter, separat freizugebender Wechsel auf einem frischen Branch von then-current main. Kein automatischer CookieHub-Fallback und keine automatische AdSense-Reaktivierung. Vorherige Versionsdateien und Consent-Historie dürfen nicht als aktuelle Zustimmung umgedeutet werden.

## Quellen

- https://cookieconsent.orestbida.com/essential/getting-started.html
- https://cookieconsent.orestbida.com/advanced/callbacks-events.html
- https://cookieconsent.orestbida.com/advanced/consent-logging.html
- https://support.google.com/adsense/answer/13554116
