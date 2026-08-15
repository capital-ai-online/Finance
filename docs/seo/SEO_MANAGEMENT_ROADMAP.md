# CAPITAL-AI SEO Management — Programm-Roadmap

## Document ID

SEO-ROADMAP-0001

## Bezug

- `docs/seo/SEO_CHECKLIST.md`
- `docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_TOPOLOGY.md`
- `docs/architecture/CAPITAL_AI_ARCHITEKTUR_BEWERTUNGSMATRIX_2026-08-08.md`
- `docs/adr/ADR-0026-social-media-direct-publishing-real-integration.md` (dort als ADR-0020 zitiert)
- `docs/adr/ADR-0027-social-media-access-restriction-owner-founder.md`
- `docs/architecture/ENTERPRISE_FINTECH_SCREENING_GOVERNANCE_AUDIT.md` (Formatvorlage, §10)

## Status

Aktiv — Programmplan. Ursprüngliche Basis `1809f03`; Fortschritt zuletzt am 15.08.2026 gegen `main@ac47dfd` abgeglichen.

---

## 1. Zielbild

**Ziel.** Ein vollständiges Capital-AI SEO Management aufbauen.

**Vision.** Über das AI SEO Management wird automatisiert ein **autonomes Marketing** integriert.

**Mission.** Anbindung aller relevanten Social-Media-Plattformen über Supabase sowie
API-Konfiguration über den Google-Admin-Connector des Google MCP. Innerhalb der Webanwendung
entstehen aus vordefinierten Skripten Podcasts, Tweets, Community-Beiträge, Videos, Lernvideos und
weitere Werbemittel, die direkt auf die Plattformen gestellt werden.

**Wesentliche Vorbedingung.** Ziel, Vision und Mission bauen aufeinander auf: ohne messbares SEO
(Blöcke `Q`–`D`) gibt es keine Steuergröße; ohne SEO-Management-Kern (`S`) keine Automatisierung;
ohne Content-Generierung (`N`) keine Mission; ohne Feedback-Loop (`H`) keine Autonomie (`J`).

---

## 2. Legende der Zeithorizont-Präfixe

Die Präfixe folgen der in ARCH-AUDIT-0002 (§14) und ARCH-AUDIT-0005 (§10) etablierten Konvention.
Es sind **deutsche Zahlwort-Anfangsbuchstaben** für den jeweiligen Zeithorizont; lediglich die
Sofortmaßnahmen tragen das englische Kürzel:

| Präfix | Zeithorizont | Herleitung |
|---|---|---|
| `Q` | Quick Wins (< 1 Woche, je ≤ 2 PT) | **Q**uick Wins |
| `D` | 30 Tage | **D**reißig |
| `S` | 60 Tage | **S**echzig |
| `N` | 90 Tage | **N**eunzig |
| `H` | 180 Tage | **H**undertachtzig |
| `J` | 12 Monate | **J**ahr |

Nicht zu verwechseln mit `P0`–`P3` (Priorität) und `AUD<n>-F-<nnn>` (Befund-IDs aus Audit *n*).

---

## 3. Ausgangslage (verifiziert, Stand `1809f03`)

### 3.1 SEO — faktisch nicht vorhanden

| Befund | Nachweis |
|---|---|
| Kein `robots.txt`, keine `sitemap.xml` | nicht im Repository; `public/` enthält nur `.well-known/`, `cookiehub-init.js`, `favicon.svg`, `google-analytics-consent.js`, Security-/TikTok-Nachweise |
| Kein JSON-LD / schema.org | `index.html` ohne `application/ld+json` |
| Kein `canonical`, keine Search-Console-Verifizierung | `index.html` — Duplicate-Content-Risiko, da `/datenschutz` **und** `/datenschutz/` bedient werden |
| Alle Routen teilen einen `<title>` | SPA mit einer `index.html`; `/impressum`, `/agb`, `/datenschutz` rendern identisch „CAPITAL-AI Portal" |
| Kein SSR/Prerendering | SPA-Fallback liefert `dist/index.html`; Crawler sehen ein leeres `<div id="root">` |
| Soft-404 | nur Scanner-Köderpfade liefern 404 (`PROBE_PATH_PATTERNS`); jede andere unbekannte URL antwortet HTTP 200 |
| Ein Bundle, 2,49 MB / 678 kB gzip | `vite build`; deckt sich mit `D3` aus ARCH-AUDIT-0005 → hier als `carried` geführt |
| `og:image` auf Fremd-Domain | `index.html`: `https://webscan-radar.com/badge/Capital-AI.online` |

