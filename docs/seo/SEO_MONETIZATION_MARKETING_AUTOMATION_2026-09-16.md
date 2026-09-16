# SEO Monetization & Marketing Automation — Evidence and Execution Blueprint

**Package:** `SEO-MONETIZATION-MARKETING-AUTOMATION-01`  
**Date:** 2026-09-16  
**Repository:** `capital-ai-online/Finance`  
**Execution baseline:** `main@47a245be78b60494c0f57518f742bbb7923b70fa`  
**Production correlation:** Render `Finance` deploy `dep-dalb7ooae00c7386ert0`, status `live`, commit `1780264d567f307c31fab149433969a8c359bcd1`; production is `21` Git commits behind current main in full ancestry because merged Frontend PR `#1013` is not yet the live deployment  
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

## 1. Final correlation and evidence semantics

This package coordinates `Search -> Landing Page -> Engagement -> Conversion -> Revenue` without creating a second product, analytics, publishing, billing or provider authority. Detailed SEO evidence remains under canonical `docs/seo/**`; `docs/projects/seo/**` remains the thin, non-authorizing project navigation layer.

Evidence semantics: `PASS` means directly evidenced; `PARTIAL` means only a bounded part is evidenced; `NOT_PROVEN` means the required provider/runtime evidence was unavailable; `HELD` means an ownership, consent, budget or protected-mutation boundary intentionally blocks execution. `NOT_RUN` and `NOT_PROVEN` are never treated as `PASS`.

Final correlation facts:

- `main` advanced during execution through merged FINTECH PR `#1012` and then merged Frontend PR `#1013`; final current main is `47a245be78b60494c0f57518f742bbb7923b70fa`.
- `/AGENTS.md` remains blob `197ea507ee112e450cf24ebaae26cd2103077b84`; the authority contract did not change.
- The SEO branch was rematerialized from final current main after both races.
- PR `#1013` materially changes the public landing and Learning Vocabulary presentation; that delta is included in this final SEO assessment instead of using the retired pre-`#1013` state.
- Open foreign PRs at final correlation are `#1014` (Social documentation/evidence) and `#1015` (DATA signed-history semantics); neither changes this SEO document or claims SEO authority.
- Production is live on `1780264d567f307c31fab149433969a8c359bcd1`; the richer `#1013` landing is therefore current-main truth but not yet production-verified. No deployment was triggered here.

---

# Part 1 — DETECT_AND_PRIORITIZE

## 2. Technical SEO findings matrix

| ID | Finding | Evidence | State | Economic impact | Owner route |
|---|---|---|---|---|---|
| SEO-T01 | Five public URLs are consistently represented by sitemap, route SEO and prerender: `/`, `/learning-platform`, `/impressum`, `/agb`, `/datenschutz`. | `public/sitemap.xml`, `src/lib/routeSeo.ts`, `scripts/seo/prerender-public-routes.mjs` | PASS | High | SEO requirement; FE/OPS runtime |
| SEO-T02 | `robots.txt` allows the public set and disallows `/api/`, `/dashboard`, `/admin`. | `public/robots.txt` | PASS | High | SEO/OPS |
| SEO-T03 | Route title, description, canonical, OpenGraph and Twitter metadata are materialized. | `src/lib/routeSeo.ts`, prerender | PASS | High | SEO/FE |
| SEO-T04 | Current main has a richer client landing after `#1013`: public fixed-BTC Enterprise Scorer, capability cards, Vocabulary link and account CTA. The deterministic prerendered/noscript body still derives from the short route description, and the `#1013` landing is not yet live. | `src/features/public/ui/LandingPage.tsx`, prerender script, Render readback | PARTIAL | High | SEO -> FE/OPS verification |
| SEO-T05 | `Organization`, `WebSite` and `SoftwareApplication` JSON-LD exist; current schema does not establish the paid subscription catalog as a public commercial surface. | `index.html` | PARTIAL | Medium | SEO -> FE/COMP when warranted |
| SEO-T06 | GSC property and URL Inspection are current-project verified; `/learning-platform` is `NEUTRAL / Discovered - currently not indexed`. | `docs/projects/seo/ROADMAP.md` | PARTIAL | High | SEO read plane; no indexing request |
| SEO-T07 | GSC Search Analytics rows for clicks, impressions, CTR, queries, pages, country and device were not available in this execution host. | current execution | NOT_PROVEN | High | SEO provider read plane |
| SEO-T08 | Current p75 Core Web Vitals/mobile field evidence was not obtained here. | current execution | NOT_PROVEN | High | FE |

