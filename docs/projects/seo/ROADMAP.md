# CAPITAL-AI-SEO — Canonical Roadmap

**Project:** `CAPITAL-AI-SEO`  
**Folder:** `docs/projects/seo/`  
**Role:** cross-cutting SEO and Google Marketing execution/project coordination  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-16 — GSC provider read and SEO-CHAT-02 URL Inspection verified on Codex Cloud; subsequent Social-only main drift via PR #981 correlated without SEO overlap; native Codex MCP tool injection remains separately not verified  
**Baseline:** `main@afa259fc786479386a6ea0e165c3d8dc3363aae8`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated active sidecar roadmaps and pointer-only `ROADMAP.md` files are removed after this fold. Archive/superseded copies remain as historical ledger and are not an execution source. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

A provider-dependent `WAITING`, `BLOCKED` or `NOT RUN` state applies only to the affected package/lane. It MUST NOT remove `CAPITAL-AI-SEO` or repository-executable SEO work from normal Roadmap execution. This project file remains the single project execution projection; no second Roadmap, queue, project registry, PVC mapping, Governance plane or SEO authority is introduced.

## Post-PR #954 automation routing

**Executing Project:** `CAPITAL-AI-GOV` under bounded foreign-project execution.  
**Target Project / Primary Owner:** `CAPITAL-AI-SEO`.  
**Target productive PVC:** `N/A — cross-cutting; no productive PVC`.  
**Activation evidence:** Human-merged PR #954, merge SHA `7ff5a519e43c551e4bb07800c763f05e2bcbd45a`, is reproducibly contained in current main. Human-merged PR #959 subsequently reactivated SEO as a lane-specific automated Roadmap target on `main@5ae2b371da45a5c07304fd704a7026eded976f1b`.  
**Routing state:** `ACTIVE_IN_ROADMAP_EXECUTION`.

The nine-file PR #954 host migration replaces the active Claude-Code-specific host mechanics with the Codex project-scoped host contract. Current main contains `.codex/config.toml` and `.codex/setup-google-mcp-credentials.sh`; the Search Console executable identity remains pinned to `@vmandic/searchconsole-mcp@1.1.1`, while GA4 remains a separate `analytics-mcp==0.7.0` lane. Repository host configuration or MCP liveness alone is never Google provider evidence.

### Repository-executable lane — ACTIVE

The following work remains dependency-ready according to its own Roadmap/Owner boundary even when a provider lane is waiting:

- technical SEO repository checks and acceptance criteria;
- canonical / robots / sitemap / schema correlation;
- SEO-owned Roadmap/evidence synchronization;
- FE-/OPS-handoff validation without taking over FE/OPS implementation authority;
- negative/guardrail checks such as existing SEO-spam/content-quality gates;
- other SEO-owned work whose stated exit gate does not require provider data.

`CAPITAL-AI-GOV` may execute bounded repository work under `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION`; branch/PR identity and acceptance remain `CAPITAL-AI-SEO`. FE, OPS, COMP, SEC and DATA implementation remains routed at their ownership boundaries.

### Provider-dependent lane — GSC VERIFIED / REMAINING LANES CONDITION_GATED

The Search Console property-read gate and URL Inspection gate have real provider evidence from a Codex Cloud execution on `main@b95f9b74a01b6d0e1228a8d5291b0fb54ea80489`. The subsequent Human-merged PR #981 advanced current main to `afa259fc786479386a6ea0e165c3d8dc3363aae8` but changed only `docs/projects/social-media/ROADMAP.md`; its changed-file, owner and semantic scope does not invalidate the SEO provider evidence. GA4 reads, Search Analytics/query-performance reads, Generative-AI visibility reads and any work package whose exit gate depends on those measurements remain independently condition-gated.

Allowed GSC read classifications remain:

- `READ_VERIFIED`;
- `NO_DATA_VERIFIED`;
- `READ_BLOCKED_NOT_AUTHORIZED`;
- `READ_BLOCKED_PROVIDER_ERROR`;
- `READ_BLOCKED_NOT_CONNECTED`.

