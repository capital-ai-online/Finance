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
- **Logo geometry only:** `SvenKulessa/FRONTEND@8f6b629c...` → `src/components/BrandLogo.tsx`
- **Canonical geometry contract:** `docs/frontend/brandmark.json`
- **Canonical React emblem:** `src/shared/branding/CapitalAiEmblem.tsx`

The FRONTEND repository therefore does **not** replace Finance branding colors, typography, naming or semantic color roles. Its logo geometry is projected through Finance-owned brand tokens.

`src/features/public/ui/frontend-port/components/BrandLogo.tsx` is the only allowed runtime branding adapter in the pinned presentation tree. `source-lock.json` records this explicitly as `FINANCE_BRANDING_ADAPTER`; all other locked runtime source artifacts remain `EXACT_GIT_BLOB`.

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