### Detection conclusion

The repository now contains a substantially stronger public acquisition experience, but the growth bottleneck has shifted to **normal deployment + rendered/prerendered verification of that richer surface, real Search Analytics, and real conversion/revenue measurement**. Technical discovery alone is not a monetization signal.

Current Google guidance remains compatible with these guards: people-first, useful and source-traceable content; conventional Search fundamentals also for generative Search; no scaled low-value content or ranking manipulation.

Advisory sources:

- `https://developers.google.com/search/docs/essentials`
- `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- `https://developers.google.com/search/docs/fundamentals/ai-optimization-guide`
- `https://developers.google.com/search/docs/essentials/spam-policies`
- `https://developers.google.com/search/docs/crawling-indexing/canonicalization`

## 3. GSC evidence matrix

| Evidence | State | Interpretation |
|---|---|---|
| `sc-domain:capital-ai.online` | READ_VERIFIED | Real current-project property. |
| Permission | READ_VERIFIED | Current project evidence records `siteRestrictedUser`. |
| URL Inspection for five sitemap URLs | READ_VERIFIED | Real provider responses exist. |
| `/learning-platform` | READ_VERIFIED | `NEUTRAL / Discovered - currently not indexed`; no unsupported causal diagnosis. |
| Clicks / impressions / CTR / average position | NOT_PROVEN | No synthetic values. |
| Queries / pages / country / device | NOT_PROVEN | Intent/CTR prioritization remains provisional. |
| GenAI Search visibility | NOT_PROVEN | No current provider snapshot available here. |
| Indexing request | NOT_RUN | No request sent. |

## 4. GA4 measurement matrix

| Capability | Repository evidence | State | Required exit evidence |
|---|---|---|---|
| Measurement-ID injection | `%VITE_GA_MEASUREMENT_ID%` contract exists | PASS repository contract | provider property/stream identity |
| Consent defaults | analytics/ad storage and ad signals default `denied`; security storage granted | PASS repository contract | browser/network readback after changes |
| Analytics opt-in | GA loads only after valid CookieConsent analytics acceptance | PASS repository contract | DebugView/Realtime + network evidence |
| Advertising | advertising signals remain denied under current Owner-approved Variant A | PASS/HELD | separate protected authorization |
| Page view | `gtag('config', ..., send_page_view: true)` | PASS repository contract | provider readback |
| Business events | no application `gtag('event', ...)` business instrumentation found | OPEN | real semantic event implementation |
| Key events | no provider read here | NOT_PROVEN | GA4 Admin/Data API evidence |
| Revenue/value | no verified GA4 purchase/revenue lineage | NOT_PROVEN | authoritative transaction/value/currency evidence |

Google currently recommends semantic events such as `login`, `sign_up`, `search`, `share`, `generate_lead` and `purchase` when those actions actually occur, using their prescribed semantics and parameters.

Advisory sources:

- `https://support.google.com/analytics/answer/9267735`
- `https://support.google.com/analytics/answer/13675006`
- `https://support.google.com/analytics/answer/12966437`

## 5. Monetization readiness matrix

| Surface | Current evidence | State | Next gate |
|---|---|---|---|
| Registration | account CTA plus email/password and Google OAuth login/register exist | PARTIAL | successful `sign_up` measurement |
| Public product utility | current main exposes a fixed-BTC public Enterprise Scorer and capability framing | PARTIAL | normal deploy + rendered/mobile + CTA evidence |
| Subscription | Starter/Pro/Enterprise UI and Stripe Checkout/Portal server paths exist | PARTIAL | real provider and production checkout evidence |
| Subscription analytics | no verified `purchase`/subscription GA4 lineage | OPEN | authoritative commerce event lineage |
| Advertising | AdSense identity exists; ad loading remains paused and ad signals denied | HELD | Owner + COMP/SEC/provider authorization |
| Lead generation | no dedicated lead action identified | NOT_PROVEN | no `generate_lead` until a real lead action exists |
| Affiliate / sponsorship | no approved surface/contract evidenced | NOT_PROVEN | commercial/legal approval |
| Learning/content monetization | Learning Platform exists but no current indexed outcome or commercial attribution | PARTIAL | search/content/CTA evidence |

