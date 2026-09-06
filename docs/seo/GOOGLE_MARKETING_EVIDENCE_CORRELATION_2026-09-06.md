# CAPITAL-AI SEO — Google Marketing Evidence Correlation

**Date:** 2026-09-06  
**Observation window:** 2026-09-06T10:01:01Z (HTTP headers / public crawl)  
**Project:** `CAPITAL-AI-SEO`  
**Work package:** WP-GOOGLE-EVIDENCE  
**Repository baseline:** `main@076e88e231372b2c9a9191917090388486a6f2f8` (Human Merge PR #760 und PR #761)  
**PR #760 merge SHA:** `d080def271f36b208b85c5272ef863431d386de1`  
**Production commit observed:** `d080def271f36b208b85c5272ef863431d386de1` (`x-capital-ai-commit`)  
**External Google mutation performed:** `NO`

## Status taxonomy used

1. `IMPLEMENTED_ON_MAIN` — observable in current `main`
2. Repository-Konfiguration vorhanden — Datei/Deklaration existiert; kein Provider-PASS
3. historische Evidence — älterer Nachweis, nicht aktueller Provider-Stand
4. aktueller externer/providerseitiger Nachweis — heute beobachtbar
5. offene Mutation/Owner-Gate
6. `BLOCKED` / `NOT ENABLED`

Eine `.env`-/Render-Deklaration, MCP-Konfiguration, ein Runbook oder ein historischer GSC-Erfolg gilt nicht als aktueller Provider-PASS.

Frühere Beobachtung desselben Arbeitstages (Production-Commit `7c607de0…`, Live-Sitemap ohne `/learning-platform`) ist durch den nachfolgenden Render-Rollout überholt und wird nicht als aktueller Stand fortgeschrieben.

## A. Public crawl / version surfaces

| Surface | Observation 2026-09-06T10:01Z | Class |
|---|---|---|
| `package.json#version` | `0.6.0` | canonical authority |
| Live `x-capital-ai-version` | `0.6.0` | aktueller externer Nachweis |
| `SoftwareApplication.softwareVersion` live `https://capital-ai.online/` | `0.6.0` | aktueller externer Nachweis der öffentlichen Seite; nicht Google-Cache |
| Meta / OpenGraph / Twitter description live | `Version 0.6.0` | aktueller externer Nachweis der öffentlichen Seite |
| `GOOGLE_VISIBLE_PASS` | keine identifizierte Google-SERP/GSC/Auth-Surface nach Refresh/Reindex | `NOT ENABLED` |
| Historische `0.5.4`-Korrelation | `docs/seo/GOOGLE_VISIBLE_VERSION_CORRELATION_2026-09-02.md` | historische Evidence |

## B. Sitemap / Production deploy

| Surface | Observation 2026-09-06T10:01Z | Class |
|---|---|---|
| `public/sitemap.xml` @ current main | fünf kanonische URLs inkl. `/learning-platform` | `IMPLEMENTED_ON_MAIN` (PR #760) |
| `tests/unit/seoPublicRouteSitemap.test.ts` @ current main | vorhanden | `IMPLEMENTED_ON_MAIN` |
| Live `https://capital-ai.online/sitemap.xml` | fünf URLs inkl. `https://capital-ai.online/learning-platform` (priority 0.8) | aktueller externer Nachweis; Q1 Production-Sitemap-Gate erfüllt |
| Live `https://capital-ai.online/robots.txt` | explizites `Allow: /learning-platform` plus `Allow: /` | aktueller externer Nachweis |
| Live `/healthz` body | `status=ok`; Konfigurationspräsenz ohne Secret-Werte | aktueller externer Nachweis |
| Live `/healthz` identity headers | `x-capital-ai-commit=d080def271f36b208b85c5272ef863431d386de1`, `x-capital-ai-version=0.6.0`, `x-capital-ai-branch=main`, `x-capital-ai-provider=render`, `x-capital-ai-repo=SvenKulessa/Finance` | aktueller externer Nachweis |

Production trägt den Q1-Merge `d080def…` (PR #760). Current `main` ist `076e88e2…` (PR #761 COMP nach #760). Der verbleibende Production-Lag gegenüber current main ist COMP-Dokumentation, nicht die Q1-Sitemap. Production-Publish bleibt `CAPITAL-AI-OPS`. SEO führt keine Deployment-Mutation aus.

## C. Consent / GA4 browser delivery

| Surface | Observation 2026-09-06T10:01Z | Class |
|---|---|---|
| CookieHub on live homepage | `/cookiehub-init.js` und CSP-Allowlist `cdn.cookiehub.eu` / `cookiehub.net` | aktueller externer Nachweis: Consent-Source ist ausgeliefert |
| Live meta `ga-measurement-id` | `G-0542DT2HCE` | öffentliche Client-ID auf der Seite; beweist keine Analytics Data API |
| CSP live | `script-src` erlaubt GTM + CookieHub + AdSense-Host; Policy-Marker `x-csp-policy: ADR-0035+ADR-0040` | aktueller externer Nachweis der ausgelieferten Policy; kein Consent-Trace |
| `render.yaml` `VITE_GA_MEASUREMENT_ID` | `sync: false` | Repository-Konfiguration vorhanden; beweist nicht den produktiven Secret-Wert |
| Consent Mode v2 / zero-data-before-opt-in | Authority ADR-0042 / ESS-0014; Build-Invarianten-Skript existiert | Repository-Konfiguration + Accepted Authority; kein frischer Runtime-Trace vor/nach Opt-in in dieser Einheit |
| AdSense publisher meta live | `ca-pub-1353017943074018` | öffentliche Client-ID; AdSense Smoke/DoD offen |

Unterscheidung bleibt verbindlich: Measurement-ID in HTML ≠ consent-gated Treffer ≠ serverseitiger GA4-Read-Erfolg.

## D. Google Read-Plane / MCP / IAM

| Surface | Observation 2026-09-06 | Class |
|---|---|---|
| Q3 Domain property `capital-ai.online` | Owner-Verify 2026-08-16 + Runbook | historische Evidence; kein heutiger GSC-Read |
| Search Console MCP | nicht in `.mcp.json`; Runbook existiert | spezifiziert / `NOT ENABLED` |
| `.mcp.json` `ga4-analytics` via `uvx analytics-mcp` | Eintrag vorhanden; lokaler Credentials-Pfad | Repository-Konfiguration vorhanden |
| Analytics Data API / GA4 Realtime Read | nicht angebunden, nicht aufgerufen | `NOT ENABLED` |
| Workload Identity Federation | kein Treffer auf current main | nicht implementiert auf current main |
| Google Write / Admin | nicht ausgeführt | ESS-0014 Gate unverändert |

Verbundene Connectoren dieser Ausführung: GitHub, Google Drive, Voice, Automations. Kein Search-Console- oder GA4-Read-Connector.

## E. Ownership boundary

- SEO: Anforderung, Korrelation, Evidence, Roadmap/Checklist.
- `CAPITAL-AI-OPS`: Render-Deploy, Production-Sitemap, providerseitige Measurement-ID-Werte, WIF/IAM falls gewünscht.
- `CAPITAL-AI-GOV`: Write-Plane / Publishing-Control.
- `CAPITAL-AI-COMP`: Consent-/Marketing-Rechtsbewertung.
- `CAPITAL-AI-FE`: Browser-Runtime / `index.html`-Implementierung.

## F. Explicit non-claims

- Kein `GOOGLE_VISIBLE_PASS`.
- Kein aktueller GSC Sitemap-Success-Nachweis für `/learning-platform` nach dem Production-Rollout.
- Kein GA4 Realtime- oder Data-API-PASS.
- Kein WIF-PASS.
- Keine Google-Admin-/Reindex-Mutation.
- Kein synthetisches Ranking, Traffic- oder Conversion-Evidence.

## Next gated actions

1. Owner-separater read-only GSC-Check der Domain-Property und der eingereichten Sitemap — ohne Write, sofern nicht gesondert freigegeben. Zielbeobachtung: `/learning-platform` in der eingereichten Sitemap.
2. WP-D5 Search Console MCP Read bleibt optional und credential-gated (`NOT ENABLED`).
3. `GOOGLE_VISIBLE_PASS` erst nach identifizierter Google-Surface und beobachteter aktueller Version nach Refresh/Reindex.
