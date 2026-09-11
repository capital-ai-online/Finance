# CAPITAL-AI SEO + Google Marketing — Konsolidierte Programm-Roadmap

## Document ID

**SEO-GM-ROADMAP-0002**

## Status

**ACTIVE — CANONICAL EXECUTION ROADMAP (Domain SEO / Google Marketing / Content Distribution)**  
Stand: 2026-09-11  
Version: **0002.16**  
Current-main correlation: `main@12c9e129c7302df0d1bce7640cd7888f0998b9ca`  
Working branch: `agent/seo-roadmap-sota-20260910`  
Repository: `capital-ai-online/Finance`  
Owner: SvenKulessa / `CAPITAL-AI-SEO` project coordination  
Primary productive PVC: **N/A — cross-cutting; no productive PVC ownership**  
Authority-Bindung: current `/AGENTS.md`, anwendbare Accepted ADR / aktive ESS. Diese Roadmap erzeugt keine Mutationsberechtigung.

> **0002.16 Owner-directed reopening.** Der mit 0002.15 geschlossene damalige SEO-Dokumentationsscope bleibt historisch korrekt. Die Owner-Anweisung vom 2026-09-07 eröffnet einen neuen, begrenzten Work Item: State-of-the-Art-SEO-Roadmap gegen current `main` korrelieren, fehlende Features aufnehmen und alle Arbeitspakete mindestens bis zu ihrer zulässigen Ownership-/Credential-Grenze starten. Nach Übertragung derselben Repository-Instanz auf `capital-ai-online/Finance` wird dieser Scope auf current main neu materialisiert. Produktive FE/OPS/GOV/COMP-Änderungen werden nicht in SEO-Ownership gezogen.

## Zweck

Ein einziger priorisierter SEO-/Google-Marketing-Ausführungsplan mit Task, Owner, Abhängigkeit, Impact/Effort, Messgröße und Exit Gate. Keine zweite Roadmap-Autorität, keine erfundenen Provider-PASS-Werte und keine stillschweigende Runtime-/Publishing-/IAM-Autorität.

---

## 1. Authority- und Ownership-Reihenfolge

1. current `/AGENTS.md` und höhere Authority;
2. Project Value Chain / Primary Owner;
3. anwendbare Accepted ADR / aktive ESS;
4. diese Roadmap für SEO/Google-Marketing-Planung;
5. `docs/seo/**` Runbooks, Checklists, Evidence;
6. historische Claims und ältere Roadmap-Stände.

`CAPITAL-AI-SEO` besitzt keinen produktiven `PVC-*`. Frontend bleibt `CAPITAL-AI-FE`, Render/Deploy/IAM bleibt `CAPITAL-AI-OPS`, Publishing-Control bleibt `CAPITAL-AI-GOV`, Rechts-/Compliance-Bewertung bleibt `CAPITAL-AI-COMP`.

Für Google-Marketing gelten zusätzlich ESS-0014 und ADR-0035: Read-/Write-Plane bleiben getrennt, CookieHub bleibt Consent Source of Truth, Provider-Konfiguration ist kein Provider-PASS und externe Mutationen bleiben separat autorisiert.

---

## 2. State-of-the-Art-Referenzrahmen — advisory only

Die folgenden externen Quellen wurden am 2026-09-07 als aktuelle Best-Practice-Eingabe korreliert. Sie sind **advisory only** und überschreiben keine CAPITAL-AI-Authority.

