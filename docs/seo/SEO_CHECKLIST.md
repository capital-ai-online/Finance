# 🔍 SEO Checklist & Technical Discovery Guide
**Project:** CAPITAL-AI  
**Stand:** 11.09.2026 — Programm-Roadmap **SEO-GM-ROADMAP-0002.16**  
**Korrelationsbasis:** `main@12c9e129c7302df0d1bce7640cd7888f0998b9ca`  
**Repository:** `capital-ai-online/Finance`  
**GOOGLE_VISIBLE_PASS:** **NOT ENABLED / nicht frisch gelesen**

## 1. Crawling & Indexierung
- [x] robots.txt / sitemap.xml Repository-Baseline vorhanden
- [x] canonical + Trailing-Slash-Normalisierung vorhanden
- [x] echte 404 für unbekannte URLs vorhanden
- [ ] **SoTA Gate:** Public-Route-Inventar = Sitemap = Canonical-/Prerender-Allowlist automatisiert regressionsgesichert
- [ ] keine widersprüchlichen Canonicals vor/nach JavaScript-Rendering
- [ ] Sitemap enthält ausschließlich kanonische, indexierbare HTTP-200-URLs
- [ ] robots blockiert keine für Rendering/Indexierung nötigen First-party-Ressourcen

## 2. Search Console + GA4 Measurement
- [ ] read-only GSC-Snapshot: Clicks, Impressions, CTR, Queries, Pages, Country, Device
- [ ] GA4 Organic Search Sessions / Key Events / Landingpages aus echter Read-Evidence
- [ ] GSC und GA4 gemeinsam trendbasiert korrelieren; absolute Zahlen nicht künstlich angleichen
- [ ] Search Console GenAI Performance Report lesen, sobald Credentials verfügbar sind
- [ ] keine synthetischen Rankings, Traffic-, Conversion- oder GenAI-Werte

## 3. Structured Data / SERP Features
- [x] JSON-LD Organization/WebSite/SoftwareApplication Baseline vorhanden
- [ ] Markup nach Template-/Schema-Änderungen erneut validieren
- [ ] Structured Data nur bei sichtbarem, echtem Inhalt einsetzen
- [ ] Product/Article/Video/etc. nur bei passender Surface
- [x] `FAQPage` **nicht** als künftiges Google-Rich-Result-Ziel führen (2026 deprecated)

## 4. Content / Topic System
- [x] Seed Topic Map in 0002.16 angelegt
- [x] Content-Brief-Contract: Intent, Ziel-URL, first-party Evidence, Who/How/Why, Reviewer, interne Links, Media, Messgröße, Refresh-Gate
- [ ] echte GSC-/Keyword-Daten zur Priorisierung einlesen
- [ ] erstes Pilot-Brief nach Business Value + Search Intent + Evidence priorisieren
- [ ] Content Decay / Cannibalization / Merge-Refresh-Prune-Backlog aus echten Daten

## 5. Helpful Content / Spam Guardrails
- [x] kein scaled-content abuse
- [x] kein Cloaking
- [x] keine Doorway-/Query-Variant-Massenseiten
- [x] keine manipulativen Linkschemata
- [x] kein Site-Reputation-Abuse
- [x] AI-Unterstützung nur mit hilfreichem, originellem, fachlich geprüftem Ergebnis
- [x] kein `llms.txt` als Pflicht-/Ranking-Hack

## 6. Internal Linking / IA
- [ ] Public-URL-Inventar vollständig
- [ ] keine Orphan Pages
- [ ] beschreibende, kontextuelle Anchor-Texte
- [ ] H1/H2-Struktur pro indexierbarer Seite konsistent
- [ ] Navigation und interne Links führen zu kanonischen URLs

## 7. Performance / Core Web Vitals — FE-owned
- [ ] p75 LCP <= 2.5 s
- [ ] p75 INP <= 200 ms
- [ ] p75 CLS <= 0.1
- [ ] Mobile und Desktop getrennt
- [ ] Field Data bevorzugen; Lighthouse/Lab für Diagnose/Regression
- [ ] Umsetzung ausschließlich über `CAPITAL-AI-FE`, SEO konsumiert Evidence

## 8. Media SEO
- [x] first-party `og:image` Baseline vorhanden
- [ ] bevorzugtes first-party Bild konsistent auf relevanten Public Surfaces
- [ ] descriptive filenames/alt/caption wo passend
- [ ] Media crawlbar und performant
- [ ] VideoObject/Transcript nur bei echtem Video/Medieninhalt

## 9. Authority / Links
- [ ] Baseline referring domains / relevante unlinked mentions aus echter Tool-/Provider-Evidence
- [ ] Outreach-Liste nach Themenfit/Qualität priorisieren
- [ ] kein Linkkauf-/Tausch-/Spam-Programm

## 10. International SEO
- [x] German-first bleibt aktuelle Strategie
- [x] kein irreführendes `hreflang` ohne echte Locale-URLs
- [ ] bei echten Übersetzungs-URLs: gegenseitige hreflang-Sets + locale-spezifische Canonicals

## 11. GenAI / AI Search
- [x] keine parallele „GEO“-Shadow-Architecture
- [x] klassische SEO-/Helpful-Content-Basis bleibt Grundlage
- [ ] Search Console GenAI Report als Evidence Stream anbinden
- [ ] AI-Visibility regelmäßig gegen Business-/Search-KPIs korrelieren
- [ ] Preferred Sources nur bei tatsächlich relevanter Publisher-/News-Surface prüfen

## 12. Monthly Roadmap Review
- [ ] KPI-Delta seit letztem Review
- [ ] neue/entfallene Google Search Features prüfen
- [ ] Impact/Effort/Dependencies neu bewerten
- [ ] Content Decay und technische Regressionen aufnehmen
- [ ] höchstens zwei unmittelbar priorisierte Folgeaktionen ausgeben

## 13. Provider / Governance Gates
- [ ] Search Console Read: `NOT ENABLED` bis echte Credentials/Connection vorhanden
- [ ] GA4 Read: nur echte Data-API/MCP-Evidence als PASS
- [x] Read-/Write-Plane getrennt (ESS-0014)
- [x] CookieHub bleibt Consent Source of Truth
- [x] externe Google-Write-/Publish-/IAM-Mutationen nicht durch SEO-Roadmap autorisiert

## 14. Repository Correlation
- [x] current repository `capital-ai-online/Finance`
- [x] synchronisierte Baseline `main@12c9e129c7302df0d1bce7640cd7888f0998b9ca`
- [x] 20 Main-Commits seit Approval-base `7e5f783c…` geprüft: keine der drei SEO-Dateien geändert
- [x] current `/AGENTS.md` Control Plane 2.9.0 erneut gelesen; Approval-Envelope v3.4 weiterhin anwendbar
- [x] offener PR #882 geprüft: `.mcp.json` + Security-Validator/Test, kein Changed-File-/semantischer/Namespace-/Authority-/Security-Overlap mit SEO
- [x] SEO-Branch bleibt auf drei SEO-Dokumente begrenzt
