# CAPITAL-AI-SEO — Canonical Roadmap

**Project:** `CAPITAL-AI-SEO`  
**Folder:** `docs/projects/seo/`  
**Role:** cross-cutting SEO and Google Marketing execution/project coordination  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-16 — post-PR #959 automation reactivation plus merged FE owner-return correlation for WP-SEO-TECH-GATE / WP-SEO-SCHEMA  
**Baseline:** `main@5ae2b371da45a5c07304fd704a7026eded976f1b`  
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

### Provider-dependent lane — CONDITION_GATED

`SEO-PR900-01`, Search Console reads, URL Inspection, GA4 reads and real query/traffic/index/conversion evidence remain condition-gated. Only an actual provider response may change a provider state.

Allowed GSC read classifications are:

- `READ_VERIFIED`;
- `NO_DATA_VERIFIED`;
- `READ_BLOCKED_NOT_AUTHORIZED`;
- `READ_BLOCKED_PROVIDER_ERROR`;
- `READ_BLOCKED_NOT_CONNECTED`.

A missing execution surface, repository configuration, credential-file existence or MCP process liveness MUST NOT be converted into `NO_DATA_VERIFIED` or `READ_VERIFIED`.

GSC and GA4 are independent provider lanes and principals. A GSC PASS never implies GA4 PASS. If GA4 credentials are not configured in the actual execution host, GA4 is `NOT_CONFIGURED / WAITING`; when configuration cannot be observed, it remains `CONFIGURATION_NOT_OBSERVED / NOT RUN` rather than being guessed.

### Post-merge Codex / provider evidence state

| Check | Current state | Evidence / gate |
|---|---|---|
| `CODEX-01` main host contract | `PASS` | `.codex/config.toml` and `.codex/setup-google-mcp-credentials.sh` exist on current main and match the Human-merged PR #954 host contract |
| `CODEX-02` setup execution | `NOT RUN` | requires an actual Codex Cloud session in the configured Finance environment |
| `CODEX-03` credential path/modes | `NOT RUN` | must observe `~/.capital-ai` as `0700` and GSC credential file as `0600` without reading content |
| `CODEX-04` Search Console MCP liveness | `NOT RUN` | must start the project-scoped MCP on the actual Codex host; liveness is not provider evidence |
| `GSC-01` `gsc_list_sites` | `NOT RUN / CONDITION_GATED` | only a real Google response may classify the lane; required property is `sc-domain:capital-ai.online` |
| `SEO-CHAT-02` URL Inspection | `NOT RUN / CONDITION_GATED` | starts only after `GSC-01 == READ_VERIFIED`; every then-current canonical URL receives a real `gsc_inspect_url` read |
| GA4 read lane | `CONFIGURATION_NOT_OBSERVED / NOT RUN` | independent from GSC; no GA4 PASS is inferred from repository or GSC evidence |

### Provider continuation after `READ_VERIFIED`

When `GSC-01` returns `READ_VERIFIED` for `sc-domain:capital-ai.online`:

1. update the `SEO-PR900-01` GSC read lane from its pending state to the exact real provider state and retain source/timestamp evidence;
2. execute `SEO-CHAT-02` URL Inspection against the then-current canonical SEO URLs, recording timestamp, index status, Google canonical, user canonical, crawl/coverage information when returned, and explicit provider error where applicable;
3. recompute the next dependency-ready SEO work from this Roadmap instead of assuming a pre-existing queue order.

`WP-SEO-TOPICS`, `WP-SEO-REFRESH`, `WP-SEO-AUTHORITY` and any other work package whose exit gate actually depends on query/traffic/index/visibility evidence remain condition-gated until the specific required provider evidence exists. `WP-SEO-CONTENT` remains gated by its required topic evidence. This does not block unrelated repository-executable SEO packages.

## Merged FE owner returns — current-main correlation 2026-09-16

The dated SEO handoff `docs/seo/SEO_TECH_GATE_SCHEMA_HANDOFF_2026-09-11.md` remains historical evidence for the ownership boundary, but its `NOT STARTED IN SEO BRANCH` wording is no longer the current repository state.

- **WP-SEO-TECH-GATE:** Human-merged PR #893 (`[CAPITAL-AI-FE] [ChatGPT] SEO Public-Route-Regression erweitern`) added the FE-owned repository regression. Current main contains `tests/unit/seoPublicRouteSitemap.test.ts`, which compares the canonical route inventory with sitemap, prerender literals, `PUBLIC_SPA_PATHS` and public HTML fallback branches; it also excludes application routes and checks canonical, initial-indexability and real-404 invariants. The PR-head CI, Governance and Container Security workflows all concluded `success`. Current-main rerun in this reconciliation pass: `NOT RUN`; post-deploy/provider evidence remains separate.
- **WP-SEO-SCHEMA:** Human-merged PR #894 (`[CAPITAL-AI-FE] [ChatGPT] SEO Structured-Data-Regression ergänzen`) added `tests/unit/seoStructuredDataLifecycle.test.ts`. Current main parses the JSON-LD graph and checks the stable entity inventory, canonical URLs, publisher references, `softwareVersion == package.json#version`, explicit zero-price EUR Offer semantics and exclusion of `FAQPage`/unexpected top-level types. The PR-head CI, Governance and Container Security workflows all concluded `success`. Current-main rerun in this reconciliation pass: `NOT RUN`; generated-output, production and Google-provider evidence remain separate.

