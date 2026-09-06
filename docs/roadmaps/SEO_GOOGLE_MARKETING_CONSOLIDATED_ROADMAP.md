# CAPITAL-AI SEO + Google Marketing — Konsolidierte Programm-Roadmap

## Document ID

**SEO-GM-ROADMAP-0002**

## Status

**ACTIVE — CANONICAL EXECUTION ROADMAP (Domain SEO / Google Marketing / Content Distribution)**  
Stand: 2026-09-06  
Version: **0002.15**  
Current-main correlation: `main@7fe061a897f669fd21ca4c46e564351e14f1c7dc`  
Production observation: `x-capital-ai-commit=076e88e231372b2c9a9191917090388486a6f2f8`  
Owner: SvenKulessa / `CAPITAL-AI-SEO` project coordination  
Primary productive PVC: **N/A — cross-cutting; no productive PVC ownership**  
Authority-Bindung: current `/AGENTS.md`, anwendbare Accepted ADR / aktive ESS. Diese Roadmap erzeugt keine Mutationsberechtigung.

> **0002.15 Closeout.** Q1-Härtung ist auf `main` und in Production beobachtet. Google-Read-PASS bleibt getrennt. Offene Restarbeit ist Owner-/Fremdowner-gated. Die Branch `agent/seo-roadmap-recorrelation-20260905` (0002.14-Entwurf gegen `9bedefa8`) wird nicht als zweiter PR eröffnet.

## Zweck

Konsolidierter Ausführungsplan ohne parallele Roadmap-Autorität. Runtime-, Deploy-, IAM-, Billing-, Google-Write-, DNS- und Publish-Änderungen bleiben beim jeweiligen Primary Owner.

---

## 1. Authority- und Ownership-Reihenfolge

1. current `/AGENTS.md` und höhere Authority;
2. Project Value Chain / Primary Owner;
3. anwendbare Accepted ADR / aktive ESS;
4. diese Roadmap für SEO/Google-Marketing-Planung;
5. `docs/seo/**` Runbooks, Checklists, Evidence;
6. historische Claims und ältere Roadmap-Stände.

`CAPITAL-AI-SEO` besitzt keinen produktiven `PVC-*`. FE bleibt Frontend, Render/Deploy/IAM bleibt OPS, Publishing-Control bleibt GOV, Rechtsbewertung bleibt COMP.

---

## 2. Ist-Stand 2026-09-06

### 2.1 Technical SEO / SeoEngine

| WP | Status | Evidence / Gate |
|---|---|---|
| Q1 robots + sitemap + Harden | **IMPLEMENTED_ON_MAIN + LIVE** | PR #760; Live-Sitemap fünf URLs inkl. `/learning-platform`; Regression `tests/unit/seoPublicRouteSitemap.test.ts` |
| Q2 canonical + trailing slash | **IMPLEMENTED_ON_MAIN** | Canonical/Route-SEO + Server-Normalisierung; frischer Redirect-Smoke nicht erneut gefahren |
| Q3 Search Console Verify | **HISTORICAL_PROVIDER_EVIDENCE** | Owner-Verify 2026-08-16 Domain `capital-ai.online`. Kein frischer GSC-Read 2026-09-06 |
| Q4 Checklist | **CURRENT** | `docs/seo/SEO_CHECKLIST.md` auf 2026-09-06 |
| Q5 og:image | **IMPLEMENTED_ON_MAIN** | `public/og-image.svg` |
| D1 JSON-LD | **VERIFIED / LIVE** | `softwareVersion` `0.6.0` live |
| D2 route titles/meta | **VERIFIED** | `src/lib/routeSeo.ts` |
| D3 Soft-404 | **VERIFIED** | PR #360; unknown → 404 |
| D4 Bundle / CWV | **OPEN — FE-OWNED** | Kein SEO-PR |
| D5 Search Console MCP | **NOT ENABLED** | Runbook vorhanden; kein MCP-Server; Credential-Gate |
| S1 SeoEngine | **VERIFIED** | ADR-0082; PR #335 |
| S2 Prerender | **VERIFIED** | ADR-0084 |
| S3 Dashboard | **IMPLEMENTED_ON_MAIN** | Admin SEO dashboard |
| S4 Sprache / hreflang | **SPEC COMPLETE** | German-first; kein produktives `hreflang` bis echte Locale-URLs existieren |

### 2.2 Google / Consent / CSP

