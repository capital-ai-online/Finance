# WP-SEO-LAUNCH-01 — Execution Baseline: Production / CTA / GSC-GA4 / Social Wave 1

**Status:** `EXECUTION_STARTED / PARTIAL / FAIL_CLOSED_ON_PROVIDER_GATES`  
**Date:** 2026-09-20  
**Current-main execution baseline:** `79eef34e8cd7cd852305641cb1b49cd90dbd2af5`  
**Project:** `CAPITAL-AI-SEO`  
**Primary Owner:** `CAPITAL-AI-SEO`  
**Primary productive PVC:** `N/A — cross-cutting; no productive PVC`  
**Work package:** `WP-SEO-LAUNCH-01`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## 1. Purpose

This record starts the Owner-directed launch execution against the merged/current public landing state and freezes only evidence that is actually observable.

Execution order:

```text
CURRENT_MAIN landing source
  -> repository CTA/public-route freeze
  -> exact Production identity readback
  -> GSC / GA4 launch baseline
  -> canonical launch-source copy
  -> CAPITAL-AI-SOCIAL Wave-1 handoff
  -> X/Facebook publication only after provider-account readiness
```

This record is not publication authority, provider evidence or a second Social queue.

## 2. Correlated source state

### 2.1 Current main

Execution started from:

`main@79eef34e8cd7cd852305641cb1b49cd90dbd2af5`

The two current-main commits after `e86955225887bb7f34036c175ad1da89b8aec14d` are coordination/work-claim metadata only. They do not change the landing source, public route implementation or Social provider adapter code.

### 2.2 Landing candidate

The launch candidate is the current-main landing composition, including:

- Human/CODEOWNER-merged landing visual-fidelity work from PR `#1153`;
- Human/CODEOWNER-merged canonical AI-Newsfeed landing integration from PR `#1159`;
- current landing source at `src/features/public/ui/LandingPage.tsx`;
- current public routing/SEO sources at `src/lib/routeSeo.ts`, `public/sitemap.xml`, `public/robots.txt` and `scripts/seo/prerender-public-routes.mjs`.

No unmerged branch content is promoted to launch truth.

## 3. Production freeze

### 3.1 Before state — drift observed

Initial Render readback during this execution:

- workspace: `AICapital`;
- service: `Finance`;
- expected current main: `79eef34e8cd7cd852305641cb1b49cd90dbd2af5`;
- initially live deploy: `dep-dao287ek1f9s73ad8iig`;
- initially live commit: `e86955225887bb7f34036c175ad1da89b8aec14d`;
- classification at that observation: `PRODUCTION_DRIFT / FREEZE_BLOCKED`.

The drift was not waived even though the intervening main delta was coordination/work-claim metadata.

### 3.2 Canonical recovery evidence

The normal main CI/deployment path subsequently converged without an SEO-side provider bypass:

- current-main commit time: `2026-09-20T18:29:12Z`;
- GitHub main CI run: `35529208910` — `success`;
- `build-and-test`: `success`;
- `Deployment verifiziert / Render-Produktion`: `success`;
- deploy-hook step `Render-Deployment für verifizierten main-Commit auslösen` started at `2026-09-20T18:32:47Z`;
- merge/main-commit → deploy-trigger delta: `215 s` — within the five-minute SLA;
- exact-SHA post-deploy verification: `success`;
- Render live deploy: `dep-dao2dk0ae00c73aha6c0`;
- Render live commit: `79eef34e8cd7cd852305641cb1b49cd90dbd2af5`;
- Render provider state: `live`.

### 3.3 Exact-SHA freeze result

Result:

`PRODUCTION_FREEZE_PASS`

Production, current main and the repository landing candidate are correlated to the same current-main SHA at this readback.

This PASS is snapshot-bound. Any later movement of current main or the landing source invalidates the freeze and requires a fresh readback.

## 4. CTA freeze

### 4.1 Actionable controls

| Surface | Visible action | Target | Freeze state | Evidence interpretation |
|---|---|---|---|---|
| Header | Produkt | `#produkt` | `PASS_REPOSITORY` | same-page section exists |
| Header | Analysen | `#analysis-workbench` | `PASS_REPOSITORY` | same-page analysis section exists |
| Header | Learning | `/learning-platform` | `PASS_REPOSITORY` | canonical public route exists |
| Header | Anmelden | `/login` | `PASS_REPOSITORY` | canonical application route exists; intentionally non-indexable |
| Header | Analyse starten | `#analysis-workbench` | `PASS_REPOSITORY` | same-page analysis section exists |
| Hero | Analyse starten | `#analysis-workbench` | `PASS_REPOSITORY` | same-page analysis section exists |
| Hero | Produkt entdecken | `#core-modules` | `PASS_REPOSITORY` | same-page section exists |
| Trust section | Anmelden | `/login` | `PASS_REPOSITORY` | canonical application route exists |
| Footer | Datenschutz | `/datenschutz/` | `PASS_REPOSITORY` | canonical public/legal route |
| Footer | AGB | `/agb/` | `PASS_REPOSITORY` | canonical public/legal route |
| Footer | Impressum | `/impressum/` | `PASS_REPOSITORY` | canonical public/legal route |

