# SEO Production Growth Readback — 2026-09-17

**Package:** `SEO-MONETIZATION-MARKETING-AUTOMATION-01` — Part 3 successor evidence  
**Project:** `CAPITAL-AI-SEO`  
**Project folder:** `docs/projects/seo/`  
**Canonical detailed evidence surface:** `docs/seo/`  
**Primary productive PVC:** `N/A — cross-cutting; no productive PVC ownership`  
**Primary Owner:** `CAPITAL-AI-SEO`  
**Execution baseline:** `main@4310fa4007278e925272c23149337d0b90c7a061`  
**Branch:** `agent/seo-production-growth-readback-20260917`  
**Trust root:** `/AGENTS.md@4310fa4007278e925272c23149337d0b90c7a061`, Control Plane `2.11.0`

## 1. Purpose

This evidence continues the Human-merged `SEO-MONETIZATION-MARKETING-AUTOMATION-01` package from PR `#1017` without reopening its historical branch or treating the prior chat state as current truth.

The bounded objective is to determine whether the public acquisition surface that was only repository-side evidence in PR `#1017` has reached the latest observed production artifact, then to preserve the remaining provider/runtime gaps without fabricating HTTP, GSC, GA4, conversion or revenue success.

No Productive Frontend, Billing, Consent, Runtime, Provider, Campaign, Indexing, AdSense or Production mutation is performed by this evidence slice.

## 2. Current project and authority resolution

Current organizational resolution from `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md` remains:

- Current Project: `CAPITAL-AI-SEO`;
- Current Project Folder: `docs/projects/seo/`;
- Primary productive PVC: none;
- Primary Owner: `CAPITAL-AI-SEO`;
- detailed SEO evidence stays under `docs/seo/**` rather than creating a second Roadmap or project-folder truth.

Applicable Google Marketing architecture remains `ESS-0014` plus Accepted `ADR-0035`. The active Owner-approved consent variant keeps Google Analytics behind valid analytics consent, keeps advertising signals denied and keeps AdSense paused. Read and Write planes remain separate.

Open Pull Requests at execution start:

- `#1032` — `CAPITAL-AI-FE`, News-consumer Strangler;
- `#1022` — `CAPITAL-AI-GOV`, proposed Trust-Root consolidation.

Neither open PR changes this evidence path. `#1022` does write `/AGENTS.md` and governance authority surfaces, therefore any merge of `#1022` before this slice reaches PR creation or merge readiness requires a fresh authority correlation.

## 3. Predecessor state

PR `#1017` (`[CAPITAL-AI-SEO] [ChatGPT] Monetarisierungs- und Marketing-Automation materialisieren`) is Human-merged. Its final evidence correctly left the following Part-3 gates open:

- normal production deployment/readback of the richer public landing;
- real GSC Search Analytics performance rows;
- GA4 Data API / Realtime / DebugView evidence;
- consent-safe semantic conversion events;
- authoritative purchase/revenue lineage.

The predecessor is terminal and is not reused as a working branch.

## 4. Production identity correlation

### 4.1 Latest available immutable Production Baseline

The latest available repository-produced Production Baseline observed during this execution is in open PR `#1032`, generated after current main advanced to `4310fa4007278e925272c23149337d0b90c7a061`.

It reports:

- Production commit: `085299e88e5c0b16bb5d9cb62f7599c607a4aca2`;
- Production branch: `main`;
- current main: `4310fa4007278e925272c23149337d0b90c7a061`;
- Production → main drift: `3` commits.

This evidence is used as the latest available immutable deployment identity in the current connector surface. No Render mutation is performed.

### 4.2 Does Production contain the previously un-deployed #1013 landing?

Yes at Git ancestry / deployed-artifact identity level.

`47a245be78b60494c0f57518f742bbb7923b70fa` is the Human-merged PR `#1013` commit. A repository compare from that commit to observed Production commit `085299e88e5c0b16bb5d9cb62f7599c607a4aca2` returns:

