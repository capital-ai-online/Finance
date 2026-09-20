# WP-SEO-LAUNCH-01 — Public Web & Social Launch Management

**Status:** ACTIVE — OWNER-DIRECTED WORK PACKAGE  
**Date:** 2026-09-20  
**Execution baseline:** `main@c9980602f691b855fd6f8c66a49822e7a9611b4a`  
**Project:** `CAPITAL-AI-SEO`  
**Canonical project folder:** `docs/projects/seo/`  
**Primary productive PVC:** N/A — cross-cutting; no productive PVC ownership  
**Primary Owner:** `CAPITAL-AI-SEO`  
**Launch role:** coordination, search/discoverability, content architecture, measurement plan and evidence convergence  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Detailed program source:** `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md`

## 1. Objective

Make CAPITAL-AI publicly launch-ready across the website, web search and supported Social channels without creating a second Marketing, Publishing, Analytics, SEO, Social or Product authority.

The package converges the already-existing capabilities into one evidence-based launch chain:

```text
CURRENT_MAIN
  -> public product truth
  -> landing/content/message readiness
  -> technical SEO/indexability
  -> consent-safe measurement
  -> social content packages
  -> publication readiness
  -> production readback
  -> launch evidence
  -> post-launch optimization
```

The package is a coordination and acceptance layer. Productive implementation remains with each canonical owner.

## 2. Current-main launch baseline

### 2.1 Web / SEO assets already present on current main

- `public/robots.txt`
- `public/sitemap.xml`
- first-party `public/og-image.svg`
- route-specific SEO metadata in `src/lib/routeSeo.ts`
- prerender pipeline in `scripts/seo/prerender-public-routes.mjs`
- SEO URL normalization
- structured data baseline
- SeoEngine service/store/dashboard
- Search Console runbooks and prior verified property / URL Inspection evidence
- consent-gated Google Analytics browser integration

Current public sitemap set evidenced by the SEO project includes:

1. `/`
2. `/learning-platform`
3. `/impressum`
4. `/agb`
5. `/datenschutz`

Historical provider evidence from 2026-09-16 records `/learning-platform` as discovered but not indexed. That finding is not treated as a provider failure and does not justify synthetic success.

### 2.2 Landing-page dependency

Human/CODEOWNER-merged PR `#1153` (`CAPITAL-AI-FE`) is now part of `CURRENT_MAIN` and provides the public landing visual-fidelity baseline.

Launch messaging, screenshots, Social launch assets and final conversion-path acceptance MUST be frozen against this merged/current landing state and re-read after any later landing change. Production/runtime evidence remains a separate gate; merge-to-main alone is not production verification.

### 2.3 Social capability baseline

Repository-evidenced provider capabilities:

| Channel | Current capability | Launch use |
|---|---|---|
| X | real text publishing adapter | eligible for text launch package after approval/provider readiness |
| Facebook | real Page text publishing; media optional | eligible for text/media launch package after approval/provider readiness |
| Instagram | real media publishing adapter | eligible only with validated media asset |
| TikTok | real Direct Post video adapter | eligible only with validated video asset |
| YouTube | real upload adapter | eligible only with validated video asset |
| LinkedIn | no canonical provider adapter evidenced | content can be prepared, but automated provider launch is out of scope |
| Mastodon | no provider adapter evidenced | out of scope |

Provider adapter presence is not credential evidence and is not publication evidence.

## 3. Launch principles

1. **Product truth before promotion.** Public copy, SEO content and Social derivatives must trace to merged product/domain truth.
2. **No synthetic proof.** No fabricated rankings, traffic, conversions, user counts, performance, scores, reach, engagement or provider success.
3. **One source -> many distributions.** A canonical source asset is transformed into channel-specific packages; Social copy does not become a new factual source.
4. **People-first SEO.** Search content must be useful, original, expert-reviewed and non-commodity; no scaled low-value content or ranking manipulation.
5. **No GEO shadow architecture.** AI-search visibility uses the same technical/content quality foundations; `llms.txt` is not a Google ranking requirement.
6. **Consent-safe measurement.** Analytics and conversion events are emitted only under the accepted consent/privacy architecture.
7. **Evidence before status.** `NOT_RUN`, `NOT_PROVEN`, `PENDING` or provider configuration never becomes `PASS`.
8. **Human merge remains final repository decision.** This package does not grant self-merge or external publishing authority.

