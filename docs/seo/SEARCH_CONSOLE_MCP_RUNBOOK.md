# Search Console MCP — Runbook (D5)

**Status:** spezifiziert, Read-Plane noch nicht produktiv  
**Bezug:** `docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_TOPOLOGY.md`, SEO-ROADMAP-0001 `D5`

## Ziel

Zweiter MCP-Read-Server neben `ga4-analytics`, strikt **lesend**, für Indexierungs- und Query-Reports.

## Voraussetzungen (Owner)

1. Google Search Console Property für `capital-ai.online` verifiziert (Q3).
2. Google Cloud Projekt mit Search Console API aktiviert.
3. Service-Account oder OAuth-Client mit **read-only** Zugriff auf die Property.
4. Credentials **nicht** im Repository — analog zu GA4 unter `~/.capital-ai/` oder Secret-Store.

## Empfohlener `.mcp.json`-Eintrag (nach Credential-Bereitstellung)

```json
"search-console": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-google-search-console"],
  "env": {
    "GOOGLE_APPLICATION_CREDENTIALS": "${HOME}/.capital-ai/gsc-mcp-credentials.json"
  }
}
```

> Paketname und Env-Variablen vor Produktivschaltung gegen die aktuelle MCP-Server-Dokumentation prüfen. Nur Read-Scopes.

## Governance

- Keine Write-Capabilities (ESS-0014).
- Consent-/Marketing-Tags bleiben unberührt (Ebene ①/② der Topologie).
- Vor Aktivierung: Eintrag in `DATENSCHUTZ_PROTOKOLL.md` und Owner-Freigabe.
