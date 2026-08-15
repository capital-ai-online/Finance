# CAPITAL-AI SEO Management — Programm-Roadmap

> **Status: SUPERSEDED** (2026-08-15)  
> **Nachfolger (Single Point of Trust):** [`docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md`](../roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md) — **Document ID: SEO-GM-ROADMAP-0002**  
> Dieses Dokument behält historischen Evidence-Wert. Es begründet **keine** parallele Programmautorität mehr. Offene Arbeitspakete und Statusfortschreibung erfolgen ausschließlich über SEO-GM-ROADMAP-0002.

## Document ID

SEO-ROADMAP-0001 *(superseded)*

## Bezug

- `docs/seo/SEO_CHECKLIST.md`
- `docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_TOPOLOGY.md`
- `docs/architecture/CAPITAL_AI_ARCHITEKTUR_BEWERTUNGSMATRIX_2026-08-08.md`
- `docs/adr/ADR-0026-social-media-direct-publishing-real-integration.md` (dort als ADR-0020 zitiert)
- `docs/adr/ADR-0027-social-media-access-restriction-owner-founder.md`
- `docs/architecture/ENTERPRISE_FINTECH_SCREENING_GOVERNANCE_AUDIT.md` (Formatvorlage, §10)
- **Kanonisch ab 2026-08-15:** `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md`

## Status

**SUPERSEDED** — ehemals Aktiv. Fortschritt und offene Pakete sind in SEO-GM-ROADMAP-0002 konsolidiert (Stand 2026-08-15).

---

## Historischer Inhalt (unverändert, nur Evidence)

Der nachfolgende Text bleibt als historische Spezifikation erhalten und wird nicht fortgeschrieben.

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

## 4–8. Historische Priorisierung, Lieferschnitt, ADRs, Risiken

Siehe Originalversion vor SUPERSEDED-Markierung bzw. die konsolidierte Fortschreibung in **SEO-GM-ROADMAP-0002** (aktueller Ist-Stand Q/S3/S1 und Work-Package-Mapping).
