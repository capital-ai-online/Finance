# CAPITAL-AI-SEO — Canonical Roadmap

**Baseline:** `main@123ad5ac7734d363e35d1b7bf945aceae41fbee8`

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

## Current Owner-directed work item — 2026-09-20

### WP-SEO-LAUNCH-01 — Public Web & Social Launch Management

**State:** `ACTIVE_CANONICAL / CURRENT_FRONTEND_1241_BOUND / FAQ_OPS_DEPENDENCY_OPEN`.

Fresh Human/Owner direction in the current interaction activates one bounded launch-readiness work item: converge the existing SEO, public-web, measurement and Social distribution capabilities into an evidence-based go-public sequence without creating a second roadmap, publishing authority, analytics stack or product owner.

**Detailed work package:** `docs/seo/WP_SEO_LAUNCH_01_PUBLIC_WEB_SOCIAL_LAUNCH_2026-09-20.md`  
**Program integration:** `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` version `0002.21`.

**Current execution evidence:** `docs/seo/WP_SEO_LAUNCH_01_EXECUTION_BASELINE_2026-09-20.md`.  
**Current management refresh:** `docs/seo/WP_SEO_LAUNCH_01_MANAGEMENT_REFRESH_2026-09-21.md`.

Historical launch-execution readback retained for provenance (superseded by the 2026-09-22 current-frontend convergence below):

- repository landing/CTA freeze: `PASS_REPOSITORY`;
- current public URL inventory: six canonical sitemap URLs including `/universe`;
- Production freeze: `PASS` after an initially observed drift; canonical main CI run `35529208910` triggered the verified Render deploy within the five-minute SLA and Production is now live at exact `79eef34e8cd7cd852305641cb1b49cd90dbd2af5`;
- root landing metadata/prerender semantic alignment: `OPEN_FE_HANDOFF`;
- Search Analytics/current six-URL GSC baseline: `READ_BLOCKED_NOT_CONNECTED`;
- GA4 Data API/MCP baseline: `READ_BLOCKED_NOT_CONNECTED`;
- X/Facebook provider accounts: `NOT_CONNECTED` in the current production Social account store;
- Social Wave 1: canonical SEO source content and owner-correct handoff started; provider publication remains `NOT_RUN`.

No missing provider read or provider account is converted into `PASS` or `NO_DATA_VERIFIED`.

Historical owner-correct dependencies for that snapshot:

- Human/CODEOWNER-merged FE PR `#1153` plus the later merged landing AI-Newsfeed integration PR `#1159` are part of the current-main landing candidate; production verification remains separate;
- `CAPITAL-AI-SOCIAL` owns channel adaptation, Social content packages, provider publication and publication/analytics evidence;
- `CAPITAL-AI-OPS` owns production/deployment/provider runtime readback;
- `CAPITAL-AI-GOV`, `CAPITAL-AI-SEC`, `CAPITAL-AI-COMP`, `CAPITAL-AI-FINTECH` and `CAPITAL-AI-QM` retain their existing control, security, compliance, domain-truth and independent-assurance boundaries.

This section is a thin current-work projection only. The detailed launch contract lives in the work-package file and the existing consolidated roadmap remains the single SEO/Google-Marketing program roadmap.

## Historical SEO management refresh — 2026-09-21

Fresh Owner direction assigns the SEO-management portion of `WP-SEO-LAUNCH-01` to this execution context.

Historical snapshot (not current execution baseline):

- `CURRENT_MAIN`: `4f2c746a20a8683d784a1cbe54c763a64ddd1da3`;
- Production: exact same SHA on Render deploy `dep-dao54cajnfac73ak74rg` — `PASS` for this snapshot;
- merged FE PR `#1178` changed the landing hero/branding, invalidating the older snapshot freeze but not the inspected CTA targets;
- root route metadata/prerender remains semantically stale against the visible market-intelligence landing — `OPEN_FE_HANDOFF`;
- `/universe` remains a canonical sitemap route but lacks a visible landing-page internal link in the inspected source — `OPEN_FE_HANDOFF`;
- GSC current performance and GA4 provider reads remain `READ_BLOCKED_NOT_CONNECTED` in this Chat execution;
- production Social account readback remains X=`0`, Facebook=`0`; Wave-1 publishing is `BLOCKED_PROVIDER_ACCOUNT_IDENTITY`;
- SEO-owned topic map and first launch content brief are now materialized without synthetic search metrics.

