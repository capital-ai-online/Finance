# 🔍 SEO Checklist & Technical Discovery Guide
**Project: CAPITAL-AI**  
**Stand:** 16.08.2026 — WP-D3 Soft-404 VERIFIED; Q3 Search Console Owner-Gate  
**Umsetzungsplan:** `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` (SEO-GM-ROADMAP-0002)

### 1. Crawling & Indexierung
- [x] robots.txt / sitemap.xml — **Q1** (live `200`)
- [x] canonical + Trailing-Slash 301 — **Q2** (canonical + server 301 live; WP-Q-CLOSE rest: GSC)
- [ ] Search-Console-Verifizierung — **Q3 owner** → `docs/seo/Q3_SEARCH_CONSOLE_VERIFY_RUNBOOK.md`
- [x] Echte 404 (Soft-404 behoben) — **D3** (PR #360, prod VERIFIED)

### 3. JSON-LD / Meta
- [x] JSON-LD Organization/WebSite/SoftwareApplication — **D1** (Shell in `index.html`; Rich-Results-DoD offen)
- [ ] Routen-Titles client-side — **D2** (teilweise prerender)
- [x] og:image first-party — **Q5**

### 4. Crawler-Render
- [ ] Prerender Meta + noscript pro Public-Route — **S2** (ADR formal noch offen)
- [ ] Full React-Body SSR — optional Follow-up

### 5. Performance
- [ ] manualChunks / CWV — **D4** (carried)

### 6. Management & Content
- [ ] Search Console MCP Credentials — **D5** (nach Q3; `SEARCH_CONSOLE_MCP_RUNBOOK.md`)
- [x] SeoEngine foundation — **S1** VERIFIED (ADR-0082)
- [ ] Generate text/scripts — **N1/N2**
- [ ] Owner-Freigabe vor Instant-Publish — **N4**
- [ ] Media-Rendering — **N3** (Make-or-Buy)

### S3 Management Dashboard
- [x] Owner/Admin-Dashboard für SeoEngine-KPIs — **S3**

### S4 Sprache und hreflang
- [x] German-first-Strategie dokumentiert — **S4**
- [x] Kein irreführendes `hreflang` ohne kanonische Übersetzungs-URLs
