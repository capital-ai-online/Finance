# SEO Block Q — Implementation Notes (2026-08-15)

**Roadmap:** `docs/seo/SEO_MANAGEMENT_ROADMAP.md` (SEO-ROADMAP-0001)  
**Branch:** `seo/q-quick-wins-foundation`  
**Claim:** `SEO-Q-QUICK-WINS-2026-08-15`

## Delivered

| ID | Status | Artefakt |
|----|--------|----------|
| Q1 | done | `public/robots.txt`, `public/sitemap.xml` |
| Q2 | partial | `index.html` → `<link rel="canonical" href="https://capital-ai.online/">`; noscript-Links ohne trailing slash. Serverseitige Trailing-Slash-Redirects → Follow-up (D/S). |
| Q3 | owner action | Kommentar-Platzhalter in `index.html`. Owner muss Search-Console-Property anlegen und Meta- oder DNS-Token setzen. |
| Q4 | done | `docs/seo/SEO_CHECKLIST.md` aktualisiert |
| Q5 | done | `public/og-image.svg`; `og:image` + `twitter:image` → `https://capital-ai.online/og-image.svg` |
| Q6 | N/A | Keine `aistudio` / AI-Studio-CORS-Ausnahme im aktuellen Repository-Tree gefunden. Keine Code-Änderung. |

## Owner follow-ups

1. **Search Console:** Property `capital-ai.online` verifizieren (Meta-Tag in `index.html` oder DNS-TXT).
2. **Sitemap submit:** Nach Deploy Sitemap in Search Console einreichen.
3. **OG PNG (optional):** Viele Plattformen bevorzugen PNG/JPG 1200×630; SVG ist first-party und korrekt, aber nicht universell.
4. **Trailing-Slash-Middleware:** 301 von `/datenschutz/` → `/datenschutz` (und analog) serverseitig in Block D.

## Out of scope (next blocks)

- JSON-LD (D1), route-specific titles (D2), soft-404 (D3), bundle split (D4), GSC MCP (D5)
- SeoEngine (S1), prerender (S2)