A missing execution surface, repository configuration, credential-file existence or MCP process liveness MUST NOT be converted into `NO_DATA_VERIFIED` or `READ_VERIFIED`.

GSC and GA4 are independent provider lanes and principals. A GSC PASS never implies GA4 PASS. If GA4 credentials are not configured in the actual execution host, GA4 is `NOT_CONFIGURED / WAITING`; when configuration cannot be observed, it remains `CONFIGURATION_NOT_OBSERVED / NOT RUN` rather than being guessed.

### Codex / GSC provider evidence — 2026-09-16

The read-only Codex Cloud evidence supplied for this reconciliation proves the following without repository mutation or credential disclosure:

| Check | Current state | Evidence / gate |
|---|---|---|
| `CODEX-01` main host contract | `PASS` | `.codex/config.toml` and `.codex/setup-google-mcp-credentials.sh` exist on current main and match the Human-merged PR #954 host contract |
| `CODEX-02` setup execution | `PASS` | actual Codex Cloud setup completed; local credential artifacts were present without raw-secret output |
| `CODEX-03` credential path/modes | `PASS` | `~/.capital-ai` observed as `0700`; `~/.capital-ai/gsc-mcp-credentials.json` observed as regular file `0600`; contents were not read or emitted |
| `CODEX-04` Search Console MCP process/protocol liveness | `PASS` | direct STDIO MCP connection to `@vmandic/searchconsole-mcp@1.1.1`; `gsc_mcp_server_ping` returned real `pong`; native Codex-Cloud MCP tool injection remains `NOT_VERIFIED` and is not inferred from this result |
| `GSC-01` `gsc_list_sites` | `READ_VERIFIED` | real Google-backed MCP response returned `sc-domain:capital-ai.online`; observed permission was `siteRestrictedUser` |
| `SEO-CHAT-02` URL Inspection | `VERIFIED` | five individual `gsc_inspect_url` calls returned real Google Inspection responses for all 5/5 then-current sitemap URLs |
| GA4 read lane | `CONFIGURATION_NOT_OBSERVED / NOT RUN` | independent from GSC; no GA4 PASS is inferred from repository or GSC evidence |

The then-current canonical URL set for this evidence was exactly:

1. `https://capital-ai.online/`
2. `https://capital-ai.online/learning-platform`
3. `https://capital-ai.online/impressum`
4. `https://capital-ai.online/agb`
5. `https://capital-ai.online/datenschutz`

A real Google response for `/learning-platform` returned Verdict `NEUTRAL` and Coverage State `Discovered - currently not indexed`. This is an actionable indexation finding, not a transport/provider failure and not a project-wide SEO failure. For the other four URLs, this chat-level handoff proves real Inspection responses were received but does not preserve their individual response fields; missing details MUST NOT be synthesized in repository evidence.

The provider run reported `repository changed: no`; credentials were referenced only by the configured path and no `private_key`, `client_email` or credential JSON content was read or emitted.

### Provider continuation after `READ_VERIFIED`

The former `GSC-01` prerequisite for `SEO-CHAT-02` is satisfied. `SEO-CHAT-02` is now complete for the then-current five-URL sitemap set. The next SEO queue MUST therefore be recomputed from this Roadmap and real provider findings rather than continuing to treat Search Console connectivity or URL Inspection as an open gate.

`WP-SEO-TOPICS`, `WP-SEO-REFRESH`, `WP-SEO-AUTHORITY` and any other work package whose exit gate actually depends on query/traffic/index/visibility evidence remain condition-gated until the specific required provider evidence exists. `WP-SEO-CONTENT` remains gated by its required topic evidence. The verified URL Inspection result does not synthesize Search Analytics, traffic, conversion or GenAI metrics.

The `/learning-platform` `Discovered - currently not indexed` result is a real provider finding. Any remediation must first correlate current deployed/crawl/indexability evidence and remain within the appropriate FE/OPS/SEO ownership boundaries; no forced indexing, Search Console write or provider mutation is authorized by this read evidence.

