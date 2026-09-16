# SEO Monetization & Marketing Automation — Evidence and Execution Blueprint

**Package:** `SEO-MONETIZATION-MARKETING-AUTOMATION-01`  
**Date:** 2026-09-16  
**Repository:** `capital-ai-online/Finance`  
**Execution baseline:** `main@47a245be78b60494c0f57518f742bbb7923b70fa`  
**Production correlation at final resync:** Render `Finance` deploy `dep-dalalerl550s73cq2q5g`, status `live`, commit `bea9373811202aef98f3ad8ffd53dba99d37c453`; production is `25` Git commits behind current main in full ancestry, representing the two subsequently merged mainline PRs `#1012` and `#1013`  
**Current Project:** `CAPITAL-AI-SEO`  
**Current Project Folder:** `docs/projects/seo/`  
**Canonical detailed SEO evidence path:** `docs/seo/`  
**Primary productive PVC:** `N/A — cross-cutting; no productive PVC ownership`  
**Primary Owner:** `CAPITAL-AI-SEO`

```yaml
execution_state:
  part_1: REPOSITORY_AND_LIVE_BASELINE_MATERIALIZED
  part_2: SEO_OWNED_BLUEPRINT_MATERIALIZED
  part_3: PROVIDER_AND_POST_IMPLEMENTATION_VERIFICATION_OPEN
  provider_evidence:
    gsc_property_and_url_inspection: READ_VERIFIED_FROM_CURRENT_PROJECT_ROADMAP
    gsc_search_analytics: NOT_RUN_IN_THIS_EXECUTION
    ga4_data_api: NOT_RUN_IN_THIS_EXECUTION
    ga4_realtime_debugview: NOT_RUN_IN_THIS_EXECUTION
    stripe_live_account: NOT_RUN_IN_THIS_EXECUTION
  mutations:
    provider_accounts: NONE
    paid_campaigns: NONE
    indexing_requests: NONE
    adsense_activation: NONE
    production_runtime: NONE
```

## 1. Execution boundary and final correlation

This package coordinates `Search -> Landing Page -> Engagement -> Conversion -> Revenue` without creating a second product, analytics, publishing, billing or provider authority. Detailed SEO evidence remains in canonical `docs/seo/**`; `docs/projects/seo/**` remains the thin, non-authorizing project navigation layer.

Evidence states:

- `PASS` — directly evidenced by current repository or authenticated current provider/runtime readback.
- `PARTIAL` — a bounded portion is evidenced while the end-to-end gate is incomplete.
- `NOT_PROVEN` — required provider/runtime evidence was unavailable or not run.
- `HELD` — intentionally blocked by ownership, consent, budget or protected-mutation boundaries.

`NOT_RUN` and `NOT_PROVEN` are never treated as `PASS`.

Final correlation facts:

- `main` advanced twice during execution: first to `1780264d567f307c31fab149433969a8c359bcd1` through merged FINTECH PR `#1012`, then to `47a245be78b60494c0f57518f742bbb7923b70fa` through merged Frontend PR `#1013`.
- `/AGENTS.md` remains blob `197ea507ee112e450cf24ebaae26cd2103077b84`; the authority contract did not change.
- The SEO branch was reset to the latest current main before this final rematerialization.
- PR `#1013` is no longer an active writer. Its merged Frontend delta was explicitly correlated because it changes the public landing experience and Learning Vocabulary presentation.
- Current main now contains a materially richer client-rendered public landing: Public BTC Enterprise Scorer, capability cards, account CTA and product-access explanation. This improves the repository-side acquisition surface but does not by itself prove deployed crawlability, indexing or conversion.
- Production remained live on `bea9373811202aef98f3ad8ffd53dba99d37c453` at final readback; no deployment was triggered by this package.

---

# Part 1 — DETECT_AND_PRIORITIZE

## 2. Technical SEO findings matrix

