# CookieConsent v3 Migration — FE-CONSENT-V3
Date: 2026-09-15
Status: IMPLEMENTED_ON_BRANCH / VALIDATION_PARTIAL / PRODUCTION_NOT_PROVEN

## Auftrag und Zuordnung
Owner-Anweisung: „Löse Cookiehub durch cookieconsent v3 ab“, anschließend „Variante A freigegeben“ (im Chat zweimal bestätigt).
Variante A: CookieHub ersetzen, GA4 nur nach Analytics-Opt-in, AdSense vollständig pausieren.
Target/Primary Owner: CAPITAL-AI-FE, docs/projects/frontend/, cross-cutting ohne produktive PVC.
Executor: CAPITAL-AI-OPS gemäß GOV_OPS_FOREIGN_PROJECT_EXECUTION_POLICY; keine Übertragung von FE-, SEC-, COMP- oder Produktionsautorität.
Roadmap: docs/projects/frontend/ROADMAP.md, FE-CONSENT-V3, Priorität 5/5.
Branch: agent/frontend-cookieconsent-v3-20260915.
Ursprünglicher Main: 103689c2f30536e573b7958f63b503ca428f69cf.
Synchronisationsbasis: 0b7ffb3bf06c1165a3b73f9d4d6e0933dee971f2. Der Commit dieses Dokuments identifiziert den Implementierungsstand.

## Änderung und Auswirkungen
- CookieHub-CDN und Initializer entfernt; unveränderte MIT-Distribution CookieConsent 3.1.0 lokal ausgeliefert.
- Upstream-Commit e6279509aab5b96be198297b0283b321ad76b0a9; SOURCE.json dokumentiert die geprüften Git-Blob-Hashes.
- Neue Cookie-Auswahl capital_ai_consent_v3, Revision 1, Secure, SameSite=Lax, Pfad /, 182 Tage. Alte CookieHub-Auswahl wird nicht importiert; Besucher entscheiden erneut.
- Notwendige Funktionen immer aktiv; Analytics standardmäßig aus. Einstellungen auf allen SPA-Routen wieder erreichbar.
- GA nur bei validConsent() === true und acceptedCategory('analytics') === true. Standardwerte vor SDK-Start denied; SDK-Fehler erlauben keine Google-Ladung.
- AdSense-Lader entfernt; alle Werbesignale dauerhaft denied, auch bei Alle akzeptieren. Publisher-Metadatum bleibt inert.
- Gespeicherter Widerruf deaktiviert GA, löscht erreichbare _ga-Cookies auf / und lädt nach vorheriger GA-Ausführung einmal neu. Checkbox-Änderung allein lädt nicht neu.
- Returning-Opt-in löscht keine vorhandenen GA-Cookies während des Starts.
- Nonce-Übernahme, Self-Hosting und bestehende CSP-Report-Only-Grenze erhalten. Alte Provider-Freigaben entfernt.
- Kompatibilitätsalias openCookieHubSettings bleibt für bestehende Consumer; es existiert keine zweite Consent-Quelle.
- Geschützte Pfade, CODEOWNERS und bestehende CI-Anbindung bleiben erhalten und erfassen die neuen Assets.
- Begrenzte Owner-Zusätze in ADR/ESS/Architektur dokumentieren nur den Providerwechsel und die Anzeigenpause; Aktivierung erst mit Human Merge und autorisierter Promotion.

## Mobile CSS-Readiness-Remediation 2026-09-16
Auslöser: reale Smartphone-Evidence meldete, dass die Cookie-Auswahl nicht zuverlässig bedienbar war und die Seite bei der Auswahl einfrieren konnte.

Branch: `agent/frontend-consent-style-readiness-20260916`.
Branch-Basis: `main@3d3f928d91e2cdd9a818bdfd6ae8d065db9f697f`.

Materialisierte technische Änderung:
- `index.html` kennzeichnet die vendorte CookieConsent-CSS und das CAPITAL-AI-Consent-Theme mit stabilen Readiness-IDs.
- `public/cookieconsent-init.js` startet `CookieConsent.run()` erst, wenn beide erforderlichen Stylesheets nachweislich mit einem `StyleSheet` assoziiert sind oder ihr `load`-Event erfolgreich eingetroffen ist.
- Fehlende oder fehlerhaft ladende Consent-Stylesheets führen fail-closed dazu, dass CookieConsent nicht gestartet wird; optionale Google-Dienste bleiben dadurch weiterhin deaktiviert.
- Das Readiness-Gate schließt den Race-Zustand zwischen erstem `sheet`-Check und Listener-Registrierung durch einen zweiten `sheet`-Check.
- `public/cookieconsent-theme.css` behält 44px Touch-Ziele bei und setzt für Consent-Buttons sowie den globalen Settings-Button `touch-action: manipulation`.
- `tests/unit/cookieConsentStyleReadiness.test.ts` deckt bereits-ready, verzögert geladen, fehlend und CSS-load-error ab und prüft die beiden Readiness-Marker im HTML.