| Thema | Status | Gate |
|---|---|---|
| GA4 Browser-ID | Live-HTML `G-0542DT2HCE` | kein Data-API-PASS |
| GA4 MCP / Realtime | `.mcp.json` Stanza vorhanden | aktueller API-Erfolg **NOT ENABLED** |
| WIF | nicht auf current main | OPS/IAM, falls gewünscht |
| Search Console MCP | nicht in `.mcp.json` | **NOT ENABLED** |
| Consent Mode v2 Runtime | CookieHub live ausgeliefert | kein frischer Pre-Opt-in-Trace |
| ADR-0035 Protected Marketing | ACCEPTED / Implementation in progress | Strict-CSP-Promotion separat |
| AdSense publisher meta | live `ca-pub-1353017943074018` | Smoke/DoD offen |
| `GOOGLE_VISIBLE_PASS` | **NOT ENABLED** | keine identifizierte Google-SERP/GSC-Auth-Surface nach Reindex |

### 2.3 Content / Social / Marketing

| WP | Status | Gate |
|---|---|---|
| M0 | Accepted Docs; Runtime nicht enabled | Execution Policy DRAFT |
| N1 / N2 | Code auf main | Feature-Flag getrennt |
| N3 Validierung | erfüllt | Renderer Make-or-Buy offen |
| N4 Hash-Approval | erfüllt | Kalender-UI offen |
| M5 / M6 / H1 / H2 / H3 / J1 / J2 | OPEN / NOT ENABLED | fremde Authority + Owner-Freigabe |
| R1 / R2 / R3 | PARTIAL / OPEN | COMP/Billing/Protected Change |

---

## 3. SEO-owned Closeout in PR #764

Dieses eine PR-Paket schließt die SEO-Dokumentationslücke:

- Evidence-Klassifikation nach Q1-Production;
- Owner-Roadmap + Checklist auf current main;
- Programm-Roadmap 0002.15 statt zweitem PR aus `agent/seo-roadmap-recorrelation-20260905`;
- Q1-Claim bleibt `released`.

Nicht enthalten und bewusst nicht nachgezogen:

- Frontend-CWV (D4);
- Credential-/MCP-Aktivierung (D5, GA4 Read);
- Google Write/Admin, Reindex, Sitemap-Submit;
- Render/IAM/WIF;
- Marketing-Runtime, Kalender, Renderer-Kaufentscheidung.

---

## 4. Restqueue nach Human Merge

Priorität nur wenn der jeweilige Owner aktiviert:

1. Owner read-only GSC-Check der Domain-Property inkl. `/learning-platform` — sonst weiterhin `NOT ENABLED`.
2. `CAPITAL-AI-FE`: WP-D4 nur bei messbarem Auftrag.
3. Owner-Credentials: WP-D5 Search Console MCP Read, kein Write.
4. GOV/OPS/COMP: M5+, H2, R1-Close, N3-Renderer, N4-Kalender.

Nach jedem dieser Schritte current `main` und offene PRs neu lesen. Kein automatischer Folge-PR durch SEO.

---

## 5. Invarianten

1. CookieHub bleibt Consent Source of Truth.
2. Read- und Write-Plane bleiben getrennt (ESS-0014).
3. Config ≠ Provider-PASS.
4. Keine synthetischen Rankings, Traffics oder Conversions.
5. Kein zweites Publishing-/Token-System.
6. Merge bleibt Human/CODEOWNER-only.
7. Ein geschlossener ungemergter PR ist nie current-main-Evidence.
8. Ein zweiter SEO-Dokumentations-PR für denselben Closeout ist unzulässig.

---

## 6. Definition of Done — Programm

Das **SEO-owned Dokumentations-/Korrelationsprogramm** ist nach Human Merge von PR #764 repository-seitig geschlossen.

Das **Gesamtprogramm inkl. Google-Provider, Performance, Monetarisierungs-DoD und Marketing-Autonomie** ist nicht geschlossen, solange die Restqueue in §4 offen oder `NOT ENABLED` ist.

---

## 7. Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 0002.0–0002.13 | 2026-08-15..16 | Historische Konsolidierung; Evidence in Git-Historie |
| 0002.14 | 2026-09-05 | Entwurf auf `agent/seo-roadmap-recorrelation-20260905` gegen `9bedefa8`; Q1 noch als Drift. **Nicht gemergt. Durch 0002.15 ersetzt.** |
| 0002.15 | 2026-09-06 | Current-main `7fe061a8`; Q1 IMPLEMENTED_ON_MAIN + live; Production `076e88e2`; Evidence-Paket und Programm-Closeout in PR #764; Restqueue explizit fremdowner-gated |
