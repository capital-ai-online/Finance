# 🔍 SEO Checklist & Technical Discovery Guide
**Project:** CAPITAL-AI  
**Stand:** 22.09.2026 — Post-PR #1260 IA/Public-Route-Korrelation  
**Korrelationsbasis:** `main@aee799282298596a5f2d9140a4e805edf52783a0`  
**Provider-Evidence-Snapshot:** `main@b95f9b74a01b6d0e1228a8d5291b0fb54ea80489`  
**Repository:** `capital-ai-online/Finance`  
**GOOGLE_VISIBLE_PASS:** **PARTIAL — GSC READ_VERIFIED + URL INSPECTION 5/5 VERIFIED; `/learning-platform` laut Google noch nicht indexiert; Search Analytics/GA4/GenAI-Metriken weiter offen**

## 1. Crawling & Indexierung
- [x] robots.txt / sitemap.xml Repository-Baseline vorhanden
- [x] canonical + Trailing-Slash-Normalisierung vorhanden
- [x] echte 404 für unbekannte URLs vorhanden
- [x] **SoTA Handoff spezifiziert:** Public-Route-Inventar = Sitemap = Canonical-/Prerender-/Server-Allowlist als deterministisches Regression-Gate — `SEO_TECH_GATE_SCHEMA_HANDOFF_2026-09-11.md`
- [x] Owner-Implementierung beweist exakte Set-Gleichheit von `routeSeo`, Sitemap, Prerender und `PUBLIC_SPA_PATHS` — Human-merged PR #893; `tests/unit/seoPublicRouteSitemap.test.ts` liegt auf current main
- [ ] keine widersprüchlichen Canonicals vor/nach JavaScript-Rendering — deployed/browser readback offen; Google URL Inspection liegt für 5/5 Sitemap-URLs vor
- [ ] Sitemap enthält ausschließlich kanonische, indexierbare HTTP-200-URLs — Repository-Set-Gleichheit belegt; frischer deployed HTTP-200 Readback offen
- [ ] robots blockiert keine für Rendering/Indexierung nötigen First-party-Ressourcen — frischer deployed Readback offen
- [x] Application-only Routen (`/login`, `/dashboard`, `/media-studio`) gelangen nie in Sitemap/Public-Prerender — durch current-main Regression abgedeckt
- [x] reale Google URL Inspection für alle 5/5 then-current Sitemap-URLs ausgeführt; jeder Aufruf lieferte einen echten Provider-Response
- [ ] `/learning-platform` indexiert — reale Google-Antwort: Verdict `NEUTRAL`, Coverage `Discovered - currently not indexed`; als Indexierungsfinding weiter offen

## 2. Search Console + GA4 Measurement
- [x] reproduzierbarer GSC-/GA4-Read-Vertrag materialisiert — `SEO_METRICS_AI_VIS_READ_BASELINE_2026-09-11.md`
- [x] Search Console Property Read: `READ_VERIFIED` für `sc-domain:capital-ai.online`; `gsc_list_sites` bestätigte `siteRestrictedUser`
- [ ] read-only GSC-Snapshot: Clicks, Impressions, CTR, Queries, Pages, Country, Device — `NOT RUN / CONDITION_GATED`; Property Read + URL Inspection ersetzen keine Search-Analytics-Abfrage
- [ ] GA4 Organic Search Sessions / Key Events / Landingpages aus echter Read-Evidence — `CONFIGURATION_NOT_OBSERVED / NOT RUN`
- [x] GSC/GA4-Korrelationsregel definiert: Trends gemeinsam bewerten; absolute Zahlen nicht künstlich angleichen
- [ ] Search Console Generative-AI Performance Report lesen — `NOT RUN / CONDITION_GATED`
- [x] `NO_DATA` wird nicht aus fehlender Verbindung abgeleitet; Providerzustände `NOT_CONNECTED`, `NOT_AUTHORIZED`, `REPORT_UNAVAILABLE`, `NO_DATA_VERIFIED`, `READ_VERIFIED` getrennt
- [x] keine synthetischen Rankings, Traffic-, Conversion- oder GenAI-Werte