### 3.2 Social Publishing — echt gebaut, endet vor der Mission

Vorhanden und funktionsfähig: PKCE-OAuth, verschlüsselter Token-Store, Publish-Log,
Zugriffsbeschränkung auf Owner/Founder (ADR-0027), Supabase-Migration
`20260801150000_social_media_publishing.sql`, Routen und UI.

| Plattform | Heutiger Zustand |
|---|---|
| X (Text-Tweet) | veröffentlicht real |
| Facebook (Page-Text-Post) | veröffentlicht real |
| YouTube, TikTok, Instagram | scheitern **bewusst** mit `mediaRequiredError` — es existiert kein Rendering |
| LinkedIn, Reddit, Discord, Telegram, Podcast-RSS | nicht angebunden |

Die Content-Generierung fehlt vollständig: `SocialMediaGeneratorService.ts` dokumentiert selbst,
dass `generateSeries`, der Endpunkt `POST /api/social-media/generate` und die Studio-Oberfläche
nie geliefert wurden. **Genau hier setzt Block `N` an.**

### 3.3 Google MCP

`.mcp.json` bindet einen einzigen Read-Server ein (`ga4-analytics`). Search Console, Ads, AdSense
sowie der gesamte Write-/Admin-Pfad sind spezifiziert, aber nicht implementiert — siehe
`CAPITAL_AI_GOOGLE_MARKETING_MCP_TOPOLOGY.md`.

---

## 4. Priorisierte Roadmap

Aufwand in Personentagen (PT). ROI-Skala: sehr hoch / hoch / mittel / niedrig.

### 4.1 Quick Wins (< 1 Woche, je ≤ 2 PT) — SEO-Fundament

| # | Maßnahme | Business Value | ROI | Aufwand | Risiko | Betroffene Dateien |
|---|---|---|---|---|---|---|
| Q1 | `robots.txt` + generierte `sitemap.xml` | sehr hoch — ohne beides keine steuerbare Indexierung | sehr hoch | 1 | niedrig | `public/robots.txt`, `public/sitemap.xml`, `scripts/` |
| Q2 | `<link rel="canonical">` + Trailing-Slash-Normalisierung | hoch — Duplicate Content | sehr hoch | 1 | niedrig | `index.html`, `server/middleware/` |
| Q3 | Search-Console-Property verifizieren | sehr hoch — Voraussetzung jeder Messung | sehr hoch | 0,5 | niedrig | `index.html` (Meta) oder DNS |
| Q4 | `SEO_CHECKLIST.md` auf den Ist-Stand korrigieren | mittel — No-Demo-Data/Governance | hoch | 0,5 | niedrig | `docs/seo/SEO_CHECKLIST.md` |
| Q5 | `og:image` von Fremd-Domain auf eigenes Asset | mittel — Fragilität + Drittanbieterbezug | hoch | 1 | niedrig | `index.html`, `public/` |
| Q6 | Obsolete Google-AI-Studio-Origin-Ausnahme entfernen | mittel — nicht mehr genutzt, unnötige Angriffsfläche | hoch | 1 | niedrig | `server.application.ts`, `server/middleware/cors.ts`, `.env.example`, `render.yaml`, ADR-0009-Nachtrag |

**Summe Quick Wins: 5 PT.**

### 4.2 30 Tage — Auffindbarkeit und Messbarkeit

| # | Maßnahme | Business Value | ROI | Aufwand | Risiko | Betroffene Module |
|---|---|---|---|---|---|---|
| D1 | JSON-LD: `Organization`, `WebSite`, `SoftwareApplication` | hoch — Rich Results, heute null strukturierte Daten | hoch | 3 | niedrig | `index.html`, `public/` |
| D2 | Routen-spezifische Titles und Meta-Tags | hoch — Legal- und Feature-Seiten sind heute ununterscheidbar | hoch | 5 | mittel | `src/App.tsx`, neuer Meta-Layer |
| D3 | Soft-404 beheben: unbekannte Routen liefern echten 404 | hoch — Soft-404-Abwertung, unbegrenzter URL-Raum | hoch | 3 | mittel | `server.application.ts` |
| D4 | Bundle-Splitting (`manualChunks`) *(carried, = `D3` ARCH-AUDIT-0005)* | mittel — LCP / Core Web Vitals | mittel | 8 | niedrig | `vite.config.ts` |
| D5 | Search-Console-API als zweiter MCP-Read-Server | hoch — schließt die Monitoring-Lücke der Topologie | hoch | 5 | niedrig | `.mcp.json`, Runbook |