| ID | Finding | Evidence | State | Impact | Owner route |
|---|---|---|---|---|---|
| SEO-T01 | Five public URLs are consistently represented by sitemap, route SEO and prerender: `/`, `/learning-platform`, `/impressum`, `/agb`, `/datenschutz`. | `public/sitemap.xml`, `src/lib/routeSeo.ts`, `scripts/seo/prerender-public-routes.mjs` | PASS | High | SEO requirement; FE/OPS runtime |
| SEO-T02 | `robots.txt` allows the public set and disallows `/api/`, `/dashboard`, `/admin`. | `public/robots.txt` | PASS | High | SEO/OPS |
| SEO-T03 | Route title, description, canonical, OpenGraph and Twitter metadata are materialized. | `src/lib/routeSeo.ts`, prerender | PASS | High | SEO/FE |
| SEO-T04 | Current main has a richer client-rendered landing after PR `#1013`, including public BTC scorer, capability cards and account CTA. The deterministic prerendered/noscript body still derives from the short route description rather than the full landing content, and production is not yet on this main. | `src/features/public/ui/LandingPage.tsx`, `scripts/seo/prerender-public-routes.mjs`, Render readback | PARTIAL | High | SEO requirement -> FE/OPS verification |
| SEO-T05 | `Organization`, `WebSite` and `SoftwareApplication` JSON-LD exist. Current offer semantics do not establish paid-subscription revenue. | `index.html` | PARTIAL | Medium | SEO requirement; FE/COMP if commercial schema changes |
| SEO-T06 | GSC property read and URL Inspection are current-project verified. `/learning-platform` is `NEUTRAL / Discovered - currently not indexed`. | `docs/projects/seo/ROADMAP.md` | PARTIAL | High | SEO read plane; no indexing request |
| SEO-T07 | GSC Search Analytics clicks/impressions/CTR/queries/pages/country/device were not available in this host. | current execution | NOT_PROVEN | High | SEO read plane |
| SEO-T08 | Current p75 CWV/mobile field evidence was not obtained in this execution. | current execution | NOT_PROVEN | High | `CAPITAL-AI-FE` |

### Technical conclusion

The current acquisition constraint is no longer merely the absence of a meaningful client landing page; PR `#1013` materially improved that layer. The remaining growth bottleneck is **deployed/rendered discoverability of the richer content + missing Search Analytics + missing conversion/revenue measurement**.

Current Google guidance remains aligned with repository guardrails: helpful/reliable people-first content, unique non-commodity material, conventional SEO fundamentals for generative Search and no scaled low-value/ranking-manipulation shortcuts.

Advisory sources:

- `https://developers.google.com/search/docs/essentials`
- `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- `https://developers.google.com/search/docs/fundamentals/ai-optimization-guide`
- `https://developers.google.com/search/docs/essentials/spam-policies`
- `https://developers.google.com/search/docs/crawling-indexing/canonicalization`

## 3. GSC evidence matrix

| Evidence | State | Interpretation |
|---|---|---|
| Property `sc-domain:capital-ai.online` | READ_VERIFIED | Real current-project provider property exists. |
| Permission | READ_VERIFIED | Current project evidence records `siteRestrictedUser`. |
| URL Inspection for five sitemap URLs | READ_VERIFIED | Real provider responses exist. |
| `/learning-platform` | READ_VERIFIED | `NEUTRAL / Discovered - currently not indexed`; no causal diagnosis inferred. |
| Clicks / impressions / CTR / position | NOT_PROVEN here | No synthetic values. |
| Queries / pages / country / device | NOT_PROVEN here | Topic and CTR priority remains provisional. |
| GenAI Search visibility | NOT_PROVEN | No current provider snapshot in this host. |
| Indexing request | NOT_RUN | Explicitly not sent. |

## 4. GA4 measurement matrix

| Capability | Current evidence | State | Required next evidence |
|---|---|---|---|
| Measurement ID injection | `index.html` consumes `%VITE_GA_MEASUREMENT_ID%`; deployment config contains the build variable | PASS repository contract | GA4 property/stream provider read |
| Consent defaults | analytics and advertising storage/signals default to `denied`; security storage remains granted | PASS | runtime/network readback after any change |
| Analytics opt-in | GA loads only after valid CookieConsent v3 analytics acceptance | PASS repository contract | DebugView/Realtime + network evidence |
| Advertising | advertising signals remain denied after accept-all under current Owner-approved Variant A | PASS/HELD | preserve until separate protected change |
| Page view | `gtag('config', ..., send_page_view: true)` | PASS repository contract | GA4 provider readback |
| Business events | no application business `gtag('event', ...)` instrumentation found | OPEN | implement only real semantic events |
| Key events | no provider read in this execution | NOT_PROVEN | GA4 provider evidence |
| Revenue/value | no verified GA4 revenue lineage | NOT_PROVEN | authoritative transaction identity/value/currency |

Google currently recommends semantic GA4 events such as `login`, `sign_up`, `search`, `share`, `generate_lead` and `purchase` when those actions actually occur, with their prescribed parameters.

