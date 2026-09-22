# CAPITAL-AI SEO + Google Marketing — Konsolidierte Programm-Roadmap

## Document ID

**SEO-GM-ROADMAP-0002**

## Status

**ACTIVE — CANONICAL EXECUTION ROADMAP (Domain SEO / Google Marketing / Content Distribution)**  
Stand: 2026-09-22  
Version: **0002.22**  
Current-main correlation: `main@aee799282298596a5f2d9140a4e805edf52783a0`  
Working branch: `agent/seo-launch-01-ia-convergence-20260922`  
Repository: `capital-ai-online/Finance`  
Owner: SvenKulessa / `CAPITAL-AI-SEO` project coordination  
Primary productive PVC: **N/A — cross-cutting; no productive PVC ownership**  
Authority-Bindung: current `/AGENTS.md`, anwendbare Accepted ADR / aktive ESS. Diese Roadmap erzeugt keine Mutationsberechtigung.

> **0002.16 Owner-directed reopening.** Der mit 0002.15 geschlossene damalige SEO-Dokumentationsscope bleibt historisch korrekt. Die Owner-Anweisung vom 2026-09-07 eröffnet einen neuen, begrenzten Work Item: State-of-the-Art-SEO-Roadmap gegen current `main` korrelieren, fehlende Features aufnehmen und alle Arbeitspakete mindestens bis zu ihrer zulässigen Ownership-/Credential-Grenze starten. Nach Übertragung derselben Repository-Instanz auf `capital-ai-online/Finance` wird dieser Scope auf current main neu materialisiert. Produktive FE/OPS/GOV/COMP-Änderungen werden nicht in SEO-Ownership gezogen.

> **0002.17 Owner-directed public launch convergence.** Die Owner-Anweisung vom 2026-09-20 aktiviert `WP-SEO-LAUNCH-01` als übergeordneten Launch-Management-Slice über die bereits vorhandenen SEO-, Landing-, Measurement- und Social-Fähigkeiten. Das Detailpaket liegt unter `docs/seo/WP_SEO_LAUNCH_01_PUBLIC_WEB_SOCIAL_LAUNCH_2026-09-20.md`. Es erzeugt keine zweite Roadmap, keine Publishing- oder Provider-Autorität und übernimmt keine FE/SOCIAL/OPS/GOV/SEC/COMP/FINTECH/QM-Ownership.

> **0002.18 Owner-directed launch execution.** Der Owner startet Production-/CTA-Freeze, GSC/GA4-Baseline und die X/Facebook-Wave. Repository-CTA-/URL-Evidence ist materialisiert; Production ist beim Readback nicht exakt auf `CURRENT_MAIN`, GSC/GA4 sind in diesem Chat nicht verbunden und die produktive Social-Account-Tabelle enthält keine X-/Facebook-Verbindung. Deshalb bleiben diese Lanes explizit non-PASS. Detail-Evidence: `docs/seo/WP_SEO_LAUNCH_01_EXECUTION_BASELINE_2026-09-20.md`.

