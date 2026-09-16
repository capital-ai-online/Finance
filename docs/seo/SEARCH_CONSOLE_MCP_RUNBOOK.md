# Search Console MCP — Runbook (D5)

**Status:** `READ_VERIFIED` für Property Read und URL Inspection auf Codex Cloud (2026-09-16)  
**Bezug:** `docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_TOPOLOGY.md`, `docs/projects/seo/ROADMAP.md`, ESS-0014  
**Baseline:** `main@b95f9b74a01b6d0e1228a8d5291b0fb54ea80489`

## Ziel

Strikt lesende Search-Console-Evidence-Plane für Property-, Indexierungs- und später Search-Analytics-/Query-Reports. Repository-/Host-Konfiguration, MCP-Liveness und Google-Provider-Evidence werden getrennt klassifiziert.

## Current verified host contract

Current main enthält den aktiven Codex-Hostvertrag:

- `.codex/config.toml`
- `.codex/setup-google-mcp-credentials.sh`
- Search Console MCP executable: `@vmandic/searchconsole-mcp@1.1.1`
- Credential path: `~/.capital-ai/gsc-mcp-credentials.json`

Das Setup erwartet das Codex-Cloud-Secret:

```text
GSC_MCP_SERVICE_ACCOUNT_KEY_JSON
```

Das vollständige Secret bleibt außerhalb des Repositories und darf nicht in Chat, Logs, Issues oder Pull Requests ausgegeben werden.

## Credential / filesystem contract

Nach erfolgreicher Setup-Phase gilt:

```text
~/.capital-ai                                  mode 0700
~/.capital-ai/gsc-mcp-credentials.json         mode 0600
```

Nur Dateisystem-Metadaten dürfen für diesen Gate-Check gelesen werden. Credential-Inhalte, `private_key`, `client_email` oder vollständige JSON-Werte werden nicht ausgegeben.

## Verified read path — 2026-09-16

Auf einem realen Codex-Cloud-Host wurde ein temporärer MCP-Client ausschließlich unter `/tmp` verwendet. Der Client stellte direkt über STDIO eine Verbindung zu folgendem Server her:

```text
npx -y @vmandic/searchconsole-mcp@1.1.1
```

mit:

```text
GOOGLE_APPLICATION_CREDENTIALS=$HOME/.capital-ai/gsc-mcp-credentials.json
```

Beobachtete Tool-Discovery:

```text
gsc_mcp_server_ping
gsc_list_sites
gsc_search_analytics
gsc_inspect_url
gsc_list_sitemaps
```

`gsc_mcp_server_ping` lieferte eine reale `pong`-Antwort. Das beweist MCP-Prozess-/Protokoll-Liveness für den direkten STDIO-Pfad auf dem Codex-Cloud-Host.

**Wichtig:** Native Codex-Cloud-MCP-Tool-Injection bleibt `NOT_VERIFIED`. Die direkte STDIO-Evidence darf nicht als Beweis dafür umetikettiert werden, dass Codex Cloud den project-scoped MCP nativ als Agent-Tool injiziert.

## GSC-01 — Property Read

`gsc_list_sites` wurde über denselben realen MCP-Pfad ausgeführt.

Verifiziert:

```text
Property:   sc-domain:capital-ai.online
Permission: siteRestrictedUser
GSC-01:     READ_VERIFIED
```

Ein lokaler Config-Eintrag, Credential-Datei-Existenz oder MCP-Ping allein wäre kein `READ_VERIFIED`; der Status basiert auf der echten Google-backed `gsc_list_sites`-Antwort.

## SEO-CHAT-02 — URL Inspection

Nach `GSC-01 == READ_VERIFIED` wurden alle then-current kanonischen URLs aus `public/sitemap.xml` einzeln über `gsc_inspect_url` geprüft:

```text
https://capital-ai.online/
https://capital-ai.online/learning-platform
https://capital-ai.online/impressum
https://capital-ai.online/agb
https://capital-ai.online/datenschutz
```

Ergebnis:

```text
URLs inspected successfully: 5/5
SEO-CHAT-02: VERIFIED
```

Jede der fünf URLs lieferte einen echten Google URL-Inspection-Response. `VERIFIED` bedeutet ausschließlich, dass der reale Provider-Response vorhanden war; es bedeutet nicht automatisch `INDEXED`, `PASS`, `VALID` oder SEO-optimal.

Konkretes im Chat-Handoff überliefertes Finding:

```text
URL:      https://capital-ai.online/learning-platform
Verdict:  NEUTRAL
Coverage: Discovered - currently not indexed
```

Für die übrigen vier URLs wurden im Chat-Handoff keine vollständigen Detailfelder materialisiert. Diese Felder dürfen daher in Repository-Evidence nicht synthetisiert werden.

## Search Analytics / spätere Reads

Die verifizierte Property-Verbindung und URL Inspection ersetzen keine Search-Analytics-Abfrage. Clicks, Impressions, CTR, Queries, Pages, Country, Device, Generative-AI Performance und andere Messwerte bleiben `NOT RUN / CONDITION_GATED`, bis `gsc_search_analytics` oder der jeweils dokumentierte echte Provider-Read ausgeführt wurde.

GA4 bleibt eine unabhängige Provider-Lane. Ein GSC-PASS impliziert keinen GA4-PASS.

## Provider-Klassifikation

Zulässige GSC Read-Klassifikationen:

```text
READ_VERIFIED
NO_DATA_VERIFIED
READ_BLOCKED_NOT_AUTHORIZED
READ_BLOCKED_PROVIDER_ERROR
READ_BLOCKED_NOT_CONNECTED
```

`NOT RUN` ist niemals PASS. `MCP_LIVENESS` ist niemals Google-Provider-PASS.

## Governance

- Keine Search-Console-Write-Capabilities in diesem Read-Pfad (ESS-0014).
- Keine IAM-, OAuth-, Billing-, DNS-, TLS-, Property-, Sitemap-Submit- oder andere Provider-Mutation aus diesem Runbook.
- Consent-/Marketing-Tags und Browser-Runtime bleiben unberührt.
- Credentials bleiben außerhalb des Repositories.
- External mutation benötigt weiterhin separate Human/Owner-Autorisierung unter current `/AGENTS.md`.
- Providerwerte werden niemals aus Repository-Daten synthetisiert.

## Reproduzierbarer Verification Flow

1. `current main` und `/AGENTS.md` neu korrelieren.
2. then-current `public/sitemap.xml` als URL-Authority lesen.
3. Credential-Pfad und Modes ausschließlich über Metadaten prüfen.
4. MCP-Prozess-/Protokoll-Liveness prüfen.
5. `gsc_list_sites` ausführen und `sc-domain:capital-ai.online` ausschließlich aus echter Providerantwort klassifizieren.
6. Bei `READ_VERIFIED` jede then-current Sitemap-URL einzeln mit `gsc_inspect_url` prüfen.
7. Reale Response-Felder getrennt von der Inspection-Transportklassifikation dokumentieren.
8. `git status --short` prüfen; ein reiner Provider-Read erzeugt keine Repository-Mutation.

## Nicht durch diesen Nachweis bewiesen

- native Codex-Cloud-MCP-Tool-Injection;
- GA4-Verbindung oder GA4-Daten;
- Search-Analytics-/Query-/Traffic-Metriken;
- Generative-AI Performance Reports;
- dass jede geprüfte URL indexiert ist;
- Rich-Results-Eignung, sofern Google diese Detailfelder nicht real zurückgegeben hat;
- irgendeine Google-Write- oder Publishing-Berechtigung.
