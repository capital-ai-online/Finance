# 🔍 SEO Checklist & Technical Discovery Guide
**Project: CAPITAL-AI**  
**Stand:** 06.09.2026 — Programm-Roadmap 0002.15 im selben PR #764; WP-Q1-HARDEN **IMPLEMENTED_ON_MAIN** (PR #760) **und Production-Sitemap live**; **Q3 historisch VERIFIED**; **WP-D1/D2/S1/S2/S3/S4 Spec VERIFIED**; **GOOGLE_VISIBLE_PASS NOT ENABLED**  
**Umsetzungsplan:** `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` (SEO-GM-ROADMAP-0002.15)  
**Aktuelle Evidence:** `docs/seo/GOOGLE_MARKETING_EVIDENCE_CORRELATION_2026-09-06.md`

### 1. Crawling & Indexierung
- [x] robots.txt / sitemap.xml — **Q1** Repository live auf main inkl. `/learning-platform` (PR #760)
- [x] Public-Route ↔ Sitemap-Abdeckung — **Q1 Hardening IMPLEMENTED_ON_MAIN**
- [x] Production-Sitemap/robots — Live 2026-09-06 mit fünf kanonischen URLs inkl. `/learning-platform`
- [x] canonical + Trailing-Slash 301 — **Q2**
- [x] Search-Console-Verifizierung — **Q3 historische Evidence**. Kein heutiger GSC-Read.
- [x] Echte 404 — **D3**

### 2. Version Projection / Google-visible Evidence
- [x] Single version authority: `package.json#version`
- [x] Live-Homepage `softwareVersion` `0.6.0`
- [x] Live Identity-Header `x-capital-ai-version=0.6.0` (`x-capital-ai-commit=076e88e2…`)
- [ ] Google-visible Version nach Refresh/Reindex. Kein `GOOGLE_VISIBLE_PASS`.
- [x] Historische `0.5.4`-Vorkommen bleiben Evidence

### 3. JSON-LD / Meta
- [x] JSON-LD Organization/WebSite/SoftwareApplication — **D1 VERIFIED**
- [x] Routen-Titles — **D2 VERIFIED**
- [x] og:image first-party — **Q5**

### 4. Crawler-Render
- [x] Prerender Meta + noscript — **S2 VERIFIED**
- [ ] Full React-Body SSR — optional, nicht SEO-P0

### 5. Performance
- [ ] manualChunks / CWV — **D4** (Frontend-owned; kein SEO-PR)

### 6. Management & Content
- [ ] Search Console MCP — **D5 NOT ENABLED** (Credential-Gate)
- [x] SeoEngine foundation — **S1 VERIFIED**
- [ ] GA4 Analytics Data API / Realtime-Read — **NOT ENABLED**
- [x] N1/N2 Code vorhanden; Runtime-Enablement getrennt
- [ ] N4 Content-Kalender offen (nicht SEO-P0)
- [ ] N3 Media-Rendering Make-or-Buy (Owner-Entscheidung)

### S3 Management Dashboard
- [x] S3 Dashboard

### S4 Sprache und hreflang
- [x] German-first-Strategie dokumentiert und abgeschlossen
- [x] Kein irreführendes `hreflang` ohne kanonische Übersetzungs-URLs
