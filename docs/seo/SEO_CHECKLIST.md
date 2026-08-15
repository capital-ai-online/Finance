# 🔍 SEO Checklist & Technical Discovery Guide
**Project: CAPITAL-AI**  
**Stand:** 15.08.2026 — S1 gemerged (#289); S2 Prerender Build-Wire  
**Umsetzungsplan:** `docs/seo/SEO_MANAGEMENT_ROADMAP.md`

### 1. Crawling & Indexierung
- [x] robots.txt / sitemap.xml — **Q1**
- [x] canonical + Trailing-Slash 301 — **Q2**
- [ ] Search-Console-Verifizierung — **Q3 owner**
- [x] Echte 404 (Soft-404 behoben) — **D3** (#285)

### 3. JSON-LD / Meta
- [x] JSON-LD Organization/WebSite/SoftwareApplication — **D1**
- [x] Routen-Titles client-side — **D2**
- [x] og:image first-party — **Q5**

### 4. Crawler-Render
- [x] Prerender Meta + noscript pro Public-Route — **S2** (`npm run build` → prerender)
- [ ] Full React-Body SSR — optional Follow-up

### 5. Performance
- [x] manualChunks — **D4**

### 6. Management
- [ ] Search Console MCP Credentials — **D5**
- [x] SeoEngine foundation (in-memory + API) — **S1** (#289)
