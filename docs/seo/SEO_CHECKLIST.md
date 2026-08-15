# 🔍 SEO Checklist & Technical Discovery Guide
**Project: CAPITAL-AI**  
**Target Focus:** Quantitative Financial Calculators & Stock Screener Platform  
**Stand:** 15.08.2026 — Q/D mostly landed; D3 Soft-404 in PR #285; S1 foundation in progress  
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
- [x] **Trailing-Slash 301 serverseitig**: `registerTrailingSlashNormalize` in `registerApplicationRoutes` → **Q2 done**
- [ ] **Search-Console-Verifizierung**: Owner-Token → **Q3 owner action**
- [x] **Echte 404-Antworten (Code)**: `installProductionSoft404Intercept` → **D3 in PR #285** (Merge + Deploy ausstehend)

### 2. Semantic Hierarchy & Landmarking
- [ ] **Strict `<h1>` Constraint**: nicht automatisiert verifiziert.
- [ ] **Subheading Layout**: nicht automatisiert verifiziert.
- [ ] **Aria Alt Texts**: nicht flächendeckend verifiziert.

### 3. Microdata & JSON-LD Structure
- [x] **JSON-LD**: `Organization`, `WebSite`, `SoftwareApplication` in `index.html` → **D1 done**
- [x] **Routen-spezifische Titles/Meta (client)**: `src/lib/routeSeo.ts` + `src/main.tsx` → **D2 done** (Prerender bleibt **S2**)
- [x] **`og:image` first-party**: `/og-image.svg` → **Q5 done**

### 4. Renderbarkeit für Crawler
- [ ] **Prerendering/SSG**: Scaffold `scripts/seo/prerender-public-routes.mjs` → **S2 partial**; Full body later

### 5. Page Loading Speed (Core Web Vitals)
- [x] **Zero Webfont CDNs**: bestätigt
- [x] **Asset Bundling / manualChunks**: `vite.config.ts` → **D4 done** (Messung nach Production-Build verifizieren)

### 6. Monitoring & Management
- [ ] **Search-Console MCP**: Runbook `docs/seo/SEARCH_CONSOLE_MCP_RUNBOOK.md` → **D5 docs**; Credentials/Owner freigeben
- [x] **SeoEngine foundation (S1)**: Keyword-Register, Content-Inventar, Rank-Snapshots (in-memory + Migration-Draft) unter `src/platform/SeoEngine/` und `/api/seo/*`

---

## 🔑 Primary Targeted Keywords

* `quantitative investment screener` (commercial intent)
* `benjamin graham calculator online` (informational intent)
* `monte carlo portfolio simulator` (medium intent)
* `dsgvo konforme trading software` (regional focus)

> Dedizierte Landingpages → Content-Layer **N1/N2** (API vorhanden).