Advisory sources:

- `https://support.google.com/analytics/answer/9267735`
- `https://support.google.com/analytics/answer/13675006`
- `https://support.google.com/analytics/answer/12966437`

## 5. Monetization readiness matrix

| Surface | Evidence | State | Gate |
|---|---|---|---|
| Registration | public account CTA and email/password + Google OAuth login/register exist; no verified GA4 success event | PARTIAL | FE event instrumentation + provider verification |
| Public product utility | current main exposes a fixed-BTC public Enterprise Scorer and capability framing | PARTIAL | deploy + rendered/mobile evidence + measured CTA behavior |
| Subscription | Starter/Pro/Enterprise UI and Stripe Checkout/Portal server paths exist | PARTIAL | real provider and production checkout evidence not read here |
| Subscription analytics | no verified `purchase`/subscription GA4 lineage | OPEN | authoritative commerce state + consent-safe measurement |
| Advertising | AdSense identity exists but ad loading is explicitly paused; ad signals denied | HELD | Owner + COMP/SEC/provider authorization |
| Lead generation | no dedicated lead action was identified | NOT_PROVEN | do not emit `generate_lead` without a real lead action |
| Affiliate/sponsorship | no approved surfaces/contracts evidenced | NOT_PROVEN | commercial/legal approval |
| Content monetization | Learning Platform exists, but no current indexed outcome or commercial attribution | PARTIAL | search/content/CTA measurement |

### Evidence-based monetization readiness index

This is a capability/evidence rubric, not a revenue forecast. Ten equal gates use `1 = evidenced`, `0.5 = partial`, `0 = open/not-proven/held`:

1. public crawl/index foundation = 1
2. product-to-registration proposition in current main = 0.5
3. subscription/checkout repository contract = 1
4. live Stripe conversion evidence = 0
5. consent-gated GA4 base = 1
6. business conversion events = 0
7. revenue attribution = 0
8. advertising activation = 0
9. high-intent public product surface = 0.5
10. GSC property + URL Inspection = 1

**Monetization readiness: 5.0 / 10 = 50%.**

The increase versus the pre-`#1013` correlation reflects only repository-side public product/CTA materialization. It does not imply deployed conversion lift or revenue.

## 6. Search-intent candidate map

No keyword volume, rank or conversion value is fabricated. These are product-derived candidate intents until real GSC/search data confirms demand.

| Candidate intent | Existing basis | Gap | Candidate surface |
|---|---|---|---|
| AI financial analysis | richer current-main public landing + scorer | methodology/data/limits still not deeply prerendered | first-party methodology/value depth |
| Explainable asset scoring | scoring/product capabilities | public proof/provenance depth missing | score methodology + reproducible examples |
| Stock valuation / Buffett-style analysis | Graham/DCF product references | dedicated public intent surface not evidenced | factual educational/tool explanation after domain/COMP review |
| Portfolio backtesting | capability framing/authenticated capability | no dedicated crawlable use-case page | methodology + example + CTA |
| Portfolio stress testing | capability framing/authenticated capability | no dedicated public content | evidence-first use-case page |
| Crypto scoring/research | merged FINTECH category/lineage work + public BTC scorer | stable public methodology/provenance content incomplete | derive only from current FINTECH/FE truth |
| Finance/AI vocabulary | `/learning-platform` + richer current-main vocabulary UI | current GSC evidence says discovered/not indexed | deepen only where genuine user value exists and verify deployed rendering |

Observed 2026 category/SERP patterns commonly emphasize a concrete job-to-be-done, low-friction trial/demo, methodology/data coverage, limitations, pricing/commercial path and educational content linked to the tool. This is qualitative content-architecture input, not a ranking-causality claim.

## 7. Landing/content opportunity map

| Priority | Opportunity | Conversion objective | Owner route |
|---|---|---|---|
| P0 | make the richer current-main product/methodology value proposition reliably available in deployed rendered/prerendered HTML and verify one measurable account CTA | `sign_up` | SEO requirement -> FE/OPS -> COMP verification |
| P0 | public pricing/subscription explanation sourced only from canonical billing truth | checkout start / later authoritative `purchase` | SEO -> Billing/FE/COMP/GOV |
| P1 | explainable scoring methodology/use case with source/provenance examples | account creation / analysis start | SEO + FINTECH/DATA + COMP + FE |
| P1 | backtesting/stress-testing methodology/use case | account creation / tool entry | SEO + FINTECH/DATA + COMP + FE |
| P1 | Learning Platform depth/internal linking tied to real search demand | qualified engagement | SEO + FE/GOV |
| P1 | first-party screenshots/diagrams/video/transcripts | understanding/distribution | FE/SOCIAL + SEO |