| Quelle | Relevantes Roadmap-Feature |
|---|---|
| Google Search Central — Generative-AI-Optimierung, aktualisiert 2026-07-10 (`developers.google.com/search/docs/fundamentals/ai-optimization-guide`) | klassische SEO-Basis bleibt Grundlage; einzigartige, hilfreiche, nicht-kommodifizierte Inhalte; hochwertige Bilder/Videos; keine speziellen „GEO-Hacks“ oder unnötiges `llms.txt` |
| Google Search Console — Generative-AI-Performance-Reports, global ausgerollt bis 2026-08-31 (`developers.google.com/search/blog/2026/06/gen-ai-performance-reports`) | GenAI-Visibility als eigener messbarer KPI-Stream |
| Google Search Central — Search Console + GA4 (`developers.google.com/search/docs/monitor-debug/google-analytics-search-console`) | GSC als Search-Performance-Quelle, GA4 als On-site-Behavior-Quelle; Trends gemeinsam, absolute Zahlen nicht gleichsetzen |
| Google Search Central — Canonicalization, aktualisiert 2026-08 (`developers.google.com/search/docs/crawling-indexing/canonicalization`) | Redirect, Sitemap und `rel=canonical` konsistent; Canonical bleibt Signal/Hint, kein erzwungener Google-Entscheid |
| Google Search Central — 2026 Updates (`developers.google.com/search/updates`) | FAQ-Rich-Result ab 2026-05-07 deprecated; JS-Canonical-Konsistenz, bevorzugte Bilder und Preferred Sources aktualisiert |
| web.dev — Core Web Vitals (`web.dev/articles/vitals`) | p75: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1; Mobile/Desktop getrennt beobachten |
| Semrush SEO Roadmap, 2025 (`semrush.com/blog/seo-roadmap/`) | Ziele/KPIs, Audit, On-page, Content/Keyword Gap, Backlinks, Impact/Effort, Milestones, Owner, regelmäßige Revision |
| Ahrefs SEO Roadmap / Plan Template (`ahrefs.com/blog/seo-roadmap/`, `ahrefs.com/blog/seo-plan-template/`) | 6–12-Monats-Living-Roadmap, kleine Tasks, Dependencies, Keyword/Content/Links/Tracking |

### Daraus übernommene Roadmap-Mechanik

Jedes neue WP führt mindestens: **Owner**, **Status**, **Impact**, **Effort**, **Abhängigkeiten**, **Messgröße/Evidence** und **Exit Gate**. Monatliche Repriorisierung erfolgt datenbasiert; kein WP wird allein wegen Alter oder bereits investierter Arbeit priorisiert.

---

## 3. Current-main Baseline — 2026-09-11

### 3.1 Technical SEO / SeoEngine

| WP | Status | Evidence / Gate |
|---|---|---|
| Q1 robots + sitemap + Harden | **IMPLEMENTED_ON_MAIN + zuletzt live verifiziert 2026-09-06** | PR #760; fünf kanonische URLs inkl. `/learning-platform`; Regression `tests/unit/seoPublicRouteSitemap.test.ts` |
| Q2 canonical + trailing slash | **IMPLEMENTED_ON_MAIN** | Route-SEO + Server-Normalisierung; frischer Provider-Smoke in diesem Pass nicht ausgeführt |
| Q3 Search Console Verify | **HISTORICAL_PROVIDER_EVIDENCE** | Domain `capital-ai.online`; kein frischer GSC-Read in diesem Pass |
| Q4 Checklist | **CURRENT IN THIS BRANCH** | `docs/seo/SEO_CHECKLIST.md` |
| Q5 og:image | **IMPLEMENTED_ON_MAIN** | first-party `public/og-image.svg` |
| D1 JSON-LD | **IMPLEMENTED_ON_MAIN** | Organization/WebSite/SoftwareApplication |
| D2 route titles/meta | **IMPLEMENTED_ON_MAIN** | `src/lib/routeSeo.ts` |
| D3 Soft-404 | **IMPLEMENTED_ON_MAIN** | unknown -> 404 |
| D4 Bundle / CWV | **OPEN — FE-OWNED** | FE-Roadmap führt p75 LCP/INP/CLS-Ziele; SEO verknüpft nur Mess-/Exit-Gate |
| D5 Search Console Read | **NOT ENABLED** | Runbook vorhanden; Credential-/Provider-Gate |
| S1 SeoEngine | **VERIFIED** | ADR-0082 |
| S2 Prerender | **VERIFIED** | ADR-0084 |
| S3 Dashboard | **IMPLEMENTED_ON_MAIN** | Admin SEO dashboard |
| S4 Sprache / hreflang | **SPEC COMPLETE / CONDITIONAL** | German-first; kein produktives `hreflang` ohne reale Locale-URLs |

### 3.2 Google / Consent / Measurement