### 4.2 Non-actions

The following visible items are intentionally not accepted as launch CTAs:

- `Preise` — disabled presentation;
- `Über uns` — disabled presentation;
- `Alle Märkte` — presentation-only span;
- `Alle Module ansehen` — presentation-only span.

They MUST NOT be described in launch copy as available destinations until a canonical route/action exists.

### 4.3 Frozen launch message

The current public source supports the following bounded message:

> CAPITAL-AI combines market information, explainable AI-assisted scoring, research and learning in a multi-asset interface with visible evidence and access boundaries.

The launch message MUST NOT claim proven live values, investment performance, user outcomes, provider coverage, traffic, ranking or conversion results that are not independently evidenced.

## 5. Public URL / technical SEO freeze

The current canonical public sitemap set contains six URLs:

1. `https://capital-ai.online/`
2. `https://capital-ai.online/universe`
3. `https://capital-ai.online/learning-platform`
4. `https://capital-ai.online/impressum`
5. `https://capital-ai.online/agb`
6. `https://capital-ai.online/datenschutz`

`/login`, `/dashboard` and `/media-studio` remain application-only and outside the public sitemap/prerender set.

### Finding SEO-LAUNCH-01-FE-META-001

**State:** `OPEN_OWNER_HANDOFF / LAUNCH_BLOCKING_FOR_FINAL_MESSAGE_FREEZE`  
**Source owner:** `CAPITAL-AI-SEO`  
**Target owner:** `CAPITAL-AI-FE`

The visible landing now leads with market intelligence, market information, AI-assisted scoring and research. The root route metadata/prerender source still uses the older portal description centered on quantitative analysis, Compliance management, asset scoring and automated GDPR documentation.

Affected current-main implementation surfaces:

- `src/lib/routeSeo.ts` root/default metadata;
- `scripts/seo/prerender-public-routes.mjs` root prerender title/description/noscript.

Required owner return:

- align root title/description/OpenGraph/Twitter/prerender/noscript semantics with the visible landing without inventing product claims;
- keep route/canonical/sitemap contracts unchanged unless independently required;
- return FE tests/build/browser evidence under the FE owner boundary.

SEO does not mutate those FE implementation surfaces in this work item.

## 6. GSC / GA4 launch baseline

### 6.1 Google Search Console

Real historical provider evidence retained from 2026-09-16:

- property `sc-domain:capital-ai.online`: `READ_VERIFIED`;
- URL Inspection: five then-current sitemap URLs received real provider responses;
- `/learning-platform`: provider reported `Discovered - currently not indexed` at that observation time.

Current sitemap has since expanded with `/universe`; historical five-URL inspection evidence does not prove the sixth URL.

Current execution classification:

| Read lane | State | Reason |
|---|---|---|
| Property identity | `HISTORICAL_READ_VERIFIED` | real 2026-09-16 provider response exists |
| Current six-URL inspection set | `PARTIAL / CURRENT_READ_BLOCKED_NOT_CONNECTED` | five historical reads; `/universe` requires a fresh provider read |
| Search Analytics clicks/impressions/CTR | `READ_BLOCKED_NOT_CONNECTED` | no GSC provider tool exposed to this Chat execution |
| Query / landing-page performance | `READ_BLOCKED_NOT_CONNECTED` | same provider connection gate |
| GenAI/Search visibility report | `READ_BLOCKED_NOT_CONNECTED` | no real provider read available |

No `NO_DATA_VERIFIED` state is inferred from the missing connection.

### 6.2 Google Analytics 4

Repository configuration exposes a read-only GA4 MCP host contract, but that provider MCP is not exposed to this Chat execution.

Current execution classification:

| Read lane | State |
|---|---|
| GA4 property/provider read | `READ_BLOCKED_NOT_CONNECTED` |
| acquisition/source-medium | `READ_BLOCKED_NOT_CONNECTED` |
| landing engagement | `READ_BLOCKED_NOT_CONNECTED` |
| sign-up/login funnel | `READ_BLOCKED_NOT_CONNECTED` |
| checkout/purchase | `READ_BLOCKED_NOT_CONNECTED` |

No traffic, user, event, conversion or revenue value is fabricated.

A compatible optional ChatGPT integration for GA4 + Google Search Console was discovered, but connection/install remains a Human action and is not provider evidence until used successfully.

## 7. Social Wave 1 — X / Facebook

### 7.1 Real provider-account readback

Read-only Supabase production evidence was queried from the canonical Social account/publish tables without reading encrypted token columns.

Observed:

- `social_media_accounts`: zero rows for `x`;
- `social_media_accounts`: zero rows for `facebook`;
- `social_media_publish_log`: zero X/Facebook entries.

Classification:

