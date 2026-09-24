# FRONTEND upstream presentation-source contract

**Project:** `CAPITAL-AI-FE`  
**Source repository:** `SvenKulessa/FRONTEND`  
**Source ref:** `main`  
**Pinned adoption snapshot in PR #1206:** `8f6b629c985ca2e46c822ff911f53741d0141e07`  
**Finance execution authority:** `/AGENTS.md@CURRENT_MAIN`

## Architecture adoption

Merge of PR #1206 adopts the current `SvenKulessa/FRONTEND` presentation architecture as the leading graphical architecture for CAPITAL-AI and binds the canonical root landing page to that pinned version.

Two correlated forms are retained:

1. an inert, reviewable upstream snapshot under `docs/frontend/upstream-source/SvenKulessa-FRONTEND/`;
2. a runtime presentation copy under `src/features/public/ui/frontend-port/`.

All non-branding presentation artifacts remain exact-source locked. `BrandLogo.tsx` is the single intentional adapter exception described below.

## Branding boundary

Branding authority stays in the Finance repository.

- **Colors:** `docs/frontend/design-tokens.json`
- **Typography:** `docs/frontend/design-tokens.json`
- **Product/wordmark naming:** Finance repository
- **Logo geometry only:** current runtime generation `SvenKulessa/FRONTEND@f2a101330d74420c373f0ec56fa58caac53d741d` → `src/components/BrandLogo.tsx`
- **Canonical geometry contract:** `docs/frontend/brandmark.json`
- **Canonical React emblem:** `src/shared/branding/CapitalAiEmblem.tsx`

The FRONTEND repository therefore does **not** replace Finance branding colors, typography, naming or semantic color roles. Its logo geometry is projected through Finance-owned brand tokens.

`src/features/public/ui/frontend-port/components/BrandLogo.tsx` is the only allowed runtime branding adapter in the pinned presentation tree. `source-lock.json` records this explicitly as `FINANCE_BRANDING_ADAPTER`; all other locked runtime source artifacts remain `EXACT_GIT_BLOB`.

## Current runtime promotion — 2026-09-22

The review snapshot has converged to `SvenKulessa/FRONTEND@f2a101330d74420c373f0ec56fa58caac53d741d`.
The productive landing runtime is promoted to the same graphical generation with explicit Finance adapters:

- current Header/Footer, market-category/subclass presentation and modal composition are adopted;
- `SubclassDetailModal.tsx` is now present in runtime;
- the Cyber-Earth / planetary neural-grid emblem geometry is adopted while Finance design tokens remain color/typography authority;
- upstream Login and Legal/FAQ files remain design references only; productive Auth/Session and Compliance content stay on their canonical Finance surfaces;
- upstream third-party analytics/SEO code is not promoted. Header/Footer events terminate in a Finance-owned presentation event bridge with no external script or cookie side effect;
- the Finance desktop >=1024px website adapter remains required.

The runtime source lock is `src/features/public/ui/frontend-port/source-lock.json` and must identify this exact upstream commit/tree.

## Productive authority boundary

Finance retains productive auth/session, provider/data, news, scoring, entitlement, billing, Security, Compliance, Governance and deployment authority.

`src/data/mockData.ts` from the upstream source remains presentation fixture content only. Its prices, scores, labels and other values are not canonical Finance evidence.

The hourly workflow mirrors future upstream presentation changes into reviewable evidence and opens/updates a PR. It does not automatically replace productive runtime.

## Binding state in #1206

1. pinned upstream presentation snapshot — included;
2. exact-source runtime presentation copy for non-branding components — included;
3. logo geometry adapted through Finance branding authority — included;
4. canonical root `/` → pinned `ReferenceApp` — included;
5. Finance routing/auth/session authority — unchanged;
6. productive Finance data/scoring/news/pricing/entitlement adapters — separate owner-correct follow-up work;
7. exact-head TypeScript, Frontend architecture, tests/build and applicable SEC/COMP/QM evidence — required before merge.

Human/CODEOWNER merge remains the final merge gate.


## Runtime promotion — cbc5580 Vocabulary delta

**Selected source:** `SvenKulessa/FRONTEND@cbc558019ae6785f44079fe6fca3403460774df3`

The cbc5580 delta is synchronized with explicit owner-correct adapters instead of blind fixture promotion:

- `MarketVocabularyModal.tsx` is adopted as the graphical Vocabulary surface, but its content is supplied by the existing Finance `LearningVocabulary` projection over the canonical ESS-0017 registry;
- `/vocabulary` is the canonical public path; `/glossar`, `/lexikon`, `/market-vocabulary` and `/dictionary` redirect to it;
- the source `src/data/vocabularyData.ts` is not promoted because it would create a second terminology authority;
- expanded source asset fixtures are not promoted as verified market data; CAPITAL-AI-FINTECH retains asset/data/scoring authority and the existing verified selection binding remains unchanged;
- `KrakenReferralBanner.tsx` is mirrored only as inert source evidence and is not promoted into runtime pending CAPITAL-AI-COMP review of affiliate/referral and public financial claims;
- the source mobile-first presentation and Finance >=1024px desktop website adapter remain active.