## 4. Positioning and message architecture

### 4.1 Core positioning

CAPITAL-AI should be presented as an evidence-oriented AI market-intelligence and analysis platform with transparent boundaries between:

- market information;
- explainable analysis/scoring;
- research/evidence;
- learning/methodology;
- authenticated or subscription-gated functionality.

### 4.2 Message pillars

| Pillar | Public promise boundary | Required proof |
|---|---|---|
| Explainable AI | analysis is understandable and traceable, not a black-box performance promise | product UI + methodology/domain evidence |
| Evidence-first | factual claims cite or inherit verifiable sources | FINTECH/domain evidence + content provenance |
| Multi-asset intelligence | public copy reflects only actually supported asset/domain surfaces | merged product/runtime truth |
| Learning & transparency | terminology/methodology helps users understand the system | Learning Platform + reviewed content |
| Responsible financial framing | analysis/education, not personalized investment advice | COMP-reviewed disclosure surface where applicable |

### 4.3 Message freeze gate

Final launch copy is frozen only after:

- final landing state is on `main`;
- visible claims are checked against current product/domain truth;
- CTA routes resolve to real usable destinations;
- legal/risk wording is reviewed where applicable;
- mobile and desktop rendering are accepted;
- Social launch derivatives are generated from the frozen source copy.

## 5. Workstream A — Public website launch readiness

**Owner route:** SEO coordination -> FE / OPS / COMP / QM as applicable.

### Deliverables

- final public-route inventory;
- landing-message inventory;
- CTA inventory and destination validation;
- mobile/desktop visual acceptance;
- accessibility/semantic HTML check;
- legal/footer/disclosure presence;
- production route/HTTP/canonical/metadata readback;
- screenshot/evidence set for launch communications.

### Exit gate

`WEB_LAUNCH_READY` requires:

- intended public URLs return the intended status and content;
- sitemap, canonical set, prerender allowlist and public-route inventory do not drift;
- unknown URLs remain real 404s;
- no launch CTA points to an unavailable or placeholder route;
- no demo/synthetic market values are presented as live truth;
- final production SHA equals then-current approved `main`;
- QM evidence has no unresolved launch-blocking finding.

## 6. Workstream B — Technical SEO & indexability

**Owner route:** SEO requirements; FE/OPS for productive implementation.

### Acceptance

- one canonical URL per indexable public surface;
- sitemap contains only intended canonical indexable URLs;
- `robots.txt` does not block required render assets;
- route title/description/OpenGraph/Twitter metadata reflect visible page content;
- structured data describes visible real content only;
- structured-data validation is repeated after material template changes;
- Search Console property/URL inspection is read back after launch;
- indexing findings remain provider observations, never forced to PASS.

### Core Web Vitals gate

Field evidence is preferred. At p75, segmented mobile/desktop:

- LCP <= 2.5 s;
- INP <= 200 ms;
- CLS <= 0.1.

Lab data is diagnostic and does not substitute for field evidence.

## 7. Workstream C — Search / AI-search content readiness

**Owner route:** `CAPITAL-AI-SEO`; factual domain input from FINTECH; publishing/control review as applicable.

### Initial topic clusters

- CAPITAL-AI / AI-driven market intelligence;
- explainable financial scoring;
- market-data provenance and freshness;
- crypto scoring/research methodology;
- value analysis / Buffett-style methodology where actually implemented;
- screening / ranking / decision-support explanations;
- Learning Platform / finance and AI vocabulary;
- security, transparency and evidence boundaries where user-relevant.

### Content package requirement

Every launch or evergreen search asset must define:

- user intent/problem;
- canonical target URL;
- first-party evidence or unique expertise;
- author/reviewer/domain owner;
- sources/provenance;
- title/H1/description;
- internal link plan;
- image/video plan if applicable;
- disclosure requirements;
- measurement key;
- refresh date / decay gate.