No mass keyword-variant pages, unsupported performance claims, fabricated testimonials, fake engagement or search-engine-only content are allowed.

## 8. Growth funnel

```text
DISCOVERY
  Google organic / GenAI Search / Social / YouTube
      ↓
LANDING
  Public product / BTC scorer / high-intent use-case surface
      ↓
ENGAGEMENT
  Methodology / evidence / examples / learning content
      ↓
ACTIVATION
  Successful account registration (`sign_up`)
      ↓
CONVERSION
  Authoritative paid subscription success (`purchase` only when real)
      ↓
RETENTION
  Repeat useful product workflow / subscription continuation
```

Current breaks:

- `DISCOVERY -> LANDING`: repository-side landing is stronger after `#1013`, but the final deployed/rendered/indexed state is not yet evidenced.
- `LANDING -> ACTIVATION`: registration path exists; verified `sign_up` measurement does not.
- `ACTIVATION -> CONVERSION`: Stripe paths exist; GA4 purchase/revenue lineage is unverified.
- `CONVERSION -> RETENTION`: no real cohort/revenue evidence was read.

## 9. Priority quick wins

| Priority | Work package | Economic mechanism | Route | State |
|---|---|---|---|---|
| P0 | Real GSC Search Analytics + GA4 read for one explicit period | replaces query/topic guesses with observed acquisition + behavior | SEO read plane | READY WHEN PROVIDER READ IS AVAILABLE |
| P0 | Consent-safe semantic `sign_up`/`login` and later authoritative `purchase` measurement | makes acquisition -> activation -> revenue measurable | SEO contract -> FE/Billing/OPS -> COMP verification | BLUEPRINT READY; FOREIGN OWNER |
| P0 | Verify current-main landing after normal deployment and close rendered/prerendered content gap where measurable | turns the new public product surface into reliable search/CTA evidence | SEO requirement -> FE/OPS | WAITING FOR NORMAL DEPLOYMENT EVIDENCE |
| P1 | Public pricing/subscription acquisition surface from canonical catalog | shorter commercial-intent path | SEO -> Billing/FE/COMP/GOV | OPEN |
| P1 | First-party scoring/backtesting/stress-testing content | non-commodity organic inventory tied to real utility | SEO -> FINTECH/DATA/COMP/GOV | OPEN |

---

# Part 2 — IMPLEMENT_AND_ACTIVATE

## 10. SEO-owned implementation completed here

This document is the bounded SEO-owned repository implementation. Productive code is not modified because:

1. `CAPITAL-AI-SEO` has no productive PVC.
2. Part 1 cannot reach its full provider-evidence exit gate without real GSC Search Analytics and GA4 reads.
3. GA4 business-event code touches a protected consent/measurement boundary and belongs to the productive owners.
4. GA4/Ads/AdSense provider mutations and paid spend require separate authorization.
5. Current main has just absorbed a substantial FE landing change; any follow-up productive change must use that merged state rather than the retired pre-`#1013` baseline.

## 11. GA4 growth-event blueprint

Only events with real success semantics may be implemented.

| Event | Trigger | Required semantics | Prohibition |
|---|---|---|---|
| `sign_up` | accepted auth registration succeeds | `method` | never on click, validation or failure |
| `login` | authenticated session establishment succeeds | `method` | never on form submit before success |
| `search` | a real application search executes | `search_term`; optional stable `search_location` | do not relabel generic filters/navigation |
| `share` | actual share action completes | prescribed content parameters where applicable | do not infer from opening share UI |
| `generate_lead` | real contact/lead request succeeds | prescribed lead parameters | do not implement before a true lead surface exists |
| `purchase` | authoritative paid transaction/subscription succeeds | `transaction_id`, `currency`, `value`, item/plan identity | never on redirect/pending/click; never invent value |

Measurement invariants:

- business events never bypass analytics consent;
- advertising signals remain denied under current Variant A;
- no PII, email, name, raw user identifier, secret or financial-account identifier enters analytics parameters;
- `purchase.value` and `currency` originate from authoritative commerce state;
- duplicate prevention binds to authoritative event identity, especially for webhook/checkout retries;
- GA4 key-event configuration remains a separate provider mutation.

