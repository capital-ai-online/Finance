# WP-SEO-LAUNCH-01 — IA / Public-Route Convergence

**Status:** `ACTIVE / SEO_AUDIT_COMPLETE / FOREIGN_OWNER_GATES_OPEN`  
**Date:** 2026-09-22  
**Current-main baseline:** `main@aee799282298596a5f2d9140a4e805edf52783a0`  
**Project:** `CAPITAL-AI-SEO`  
**Canonical project folder:** `docs/projects/seo/`  
**Primary productive PVC:** N/A — cross-cutting; no productive PVC  
**Primary Owner:** `CAPITAL-AI-SEO`  
**Work package:** `WP-SEO-LAUNCH-01`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## 1. Purpose

Continue the active public-launch package after Human/CODEOWNER merge of PR #1260 without reviving completed historical slices.

This slice performs only SEO-owned coordination/evidence work:

1. release stale merged SEO claims;
2. re-correlate the exact public launch candidate;
3. audit canonical public-route reachability and internal linking;
4. classify Production, Google-measurement and Social provider gates truthfully;
5. route productive fixes to the canonical owner.

No FE, OPS, FINTECH, provider, OAuth, publication, deployment or database mutation is performed here.

## 2. Post-merge continuation

### 2.1 Merged predecessor

PR #1260 — `[CAPITAL-AI-SEO] [ChatGPT] Content-Quality und SEO-Review konvergieren` — is Human/CODEOWNER merged.

Its claim `CAPITAL-AI-SEO-CONTENT-QUALITY-REVIEW-20260922` satisfied its release condition and is released in this branch.

The older `CAPITAL-AI-SEO-LANDING-FIRST-GATE-20260921` claim also satisfied its release condition through merged PR #1204 and is released here. Neither stale claim remains an active writer.

### 2.2 Current writer correlation

At branch creation:

- `CURRENT_MAIN`: `aee799282298596a5f2d9140a4e805edf52783a0`;
- only open PR: #1262, `CAPITAL-AI-OPS`;
- #1262 changed files are limited to the OPS self-healing work package, `selfHealingContract.ts`, and its unit test;
- no changed-file or SEO-document overlap exists with this slice.

## 3. Production candidate readback

Initial Render readback during this slice:

- service: `Finance`;
- live Render deploy: `dep-dap05bu0tbcc73ftl690`;
- live commit: `720e4a80904a881e5ef732b66e1303f51a769d8e`;
- current main: `aee799282298596a5f2d9140a4e805edf52783a0`;
- current main is four commits ahead of the live Render commit;
- the compare surface between those SHAs changes `public/cookieconsent-theme.css` and `tests/unit/cookieConsentStyleReadiness.test.ts`.

Classification at the initial observation:

`PRODUCTION_DRIFT / EXACT_SHA_FREEZE_NOT_PASS`

The canonical GitHub→Render path subsequently recovered without an SEO-side provider bypass:

- Render deploy: `dep-dap07drtqb8s73ertcv0`;
- deployed commit: `aee799282298596a5f2d9140a4e805edf52783a0`;
- state: `live`;
- deploy trigger: `2026-09-22T04:27:35Z`;
- current-main commit time: `2026-09-22T04:23:14Z`;
- trigger delta: 261 seconds — within the five-minute SLA.

Current exact-SHA classification: `PRODUCTION_FREEZE_PASS`.

OPS #1258 remains independently open for raw initial-HTML/cache classification; exact deployment identity does not fabricate that separate evidence.

## 4. Canonical public-route audit

Current canonical SEO route set remains:

1. `/`
2. `/universe`
3. `/learning-platform`
4. `/impressum`
5. `/agb`
6. `/datenschutz`

Repository equality remains present across:

- `src/lib/routeSeo.ts`;
- `public/sitemap.xml`;
- `scripts/seo/prerender-public-routes.mjs`;
- `server/middleware/seoUrlNormalize.ts#PUBLIC_SPA_PATHS`;
- route-specific public HTML fallback inventory in `server/runtime/spaFallback.ts`.

That equality alone is not sufficient to prove hydrated client reachability.

## 5. Hydrated-route and internal-link matrix

| Route | Canonical SEO | Sitemap | Prerender | Public server route | Hydrated client route | Visible landing link | Classification |
|---|---|---|---|---|---|---|---|
| `/` | yes | yes | yes | yes | yes | self | `PASS_REPOSITORY` |
| `/universe` | yes | yes | yes | yes | **no current `AppRoutes` branch** | **not present** | `BLOCKING_CLIENT_ROUTE_DRIFT` |
| `/learning-platform` | yes | yes | yes | yes | yes | no direct visible root navigation; prerender noscript link exists | `IA_GAP_VISIBLE_LINK` |
| `/impressum` | yes | yes | yes | yes | yes | Footer/Header legal navigation | `PASS_REPOSITORY` |
| `/agb` | yes | yes | yes | yes | yes | Footer/Header legal navigation | `PASS_REPOSITORY` |
| `/datenschutz` | yes | yes | yes | yes | yes | Footer/Header legal navigation | `PASS_REPOSITORY` |

### Finding SEO-LAUNCH-IA-001 — /universe client-route drift