**Summe 30 Tage: 24 PT.**

### 4.3 60 Tage — SEO-Management-Kern

| # | Maßnahme | Business Value | ROI | Aufwand | Risiko |
|---|---|---|---|---|---|
| S1 | `src/platform/SeoEngine/` + Supabase-Schema: Keyword-Register, Ranking-Historie, Content-Inventar | sehr hoch — das eigentliche „Management" | hoch | 15 | mittel |
| S2 | Prerendering/SSG der öffentlichen Routen | sehr hoch — Crawler sehen heute keinen Inhalt | hoch | 12 | hoch |
| S3 | SEO-Dashboard in der Webanwendung (Search Console + GA4) — **abgeschlossen, PR #309** | hoch | mittel | 8 | niedrig |
| S4 | hreflang-/Sprachstrategie klären (`lang="de"`, Keywords DE+EN gemischt) — **im Folge-Branch umgesetzt** | mittel | mittel | 5 | niedrig |

**Summe 60 Tage: 40 PT.**

### 4.4 90 Tage — Content-Generierung (Kern der Mission)

| # | Maßnahme | Business Value | ROI | Aufwand | Risiko |
|---|---|---|---|---|---|
| N1 | `POST /api/social-media/generate` + Prompt-Orchestrierung — das in ADR-0026 §3 fehlende `generateSeries` | sehr hoch — ohne dies keine Mission | sehr hoch | 15 | mittel |
| N2 | Skript-Vorlagen: Podcast, Tweet, Community-Beitrag, Video, Lernvideo | sehr hoch | hoch | 10 | niedrig |
| N3 | Media-Rendering (TTS-Audio + Video) — hebt die `mediaRequiredError`-Sperre für YouTube/TikTok/Instagram | sehr hoch | mittel | 30 | **hoch** |
| N4 | Content-Kalender + verpflichtender Owner-Freigabe-Workflow vor Veröffentlichung | hoch — Governance-Gate | hoch | 8 | mittel |

**Summe 90 Tage: 63 PT.**

### 4.5 180 Tage — Plattform-Breite und Google-Admin-Connector

| # | Maßnahme | Business Value | ROI | Aufwand | Risiko |
|---|---|---|---|---|---|
| H1 | Weitere Plattformen: LinkedIn, Reddit, Discord, Telegram, Podcast-RSS/Spotify | hoch | mittel | 30 | mittel |
| H2 | Google-Admin-Connector (GA Admin + Tag Manager API) hinter dem vollständigen ESS-0014-Gateway | hoch — erste echte Write-Ebene | mittel | 25 | **hoch** |
| H3 | Performance-Feedback-Loop: Search Console/GA4 → Content-Scoring | hoch | hoch | 15 | mittel |

**Summe 180 Tage: 70 PT.**

### 4.6 12 Monate — autonomes Marketing (Vision)

| # | Maßnahme | Business Value | ROI | Aufwand | Risiko |
|---|---|---|---|---|---|
| J1 | SEO-/Marketing-Agent im bestehenden Multi-Agenten-Framework | sehr hoch | mittel | 30 | hoch |
| J2 | Closed Loop: planen → generieren → publizieren → messen → adaptieren, mit harter Owner-Freigabeschranke | sehr hoch — die Vision | mittel | 40 | **hoch** |
| J3 | Internationalisierung und Mehrsprachigkeit | mittel | niedrig | 25 | mittel |

**Summe 12 Monate: 95 PT.**

**Programmsumme: 297 PT.**

---

## 5. Priorisierung nach den drei geforderten Kriterien

**Nach Business Value:** Q1/Q3 (ohne Indexierung und Search Console ist jede spätere Maßnahme
unmessbar) → N1/N2 (Kern der Mission) → S1 (Management-Substanz) → D2/D3 (Indexierbarkeit je
Route) → J2 (Vision)

**Nach technischer Kritikalität:** Q6 (obsolete CORS-Ausnahme) → D3 (Soft-404 erzeugt unbegrenzten
URL-Raum) → S2 (ohne Prerendering bleibt der gesamte Inhalt für Nicht-JS-Crawler unsichtbar) →
D4 (Bundle) → N3 (teuerste und riskanteste Einzelmaßnahme)

