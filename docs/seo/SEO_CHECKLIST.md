# 🔍 SEO Checklist & Technical Discovery Guide
**Project:** CAPITAL-AI  
**Stand:** 11.09.2026 — Programm-Roadmap **SEO-GM-ROADMAP-0002.16**  
**Korrelationsbasis:** `main@eab5750a481fd68e93a41c409b561dabc4dcbf13`  
**Repository:** `capital-ai-online/Finance`  
**GOOGLE_VISIBLE_PASS:** **NOT ENABLED / nicht frisch gelesen**

## 1. Crawling & Indexierung
- [x] robots.txt / sitemap.xml Repository-Baseline vorhanden
- [x] canonical + Trailing-Slash-Normalisierung vorhanden
- [x] echte 404 für unbekannte URLs vorhanden
- [x] **SoTA Handoff spezifiziert:** Public-Route-Inventar = Sitemap = Canonical-/Prerender-/Server-Allowlist als deterministisches Regression-Gate — `SEO_TECH_GATE_SCHEMA_HANDOFF_2026-09-11.md`
- [ ] Owner-Implementierung beweist exakte Set-Gleichheit von `routeSeo`, Sitemap, Prerender und `PUBLIC_SPA_PATHS`
- [ ] keine widersprüchlichen Canonicals vor/nach JavaScript-Rendering
- [ ] Sitemap enthält ausschließlich kanonische, indexierbare HTTP-200-URLs
- [ ] robots blockiert keine für Rendering/Indexierung nötigen First-party-Ressourcen
- [ ] Application-only Routen (`/login`, `/dashboard`, `/media-studio`) gelangen nie in Sitemap/Public-Prerender

## 2. Search Console + GA4 Measurement
- [x] reproduzierbarer GSC-/GA4-Read-Vertrag materialisiert — `SEO_METRICS_AI_VIS_READ_BASELINE_2026-09-11.md`
- [ ] read-only GSC-Snapshot: Clicks, Impressions, CTR, Queries, Pages, Country, Device — `READ_BLOCKED_NOT_CONNECTED`
- [ ] GA4 Organic Search Sessions / Key Events / Landingpages aus echter Read-Evidence — `READ_BLOCKED_NOT_CONNECTED`
- [x] GSC/GA4-Korrelationsregel definiert: Trends gemeinsam bewerten; absolute Zahlen nicht künstlich angleichen
- [ ] Search Console Generative-AI Performance Report lesen — `READ_BLOCKED_NOT_CONNECTED`
- [x] `NO_DATA` wird nicht aus fehlender Verbindung abgeleitet; Providerzustände `NOT_CONNECTED`, `NOT_AUTHORIZED`, `REPORT_UNAVAILABLE`, `NO_DATA_VERIFIED`, `READ_VERIFIED` getrennt
- [x] keine synthetischen Rankings, Traffic-, Conversion- oder GenAI-Werte

## 3. Structured Data / SERP Features
- [x] JSON-LD Organization/WebSite/SoftwareApplication Baseline vorhanden
- [x] Schema-Lifecycle-Handoff mit parsebaren Graph-/Referenz-/Version-/Canonical-Gates spezifiziert — `SEO_TECH_GATE_SCHEMA_HANDOFF_2026-09-11.md`
- [ ] dedizierter Owner-Test parst JSON-LD und validiert den vollständigen beabsichtigten Graph
- [ ] Markup nach Template-/Schema-Änderungen erneut validieren
- [ ] `SoftwareApplication.softwareVersion` bleibt gleich `package.json#version`
- [ ] `publisher`-Referenzen lösen innerhalb des Graphen auf
- [ ] Structured Data nur bei sichtbarem, echtem Inhalt einsetzen
- [ ] Product/Article/Video/etc. nur bei passender Surface
- [x] `FAQPage` **nicht** als künftiges Google-Rich-Result-Ziel führen (2026 deprecated)
- [ ] Post-Deploy Rich-Results-/URL-Inspection-Evidence dokumentieren, ohne Erscheinungsgarantie zu behaupten

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
- [x] Generative-AI-Read-Vertrag als eigener Evidence Stream spezifiziert
- [ ] Search Console Generative-AI Report aus echter authentifizierter Read-Evidence lesen — `READ_BLOCKED_NOT_CONNECTED`
- [ ] AI-Visibility regelmäßig gegen Business-/Search-KPIs korrelieren
- [ ] Preferred Sources nur bei tatsächlich relevanter Publisher-/News-Surface prüfen

## 12. Monthly Roadmap Review
- [ ] KPI-Delta seit letztem Review
- [ ] neue/entfallene Google Search Features prüfen
- [ ] Impact/Effort/Dependencies neu bewerten
- [ ] Content Decay und technische Regressionen aufnehmen
- [ ] höchstens zwei unmittelbar priorisierte Folgeaktionen ausgeben

## 13. Provider / Governance Gates
- [ ] Search Console Read: `READ_BLOCKED_NOT_CONNECTED` bis echte least-privileged Connection vorhanden
- [ ] GA4 Read: `READ_BLOCKED_NOT_CONNECTED` in dieser Chat-Execution; nur echte Data-API/MCP-Evidence als PASS
- [x] Repository `.mcp.json` enthält gepinnte GA4-MCP-Executable-Identität; Config != Provider-PASS
- [x] Read-/Write-Plane getrennt (ESS-0014)
- [x] CookieHub bleibt Consent Source of Truth
- [x] externe Google-Write-/Publish-/IAM-Mutationen nicht durch SEO-Roadmap autorisiert

## 14. Repository Correlation
- [x] current repository `capital-ai-online/Finance`
- [x] synchronisierte Arbeitsbaseline `main@eab5750a481fd68e93a41c409b561dabc4dcbf13`
- [x] current `/AGENTS.md` Control Plane **2.10.0** vollständig gelesen
- [x] PR #883 Human-gemerged; SEO-GM-ROADMAP-0002.16 liegt auf main
- [x] offener PR #887 geprüft: ausschließlich Security Roadmap/Evidence; kein SEO Changed-File-/Authority-Overlap
- [x] ADR-0035, ESS-0014, ADR-0082 und ADR-0084 für den aktuellen Scope korreliert
- [x] konkrete Tech-Gate-Lücke bestätigt: mehrere parallele Public-Route-Literalflächen, bestehender Test deckt nur `routeSeo ↔ sitemap` ab
- [x] konkrete Schema-Lücke bestätigt: JSON-LD vorhanden, aber kein dedizierter vollständiger Graph-Lifecycle-Test gefunden
- [x] produktive FE/OPS-Änderungen an der Ownership-Grenze beendet