| Thema | Status | Gate |
|---|---|---|
| GA4 Browser-ID | zuletzt live beobachtet | kein Data-API-PASS in diesem Pass |
| GA4 MCP / Realtime | **NOT ENABLED / nicht neu verifiziert** | ESS-0014 Read-Plane |
| Search Console MCP / API Read | **NOT ENABLED** | Credential-/Provider-Gate |
| Consent Mode v2 | bestehende CookieHub-Invariante | kein neuer Pre-Opt-in-Trace in diesem Pass |
| `GOOGLE_VISIBLE_PASS` | **NOT ENABLED** | keine frische Search-Console-/SERP-Evidence in diesem Pass |
| GenAI Search visibility | **BASELINE NOT YET READ** | neuer Search-Console-GenAI-Report; Credential-Gate |

### 3.3 Repository-Correlation

- Repository: `capital-ai-online/Finance` — dieselbe Repository-Instanz wurde vom früheren Owner-Pfad `SvenKulessa/Finance` übertragen.
- Final synchronisierte Baseline dieses Work Items: `main@12c9e129c7302df0d1bce7640cd7888f0998b9ca`.
- Seit Approval-base `main@7e5f783caa6cb33bca8346582b31ddda33258ed9` wurden 20 Commits auf main integriert; keine der drei SEO-Dateien dieses Work Items wurde dabei verändert.
- Current `/AGENTS.md` bleibt Control Plane 2.9.0 und wurde vor PR-Erstellung erneut gelesen. Die Approval-Envelope-v3.4-Semantik erlaubt die Fortgeltung der Owner-Freigabe bei nachgewiesener materieller Payload-Äquivalenz und frischer PASS-Korrelation.
- Open PR #882 ändert `.mcp.json`, `scripts/security/validateMcpExecutableIdentity.mjs` und `tests/unit/mcpExecutableIdentity.test.ts`; kein SEO Changed-File-, semantischer, Namespace-, Authority- oder Security-Overlap.
- Current Project: `CAPITAL-AI-SEO`; Project Folder: `docs/projects/seo/`; Primary productive PVC: `N/A`; Primary Owner: `CAPITAL-AI-SEO`.
- FE-Performance-Authority bleibt in der Frontend-Roadmap; SEO führt keine zweite CWV-Implementierungsroadmap.

---

## 4. Priorisierungsmodell

### Impact

- **H** — direkt crawl/index/visibility/data-integrity/blocking.
- **M** — relevante Optimierung mit indirekter oder verzögerter Wirkung.
- **L** — optional/experimentell, ohne aktuellen Blocker.

### Effort

- **S** — <= 2 PT bzw. kleines Dokument-/Konfigurationspaket.
- **M** — mehrere Komponenten/Owner oder messbare Implementierung.
- **L** — Architektur/Content-Programm/Provider-Integration mit mehreren Abhängigkeiten.

### Status

- `STARTED` — im aktuellen SEO-Branch wurde ein konkreter Artefakt-/Baseline-Schritt umgesetzt.
- `STARTED_AT_BOUNDARY` — SEO-Anforderung/Exit Gate ist umgesetzt; produktive Umsetzung liegt bei einem anderen Primary Owner.
- `STARTED_AT_GATE` — Spezifikation/Baseline ist umgesetzt; Credentials/Provider/Owner-Freigabe blockieren den nächsten Schritt.
- `CONDITIONAL` — erst nach Eintritt einer dokumentierten Voraussetzung sinnvoll.

---

## 5. State-of-the-Art Work Packages