### Monetization readiness

Capability/evidence rubric, not a revenue forecast: public crawl foundation `1`; product-to-registration `0.5`; subscription contract `1`; live Stripe conversion `0`; consent-gated GA4 `1`; business events `0`; revenue attribution `0`; ads activation `0`; high-intent public product surface `0.5`; GSC property/inspection `1`.

**Monetization readiness = 5.0 / 10 = 50%.** The increase reflects current-main public product/CTA materialization only; it does not imply deployed conversion lift or revenue.

## 6. Search-intent and landing opportunity map

No keyword volume, rank or conversion value is fabricated.

| Priority | Candidate intent / opportunity | Current basis | Required next evidence / surface |
|---|---|---|---|
| P0 | AI financial analysis / public BTC scorer | current-main landing + scorer | deploy/readback, methodology depth, measurable `sign_up` CTA |
| P0 | Explainable asset scoring | current product/scoring contracts | provenance/methodology examples tied to real feature truth |
| P0 | Public pricing/subscription | billing/checkout repository contracts | canonical catalog truth + COMP/GOV + conversion measurement |
| P1 | Portfolio backtesting | capability framing/authenticated feature | dedicated factual methodology/use-case surface |
| P1 | Stress/scenario analysis | capability framing/authenticated feature | dedicated factual methodology/use-case surface |
| P1 | Crypto scoring/research | FINTECH category/lineage + public BTC scorer | stable public methodology/provenance content |
| P1 | Finance/AI Vocabulary | `/learning-platform` + richer current-main vocabulary UI | post-deploy rendering + real GSC demand/index evidence |

No mass keyword-variant pages, keyword stuffing, fabricated testimonials, fake engagement or unsupported performance claims are permitted.

## 7. Growth funnel and breakpoints

```text
DISCOVERY
  Organic Search / GenAI Search / Social / YouTube
      ↓
LANDING
  Public product / BTC scorer / use-case surface
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
  Repeat useful workflow / subscription continuation
```

Current breakpoints:

- `DISCOVERY -> LANDING`: current-main UI is stronger, but `#1013` is not yet live and GSC performance rows are missing.
- `LANDING -> ACTIVATION`: registration exists, verified `sign_up` measurement does not.
- `ACTIVATION -> CONVERSION`: Stripe paths exist, GA4 purchase/revenue lineage does not.
- `CONVERSION -> RETENTION`: no real cohort/revenue evidence was read.

## 8. Priority-ranked Quick Wins

| Priority | Work package | Economic mechanism | Route / state |
|---|---|---|---|
| P0 | Read real GSC Search Analytics + GA4 baseline for one explicit period | replaces topic/campaign guesses with observed acquisition and behavior | SEO read plane — provider evidence required |
| P0 | Verify `#1013` landing after normal production deployment, including rendered/prerendered HTML and mobile | proves that the new public value/CTA surface is actually consumable | SEO -> FE/OPS verification |
| P0 | Define consent-safe `sign_up`, `login`, and later authoritative `purchase` measurement | makes acquisition -> activation -> revenue measurable | SEO contract -> FE/Billing/OPS -> COMP |
| P1 | Publish first-party scoring/backtesting/stress methodology content only from current feature/data truth | creates non-commodity organic inventory | SEO -> FINTECH/DATA/COMP/GOV/FE |
| P1 | Create a public pricing/subscription acquisition surface from canonical billing truth | shortens commercial-intent path | SEO -> Billing/FE/COMP/GOV |

---

# Part 2 — IMPLEMENT_AND_ACTIVATE

## 9. SEO-owned implementation boundary

The executable SEO-owned repository change in this package is this evidence/blueprint artifact. Productive changes remain outside SEO ownership because the project owns no productive PVC, Part 1 still lacks provider performance evidence, conversion-event code touches consent/measurement boundaries, and Ads/AdSense/provider/budget mutations require separate authorization.

## 10. Canonical GA4 growth-event blueprint

