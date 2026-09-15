# Architectural Decision Record (ADR-0042)

## Owner-Änderung 2026-09-15 — FE-CONSENT-V3 / Variante A

**Freigabe:** „Variante A freigegeben“ im zugehörigen Owner-Chat. **Aktivierung:** erst nach Human Merge und separat autorisierter Production-Promotion; Branch-Evidence ist keine Production Acceptance.

Dieser begrenzte Änderungszusatz ersetzt mit Aktivierung ausschließlich die unten beschriebenen CookieHub-Providerbindungen und die AdSense-Ladefreigabe: Selbst gehostetes CookieConsent v3.1.0 wird Consent Source of Truth; Google Analytics bleibt im Basic Mode hinter einem gültigen Analytics-Opt-in. AdSense bleibt vollständig pausiert und alle Werbesignale bleiben `denied`, auch nach „Alle akzeptieren“. Historische CookieHub-Zustimmungen werden nicht übernommen.

Die bisher genannten CookieHub-SDK-/Initializer-/CSP-/Event-Invarianten sind danach historische Providerbindungen. An ihre Stelle treten gepinnte lokale SDK/CSS/License-Dateien, `public/cookieconsent-init.js`, `CookieConsent.validConsent()` plus `acceptedCategory('analytics')` und die auf `window` registrierten Events `cc:onConsent` / `cc:onChange`. Der gespeicherte Widerruf deaktiviert GA, löscht erreichbare GA-Cookies und lädt nach vorheriger GA-Ausführung einmal neu. Die alleinige First-Party-Bridge bleibt `public/google-analytics-consent.js`.

Keine globale Supersession: Zero Google network before opt-in, Basic Consent Mode v2, CSP-Nonce/Report-Only-Grenze, geschützte Pfade/Schutzprüfungen, IAM, Human-/CODEOWNER-Review, Produktionsfreigaben und unabhängige SEC/COMP-Assurance gelten weiter. Neue Consent-Assets werden zusätzlich geschützt. Alte Audit-Evidence wird nicht umgeschrieben. Ein zentraler anonymer Consent-Log-Dienst wird nicht behauptet; Bewertung des lokalen Nachweises bleibt ein COMP-Handoff. AMP-/SEO-Verhalten wird durch diesen Zusatz nicht erweitert.

Umsetzung und Nachweis: `docs/runbooks/GOOGLE_ANALYTICS_SETUP.md` und `docs/projects/frontend/evidence/COOKIECONSENT_V3_MIGRATION_2026-09-15.md`.

---

## Basic Consent Mode v2 and consent-gated Google tag delivery

**Status:** PROPOSED  
**Implementation-Status:** 🟡 PR VALIDATION  
**Date:** 2026-08-04  
**Version:** 0.6.0  
**Related ESS:** ESS-0014 / ESS-0014-CONTRACTS  
**Related ADR:** ADR-0035, ADR-0040  
**Trigger:** WebscanRadar Security Audit `capital-ai.online`, 2026-08-04

---

## 1. Kontext

Der externe Webscan meldet zwei miteinander verbundene High-Findings:

1. kein erkanntes Cookie-Consent-Tool trotz aktiver Tracking-Skripte;
2. Google Analytics ohne Consent-Gate.

Die Repository-Prüfung zeigt zusätzlich zwei technische Driftpunkte:

- der normale AdSense-Loader wird in `index.html` unmittelbar und damit unabhängig von der
  CookieHub-Kategorie `marketing` geladen;
- `public/google-analytics-consent.js` registriert CookieHub-Custom-Events auf `window`, während
  die dokumentierte CookieHub-JavaScript-API diese Events auf `document` emittiert.

Damit ist die beabsichtigte Invariante aus ESS-0014 nicht hinreichend technisch abgesichert. Die
Dokumentation in `docs/runbooks/GOOGLE_ANALYTICS_SETUP.md` widerspricht außerdem der bereits
akzeptierten ESS-0014-Vorgabe, nach der **Basic Consent Mode v2** der CAPITAL-AI-Standard ist.

---

## 2. Entscheidung

### 2.1 Consent Source of Truth

CookieHub bleibt die einzige fachliche Quelle für die Kategorien:

- `necessary`;
- `analytics`;
- `marketing`;
- optional `preferences`.

Der Repository-Code ersetzt CookieHub nicht. Er bildet dessen Entscheidung deterministisch auf die
Google-Runtime ab.

### 2.2 Basic Consent Mode v2

Vor jeder möglichen Google-Tag-Ausführung werden lokal, ohne Netzwerkanfrage, folgende Defaults in
`dataLayer` gesetzt:

```text
analytics_storage   = denied
ad_storage          = denied
ad_user_data        = denied
ad_personalization  = denied
functionality_storage = denied
personalization_storage = denied
security_storage    = granted
```

**Zero Google network before opt-in** ist die verbindliche Privacy-Invariante. CAPITAL-AI verwendet
Basic Consent Mode v2: Google-Tags werden nicht vor Zustimmung geladen; es werden auch keine
cookieless measurement pings als Advanced-Mode-Ersatz zugelassen.

### 2.3 Tag Delivery

`index.html` darf keine ausführbaren GA4- oder AdSense-Third-Party-Loader mehr enthalten.
Öffentliche IDs werden ausschließlich als inert metadata bereitgestellt:

- `ga-measurement-id`;
- `adsense-publisher-id`.

Der First-Party-Bridge `public/google-analytics-consent.js` lädt anschließend:

- GA4 nur bei `cookiehub.hasConsented('analytics') === true`;
- AdSense nur bei `cookiehub.hasConsented('marketing') === true`.

Jeder Loader ist idempotent und trägt `data-consent-managed="true"`.

### 2.4 Event Contract

CookieHub-Ereignisse werden gemäß Provider-API auf `document` beobachtet:

```text
cookiehub_onInitialise
cookiehub_onStatusChange
cookiehub_onAllow
cookiehub_onRevoke
```

Zusätzlich erfolgt nach `DOMContentLoaded` eine fail-closed Readiness-Prüfung. Ist CookieHub nicht
verfügbar oder die Consent-Abfrage fehlerhaft, werden keine Google-Tags geladen.

### 2.5 Widerruf

Bei Widerruf von `analytics`:

- wird `ga-disable-<MEASUREMENT_ID>` gesetzt;
- werden erreichbare First-Party-`_ga`-/`_ga_*`-Cookies gelöscht;
- werden Consent-Mode-Signale auf `denied` aktualisiert.

Da bereits ausgeführte Third-Party-Skripte nicht zuverlässig aus einem laufenden Dokument entfernt
werden können, wird nach einem persistierten Widerruf einmalig neu geladen. Der neue Dokumentkontext
startet wieder mit denied Defaults und ohne Google-Netzwerkzugriff.

### 2.6 Keine konkurrierende Consent-Implementierung

Während der First-Party-Bridge aktiv ist, darf weder ein zusätzlicher GTM-Consent-Tag noch eine
zweite manuelle Consent-Mode-Implementierung dieselben Signale verwalten. Eine CookieHub-Dashboard-
Option darf nur aktiviert werden, wenn sie nachweislich keine doppelte oder widersprüchliche
Runtime erzeugt. Ein Wechsel auf die vollständig providerverwaltete CookieHub-Integration ist eine
spätere geschützte Architekturänderung.

### 2.7 Protected Change

Die Änderung betrifft geschützte Google-Marketing-Invarianten aus ESS-0014 und ADR-0035.
Merge/Production-Handoff benötigen daher Human-/CODEOWNER-Review sowie die dort definierten
Approval- und Evidence-Gates. Dieser PR führt keine externe Google-, CookieHub- oder Render-Mutation
aus.

---

## 3. Begründung

### Warum Basic statt Advanced Consent Mode?

Basic Mode erfüllt die strengere CAPITAL-AI-Invariante, dass vor Opt-in keine Google-Verbindung
entsteht. Advanced Mode kann bei denied Consent cookieless pings senden und würde deshalb eine neue
Datenschutz- und Rechtsbewertung erfordern.

### Warum sowohl GA4 als auch AdSense gaten?

Ein Analytics-Gate allein beseitigt das Webscan-Problem nicht, solange der AdSense-Loader bereits im
HTML ausgeführt wird. Beide Google-Produkte müssen an getrennte, zweckbezogene Kategorien gebunden
sein.

### Warum `document` statt `window`?

CookieHub dokumentiert die Custom Events ab Version 2.8.13 als `document.addEventListener(...)`-
Events. Die bisherige `window`-Registrierung ist daher kein belastbarer Provider-Contract.

### Warum Reload nach Widerruf?

Consent-Signale stoppen zukünftige erlaubte Verarbeitung, können aber bereits geladenen JavaScript-
Code und bestehende Auto-Ad-Runtime nicht vollständig aus dem DOM/Execution Context entfernen. Ein
Reload stellt den fail-closed Initialzustand technisch wieder her.

---

## 4. Konsequenzen

### Positive Konsequenzen

