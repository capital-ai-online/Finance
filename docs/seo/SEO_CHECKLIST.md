# 🔍 SEO Checklist & Technical Discovery Guide
**Project:** CAPITAL-AI  
**Stand:** 22.09.2026 — Post-PR #1253 Content-Quality/Review-Korrelation  
**Korrelationsbasis:** `main@93893ab46cc0753dc4e86cd7d6120d321bc48651`  
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
- [ ] Search Console Generative-AI Report aus echter authentifizierter Read-Evidence lesen — `NOT RUN / CONDITION_GATED`
- [ ] AI-Visibility regelmäßig gegen Business-/Search-KPIs korrelieren
- [ ] Preferred Sources nur bei tatsächlich relevanter Publisher-/News-Surface prüfen

## 12. Monthly Roadmap Review
- [x] Review-Snapshot 2026-09-22 materialisiert — `WP_SEO_LAUNCH_01_CONTENT_QUALITY_REVIEW_2026-09-22.md`
- [ ] KPI-Delta seit letztem Review — echte GSC/GA4 Performance-Reads weiterhin nicht verfügbar
- [ ] neue/entfallene Google Search Features prüfen — provider-read gated
- [x] Impact/Effort/Dependencies neu bewertet — unmittelbar priorisiert: OPS #1258 Root-HTML-Verifikation und OPS #1252 FAQ-Public-Route-Prerequisite
- [x] aktuelle technische Regression/Evidence-Lücke aufgenommen — externer Root-Crawl weicht von CURRENT_MAIN-Metadaten ab; OPS #1258 verifiziert Production vs Cache/Deploy
- [x] genau zwei unmittelbare Folgeaktionen dokumentiert; FINTECH #1254 bleibt fachliche Folgeabhängigkeit ohne vorgezogene Publikationsfreigabe

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

- PR #1253 Human/CODEOWNER-gemergt; CURRENT_MAIN = `93893ab46cc0753dc4e86cd7d6120d321bc48651`.
- Einziger offener fremder Writer bei Branch-Erstellung: SEC PR #1257; kein Changed-File-Overlap mit diesem SEO-Dokumentationsslice.
- Kanonische indexierbare Repository-Route-/Sitemap-Menge bleibt sechs URLs; `/faq` bleibt bis OPS #1252 bewusst außerhalb des Public-SEO-Sets.
- Externer Root-Crawl zeigte ältere Metadaten als CURRENT_MAIN; Status = `EXTERNAL_CRAWL_METADATA_DIVERGENCE / OPS_VERIFY_1258`, nicht Production-Failure.
- Pilot Brief #02 = `MERGED_SOURCE_BRIEF / NOT_PUBLISHED`; FINTECH #1254 bleibt Domain-Truth-Gate.
- GSC Search Analytics / GA4 / GenAI = weiterhin echte Provider-Read-Gates; keine synthetischen Werte.

## 14. Repository Correlation
- [x] current repository `capital-ai-online/Finance`
- [x] synchronisierte Arbeitsbaseline `main@afa259fc786479386a6ea0e165c3d8dc3363aae8`
- [x] Provider-Evidence wurde auf `main@b95f9b74a01b6d0e1228a8d5291b0fb54ea80489` erzeugt; danach wurde PR #981 Human-gemergt und änderte ausschließlich `docs/projects/social-media/ROADMAP.md`, ohne SEO-/MCP-/Google-Read-Semantik zu verändern
- [x] current `/AGENTS.md` Control Plane **2.11.0** vollständig gelesen; PR #981 änderte die Trust Root nicht
- [x] `CAPITAL-AI-SEO` / `docs/projects/seo/` / Primary Owner `CAPITAL-AI-SEO`; cross-cutting, kein produktives PVC
- [x] unmittelbar vor Final-Correlation keine offenen Pull Requests auf GitHub
- [x] historische Claim `SEO-D-BLOCK-2026-08-15` verweist auf Checklist/Runbook, aber der dort genannte Branch existiert nicht mehr; kein reproduzierbarer aktiver Writer
- [x] PR #954 Human-gemerged; Codex-MCP-Hostvertrag liegt auf main
- [x] PR #959 Human-gemerged; SEO-Automation ist lane-spezifisch wieder in der Roadmap-Ausführung aktiv
- [x] PR #893 Human-gemerged; Public-Route-Regression liegt auf current main; PR-head CI/Governance/Container-Security waren erfolgreich
- [x] PR #894 Human-gemerged; Structured-Data-Lifecycle-Regression liegt auf current main; PR-head CI/Governance/Container-Security waren erfolgreich
- [x] ADR-0035, ESS-0014, ADR-0082 und ADR-0084 bleiben für die betroffenen SEO-/Google-/Prerender-Grenzen maßgeblich; keine fremde Runtime-/Provider-Authority übernommen
- [x] CODEX-02 `PASS`, CODEX-03 `PASS`, CODEX-04 direkte STDIO MCP-Liveness `PASS`, GSC-01 `READ_VERIFIED`, SEO-CHAT-02 `VERIFIED`
- [x] `/learning-platform` als reales Providerfinding erhalten: Verdict `NEUTRAL`, Coverage `Discovered - currently not indexed`
- [x] keine Detailwerte für die übrigen vier URL-Inspection-Responses synthetisiert; belegt ist 5/5 realer Provider-Response
- [x] produktive FE/OPS-Änderungen bleiben außerhalb dieses SEO-owned Status-/Acceptance-Synchronisierungsslices
