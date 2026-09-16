# 🔍 SEO Checklist & Technical Discovery Guide
**Project:** CAPITAL-AI  
**Stand:** 16.09.2026 — current-main owner-return reconciliation  
**Korrelationsbasis:** `main@0c65ebc5c9d685f29db2a3e8a9f9a44e7aa619b5`  
**Repository:** `capital-ai-online/Finance`  
**GOOGLE_VISIBLE_PASS:** **NOT RUN / CONDITION_GATED — kein frischer Google-Provider-Read in diesem Pass**

## 1. Crawling & Indexierung
- [x] robots.txt / sitemap.xml Repository-Baseline vorhanden
- [x] canonical + Trailing-Slash-Normalisierung vorhanden
- [x] echte 404 für unbekannte URLs vorhanden
- [x] **SoTA Handoff spezifiziert:** Public-Route-Inventar = Sitemap = Canonical-/Prerender-/Server-Allowlist als deterministisches Regression-Gate — `SEO_TECH_GATE_SCHEMA_HANDOFF_2026-09-11.md`
- [x] Owner-Implementierung beweist exakte Set-Gleichheit von `routeSeo`, Sitemap, Prerender und `PUBLIC_SPA_PATHS` — Human-merged PR #893; `tests/unit/seoPublicRouteSitemap.test.ts` liegt auf current main
- [ ] keine widersprüchlichen Canonicals vor/nach JavaScript-Rendering — deployed/browser/provider Evidence offen
- [ ] Sitemap enthält ausschließlich kanonische, indexierbare HTTP-200-URLs — Repository-Set-Gleichheit belegt; frischer deployed HTTP-200 Readback offen
- [ ] robots blockiert keine für Rendering/Indexierung nötigen First-party-Ressourcen — frischer deployed Readback offen
- [x] Application-only Routen (`/login`, `/dashboard`, `/media-studio`) gelangen nie in Sitemap/Public-Prerender — durch current-main Regression abgedeckt

## 2. Search Console + GA4 Measurement
- [x] reproduzierbarer GSC-/GA4-Read-Vertrag materialisiert — `SEO_METRICS_AI_VIS_READ_BASELINE_2026-09-11.md`
- [ ] read-only GSC-Snapshot: Clicks, Impressions, CTR, Queries, Pages, Country, Device — `NOT RUN / CONDITION_GATED`
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
- [ ] Search Console Generative-AI Report aus echter authentifizierter Read-Evidence lesen — `NOT RUN / CONDITION_GATED`
- [ ] AI-Visibility regelmäßig gegen Business-/Search-KPIs korrelieren
- [ ] Preferred Sources nur bei tatsächlich relevanter Publisher-/News-Surface prüfen

## 12. Monthly Roadmap Review
- [ ] KPI-Delta seit letztem Review
- [ ] neue/entfallene Google Search Features prüfen
- [ ] Impact/Effort/Dependencies neu bewerten
- [ ] Content Decay und technische Regressionen aufnehmen
- [ ] höchstens zwei unmittelbar priorisierte Folgeaktionen ausgeben

## 13. Provider / Governance Gates
- [ ] Search Console Read: `NOT RUN / CONDITION_GATED` bis ein echter least-privileged Google-Response auf dem tatsächlichen Execution Host vorliegt
- [ ] GA4 Read: `CONFIGURATION_NOT_OBSERVED / NOT RUN`; GSC-PASS darf keinen GA4-PASS implizieren
- [x] Repository `.mcp.json` / Codex-Hostvertrag hält die gepinnte Google-MCP-Executable-Identität; Config != Provider-PASS
- [x] Read-/Write-Plane getrennt (ESS-0014)
- [x] Consent Source of Truth und Analytics-/AdSense-Grenzen bleiben durch die then-current Privacy-/Consent-Authority bestimmt; Human-merged PR #961 konkretisiert den datensparsamen Consent-Nachweis als Design/Evidence-Handoff, ohne diese SEO-Synchronisierung zu einer Consent- oder Provider-Mutation zu erweitern
- [x] externe Google-Write-/Publish-/IAM-Mutationen nicht durch SEO-Roadmap autorisiert

## 14. Repository Correlation
- [x] current repository `capital-ai-online/Finance`
- [x] synchronisierte Arbeitsbaseline `main@0c65ebc5c9d685f29db2a3e8a9f9a44e7aa619b5`
- [x] current `/AGENTS.md` Control Plane **2.11.0** vollständig gelesen; die Main-Drifts durch PR #960/#961 änderten `/AGENTS.md` und die SEO-Authority-Surfaces nicht
- [x] PR #954 Human-gemerged; Codex-MCP-Hostvertrag liegt auf main
- [x] PR #959 Human-gemerged; SEO-Automation ist lane-spezifisch wieder in der Roadmap-Ausführung aktiv
- [x] PR #960 Human-gemerged; BB-2E änderte ausschließlich FE-/FE-Test-Surfaces und wurde in den SEO-Branch resynchronisiert
- [x] PR #961 Human-gemerged; Consent-Evidence-Design änderte ausschließlich Compliance-Dokumente, wurde semantisch auf Analytics/Consent korreliert und anschließend in den SEO-Branch resynchronisiert
- [x] PR #893 Human-gemerged; Public-Route-Regression liegt auf current main; PR-head CI/Governance/Container-Security waren erfolgreich
- [x] PR #894 Human-gemerged; Structured-Data-Lifecycle-Regression liegt auf current main; PR-head CI/Governance/Container-Security waren erfolgreich
- [x] offene Fremd-PRs #962 (Operations) und #963 (Governance) geprüft; kein Changed-File-/Owner-/Authority-Overlap mit diesem SEO-Dokument-Slice
- [x] ADR-0035, ESS-0014, ADR-0082 und ADR-0084 bleiben für die betroffenen SEO-/Google-/Prerender-Grenzen maßgeblich; keine fremde Runtime-/Provider-Authority übernommen
- [x] frühere Tech-Gate-Lücke „nur routeSeo ↔ sitemap“ ist durch PR #893 als Repository-Regression geschlossen; deployed/browser/provider Acceptance bleibt offen
- [x] frühere Schema-Lücke „kein dedizierter vollständiger Graph-Lifecycle-Test“ ist durch PR #894 als Repository-Regression geschlossen; generated-output/provider Acceptance bleibt offen
- [x] produktive FE/OPS-Änderungen bleiben außerhalb dieses SEO-owned Status-/Acceptance-Synchronisierungsslices
