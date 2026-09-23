# Render MCP — AI build debugging

**Project:** CAPITAL-AI-OPS  
**Primary PVC:** PVC-02 — Controlled Implementation  
**Supporting PVC:** PVC-08 — Production Operations  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Endpoint:** `https://mcp.render.com/mcp`  
**Mode:** hosted remote MCP, OAuth at the execution host, no Render credential in Git

## Purpose

Expose Render build/deploy evidence to compatible development AI hosts so an operator can ask natural-language questions about failed builds, deploy history, logs and metrics without copying logs between tools.

The repository configuration is intentionally only a connection declaration. It does not grant production authority, approve a deploy, authorize environment-variable changes or replace existing Human/CODEOWNER and production-control gates.

## Cost boundary

As observed on 2026-09-24, Render documents its hosted MCP server as a supported platform integration and does not list a separate MCP surcharge on the public pricing page. Existing Render workspace/compute charges still apply. The AI host or model can have its own subscription/API cost. Render HTTP response-time metrics require a Pro workspace or higher.

Before treating this as a long-term zero-cost dependency, re-check the current Render pricing page because provider pricing can change.

References:
- https://render.com/docs/mcp-server
- https://render.com/pricing

## Repository integration

### Claude Code

The root `.mcp.json` declares:

```json
{
  "mcpServers": {
    "render": {
      "type": "http",
      "url": "https://mcp.render.com/mcp"
    }
  }
}
```

Claude Code treats project-scoped MCP servers as repository configuration and requires workspace/server approval in interactive use. Authentication is completed at the host through OAuth. No Render API key belongs in `.mcp.json`.

### Cursor

`.cursor/mcp.json` declares the same hosted endpoint. Cursor supports OAuth for remote MCP servers. No static authorization header or API key is committed.

## Read-first troubleshooting workflow

Use the Render MCP connection first for evidence gathering:

1. select the intended Render workspace in the AI host;
2. list the target service and recent deploys;
3. inspect the failed deploy and the most recent successful deploy;
4. pull error-level and adjacent build/runtime logs;
5. inspect CPU, memory, request-count and available service metrics when they are material;
6. diagnose a likely root cause and map it to repository/configuration evidence;
7. propose a bounded repository fix through the normal branch/PR lifecycle.

Useful prompts:

- `For the Finance service, inspect the latest failed deploy and its error-level logs. Diagnose the root cause and propose a repository fix. Do not deploy or modify environment variables.`
- `Compare the latest failed Finance deploy with the most recent successful deploy and identify the smallest evidence-backed difference that can explain the failure. Read only.`
- `Show the Render build/runtime errors around the failing deploy and correlate them with the current repository build configuration. Do not mutate Render.`

## Mutation boundary

The Render MCP server also exposes potentially destructive operations, including triggering deploys and updating environment variables. Their existence does not authorize their use.

For CAPITAL-AI:
- repository/debug reads are preferred for diagnosis;
- provider mutations remain subject to the current `/AGENTS.md@CURRENT_MAIN`, applicable security controls and explicit Human/production boundaries;
- secrets must never be copied into prompts, committed config, logs or evidence;
- remote skills/plugins are not installed by this repository slice; only the hosted MCP endpoint is declared;
- host OAuth/session/tool permissions require live readback before this package can claim full external-host assurance.

## Exit evidence

Repository-side exit evidence:
- both Claude Code and Cursor project configs resolve to the official HTTPS Render MCP endpoint;
- configs contain no Render token/API key/Authorization header;
- existing GA4/Search Console MCP identities remain unchanged;
- focused unit tests pass;
- PR exact head passes ordinary required Governance/Build/Security checks.

External-host exit evidence, after Human authorization:
- OAuth completes in the intended host/account;
- the intended Render workspace is selected;
- a read-only troubleshooting prompt can list the Finance service and retrieve deploy/log evidence;
- no provider mutation is performed as part of activation/readback.
