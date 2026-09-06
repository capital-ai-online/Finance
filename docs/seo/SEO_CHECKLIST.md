# 🔍 SEO Checklist & Technical Discovery Guide
**Project: CAPITAL-AI**  
**Stand:** 06.09.2026 — WP-Q1-HARDEN **IMPLEMENTED_ON_MAIN** (PR #760) **und Production-Sitemap live** (`x-capital-ai-commit=d080def…`); **Q3 historisch VERIFIED**; **WP-D1/D2 VERIFIED**; **WP-S2 VERIFIED**; **GOOGLE_VISIBLE_PASS NOT ENABLED**  
**Umsetzungsplan:** `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` (SEO-GM-ROADMAP-0002)  
**Aktuelle Evidence:** `docs/seo/GOOGLE_MARKETING_EVIDENCE_CORRELATION_2026-09-06.md`

### 1. Crawling & Indexierung
- [x] robots.txt / sitemap.xml — **Q1** Repository live auf main inkl. `/learning-platform` (PR #760)
- [x] Public-Route ↔ Sitemap-Abdeckung — **Q1 Hardening IMPLEMENTED_ON_MAIN** (`listPublicRouteSeoPaths()`; Regression `tests/unit/seoPublicRouteSitemap.test.ts`)
- [x] Production-Sitemap/robots entsprechen dem Q1-Merge — Live-Sitemap 2026-09-06T10:01Z mit fünf kanonischen URLs inkl. `/learning-platform`; Live-robots mit explizitem `Allow: /learning-platform`. Production-Commit `d080def…` (PR #760). Current main `076e88e2…` enthält zusätzlich PR #761 (COMP), nicht sitemap-relevant.
- [x] canonical + Trailing-Slash 301 — **Q2**
- [x] Search-Console-Verifizierung — **Q3 historische Evidence** (Domain `capital-ai.online`, Ownership 2026-08-16). Kein heutiger GSC-Read in dieser Einheit.
- [x] Echte 404 — **D3**

### 2. Version Projection / Google-visible Evidence
- [x] **Single version authority:** `package.json#version`
- [x] Live-Homepage projiziert `0.6.0` in Description und `SoftwareApplication.softwareVersion` (2026-09-06)
- [x] Live Identity-Header `x-capital-ai-version=0.6.0`
- [ ] Google-visible Version Surface nach Refresh/Reindex. Kein `GOOGLE_VISIBLE_PASS`.
- [x] Historische `0.5.4`-Vorkommen bleiben Evidence

### 3. JSON-LD / Meta
- [x] JSON-LD Organization/WebSite/SoftwareApplication — **D1 VERIFIED**
- [x] JSON-LD `SoftwareApplication.softwareVersion` — öffentliche Seite `0.6.0`
- [x] Routen-Titles client-side — **D2 VERIFIED**
- [x] og:image first-party — **Q5**

### 4. Crawler-Render
- [x] Prerender Meta + noscript — **S2 VERIFIED**
- [ ] Full React-Body SSR — optional

### 5. Performance
- [ ] manualChunks / CWV — **D4** (Frontend-owned)

### 6. Management & Content
- [ ] Search Console MCP — **D5 NOT ENABLED**
- [x] SeoEngine foundation — **S1 VERIFIED**
- [ ] GA4 Analytics Data API / Realtime-Read — MCP-Eintrag vorhanden; aktueller API-Erfolg **NOT ENABLED**
- [ ] N1/N2 Runtime-Enablement getrennt von Code-Existenz
- [ ] N4 Content-Kalender offen
- [ ] N3 Media-Rendering Make-or-Buy

### S3 Management Dashboard
- [x] S3 Dashboard

### S4 Sprache und hreflang
- [x] German-first-Strategie dokumentiert
- [x] Kein irreführendes `hreflang` ohne kanonische Übersetzungs-URLs
