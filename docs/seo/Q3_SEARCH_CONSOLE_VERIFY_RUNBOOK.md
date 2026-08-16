# SEO Q3 — Google Search Console Property verifizieren

**Roadmap:** SEO-GM-ROADMAP-0002 / WP-Q-CLOSE / Q3  
**Status:** **VERIFIED** (2026-08-16)  
**Claim:** `.ai/work-claims/SEO-WP-Q3-SEARCH-CONSOLE-VERIFY-2026-08-16.json`  
**Nachfolger:** D5 Search Console MCP Read (`docs/seo/SEARCH_CONSOLE_MCP_RUNBOOK.md`)

## Verifizierungsergebnis (Owner, 2026-08-16)

| Prüfpunkt | Status |
|-----------|--------|
| Property-Typ | **Domain** `capital-ai.online` |
| Eigentum / Ownership | **Bestätigt** (Owner) |
| `https://capital-ai.online/sitemap.xml` in GSC | **Erfolg** / grün |
| Falsche Seiten-URLs als Sitemap | vom Owner entfernt |
| `robots.txt` / live Sitemap | **200** (4 öffentliche URLs) |
| Soft-404 | VERIFIED (PR #360) |

## Abnahme-DoD (Q3) — erfüllt

- [x] Property `capital-ai.online` (Domain) zeigt Status **Bestätigt**.
- [x] Sitemap in GSC eingereicht und ohne harten Fehler (Success).
- [x] Evidence + Claim `verified` (dieser Branch / PR).

## Bereits erfüllt (technisch)

| Prüfpunkt | Status |
|-----------|--------|
| `https://capital-ai.online/robots.txt` | **200**, Sitemap-Zeile vorhanden |
| `https://capital-ai.online/sitemap.xml` | **200**, `application/xml`, 4 öffentliche URLs |
| Canonical in `index.html` | `https://capital-ai.online/` |
| Soft-404 | VERIFIED (PR #360) |
| Meta-Placeholder Q3 in `index.html` | Kommentar vorhanden; **kein** Token nötig (DNS/Domain-Verify) |

## Methode (ausgeführt)

**Domain-Property** `capital-ai.online` — Ownership bereits bestätigt. Sitemap `https://capital-ai.online/sitemap.xml` eingereicht und erfolgreich.

## Nach Verifizierung

| Aktion | Wer | Status |
|--------|-----|--------|
| Sitemap submit | Owner in GSC UI | **DONE** |
| Claim + Roadmap Q3 → VERIFIED | Agent | **dieser PR** |
| D5 MCP Read-Credentials | Owner separat (`SEARCH_CONSOLE_MCP_RUNBOOK.md`) | **nicht** Teil von Q3 |

## Nicht tun (unverändert)

- Keine GSC-Service-Account-Keys oder OAuth-Secrets ins Repository.
- Kein Write-Scope für MCP (ESS-0014).
- Keine zweite parallele Verify-Methode „auf Vorrat“ committen.
