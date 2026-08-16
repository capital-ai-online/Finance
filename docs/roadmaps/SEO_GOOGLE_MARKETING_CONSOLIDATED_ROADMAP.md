# CAPITAL-AI SEO + Google Marketing — Konsolidierte Programm-Roadmap

## Document ID

**SEO-GM-ROADMAP-0002**

## Status

**ACTIVE — CANONICAL EXECUTION AUTHORITY (Domain SEO / Google Marketing / Content Distribution)**  
Stand: 2026-08-16  
Baseline: `main` (ADR-0082; WP-S1 VERIFIED; WP-D3 Soft-404 VERIFIED PR #360)  
Owner: SvenKulessa  
Authority-Bindung: ADR-0035, ADR-0042, ADR-0068 (PROPOSED), ADR-0082 (SeoEngine), ESS-0014, ESS-0022 (PROPOSED), ADR-0071, ESS-0023

## Zweck

Dieses Dokument ist der **Single Point of Trust** für alle noch offenen und laufenden Arbeiten zu:

- Technical SEO und SEO-Management (SeoEngine)
- Google Analytics / Search Console / Consent Mode v2 / AdSense
- Google Marketing MCP (Read-Plane vs. kontrollierte Write-Plane)
- Content-Generierung, Media-Rendering und Social Distribution
- Marketing-Agent-Governance (getrennt vom Systemadmin)
- Monetarisierung (passives Einkommen) innerhalb bestehender Consent-/OWNER-Gates

Es **löst** die parallelen, teilweise überlappenden Roadmaps und Teilspezifikationen ab, um:

1. Wucherung und Unstimmigkeiten zu beenden,
2. doppelte Architekturentscheidungen (SEO vs. Marketing vs. Google MCP) zu vermeiden,
3. alle unerledigten Arbeitspakete auf einen aktuellen, evidence-gebundenen Stand zu bringen,
4. klare Anschlüsse an Documentary, Vocabulary (Wiktionary-Äquivalent), VersionManager und die übrige Plattformarchitektur zu definieren.

**Keine Mutationsberechtigung entsteht durch dieses Dokument allein.** Runtime-, Produktions-, Billing-, AdSense-, DNS- und externe Publish-Änderungen bleiben OWNER-genehmigungspflichtig (ADR-0035, ADR-0039, ESS-0014).

---

## 1. Supersedes (verbindliche Ablösung)

Die folgenden Dokumente gelten ab Merge dieses Standes als **SUPERSEDED** für Programmautorität und offene Arbeitspakete. Historischer Evidence-Wert bleibt erhalten; sie dürfen keine parallele Architektur mehr begründen.

| Altes Dokument | Document ID / Rolle | Nachfolger |
|---|---|---|
| `docs/seo/SEO_MANAGEMENT_ROADMAP.md` | SEO-ROADMAP-0001 | **dieses Dokument** |
| `docs/roadmaps/MARKETING_AGENT_ROADMAP.md` | MA-Roadmap (DRAFT) | **dieses Dokument** (Abschnitt MA → WP-M) |
| `docs/seo/S1_SEO_ENGINE.md` … `S4_…` (als Programmplan) | Block-Specs | eingearbeitet; Specs bleiben technische Evidence |
| `docs/seo/Q_BLOCK_IMPLEMENTATION_NOTES.md`, `D_BLOCK_…` | Implementation Notes | Status in §4; Notes bleiben Evidence |
| `docs/adr/ADR-DRAFT-seo-engine-platform-module.md` | Draft | **ADR-0082** (`docs/adr/ADR-0082-seo-engine-platform-module.md`) |
| `docs/adr/ADR-DRAFT-prerender-public-routes.md` | Draft | zu formalisieren unter WP-S2 |
| Parallele Aussagen in Architektur-MCP-Docs, soweit sie **offene Programmarbeit** duplizieren | — | ESS-0014 + dieses Dokument sind normativ für den Programmplan |

**Nicht supersediert (bleiben Authority):**

- ADR-0035 (Protected Google Marketing / Strict CSP)
- ADR-0042 (Consent Mode v2)
- ESS-0014 / ESS-0014-CONTRACTS (Google Marketing MCP Governance)
- ADR-0026 / ADR-0027 (Social Publishing Real Integration + Owner Restriction)
- Bestehende SocialMediaEngine-Code- und OAuth-Boundaries
- ROADMAP_CONSOLIDATION_MASTER_INDEX.md (Portfolio-Ebene; wird auf dieses Programm umgestellt)

---

## 2. Authority-Reihenfolge (Domain)

1. Verifizierte Runtime-/Production-Evidence und Code auf `main`
2. Ausdrückliche Human/Owner-Freigabe (ADR-0039, Protected Change ADR-0035)
3. ESS-0014, ADR-0035, ADR-0042, ADR-0082 und akzeptierte ADRs dieses Programms
4. **Dieses Dokument (SEO-GM-ROADMAP-0002)**
5. Fachliche Block-Notes und Runbooks unter `docs/seo/`, `docs/runbooks/`
6. Historische / als SUPERSEDED markierte Roadmaps

Bei Widerspruch gilt die restriktivere, aktuellere und spezifischere Regel. Agent-Identität (Marketing vs. Systemadmin) erzeugt keine Authority-Überschneidung (ADR-0068 / ESS-0022).

---

## 3. Zielbild (einheitlich)

**Mission.** Ein vollständiges Capital-AI SEO- und Google-Marketing-Management, das:

- messbare Indexierung und Rankings liefert (No-Demo-Data),
- Consent Mode v2 und Strict CSP einhält,
- Content plant/generiert und nur nach hash-gebundener Owner-Freigabe verteilt,
- Social-Plattformen über die **eigene** SocialMediaEngine anbindet (Open-Source-Tools nur als optionale Adapter/Evidence, nie als Authority),
- Monetarisierung (AdSense, Affiliate, Subscriptions) hinter Consent- und OWNER-Gates ermöglicht (passives Einkommen),
- an Documentary (Provenance), Vocabulary Registry und VersionManager angeschlossen ist.

**Nicht-Ziele.**

- Kein paralleles zweites Publishing-System neben SocialMediaEngine
- Kein LLM-direkter Publish ohne Trust-/Approval-Plane
- Keine Systemadmin-Authority für Marketing-Domain
- Keine synthetischen Rankings oder Fake-Finanzkennzahlen

---

## 4. Ist-Stand (Evidence, 2026-08-16)

### 4.1 Technical SEO / SeoEngine

| WP | Status | Evidence |
|----|--------|----------|
| Q1 robots.txt + sitemap | **DONE** | `public/robots.txt`, `public/sitemap.xml` |
| Q2 canonical + trailing slash | **PARTIAL** | Canonical in `index.html`; Server trailing-slash 301 live (`/impressum/` → `/impressum`); full Q-CLOSE still open |
| Q3 Search Console Verify | **OWNER ACTION** | Platzhalter; Owner muss Property verifizieren |
| Q4 Checklist | **DONE** | `docs/seo/SEO_CHECKLIST.md` |
| Q5 og:image first-party | **DONE** | `public/og-image.svg` |
| Q6 obsolete CORS | **N/A** | Keine AI-Studio-Ausnahme im Tree |
| D1 JSON-LD | offen | Shell-JSON-LD in `index.html` vorhanden; Rich-Results-DoD offen |
| D2 route-specific titles/meta | offen | teilweise via prerender; client router titles offen |
| D3 Soft-404 | **VERIFIED** | PR #360; prod commit `54c48ca`; unknown → 404 `text/plain`; evidence `docs/evidence/seo/D3_SOFT_404_PROD_GAP_2026-08-16.md` |
| D4 Bundle-Splitting | offen (carried) | — |
| D5 Search Console MCP Read | offen | Runbook vorhanden |
| S1 SeoEngine Platform | **VERIFIED** | Store + Routes + Tests (PR #335); Schema/Grants/FK/Ledger applied 2026-08-15; **ADR-0082** Accepted 2026-08-16 |
| S2 Prerender/SSG | offen | ADR-DRAFT vorhanden |
| S3 SEO Dashboard | **DONE** | PR #309, Admin-Tab, No-Demo-Data |
| S4 hreflang / Sprache | **IN PROGRESS / Branch** | Spec `S4_LANGUAGE_AND_HREFLANG_STRATEGY.md` |

### 4.2 Google Marketing / Consent / CSP

| Thema | Status |
|-------|--------|
| Consent Mode v2 Gate | ADR-0042 ACCEPTED; Runtime-Consent-JS vorhanden |
| Protected Marketing + Strict CSP + Nonce | ADR-0035 ACCEPTED, Implementation **IN PROGRESS** (DoD noch nicht erfüllt) |
| ESS-0014 Read vs Write Plane | Published; Write-Plane noch nicht produktiv |
| GA4 MCP Read | Runbook + Work-Claim; begrenzte Read-Integration |
| AdSense | Architektur/Protected Scope; Smoke/DoD offen |

### 4.3 Social / Content / Marketing Agent

| Thema | Status |
|-------|--------|
| OAuth PKCE + Token Store + Publish X/Facebook | **produktiv** (Owner/Founder) |
| YouTube/TikTok/Instagram | blockiert bis Media-Asset (`mediaRequiredError`) |
| `generateSeries` / Content-API | **fehlt** (explizit in Code dokumentiert) |
| Marketing Agent MA0–MA7 | **DRAFT**, keine Runtime-Capability |
| ADR-0068 / ESS-0022 | PROPOSED / DRAFT |

---

## 5. Einheitliche Arbeitspakete (Work Packages)

Präfixe bleiben kompatibel zur etablierten Q/D/S/N/H/J-Konvention; Marketing-Phasen werden als **WP-M*** parallel geführt, ohne zweite Architektur.

### 5.1 Fundament & Messbarkeit (Fortsetzung Q/D)

| ID | Inhalt | Abhängigkeit | DoD (kurz) |
|----|--------|--------------|------------|
| WP-Q-CLOSE | Q2 Server-Trailing-Slash, Q3 Owner-Verify + Sitemap-Submit | Owner | Server-301 live; GSC Property verified noch OWNER |
| WP-D1 | JSON-LD Organization/WebSite/SoftwareApplication | Q | Rich-Results-Test ohne Fehler |
| WP-D2 | Routen-spezifische Title/Meta (Legal + Feature) | Q | Pro öffentlicher Route eindeutiger Title |
| WP-D3 | Soft-404: unbekannte Routen → HTTP 404 | — | **VERIFIED** — PR #360; prod unknown → 404 `text/plain` (2026-08-16) |
| WP-D4 | Bundle-Splitting / CWV | — | Messbare LCP/JS-Verbesserung |
| WP-D5 | Search Console als MCP-Read (Evidence) | ESS-0014 | Read-only MCP, kein Write |

### 5.2 SEO-Management-Kern (S)

| ID | Inhalt | Abhängigkeit | DoD |
|----|--------|--------------|-----|
| WP-S1 | SeoEngine Persistenz + RLS + No-Demo-Data | Migration, Security Review | **VERIFIED** — Ranks nur search-console \| manual-import; Code DONE (PR #335); Schema/Grants/FK/Ledger applied 2026-08-15; **ADR-0082** Accepted 2026-08-16 |
| WP-S2 | Prerender/SSG öffentlicher Routen | ADR formal | Crawler sehen Inhalt ohne JS |
| WP-S3 | Dashboard | **DONE** | — |
| WP-S4 | hreflang + Sprachstrategie | Vocabulary | Konsistente `lang`/hreflang |

### 5.3 Content, Media, Distribution (N + MA)

| ID | Inhalt | Abhängigkeit | DoD |
|----|--------|--------------|-----|
| WP-M0 | Governance-Paket: ESS-0022, ADR-0068, Policy, Traceability, inaktives Profil | Human Review | Dokumente accepted; **keine** Runtime-Capability |
| WP-N1 | `POST /api/social-media/generate` + Prompt-Orchestrierung | M0, bestehende Types | Text-Packages ohne Publish |
| WP-N2 | Skript-Vorlagen (Tweet, Community, Podcast, Short-Video) | N1 | Template-Registry + Tests |
| WP-N3 | Media-Rendering (TTS/Video) als **ersetzbare Sidecar-Adapter** | N1, Make-or-Buy Owner | YouTube/TikTok/IG freigeschaltet nur mit validiertem Asset-Hash |
| WP-N4 | Content-Kalender + hash-gebundene Owner-Freigabe | N1 | Kein Publish ohne Approval-Hash |
| WP-M5 | Erster bounded Marketing-Repo-Pilot (Docs/Contracts) | SA Host VERIFIED + M0 | Audit-before-side-effect, Human Merge |
| WP-M6 | Controlled External Publishing Architecture | N4, starke Owner-Approval | Default `CONTENT_AUTO_PUBLISH_ENABLED=false` |
| WP-H1 | Weitere Plattformen (LinkedIn, …) über SocialMediaEngine | M6 | Kein zweites Token-System |
| WP-H2 | Google Admin/Write nur hinter ESS-0014 Gateway | ADR-0035 DoD | OWNER + Step-up |
| WP-H3 | Feedback-Loop GSC/GA4 → ContentPerformanceScore | D5, S1 | Empfehlungen, kein Self-Publish |

### 5.4 Autonomie & Monetarisierung (J + Revenue)

| ID | Inhalt | Abhängigkeit | DoD |
|----|--------|--------------|-----|
| WP-J1 | Marketing-Agent im Multi-Agent-Framework (eigene Subject-ID) | M5 | Least Privilege, Kill Switch |
| WP-J2 | Closed Loop mit harter Owner-Schranke | H3, M6 | Keine Autonomie ohne Freigabe-Klasse-ADR |
| WP-R1 | AdSense unter Protected Scope + Consent | ADR-0035 DoD | Smoke ohne CSP-Block; Consent-gated |
| WP-R2 | Affiliate-Links in ContentPackages (Disclosure) | N4 | Compliance-Disclosure Pflicht |
| WP-R3 | Stripe-Subscriptions (bestehend) als Conversion-Ziel in SEO-Content | Entitlements ADR-0034 | Keine Preis-Mutation ohne Billing-ADR |

---

## 6. Architektur-Anschlüsse (verbindlich)

### 6.1 Documentary

- Jede generierte ContentPackage und jedes Rank-Snapshot-Event erhält Documentary-Provenance (Quelle, Modell, Template-Hash, Approval-Hash).
- SEO-Programm-Status und Evidence-Dateien folgen Documentary D0–D7 Lifecycle, sobald D0 Baseline stabil ist.
- Kein Marketing-Claim ohne nachvollziehbare Documentary-Linie.

### 6.2 Vocabulary / „Wiktionary“

- Kanonische SEO-/Marketing-Terme (Keyword, Rank Snapshot, ContentPackage, hreflang, Consent Gate, …) werden über Vocabulary Governance (ESS-0017 / ADR-0044/0046) registriert.
- UI- und API-Bezeichner folgen der bilingualen Registry; keine Ad-hoc-Synonyme in neuen Modulen.

### 6.3 VersionManager

- Schema-Migrationen (`seo_*`), Feature-Flags und Release-Gates laufen über VersionManager / Release-Lifecycle (ESS-0004, ADR-0030 resolved).
- Roadmap-Version dieses Dokuments und Schema-Versionen sind in Release-Changelogs referenzierbar.

### 6.4 SocialMediaEngine & SeoEngine

- **Eine** Distribution-Authority: `SocialMediaEngine` + bestehende Publisher.
- **Eine** SEO-Management-Authority: `src/platform/SeoEngine/` (ADR-0082).
- Open-Source (z. B. rank-tracker-ähnliche Tools, Postiz-ähnliche Orchestratoren, n8n): nur als **optionale Evidence-/Worker-Adapter** hinter CAPITAL-AI-Contracts; niemals OAuth-, Token- oder Policy-Root.

### 6.5 Google MCP

- Read/Evidence: GA4, Search Console (geplant) gemäß ESS-0014.
- Write/Admin: nur CAPITAL-AI-Adapter + IAM + Approval + Audit; Claude/andere Modelle sind Host-Profile, nicht Trust Root (ADR-0035).

---

## 7. Sicherheits- und Governance-Invarianten (unverhandelbar)

1. AI-Provider ist nie Trust Root.
2. Marketing-Agent erbt **keine** Systemadmin-Authority.
3. Consent Mode v2 und Strict CSP+Nonce bleiben geschützt (Protected Change).
4. Quantitative Finanzaussagen brauchen Source-Evidence; sonst DENY für Publish.
5. Human/Owner-Approval ist hash-gebunden bis eine spätere ADR eine sichere autonome Klasse definiert.
6. Merge bleibt Human-only.
7. Shared Integration Zone (Workflows, global IAM, Bootstrap, shared Migrations) erfordert explizite Koordination / Single-Writer.
8. No-Demo-Data: keine geschätzten Rankings in Produktion.

---

## 8. Open-Source- und externe Tools (Policy)

| Kategorie | Erlaubt als | Nicht erlaubt |
|-----------|-------------|---------------|
| Rank-/SERP-Evidence | Read-Adapter hinter SeoEngine | Autoritative Ranking-Quelle ohne GSC/Manual |
| Social Orchestration (Postiz-ähnlich) | Optionaler Worker hinter SocialMediaEngine | Eigenes Token-Store / Parallel-Publish |
| Workflow (n8n o. ä.) | Interne Orchestrierung in Sandbox | Produktions-Secrets im Worker |
| Media (TTS/Video OSS) | Sidecar mit validiertem Input/Output-Hash | Direktzugriff auf Social OAuth |

Auswahl und Einführung jedes Adapters: eigener kleiner ADR-Nachtrag + Supply-Chain-Check (M6-Provenance-Prinzipien).

---

## 9. Traceability & Definition of Done (Programm)

Pro WP mindestens:

- Verweis auf dieses Roadmap-ID + WP-ID
- ADR/ESS falls Architektur/Trust-Boundary
- Tests (positiv + negativ)
- redigierte Evidence unter `docs/evidence/` oder SEO-Notes
- Aktualisierung der Marketing/SEO Traceability Matrix
- PR mit Human Review; Branch löschen nach Merge

Programm gilt als abgeschlossen, wenn:

- alle WP-Q/D/S mit VERIFIED oder OWNER-ACCEPT,
- N1–N4 und M0–M6 mit akzeptierter Governance und mindestens einem bounded Pilot,
- ADR-0035 DoD erfüllt oder explizit risikobegründet akzeptiert,
- keine parallele offene SEO-/Marketing-Roadmap mehr Authority beansprucht,
- Master-Index auf SEO-GM-ROADMAP-0002 zeigt.

---

## 10. Sofortige nächste Schritte (Stand 2026-08-16, nach WP-D3 VERIFIED)

1. ~~**Owner:** FK RESTRICT Apply (`20260815220000`) + Ledger-Abgleich~~ — angewendet 2026-08-15.
2. **Owner:** Search Console Property verifizieren (WP-Q-CLOSE / Q3).
3. ~~ADR-Draft SeoEngine nummerieren~~ — **ADR-0082** Accepted (Kollisionscheck nach PR #345: 0075–0081 belegt).
4. ADR-0068 + ESS-0022 Owner-Review (WP-M0) — ohne Runtime-Enablement.
5. ~~WP-D3 Soft-404~~ — **VERIFIED** (PR #360; prod curl 2026-08-16).
6. Nächstes **Code**-WP ohne Shared-Zone-Lease: **WP-D1 / D2** (JSON-LD Rich-Results-DoD, route-specific titles/meta).
7. WP-S2 nur nach formalem Prerender-ADR.

Vollständiger Übergabekontext: `docs/seo/HANDOFF_WP_S1_NEXT_2026-08-15.md`. Canonical ADR: `docs/adr/ADR-0082-seo-engine-platform-module.md`.

---

## 11. Änderungshistorie

| Version | Datum | Änderung |
|---------|-------|----------|
| 0002.0 | 2026-08-15 | Erstausgabe: Konsolidierung SEO-ROADMAP-0001 + MARKETING_AGENT_ROADMAP + Google-Marketing-Programmplan zu Single Point of Trust |
| 0002.1 | 2026-08-15 | Ist-Stand S1: Store-Code PR #335 auf main; Owner-Gates (FK/Ledger/ADR) explizit; nächste Schritte aktualisiert |
| 0002.2 | 2026-08-16 | WP-S1 **VERIFIED**: ADR-0082 Accepted (nach PR #345 Nummernraum); §4/§5.2/§10 synchronisiert |
| 0002.3 | 2026-08-16 | WP-D3 Soft-404 **VERIFIED** (PR #360; prod commit `54c48ca`; unknown → 404); §4/§5.1/§10 synchronisiert |