### Negative gates

Reject or rework content that relies on:

- generic mass-generated variants;
- keyword stuffing;
- doorway pages;
- cloaking;
- fake testimonials;
- fake rankings or performance;
- unsupported financial claims;
- manipulative link schemes;
- third-party reputation parasitism.

## 8. Workstream D — Analytics, funnel and attribution

**Owner route:** SEO measurement design -> FE/OPS/COMP/Billing owner implementation.

### Minimum funnel

```text
DISCOVERY
  Search / AI Search / Social / Direct
    -> LANDING
    -> ENGAGEMENT
    -> SIGN_UP
    -> LOGIN / PRODUCT USE
    -> BEGIN_CHECKOUT (when real)
    -> PURCHASE (only on authoritative success)
    -> RETENTION
```

### GA4 event semantics

Use recommended events only when the real user action occurs:

- `sign_up`;
- `login`;
- `search` where a real site search exists;
- `share` where real sharing exists;
- `generate_lead` only for a real lead action;
- `begin_checkout` only when checkout actually begins;
- `purchase` only after authoritative successful purchase/subscription evidence.

No client-side optimistic `purchase` event may manufacture revenue truth.

### Launch measurement baseline

Before setting performance targets, capture one reproducible baseline window with:

- GSC clicks, impressions, CTR, queries and landing pages;
- GenAI Search visibility where real provider data exists;
- GA4 acquisition/source-medium;
- landing engagement;
- sign-up and checkout funnel;
- real revenue lineage where available;
- Social publication and provider analytics evidence where available.

Growth targets are set only after baseline evidence exists.

## 9. Workstream E — Social launch system

**Owner route:** SEO campaign intent -> SOCIAL package/adaptation -> GOV/controls -> provider execution -> SOCIAL evidence.

### Canonical content flow

```text
approved source content
  -> SocialContentPackage
  -> channel adaptation
  -> immutable content hash
  -> applicable Human/Owner approval reference
  -> provider publish handoff
  -> provider response
  -> PUBLISHED_VERIFIED evidence
  -> provider/verified-pipeline analytics evidence
```

### Launch asset set

Prepare one canonical launch story and derive:

1. short announcement text;
2. product/value explainer;
3. methodology/evidence post;
4. Learning Platform educational post;
5. founder/company narrative;
6. short video script;
7. vertical video variant;
8. YouTube explainer description/title/thumbnail brief;
9. reusable image/carousel brief;
10. follow-up CTA post based on real observed launch questions.

All variants carry provenance, disclosure requirements, links, language, channel and approval state.

### Channel rollout

**Wave 1 — text-first:** X and Facebook after provider/approval readiness.  
**Wave 2 — media-first:** Instagram, TikTok and YouTube after validated real media assets and provider readiness.  
**LinkedIn:** manual/prepared content only until a canonical provider adapter is implemented and evidenced.

## 10. Workstream F — Launch calendar

The calendar is relative to the actual Owner-selected public launch date.

| Window | Activity | Required evidence |
|---|---|---|
| T-14 to T-7 | final product/message/content audit; Search/analytics baseline | current-main + provider read snapshots |
| T-7 to T-3 | freeze landing copy, metadata and launch content source | immutable source/content references |
| T-3 to T-1 | production rehearsal, mobile/desktop/CWV/security/consent verification | production-like or production evidence |
| T-1 | final go/no-go convergence | all blocking gates classified |
| T0 | public announcement + sitemap/Search Console follow-through + Wave-1 Social | production SHA + publication evidence |
| T+1 to T+3 | crawl/index/provider readback; user-friction review | GSC/GA4/runtime/Social evidence |
| T+7 | first launch review and content iteration | evidence-backed findings |
| T+30 | first growth baseline and priority reset | GSC+GA4+Social+conversion baseline |
| T+60 / T+90 | authority/content/funnel optimization | trend evidence, not estimates |

## 11. Launch gate matrix

