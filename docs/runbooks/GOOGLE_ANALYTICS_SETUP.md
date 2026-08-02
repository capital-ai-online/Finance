# CAPITAL-AI Runbook: Google Analytics (GA4) Einbindung

## Document ID

RUNBOOK-0003

## Bezug

`docs/DATENSCHUTZ_PROTOKOLL.md` (Verzeichnis von Verarbeitungstätigkeiten, Art. 30 DSGVO),
`docs/seo/SEO_CHECKLIST.md`.

## Status

Entwurf — Schritt 1 (Property/Measurement-ID) ist ein externer Vorgang im Google-Konto des
Repository-Owners und kann nicht durch einen KI-Agenten automatisiert werden. Die Code-Integration
(Abschnitt 3) ist vorbereitet, aber **nicht** aktiv, solange keine echte Measurement-ID in der
Umgebung gesetzt ist (fail-closed: ohne `VITE_GA_MEASUREMENT_ID` lädt kein Tracking-Script).

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

## 3. Code-Integration (nur nach Einwilligung laden)

Da das Script erst nach Opt-in laden darf (siehe Abschnitt 4), **nicht** einfach ein
`<script async src="https://www.googletagmanager.com/gtag/js?id=G-...">` fest in `index.html`
eintragen. Stattdessen bedingt aus React heraus laden, z. B. in einer neuen Datei
`src/services/analytics/googleAnalytics.ts`:

```ts
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let loaded = false;

export function loadGoogleAnalytics(): void {
  if (loaded || !MEASUREMENT_ID) return;
  loaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, { anonymize_ip: true });
}
```

Aufruf von `loadGoogleAnalytics()` ausschließlich aus dem `onAccept`-Handler des
Cookie-Consent-Banners (Abschnitt 4) — **nicht** aus `main.tsx` oder `App.tsx` beim Start.

---

## 4. Voraussetzung: Cookie-Consent-Banner

Im Repository existiert aktuell **kein** Cookie-Consent-Mechanismus für Tracking (die vorhandene
`ComplianceConsentModal` betrifft Compliance-Datenfreigaben, nicht Website-Tracking-Cookies).
Vor dem produktiven Einsatz von GA muss ein Banner ergänzt werden, das:

- vor jeglichem GA-Laden eine explizite Opt-in-Entscheidung einholt (kein vorangehakter Haken,
  kein reines „Weiter-Nutzen-gilt-als-Zustimmung"),
- die Entscheidung persistiert (z. B. `localStorage`), damit sie nicht bei jedem Seitenaufruf
  erneut abgefragt wird,
- einen jederzeit erreichbaren Weg bietet, die Einwilligung zu widerrufen,
- in `docs/DATENSCHUTZ_PROTOKOLL.md` und der öffentlichen Datenschutzerklärung
  (`/datenschutz/`-Route) als neue Datenkategorie/Drittanbieter (Google LLC, USA) dokumentiert wird.

Dieser Banner ist ein eigenständiges Implementierungs-Ticket und nicht Teil dieses Runbooks — er
wird hier nur als **Blocker** für den produktiven GA-Einsatz benannt.

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
| 1. GA4-Property + Measurement-ID | Repository-Owner (Google-Konto) | Offen — externer Vorgang |
| 2. `VITE_GA_MEASUREMENT_ID` in `.env`/Render setzen | Repository-Owner | Offen, sobald ID vorliegt |
| 3. `googleAnalytics.ts` Service | Entwicklung | Vorbereitet in diesem Runbook |
| 4. Cookie-Consent-Banner | Entwicklung | Fehlt — Blocker für Go-Live |
| 5. Datenschutzerklärung/Protokoll aktualisieren | Entwicklung/Recht | Fehlt — Blocker für Go-Live |
