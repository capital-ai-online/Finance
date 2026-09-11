# SEO Metrics + AI Visibility Read Baseline — 2026-09-11

**Project:** `CAPITAL-AI-SEO`  
**Roadmap:** `SEO-GM-ROADMAP-0002.16` / `WP-SEO-METRICS` + `WP-SEO-AI-VIS`  
**Repository baseline:** `main@eab5750a481fd68e93a41c409b561dabc4dcbf13`  
**Working branch:** `agent/seo-metrics-tech-gates-20260911`  
**Authority:** `/AGENTS.md` 2.10.0, ADR-0035, ESS-0014  
**Provider mutation authority:** none

## Status

| Evidence stream | Status | Reason |
|---|---|---|
| Google Search Console standard performance | `READ_BLOCKED_NOT_CONNECTED` | No GSC read capability is connected to this Chat execution. |
| Google Search Console Generative AI performance | `READ_BLOCKED_NOT_CONNECTED` | No GSC read capability is connected to this Chat execution. |
| GA4 Data API / Analytics MCP | `READ_BLOCKED_NOT_CONNECTED` | Repository declares the GA4 MCP client contract, but the MCP host/credentials are not exposed to this Chat execution. |
| Provider `NO_DATA` | `NOT_ASSERTED` | A missing connection is not evidence that the provider has zero data. |
| Synthetic rankings/traffic/conversions/GenAI visibility | `PROHIBITED` | ADR/ESS/Roadmap require real provider evidence. |

This document is the reproducible **read contract and blocked baseline**, not a provider PASS. Configuration presence is not provider evidence.

## Repository capability baseline

### GA4

Current `.mcp.json` declares only the repository-side executable identity:

```text
server: ga4-analytics
command: uvx
package: analytics-mcp==0.7.0
executable: analytics-mcp
credential path: ${HOME}/.capital-ai/ga4-mcp-credentials.json
project selector: ${GA4_MCP_PROJECT_ID:-}
```

The external MCP host, credential material and authenticated property access are intentionally outside the repository and are not available in the current Chat execution.

### Search Console

`docs/seo/Q3_SEARCH_CONSOLE_VERIFY_RUNBOOK.md` contains historical Owner evidence that the Domain property `capital-ai.online` was verified and its sitemap accepted. `docs/seo/SEARCH_CONSOLE_MCP_RUNBOOK.md` remains a specification only; current `.mcp.json` contains no Search Console server declaration.

The current execution therefore cannot distinguish provider-side zero data from inaccessible data. It records `READ_BLOCKED_NOT_CONNECTED`, never synthetic `0` values.

## Reproducible read contract

### A. GSC standard performance

When an explicitly available read-only capability is connected, use:

- property: `sc-domain:capital-ai.online`;
- search type: Web;
- comparison windows: latest complete 28 days vs directly preceding 28 days, using the same timezone/window rules for both periods;
- metrics: clicks, impressions, CTR, average position;
- dimensions: date, page, query, country, device;
- retain both aggregate totals and page/query breakdowns;
- do not treat GSC clicks/sessions as numerically interchangeable with GA4 sessions.

Minimum evidence artifact:

```text
provider = Google Search Console
property = sc-domain:capital-ai.online
read_at = <UTC timestamp>
window_current = <YYYY-MM-DD..YYYY-MM-DD>
window_previous = <YYYY-MM-DD..YYYY-MM-DD>
search_type = web
metrics = clicks, impressions, ctr, position
rows = <real count>
source = authenticated read-only provider response
```

### B. GSC Generative AI performance

Use the dedicated Search Console Generative AI performance report when it is available to the authenticated property.

Capture only fields actually exposed by the provider at read time. The 2026 roadmap baseline expects at minimum:

- Generative AI impressions / visibility signal exposed by the report;
- page;
- country;
- device;
- date;
- report availability/state.

Do **not** infer `0` when the report is absent, inaccessible, thresholded, delayed or unsupported. Record the provider-returned state verbatim and classify it separately from a real zero-valued result.

### C. GA4 Organic Search

Use the same complete comparison windows as the GSC read. Filter/segment to Organic Search using the provider's current default-channel-group semantics.

Target metrics, where exposed by the authenticated property:

- sessions;
- engaged sessions;
- users;
- key events / conversions;
- engagement rate.

Target dimensions:

- landing page;
- session source / medium;
- country;
- device category;
- date.

No user-level identifiers or PII are required for this SEO baseline.

## Correlation rules

1. Normalize page URLs to HTTPS `capital-ai.online`, remove fragments and query strings for canonical page joins, and remove trailing slash except for `/`.
2. Keep raw provider values before normalization so the evidence remains auditable.
3. Compare GSC and GA4 primarily by **trend and landing-page direction**. Do not force numerical equality between impressions/clicks and sessions/users.
4. Separate `NO_DATA` from `NOT_CONNECTED`, `NOT_AUTHORIZED`, `REPORT_UNAVAILABLE` and provider errors.
5. Never backfill missing provider values with SeoEngine estimates, third-party estimates or model-generated numbers.
6. Provider reads are read-only. No sitemap submit, URL indexing request, GA4 configuration change or Google account/IAM mutation belongs to this work package.

## Evidence completion states

| State | Meaning |
|---|---|
| `READ_BLOCKED_NOT_CONNECTED` | Required read capability is not connected/exposed to the current execution. |
| `READ_BLOCKED_NOT_AUTHORIZED` | Capability exists but authenticated principal lacks required read access. |
| `REPORT_UNAVAILABLE` | Authenticated provider explicitly reports the requested report/surface unavailable. |
| `NO_DATA_VERIFIED` | Authenticated provider read succeeds and explicitly returns no rows/data for the exact bounded query. |
| `READ_VERIFIED` | Authenticated provider read succeeds and real provider values are stored with query/window metadata. |

## Exit gate

`WP-SEO-METRICS` and `WP-SEO-AI-VIS` leave the read gate only when a least-privileged authenticated provider capability produces a reproducible real snapshot or an explicit provider-confirmed `NO_DATA_VERIFIED` result for the bounded query.

Current status remains `READ_BLOCKED_NOT_CONNECTED`. Installing, connecting, enabling or changing OAuth/permissions of an external plugin/MCP host is a separate Human/Owner action and is not authorized by this document.
