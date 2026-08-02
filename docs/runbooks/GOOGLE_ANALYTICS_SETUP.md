# CAPITAL-AI Runbook: Google Analytics (GA4) Einbindung

## Document ID

RUNBOOK-0003

## Bezug

`docs/DATENSCHUTZ_PROTOKOLL.md` (Verzeichnis von Verarbeitungstätigkeiten, Art. 30 DSGVO),
`docs/seo/SEO_CHECKLIST.md`.

## Status

Aktiv — Schritt 1 (Property/Measurement-ID) wurde vom Repository-Owner extern im Google-Konto
durchgeführt. Die Consent-Verwaltung erfolgt über **CookieHub** (externe CMP, siehe Abschnitt 4)
statt über eine selbstgebaute Banner-Komponente. Die Code-Integration (Abschnitt 3) ist als
Plain-JS-Inline-Script in `index.html` implementiert (bewusst nicht im React-Bundle, siehe
Begründung dort). `src/services/cookieHubConsentBridge.ts` enthält nur noch die Settings-Öffnen-
Funktion. Tracking bleibt fail-closed: ohne gesetzte `VITE_GA_MEASUREMENT_ID` **und** ohne aktive
CookieHub-Einwilligung in der Kategorie `analytics` lädt kein Tracking-Script.

**Bewusst NICHT genutzt:** Google Analytics' eigener „Einwilligungsmodus" (Consent Mode v2,
GA4-Verwaltung → Datenerfassung), der den GA-Tag *immer* mit Status „denied" lädt und dabei bereits
vor Einwilligung anonymisierte „Cookieless Pings" an Google sendet. Das ist ein gültiges, von Google
empfohlenes Muster, widerspricht aber der hier gewählten, strikteren Variante (Skript wird technisch
gar nicht in den DOM injiziert, solange keine Einwilligung vorliegt) und ist für reines GA4-Tracking
ohne verknüpfte Google-Ads-Conversions nicht erforderlich.

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

Das GA-Script wird **nicht** unconditioniert in `index.html` eingetragen, sondern über ein
Plain-JavaScript-Inline-Script direkt im `<head>` geladen, das an CookieHubs Events hängt:

- **Bewusst kein React/`useEffect`-Code für das Laden von GA**: Ein `useEffect` haengt seine
  Listener erst an, nachdem React den ersten Render committed hat — das ist potenziell **später**
  als der Zeitpunkt, an dem CookieHub bei `DOMContentLoaded` seinen initialen Status feuert
  (`cookiehub_onInitialise`). Für wiederkehrende Besucher mit bereits gespeicherter Einwilligung
  hätte das dazu geführt, dass dieses erste Event verpasst wird und GA nie lädt, obwohl der Nutzer
  längst zugestimmt hat. Die Lade-Logik lebt deshalb als reines Inline-Script in `index.html`,
  registriert **vor** dem CookieHub-`load()`-Aufruf.
- Das Script definiert `loadGA()` (injiziert `gtag.js` erst bei Aufruf, `anonymize_ip: true`) und
  `unloadGA()` (setzt das von Google dokumentierte `ga-disable-<ID>`-Flag), und hört auf
  `cookiehub_onInitialise`/`cookiehub_onStatusChange`, um `window.cookiehub.hasConsented('analytics')`
  zu prüfen.
- Die Measurement-ID kommt über Vites **HTML-Env-Replacement** (`%VITE_GA_MEASUREMENT_ID%` in
  `index.html`, ersetzt zur Build-Zeit) — ohne gesetzten Wert bleibt GA inaktiv (fail-closed).
- `src/services/cookieHubConsentBridge.ts` enthält nur noch `openCookieHubSettings()` (ruft
  `window.cookiehub.openSettings()` auf), genutzt vom Button „Cookie-Einstellungen ändern" in
  `Datenschutz.tsx`.

---

## 4. CookieHub als Consent-Management-Plattform — implementiert