| Event | Real trigger | Required semantics | Prohibition |
|---|---|---|---|
| `sign_up` | accepted registration succeeds | `method` | never on click/validation/failure |
| `login` | authenticated session succeeds | `method` | never on form submit before success |
| `search` | real application search executes | `search_term`; optional stable location | do not relabel generic navigation/filtering |
| `share` | actual share completes | prescribed content parameters | do not infer from opening share UI |
| `generate_lead` | real lead/contact submission succeeds | prescribed lead parameters | do not implement before a true lead surface exists |
| `purchase` | authoritative paid transaction/subscription succeeds | `transaction_id`, `currency`, `value`, plan/item identity | never on redirect/pending/click; never invent value |

Invariants: no event bypasses analytics consent; ad signals remain denied under current Variant A; no PII/secrets/financial-account identifiers enter analytics; purchase values come from authoritative commerce state; duplicate prevention binds to authoritative event identity; provider-side key-event configuration is a separate mutation.

## 11. UTM and campaign blueprint

```text
utm_source   = canonical platform/publisher
utm_medium   = organic | cpc | paid_social | social | video | referral | email
utm_campaign = <objective>_<surface>_<yyyyq#>
utm_content  = <creative-or-cta-variant>
utm_term     = paid-search keyword only when applicable
```

Lowercase stable identifiers; no PII; paid and organic attribution remain distinct; every campaign maps to a canonical landing identity; UTM presence never substitutes for GA4 evidence.

| Funnel stage | Candidate channels | Objective | Primary measurement |
|---|---|---|---|
| Awareness | Organic / GenAI Search / Social / YouTube | differentiated methodology/product discovery | real qualified sessions |
| Consideration | future Google Search Ads | high-intent research/tool demand | activation/key event |
| Activation | Organic/Paid | successful account creation | `sign_up` |
| Conversion | Search/remarketing only when lawful and measured | paid subscription | authoritative purchase value |
| Retention | owned channels | repeat useful workflows | real retention evidence |

Search Ads, Demand Gen and Performance Max remain blueprint-only. Performance Max is held until trustworthy conversion-value evidence exists; remarketing remains held while advertising-consent/provider/compliance gates are closed; no campaign/bid/budget/audience/spend mutation was performed.

## 12. Creative and audience blueprint

Candidate audiences: users researching explainable AI/quantitative financial analysis; self-directed investors researching portfolio analysis/backtesting; users comparing asset-scoring tools; finance/AI learners; and registered users only for lawful retention use cases.

| Creative | Claim boundary | CTA | Evidence source |
|---|---|---|---|
| Public BTC scorer | current FINTECH/FE contract truth only | analyse BTC / create account | current main FE + FINTECH contracts |
| Product explainability | current feature-contract truth only | understand / create account | FINTECH/DATA/FE |
| Backtesting explainer | historical analysis; no future-performance promise | discover backtesting | real capability + limits |
| Stress-test explainer | explicit scenario/model limits | understand stress analysis | supported methodology |
| Learning/Vocabulary | approved terminology | open Vocabulary | Learning Platform truth |
| Pricing | canonical catalog/checkout availability only | view plans | billing/Stripe truth |

Candidate negative-keyword classes for future paid search include guaranteed/risk-free-profit language, get-rich-quick intent, certain-future-price claims, unrelated job/download queries, and execution/broker intent where the product does not match. Exact negatives must come from real search-term evidence after launch.

## 13. Experiment backlog

1. Methodology-first vs capability-first hero; primary metric `sign_up`, not raw clicks.
2. Public BTC-scorer engagement -> account CTA; measure downstream activation quality.
3. Dedicated scoring/backtesting use-case page vs generalized homepage.
4. Learning Platform contextual links to methodology content.
5. Title/meta experiments only after sufficient real impressions and with query/position context.

No experiment is successful without a predeclared metric/window and real observations.

---

# Part 3 — VERIFY_OPTIMIZE_AND_SCALE

## 14. Verification matrix

