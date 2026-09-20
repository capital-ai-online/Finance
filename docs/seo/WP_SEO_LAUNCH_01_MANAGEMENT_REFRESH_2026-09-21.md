# WP-SEO-LAUNCH-01 — SEO Management Refresh

**Status:** `ACTIVE / CURRENT-MAIN RECORRELATED / PROVIDER GATES OPEN`  
**Date:** 2026-09-21  
**Current-main baseline:** `4f2c746a20a8683d784a1cbe54c763a64ddd1da3`  
**Project:** `CAPITAL-AI-SEO`  
**Primary Owner:** `CAPITAL-AI-SEO`  
**Primary productive PVC:** N/A — cross-cutting; no productive PVC  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## 1. Management purpose

This evidence record continues `WP-SEO-LAUNCH-01` after the previous launch-execution PR was Human/CODEOWNER-merged. It re-correlates SEO management against the exact current-main landing and Production state after subsequent Frontend branding work.

SEO owns requirements, search/discoverability planning, content architecture, provider-read evidence coordination and owner-correct handoffs. It does not seize Frontend runtime, Production operations, Social publishing, Compliance, Security, FINTECH truth or Quality authority.

## 2. Current candidate and Production

### Repository candidate

Current main at management takeover:

`main@4f2c746a20a8683d784a1cbe54c763a64ddd1da3`

Relevant merged change since the previous SEO freeze:

- PR #1178 — Frontend branding + vector Earth hero;
- changed `src/features/public/ui/LandingPage.tsx`, design tokens/CSS and the first-party hero SVG;
- CTA destinations and public route inventory remain structurally unchanged in the inspected current-main source.

### Production identity

Render provider readback:

- workspace: `AICapital`;
- service: `Finance`;
- live deploy: `dep-dao54cajnfac73ak74rg`;
- live commit: `4f2c746a20a8683d784a1cbe54c763a64ddd1da3`;
- trigger: `deploy_hook`;
- provider state: `live`.

**Classification:** `PRODUCTION_CURRENT_MAIN_PASS` for this snapshot.

Any later movement of current main invalidates this snapshot and requires fresh correlation.

## 3. CTA and landing freeze

The visible actionable set remains:

| Surface | Action | Target | SEO state |
|---|---|---|---|
| Header | Produkt | `#produkt` | `PASS_REPOSITORY` |
| Header | Analysen | `#analysis-workbench` | `PASS_REPOSITORY` |
| Header | Learning | `/learning-platform` | `PASS_REPOSITORY` |
| Header | Anmelden | `/login` | `PASS_REPOSITORY` |
| Header/Hero | Analyse starten | `#analysis-workbench` | `PASS_REPOSITORY` |
| Hero | Produkt entdecken | `#core-modules` | `PASS_REPOSITORY` |
| Trust | Anmelden | `/login` | `PASS_REPOSITORY` |
| Footer | Datenschutz / AGB / Impressum | legal routes | `PASS_REPOSITORY` |

Presentation-only items such as `Preise`, `Über uns`, `Alle Märkte` and `Alle Module ansehen` are not launch CTAs and must not be advertised as usable destinations.

## 4. Technical SEO management findings

### SEO-LAUNCH-01-FE-META-001 — root metadata/message drift

**State:** `OPEN_OWNER_HANDOFF / LAUNCH_BLOCKING_FOR_FINAL_MESSAGE_FREEZE`  
**Target owner:** `CAPITAL-AI-FE`

The visible landing is now positioned around market intelligence, explainable AI-assisted scoring, research, learning, multi-asset context and evidence boundaries.

Current root metadata/prerender still says:

- title: `CAPITAL-AI Portal`;
- description: quantitative analysis, Compliance management, asset scoring and automated GDPR documentation.

This is materially weaker and semantically misaligned with the visible landing.

SEO recommendation for FE implementation:

- title candidate: **CAPITAL-AI – AI Market Intelligence & Multi-Asset Analyse**
- description candidate: **CAPITAL-AI verbindet Marktinformationen, nachvollziehbares KI-Scoring, Research und Learning für Aktien, Krypto, Forex, Rohstoffe und Indizes – evidence-first und ohne Demo-Daten.**

The exact final wording remains subject to FE implementation evidence and domain/compliance review where applicable.

Affected FE-owned surfaces:

- `src/lib/routeSeo.ts`;
- `scripts/seo/prerender-public-routes.mjs`;
- any generated initial HTML/OG/Twitter metadata derived from those sources.

### SEO-LAUNCH-01-FE-IA-002 — visible internal-link gap for /universe

**State:** `OPEN_OWNER_HANDOFF / NON_BLOCKING_BUT_HIGH_VALUE`  
**Target owner:** `CAPITAL-AI-FE`

`/universe` is a canonical sitemap/SEO route, but no visible `href="/universe"` was found in current-main page source during this SEO readback.