Unverändert bleiben die geschützten Invarianten: Basic Consent Mode v2, Zero-Google-before-opt-in, GA4 ausschließlich nach gültigem Analytics-Opt-in, AdSense vollständig pausiert, Nonce/CSP-Grenzen und gespeicherter Widerruf.

Pre-PR-Ausführung der neuen Vitest-Suite: NOT RUN — in diesem Chat steht kein vollständiger Repository-Checkout mit installierten Dependencies zur Verfügung. Der Test ist für die reguläre Hosted-PR-Testausführung materialisiert; NOT RUN wird nicht als PASS gewertet.
Reale Mobile-Browser-Evidence nach dieser Remediation: NOT RUN / weiterhin erforderlich.

## Tatsächlich ausgeführte Prüfungen
Node v24.19.0, partielle dateibasierte Arbeitskopie; kein vollständiger installierter Repository-Checkout.
- node --test scripts/security/cookieConsentRuntime.test.mjs: PASS, 18 Tests, 0 Fehler.
- node scripts/security/verifyGoogleMarketingInvariants.ts: PASS, 34 Invarianten und gepinnte Vendor-Blobs.
- node scripts/security/verifyGoogleMarketingProtectedWiring.mjs --force: PASS.
Die Runtime-Prüfungen verwenden VM-/DOM-Mocks sowie die realen CSP-Policy-Funktionen. Sie sind kein Browser-/Produktionsnachweis.
Vitest-Einstieg führt dieselbe Suite mit Fehlerweitergabe aus; Vitest-Runner selbst NOT RUN.
Vollständiger Build, Typecheck, FE-Architekturcheck, komplette Unit-Suite, Production-Serverintegration und unabhängige Hosted Checks: NOT RUN. NPM-Registry-Zugriff lief in Timeout; keine Abhängigkeiten installiert.
Cloudbrowser: wiederholt CDP refresh tabs timeout nach 20000 ms. Keine erfolgreiche Live-Prüfung der neuen Implementierung.

## Korrelation
Seit ursprünglicher Basis 27 Commits auf main, 15 betroffene Dateien: Documentary-SLO, Social-Publication-Evidence, Security-Autofix sowie Agent-Client-/Security-Roadmaps. Kein Dateioverlap mit dieser Migration, keine Änderung an AGENTS oder anwendbaren Provider-/CSP-Authorities im Compare.
Aktuelle Open-PR-Abfrage: keine offenen PRs. Aktuelle Branch-Liste: frühere Frontend-Consent-Login- und Roadmap-Normalisierungsbranches nicht mehr vorhanden; frühere semantische Prüfung bleibt historische Evidence. Kompatibilitätsalias und begrenztes Roadmap-Append vermeiden Überschreiben ihrer früheren Änderungen.
Der zuvor angelegte Migrationsbranch war beim Refresh nicht mehr vorhanden (404). Er wurde vom aktuellen main neu angelegt. Keine fremden Änderungen überschrieben.
Keine Governance-/ADR-Nummern oder produktiven PVC-Namespaces neu vergeben.

Hinweis 2026-09-16: Diese historische Korrelation bleibt als damalige Evidence bestehen. Für die Mobile-Readiness-Remediation wurde separat gegen `main@3d3f928d91e2cdd9a818bdfd6ae8d065db9f697f` korreliert; zum Schreibzeitpunkt war PR #1001 als Governance-Writer offen, ohne File-/Runtime-Overlap zu den FE-Consent-Dateien. Vor PR-Erstellung ist current main erneut zu lesen und jede zwischenzeitliche Authority-/Writer-Änderung erneut zu korrelieren.

## Offene Exit Gates
1. Auf einer ausgelieferten HTTPS-Vorschau und anschließend nach autorisierter Promotion: Erstbesuch, Nur notwendige, Analytics an/aus, Speichern, Wiederöffnen, Reload-Persistenz, Widerruf, erneute Zustimmung sowie Login/Landing/Datenschutz prüfen. Browser-Cookie- und Netzwerk-Evidence muss Zero Google vor Opt-in, GA nur nach Zustimmung und Zero AdSense in allen Zuständen belegen. Aktuell NOT RUN.
2. COMP bewertet Nachweis-/Aufbewahrungsanforderungen: CookieConsent besitzt hier ausschließlich lokalen Consent-Speicher, keinen zentralen anonymen Consent-Log-Dienst. Bestehende Registrierungsnachweise bleiben separat. Keine Compliance- oder Google-CMP-/TCF-Zertifizierung behauptet. SEO/COMP-Providerinventare bei Aktivierung durch ihre Owner abgleichen; AdSense-Reaktivierung ist ein separates freizugebendes Arbeitspaket.

Kein Merge, kein Deployment und keine Änderung/Löschung des CookieHub-Kontos oder seiner historischen Nachweise in diesem Durchlauf. Merge-Readiness und Production Acceptance werden nicht behauptet.
