# CAPITAL-AI — Kompakte Architektur-Bewertungsmatrix

## Document ID

ARCH-MATRIX-0001

## Bezug

- `docs/architecture/ENTERPRISE_FINTECH_SCREENING_GOVERNANCE_AUDIT.md` (ARCH-AUDIT-0005, Vergleichsbasis)
- `docs/seo/SEO_MANAGEMENT_ROADMAP.md`
- `docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_TOPOLOGY.md`

## Status

Aktiv — Momentaufnahme zum Commit `1809f03`, Prüfstichtag 08.08.2026.

**Abgrenzung.** Dies ist **kein** vollwertiges Audit. Es ist eine kompakte Standortbestimmung als
Ausgangspunkt der SEO-Management-Roadmap. Die Spalte „AUD-0005" nennt die zuletzt formal
auditierten Werte; die Spalte „08.08." ist meine Einschätzung zum heutigen Stand. Wo ich keinen
eigenen belastbaren Prüfpfad hatte, übernehme ich den Auditwert unverändert und kennzeichne das.

Skala: Score 1–10. Reifegrad: Initial · Repeatable · Defined · Measured · Optimizing.

---

## 1. Matrix

| # | Kategorie | AUD-0005 | 08.08. | Reifegrad | Belegte Begründung der Veränderung |
|---|---|---|---|---|---|
| 1 | Wertschöpfungskette | 8 | 8 | Measured | unverändert übernommen — kein eigener Prüfpfad in diesem Durchgang |
| 2 | Documentary Engine | 4 | 4 | Defined | unverändert; `adr_history.json`-Rückstand (AUD5-F-003) nicht nachgeprüft |
| 3 | Code Engine | 5 | **6** | Defined | Server von Monolith auf 69 Module aufgeteilt; `server.ts` ist reiner Einstiegspunkt (ADR-0013) |
| 4 | Supervisor Layer | 4 | 4 | Defined | unverändert übernommen |
| 5 | Governance | 6 | **7** | Measured | Work-Claim-System (12 aktive Claims), verpflichtendes PR-Template v1.0.0, `pr-governance.yml` — Multi-Agent-Koordination erstmals maschinell gestützt |
| 6 | Compliance | 7 | **8** | Measured | Consent Mode v2 Basic produktiv, CookieHub als Source of Truth, Invarianten-Gate im Build (`verifyGoogleMarketingInvariants.ts`) |
| 7 | AI-Orchestrierung | 6 | 6 | Defined | unverändert übernommen |
| 8 | Finanzscreening | 7 | 7 | Measured | unverändert übernommen |
| 9 | Codequalität | 5 | **6** | Defined | 101 Testdateien, 477 Tests grün, `tsc --noEmit` fehlerfrei; Bundle mit 2,49 MB in einem Chunk bleibt die Bremse |
| 10 | Bewertungssystem | 6 | 6 | Defined | unverändert übernommen |
| 11 | Enterprise Plattform | 5 | **6** | Defined | Secret File `finance-secrets.env` mit 23 Schlüsseln und einer Single Source of Truth (`secretFileManifest.ts`), Image-Digest-Pinning, Non-Root-Container, Read-only-`docs/` |
| 12 | AI Enterprise Readiness | 5 | 5 | Defined | unverändert übernommen |
| **13** | **SEO / Auffindbarkeit** *(neu)* | — | **1** | **Initial** | kein `robots.txt`, keine Sitemap, kein JSON-LD, kein `canonical`, keine Search Console, ein `<title>` für alle Routen, kein Prerendering, Soft-404 |
| **14** | **Marketing-Automatisierung** *(neu)* | — | **3** | **Repeatable** | Publishing-Kette real (OAuth/PKCE, verschlüsselte Tokens, Publish-Log, Owner-Gate); veröffentlicht heute aber nur X und Facebook — Content-Generierung fehlt vollständig |
| **15** | **Google-MCP-Integration** *(neu)* | — | **4** | **Defined** | Read-Plane mit `ga4-analytics` produktiv; Search Console, Ads, AdSense und der gesamte Write-/Admin-Pfad spezifiziert, aber nicht implementiert |