- status `ahead`;
- `57` commits ahead;
- `0` behind;
- merge base exactly `47a245be78b60494c0f57518f742bbb7923b70fa`.

Therefore the observed Production commit contains the #1013 public landing payload in its ancestry. The previous PR-#1017 statement that #1013 had not yet reached Production is no longer current.

### 4.3 Production → current-main semantic drift

A compare from Production `085299e88e5c0b16bb5d9cb62f7599c607a4aca2` to current main `4310fa4007278e925272c23149337d0b90c7a061` returns exactly one changed file:

`docs/projects/quality-management/evidence/QM_MOBILE_NAVIGATION_ASSURANCE_2026-09-16.md`

No application source, SEO runtime, Analytics, Consent, Billing, route, prerender, sitemap, robots, structured-data or deployment configuration file differs in that Production → current-main delta.

**Classification:** `PRODUCTION_APPLICATION_CODE_PARITY_VERIFIED` for this baseline. Main SHA and Production SHA are not identical, but the three-commit drift is documentary QM evidence only.

## 5. Public scorer / acquisition surface state

Observed Production commit `085299e88e5c0b16bb5d9cb62f7599c607a4aca2` is itself the merge commit for PR `#1029`, which keeps the public Enterprise Scorer directly visible while removing its heavy implementation from the landing first-paint module graph through the existing React/Vite code-splitting path.

Combined with the #1013 ancestry proof, the observed Production artifact therefore contains repository truth for:

- the public fixed-BTC Enterprise Scorer surface;
- public capability framing and account CTA introduced by #1013;
- subsequent public-scorer first-paint bundle separation from #1029;
- the already-merged SEO monetization/marketing evidence from #1017.

This proves deployed-artifact/code identity. It does **not** by itself prove rendered browser behavior, network success, JavaScript completion, CTA interaction, Core Web Vitals or search-engine rendering.

## 6. HTTP / rendered readback

A direct external HTTP/rendered readback could not be obtained from the current execution host. The available web fetch path did not return the site, and the local execution container could not resolve the production hostname.

This is classified as:

`NOT_RUN / CURRENT_HOST_NETWORK_REACHABILITY_UNAVAILABLE`

It is **not** classified as:

- website outage;
- DNS production failure;
- Render failure;
- indexing failure;
- crawler failure;
- browser regression.

No such provider/runtime state is inferred from a tool-host reachability limitation.

The remaining deployed-acceptance evidence is therefore specifically:

- HTTP status/readback for `/`, `/learning-platform`, `/robots.txt`, `/sitemap.xml` and `/healthz` from a capable external execution plane;
- rendered public landing text/CTA/scorer identity;
- mobile interaction/readback where the SEO exit gate depends on it.

## 7. Search Console and GA4 evidence state

### Search Console

The project Roadmap preserves real provider evidence from 2026-09-16 for:

- `sc-domain:capital-ai.online` property read;
- `siteRestrictedUser` permission observation;
- URL Inspection provider responses for the then-current five-URL sitemap set;
- `/learning-platform`: Verdict `NEUTRAL`, Coverage `Discovered - currently not indexed` at that observation time.

That historical provider read remains valid evidence for its observation time. It is not promoted to a new 2026-09-17 Search Analytics or index-state claim.

Current execution did **not** obtain Search Analytics rows for:

- clicks;
- impressions;
- CTR;
- average position;
- query;
- page;
- country;
- device.

State: `NOT_RUN_CURRENT_HOST`.

### GA4

No authenticated GA4 Data API, Realtime or DebugView provider read is connected to the current execution surface.

State: `NOT_RUN_CURRENT_HOST`.

The plugin directory contains third-party options capable of GSC/GA4 reads, but none is connected in this execution context. Repository governance does not authorize installing, connecting or changing external integration permissions merely to close this evidence gap.

## 8. Current-main measurement contract check

`public/google-analytics-consent.js@current-main` still provides the consent-gated GA4 base only:

- all analytics/advertising signals default to denied except required security storage;
- GA is loaded only after valid analytics consent;
- `gtag('config', ..., send_page_view: true)` configures the base page-view path;
- advertising personalization/signals stay disabled;
- withdrawal disables GA and clears reachable GA cookies.

No application business-event implementation for the package's semantic conversion events was identified in the current-main search. The existing gap therefore remains:

- `sign_up` — not repository-evidenced as a semantic GA4 business event;
- `login` — not repository-evidenced as a semantic GA4 business event;
- `purchase` — no authoritative GA4 purchase/revenue lineage evidenced;
- `generate_lead` — must not exist until a real lead action exists.

No event is synthesized in this SEO-owned evidence slice.

## 9. Current Google guidance correlation

Current official Google guidance remains compatible with the package contract:

1. Search Console is the source for Google Search performance; GA4 is the source for on-site behavior. Their trends can be analyzed together, but clicks and sessions are calculated differently and should not be forced to equal each other.
2. Search Analytics can group real provider rows by dimensions such as query, page, country and device and returns clicks, impressions, CTR and average position.
3. GA4 recommends semantic events such as `login`, `sign_up`, `search`, `share`, `generate_lead` and `purchase` when the corresponding real action occurs.
4. `purchase` uses transaction identity to prevent duplicate purchase reporting; revenue/value fields require authoritative currency/value semantics.

Advisory references:

- `https://developers.google.com/search/docs/monitor-debug/google-analytics-search-console`
- `https://developers.google.com/webmaster-tools/v1/searchanalytics/query`
- `https://support.google.com/analytics/answer/9267735`
- `https://developers.google.com/analytics/devguides/collection/ga4/reference/events`

External guidance is advisory only and does not override CAPITAL-AI ownership, consent or protected-mutation controls.

## 10. Readiness delta

The previous capability/evidence rubrics are **not increased** merely because deployed artifact ancestry is now proven.

### Monetization readiness

Remains **50%** under the predecessor's 10-gate rubric.

Reason: the public product surface has stronger Production artifact evidence, but rendered/browser verification, semantic conversion measurement, live commerce evidence and revenue attribution remain unproven. The existing partial score is therefore still conservative and defensible.

### Marketing readiness

Remains **45%** under the predecessor's 10-gate rubric.

Reason: GSC Search Analytics, GA4 business/key events, final creative inventory and a paid conversion feedback loop remain absent or unverified.

These percentages are readiness rubrics, not forecasts of traffic, revenue, CAC or ROAS.

## 11. Roadmap impact

This evidence does not create a second Roadmap.

- `WP-SEO-TECH-GATE`: advance the deployment sub-state from `#1013 not yet live` to `PRODUCTION_APPLICATION_CODE_PARITY_VERIFIED / RENDERED_HTTP_READBACK_OPEN`.
- `WP-SEO-METRICS`: unchanged — Search Analytics + GA4 remain condition-gated and `NOT RUN` here.
- `WP-SEO-TOPICS`: unchanged — final search-intent priority still requires real performance/topic evidence.
- `WP-SEO-CONTENT`: unchanged — provider/topic evidence is still required before data-driven content scaling.
- `WP-SEO-SPAM`: guards remain preserved; no scaled low-value content, artificial traffic or fake engagement.
- `WP-SEO-CWV / IA / MEDIA`: remain owner-routed where productive implementation is required.

## 12. Exact remaining Growth gates

`Search -> Landing Page -> Engagement -> Conversion -> Revenue` is still not end-to-end provider-verifiable.

The smallest remaining links are now:

1. **real external rendered HTTP/browser readback** of the deployed public acquisition surface;
2. **real GSC Search Analytics + GA4 read** for an explicit aligned observation period;
3. **consent-safe semantic conversion instrumentation** routed to the productive owners and bound to authoritative success states;
4. only after those gates: evidence-driven content prioritization and separately authorized paid/advertising activation.

No provider mutation, campaign creation, indexing request, budget/spend, AdSense activation, deployment or merge is performed by this evidence package.