> **0002.19 SEO management takeover / launch refresh.** Fresh Owner direction assigns the SEO-management scope to this execution context. The snapshot is re-correlated after merged FE branding work (#1178): Production is exact on `main@4f2c746a20a8683d784a1cbe54c763a64ddd1da3`, CTA targets remain repository-valid, root metadata/prerender message drift persists, `/universe` lacks a visible landing internal link, GSC/GA4 reads remain connection-gated and X/Facebook production account identities remain absent. SEO-owned topic mapping and the first launch content brief are materialized in the same bounded scope. Detail evidence: `docs/seo/WP_SEO_LAUNCH_01_MANAGEMENT_REFRESH_2026-09-21.md`.

> **0002.21 Current Frontend convergence.** Fresh Owner direction on 2026-09-22 binds active website SEO exclusively to current main `9c8a3e80c4451ed0b6ea45f368175604608f6f4b`, the merge of FE PR #1241 and FRONTEND source `f2a101330d74420c373f0ec56fa58caac53d741d`. Root metadata is aligned to the visible market-intelligence landing, stale Impressum metadata is corrected from TMG to § 5 DDG, and Mobile/Desktop CWV is measurement-gated rather than blocked on superseded FE PRs. The current Frontend exposes `/faq`, but canonical SEO/sitemap/prerender promotion remains fail-closed on OPS Issue #1223 so the existing route-set equality/security invariant is preserved; SEO Issue #1233 continues after that dependency.

> **0002.22 IA / public-route convergence.** After merged PR #1260, the active SEO slice is re-correlated to `main@aee799282298596a5f2d9140a4e805edf52783a0`. The canonical six-route SEO/sitemap/prerender/public-server set still includes `/universe`, but the current hydrated `AppRoutes.tsx` no longer renders that route. FE Issue #1263 owns restoration of same-route client reachability plus visible root navigation to `/universe` and `/learning-platform`. `/faq` remains blocked on OPS #1252, Pilot Brief #02 on FINTECH #1254, and GSC/GA4/GenAI reads remain provider-gated. Initial Render readback for this slice is not exact on CURRENT_MAIN, so Production freeze remains non-PASS until exact-SHA convergence is observed.

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

Für Google-Marketing gelten zusätzlich ESS-0014 und ADR-0035: Read-/Write-Plane bleiben getrennt, die auf `CURRENT_MAIN` akzeptierte Consent-Source-of-Truth-Architektur bleibt maßgeblich, Provider-Konfiguration ist kein Provider-PASS und externe Mutationen bleiben innerhalb der jeweils autorisierten Capability-/Control-Grenzen.

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

## 3. Current-main Baseline — 2026-09-22

### 3.1 Technical SEO / SeoEngine

| WP | Status | Evidence / Gate |
|---|---|---|
| Q1 robots + sitemap + Harden | **IMPLEMENTED_ON_MAIN / CURRENT REPOSITORY SET = 6 URLS** | aktueller Sitemap-/Route-/Prerender-Set enthält zusätzlich `/universe`; historische Live-/GSC-Evidence vor dieser Erweiterung beweist nicht automatisch die sechste URL |
| Q2 canonical + trailing slash | **IMPLEMENTED_ON_MAIN** | Route-SEO + Server-Normalisierung; frischer Provider-Smoke in diesem Pass nicht ausgeführt |
| Q3 Search Console Verify | **HISTORICAL_READ_VERIFIED / CURRENT_READ_BLOCKED_NOT_CONNECTED** | reale 2026-09-16 Provider-Evidence für `sc-domain:capital-ai.online` + fünf URL-Inspection-Reads; aktueller 6-URL-Set inkl. `/universe` und Search Analytics nicht frisch lesbar |
| Q4 Checklist | **IMPLEMENTED_ON_MAIN** | `docs/seo/SEO_CHECKLIST.md` |
| Q5 og:image | **IMPLEMENTED_ON_MAIN** | first-party `public/og-image.svg` |
| D1 JSON-LD | **IMPLEMENTED_ON_MAIN** | Organization/WebSite/SoftwareApplication |
| D2 route titles/meta | **IMPLEMENTED_ON_MAIN** | `src/lib/routeSeo.ts` |
| D3 Soft-404 | **IMPLEMENTED_ON_MAIN** | unknown -> 404 |
| D3b hydrated public-route parity | **OPEN — FE #1263** | `/universe` is canonical in SEO/sitemap/prerender/server inventories but missing from current `AppRoutes.tsx`; same-route hydration is non-PASS |
| D4 Bundle / CWV | **OPEN — FE-OWNED** | FE-Roadmap führt p75 LCP/INP/CLS-Ziele; SEO verknüpft nur Mess-/Exit-Gate |
| D5 Search Console Read | **PARTIAL_READ_VERIFIED** | Property + URL Inspection real verifiziert; Search Analytics/Query-Performance weiterhin evidence-gated |
| S1 SeoEngine | **VERIFIED** | ADR-0082 |
| S2 Prerender | **VERIFIED** | ADR-0084 |
| S3 Dashboard | **IMPLEMENTED_ON_MAIN** | Admin SEO dashboard |
| S4 Sprache / hreflang | **SPEC COMPLETE / CONDITIONAL** | German-first; kein produktives `hreflang` ohne reale Locale-URLs |

### 3.2 Google / Consent / Measurement

| Thema | Status | Gate |
|---|---|---|
| GA4 Browser-ID | zuletzt live beobachtet | kein Data-API-PASS in diesem Pass |
| GA4 MCP / Realtime | **READ_BLOCKED_NOT_CONNECTED** | Repository-Hostvertrag existiert; Provider-Tool/Credentials sind diesem Chat nicht exponiert; daraus wird kein NO_DATA/PASS abgeleitet |
| Search Console read plane | **HISTORICAL PROPERTY + 5 URL INSPECTIONS VERIFIED / CURRENT PERFORMANCE READ BLOCKED** | `/universe`, Search Analytics und GenAI performance benötigen frische Provider-Evidence |
| Consent / Google measurement | **CURRENT-MAIN CONSENT-GATED ARCHITECTURE** | kein frischer Pre-Opt-in-/Provider-Trace in diesem Work Item; kein PASS aus Konfiguration abgeleitet |
| `GOOGLE_VISIBLE_PASS` | **NOT ENABLED** | keine frische Search-Console-/SERP-Evidence in diesem Pass |
| GenAI Search visibility | **BASELINE NOT YET READ** | neuer Search-Console-GenAI-Report; Credential-Gate |

### 3.3 Repository-Correlation

- Repository: `capital-ai-online/Finance`.
- Current-main baseline for the active execution slice: `main@aee799282298596a5f2d9140a4e805edf52783a0`.
- `/AGENTS.md@CURRENT_MAIN` Control Plane: `4.8.0`.
- Current Project: `CAPITAL-AI-SEO`; Project Folder: `docs/projects/seo/`; Primary productive PVC: `N/A — cross-cutting`; Primary Owner: `CAPITAL-AI-SEO`.
- Human/CODEOWNER merged PR #1260; its stale active claim and the older merged #1204 claim are released in the current continuation branch.
- Open OPS PR #1262 has no changed-file overlap with the SEO claim/docs scope.
- Root metadata is source-aligned across `index.html`, `routeSeo.ts` and prerender; OPS #1258 remains the owner-correct production/raw-HTML verification lane.
- Canonical six-route equality remains intact across routeSeo/sitemap/prerender/public-server inventories, but hydrated `/universe` reachability is broken in `AppRoutes.tsx`; FE #1263 is launch-blocking.
- Initial Render readback: live `720e4a80904a881e5ef732b66e1303f51a769d8e` vs CURRENT_MAIN `aee799282298596a5f2d9140a4e805edf52783a0`; exact-SHA Production freeze is non-PASS for that observation.
- X/Facebook connected-account readback remains `0/0`; Wave-1 provider publication remains blocked.
- This SEO slice owns launch coordination/evidence only. FE/OPS/SOCIAL/COMP/FINTECH/QM runtime/domain work remains owner-correct.


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

| WP | Ziel | Primary Owner / Route | Impact | Effort | Status in 0002.22 | Exit Gate |
|---|---|---|---|---|---|---|
| `WP-SEO-LAUNCH-01` | Web-, Search- und Social-Readiness als eine evidence-basierte Public-Launch-Kette konvergieren; kein zweites Marketing-/Publishing-System | `CAPITAL-AI-SEO` coordination -> FE/SOCIAL/OPS/GOV/SEC/COMP/FINTECH/QM | H | L | **IA_CONVERGENCE / FOREIGN_AND_PROVIDER_GATES_OPEN** | gleiche Launch-Candidate-Identity über Web/SEO/Measurement/Social/Production-Evidence; alle Blocker klassifiziert; finale Public-Launch-Entscheidung bleibt Human Owner |
| `WP-SEO-METRICS` | KPI-Baseline aus GSC + GA4: Clicks, Impressions, CTR, Queries, Landingpages, Organic Sessions/Conversions; Differenzen erklärbar statt „gleichgerechnet“ | SEO coordination; Owner credentials; ESS-0014 | H | M | **STARTED_AT_GATE** | reproduzierbarer Read-Snapshot + KPI-Baseline; keine synthetischen Werte |
| `WP-SEO-AI-VIS` | GenAI Search / AI Overview / AI Mode Visibility im neuen Search-Console-Report messen | SEO coordination; GSC read credentials | H | S | **STARTED_AT_GATE** | GenAI-Impressions/Clicks bzw. dokumentiertes „keine Daten“ aus echter GSC-Evidence |
| `WP-SEO-TECH-GATE` | Crawl-/Index-Release-Gate: Public-Route = Sitemap = Canonical-Allowlist; 404/redirect/noindex/JS-canonical-Konsistenz | SEO requirements; FE/OPS productive implementation | H | M | **STARTED_AT_BOUNDARY** | automatisierbare Prüfung + Owner-implementierte Regression; keine Canonical-/Sitemap-Drift |
| `WP-SEO-SCHEMA` | Structured-Data-Lifecycle: unterstützte Typen, initial HTML wo sinnvoll, Validierung nach Template-Changes, Search-Console-Fehlertrend | SEO requirements; FE implementation | H | M | **STARTED_AT_BOUNDARY** | valide, inhaltsgetreue Markups; D1-Baseline dokumentiert; FAQ-Rich-Result nicht als Ziel geführt |
| `WP-SEO-CWV` | CWV als SEO-/UX-Gate mit p75 LCP <=2.5 s, INP <=200 ms, CLS <=0.1, Mobile/Desktop getrennt | `CAPITAL-AI-FE` | H | L | **STARTED_AT_BOUNDARY** | FE-Evidence erfüllt p75-Ziele; SEO übernimmt nur Ergebnis/Trend |
| `WP-SEO-TOPICS` | Keyword-/Topic-Map nach Intent, Brand-Relevanz, Business Value, Traffic-Potential und Content Gap | `CAPITAL-AI-SEO` | H | M | **STARTED** | priorisierte Topic Map mit Existing/New URL, Intent, Evidence und Owner |
| `WP-SEO-CONTENT` | Helpful/non-commodity Content: eigener POV, First-party Evidence, Who/How/Why, Autor/Reviewer, Updated-Date, klare Struktur | SEO coordination; Publishing bleibt GOV | H | L | **STARTED** | Content-Brief-Contract + mindestens ein freigegebenes Pilot-Brief; keine scaled-content-Automation |
| `WP-SEO-IA` | Informationsarchitektur/interne Links: keine Orphans, klare H1/H2-Struktur, beschreibende Anchor, kanonische Pfade | SEO requirements; FE implementation | M | M | **AUDIT_COMPLETE / FE_1263_BLOCKED** | Public-URL-Inventar + Linkgraph/Orphan-Check; FE behebt Runtime-Lücken |
| `WP-SEO-MEDIA` | Image/Video SEO: first-party preferred image, Alt/Dateinamen, hochwertige Medien; VideoObject/Transcript nur bei echtem Video | SEO requirements; FE/SOCIAL implementation je Surface | M | M | **STARTED_AT_BOUNDARY** | bevorzugtes Bild konsistent; Media-Assets crawlbar; Video-Markup nur bei echter Medienseite |
| `WP-SEO-REFRESH` | Content Decay, Cannibalization, veraltete Seiten, Merge/Refresh/Prune-Entscheidungen | `CAPITAL-AI-SEO` | M | M | **STARTED** | monatlicher Refresh-Backlog aus echten Search-/Content-Daten |
| `WP-SEO-AUTHORITY` | relevante Backlinks/Digital PR/unlinked mentions; Qualität und Themenfit vor Volumen | SEO coordination; SOCIAL/GOV je Publish/Outreach | M | L | **STARTED_AT_BOUNDARY** | Baseline referring domains + priorisierte Outreach-Liste; keine manipulativen Linkschemata |
| `WP-SEO-SPAM` | Google-Spam-/Site-Reputation-/Scaled-Content-Guardrails für AI-gestützte Inhalte | SEO coordination; GOV/COMP bei Policy/Legal | H | S | **STARTED** | Checklist blockiert scaled content abuse, cloaking, doorway/site-reputation abuse |
| `WP-SEO-AGENT` | Browser-/Agent-Readiness: semantischer DOM, Accessibility Tree, stabile Interaktionszustände; nur wo Business Case besteht | `CAPITAL-AI-FE` | L | M | **STARTED_AT_BOUNDARY** | FE-Baseline/Tests; kein proprietärer SEO-Sonderpfad oder Crawler-Cloaking |
| `WP-SEO-I18N` | `hreflang` + locale-spezifische Canonicals erst bei echten Übersetzungs-URLs | SEO requirements; FE implementation | M | M | **CONDITIONAL** | echte Locale-URLs + gegenseitige hreflang-Sets + korrekte Canonicals |
| `WP-SEO-REVIEW` | monatliche Living-Roadmap: KPI-Delta, Search-Dokumentationsupdates, Impact/Effort und Owner-Queue neu priorisieren | `CAPITAL-AI-SEO` | H | S | **STARTED** | monatlicher Review-Eintrag mit Evidence und höchstens zwei unmittelbar priorisierten Folgeaktionen |

---

## 6. Umsetzung in diesem Branch — Start aller WPs

### 6.0 `WP-SEO-LAUNCH-01` — Public Launch Convergence

Der aktuelle Owner-Auftrag ist als detailliertes Launch-Management-Paket materialisiert:

`docs/seo/WP_SEO_LAUNCH_01_PUBLIC_WEB_SOCIAL_LAUNCH_2026-09-20.md`

Es führt bestehende SEO-/Search-, Landing-, Analytics-, Content- und Social-Gates in einer T-relativen Launch-Kette zusammen. Die aktuelle Execution-Baseline ist unter `docs/seo/WP_SEO_LAUNCH_01_EXECUTION_BASELINE_2026-09-20.md` materialisiert. Produktive Foreign-Owner-Änderungen werden nicht in diesem SEO-Branch ausgeführt.


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

1. `WP-SEO-LAUNCH-01`: FE #1263 für `/universe` same-route Client-Reachability + sichtbare IA sowie OPS #1252 für `/faq` Public-Route-Prerequisite bis zur echten Owner-Evidence verfolgen; Production exact-SHA, GSC/GA4 und X/Facebook Provider-Gates bleiben separat non-PASS.
2. `WP-SEO-METRICS` + `WP-SEO-AI-VIS`: echte read-only GSC/GA4-Baseline nur über einen real verbundenen Provider-Read-Pfad; fehlende Verbindung bleibt `READ_BLOCKED_NOT_CONNECTED`.
3. `WP-SEO-TECH-GATE` + `WP-SEO-SCHEMA`: FE/OPS-Handoff für automatisierbare Crawl-/Canonical-/Structured-Data-Regressions.
4. `WP-SEO-TOPICS` + `WP-SEO-CONTENT`: Seed Map mit echten Query-/Intent-Daten anreichern und erstes nicht-kommodifiziertes Pilot-Brief priorisieren.
5. `WP-SEO-SPAM`: AI-/Content-Gates bei allen neuen Briefs anwenden.

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

1. Die auf `CURRENT_MAIN` akzeptierte Consent-Source-of-Truth-Architektur bleibt maßgeblich; Marketing-/Analytics-Erfassung darf die geltenden Consent-Gates nicht umgehen.
2. Read- und Write-Plane bleiben getrennt (ESS-0014).
3. Config != Provider-PASS.
4. Keine synthetischen Rankings, Traffics, Conversions, Keyword-Volumes oder GenAI-Visibility-Werte.
5. Keine zweite Publishing-/Token-/SEO-Runtime-Authority.
6. Direkter Agent-Self-Merge bleibt verboten; provider-managed Auto-Merge ist nur nach dem aktuellen `/AGENTS.md` Auto-Merge Safety Contract zulässig.
7. Ein geschlossener ungemergter PR ist nie current-main-Evidence.
8. External SEO guidance ist advisory only.
9. `llms.txt` ist kein Pflicht-WP; ein späterer Einsatz benötigt einen konkreten, belegten Consumer/Business Case.
10. FAQ-Rich-Result ist nach Google-Deprecation 2026 kein Ziel-KPI.
11. Foreign-owner Runtime-Arbeit endet an der Ownership-Grenze und wird an FE/OPS/GOV/COMP geroutet.

---

## 10. Definition of Done — 0002.22 IA / Public-Route Work Item

Dieses Work Item ist repository-seitig fertig, wenn:

- current-main-/open-PR-Korrelation vor PR-Gate erneut PASS ist;
- `WP-SEO-LAUNCH-01` als Detailpaket vorliegt und bestehende SEO-/Social-/Product-Authorities referenziert statt dupliziert;
- `docs/projects/seo/ROADMAP.md` und diese konsolidierte Programm-Roadmap denselben aktiven Launch-Slice auf die gleiche current-main Baseline projizieren;
- Web-, Search-, Measurement-, Content-, Social-, Production-, Security-/Compliance- und QM-Gates mit Owner, Evidence und Exit State definiert sind;
- der current-main Landing-/Routing-Stand als Repository-Produktbaseline behandelt wird, ohne daraus ungeprüfte Production-/Provider-Evidence abzuleiten;
- `/universe` hydrated route parity als FE #1263 klassifiziert und nicht durch SEO-Runtime-Mutation umgangen wird;
- Production exact-SHA drift, `/universe` client-route drift, GSC/GA4-Connection-Gates und fehlende X/Facebook-Account-Identitäten explizit als non-PASS dokumentiert sind;
- keine Produktiv-/Provider-/Publishing-/Credential-Mutation aus SEO-Ownership erfolgt;
- ausgeführte und nicht ausgeführte Checks getrennt dokumentiert sind.

Das **Gesamtprogramm** bleibt offen, solange der Public-Launch-Exit-Gate, Provider Reads, FE-CWV, foreign-owner Runtime-/Social-Gates oder echte Content-/Conversion-/Authority-Messungen fehlen.

---

## 11. Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0002.0–0002.13 | 2026-08-15..16 | historische Konsolidierung; Evidence in Git-Historie |
| 0002.14 | 2026-09-05 | ungemergter Entwurf gegen ältere Baseline; durch 0002.15 ersetzt |
| 0002.15 | 2026-09-06 | damaliger SEO-Dokumentations-Closeout nach Q1-Production; Restqueue owner-/foreign-owner-gated |
| **0002.16** | **2026-09-11** | Owner-directed SoTA-Reopening aus dem 2026-09-07 Work Item auf die übertragene Repository-Instanz `capital-ai-online/Finance`; final re-korreliert gegen `main@12c9e129c7302df0d1bce7640cd7888f0998b9ca`, moderne Roadmap-Mechanik, GenAI Search, GSC+GA4, CWV, content/topic/IA/media/authority/spam/refresh WPs ergänzt und alle Pakete bis zu ihrem zulässigen Gate gestartet |
| **0002.17** | **2026-09-20** | Owner-directed `WP-SEO-LAUNCH-01` ergänzt: öffentliche Web-/Search-/Social-Launch-Kette, Landing-/CTA-Dependency auf offenen FE-PR #1153, consent-safe Measurement, Social-Package-/Provider-Evidence, T-relativer Launchkalender und same-candidate Launch-Gates; current-main re-korreliert auf `c9980602f691b855fd6f8c66a49822e7a9611b4a` |
| **0002.18** | **2026-09-20** | Launch-Ausführung gegen `main@79eef34e8cd7cd852305641cb1b49cd90dbd2af5`: CTA-/6-URL-Repository-Freeze, initialer Production-Drift plus canonical exact-SHA Recovery/SLA-PASS, Root-Metadata-Handoff, GSC/GA4 `READ_BLOCKED_NOT_CONNECTED`, reale Supabase-Readback-Evidence ohne X/Facebook-Accounts und owner-korrekte Social-Wave-1-Übergabe materialisiert |
| **0002.19** | **2026-09-21** | SEO-Management-Übernahme gegen `main@4f2c746a20a8683d784a1cbe54c763a64ddd1da3`: Production exact-SHA PASS, Post-#1178 Landing-Re-Freeze, persistierender Root-Metadata-Handoff, neuer `/universe`-IA-Handoff, GSC/GA4 Provider-Read-Gates, X/Facebook Account-Gate sowie SEO-owned Topic Map + Launch Content Brief materialisiert |
| **0002.21** | **2026-09-22** | Active website SEO auf FE #1241/current main konvergiert; Root-Metadaten an aktuelle Landing angepasst, TMG→DDG korrigiert, CWV auf Measurement-Gate umgestellt und /faq owner-korrekt auf OPS #1223 → SEO #1233 gebunden. |
| **0002.22** | **2026-09-22** | Post-#1260 IA/Public-Route-Konvergenz auf `main@aee799282298596a5f2d9140a4e805edf52783a0`: stale Claims released, `/universe` hydrated-route drift + sichtbare Root-IA als FE #1263 geroutet, `/faq` OPS #1252 und FINTECH #1254 erhalten, Production exact-SHA/Social/Google-provider Gates wahrheitsgemäß non-PASS gehalten. |