## 3. Structured Data / SERP Features
- [x] JSON-LD Organization/WebSite/SoftwareApplication Baseline vorhanden
- [x] Schema-Lifecycle-Handoff mit parsebaren Graph-/Referenz-/Version-/Canonical-Gates spezifiziert — `SEO_TECH_GATE_SCHEMA_HANDOFF_2026-09-11.md`
- [x] dedizierter Owner-Test parst JSON-LD und validiert den vollständigen beabsichtigten Graph — Human-merged PR #894; `tests/unit/seoStructuredDataLifecycle.test.ts` liegt auf current main
- [x] Repository-Regression validiert das Markup nach Template-/Schema-Änderungen automatisch; deployed/provider Revalidierung bleibt separat offen
- [x] `SoftwareApplication.softwareVersion` bleibt gleich `package.json#version`
- [x] `publisher`-Referenzen lösen innerhalb des Graphen auf
- [ ] Structured Data nur bei sichtbarem, echtem Inhalt einsetzen — fachliche Surface-Prüfung bleibt bei jeder Erweiterung erforderlich
- [ ] Product/Article/Video/etc. nur bei passender Surface — aktuell nicht Teil des beabsichtigten Top-Level-Graphen; künftige Erweiterungen owner-/surface-spezifisch prüfen
- [x] `FAQPage` **nicht** als künftiges Google-Rich-Result-Ziel führen (2026 deprecated); aktuelle Regression schließt `FAQPage` aus
- [x] URL-Inspection-Evidence für alle 5/5 Sitemap-URLs liegt als echte Providerantwort vor; Rich-Results-/Mobile-/Canonical-Detailfelder werden nur dort als belegt behandelt, wo sie im jeweiligen Google-Response tatsächlich zurückgegeben wurden

## 4. Content / Topic System
- [x] Seed Topic Map in 0002.16 angelegt
- [x] Content-Brief-Contract: Intent, Ziel-URL, first-party Evidence, Who/How/Why, Reviewer, interne Links, Media, Messgröße, Refresh-Gate
- [ ] echte GSC-/Keyword-Daten zur Priorisierung einlesen — Property Read und URL Inspection allein reichen dafür nicht
- [x] erstes Pilot-Brief nach Business Value + Search Intent + Evidence priorisieren — Brief #01 vorhanden; Brief #02 evidence-first Multi-Asset Scoring in PR #1253 gemergt, fachliche Veröffentlichung weiter auf FINTECH #1254 gegatet
- [ ] Content Decay / Cannibalization / Merge-Refresh-Prune-Backlog aus echten Daten

## 5. Helpful Content / Spam Guardrails
- [x] **Fresh 2026-09-22 repository review:** canonical Sitemap/Route-SEO bleibt auf sechs öffentliche URLs begrenzt; die inspizierten SEO-Artefakte erzeugen keine massenhaften Query-/Keyword-Variant-Routen
- [x] Launch-Briefs #01/#02 führen Quellen-/Evidence-/Reviewer-/Disclosure-Grenzen und enthalten keine erfundenen Ranking-, Traffic-, Conversion- oder Performance-Beweise
- [ ] externer/public-web Content-Quality-PASS bleibt separat provider-/runtime-gated; Repository-Guardrails allein sind kein Crawl-/Index-/Search-PASS
- [x] kein scaled-content abuse
- [x] kein Cloaking
- [x] keine Doorway-/Query-Variant-Massenseiten
- [x] keine manipulativen Linkschemata
- [x] kein Site-Reputation-Abuse
- [x] AI-Unterstützung nur mit hilfreichem, originellem, fachlich geprüftem Ergebnis
- [x] kein `llms.txt` als Pflicht-/Ranking-Hack