| Verification | State | Exit evidence |
|---|---|---|
| Current main identity | PASS | `47a245be78b60494c0f57518f742bbb7923b70fa` |
| Production identity | PASS | Render live `1780264d567f307c31fab149433969a8c359bcd1` |
| Production -> main drift | PARTIAL | `21` Git commits; `#1013` not yet live |
| Richer public landing in repository | PASS | merged `#1013` source contains BTC scorer/capabilities/account CTA |
| Richer landing deployed | NOT_PROVEN | production is still pre-`#1013` |
| Prerendered high-intent body | PARTIAL | prerender exists but remains route-description-centric |
| Learning Platform indexing | PARTIAL | current GSC evidence is discovered/not indexed; post-`#1013` state not re-inspected |
| Canonical/robots/sitemap | PASS repository baseline | deterministic current files/contracts |
| Structured data | PASS repository baseline | external Rich Results revalidation NOT RUN |
| Mobile/CWV | NOT_RUN | current p75 field/lab evidence required |
| GA4 consent contract | PASS repository baseline | provider runtime verification required after event changes |
| GA4 business events | NOT_IMPLEMENTED | DebugView/event-parameter evidence |
| GA4 key events | NOT_PROVEN | provider evidence |
| GSC performance delta | NOT_RUN | explicit before/after windows |
| Organic conversion / revenue / CAC / ROAS | NOT_CALCULABLE | real aligned acquisition, conversion, revenue and spend evidence |

## 15. Marketing readiness

Ten equal readiness gates: technical crawl/canonical `1`; GSC property/inspection `1`; GSC performance baseline `0`; consent-gated GA4 `1`; business events `0`; provider key events `0`; UTM/campaign blueprint `0.5`; high-intent landing portfolio `0.5`; creative inventory `0.5`; paid conversion feedback loop `0`.

**Marketing readiness = 4.5 / 10 = 45%.** This is a capability/evidence score, not a traffic or revenue forecast.

## 16. Commercial KPI state and scale contract

Organic conversion rate, lead conversion rate, revenue/session, revenue/visitor, lead value, RPM, CAC, ROAS and conversion value by source/landing page remain `NOT_CALCULABLE` in this execution because real aligned provider evidence is missing.

Scale only evidence-positive changes: technical regressions absent, GA4/GSC identities verified, metric/window explicit, observations real, consent/privacy intact, and improvement economically relevant. Revert or remediate measured regressions. Provider timing/index delay alone is not a code regression.

## 17. Blockers and owner routing

| Blocker | State | Required route |
|---|---|---|
| GSC Search Analytics unavailable here | OPEN | SEO approved provider read plane |
| GA4 Data API/Realtime/DebugView unavailable here | OPEN | approved GA4 read plane |
| business conversion events absent | OPEN | SEO requirement -> FE + Billing/OPS -> COMP verification |
| production is `21` commits behind current main | OPEN OBSERVATION | normal OPS/deploy path; no deploy from this docs-only package |
| `#1013` landing not yet production-verified | OPEN OBSERVATION | deployed HTTP/render/mobile readback after normal deployment |
| AdSense paused | HELD | explicit Owner + COMP/SEC/provider authorization |
| paid campaigns/spend | HELD | explicit Owner budget/provider authorization after trustworthy conversion measurement |
| `/learning-platform` index state | OPEN OBSERVATION | post-deploy Search Analytics + rendered correlation; no forced indexing |

## 18. Roadmap impact

No parallel roadmap is created. `WP-SEO-METRICS` remains open for real GSC/GA4 reads; `WP-SEO-AI-VIS` remains provider-evidence gated; `WP-SEO-TOPICS` now has candidate intents but not final data-backed priority; `WP-SEO-CONTENT` gains concrete first-party methodology/use-case directions; existing `WP-SEO-TECH-GATE`/`WP-SEO-SCHEMA` baseline is preserved; `WP-SEO-CWV`/`WP-SEO-IA`/`WP-SEO-MEDIA` remain foreign-owner routed; `WP-SEO-SPAM` guards remain intact.

## 19. Result

`Search -> Landing Page -> Engagement -> Conversion -> Revenue` is **not yet end-to-end provider-verifiable**. Current main materially strengthens `Landing Page -> Engagement`, but the smallest missing links are:

1. normal deployment plus rendered/prerendered/mobile verification of merged `#1013`;
2. real GSC Search Analytics + GA4 baseline;
3. consent-safe semantic conversion events tied to authoritative success states;
4. first-party methodology/content depth tied to real product capabilities;
5. only after those are evidenced: separately authorized paid acquisition and/or advertising activation.

Revenue, ROAS, CAC and indexing outcomes remain evidence-gated rather than inferred.
