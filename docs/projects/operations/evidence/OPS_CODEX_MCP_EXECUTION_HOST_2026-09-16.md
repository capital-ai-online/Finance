# OPS-PR900-04 — OpenAI Codex MCP Execution-Host Migration

**Project:** CAPITAL-AI-OPS  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** PVC-02 — Controlled Implementation  
**Roadmap:** `OPS-PR900-04 — Multi-LLM gateway / OAuth2 / MCP convergence`  
**Implementation branch:** `agent/operations-codex-mcp-host-20260916`  
**Branch base:** `main@1ef0b91ca6b3f61f23f8f1e449ae0deadf6b1ff3`  
**Status:** `IMPLEMENTED_ON_BRANCH / PROVIDER_READ_NOT_PROVEN`

## Ziel

Die aktive Claude-Code-spezifische MCP-/Credential-Bootstrap-Mechanik wird durch einen OpenAI-Codex-Cloud-Hostadapter ersetzt, ohne eine zweite Google-MCP-Read-Plane, zweite Credential-Authority oder zweite Repository-Trust-Root zu erzeugen.

ESS-0014 bleibt normative hostneutrale Architektur. `/AGENTS.md` bleibt alleinige Repository-Trust-Root. Historische Claude-Evidence und providerneutrale Governance werden nicht rückwirkend umgeschrieben.

## Branch-Änderung

### Entfernt

- `.claude/settings.json`
- `.claude/hooks/agents-trust-root.sh`
- `.claude/hooks/ga4-mcp-credentials.sh`
- `.claude/hooks/gsc-mcp-credentials.sh`

### Hinzugefügt

- `.codex/config.toml` — project-scoped Codex-MCP-Konfiguration
- `.codex/setup-google-mcp-credentials.sh` — Setup-only Secret → lokale Credential-Datei

### Angepasst

- `tests/unit/gscMcpExecutionHost.test.ts`
- `docs/runbooks/GA4_MCP_SERVER_SETUP.md`

`.mcp.json` bleibt in diesem bounded OPS-Slice unverändert als bestehende Security-validierte Executable-Identity-Manifestoberfläche. Der SEC-owned Validator `scripts/security/validateMcpExecutableIdentity.mjs` wird nicht aus einem OPS-Arbeitspaket heraus umgebaut. Codex selbst konsumiert `.codex/config.toml`.

## Credential Contract

### Search Console

Codex Cloud Secret:

```text
GSC_MCP_SERVICE_ACCOUNT_KEY_JSON
```

Materialisierter Pfad:

```text
~/.capital-ai/gsc-mcp-credentials.json
```

MCP:

```text
@vmandic/searchconsole-mcp@1.1.1
```

Google Scope bleibt providerseitig read-only. Ein realer Provider-PASS wird erst durch einen echten `gsc_list_sites`-Response belegt.

### GA4

Codex Cloud Secret:

```text
GA4_MCP_SERVICE_ACCOUNT_KEY_JSON
```

Materialisierter Pfad:

```text
~/.capital-ai/ga4-mcp-credentials.json
```

MCP:

```text
uvx --from analytics-mcp==0.7.0 analytics-mcp
```

## OpenAI Codex Cloud — Einrichtung des GSC JSON

1. ChatGPT/Codex öffnen.
2. **Codex-Einstellungen → Umgebungen** öffnen.
3. Die Cloud-Umgebung für `capital-ai-online/Finance` auswählen oder erstellen.
4. Unter **Secrets** einen neuen Eintrag mit exakt diesem Namen anlegen:

   ```text
   GSC_MCP_SERVICE_ACCOUNT_KEY_JSON
   ```

5. Als Wert den vollständigen, unveränderten Inhalt der Google-Service-Account-JSON-Datei einfügen. Den Inhalt niemals in Chat, Repository, Issue oder Pull Request kopieren.
6. Als **Setup-Skript** der Umgebung konfigurieren:

   ```bash
   bash .codex/setup-google-mcp-credentials.sh
   ```

7. Agenten-Internetzugang nur für die notwendigen Ziele freigeben. Für Search Console sind mindestens die Google-Auth-/Search-Console-Endpunkte und für die `npx`-Auflösung die npm Registry erforderlich. Eine globale Internetfreigabe ist für diesen Read-Pfad nicht erforderlich.
8. Neue Codex-Cloud-Session gegen das Repository starten.
9. Setup-Ausgabe muss für GSC die Credential-Materialisierung melden, ohne Secret-Inhalt auszugeben.
10. Danach in Codex den MCP `search-console` verwenden und `gsc_list_sites` aufrufen.

## Erwartete Provider-Klassifikation

```text
READ_VERIFIED
NO_DATA_VERIFIED
READ_BLOCKED_NOT_AUTHORIZED
READ_BLOCKED_PROVIDER_ERROR
```

`MCP_LIVENESS`, lokale Konfiguration, Secret-Präsenz oder eine leere synthetische Antwort sind kein Ersatz für einen echten Google-Response.

## SEO-CHAT-02 Gate

Erst nach bestandenem GSC-Read-Gate werden die then-current kanonischen URLs per `gsc_inspect_url` geprüft. Repositoryseitige Ziel-URLs bleiben aus der aktuellen Route-Authority abzuleiten; Providerwerte werden niemals aus Repository-Daten synthetisiert.

## Sicherheitsgrenzen

- Codex Cloud Secrets sind nur im Setup verfügbar und werden vor der Agentenphase entfernt.
- Das Setupskript validiert `type`, `project_id`, `client_email` und `private_key` und schreibt Credentials atomar mit `0600` außerhalb des Repositories.
- GA4 und GSC behalten getrennte Credential-Dateien und Principals.
- Das Setupskript exportiert keine Roh-Secrets in die Agentenphase.
- Keine Google-IAM-, Property-, OAuth-, Billing-, DNS-, TLS- oder Production-Mutation wird durch diese Repository-Migration ausgeführt.

## Nicht Bestandteil dieses OPS-Slices

- Anthropic API/SDK in der produktiven Anwendung. `@anthropic-ai/sdk` ist ein Runtime-Provider und nicht Claude Code.
- Historische M8-/Work-Claim-/Evidence-Artefakte, die frühere Claude-Ausführung dokumentieren.
- Repositoryweite Provider-Governance in ESS-0019 oder Trust-Root-Texten.
- SEO-owned Runbook-/Roadmap-Umschreibungen außerhalb der OPS-Execution-Host-Grenze.

Diese Grenzen verhindern, dass eine Execution-Host-Migration stillschweigend zu einer produktiven LLM-Runtime-, Governance- oder fremden Project-Owner-Migration ausgeweitet wird.

## Validierungsstatus

- Current-main / Project / PVC / Roadmap correlation: `PASS`
- Open-PR overlap: `PASS` — PR #951 betrifft ausschließlich den FE FIN-17 RankingBoard-Consumer.
- Claude active host files removed on branch: `IMPLEMENTED`
- Codex project config present on branch: `IMPLEMENTED`
- Codex setup-only credential materializer present on branch: `IMPLEMENTED`
- Real Codex Cloud setup execution: `NOT RUN`
- Real `gsc_list_sites`: `NOT RUN`
- Real GA4 provider read: `NOT RUN`

`NOT RUN` ist kein PASS.