## 6. Internal Linking / IA
- [x] Public-URL-Inventar vollständig — sechs kanonische SEO-Routen sind in routeSeo/Sitemap/Prerender/Public-Server-Set gleich
- [ ] keine Orphan-/Reachability-Drift — `/universe` ist kanonische SEO-/Server-Route, fehlt aber im aktuellen hydrierten `AppRoutes`-Router; FE #1263
- [ ] beschreibende, kontextuelle Anchor-Texte — sichtbare Root-Navigation zu `/universe` und `/learning-platform` fehlt; Prerender-Noscript allein schließt den UX/IA-Gap nicht
- [ ] H1/H2-Struktur pro indexierbarer Seite konsistent — für `/universe` erst nach Client-Route-Konvergenz wieder als same-route Runtime-Evidence wertbar
- [ ] Navigation und interne Links führen zu kanonischen URLs — FE #1263 ist owner-korrekter Handoff
- [x] `/faq` wird trotz sichtbarer UI-Verlinkung nicht voreilig als indexierbare SEO-Route behandelt; OPS #1252 → SEO #1233 bleibt fail-closed

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
- [ ] Search Console Generative-AI Report aus echter authentifizierter Read-Evidence lesen — `NOT RUN / CONDITION_GATED`
- [ ] AI-Visibility regelmäßig gegen Business-/Search-KPIs korrelieren
- [ ] Preferred Sources nur bei tatsächlich relevanter Publisher-/News-Surface prüfen

## 12. Monthly Roadmap Review
- [x] Review-Snapshot 2026-09-22 materialisiert — `WP_SEO_LAUNCH_01_CONTENT_QUALITY_REVIEW_2026-09-22.md`
- [ ] KPI-Delta seit letztem Review — echte GSC/GA4 Performance-Reads weiterhin nicht verfügbar
- [ ] neue/entfallene Google Search Features prüfen — provider-read gated
- [x] Impact/Effort/Dependencies neu bewertet — unmittelbar priorisiert: FE #1263 `/universe` Client-Routing/visible IA und OPS #1252 FAQ-Public-Route-Prerequisite
- [x] aktuelle technische Regression/Evidence-Lücke aufgenommen — `/universe` bleibt kanonische SEO-/Server-Route, ist aber im hydrierten Client-Router nicht geroutet; FE #1263. OPS #1258 bleibt separate Root-HTML-Verifikation.
- [x] genau zwei unmittelbare Folgeaktionen dokumentiert; OPS #1258 und FINTECH #1254 bleiben owner-korrekte Folgeabhängigkeiten ohne vorgezogene PASS-/Publikationsfreigabe

## 13. Provider / Governance Gates
- [x] Search Console Property Read: `READ_VERIFIED` auf realem Codex-Cloud-Host über direkten STDIO-MCP-Pfad; `sc-domain:capital-ai.online` gefunden
- [x] Search Console URL Inspection: `SEO-CHAT-02 = VERIFIED`; 5/5 then-current kanonische Sitemap-URLs lieferten echte Google-Responses
- [x] MCP Prozess-/Protokoll-Liveness: `PASS` via `gsc_mcp_server_ping` → `pong`; native Codex-Cloud-MCP-Tool-Injection bleibt separat `NOT_VERIFIED`
- [ ] GA4 Read: `CONFIGURATION_NOT_OBSERVED / NOT RUN`; GSC-PASS darf keinen GA4-PASS implizieren
- [x] Repository `.mcp.json` / Codex-Hostvertrag hält die gepinnte Google-MCP-Executable-Identität; Config != Provider-PASS
- [x] Read-/Write-Plane getrennt (ESS-0014)
- [x] Consent Source of Truth und Analytics-/AdSense-Grenzen bleiben durch die then-current Privacy-/Consent-Authority bestimmt; Human-merged PR #961 konkretisiert den datensparsamen Consent-Nachweis als Design/Evidence-Handoff, ohne diese SEO-Synchronisierung zu einer Consent- oder Provider-Mutation zu erweitern
- [x] externe Google-Write-/Publish-/IAM-Mutationen nicht durch SEO-Roadmap autorisiert
- [x] Credential-Verzeichnis `~/.capital-ai` Mode `0700`; GSC-Credential-Datei Mode `0600`; Inhalte/`private_key`/`client_email` im Providerlauf weder gelesen noch ausgegeben