| WP | Ziel | Primary Owner / Route | Impact | Effort | Status in 0002.16 | Exit Gate |
|---|---|---|---|---|---|---|
| `WP-SEO-METRICS` | KPI-Baseline aus GSC + GA4: Clicks, Impressions, CTR, Queries, Landingpages, Organic Sessions/Conversions; Differenzen erklärbar statt „gleichgerechnet“ | SEO coordination; Owner credentials; ESS-0014 | H | M | **STARTED_AT_GATE** | reproduzierbarer Read-Snapshot + KPI-Baseline; keine synthetischen Werte |
| `WP-SEO-AI-VIS` | GenAI Search / AI Overview / AI Mode Visibility im neuen Search-Console-Report messen | SEO coordination; GSC read credentials | H | S | **STARTED_AT_GATE** | GenAI-Impressions/Clicks bzw. dokumentiertes „keine Daten“ aus echter GSC-Evidence |
| `WP-SEO-TECH-GATE` | Crawl-/Index-Release-Gate: Public-Route = Sitemap = Canonical-Allowlist; 404/redirect/noindex/JS-canonical-Konsistenz | SEO requirements; FE/OPS productive implementation | H | M | **STARTED_AT_BOUNDARY** | automatisierbare Prüfung + Owner-implementierte Regression; keine Canonical-/Sitemap-Drift |
| `WP-SEO-SCHEMA` | Structured-Data-Lifecycle: unterstützte Typen, initial HTML wo sinnvoll, Validierung nach Template-Changes, Search-Console-Fehlertrend | SEO requirements; FE implementation | H | M | **STARTED_AT_BOUNDARY** | valide, inhaltsgetreue Markups; D1-Baseline dokumentiert; FAQ-Rich-Result nicht als Ziel geführt |
| `WP-SEO-CWV` | CWV als SEO-/UX-Gate mit p75 LCP <=2.5 s, INP <=200 ms, CLS <=0.1, Mobile/Desktop getrennt | `CAPITAL-AI-FE` | H | L | **STARTED_AT_BOUNDARY** | FE-Evidence erfüllt p75-Ziele; SEO übernimmt nur Ergebnis/Trend |
| `WP-SEO-TOPICS` | Keyword-/Topic-Map nach Intent, Brand-Relevanz, Business Value, Traffic-Potential und Content Gap | `CAPITAL-AI-SEO` | H | M | **STARTED** | priorisierte Topic Map mit Existing/New URL, Intent, Evidence und Owner |
| `WP-SEO-CONTENT` | Helpful/non-commodity Content: eigener POV, First-party Evidence, Who/How/Why, Autor/Reviewer, Updated-Date, klare Struktur | SEO coordination; Publishing bleibt GOV | H | L | **STARTED** | Content-Brief-Contract + mindestens ein freigegebenes Pilot-Brief; keine scaled-content-Automation |
| `WP-SEO-IA` | Informationsarchitektur/interne Links: keine Orphans, klare H1/H2-Struktur, beschreibende Anchor, kanonische Pfade | SEO requirements; FE implementation | M | M | **STARTED_AT_BOUNDARY** | Public-URL-Inventar + Linkgraph/Orphan-Check; FE behebt Runtime-Lücken |
| `WP-SEO-MEDIA` | Image/Video SEO: first-party preferred image, Alt/Dateinamen, hochwertige Medien; VideoObject/Transcript nur bei echtem Video | SEO requirements; FE/SOCIAL implementation je Surface | M | M | **STARTED_AT_BOUNDARY** | bevorzugtes Bild konsistent; Media-Assets crawlbar; Video-Markup nur bei echter Medienseite |
| `WP-SEO-REFRESH` | Content Decay, Cannibalization, veraltete Seiten, Merge/Refresh/Prune-Entscheidungen | `CAPITAL-AI-SEO` | M | M | **STARTED** | monatlicher Refresh-Backlog aus echten Search-/Content-Daten |
| `WP-SEO-AUTHORITY` | relevante Backlinks/Digital PR/unlinked mentions; Qualität und Themenfit vor Volumen | SEO coordination; SOCIAL/GOV je Publish/Outreach | M | L | **STARTED_AT_BOUNDARY** | Baseline referring domains + priorisierte Outreach-Liste; keine manipulativen Linkschemata |
| `WP-SEO-SPAM` | Google-Spam-/Site-Reputation-/Scaled-Content-Guardrails für AI-gestützte Inhalte | SEO coordination; GOV/COMP bei Policy/Legal | H | S | **STARTED** | Checklist blockiert scaled content abuse, cloaking, doorway/site-reputation abuse |
| `WP-SEO-AGENT` | Browser-/Agent-Readiness: semantischer DOM, Accessibility Tree, stabile Interaktionszustände; nur wo Business Case besteht | `CAPITAL-AI-FE` | L | M | **STARTED_AT_BOUNDARY** | FE-Baseline/Tests; kein proprietärer SEO-Sonderpfad oder Crawler-Cloaking |
| `WP-SEO-I18N` | `hreflang` + locale-spezifische Canonicals erst bei echten Übersetzungs-URLs | SEO requirements; FE implementation | M | M | **CONDITIONAL** | echte Locale-URLs + gegenseitige hreflang-Sets + korrekte Canonicals |
| `WP-SEO-REVIEW` | monatliche Living-Roadmap: KPI-Delta, Search-Dokumentationsupdates, Impact/Effort und Owner-Queue neu priorisieren | `CAPITAL-AI-SEO` | H | S | **STARTED** | monatlicher Review-Eintrag mit Evidence und höchstens zwei unmittelbar priorisierten Folgeaktionen |