| Gate | Owner / route | Required state |
|---|---|---|
| Product truth | FE + FINTECH/domain owners | merged and evidence-backed |
| Landing fidelity / usability | FE | merged + production verified |
| Technical SEO | SEO -> FE/OPS | PASS on canonical/sitemap/metadata/HTTP |
| Search Console | SEO read plane | provider read available; findings classified |
| Analytics & consent | SEO -> FE/OPS/COMP | consent-safe real event evidence |
| Financial/public claims | FINTECH + COMP/GOV as applicable | supported; no unsupported claim |
| Security | SEC / owning implementation project | no unresolved launch blocker |
| Social package | SOCIAL | contract-valid and provenance complete |
| Publishing | SOCIAL/provider path | verified provider outcome; no fake success |
| Production | OPS | exact deployment identity read back |
| Quality | QM | independent launch evidence has no blocking finding |
| Human decision | Owner/CODEOWNER | merge / public-launch decision |

`PUBLIC_LAUNCH_READY` is a non-authorizing status projection only. It is valid only when every blocking gate is evidenced against the same launch candidate.

## 12. Evidence bundle

The launch evidence bundle must preserve:

- current main SHA;
- launch candidate SHA;
- production SHA;
- public URL inventory;
- robots/sitemap/canonical readback;
- metadata/structured-data verification;
- CWV evidence;
- Search Console readback;
- analytics/consent evidence;
- claim/source/disclosure review;
- final approved canonical launch content;
- Social package IDs and hashes;
- provider publication evidence;
- provider analytics references;
- unresolved findings and explicit non-PASS states.

No secret/token material is included.

## 13. Dependencies and owner-correct handoffs

### FE

- final landing implementation;
- CTA destinations;
- semantic/accessibility/CWV implementation;
- analytics event wiring.

### SOCIAL

- channel packages;
- media requirements;
- provider publishing;
- publication/analytics evidence.

### OPS

- production deployment identity;
- provider/runtime readback;
- external operations already inside authorized provider boundaries.

### GOV

- publishing/control decisions where the current contract requires them;
- no second Marketing execution authority.

### SEC

- OAuth/token/provider-security requirements and independent security findings.

### COMP

- analytics consent/privacy;
- required public financial/legal disclosures;
- advertising/marketing compliance if later activated.

### FINTECH

- public methodology/scoring/domain claims and evidence.

### QM

- independent launch evidence verification.

## 14. Current blockers / open gates at creation

1. PR `#1153` is merged and therefore satisfies the repository-side landing dependency; production deployment/readback of the merged landing remains a separate launch gate.
2. Current SEO evidence confirms Search Console property/URL Inspection history, but Search Analytics and GA4 provider readback remain independently evidence-gated.
3. Social analytics adapter/provider evidence is not generally verified in the current channel matrix.
4. Media-first Social channels require real validated media; no synthetic launch asset is accepted.
5. Final public launch date is intentionally not invented; calendar uses T-relative sequencing until the Owner selects the date.

## 15. Definition of Done

The work package is complete when:

- the final landing candidate is merged and production-correlated;
- all public routes/metadata/canonical/sitemap/structured-data gates pass;
- consent-safe acquisition and conversion measurement is evidenced;
- a baseline GSC/GA4 measurement snapshot exists without synthetic values;
- a reviewed canonical launch narrative and content set exists;
- channel-specific Social packages are contract-valid;
- actual publications, if executed, carry provider evidence;
- launch blockers are zero or explicitly accepted by the Human Owner under the applicable domain controls;
- a T+7 and T+30 review path is scheduled in the canonical project workflow;
- no second Marketing/SEO/Social/publishing/analytics authority has been created.

## 16. Advisory external references — revalidated 2026-09-20

These are advisory implementation inputs only:

- Google Search spam policies: https://developers.google.com/search/docs/essentials/spam-policies
- Google Search AI optimization guidance: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google Search documentation updates: https://developers.google.com/search/updates
- Google Search appearance / structured data: https://developers.google.com/search/docs/appearance
- GA4 recommended events: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
- Core Web Vitals: https://web.dev/articles/vitals

Current Google guidance continues to favor useful, original, people-first content and ordinary SEO fundamentals for generative Search; Google also states that `llms.txt` is not required for Search visibility. Core Web Vitals remain LCP, INP and CLS with the thresholds used above.