## Merged FE owner returns — current-main correlation 2026-09-16

The dated SEO handoff `docs/seo/SEO_TECH_GATE_SCHEMA_HANDOFF_2026-09-11.md` remains historical evidence for the ownership boundary, but its `NOT STARTED IN SEO BRANCH` wording is no longer the current repository state.

- **WP-SEO-TECH-GATE:** Human-merged PR #893 (`[CAPITAL-AI-FE] [ChatGPT] SEO Public-Route-Regression erweitern`) added the FE-owned repository regression. Current main contains `tests/unit/seoPublicRouteSitemap.test.ts`, which compares the canonical route inventory with sitemap, prerender literals, `PUBLIC_SPA_PATHS` and public HTML fallback branches; it also excludes application routes and checks canonical, initial-indexability and real-404 invariants. The PR-head CI, Governance and Container Security workflows all concluded `success`. Current-main rerun in this reconciliation pass: `NOT RUN`; the subsequent real GSC URL Inspection provides provider evidence but does not replace deployed HTTP/browser readback.
- **WP-SEO-SCHEMA:** Human-merged PR #894 (`[CAPITAL-AI-FE] [ChatGPT] SEO Structured-Data-Regression ergänzen`) added `tests/unit/seoStructuredDataLifecycle.test.ts`. Current main parses the JSON-LD graph and checks the stable entity inventory, canonical URLs, publisher references, `softwareVersion == package.json#version`, explicit zero-price EUR Offer semantics and exclusion of `FAQPage`/unexpected top-level types. The PR-head CI, Governance and Container Security workflows all concluded `success`. Current-main rerun in this reconciliation pass: `NOT RUN`; generated-output/Rich-Results detail remains separate unless returned by real provider evidence.

These owner returns close the previously missing **repository-regression implementation** portion of the two handoffs. The verified GSC reads add real provider evidence but do not by themselves prove every deployed HTML behavior, Rich Results eligibility or all Search Analytics measurements.

## PR #900 / #901 work packages

### SEO-CARRY-01 — Existing non-terminal SEO backlog
Carry forward all non-terminal technical SEO, provider-read, dashboard, content/visibility, measurement and FE/OPS handoff work.

### SEO-PR900-01 — Least-privileged GSC/GA4/provider reads
Verify Search Console, URL Inspection, GA4 and GenAI-visibility reads with least privilege and current provider evidence.

**State:** `GSC_READ_VERIFIED / URL_INSPECTION_VERIFIED / GA4_AND_PERFORMANCE_READS_OPEN`.

The Codex host contract is present, direct STDIO MCP process/protocol liveness is verified, `gsc_list_sites` returned the required Domain property, and five of five then-current canonical sitemap URLs returned real URL Inspection responses. Native Codex-Cloud MCP tool injection remains `NOT_VERIFIED` but is not required to claim the already observed direct STDIO provider reads. GA4 and Search Analytics/GenAI measurement lanes remain independent and open.

### SEO-CHAT-02 — Search Console URL Inspection
Inspect every then-current canonical SEO URL through a real Search Console provider response after `GSC-01 == READ_VERIFIED`.

**State:** `VERIFIED` — 5/5 then-current sitemap URLs returned real Google URL Inspection responses on 2026-09-16.

**Verified finding:** `/learning-platform` returned Verdict `NEUTRAL` and Coverage State `Discovered - currently not indexed`. Detailed response fields for the other four URLs are not reproduced here because they were not included in the chat handoff and MUST NOT be synthesized.

**Exit:** `PASS` for the provider-response requirement — each canonical URL received a real provider response. Index status remains a per-URL factual field; `VERIFIED` does not mean every URL is indexed or SEO-optimal.

### SEO-PR900-02 — Technical SEO owner returns
Complete FE/OPS technical-gate returns for robots, sitemap, canonical, 404, JSON-LD, prerender, SeoEngine/dashboard and deployed behavior where applicable.