## Owner design overlay — 2026-09-23

The owner-provided archive `FRONTEND-main (1).zip` (SHA-256 `a016e7874436ff17c16621269153923aae11fe1b4009e8a72d002d8af87fbca1`) is an additional **presentation source**, not a new productive data or scoring authority.

The promoted overlay is intentionally narrower than the archive:

- the public landing Header no longer exposes the `Universe` navigation tab;
- `MarketOverview` may adopt the archive's `AssetLogo` treatment, but it does not render archive-provided `aiScore` / `aiRating` values;
- the archive's `MarketSentiment` visual hierarchy may be rendered only through a fail-closed Finance adapter;
- hard-coded category sentiment scores, locally generated 30-day history, driver scores/text fixtures and alert-score coupling are not promoted;
- productive sentiment/scoring values remain owned by `CAPITAL-AI-FINTECH / PVC-09..17` and must carry owner-correct evidence;
- the existing Altcoin Pattern Trooper is not moved in this slice. Its later integration target is the owner-designated leading graphic and must reuse the existing read-only FINTECH contract rather than create a second scoring path.

The pinned SvenKulessa/FRONTEND Git snapshot remains recorded as the base presentation provenance. The owner archive is recorded separately in `source-lock.json.ownerDesignOverlay` so archive-origin deltas are traceable without inventing a Git source commit.

## Runtime-promotion boundary — 4590c18 Alert/Sentiment delta

**Observed presentation source:** `SvenKulessa/FRONTEND@4590c184aa4646e2708076cda05ead2820436a2a`  
**Execution boundary:** presentation may be adopted; financial truth, persistence, alert triggering and scoring remain Finance-owned.

The newer upstream generation contains useful presentation work, but it also contains browser-side domain behavior. Productive adoption is therefore split explicitly:

### Presentation that may be adapted

- `AssetLogo.tsx`: graphical asset identity treatment only. The existing Finance runtime adapter remains the productive target and does not consume upstream mock prices, scores or ratings.
- `MarketSentiment.tsx`: visual hierarchy, chart/gauge layout, category navigation and accessible presentation only. Productive values continue to arrive through `MarketSentimentPresentation.tsx` from the FINTECH `market-sentiment-projection/1.0.0` contract.
- `PriceAlertsModal.tsx` and `PriceAlertToast.tsx`: modal, list, controls, status badges, toast composition and navigation UX only, after a productive price-alert contract exists.

### Source behavior that must not be promoted

- `src/context/PriceAlertsContext.tsx`: no productive `localStorage` alert database, browser interval trigger engine, simulated sentiment transitions or client-owned alert authority.
- `src/utils/priceAlerts.ts`: no promotion of mock alert defaults or client-owned alert semantics. Pure formatting/audio helpers may be selectively reimplemented only when they remain presentation-only.
- `src/data/mockData.ts` and `src/data/assets/*`: no market-data, price, score, rating or alert truth.
- generated/synthetic sentiment history, hard-coded category sentiment values, driver fixtures and score coupling remain prohibited.
- upstream Analytics/SEO runtime remains intentionally unmirrored and unpromoted.

### Current Finance contract state

Market Sentiment is already owner-correct:

`CAPITAL-AI-FINTECH evidence -> /api/news/sentiment-projection -> MarketSentimentPresentation`.

Price Alerts are not yet equivalent. The current server alert route in `server/alerts.ts` supports score thresholds (`score_above | score_below`, scale 0..10) and must not be misused as a price-threshold API. The current authenticated `src/components/PriceAlert.tsx` uses verified quote evidence but still persists user alert state through `src/lib/alertStore.ts` / browser `localStorage`; that implementation is migration debt, not the target contract for the new graphical alert surface.

Before productive Price-Alert promotion, the applicable owner must provide one canonical server contract for:

1. authenticated/user-bound durable alert persistence;
2. price-threshold semantics distinct from score-threshold semantics;
3. verified quote evidence/provider/observation/correlation binding;
4. fail-closed stale/unavailable/conflicting quote states;
5. idempotent trigger/delivery behavior and explicit lifecycle;
6. read/create/update/disable operations required by the FE presentation.

Handover correlation: `FE-PRICE-ALERT-BACKEND-HANDOVER-20260924`.\n\nUntil that contract is Human/CODEOWNER merged, the new upstream Price Alert modal/toast/context remains unmounted from productive runtime. Frontend may prepare presentation adapters, but it must not invent persistence, price truth, trigger state or sentiment/scoring authority.