**Gewichteter Gesamteindruck:** Die klassischen Plattform-Kategorien (1–12) liegen stabil im
Bereich *Defined/Measured*. Die drei für das Programm neu betrachteten Kategorien (13–15) fallen
deutlich ab — **SEO ist mit Score 1 die schwächste Kategorie der gesamten Architektur.**

---

## 2. Kernaussagen

**Stärke.** Die Substanz unterhalb des Marketing-Ziels ist überdurchschnittlich: echte OAuth-Kette
mit PKCE, verschlüsselte Token-Ablage, Publish-Log, Owner-/Founder-Zugriffsschranke,
Consent-Architektur mit Fail-Closed-Verhalten, Secret File statt verstreuter Einzel-Secrets,
Digest-gepinnte Container. Nichts davon muss für das SEO-Programm neu gebaut werden.

**Schwäche.** Die Plattform ist für Suchmaschinen praktisch unsichtbar und kann ihren eigenen
Marketing-Zweck deshalb heute nicht erfüllen. Score 1 bei SEO ist kein Detailbefund, sondern der
Engpass des gesamten Zielbilds.

**Strukturelles Muster.** 17 von 25 Plattformmodulen tragen `status: unspecified` — 68 % der
deklarierten Plattform sind Namensraum ohne Implementierung. Das ist ehrlich ausgewiesen und
testgesichert (`platformManifestIntegrity.test.ts`), verzerrt aber jede Außenwahrnehmung des
Reifegrads und sollte bei der Planung neuer Module (`SeoEngine`, `S1`) bewusst nicht fortgesetzt
werden.

**Governance-Risiko.** Zwölf gleichzeitig aktive, exklusive Work-Claims eines einzigen anderen
Anbieters decken Server, Governance und Google-Consent ab. Das Koordinationssystem funktioniert,
erhöht aber die Wahrscheinlichkeit, dass parallele Arbeit an denselben Dateien kollidiert — im
SEO-Programm ab Block `Q6`/`D3` konkret relevant.

---

## 3. Ableitung für die Roadmap

| Kategorie | Score | Adressiert durch |
|---|---|---|
| SEO / Auffindbarkeit | 1 | `Q1`–`Q5`, `D1`–`D4`, `S2` |
| Google-MCP-Integration | 4 | `D5` (Search Console), `H2` (Admin Connector) |
| Marketing-Automatisierung | 3 | `N1`–`N4`, `H1`, `H3`, `J1`–`J2` |
| Codequalität (Bundle) | 6 | `D4` *(carried aus ARCH-AUDIT-0005 `D3`)* |
| Enterprise Plattform | 6 | `Q6` (obsolete AI-Studio-Origin-Ausnahme entfernen) |

---

## 4. Erhebungsgrundlage

| Kennzahl | Wert | Quelle |
|---|---|---|
| Testdateien / Tests | 101 / 477 grün, 2 übersprungen | `npx vitest run` am 08.08.2026 |
| Typprüfung | fehlerfrei | `npm run lint` (`tsc --noEmit`) |
| Produktions-Bundle | 2,49 MB / 678 kB gzip, ein Chunk | `npx vite build` |
| ADRs | 47 | `docs/adr/` |
| ESS-Skills | 21 | `.ai/skills/` |
| Plattformmodule | 25 (5 `implemented`, 3 `development`, 17 `unspecified`) | `src/platform/*/manifest.json` |
| Servermodule | 69 | `server/`, `src/server/` |
| CI-Workflows | 7 | `.github/workflows/` |
| Secret-File-Schlüssel | 23 | `scripts/security/secretFileManifest.ts` |
| Aktive Work-Claims | 12 (alle „OpenAI GPT-5.6 Thinking") | `.ai/work-claims/` |