**State:** `FE_OWNER_RETURNS_MERGED / REPOSITORY_REGRESSIONS_PRESENT / GSC_URL_INSPECTION_VERIFIED / DEPLOYED_ACCEPTANCE_PARTIAL`.

**Evidence:** PR #893 and PR #894 are Human-merged and their current-main tests materially implement the previously missing `WP-SEO-TECH-GATE` and `WP-SEO-SCHEMA` repository regressions. Real URL Inspection now exists for the complete then-current sitemap set; `/learning-platform` is still reported by Google as discovered but not indexed. Remaining work is limited to still-unproven deployed/browser/generated-output acceptance and any independent OPS/FE return whose exit gate explicitly requires it.

### SEO-PR900-03 — Roadmap/document consolidation
Use this roadmap as the single project execution projection; retain legacy documents only as superseded/evidence references until their unique content is demonstrably preserved.

### SEO-PR900-04 — Measurable acceptance criteria
Define production-readiness SEO acceptance criteria from reproducible repository/provider evidence rather than estimated visibility.

**State:** `REPOSITORY_ACCEPTANCE_AND_URL_INSPECTION_MATERIALIZED / PERFORMANCE_MEASUREMENTS_OPEN`.

**Lane:** repository acceptance-contract work is executable; merged route/schema regressions provide deterministic repository gates and verified GSC URL Inspection now provides real per-URL provider evidence. Search Analytics, GA4, GenAI visibility and other performance measurements remain condition-gated until real evidence exists.

## Carried-forward baseline (pre-2026-09-13)

Program detail remains in `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` and `docs/seo/**`. Where older detail surfaces describe the entire SEO project as blocked because a provider read was unavailable, this project Roadmap's lane-local routing and the 2026-09-16 provider evidence are the current execution projection; provider classifications themselves still require real provider evidence.

| WP | State |
|---|---|
| WP-SEO-METRICS | GSC PROPERTY + URL INSPECTION VERIFIED / SEARCH ANALYTICS + GA4 CONDITION_GATED |
| WP-SEO-AI-VIS | GSC CONNECTIVITY VERIFIED / GENAI PERFORMANCE READ CONDITION_GATED |
| WP-SEO-TECH-GATE | FE OWNER RETURN MERGED / REPOSITORY REGRESSION PRESENT / GSC URL INSPECTION VERIFIED / DEPLOYED READBACK PARTIAL |
| WP-SEO-SCHEMA | FE OWNER RETURN MERGED / REPOSITORY REGRESSION PRESENT / URL INSPECTION VERIFIED / GENERATED-OUTPUT + RICH-RESULT DETAIL OPEN |
| WP-SEO-TOPICS | CONDITION_GATED — requires its concrete provider/topic evidence |
| WP-SEO-CONTENT | CONDITION_GATED — requires topic evidence |
| WP-SEO-SPAM | REPOSITORY_EXECUTABLE — apply existing negative gates |
| WP-SEO-CWV / IA / MEDIA | OWNER-ROUTED / continue repository handoff work where dependency-ready |
| WP-SEO-REFRESH / AUTHORITY | CONDITION_GATED where real search/content evidence is required |
| WP-SEO-I18N / AGENT | LATER / CONDITIONAL |

No synthetic ranking/traffic/conversion/GenAI metrics. `NOT RUN` is never `PASS`. A real URL Inspection response proves that response only; it does not imply indexed status or performance success.

## Dependencies
OPS execution-host/deployment/provider evidence, FE implementation, QM checks, COMP/privacy for analytics. The GSC property and URL Inspection dependency is now verified for the 2026-09-16 five-URL sitemap set. GA4, Search Analytics, GenAI visibility and other provider-dependent packages remain independently gated.

## Project exit gate
One active SEO roadmap; CAPITAL-AI-SEO remains the Target Owner with no productive PVC; repository-executable and provider-dependent lanes remain explicit; technical gates are reproducible; GSC property read and URL Inspection are real-provider verified; remaining provider lanes are either separately verified or explicitly lane-blocked; no second Roadmap/queue/registry/authority system exists.