`src/app/routing/AppRoutes.tsx` currently contains no `/universe` render branch, while every canonical SEO/server inventory still treats `/universe` as a public indexable route.

The server can therefore serve route-specific `universe/index.html` while the hydrated client router does not preserve the same route state.

This is launch-blocking for exact canonical route integrity.

Owner-correct handoff created:

- FE Issue #1263 — `[CAPITAL-AI-FE] /universe Client-Routing und sichtbare interne SEO-Verlinkung wiederherstellen`.

SEO does not repair the FE router in this branch.

### Finding SEO-LAUNCH-IA-002 — visible root internal-link gap

The current imported landing generation exposes product/modal navigation and legal/FAQ links, but no direct visible root navigation to:

- `/universe`;
- `/learning-platform`.

The prerendered noscript block links both destinations, so crawler discovery is not zero, but the visible hydrated IA does not provide an equivalent descriptive user path.

This is an IA/usability finding, not evidence that either URL is deindexed.

## 6. /faq boundary

`/faq` exists in the application UI and is visibly linked from the current landing/footer, but remains intentionally outside the canonical public SEO set:

- `APPLICATION_SPA_PATHS`: yes;
- `PUBLIC_SPA_PATHS`: no;
- route-specific public HTML fallback: no;
- sitemap/prerender/routeSeo: no.

OPS Issue #1252 remains open for the owner-correct server/static-HTML promotion. SEO Issue #1233 remains blocked on that exit gate.

The route-set equality/security invariant is not weakened to make `/faq` indexable prematurely.

## 7. Root metadata state

CURRENT_MAIN repository sources are aligned on the current market-intelligence root proposition:

- `index.html`;
- `src/lib/routeSeo.ts`;
- `scripts/seo/prerender-public-routes.mjs`.

They use:

`CAPITAL-AI – Marktdaten verstehen. Chancen besser erkennen.`

OPS Issue #1258 remains open because a prior external crawl observed older root metadata. This SEO slice does not classify that observation as cache/deploy failure without raw production-origin evidence.

## 8. Measurement/provider gates

### GSC / GA4

Historical Search Console provider evidence remains valid only for the exact historical observations already recorded.

Current states remain:

- GSC Search Analytics: `READ_BLOCKED_NOT_CONNECTED`;
- current six-URL inspection set including `/universe`: `PARTIAL / CURRENT_READ_BLOCKED_NOT_CONNECTED`;
- GA4 Data API/MCP baseline: `READ_BLOCKED_NOT_CONNECTED`;
- GenAI visibility: `READ_BLOCKED_NOT_CONNECTED`.

No traffic, ranking, click, conversion or revenue value is synthesized.

### Social Wave 1

Fresh production Supabase readback in this slice:

- connected X accounts: `0`;
- connected Facebook accounts: `0`.

Therefore:

- X publication: `BLOCKED_PROVIDER_ACCOUNT_IDENTITY`;
- Facebook publication: `BLOCKED_PROVIDER_ACCOUNT_IDENTITY`;
- publication evidence: `NOT_RUN`;
- provider analytics evidence: `NOT_RUN`.

The prepared launch source copy remains preparation evidence only.

## 9. Domain/content gate

Pilot Brief #02 remains `NOT_PUBLISHED / ROUTE_NOT_APPROVED`.

FINTECH Issue #1254 remains open for public-safe scoring truth. SEO does not promote the candidate `/methodik/ki-scoring` route or publish scoring-methodology claims before that return.

## 10. Current launch projection

| Gate | State |
|---|---|
| Current repository landing source | `PASS_REPOSITORY` |
| Root metadata source alignment | `PASS_REPOSITORY` |
| Canonical six-route set equality | `PASS_REPOSITORY` |
| Hydrated `/universe` reachability | `BLOCKING_CLIENT_ROUTE_DRIFT` |
| Visible root IA to `/universe` | `OPEN_FE_1263` |
| Visible root IA to `/learning-platform` | `OPEN_FE_1263` |
| `/faq` public SEO promotion | `BLOCKED_OPS_1252` |
| Production exact-SHA freeze | `PASS` after canonical recovery to `dep-dap07drtqb8s73ertcv0` / exact current main |
| Root Production HTML verification | `OPEN_OPS_1258` |
| FINTECH scoring truth | `BLOCKED_FINTECH_1254` |
| GSC current performance | `READ_BLOCKED_NOT_CONNECTED` |
| GA4 baseline | `READ_BLOCKED_NOT_CONNECTED` |
| X/Facebook accounts | `NOT_CONNECTED` |
| Social Wave-1 publication | `NOT_RUN` |

`PUBLIC_LAUNCH_READY` is therefore **not asserted**.

## 11. Exit evidence for this slice

This SEO-owned slice is repository-ready when:

- predecessor stale claims are released;
- this audit is merged;
- Roadmap/checklist/program projections use the same current-state classification;
- FE #1263 is recorded as the owner-correct `/universe`/visible-IA handoff;
- no Production/provider/domain PASS is fabricated;
- exact-head required checks pass.

The broader `WP-SEO-LAUNCH-01` remains active until its cross-owner and provider Definition of Done is satisfied.