Detailed evidence: `docs/seo/WP_SEO_LAUNCH_01_MANAGEMENT_REFRESH_2026-09-21.md`.

## Historical Landing-First correlation — 2026-09-21

Fresh Owner direction establishes `LF-01_STATIC_VISUAL_LANDING_PASS` as the shared dependency before any new productive landing-page integration. For CAPITAL-AI-SEO this does **not** create a second authority or a new roadmap; it constrains the existing `WP-SEO-LAUNCH-01` execution under `/AGENTS.md@CURRENT_MAIN`.

Current correlation against `main@bf1e8c654332cbc1a01f20a3e9cb5fc6d330ca7f`:

- open FE PR `#1195` head `9901590b3544d08df55f3771bdb35c60d5fb7d53` is based on this exact main snapshot;
- `LF-01_STATIC_VISUAL_LANDING_PASS` is **not evidenced**: PR #1195 changes productive pricing, subscription/session, Enterprise Scorer and Stripe checkout surfaces in addition to the visual landing work;
- exact-head `build-and-test` fails because `src/app/universe/ui/UniversePortal.tsx` instantiates `PublicAnalysisWorkbench` without the newly required `userSession` prop;
- OSS-quality evidence is independently non-PASS on that head because vitest-coverage, Knip and jscpd evidence are reported unavailable;
- therefore SEO must remain in **PREPARATION_ONLY** mode for landing-related work until FE + QM provide LF-01 exit evidence;
- allowed SEO work before LF-01: canonical-root/metadata requirements, crawlable static semantics, content/claim preparation, baseline measurement design, and owner-correct handoffs;
- blocked before LF-01: new productive analytics activation tied to the landing, launch claims that present later integrations as live, and publication/measurement decisions that assume scorer/pricing/news integration is production-ready.

Owner-correct handoff: FE owns PR #1195 re-scope/supersession and static visual baseline implementation; QM independently validates the exit evidence. SEO records the dependency and does not mutate FE runtime.

## Current frontend / SEO convergence — 2026-09-22

Fresh Human/Owner direction requires all active SEO website work to target the current merged Frontend rather than older landing snapshots.

- Current main is `9c8a3e80c4451ed0b6ea45f368175604608f6f4b`, exactly the merge of FE PR #1241.
- PR #1241 promotes `SvenKulessa/FRONTEND@f2a101330d74420c373f0ec56fa58caac53d741d` into the current landing runtime.
- PR #1206/#1209 references are historical evidence only for active SEO coordination.
- Root title/description are corrected in the open SEO PR to the current visible “Marktdaten verstehen. Chancen besser erkennen.” proposition.
- Impressum route/prerender metadata is corrected from TMG to `§ 5 DDG`.
- Final Mobile/Desktop CWV is measurement-gated; no superseded FE PR remains a blocker.
- `/faq` exists in the current frontend, but canonical SEO route/sitemap/prerender promotion remains blocked on OPS Issue #1223 because the production SPA allowlist/fallback has not yet converged. SEO Issue #1233 remains the owner-correct continuation.
- GSC/GA4/GenAI provider states remain independently evidence-gated.

Current binding evidence: `docs/seo/SEO_LANDING_PAGE_BINDING_2026-09-21.md`.

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

The then-current canonical URL set for this **historical 2026-09-16 provider evidence** was:

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

**Observed state:** `GSC_HISTORICAL_PROPERTY_AND_5_URL_INSPECTION_VERIFIED / CURRENT_6_URL_AND_SEARCH_ANALYTICS_READ_BLOCKED_NOT_CONNECTED / GA4_READ_BLOCKED_NOT_CONNECTED`. The current sitemap additionally contains `/universe`, which is not covered by the historical five-URL inspection set.

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
