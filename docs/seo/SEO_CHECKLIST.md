# 🔍 SEO Checklist & Technical Discovery Guide
**Project: CAPITAL-AI**  
**Target Focus:** Quantitative Financial Calculators & Stock Screener Platform  
**Stand:** 15.08.2026 — Block Q gemerged; Block D + Q2-Helpers in `seo/d-block-foundation`  
**Umsetzungsplan:** `docs/seo/SEO_MANAGEMENT_ROADMAP.md`

---

## 🎯 Organic Discovery Goals
To secure organic placements for keywords like "Benjamin Graham DCF Calculator", "Quantitative Stock Screening Tool", "DSGVO-konforme Finanzsoftware", and "Monte Carlo Portfolio Simulation", without adding bloated, slow CDNs or breaking visual constraints.

---

## 📋 Technical On-Page SEO Checklist

### 1. Crawling & Indexierung — Grundlage
- [x] **`robots.txt`**: `public/robots.txt` → **Q1 done**
- [x] **`sitemap.xml`**: `public/sitemap.xml` → **Q1 done**
- [x] **`<link rel="canonical">`**: Homepage + client route updates → **Q2 / D2**
- [ ] **Trailing-Slash 301 serverseitig**: Modul `server/middleware/seoUrlNormalize.ts` bereit — **Wiring in `server.application.ts` noch setzen** → **Q2 code ready**
- [ ] **Search-Console-Verifizierung**: Owner-Token → **Q3 owner action**
- [ ] **Echte 404-Antworten**: Modul `server/runtime/spaFallback.ts` bereit — **Wiring noch setzen** → **D3 code ready**

### 2. Semantic Hierarchy & Landmarking
- [ ] **Strict `<h1>` Constraint**: nicht automatisiert verifiziert.
- [ ] **Subheading Layout**: nicht automatisiert verifiziert.
- [ ] **Aria Alt Texts**: nicht flächendeckend verifiziert.

### 3. Microdata & JSON-LD Structure
- [x] **JSON-LD**: `Organization`, `WebSite`, `SoftwareApplication` in `index.html` → **D1 done**
- [x] **Routen-spezifische Titles/Meta (client)**: `src/lib/routeSeo.ts` + `src/main.tsx` → **D2 done** (Prerender bleibt **S2**)
- [x] **`og:image` first-party**: `/og-image.svg` → **Q5 done**

### 4. Renderbarkeit für Crawler
- [ ] **Prerendering/SSG**: nicht vorhanden → **S2**

### 5. Page Loading Speed (Core Web Vitals)
- [x] **Zero Webfont CDNs**: bestätigt
- [x] **Asset Bundling / manualChunks**: `vite.config.ts` → **D4 done** (Messung nach Production-Build verifizieren)

### 6. Monitoring
- [ ] **Search-Console MCP**: Runbook `docs/seo/SEARCH_CONSOLE_MCP_RUNBOOK.md` → **D5 docs**; Credentials/Owner freigeben

---

## 🔑 Primary Targeted Keywords

* `quantitative investment screener` (commercial intent)
* `benjamin graham calculator online` (informational intent)
* `monte carlo portfolio simulator` (medium intent)
* `dsgvo konforme trading software` (regional focus)

> Dedizierte Landingpages → Content-Layer **N1/N2**.