---

## 6. Umsetzung in diesem Branch — Start aller WPs

### 6.1 SEO-owned sofort gestartet

#### `WP-SEO-TOPICS` — Seed Topic Map

Die Seed-Liste ist **Planung**, keine Publikationsfreigabe und keine Behauptung vorhandener indexierbarer Seiten:

| Topic Cluster | Search Intent | Brand-/Business-Relevanz | Nächster SEO-Schritt |
|---|---|---|---|
| CAPITAL-AI / verifizierte Finanzanalyse | navigational + informational | sehr hoch | Brand-/Entity-Surface und Suchnachfrage aus GSC korrelieren |
| Crypto Scoring / verifizierte Signale | informational + product investigation | hoch | Query-Cluster, Intent und vorhandene produktive Surface zuordnen |
| Sentiment / Momentum / Pattern Evidence | informational | hoch | nicht-kommodifizierten Erklär-/Evidence-Content statt generischer „Tipps“ planen |
| Buffett Value Check / Value Investing | informational + product investigation | hoch | Suchintention gegen produktive Surface und FINTECH-Evidence abgleichen |
| Screening / Ranking / Decision Support | informational + product investigation | hoch | canonical Ranking-/Screening-Surface identifizieren; keine Ranking-Versprechen erfinden |
| Learning Platform / Finanzbildung | informational | hoch | `/learning-platform` als bestehende kanonische URL in Content- und Internal-Link-Plan aufnehmen |
| Data Provenance / Freshness / Verified Scores | informational + trust | mittel/hoch | First-party Evidence und Methodik als Unique Value Proposition prüfen |

Vor Keyword-/Volume-Priorisierung sind echte GSC-/Keyword-Daten erforderlich; keine Volumen- oder Ranking-Schätzwerte werden erfunden.

#### `WP-SEO-CONTENT` — Content-Brief-Contract

Jeder neue SEO-Content-Brief führt mindestens:

1. primäres Nutzerproblem / Intent;
2. Ziel-URL und Canonical-Entscheid;
3. einzigartige Perspektive / First-party Evidence;
4. fachlicher Owner/Reviewer und Quellen;
5. `Who / How / Why` der Inhaltserstellung;
6. Title/H1/Description ohne Keyword-Stuffing;
7. interne Eingangs-/Ausgangslinks;
8. strukturierte Daten nur wenn inhaltlich passend und von Google aktuell unterstützt;
9. bevorzugtes first-party Bild/Video, Alt/Caption/Transcript wo passend;
10. Messgröße aus GSC/GA4 nach Veröffentlichung;
11. `lastReviewed`/Refresh-Gate;
12. GOV-/Publishing-Freigabe, falls externe Veröffentlichung betroffen ist.

#### `WP-SEO-SPAM`

Die SEO-Checkliste enthält ab 0002.16 explizite Negativgates für scaled-content abuse, cloaking, doorway-artige Seiten, künstliche Linkschemata und Site-Reputation-Abuse. AI-Unterstützung ist nur zulässig, wenn der resultierende Inhalt hilfreich, zuverlässig, originell und fachlich geprüft ist.

#### `WP-SEO-REFRESH` und `WP-SEO-REVIEW`

