# OPS-GA4-RENDER-READBACK — Render-hosted Google Analytics MCP read plane

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Supporting PVC:** `PVC-08 — Production Operations`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Fresh baseline:** `main@73e8e85ada62ca67dfbc0c546c921048b7355923`  
**Branch:** `agent/operations-ga4-render-readback-20260924`  
**Status:** `IMPLEMENTATION_ON_BRANCH / PROVIDER_SECRET_NOT_CONFIGURED`  
**Merge authority:** `HUMAN/CODEOWNER REQUIRED`

## Purpose

Move the existing pinned Google Analytics MCP read execution away from Codex-hosted worker time and into the already-running Finance Render service. The official `analytics-mcp==0.7.0` remains the provider implementation. Render hosts it internally over stdio; the application exposes only a bounded owner-only read projection.

## Architecture

```text
capital-ai.online
  -> consent-gated GA4 browser events
  -> Google Analytics property
  -> analytics-mcp==0.7.0 (internal stdio child process)
  -> Finance Render runtime
  -> owner-only cached HTTP projection
```

No second GA4 API client, public raw MCP endpoint, GitHub Actions runner, Codex worker or provider write plane is introduced.

## Allowed provider tools

Only these MCP tools are admitted:

- `get_account_summaries`;
- `get_property_details`;
- `run_realtime_report`;
- `run_report`.

The baseline reports are intentionally bounded to `eventName / eventCount` and at most 25 rows.

## Runtime surface

`GET /api/admin/google-analytics/readback`

The route uses the existing `checkAdminAccess(..., OWNER_ONLY_ROLES)` boundary. It returns a sanitized provider snapshot with account/property discovery, configured-property correlation, realtime evidence and a seven-day standard report. Provider reads are cached for five minutes; the HTTP response itself uses `Cache-Control: no-store`.

## Credential boundary

Render configuration after merge:

- `GA4_MCP_SERVICE_ACCOUNT_KEY_JSON` — server-only secret containing the Google service-account JSON;
- `GA4_MCP_PROJECT_ID` — Google Cloud project ID;
- `GA4_PID` — numeric GA4 property ID.

The runtime validates the service-account document, requires its `project_id` to equal `GA4_MCP_PROJECT_ID`, materializes it only below the runtime-private HOME directory with mode `0600`, and removes the raw secret from the MCP child-process environment.

## Container boundary

The production image builds a dedicated `/opt/ga4-mcp` Python virtual environment from the exact top-level package `analytics-mcp==0.7.0`. The final image receives only the installed environment plus the runtime Python dependency; package resolution/download does not occur during requests.

The Node runtime communicates with the MCP process over newline-delimited JSON-RPC stdio. The MCP process itself is not network-listening.

## Cutover rule

The existing Codex GA4 host configuration is not removed in this slice. It becomes removable only after the Render route has produced real `READ_VERIFIED` provider evidence in Production. Until then it remains non-authoritative fallback configuration/evidence and must not be represented as the productive host.

## Exit evidence

1. branch contains fresh CURRENT_MAIN and has no conflicting open writer;
2. focused tests prove tool allowlisting, GET-only route, five-minute cache and no secret projection;
3. Docker/Render configuration keeps `analytics-mcp==0.7.0` pinned and credentials server-side;
4. hosted exact-head checks and container security pass;
5. Human/CODEOWNER merges the production-runtime change;
6. Render receives the three GA4 configuration values;
7. live owner-only readback confirms account/property discovery, realtime report and standard Data API report;
8. only then may the old Codex GA4 execution binding be removed in a bounded cleanup slice.
