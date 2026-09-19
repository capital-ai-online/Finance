# SEO Production Growth Readback — 2026-09-17

**Package:** `SEO-MONETIZATION-MARKETING-AUTOMATION-01` — Part 3 successor evidence  
**Project:** `CAPITAL-AI-SEO`  
**Project folder:** `docs/projects/seo/`  
**Canonical detailed evidence surface:** `docs/seo/`  
**Primary productive PVC:** `N/A — cross-cutting; no productive PVC ownership`  
**Primary Owner:** `CAPITAL-AI-SEO`  
**Execution baseline:** `main@bb9d14aba0cf47a6998503f45f42dd2b2ce69498`  
**Branch:** `agent/seo-production-growth-readback-20260917`  
**Trust root:** `/AGENTS.md@bb9d14aba0cf47a6998503f45f42dd2b2ce69498`, Control Plane `4.3.0`  
**Correlation refreshed:** `2026-09-19`

## 1. Purpose

This evidence continues the Human-merged `SEO-MONETIZATION-MARKETING-AUTOMATION-01` package from PR `#1017` without reopening its historical branch or treating prior chat state as current truth.

The bounded objective is to determine whether the public acquisition surface that was repository-side evidence during PR `#1017` has reached Production, then preserve the exact remaining rendered/provider/measurement gaps without fabricating HTTP, GSC, GA4, conversion or revenue success.

No productive Frontend, Billing, Consent, Runtime, Provider, Campaign, Indexing, AdSense or Production mutation is performed by this slice.

## 2. Project, ownership and authority

Current organizational resolution remains:

- Current Project: `CAPITAL-AI-SEO`;
- Current Project Folder: `docs/projects/seo/`;
- Primary productive PVC: none;
- Primary Owner: `CAPITAL-AI-SEO`;
- detailed SEO evidence stays under `docs/seo/**` rather than creating a second Roadmap or project-folder truth.

Applicable Google Marketing architecture remains `ESS-0014` plus Accepted `ADR-0035`. The active Owner-approved consent variant keeps Google Analytics behind valid analytics consent, advertising signals denied and AdSense paused. Read and Write planes remain separate.

Open-writer correlation was refreshed against `main@bb9d14aba0cf47a6998503f45f42dd2b2ce69498`. The effective PR diff remains exactly this SEO evidence file; no same-file writer among the currently relevant open PR set changes this evidence path. Any later main/head movement still invalidates this snapshot and requires a fresh correlation before merge readiness.

## 3. Predecessor state

PR `#1017` (`[CAPITAL-AI-SEO] [ChatGPT] Monetarisierungs- und Marketing-Automation materialisieren`) is Human-merged. Its final evidence left these Part-3 gates open:

- production/readback of the richer public landing;
- real GSC Search Analytics performance rows;
- GA4 Data API / Realtime / DebugView evidence;
- consent-safe semantic conversion events;
- authoritative purchase/revenue lineage.

The predecessor is terminal and is not reused as a working branch.

## 4. Production identity correlation

### 4.1 Latest observed machine baseline

Fresh provider/repository correlation on `2026-09-19` establishes the current deployment identity directly:

- current repository `main`: `bb9d14aba0cf47a6998503f45f42dd2b2ce69498`;
- Production commit: `bb9d14aba0cf47a6998503f45f42dd2b2ce69498`;
- Production branch: `main`;
- Production → main drift: `0` commits;
- source merge: PR `#1078`, merged at `2026-09-19T19:28:23Z`;
- canonical Render service: `Finance`;
- Render deploy trigger: `deploy_hook`;
- deploy start: `2026-09-19T19:32:40.948123Z`;
- deploy finished/live: `2026-09-19T19:33:47.695911Z`.

The deploy hook was observed within the repository trust-root five-minute trigger SLA. The current Production SHA therefore matches the exact current-main SHA rather than relying on the older PR-local baseline that previously referenced `4310fa4007278e925272c23149337d0b90c7a061`.

**Classification:** `PRODUCTION_MAIN_IDENTITY_VERIFIED / EXACT_SHA_MATCH`.

No deployment was triggered by this SEO evidence update itself.

### 4.2 Public acquisition lineage contained in current Production

Current Production/main `bb9d14aba0cf47a6998503f45f42dd2b2ce69498` contains the relevant Human-merged acquisition lineage:

- PR `#1013`: richer public landing, fixed-BTC Enterprise Scorer presentation, capability framing, Vocabulary link and account CTA;
- PR `#1017`: SEO monetization/marketing Evidence + Measurement Blueprint;
- PR `#1029`: public scorer first-paint split via the existing React/Vite path while preserving direct visibility and canonical scoring authority.

Because Production and current main identify the same exact current SHA after the 2026-09-19 provider readback, there is no remaining Git/Release identity gap for these merged application changes.

This proves Production artifact/code identity. It does **not** by itself prove rendered browser behavior, network success, JavaScript completion, CTA interaction, Core Web Vitals, search-engine rendering or conversion performance.

## 5. HTTP / rendered readback

A direct external HTTP/rendered readback could not be obtained from the current execution host. The available web path did not return a usable site fetch and the local execution container could not resolve the production hostname.

State:

`NOT_RUN / CURRENT_HOST_NETWORK_REACHABILITY_UNAVAILABLE`

This is **not** evidence of:

- website outage;
- DNS production failure;
- Render failure;
- indexing failure;
- crawler failure;
- browser regression.

No provider/runtime failure is inferred from an execution-host reachability limitation.

The remaining deployed-acceptance evidence is therefore specifically:

- external HTTP/readback for `/`, `/learning-platform`, `/robots.txt`, `/sitemap.xml` and `/healthz` from a capable execution plane;
- rendered public landing text/CTA/scorer identity;
- mobile interaction/readback where the SEO exit gate depends on it.

## 6. Search Console and GA4 state

### Search Console

The canonical SEO Roadmap preserves real provider evidence from 2026-09-16 for:

- `sc-domain:capital-ai.online` property read;
- observed `siteRestrictedUser` permission;
- real URL Inspection responses for the then-current five-URL sitemap set;
- `/learning-platform`: Verdict `NEUTRAL`, Coverage `Discovered - currently not indexed` at that observation time.

That remains valid evidence for its timestamp. It is not promoted to a new 2026-09-17 Search Analytics or index-state claim.

Current execution did **not** obtain Search Analytics rows for clicks, impressions, CTR, average position, query, page, country or device.

State: `NOT_RUN_CURRENT_HOST`.

### GA4

No authenticated GA4 Data API, Realtime or DebugView provider read is connected to the current execution surface.

State: `NOT_RUN_CURRENT_HOST`.

Third-party plugin capabilities capable of GSC/GA4 reads exist in the execution-host directory, but none is connected here. Repository governance does not authorize installation, connection or permission changes merely to close this evidence gap.

## 7. Current-main measurement contract

`public/google-analytics-consent.js@current-main` still provides the consent-gated GA4 base:

- analytics and advertising storage/signals default denied except required security storage;
- GA loads only after valid analytics consent;
- `gtag('config', ..., send_page_view: true)` provides the base page-view path;
- Google signals/ad personalization stay disabled;
- withdrawal disables GA and clears reachable GA cookies.

No application business-event implementation for the package's semantic conversion events was identified in current-main search. The remaining measurement gap is therefore unchanged:

- `sign_up` — no repository-evidenced semantic GA4 business event;
- `login` — no repository-evidenced semantic GA4 business event;
- `purchase` — no authoritative GA4 purchase/revenue lineage evidenced;
- `generate_lead` — must not exist until a real lead action exists.

No event is synthesized in this SEO-owned evidence slice.

## 8. Current Google guidance correlation

Current official Google guidance remains compatible with the package contract:

1. Search Console is the source for Google Search performance and GA4 is the source for on-site behavior; their trends can be correlated, but clicks and sessions are different measurements and must not be forced to equality.
2. Search Analytics can group provider rows by dimensions including query, page, country and device and returns clicks, impressions, CTR and average position.
3. GA4 recommends semantic events such as `login`, `sign_up`, `search`, `share`, `generate_lead` and `purchase` when the corresponding real action occurs.
4. `purchase` uses authoritative transaction identity and currency/value semantics; transaction identity is important for duplicate control.

Advisory references:

- `https://developers.google.com/search/docs/monitor-debug/google-analytics-search-console`
- `https://developers.google.com/webmaster-tools/v1/searchanalytics/query`
- `https://support.google.com/analytics/answer/9267735`
- `https://developers.google.com/analytics/devguides/collection/ga4/reference/events`

External guidance is advisory only and does not override CAPITAL-AI ownership, consent or protected-mutation controls.

## 9. Readiness delta

The predecessor rubrics are **not increased** merely because exact Production/main identity is now proven.

### Monetization readiness

Remains **50%** under the predecessor's 10-gate rubric.

Reason: the public product surface is now proven to be in the Production artifact, but rendered/browser verification, semantic conversion measurement, live commerce evidence and revenue attribution remain unproven.

### Marketing readiness

Remains **45%** under the predecessor's 10-gate rubric.

Reason: GSC Search Analytics, GA4 business/key events, final creative inventory and a paid conversion feedback loop remain absent or unverified.

These percentages are readiness rubrics, not forecasts of traffic, revenue, CAC or ROAS.

## 10. Roadmap impact

This evidence creates no parallel Roadmap.

- `WP-SEO-TECH-GATE`: advance the deployment identity sub-state to `PRODUCTION_MAIN_IDENTITY_VERIFIED / RENDERED_HTTP_READBACK_OPEN`.
- `WP-SEO-METRICS`: unchanged — Search Analytics + GA4 remain condition-gated and `NOT RUN` here.
- `WP-SEO-TOPICS`: unchanged — final search-intent priority still requires real performance/topic evidence.
- `WP-SEO-CONTENT`: unchanged — provider/topic evidence is still required before data-driven content scaling.
- `WP-SEO-SPAM`: guards remain preserved; no scaled low-value content, artificial traffic or fake engagement.
- `WP-SEO-CWV / IA / MEDIA`: remain owner-routed where productive implementation is required.
- proposed `universe.capital-ai.online` from open PR `#1033`: future SEO correlation only after its terminal outcome and actual OPS/DNS/TLS/SEO activation evidence; it is not added to current canonical indexable inventory here.

## 11. Exact remaining Growth gates

`Search -> Landing Page -> Engagement -> Conversion -> Revenue` is still not end-to-end provider-verifiable.

The smallest remaining links are now:

1. **real external rendered HTTP/browser readback** of the deployed public acquisition surface;
2. **real GSC Search Analytics + GA4 read** for one explicit aligned observation period;
3. **consent-safe semantic conversion instrumentation** routed to productive owners and bound to authoritative success states;
4. only after those gates: evidence-driven content prioritization and separately authorized paid/advertising activation.

No provider mutation, campaign creation, indexing request, budget/spend, AdSense activation, deployment or merge is performed by this evidence package.