These owner returns close the previously missing **repository-regression implementation** portion of the two handoffs. They do not by themselves prove deployed HTML behavior, Google indexing, Rich Results eligibility or Search Console state.

## PR #900 / #901 work packages

### SEO-CARRY-01 — Existing non-terminal SEO backlog
Carry forward all non-terminal technical SEO, provider-read, dashboard, content/visibility, measurement and FE/OPS handoff work.

### SEO-PR900-01 — Least-privileged GSC/GA4/provider reads
Verify Search Console, URL Inspection, GA4 and GenAI-visibility reads with least privilege and current provider evidence.

**State:** `HOST_CONTRACT_MERGED / PROVIDER_READ_NOT_RUN / CONDITION_GATED`.

PR #954 provides the current Codex host contract but does not itself provide Google read evidence. Provider-unavailable or not-run states remain explicit and lane-local. Repository-executable SEO work continues independently.

### SEO-CHAT-02 — Search Console URL Inspection
Inspect every then-current canonical SEO URL through a real Search Console provider response after `GSC-01 == READ_VERIFIED`.

**State:** `CONDITION_GATED / NOT RUN`.

**Exit:** each canonical URL has timestamped real-provider evidence for index status, Google canonical, user canonical and available crawl/coverage fields, or an explicit provider error. Repository-derived values MUST NOT substitute for Google responses.

### SEO-PR900-02 — Technical SEO owner returns
Complete FE/OPS technical-gate returns for robots, sitemap, canonical, 404, JSON-LD, prerender, SeoEngine/dashboard and deployed behavior where applicable.

**State:** `FE_OWNER_RETURNS_MERGED / REPOSITORY_REGRESSIONS_PRESENT / POST_DEPLOY_EVIDENCE_OPEN`.

**Evidence:** PR #893 and PR #894 are Human-merged and their current-main tests materially implement the previously missing `WP-SEO-TECH-GATE` and `WP-SEO-SCHEMA` repository regressions. Remaining work is limited to still-unproven deployed/generated-output/provider acceptance and any independent OPS return whose exit gate explicitly requires it.

### SEO-PR900-03 — Roadmap/document consolidation
Use this roadmap as the single project execution projection; retain legacy documents only as superseded/evidence references until their unique content is demonstrably preserved.

### SEO-PR900-04 — Measurable acceptance criteria
Define production-readiness SEO acceptance criteria from reproducible repository/provider evidence rather than estimated visibility.

**State:** `REPOSITORY_ACCEPTANCE_PARTIALLY_MATERIALIZED / PROVIDER_MEASUREMENTS_OPEN`.

**Lane:** repository acceptance-contract work is executable; the merged route/schema regressions now provide deterministic repository gates, while external/deployed measurements remain condition-gated until real evidence exists.

## Carried-forward baseline (pre-2026-09-13)

Program detail remains in `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` and `docs/seo/**`. Where older detail surfaces describe the entire SEO project as blocked because a provider read was unavailable, this project Roadmap's lane-local routing is the current execution projection; provider classifications themselves still require real provider evidence.

| WP | State |
|---|---|
| WP-SEO-METRICS | READ_CONTRACT_READY / GSC+GA4 CONDITION_GATED |
| WP-SEO-AI-VIS | READ_CONTRACT_READY / GSC CONDITION_GATED |
| WP-SEO-TECH-GATE | FE OWNER RETURN MERGED / REPOSITORY REGRESSION PRESENT / POST-DEPLOY EVIDENCE OPEN |
| WP-SEO-SCHEMA | FE OWNER RETURN MERGED / REPOSITORY REGRESSION PRESENT / GENERATED-OUTPUT + PROVIDER EVIDENCE OPEN |
| WP-SEO-TOPICS | CONDITION_GATED — requires its concrete provider/topic evidence |
| WP-SEO-CONTENT | CONDITION_GATED — requires topic evidence |
| WP-SEO-SPAM | REPOSITORY_EXECUTABLE — apply existing negative gates |
| WP-SEO-CWV / IA / MEDIA | OWNER-ROUTED / continue repository handoff work where dependency-ready |
| WP-SEO-REFRESH / AUTHORITY | CONDITION_GATED where real search/content evidence is required |
| WP-SEO-I18N / AGENT | LATER / CONDITIONAL |

No synthetic ranking/traffic/conversion/GenAI metrics. Provider-unavailable is not inferred as `NO_DATA` PASS. `NOT RUN` is never `PASS`.

## Dependencies
OPS execution-host/deployment/provider evidence, FE implementation, QM checks, COMP/privacy for analytics. A blocked provider dependency blocks only the work package that requires it.

## Project exit gate
One active SEO roadmap; CAPITAL-AI-SEO remains the Target Owner with no productive PVC; repository-executable and provider-dependent lanes remain explicit; technical gates are reproducible; provider-read state is real-provider verified or explicitly lane-blocked; no second Roadmap/queue/registry/authority system exists.