## 12. UTM taxonomy blueprint

```text
utm_source   = canonical platform/publisher identity
utm_medium   = organic | cpc | paid_social | social | video | referral | email
utm_campaign = <objective>_<surface>_<yyyyq#>
utm_content  = <creative-or-cta-variant>
utm_term     = paid-search keyword only when applicable
```

Rules: lowercase stable identifiers, no PII, paid and organic attribution stay distinct, every campaign maps to a canonical landing identity, and UTM presence never substitutes for provider attribution evidence.

## 13. Campaign blueprint — not activated

| Stage | Channel | Objective | Measurement |
|---|---|---|---|
| Awareness | Organic Search / GenAI Search | differentiated methodology/value discovery | real impressions/clicks + engaged sessions |
| Awareness | Social / YouTube | demonstrate workflow/explainability | qualified landing sessions |
| Consideration | Google Search Ads | capture high-intent tool/research queries | activation/key event |
| Activation | Organic/Paid | successful registration | `sign_up` |
| Conversion | Search/remarketing only after lawful readiness | paid subscription | authoritative purchase/subscription value |
| Retention | Owned channels | return to useful workflows | real retention evidence |

Paid-channel gates:

- Search Ads, Demand Gen and Performance Max remain blueprint-only.
- Performance Max is held until trustworthy conversion-value evidence exists.
- Remarketing is held while advertising consent/provider/compliance requirements are held.
- No account, campaign, bid, budget, audience or spend mutation is performed.

## 14. Audience, creative and negative-keyword blueprint

Candidate audiences, not provider-created:

- users researching explainable AI/quantitative financial analysis;
- self-directed investors researching portfolio analysis/backtesting;
- users comparing asset-scoring tools;
- finance/AI learners engaging with the Learning Platform;
- registered users only for lawful retention use cases.

| Creative | Claim boundary | CTA | Evidence source |
|---|---|---|---|
| Public BTC scorer | only current FINTECH/FE contract truth and supported BTC public state | analyse BTC / create account | current main FE + FINTECH contracts |
| Product explainability | only current feature-contract truth | analyse/understand or create account | FINTECH/DATA/FE contracts |
| Backtesting explainer | educational historical analysis; no future-performance promise | discover backtesting | real capability + limits |
| Stress-test explainer | scenario analysis with explicit limits | understand stress analysis | supported scenarios/methodology |
| Learning/Vocabulary | canonical approved terminology | open Vocabulary | Learning Platform truth |
| Pricing/subscription | only canonical current catalog and checkout availability | view plans | billing/Stripe truth |

Candidate negative-keyword classes for any future paid search: guaranteed/risk-free profit language, get-rich-quick language, certain-future-price claims, unrelated job/download queries, and broker/exchange execution intent where the product does not satisfy that intent. Exact negatives must come from real search-term evidence after launch.

## 15. Experiment backlog

1. methodology-first vs capability-first hero; primary metric `sign_up`, not raw clicks.
2. public BTC-scorer engagement -> account CTA; measure downstream activation quality rather than scorer interaction alone.
3. dedicated use-case page vs generalized homepage for scoring/backtesting intent.
4. Learning Platform contextual internal links to methodology content.
5. title/meta experiment only after sufficient real impressions, interpreted with query/position context.

No experiment is successful without a declared metric, window and real observations.

---

# Part 3 — VERIFY_OPTIMIZE_AND_SCALE

## 16. Verification state

| Verification | State | Exit evidence |
|---|---|---|
| current-main identity | PASS | `47a245be78b60494c0f57518f742bbb7923b70fa` |
| production/main identity | PARTIAL | production is `25` Git commits behind current main in full ancestry; no package-triggered deploy |
| richer public landing in repository | PASS | merged `#1013` current-main source contains public BTC scorer, capability cards and account CTA |
| deployed richer public landing | NOT_PROVEN | production still reports pre-`#1012/#1013` commit at final readback |
| prerendered high-intent body | PARTIAL | deterministic prerender exists but still uses short route-level body rather than full client landing copy |
| Learning Platform indexing | PARTIAL | GSC current-project evidence is discovered/not indexed; post-`#1013` deploy not yet re-inspected |
| canonical/robots/sitemap contract | PASS repository baseline | current deterministic files/regressions |
| structured data | PASS repository baseline | external Rich Results validation not rerun |
| mobile/CWV | NOT_RUN | current p75 field/lab evidence |
| GA4 consent code contract | PASS repository baseline | runtime/provider evidence required after event changes |
| GA4 business events | NOT_IMPLEMENTED | exact event/parameter DebugView evidence |
| GA4 key events | NOT_PROVEN | provider evidence |
| GSC Search Analytics delta | NOT_RUN | explicit before/after windows |
| organic conversion rate | NOT_CALCULABLE | joined GSC/GA4 evidence |
| revenue/session, revenue/visitor | NOT_CALCULABLE | authoritative revenue + session/user evidence |
| CAC/ROAS | NOT_CALCULABLE | real spend + attributed conversion value |

