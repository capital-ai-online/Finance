# OPS GSC MCP Execution-Host Evidence — 2026-09-15

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Roadmap scope:** `OPS-PR900-04 — Multi-LLM gateway / OAuth2 / MCP convergence`  
**Main baseline:** `da8cdfd715bdffda0dc8e2bb463898455a920399`  
**Branch:** `agent/operations-gsc-mcp-read-20260915`  
**Status:** `HOST_CONFIG_IMPLEMENTED_ON_BRANCH / PROVIDER_READ_NOT_YET_VERIFIED`

## Bounded implementation

The repository MCP host configuration adds one Google Search Console read server:

```json
"search-console": {
  "command": "npx",
  "args": ["-y", "@vmandic/searchconsole-mcp@1.1.1"],
  "env": {
    "GOOGLE_APPLICATION_CREDENTIALS": "${HOME}/.capital-ai/gsc-mcp-credentials.json"
  }
}
```

The existing `ga4-analytics` MCP entry remains unchanged.

A dedicated SessionStart hook materializes only `GSC_MCP_SERVICE_ACCOUNT_KEY_JSON` into the isolated local path `~/.capital-ai/gsc-mcp-credentials.json`. It does not export `GOOGLE_APPLICATION_CREDENTIALS` globally, so the Search Console MCP cannot silently inherit the existing GA4 principal through the Claude session environment.

## Security and least-privilege result

Reviewed implementation identity:

```text
package = @vmandic/searchconsole-mcp@1.1.1
source = https://github.com/vmandic/searchconsole-mcp
reviewed upstream commit = 4ad3506b18190720f10e39ee252f91533c802e42
license = MIT
configured transport = stdio default
Google OAuth scope enforced by upstream = https://www.googleapis.com/auth/webmasters.readonly
```

Boundaries retained by this branch:

- no `--transport http` activation;
- no Search Console write scope;
- no sitemap submit/delete tool configured;
- no Indexing API path configured;
- Search Console and GA4 use different credential files/principal paths;
- no credential, refresh token, key material or Google principal identifier committed;
- missing or invalid GSC host secret removes any stale local GSC credential file and remains fail-closed;
- no Google Cloud/API activation, Search Console property permission, IAM, OAuth or secret-store mutation;
- no change to CookieHub, browser consent, GA4, AdSense or production runtime.

The exact npm top-level version is pinned. This does not prove immutable transitive dependency resolution; that remains execution-host / supply-chain assurance and must not be reported as fully verified from this repository configuration alone.

## Regression evidence

`tests/unit/gscMcpExecutionHost.test.ts` asserts:

1. `search-console` uses `npx` with exact package `@vmandic/searchconsole-mcp@1.1.1`;
2. no HTTP transport argument is configured;
3. GSC and GA4 use different credential paths;
4. the GSC SessionStart hook is registered and does not export its credential path globally;
5. the GSC hook removes stale credentials when the host secret is unavailable;
6. the existing GA4 MCP host contract remains unchanged.

Repository test execution has not been performed in this chat execution surface. `NOT RUN` is not `PASS`.

A separate local package-resolution smoke attempt (`npx -y @vmandic/searchconsole-mcp@1.1.1 --version`) did not reach a terminal result before the execution timeout. It therefore supplies no PASS evidence.

A local static JSON/config assertion for the intended `.mcp.json` shape completed successfully; that proves only syntax/config invariants, not package resolution or Google authentication.

## Provider-read gate

The current ChatGPT execution surface does not reload repository `.mcp.json` and does not expose a live `gsc_list_sites` tool from this branch. Therefore no authenticated Google provider response is available yet.

Current classification:

```text
repository_host_config = IMPLEMENTED_ON_BRANCH
credential_isolation = IMPLEMENTED_ON_BRANCH
static_config_parse = PASS
repository_unit_test = NOT_RUN
package_resolution_smoke = NOT_PROVEN_TIMEOUT
provider_read = READ_BLOCKED_NOT_CONNECTED
READ_VERIFIED = NOT_PROVEN
NO_DATA_VERIFIED = NOT_PROVEN
SEO_CHAT_02 = BLOCKED_BY_PROVIDER_READ
```

The provider gate may advance only after the applicable MCP host consumes the merged/current configuration and has the separately supplied `GSC_MCP_SERVICE_ACCOUNT_KEY_JSON` secret for a Google principal that has Search Console property access. The first real call must be `gsc_list_sites`; configuration presence, local liveness or historical property ownership does not count as provider PASS.

## Required provider outcome

For `sc-domain:capital-ai.online`, classify the first authenticated provider call as exactly one of:

- `READ_VERIFIED` — property is returned by Google Search Console;
- `NO_DATA_VERIFIED` — only when a bounded authenticated data query explicitly succeeds with no data;
- `READ_BLOCKED_NOT_AUTHORIZED` — authenticated principal lacks property access;
- `READ_BLOCKED_PROVIDER_ERROR` — Google returns an API/quota/provider failure;
- `READ_BLOCKED_NOT_CONNECTED` — MCP/auth capability is not exposed to the execution session.

No synthetic zero, ranking, indexing or visibility evidence is permitted.
