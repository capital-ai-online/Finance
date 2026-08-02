# CAPITAL-AI Runbook: Google Analytics (GA4) Einbindung

## Document ID

RUNBOOK-0003

## Bezug

`docs/DATENSCHUTZ_PROTOKOLL.md` (Verzeichnis von Verarbeitungstätigkeiten, Art. 30 DSGVO),
`docs/seo/SEO_CHECKLIST.md`.

## Status

Aktiv — Schritt 1 (Property/Measurement-ID) wurde vom Repository-Owner extern im Google-Konto
durchgeführt. Die Code-Integration (Abschnitt 3) und der Cookie-Consent-Banner (Abschnitt 4) sind
implementiert (`src/services/googleAnalytics.ts`, `src/services/cookieConsent.ts`,
`src/components/CookieConsentBanner.tsx`). Tracking bleibt weiterhin fail-closed: ohne gesetzte
`VITE_GA_MEASUREMENT_ID` **und** ohne aktive Nutzer-Einwilligung lädt kein Tracking-Script.

## Geltungsbereich

CAPITAL-AI ist eine Vite/React-SPA (`index.html` → `src/main.tsx`), deployt über Render
(`render.yaml`). Client-seitige Env-Vars mit `VITE_`-Prefix werden **zur Build-Zeit** eingebacken
(siehe Kommentar in `.env.example`), nicht dynamisch zur Laufzeit injiziert.