- X adapter capability: `SUPPORTED_REPOSITORY`;
- Facebook adapter capability: `SUPPORTED_REPOSITORY`;
- X connected account: `NOT_CONNECTED`;
- Facebook connected account: `NOT_CONNECTED`;
- external Wave-1 publication: `BLOCKED_PROVIDER_ACCOUNT_IDENTITY`;
- publication evidence: `NOT_RUN`;
- Social analytics evidence: `NOT_RUN`.

No account, OAuth scope or publication success is inferred from adapter presence.

### 7.2 Canonical SEO source copy

This is the source communication intent for Social adaptation, not a self-approved `SocialContentPackage`.

**Source content ID:** `SEO-LAUNCH-01-SOURCE-20260920`  
**Language:** `de-DE`  
**Target URL:** `https://capital-ai.online/`  
**Disclosure:** `Für Analyse und Bildung; keine Anlageberatung.`

Canonical source:

```text
CAPITAL-AI verbindet Marktinformationen, nachvollziehbares KI-Scoring, Research und Learning in einer Multi-Asset-Oberfläche. Evidence-first: Fehlende oder nicht freigegebene Daten werden nicht durch Demo-Werte ersetzt. Jetzt entdecken: https://capital-ai.online/ — Für Analyse und Bildung, keine Anlageberatung.
```

Requested X adaptation draft:

```text
CAPITAL-AI: AI-driven Market Intelligence mit Marktinformationen, nachvollziehbarem KI-Scoring, Research und Learning – evidence-first und ohne Demo-Daten. Für Analyse & Bildung, keine Anlageberatung. https://capital-ai.online/
```

Requested Facebook adaptation draft:

```text
CAPITAL-AI verbindet Marktinformationen, nachvollziehbares KI-Scoring, Research und Learning in einer Multi-Asset-Oberfläche.

Evidence-first heißt: Fehlende oder nicht freigegebene Daten werden nicht durch Demo-Werte ersetzt.

Jetzt entdecken: https://capital-ai.online/

Für Analyse und Bildung – keine Anlageberatung.
```

Suggested discovery tags for Social review:

`#CapitalAI #MarketIntelligence #ExplainableAI #FinTech`

### 7.3 Owner-correct Social handoff

**Correlation ID:** `SEO-LAUNCH-01-HANDOFF-SOCIAL-WAVE1-001`  
**Source Owner:** `CAPITAL-AI-SEO`  
**Target Owner:** `CAPITAL-AI-SOCIAL`  
**Canonical Social roadmap linkage:** existing Social publication/evidence lane; no new Social backlog authority.

Completed SEO scope:

- current landing message and CTA source frozen at repository level;
- launch URL fixed to `https://capital-ai.online/`;
- bounded launch source copy prepared;
- X/Facebook provider capabilities correlated;
- real production account state queried;
- provider-account blocker classified without synthetic success.

Remaining Social-owned scope:

1. connect/verify the intended X account through the canonical OAuth/account path;
2. connect/verify the intended Facebook Page through the canonical OAuth/account path;
3. validate provider account identity, required scopes and account state without exposing tokens;
4. adapt the canonical source into contract-valid `SocialContentPackage` records;
5. obtain/apply the applicable content approval reference;
6. re-check the exact landing/Production candidate before publication;
7. publish through the existing canonical X/Facebook adapters;
8. persist/return provider post IDs, URLs/timestamps/content hashes and `PUBLISHED_VERIFIED` evidence;
9. add analytics evidence only from a real provider API/export/verified pipeline.

**Continuation condition:** both target provider accounts are connected and verifiably match the intended CAPITAL-AI publication identities, and the same launch candidate has passed the Production and final-message gates.

## 8. Current launch-gate projection

| Gate | Current result | Blocking final public launch? |
|---|---|---|
| Repository landing candidate | `PASS` | no |
| CTA repository freeze | `PASS` | no |
| Public six-URL inventory | `PASS_REPOSITORY` | no |
| Production exact-SHA freeze | `PASS` — exact `main@79eef34e8cd7cd852305641cb1b49cd90dbd2af5`, canonical deploy path and SLA verified | no |
| Root metadata ↔ visible landing semantics | `OPEN_FE_HANDOFF` | yes |
| GSC current performance baseline | `READ_BLOCKED_NOT_CONNECTED` | yes for measurement baseline |
| GA4 baseline | `READ_BLOCKED_NOT_CONNECTED` | yes for measurement baseline |
| X connected account | `NOT_CONNECTED` | yes for X publication |
| Facebook connected account | `NOT_CONNECTED` | yes for Facebook publication |
| X/Facebook publication evidence | `NOT_RUN` | yes |
| Social analytics evidence | `NOT_RUN` | post-publication gate |
| Open Security hardening PR #1165 | `OPEN / FOREIGN-OWNER EVIDENCE` | final launch security decision remains independent |

## 9. Exit evidence for this execution slice

This SEO execution slice can close only when its repository changes are Human-merged and the returned foreign-owner/provider evidence is correlated. It does not require SEO to seize FE, OPS or SOCIAL implementation.

The broader `WP-SEO-LAUNCH-01` remains active until the work-package Definition of Done is satisfied.
