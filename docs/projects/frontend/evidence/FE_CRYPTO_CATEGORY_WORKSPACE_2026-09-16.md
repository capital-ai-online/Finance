# FE Crypto Category / Subclass Workspace — 2026-09-16

**Project:** `CAPITAL-AI-FE`  
**Project folder:** `docs/projects/frontend/`  
**Primary Productive PVC:** `N/A` — cross-cutting presentation consumer  
**Primary Owner:** `CAPITAL-AI-FE`  
**Baseline:** `main@c58f662deee989f270d6968881644d284435d5bd`  
**Branch:** `agent/frontend-crypto-category-workspace-20260916`  
**Authority effect:** none — presentation-only projection

## Objective

Materialize the `Crypto -> Overview -> Categories -> Models & Orchestration` presentation lane from the canonical Frontend roadmap without creating a second classification, market-data, provider, feature, scoring, ranking or entitlement authority.

## Current-main reuse

The implementation reuses:

- `assetRegistry.getAssets()` only to discover current crypto symbol/name membership;
- `ClassificationService.classifyAsset(...)` for canonical `category_main`, `category_sub`, `asset_type`, tier/confidence semantics;
- `buildCryptoCategoryResearchViewModel(...)` for existing category-profile and Meme/DeFi research bindings;
- the existing `CryptoScoringWorkspace` composition root;
- the existing FINTECH-owned `ScoringModelRegistry -> ScoringDispatcher` authority indirectly through supplied model/research metadata.

It does **not** read `assetRegistry` price, score, market-cap, volume or change fields into the new workspace. Those legacy/local fields therefore cannot become displayed financial truth through this slice.

## Implemented presentation

`CryptoCategoryWorkspace.tsx` adds:

1. `Overview` — count of actually contract-backed category/member projections and explicit DATA -> FINTECH -> FE boundary;
2. `Categories` — current classified categories, canonical subcategories, tier/confidence and member-asset navigation;
3. `Models & Orchestration` — category profile/binding, exact existing dedicated research challenger metadata where supplied, and the canonical orchestration boundary;
4. keyboard tab navigation and >=44px-equivalent Tailwind `min-h-11` interaction targets;
5. explicit presentation/research authority labels and no client-side score/gate computation.

Only categories with actual current classified members are surfaced. Empty taxonomy entries are not invented in a parallel Frontend registry.

## Foreign-owner boundaries

- `CAPITAL-AI-DATA / PVC-09..11` retains provider routing, source identity, evidence, provenance, freshness and DQ.
- `CAPITAL-AI-FINTECH / PVC-12..17` retains feature contracts, model registry, dispatcher, executors, canonical score and ranking semantics.
- `CAPITAL-AI-FE` renders supplied state and navigation only.
- Protected provider credentials, Supabase Auth settings, database configuration, deployment and production mutation are not changed by this branch.

## Supabase / URL correlation

Connected Supabase project evidence identifies project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`, `eu-west-1`) with API base `https://ryzywoktpmyhwzxmstyu.supabase.co`. The connector does not expose the managed Auth Site URL / Redirect URL allow-list as a direct read surface in this run. Current repository auth flows therefore remain the correlation source for expected redirects; this branch makes no Supabase URL/Auth mutation.

## Validation classification

- Source-level focused regression: materialized in `tests/unit/cryptoCategoryWorkspace.test.ts`; execution `NOT RUN` pre-PR through this connector.
- TypeScript: `NOT RUN` pre-PR.
- Production build: `NOT RUN` pre-PR.
- Hosted checks: pending until Draft PR creation under repository cost/lifecycle policy.
- Browser/mobile evidence: pending post-integration/deployment; repository implementation alone is not Production Acceptance.

`NOT RUN` is not `PASS`.

## Exit gate

The slice is complete only when exact-head CI/Frontend validation proves the workspace compiles and the final browser evidence shows category/subclass navigation without horizontal/pointer regressions, while DATA/FINTECH authority and fail-closed states remain unchanged.