Das Refresh-Schema ist gestartet; echte Priorisierung wartet auf GSC/GA4-Reads. Monatlich werden mindestens Traffic-/Visibility-Delta, Content Decay, neue/entfallene Rich-Result-Features und Owner-Dependencies geprüft.

### 6.2 Credential-gated gestartet

`WP-SEO-METRICS` und `WP-SEO-AI-VIS` sind bis zum Read-Gate spezifiziert. Ohne echte Search-Console-/GA4-Evidence bleiben Werte `NOT ENABLED`/`NOT READ`; keine third-party oder synthetischen Rankings werden als PASS verwendet.

### 6.3 Foreign-owner WPs an der Ownership-Grenze gestartet

Für `WP-SEO-TECH-GATE`, `WP-SEO-SCHEMA`, `WP-SEO-CWV`, `WP-SEO-IA`, `WP-SEO-MEDIA`, `WP-SEO-AUTHORITY`, `WP-SEO-AGENT` und die bedingte `WP-SEO-I18N` sind Anforderungen und Exit Gates definiert. Produktive Änderungen an Frontend, Deploy/Runtime, Publishing oder Compliance werden **nicht** in diesem SEO-Branch implementiert.

---

## 7. Konkrete Acceptance Gates

### 7.1 Crawl / Index

- exakt eine kanonische URL je indexierbarer Public Surface;
- Sitemap enthält nur kanonische, indexierbare, HTTP-200-URLs;
- Public-Route-Inventar, Sitemap und Prerender-Allowlist dürfen nicht driften;
- keine widersprüchlichen Canonicals vor/nach JS-Rendering;
- unknown URLs bleiben echte 404; keine irrelevanten Sammelredirects;
- `noindex` wird nicht in initial HTML gesetzt, wenn eine Seite später indexierbar sein soll;
- robots blockiert keine für Rendering/Indexierung notwendigen First-party-Ressourcen.

### 7.2 Structured Data

- Markup beschreibt sichtbaren echten Inhalt und keine nicht vorhandenen Features;
- JSON-LD bleibt bevorzugtes Wartungsformat, soweit passend;
- nach Template-/Schema-Änderungen: Rich Results Test bzw. Search-Console-Status prüfen;
- `FAQPage` ist **kein** Roadmap-Ziel für Google-Rich-Results nach Deprecation 2026;
- Product/Article/Video/etc. nur bei tatsächlich passender Surface.

### 7.3 CWV

- p75 LCP <= 2.5 s;
- p75 INP <= 200 ms;
- p75 CLS <= 0.1;
- Mobile/Desktop getrennt;
- Feldwerte priorisieren; Lab-Werte dienen Diagnose und Regression, nicht als Ersatz für Field-PASS.

### 7.4 GenAI Search

- keine separate „GEO“-Shadow-Architektur;
- kein `llms.txt` als Pflicht oder Ranking-Hack;
- Content bleibt people-first, fachlich geprüft und non-commodity;
- Search-Console-GenAI-Report ist Messquelle, sobald Read-Evidence verfügbar ist;
- Preferred Sources nur prüfen, wenn CAPITAL-AI eine dafür relevante Publisher/News-Surface betreibt.

### 7.5 Content / Authority

- kein generischer Massencontent allein für Query-Varianten;
- First-party Data/Evidence und fachliche Erfahrung werden sichtbar gemacht, wenn vorhanden;
- interne Links folgen Nutzerpfaden und Themenbezug;
- Linkaufbau priorisiert relevante redaktionelle Links/Erwähnungen; kein Kauf-/Tausch-/Spam-Schema;
- veralteter oder kannibalisierender Content wird aktualisiert, konsolidiert oder bewusst entfernt.

---

## 8. Now / Next / Later

### NOW — 0–30 Tage

1. `WP-SEO-METRICS` + `WP-SEO-AI-VIS`: echte read-only GSC/GA4-Baseline, falls Owner-Credentials freigegeben/verfügbar.
2. `WP-SEO-TECH-GATE` + `WP-SEO-SCHEMA`: FE/OPS-Handoff für automatisierbare Crawl-/Canonical-/Structured-Data-Regressions.
3. `WP-SEO-TOPICS` + `WP-SEO-CONTENT`: Seed Map mit echten Query-/Intent-Daten anreichern und erstes nicht-kommodifiziertes Pilot-Brief priorisieren.
4. `WP-SEO-SPAM`: AI-/Content-Gates bei allen neuen Briefs anwenden.

