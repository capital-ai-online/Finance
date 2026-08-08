# 🔍 SEO Checklist & Technical Discovery Guide
**Project: CAPITAL-AI**  
**Target Focus:** Quantitative Financial Calculators & Stock Screener Platform  
**Stand:** 08.08.2026, Commit `1809f03` — verifiziert gegen das Repository  
**Umsetzungsplan:** `docs/seo/SEO_MANAGEMENT_ROADMAP.md`

> **Korrekturhinweis (08.08.2026).** Frühere Fassungen dieses Dokuments wiesen Punkte als erledigt
> aus und beschrieben Microdata-Schemata in `/index.html`, die im Repository nicht existieren; der
> dort gezeigte `<title>` wich zudem vom tatsächlich ausgelieferten ab. Die Haken unten geben jetzt
> den nachgeprüften Ist-Stand wieder. Offene Punkte sind mit ihrer Roadmap-Kennung versehen.

---

## 🎯 Organic Discovery Goals
To secure organic placements for keywords like "Benjamin Graham DCF Calculator", "Quantitative Stock Screening Tool", "DSGVO-konforme Finanzsoftware", and "Monte Carlo Portfolio Simulation", without adding bloated, slow CDNs or breaking visual constraints.

---

## 📋 Technical On-Page SEO Checklist

### 1. Crawling & Indexierung — Grundlage
- [ ] **`robots.txt`**: existiert nicht in `public/`. → `Q1`
- [ ] **`sitemap.xml`**: existiert nicht. → `Q1`
- [ ] **`<link rel="canonical">`**: fehlt in `index.html`. Die App bedient `/datenschutz` **und** `/datenschutz/` → Duplicate-Content-Risiko. → `Q2`
- [ ] **Search-Console-Verifizierung**: kein `google-site-verification` vorhanden; ohne Property existiert keine Messgrundlage. → `Q3`
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

Tatsächlich ausgeliefert werden aktuell ausschließlich klassische Meta- und OpenGraph-Tags
(kein Microdata-Schema):

```html
<title>CAPITAL-AI Portal</title>
<meta name="description" content="Offizielles CAPITAL-AI Portal (Version 0.6.0) – Sichere quantitative Analysen, Compliance-Management, Asset-Scoring und automatisierte DSGVO-Dokumentation." />
<meta property="og:type" content="website" />
<meta property="og:title" content="CAPITAL-AI Portal – Enterprise Compliance & AI Orchestration" />
```

- [ ] **Routen-spezifische Titles/Meta**: die SPA liefert eine einzige `index.html`; `/impressum`, `/agb` und `/datenschutz` rendern denselben `<title>`. → `D2`
- [ ] **`og:image` in Eigenbesitz**: zeigt derzeit auf die Fremd-Domain `https://webscan-radar.com/badge/Capital-AI.online`. → `Q5`

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
