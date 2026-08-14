# 🔍 SEO Checklist & Technical Discovery Guide
**Project: CAPITAL-AI**  
**Target Focus:** Quantitative Financial Calculators & Stock Screener Platform  
**Stand:** 15.08.2026 — Block Q (Quick Wins) in PR `seo/q-quick-wins-foundation`  
**Umsetzungsplan:** `docs/seo/SEO_MANAGEMENT_ROADMAP.md`

> **Korrekturhinweis (08.08.2026).** Frühere Fassungen dieses Dokuments wiesen Punkte als erledigt
> aus und beschrieben Microdata-Schemata in `/index.html`, die im Repository nicht existieren; der
> dort gezeigte `<title>` wich zudem vom tatsächlich ausgelieferten ab. Die Haken unten geben jetzt
> den nachgeprüften Ist-Stand wieder. Offene Punkte sind mit ihrer Roadmap-Kennung versehen.
>
> **Update 15.08.2026 (Block Q):** Q1–Q5 im Code-Pfad umgesetzt. Q3 (Search-Console-Token) erfordert
> Owner-Aktion in der Google Search Console. Q6: keine AI-Studio-CORS-Ausnahme im aktuellen Tree gefunden.

---

## 🎯 Organic Discovery Goals
To secure organic placements for keywords like "Benjamin Graham DCF Calculator", "Quantitative Stock Screening Tool", "DSGVO-konforme Finanzsoftware", and "Monte Carlo Portfolio Simulation", without adding bloated, slow CDNs or breaking visual constraints.

---

## 📋 Technical On-Page SEO Checklist

### 1. Crawling & Indexierung — Grundlage
- [x] **`robots.txt`**: `public/robots.txt` — Allow öffentliche Routen, Disallow `/api/`, Sitemap-Hinweis. → **Q1 done**
- [x] **`sitemap.xml`**: `public/sitemap.xml` — `/`, `/impressum`, `/agb`, `/datenschutz` (ohne trailing slash). → **Q1 done**
- [x] **`<link rel="canonical">`**: Homepage-Canonical auf `https://capital-ai.online/`. Trailing-Slash-Normalisierung serverseitig bleibt Follow-up (Middleware, Block D/S). → **Q2 partial**
- [ ] **Search-Console-Verifizierung**: Meta-/DNS-Token vom Owner nach Property-Anlage eintragen. Platzhalter-Kommentar in `index.html`. → **Q3 owner action**
- [ ] **Echte 404-Antworten**: unbekannte URLs liefern HTTP 200 mit `index.html` (nur Scanner-Köderpfade sind ausgenommen) → Soft-404 und unbegrenzter URL-Raum. → `D3`

### 2. Semantic Hierarchy & Landmarking
- [ ] **Strict `<h1>` Constraint**: nicht verifiziert und nicht durch einen Test abgesichert.
- [ ] **Subheading Layout**: nicht verifiziert.
- [ ] **Aria Alt Texts**: nicht flächendeckend verifiziert.

> Diese drei Punkte waren zuvor als erledigt markiert. Es gibt im Repository keinen Prüfpfad, der
> das belegt. Ein automatisiertes Gate ist als Teil von `N2` (Core-Web-Vitals-/A11y-Gate in CI)
> vorgesehen; bis dahin bleiben sie offen statt unbelegt abgehakt.

### 3. Microdata & JSON-LD Structure
- [ ] **JSON-LD**: `index.html` enthält **kein** `application/ld+json`. Es existieren derzeit keinerlei strukturierte Daten. → `D1` (`Organization`, `WebSite`, `SoftwareApplication`)

Tatsächlich ausgeliefert werden aktuell klassische Meta- und OpenGraph-Tags (kein Microdata-Schema),
plus Canonical und first-party `og:image`.

- [ ] **Routen-spezifische Titles/Meta**: die SPA liefert eine einzige `index.html`; `/impressum`, `/agb` und `/datenschutz` rendern denselben `<title>`. → `D2`
- [x] **`og:image` in Eigenbesitz**: `https://capital-ai.online/og-image.svg` (first-party). Empfohlenes Follow-up: PNG 1200×630 für maximale Social-Kompatibilität. → **Q5 done**

### 4. Renderbarkeit für Crawler
- [ ] **Prerendering/SSG**: nicht vorhanden. Der Server liefert `dist/index.html`; Crawler ohne JavaScript-Ausführung sehen ein leeres `<div id="root">`. → `S2`

### 5. Page Loading Speed (Core Web Vitals)
- [x] **Zero Webfont CDNs**: bestätigt — es werden keine externen Webfonts geladen (CJEU-konform, Fonts lokal).
- [ ] **Asset Bundling**: Ziel verfehlt. Der Produktionsbuild erzeugt einen einzelnen Chunk mit **2,49 MB (678 kB gzip)**; Vite warnt selbst ab 500 kB. Code-Splitting via `manualChunks` fehlt. → `D4`

---

## 🔑 Primary Targeted Keywords

* `quantitative investment screener` (commercial intent)
* `benjamin graham calculator online` (informational intent)
* `monte carlo portfolio simulator` (medium intent)
* `dsgvo konforme trading software` (regional focus)

> Für diese Keywords existiert bisher keine dedizierte, indexierbare Landingpage. Der Aufbau eines
> entsprechenden Content-Layers ist als `N1`/`N2` in der Roadmap terminiert.