Statt einer selbstgebauten Banner-Komponente wird **CookieHub** eingebunden
(`index.html`, unmittelbar nach dem öffnenden `<head>`-Tag, damit es so früh wie möglich lädt und
alle nachfolgenden Skripte potenziell blockieren/gaten kann):

```html
<script src="https://cdn.cookiehub.eu/c2/75f66920.js"></script>
<script type="text/javascript">
  document.addEventListener("DOMContentLoaded", function(event) {
    var cpm = {};
    window.cookiehub.load(cpm);
  });
</script>
```

Die eigentliche Konfiguration (Banner-Text, Sprache, Kategorien, Cookie-Deklarationen) erfolgt im
**CookieHub-Dashboard** (nicht im Code) unter der zur Snippet-ID `75f66920` gehörenden Property:

- **Domain-Verifizierung**: `capital-ai.online` als verifizierte Domain hinterlegen.
- **Kategorien**: „Notwendig" (immer aktiv) und „Analytics" (Opt-in) aktivieren; „Marketing"/
  „Präferenzen" nur, falls tatsächlich weitere Dienste dieser Art eingesetzt werden — sonst
  unnötige Kategorien vermeiden (Datenminimierung).
- **Dienste/Cookies pro Kategorie**: Google Analytics 4 der Kategorie **„Analytics"** zuordnen
  (Cookie-Namen `_ga`, `_ga_*`), inkl. Zweckbeschreibung und Verweis auf Google LLC (USA) als
  Empfänger.
- **Google Consent Mode v2 (CookieHub-Feature)**: **nicht aktivieren.** Dieses Feature setzt
  automatisch `gtag('consent', ...)`-Signale und ist für das alternative
  „Tag lädt immer, mit denied/granted-Signal"-Muster gedacht (siehe Hinweis in Abschnitt „Status").
  Da das Inline-Script in `index.html` das Skript ohnehin nie ohne Einwilligung injiziert, würde
  diese Option nur unnötige Komplexität hinzufügen bzw. mit der bestehenden Logik konkurrieren.
- **Sprache**: Deutsch als Standard, passend zu `lang="de"` in `index.html`.
- **Resurface/Settings-Link**: Nicht zwingend nötig, da `Datenschutz.tsx` bereits einen eigenen
  Button bereitstellt (`window.cookiehub.openSettings()`); optional zusätzlich das CookieHub-eigene
  Settings-Icon aktivieren, falls gewünscht.

Ergänzend wurde CookieHub selbst als Verarbeitungstätigkeit in `docs/DATENSCHUTZ_PROTOKOLL.md`
(Abschnitt 2) und in der Datenquellen-Tabelle der Datenschutzerklärung (`Datenschutz.tsx`)
dokumentiert — es verarbeitet ausschließlich die Einwilligungsentscheidung selbst, keine
Tracking-Daten, und benötigt daher keine eigene Nutzereinwilligung (funktional notwendiges
Compliance-Werkzeug, Art. 6 Abs. 1 lit. c DSGVO).

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
| 2. `VITE_GA_MEASUREMENT_ID` in `.env`/Render setzen | Repository-Owner | Lokal gesetzt — Render wird gerade vom Repository-Owner gesetzt |
| 3. GA-Inline-Script in `index.html` (`%VITE_GA_MEASUREMENT_ID%`) | Entwicklung | Erledigt |
| 4. CookieHub-Snippet in `index.html` | Entwicklung | Erledigt |
| 4b. CookieHub-Dashboard konfigurieren (Domain, Kategorien, Analytics-Zuordnung) | Repository-Owner (CookieHub-Konto) | Offen — externer Vorgang, siehe Checkliste in Abschnitt 4 |
| 4c. GA4 „Einwilligungsmodus" NICHT aktivieren | Repository-Owner | Hinweis beachten, keine Aktion nötig |
| 5. Datenschutzerklärung/Protokoll aktualisieren | Entwicklung/Recht | Erledigt |