### Current continuation correlation — 2026-09-22

- PR #1260 Human/CODEOWNER-gemergt; Fresh CURRENT_MAIN = `aee799282298596a5f2d9140a4e805edf52783a0`.
- Einziger offener Writer bei Branch-Erstellung: OPS PR #1262; kein Changed-File-Overlap mit diesem SEO-Dokumentationsslice.
- Kanonische indexierbare Repository-Route-/Sitemap-Menge bleibt sechs URLs; `/faq` bleibt bis OPS #1252 bewusst außerhalb des Public-SEO-Sets.
- `/universe` hat einen neuen launch-blockierenden IA/Runtime-Befund: routeSeo/Sitemap/Prerender/Public-Server enthalten die Route, `AppRoutes.tsx` aber nicht. FE #1263 ist der owner-korrekte Handoff.
- Root-Metadaten sind auf CURRENT_MAIN source-seitig konsistent; OPS #1258 bleibt für den zuvor beobachteten externen Production-/Crawl-Mismatch offen.
- Pilot Brief #02 = `MERGED_SOURCE_BRIEF / NOT_PUBLISHED`; FINTECH #1254 bleibt Domain-Truth-Gate.
- X/Facebook production account readback = `0/0`; Wave-1 Publishing bleibt `BLOCKED_PROVIDER_ACCOUNT_IDENTITY`.
- GSC Search Analytics / current six-URL inspection / GA4 / GenAI = echte Provider-Read-Gates; keine synthetischen Werte.
- Initialer Render-Readback zeigte Drift; anschließend konvergierte Deploy `dep-dap07drtqb8s73ertcv0` auf exakt `main@aee799282298596a5f2d9140a4e805edf52783a0`. Trigger nach 261 s → `PRODUCTION_FREEZE_PASS` für diesen Snapshot; OPS #1258 bleibt separate Raw-HTML-Verifikation.

## 14. Repository Correlation
- [x] current repository `capital-ai-online/Finance`
- [x] aktuelle Arbeitsbaseline `main@aee799282298596a5f2d9140a4e805edf52783a0`
- [x] current `/AGENTS.md` Control Plane **4.8.0** gelesen; Single Trust Root bleibt maßgeblich
- [x] `CAPITAL-AI-SEO` / `docs/projects/seo/` / Primary Owner `CAPITAL-AI-SEO`; cross-cutting, kein produktives PVC
- [x] offene Writer korreliert: OPS PR #1262 ohne Changed-File-/SEO-Semantik-Overlap
- [x] PR #1204 und PR #1260 sind gemergt; deren stale active/exclusive Claims werden im aktuellen Fortsetzungsbranch freigegeben
- [x] Root-Metadaten source-seitig konsistent auf `index.html`, `routeSeo.ts` und Prerender; OPS #1258 bleibt Runtime-Verifikation
- [x] sechs kanonische SEO-Routen bleiben in routeSeo/Sitemap/Prerender/Public-Server-Inventar gleich
- [ ] `/universe` same-route Client-Reachability — FE #1263 offen
- [ ] `/faq` Public-SEO-Promotion — OPS #1252 offen, SEO #1233 blockiert
- [ ] FINTECH public-safe Scoring-Truth für Brief #02 — #1254 offen
- [x] Production exact-SHA = CURRENT_MAIN — Render `dep-dap07drtqb8s73ertcv0` live auf `aee799282298596a5f2d9140a4e805edf52783a0`, Triggerdelta 261 s; Raw-HTML bleibt separat OPS #1258
- [x] GSC historische Property-/5-URL-Inspection-Evidence bleibt getrennt von aktuellen sechs-URL/Search-Analytics-/GA4-/GenAI-Gates
- [x] keine FE/OPS/FINTECH/SOCIAL Runtime- oder Provider-Authority durch diesen SEO-Slice übernommen