## 17. Evidence-based marketing readiness index

Ten equal gates use `1 / 0.5 / 0` and measure readiness, not expected results:

1. technical crawl/canonical baseline = 1
2. GSC property + URL Inspection = 1
3. GSC Search Analytics baseline = 0
4. consent-gated GA4 base/pageview = 1
5. business conversion events = 0
6. provider-verified key events = 0
7. UTM/campaign attribution = 0.5 (blueprint only)
8. high-intent landing portfolio = 0.5 (stronger current-main surface, deployment/intent portfolio incomplete)
9. creative inventory = 0.5 (briefs, not final publishable assets)
10. paid campaign conversion feedback loop = 0

**Marketing readiness: 4.5 / 10 = 45%.**

## 18. Commercial KPI state

The following remain `NOT_CALCULABLE` because real provider evidence is missing: organic conversion rate, lead conversion rate, revenue per session, revenue per visitor, lead value, RPM, CAC, ROAS, conversion value by source and conversion value by landing page.

## 19. Scale/revert contract

Scale only when technical regressions are absent, GA4/GSC identities are verified, success metric/window are explicit, observations are real, consent/privacy remains intact and improvement is economically relevant. Provider timing or indexing delay alone is not classified as a code regression.

## 20. Blockers and owner routing

| Blocker | State | Required route |
|---|---|---|
| GSC Search Analytics rows unavailable here | OPEN | `CAPITAL-AI-SEO` approved read plane |
| GA4 Data API/Realtime/DebugView unavailable here | OPEN | approved GA4 read plane |
| business conversion events absent | OPEN | SEO requirement -> FE auth/browser + Billing/OPS authoritative commerce -> COMP verification |
| production `25` Git commits behind current main at final capture | OPEN OBSERVATION | normal OPS/deploy path; do not trigger from this docs-only package |
| current-main richer landing not yet production-verified | OPEN OBSERVATION | deployed HTTP/render/mobile readback after normal deployment |
| AdSense paused | HELD | explicit protected Owner decision + COMP/SEC/provider validation |
| paid campaigns/spend | HELD | explicit Owner budget/provider authorization after trustworthy conversion measurement |
| `/learning-platform` not indexed in current evidence | OPEN OBSERVATION | post-deploy GSC Search Analytics + fresh rendered correlation; no forced indexing |

## 21. Roadmap impact

No parallel roadmap is created. This artifact advances existing work packages:

- `WP-SEO-METRICS`: still open; GSC Search Analytics + GA4 baseline missing.
- `WP-SEO-AI-VIS`: still provider-evidence gated.
- `WP-SEO-TOPICS`: candidate intent map materialized; final priority remains data-gated.
- `WP-SEO-CONTENT`: non-commodity methodology/use-case directions materialized against the now-richer public product surface.
- `WP-SEO-TECH-GATE` / `WP-SEO-SCHEMA`: current-main baseline preserved.
- `WP-SEO-CWV`, `WP-SEO-IA`, `WP-SEO-MEDIA`: remain foreign-owner routed.
- `WP-SEO-SPAM`: no-scaled-content/no-manipulation guards preserved.

## 22. Result

`Search -> Landing Page -> Engagement -> Conversion -> Revenue` is not yet end-to-end provider-verifiable. Current main now provides a stronger public `Landing Page -> Engagement` substrate, but the smallest missing links remain:

1. normal deployment + rendered/prerendered verification of the merged `#1013` acquisition surface;
2. real GSC Search Analytics + GA4 provider baseline;
3. consent-safe semantic conversion instrumentation tied to authoritative success states;
4. richer first-party methodology/content depth tied to real product capabilities;
5. only after those are evidenced: separately authorized paid acquisition and/or advertising activation.

Revenue, ROAS, CAC and indexing outcomes remain evidence-gated rather than inferred.
