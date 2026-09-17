# CAPITAL-AI-SEO — Canonical Roadmap

**Project:** `CAPITAL-AI-SEO`  
**Folder:** `docs/projects/seo/`  
**Role:** cross-cutting SEO and Google Marketing execution/project coordination  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-17 — historical task activation removed  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Reconciliation rule

`historical/non-terminal != active`

This file remains a temporary project execution projection until the separately requested Roadmap-removal Pull Request after completion of the Social Roadmap. Archive/superseded copies, prior chat/work context, old branch state and historical non-terminal markers are evidence only and do not select or activate work.

A work item is executable only when it is currently active under `/AGENTS.md@CURRENT_MAIN` with a canonical identity or freshly defined/re-authorized by the Human/Owner in the current interaction. Provider-dependent `WAITING`, `BLOCKED` or `NOT RUN` applies only to the affected evidence lane and does not itself create a task.

## Current provider evidence

The Search Console property-read gate and URL Inspection gate have real provider evidence from a Codex Cloud execution on 2026-09-16. GA4, Search Analytics/query-performance reads, Generative-AI visibility reads and any package whose exit gate depends on those measurements remain independently condition-gated.

Allowed GSC read classifications remain:

- `READ_VERIFIED`;
- `NO_DATA_VERIFIED`;
- `READ_BLOCKED_NOT_AUTHORIZED`;
- `READ_BLOCKED_PROVIDER_ERROR`;
- `READ_BLOCKED_NOT_CONNECTED`.

A missing execution surface, repository configuration, credential-file existence or MCP process liveness MUST NOT be converted into `NO_DATA_VERIFIED` or `READ_VERIFIED`. GSC and GA4 are independent provider lanes and principals. A GSC PASS never implies GA4 PASS.

### Codex / GSC evidence — 2026-09-16

| Check | Current state | Evidence / gate |
|---|---|---|
| `CODEX-01` main host contract | `PASS` | `.codex/config.toml` and `.codex/setup-google-mcp-credentials.sh` exist on the correlated main snapshot |
| `CODEX-02` setup execution | `PASS` | actual Codex Cloud setup completed without raw-secret output |
| `CODEX-03` credential path/modes | `PASS` | `~/.capital-ai` observed as `0700`; GSC credential file observed as regular file `0600`; contents not emitted |
| `CODEX-04` Search Console MCP liveness | `PASS` | direct STDIO MCP connection to pinned Search Console MCP; native Codex-cloud tool injection remains separately `NOT_VERIFIED` |
| `GSC-01` site read | `READ_VERIFIED` | real provider response returned `sc-domain:capital-ai.online` |
| `SEO-CHAT-02` URL Inspection | `VERIFIED` | five individual provider inspection calls returned real responses for the then-current sitemap set |
| GA4 read lane | `CONFIGURATION_NOT_OBSERVED / NOT RUN` | no GA4 PASS inferred from GSC evidence |

The then-current canonical URL set for this evidence was:

1. `https://capital-ai.online/`
2. `https://capital-ai.online/learning-platform`
3. `https://capital-ai.online/impressum`
4. `https://capital-ai.online/agb`
5. `https://capital-ai.online/datenschutz`

A real Google response for `/learning-platform` returned Verdict `NEUTRAL` and Coverage State `Discovered - currently not indexed`. This is an indexation finding, not a transport/provider failure and not a project-wide SEO failure.

## Current repository evidence

Human-merged PR #893 added the FE-owned public-route/sitemap regression and Human-merged PR #894 added structured-data lifecycle regression. Those merges close the repository-regression implementation portion of the corresponding SEO handoffs. They do not prove every deployed HTML behavior, Rich Results eligibility, Search Analytics result, traffic, conversion or GenAI metric.

## PR #900 / #901 work packages

### SEO-PR900-01 — Least-privileged GSC/GA4/provider reads
Verify Search Console, URL Inspection, GA4 and GenAI-visibility reads with least privilege and current provider evidence.

**Observed state:** `GSC_READ_VERIFIED / URL_INSPECTION_VERIFIED / GA4_AND_PERFORMANCE_READS_OPEN`.

### SEO-CHAT-02 — Search Console URL Inspection
**State:** `VERIFIED` for the five-URL provider-response requirement on 2026-09-16. This terminal evidence does not reactivate itself or imply that every URL is indexed or SEO-optimal.

### SEO-PR900-02 — Technical SEO owner returns
Complete FE/OPS technical-gate returns for robots, sitemap, canonical, 404, JSON-LD, prerender, SeoEngine/dashboard and deployed behavior where applicable.

**Observed state:** repository regressions present; GSC URL Inspection verified; deployed/browser/generated-output acceptance remains partial where not evidenced.

### SEO-PR900-03 — Roadmap/document consolidation
Use this roadmap only as a temporary project projection. It creates no second queue, registry or authority. All project Roadmaps are scheduled for a separate deletion Pull Request after the Social Roadmap completion gate.

### SEO-PR900-04 — Measurable acceptance criteria
Define production-readiness SEO acceptance criteria from reproducible repository/provider evidence rather than estimated visibility.

**Observed state:** repository acceptance and URL Inspection evidence exist; Search Analytics, GA4, GenAI visibility and other performance measurements remain evidence-gated.

## Historical baseline — non-active ledger

Program detail remains in `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` and `docs/seo/**`. Historical labels below are evidence only and MUST NOT activate work without fresh canonical selection.

| WP | Historical/evidence state |
|---|---|
| WP-SEO-METRICS | GSC property + URL Inspection verified; Search Analytics + GA4 condition-gated |
| WP-SEO-AI-VIS | GSC connectivity verified; GenAI performance read condition-gated |
| WP-SEO-TECH-GATE | FE owner return merged; repository regression present; deployed readback partial |
| WP-SEO-SCHEMA | FE owner return merged; generated-output/Rich-Result detail remains evidence-gated |
| WP-SEO-TOPICS | requires concrete provider/topic evidence |
| WP-SEO-CONTENT | requires topic evidence |
| WP-SEO-SPAM | repository negative-gate evidence surface |
| WP-SEO-CWV / IA / MEDIA | owner-routed evidence surfaces |
| WP-SEO-REFRESH / AUTHORITY | condition-gated where real search/content evidence is required |
| WP-SEO-I18N / AGENT | historical later/conditional labels only |

No synthetic ranking/traffic/conversion/GenAI metrics. `NOT RUN` is never `PASS`. A real URL Inspection response proves only that response.

## Dependencies
OPS execution-host/deployment/provider evidence, FE implementation, QM checks and COMP/privacy for analytics. GSC property and URL Inspection evidence exists for the 2026-09-16 five-URL set; other provider lanes remain independently evidence-gated.

## Project exit gate
One temporary SEO roadmap; historical/non-terminal state never self-activates; technical gates are reproducible; real provider evidence stays distinct from inference; no second Roadmap/queue/registry/authority system exists.