### NEXT — 31–90 Tage

1. `WP-SEO-CWV`: FE-Evidence auf p75-Ziele und Route-Budgets.
2. `WP-SEO-IA` + `WP-SEO-MEDIA`: Internal-Link-/Orphan-Audit, preferred image/media readiness.
3. `WP-SEO-REFRESH`: Content-Decay-/Cannibalization-Backlog aus echten Daten.
4. `WP-SEO-AUTHORITY`: relevante referring domains/unlinked mentions baseline und Outreach-Priorisierung.

### LATER — 90–180+ Tage

1. `WP-SEO-I18N` nur bei echten Locale-URLs.
2. `WP-SEO-AGENT` nur bei validiertem Browser-Agent-Business-Case.
3. Preferred-Sources-/Publisher-Optimierung nur bei passender redaktioneller Surface.

---

## 9. Invarianten

1. CookieHub bleibt Consent Source of Truth.
2. Read- und Write-Plane bleiben getrennt (ESS-0014).
3. Config != Provider-PASS.
4. Keine synthetischen Rankings, Traffics, Conversions, Keyword-Volumes oder GenAI-Visibility-Werte.
5. Keine zweite Publishing-/Token-/SEO-Runtime-Authority.
6. Merge bleibt Human/CODEOWNER-only.
7. Ein geschlossener ungemergter PR ist nie current-main-Evidence.
8. External SEO guidance ist advisory only.
9. `llms.txt` ist kein Pflicht-WP; ein späterer Einsatz benötigt einen konkreten, belegten Consumer/Business Case.
10. FAQ-Rich-Result ist nach Google-Deprecation 2026 kein Ziel-KPI.
11. Foreign-owner Runtime-Arbeit endet an der Ownership-Grenze und wird an FE/OPS/GOV/COMP geroutet.

---

## 10. Definition of Done — 0002.16 Work Item

Dieser Roadmap-Modernisierungs-Work-Item ist repository-seitig fertig, wenn:

- current-main-/open-PR-Korrelation vor PR-Gate erneut PASS ist;
- `docs/projects/seo/ROADMAP.md`, diese Programm-Roadmap und `docs/seo/SEO_CHECKLIST.md` denselben 0002.16-Scope spiegeln;
- jedes neue State-of-the-Art-WP Owner, Status, Impact/Effort, Evidence und Exit Gate besitzt;
- SEO-owned Pakete mindestens mit konkretem Seed/Contract/Checklist-Artefakt gestartet sind;
- Credential-/Foreign-owner-Pakete ehrlich an ihrem Gate stehen;
- keine Produktiv-/Provider-/Publishing-Mutation aus SEO-Ownership erfolgt;
- ausgeführte und nicht ausgeführte Checks getrennt dokumentiert sind.

Das **Gesamtprogramm** bleibt offen, solange Provider Reads, FE-CWV, foreign-owner Runtime-Gates oder echte Content-/Authority-Messungen fehlen.

---

## 11. Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0002.0–0002.13 | 2026-08-15..16 | historische Konsolidierung; Evidence in Git-Historie |
| 0002.14 | 2026-09-05 | ungemergter Entwurf gegen ältere Baseline; durch 0002.15 ersetzt |
| 0002.15 | 2026-09-06 | damaliger SEO-Dokumentations-Closeout nach Q1-Production; Restqueue owner-/foreign-owner-gated |
| **0002.16** | **2026-09-11** | Owner-directed SoTA-Reopening aus dem 2026-09-07 Work Item auf die übertragene Repository-Instanz `capital-ai-online/Finance`; final re-korreliert gegen `main@12c9e129c7302df0d1bce7640cd7888f0998b9ca`, moderne Roadmap-Mechanik, GenAI Search, GSC+GA4, CWV, content/topic/IA/media/authority/spam/refresh WPs ergänzt und alle Pakete bis zu ihrem zulässigen Gate gestartet |