**Nach Enterprise-Reifegrad:** Q4 (Ehrlichkeit der Dokumentation) → D5/H2 (MCP-Ebenen gemäß
ESS-0014 ausbauen) → N4 (Freigabe-Workflow vor jeder Veröffentlichung) → J2 (Autonomie erst mit
belastbarer Freigabeschranke)

**Empfohlene Gesamtreihenfolge:** **Quick Wins vollständig (5 PT, schafft in einer Woche
überhaupt erst die Voraussetzung für Messbarkeit) → D5 + D1/D2/D3 (Monitoring-Kette schließen und
Seiten indexierbar machen) → S1/S3 (Management und Sichtbarkeit der Kennzahlen) → N1/N2
(Content-Generierung; liefert bereits ohne N3 vollen Nutzen für X, Facebook und Community-Text) →
N4 vor jeder Automatisierung → danach Entscheidung über N3 (Make-or-Buy Media-Rendering) →
H/J.** Begründung: Die Quick Wins sind nahezu kostenlos und ohne sie ist der Erfolg jeder weiteren
Maßnahme unbelegbar. N1/N2 liefern den größten Missionsfortschritt pro Personentag, weil die
gesamte Publishing-Kette darunter bereits existiert und getestet ist — es fehlt ausschließlich die
Erzeugung des Inhalts.

---

## 6. Lieferschnitt (ein Pull Request je Block)

| PR | Inhalt | Art |
|---|---|---|
| PR 0 | Diese Roadmap, MCP-Topologie, Bewertungsmatrix, Checklist-Korrektur | Dokumentation |
| PR 1 | Block `Q` | Produktionscode |
| PR 2 | Block `D` | Produktionscode |
| PR 3 | Block `S` | Produktionscode |
| PR 4 | Block `N` | Produktionscode |
| PR 5 | Block `H` | Produktionscode |
| PR 6 | Block `J` | Produktionscode |

Je PR: eigener Branch, eigener Work-Claim unter `.ai/work-claims/`, vollständig ausgefülltes
`.github/pull_request_template.md` (v1.0.0) inklusive Abschnitt 4 (Multi-Agent-Koordination)
**vor** Erstellung, Draft bis alle technischen Gates grün sind.

---

## 7. Erforderliche ADRs

Neue Architekturentscheidungen benötigen laut Repository-Governance einen ADR:

| Auslöser | Gegenstand |
|---|---|
| `S1` | `SeoEngine`-Plattformmodul und zugehöriges Supabase-Schema |
| `S2` | Prerendering/SSG-Strategie für öffentliche Routen |
| `N1`, `N3` | Content-Generierung und Media-Rendering (hebt die bewusste Abgrenzung in ADR-0026 §3 auf) |
| `J2` | Autonomes Publizieren mit Freigabeschranke |
| `Q6` | Nachtrag zu ADR-0009 (Abschaltung der AI-Studio-Origin-Ausnahme) |

ADR-Nummern erst bei Erstellung ziehen: Nummernkollisionen sind im Repository dreimal aufgetreten
(AUD5-F-002).

---

## 8. Offen benannte Risiken

- **`N3` ist mit ~30 PT der teuerste Posten und wurde in ADR-0026 §3 bewusst ausgeklammert.** Ohne
  ihn bleiben YouTube, TikTok und Instagram gesperrt; die Mission wäre auf Text-Plattformen
  beschränkt. Die Alternative — ein externer Rendering-Dienst — ist eine eigene
  Make-or-Buy-Entscheidung und wird dem Owner vorgelegt, nicht vorweggenommen.
- **Autonomes Publizieren (`J2`) steht in Spannung zur Owner-Approval-Kultur des Repositories.**
  `J2` ist deshalb ausdrücklich mit harter Freigabeschranke geplant, nicht als selbsttätiges
  Veröffentlichen.
- **Parallelbetrieb mehrerer Agenten.** Zum Stichtag existieren zwölf aktive, exklusive
  Work-Claims eines anderen Anbieters. `docs/seo/**` ist frei; ab `Q6`/`D3` wird jedoch
  `server.application.ts` berührt, das aktiv beansprucht ist. Vor PR 1 ist die Konfliktlage erneut
  zu prüfen und offenzulegen.
- **Aufwands- und ROI-Angaben sind Schätzungen**, keine gemessenen Werte, und dienen der
  Priorisierung — nicht der Budgetzusage.
