# 🔍 SEO Checklist & Technical Discovery Guide
**Project: CAPITAL-AI**  
**Stand:** 02.09.2026 — WP-D3 Soft-404 VERIFIED; **Q3 Search Console Domain property VERIFIED**; **WP-D1/D2 VERIFIED** (PR #375 + Owner Rich Results Test); **WP-S2 Prerender VERIFIED** (ADR-0084); **Version Projection Gate OPEN**  
**Umsetzungsplan:** `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` (SEO-GM-ROADMAP-0002)

### 1. Crawling & Indexierung
- [x] robots.txt / sitemap.xml — **Q1** (live `200`)
- [x] canonical + Trailing-Slash 301 — **Q2** (canonical + server 301 live; WP-Q-CLOSE rest: GSC)
- [x] Search-Console-Verifizierung — **Q3 VERIFIED** (Domain `capital-ai.online`, Ownership bestätigt, Sitemap success) → `docs/seo/Q3_SEARCH_CONSOLE_VERIFY_RUNBOOK.md`
- [x] Echte 404 (Soft-404 behoben) — **D3** (PR #360, prod VERIFIED)

### 2. Version Projection / Google-visible Evidence
- [x] **Single version authority:** `package.json#version`; SEO definiert keinen zweiten Versionswert.
- [x] Public-site visible version korreliert am 02.09.2026 mit `package.json#version = 0.6.0`.
- [x] `index.html` Meta Description, OpenGraph und Twitter Description projizieren aktuell `0.6.0`.
- [ ] `SoftwareApplication.softwareVersion` projiziert explizit die kanonische `package.json#version` ohne zweiten Hardcode — **FE-owned implementation gap**; SEO dokumentiert Requirement/Evidence, keine Fremdcode-Umsetzung.
- [ ] Google-visible Version Surface ist exakt identifiziert und nach Refresh/Reindex mit der kanonischen Version korreliert. Bis dahin kein `GOOGLE_VISIBLE_PASS`.
- [x] Historische/legacy `0.5.4`-Vorkommen bleiben erhalten und werden nicht als current SEO Authority verwendet → `docs/seo/GOOGLE_VISIBLE_VERSION_CORRELATION_2026-09-02.md`.

### 3. JSON-LD / Meta
- [x] JSON-LD Organization/WebSite/SoftwareApplication — **D1 VERIFIED** (PR #375; ImageObject logo + offers/image; Owner Rich Results Test 2026-08-16)
- [ ] JSON-LD `SoftwareApplication.softwareVersion` — muss aus der kanonischen Package-Version projiziert werden; keine zweite Versionsauthority.
- [x] Routen-Titles client-side — **D2 VERIFIED** (routeSeo + main.tsx load/popstate; prerender; unique titles live auf `/`, `/impressum`, `/agb`, `/datenschutz`)
- [x] og:image first-party — **Q5**

### 4. Crawler-Render
- [x] Prerender Meta + noscript pro Public-Route — **S2 VERIFIED** (ADR-0084 Accepted; build-wired script + spaFallback; prod noscript without JS)
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