**Wichtiger Compliance-Hinweis:** `docs/DATENSCHUTZ_PROTOKOLL.md` (Präambel) verpflichtet das
Projekt explizit auf „keine unautorisierten IP-Adressen-Lecks an US-amerikanische Drittanbieter".
Google Analytics überträgt Nutzungsdaten an Google LLC (USA). Das ist nicht per se unzulässig,
macht GA aber **einwilligungspflichtig** nach § 25 TDDDG / Art. 6 Abs. 1 lit. a DSGVO — das Script
darf technisch **erst nach aktiver Opt-in-Einwilligung** geladen werden (kein Opt-out-Cookie-Banner,
kein Laden „im Hintergrund" vor Einwilligung). Abschnitt 4 dieses Runbooks ist deshalb kein
optionaler Zusatz, sondern Voraussetzung für eine rechtskonforme Einbindung.

---

## 1. GA4-Property anlegen & Measurement-ID beschaffen

Dieser Schritt erfordert Login mit einem echten Google-Konto und kann nur vom Repository-Owner
durchgeführt werden.

1. [analytics.google.com](https://analytics.google.com) öffnen → mit dem Google-Konto anmelden,
   das die Property verwalten soll.
2. **Verwaltung** (Zahnrad unten links) → Spalte **Konto** → **Konto erstellen** (falls noch kein
   GA-Konto existiert), z. B. „AIFinancial GmbH" als Kontoname.
   - Bei den Daten­freigabe-Einstellungen die Optionen für Benchmarking/Support/Produktentwicklung
     bewusst prüfen und ggf. deaktivieren, um die Datenweitergabe an Google zu minimieren
     (Datenminimierung, Art. 5 Abs. 1 lit. c DSGVO).
3. Spalte **Property** → **Property erstellen**:
   - Property-Name: z. B. „CAPITAL-AI Portal".
   - Zeitzone: `Deutschland` / Berlin, Währung: `EUR`.
4. **Property → Datenstreams → Web** → neuen Webstream anlegen:
   - Website-URL: `https://capital-ai.online`
   - Stream-Name: „CAPITAL-AI Production"
   - **Erweiterte Messung** (Enhanced Measurement) prüfen: Scroll-Tracking, Outbound-Klicks etc.
     sind standardmäßig aktiv — ggf. deaktivieren, was nicht benötigt wird, um die erfassten
     Datenkategorien schlank zu halten.
5. Nach dem Anlegen zeigt GA4 die **Measurement-ID** im Format `G-XXXXXXXXXX` direkt im
   Stream-Detail an. Diese ID kopieren — sie ist **nicht geheim** (sie steht später öffentlich im
   HTML-Quelltext), muss also nicht wie ein Secret behandelt werden, sollte aber dennoch nicht
   versehentlich mit einer falschen/fremden Property verwechselt werden.
6. **Datenaufbewahrung einschränken** (empfohlen für DSGVO-Minimierung): **Verwaltung → Property →
   Datenaufbewahrung** → Ereignisdaten-Aufbewahrung auf **2 Monate** setzen (kürzeste von Google
   angebotene Option) statt der Voreinstellung von 14 Monaten.
7. **IP-Anonymisierung**: In GA4 ist die IP-Maskierung anders als in Universal Analytics
   standardmäßig Teil der Verarbeitung und nicht separat konfigurierbar — GA4 speichert generell
   keine vollständige IP-Adresse. Das sollte dennoch als Fakt in `DATENSCHUTZ_PROTOKOLL.md`
   dokumentiert werden (siehe Abschnitt 4).

Ergebnis dieses Schritts: eine Measurement-ID der Form `G-XXXXXXXXXX`.

---

## 2. Measurement-ID in die Umgebung eintragen

Analog zu den bestehenden `VITE_*`-Vars (siehe `.env.example`, z. B. `VITE_SUPABASE_URL`):

1. Lokal: in `.env` (nicht `.env.example`, die Datei ist nur eine Vorlage) eintragen:
   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
2. Produktion (Render): **Dashboard → Service → Environment** → Env-Var
   `VITE_GA_MEASUREMENT_ID` mit dem Wert aus Schritt 1 anlegen. Da `VITE_*`-Vars zur Build-Zeit
   eingebacken werden, ist nach dem Setzen ein **Re-Deploy** nötig, damit die ID im Bundle landet.
3. Ergänze in `.env.example` (nur als dokumentierender Platzhalter, kein echter Wert):
   ```
   # Google Analytics 4 Measurement-ID (siehe docs/runbooks/GOOGLE_ANALYTICS_SETUP.md).
   # Öffentlich sichtbar im HTML-Quelltext, kein Secret. Ohne diesen Wert bleibt GA4 deaktiviert
   # (fail-closed) — es gibt keinen funktionierenden Tracking-Fallback ohne echte ID.
   VITE_GA_MEASUREMENT_ID=
   ```

---

## 3. Code-Integration (nur nach Einwilligung laden) — implementiert

Das GA-Script wird **nicht** fest in `index.html` eingetragen, sondern bedingt aus React heraus
geladen, damit es niemals vor einer aktiven Einwilligung ausgeliefert wird:

- `src/services/googleAnalytics.ts`: `loadGoogleAnalytics()` injiziert `gtag.js` erst bei Aufruf
  (`anonymize_ip: true`); `unloadGoogleAnalytics()` setzt das von Google dokumentierte
  `ga-disable-<ID>`-Flag, falls der Nutzer ablehnt oder widerruft.
- `src/services/cookieConsent.ts`: persistiert die Entscheidung (`localStorage`-Key
  `capital_ai_cookie_consent`) und stellt ein Event bereit, über das die Einwilligung an anderer
  Stelle erneut angezeigt werden kann (`reopenCookieBanner()`).
- `src/components/CookieConsentBanner.tsx`: zeigt das Banner nur, solange keine Entscheidung
  gespeichert ist; ruft `loadGoogleAnalytics()`/`unloadGoogleAnalytics()` je nach Klick auf.
- In `src/App.tsx` wird `<CookieConsentBanner />` auf allen reell besuchten Ansichten gerendert
  (Dashboard/Landing, `/datenschutz`, `/impressum`, `/agb`).

---

## 4. Cookie-Consent-Banner — implementiert

Der Banner erfüllt die zuvor hier benannten Anforderungen:

- Zeigt sich nur, wenn noch keine Entscheidung in `localStorage` vorliegt — kein vorangehakter
  Haken, kein implizites „Weiter-Nutzen-gilt-als-Zustimmung".
- Persistiert die Entscheidung, damit sie nicht bei jedem Seitenaufruf erneut abgefragt wird.
- Bietet über den Button „Cookie-Einstellungen ändern" in `Datenschutz.tsx` (Abschnitt „Cookies &
  Google Analytics") einen jederzeit erreichbaren Widerrufsweg.
- `docs/DATENSCHUTZ_PROTOKOLL.md` (Abschnitt 2 und 3.3) sowie die Datenschutzerklärung
  (`/datenschutz/`-Route, Klausel 5 und Datenquellen-Tabelle) wurden entsprechend aktualisiert.

---

## 5. Verifikation

1. Nach Deploy mit gesetzter `VITE_GA_MEASUREMENT_ID`: GA4 → **Berichte → Echtzeit** öffnen.
2. Seite im Browser aufrufen, Cookie-Banner akzeptieren → innerhalb weniger Sekunden sollte ein
   aktiver Nutzer im Echtzeit-Bericht erscheinen.
3. Ohne Einwilligung darf **kein** Request an `googletagmanager.com` oder `google-analytics.com`
   im Netzwerk-Tab der Browser-DevTools auftauchen — das ist der funktionale Nachweis, dass das
   Opt-in tatsächlich greift.

---

## Zusammenfassung der offenen Schritte

| Schritt | Wer | Status |
|---|---|---|
| 1. GA4-Property + Measurement-ID | Repository-Owner (Google-Konto) | Erledigt |
| 2. `VITE_GA_MEASUREMENT_ID` in `.env`/Render setzen | Repository-Owner | Lokal gesetzt — **Render-Env-Var für Produktion noch zu setzen** |
| 3. `googleAnalytics.ts` Service | Entwicklung | Erledigt |
| 4. Cookie-Consent-Banner | Entwicklung | Erledigt |
| 5. Datenschutzerklärung/Protokoll aktualisieren | Entwicklung/Recht | Erledigt |