- keine unbedingten Google-Third-Party-Skripte im HTML;
- vollständige Consent-Mode-v2-Signale für Analytics und Advertising;
- getrennte Zweckbindung von Analytics und Marketing;
- robuster Initialstatus für wiederkehrende Besucher;
- technisch einfacher Widerruf über den vorhandenen CookieHub-Settings-Link;
- statische Invarianten und verhaltensbasierte Tests verhindern Regressionen;
- bessere Nachweisbarkeit gegenüber Security-/DSGVO-Scannern.

### Trade-offs

- GA4 und AdSense messen ohne Opt-in nichts;
- ein Widerruf löst einen Seitenreload aus;
- CookieHub bleibt eine externe Laufzeitabhängigkeit;
- Dashboard-/Domain-/Kategorie-Konfiguration kann nicht allein durch Repository-Code validiert
  werden;
- AdSense in EWR/UK/CH kann zusätzliche Google-CMP-/IAB-TCF-Anforderungen haben, die im externen
  Production Handoff geprüft werden müssen.

---

## 5. Externer Production Handoff

Folgende Schritte sind außerhalb des Entwicklungs-Repositorys durch den Repository-Owner zu prüfen:

1. CookieHub-Domain-Code `75f66920` gehört zur verifizierten Produktionsdomain
   `capital-ai.online`;
2. Kategorien `analytics` und `marketing` existieren exakt unter diesen IDs;
3. GA4 ist `analytics`, AdSense ist `marketing` zugeordnet;
4. Ablehnen ist ebenso leicht erreichbar wie Akzeptieren;
5. Consent-Protokollierung ist aktiv;
6. es existiert keine zweite GTM-/CookieHub-/Google-Consent-Mode-Implementierung;
7. für AdSense werden die aktuellen Google-CMP-/TCF-Anforderungen geprüft;
8. nach Merge wird ein neuer Render-Build ausgelöst, da die Vite-Measurement-ID build-time ist.

---

## 6. Verifikation / Definition of Done

### Ohne Einwilligung

- CookieHub-Banner oder Preference Center ist sichtbar/erreichbar;
- kein Request an `googletagmanager.com`, `google-analytics.com`,
  `googlesyndication.com` oder `doubleclick.net`;
- keine `_ga`-/`_ga_*`-Cookies;
- Consent Mode zeigt alle Analytics-/Ad-Felder `denied`.

### Analytics akzeptiert, Marketing abgelehnt

- GA4-Loader wird genau einmal geladen;
- AdSense-Loader wird nicht geladen;
- `analytics_storage=granted`;
- alle Ad-Signale bleiben `denied`.

### Marketing akzeptiert

- AdSense-Loader wird genau einmal geladen;
- `ad_storage`, `ad_user_data`, `ad_personalization` sind `granted`;
- Verhalten entspricht der im CookieHub-Banner beschriebenen Zweckbindung.

### Widerruf

- Consent-Signale werden auf `denied` gesetzt;
- GA wird deaktiviert und erreichbare GA-Cookies werden gelöscht;
- der Seitenreload stellt einen Google-tag-freien Dokumentstart her.

### Repository Gates

```text
npx tsx scripts/security/verifyGoogleMarketingInvariants.ts
npx vitest run tests/unit/securityResponse.test.ts tests/unit/googleMarketingConsent.test.ts
npm run lint
npm run build
NODE_ENV=production CSP_MODE=report-only npx vitest run tests/unit/securityResponse.production.test.ts
```

Anschließend ist der Webscan mit leerem Browser-/Consent-Zustand zu wiederholen. Ein Scanner-Score
allein ersetzt nicht die Browser-Netzwerk-Evidence.

---

## 7. Rollback

Ein Rollback, der GA4 oder AdSense wieder unconditionally lädt, Consent Mode v2 entfernt oder
CookieHub-Events erneut falsch bindet, ist nach ESS-0014 / ADR-0035 ein protected change.

Zulässig ist ausschließlich:

1. Impact Disclosure;
2. explizite Human-OWNER-Bestätigung;
3. frischer Step-up bzw. gültiges Approval Artifact;
4. Dry-run Diff;
5. Post-change Browser-/Network-Evidence.

---

## 8. Provider References

- Google: `https://developers.google.com/tag-platform/security/guides/consent`
- Google Analytics: `https://support.google.com/analytics/answer/14275483`
- CookieHub Consent Mode v2: `https://docs.cookiehub.com/compliance/frameworks/google-consent-mode-v2`
- CookieHub JavaScript API: `https://docs.cookiehub.com/advanced/javascript-api`
- CookieHub Installation: `https://docs.cookiehub.com/installation/tag`
- TDDDG § 25: `https://www.gesetze-im-internet.de/ttdsg/__25.html`
- DSGVO Art. 7: `https://eur-lex.europa.eu/eli/reg/2016/679/oj`

