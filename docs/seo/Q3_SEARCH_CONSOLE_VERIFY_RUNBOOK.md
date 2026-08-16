# SEO Q3 — Google Search Console Property verifizieren

**Roadmap:** SEO-GM-ROADMAP-0002 / WP-Q-CLOSE / Q3  
**Status:** **OWNER ACTION** (Google-Konto; Agent kann nicht verifizieren)  
**Claim:** `.ai/work-claims/SEO-WP-Q3-SEARCH-CONSOLE-VERIFY-2026-08-16.json`  
**Nachfolger:** D5 Search Console MCP Read (`docs/seo/SEARCH_CONSOLE_MCP_RUNBOOK.md`)

## Bereits erfüllt (technisch, Stand 2026-08-16)

| Prüfpunkt | Status |
|-----------|--------|
| `https://capital-ai.online/robots.txt` | **200**, Sitemap-Zeile vorhanden |
| `https://capital-ai.online/sitemap.xml` | **200**, `application/xml`, 4 öffentliche URLs |
| Canonical in `index.html` | `https://capital-ai.online/` |
| Soft-404 | VERIFIED (PR #360) |
| Meta-Placeholder Q3 in `index.html` | Kommentar vorhanden; **kein** Token committed |
| `www.capital-ai.online` DNS | in dieser Probe **nicht auflösbar** — Domain-Property (DNS) deckt Subdomains ab, sobald DNS gesetzt ist |

## Empfohlene Methode: Domain-Property + DNS-TXT

Bevorzugt, weil sie `capital-ai.online` und alle Subdomains (inkl. künftigem `www`) abdeckt und **kein** Deploy für den Verify-Token braucht.

### Schritte (Owner)

1. Öffne [Google Search Console](https://search.google.com/search-console).
2. **Property hinzufügen** → Typ **Domain** → `capital-ai.online` (ohne `https://`).
3. Google zeigt einen **TXT-Record**, z. B.:
   - Name/Host: `@` bzw. `capital-ai.online`
   - Typ: `TXT`
   - Wert: `google-site-verification=…`
4. TXT-Record beim DNS-Provider der Domain setzen (TTL 300–3600).
5. In Search Console **Bestätigen** klicken (Propagation kann Minuten bis Stunden dauern).
6. Nach Erfolg:
   - **Sitemaps** → neue Sitemap: `https://capital-ai.online/sitemap.xml` → Einreichen.
   - Optional: URL-Prüfung für `/`, `/impressum`, `/agb`, `/datenschutz`.
7. Evidence an Agent/Repo: Screenshot oder Bestätigungsnotiz + Datum (keine Secrets). Claim-Status → `verified`.

## Alternative: URL-Präfix + HTML-Meta-Tag

Nur wenn DNS-TXT nicht möglich ist.

1. Property-Typ **URL-Präfix** → `https://capital-ai.online/`.
2. Methode **HTML-Tag** wählen → Token kopieren (`content="…"`).
3. Token an den Agenten geben (nur der `content`-Wert, kein Passwort).
4. Agent setzt in `index.html`:
   ```html
   <meta name="google-site-verification" content="TOKEN_HIER" />
   ```
5. PR → Merge → Deploy → in Search Console **Bestätigen**.
6. Sitemap einreichen wie oben.

> HTML-Datei-Upload (`google….html` im Docroot) ist möglich, aber Meta oder DNS sind vorzuziehen (weniger Artefakte im Static-Root).

## Nach Verifizierung (kurz)

| Aktion | Wer |
|--------|-----|
| Sitemap submit | Owner in GSC UI |
| Claim + Roadmap Q3 → VERIFIED / DONE | Agent nach Owner-Bestätigung |
| D5 MCP Read-Credentials | Owner separat (`SEARCH_CONSOLE_MCP_RUNBOOK.md`); **nicht** Teil von Q3 |

## Nicht tun

- Keine GSC-Service-Account-Keys oder OAuth-Secrets ins Repository.
- Kein Write-Scope für MCP (ESS-0014).
- Keine zweite parallele Verify-Methode „auf Vorrat“ committen.

## Abnahme-DoD (Q3)

- [ ] Property `capital-ai.online` (Domain) **oder** `https://capital-ai.online/` (URL-Präfix) zeigt Status **Bestätigt**.
- [ ] Sitemap in GSC eingereicht und ohne harten Fehler (Pending/Success ok).
- [ ] Evidence + Claim `verified` auf `main`.