SEO requirement:

- add at least one contextual, user-visible internal link from a relevant public surface to `/universe`;
- use descriptive anchor copy, not generic “click here”;
- preserve the current canonical path and do not create a duplicate route.

This is an information-architecture/discoverability improvement and not proof of indexation.

## 5. Public URL / crawl surface

Current sitemap set:

1. `https://capital-ai.online/`
2. `https://capital-ai.online/universe`
3. `https://capital-ai.online/learning-platform`
4. `https://capital-ai.online/impressum`
5. `https://capital-ai.online/agb`
6. `https://capital-ai.online/datenschutz`

`robots.txt` globally allows crawling except defined application/internal paths. The absence of a dedicated `Allow: /universe` line is not a block because `Allow: /` already permits it.

Public web-tool fetches of the live site were unavailable in this execution and sampled `site:capital-ai.online` search queries returned no results. This is **not** treated as Google index evidence and is not converted into `NO_DATA_VERIFIED`.

## 6. GSC / GA4 management baseline

### Google Search Console

Retained historical provider evidence:

- domain property was previously read successfully;
- five earlier URLs received real URL Inspection responses;
- `/learning-platform` was previously observed as discovered but not indexed.

Current required launch reads remain:

- six-URL inspection including `/universe`;
- clicks;
- impressions;
- CTR;
- query dimension;
- landing-page dimension;
- GenAI/Search visibility where the provider exposes it.

**Current state:** `READ_BLOCKED_NOT_CONNECTED` in this Chat execution.

### Google Analytics 4

Required baseline:

- acquisition/source-medium;
- landing engagement;
- `sign_up`;
- `login`;
- checkout/purchase only where real authoritative events exist;
- no synthetic users, sessions, revenue or conversion rates.

**Current state:** `READ_BLOCKED_NOT_CONNECTED` in this Chat execution.

Repository MCP configuration does not itself prove provider access or data.

## 7. Social Wave 1 provider state

Fresh production Supabase readback on 2026-09-21:

- connected X accounts: `0`;
- connected Facebook accounts: `0`;
- X/Facebook publication log entries: none observed in the queried production table.

Classification:

- X adapter: `SUPPORTED_REPOSITORY`;
- Facebook adapter: `SUPPORTED_REPOSITORY`;
- X account identity: `NOT_CONNECTED`;
- Facebook account identity: `NOT_CONNECTED`;
- Wave-1 provider publication: `BLOCKED_PROVIDER_ACCOUNT_IDENTITY`;
- publication analytics: `NOT_RUN`.

SEO continues to own the canonical campaign/source intent. Provider connection, SocialContentPackage adaptation, provider publication and publication evidence remain `CAPITAL-AI-SOCIAL` owned.

## 8. SEO-owned management work now active

### Topic management

Materialized in:

`docs/seo/SEO_TOPIC_MAP_PUBLIC_LAUNCH_2026-09-21.md`

No keyword volume, ranking or traffic estimate is invented before provider evidence exists.

### First launch content brief

Materialized in:

`docs/seo/SEO_LAUNCH_CONTENT_BRIEF_01_2026-09-21.md`

The brief is a source/content specification only. It is not Frontend implementation and not publication approval.

## 9. Launch gate projection

| Gate | Current state |
|---|---|
| Current-main candidate | `PASS` |
| Production exact-SHA | `PASS` |
| CTA repository freeze | `PASS_REPOSITORY` |
| Six public sitemap URLs | `PASS_REPOSITORY` |
| Root metadata/message parity | `OPEN_FE_HANDOFF` |
| Visible /universe internal link | `OPEN_FE_HANDOFF` |
| GSC performance baseline | `READ_BLOCKED_NOT_CONNECTED` |
| GA4 baseline | `READ_BLOCKED_NOT_CONNECTED` |
| X account | `NOT_CONNECTED` |
| Facebook account | `NOT_CONNECTED` |
| X/Facebook publication | `NOT_RUN` |
| Social analytics | `NOT_RUN` |

## 10. Owner-correct next convergence

1. **FE handoff:** implement root metadata/prerender parity and a contextual visible link to `/universe`, then return exact-head tests/build/generated-output evidence.
2. **Provider-read handoff:** connect an approved read surface for GSC/GA4, then capture the first real launch baseline. No missing connection is interpreted as zero data.
3. **SOCIAL handoff:** connect intended X/Facebook identities, then adapt the SEO source content into contract-valid packages and publish only after provider/account/approval gates pass.

## 11. Exit interpretation

This SEO management refresh is complete when its repository evidence is Human/CODEOWNER-merged and its claim is released. The broader `WP-SEO-LAUNCH-01` remains active until current GSC/GA4 evidence, FE metadata/IA returns, provider publication evidence and applicable launch-assurance gates converge.
