# ADR-0097 — Frontend Value Chain & Presentation Layer Consolidation

**Authority ID:** `AUTH-ADR-FRONTEND-VALUE-CHAIN-2026-08-20`  
**Version:** 1.0.0  
**Date:** 2026-08-20  
**Status:** PROPOSED — effective only after Human Merge  
**Implementation-Status:** IMPLEMENTED ON BRANCH — pending CI and Human Merge

## Context

The React client had grown around a flat `src/components/` directory containing public pages, authentication, screening, scoring, analytics, portfolio, billing, reporting, social publishing, compliance and administrative surfaces at the same level. At the same time, `src/features/` already existed and now contains real cross-stack feature implementations such as `news/newsRoutes.ts` and `registry/*`, while `src/platform/` is the established Enterprise/Governance layer.

Creating another frontend root (`src/frontend`, `src/ui`) or a `src/platform/Frontend` module would duplicate existing boundaries and create a second architecture. Keeping all UI implementations in `src/components/` would preserve a growing composition monolith and make dependency direction increasingly implicit.

The normative CAPITAL-AI AI development value chain remains unchanged:

```text
Development / Design
    -> controlled Implementation
    -> Documentary
    -> Supervisor
    -> Platform Director
    -> Release
    -> Production
```

The frontend is not a new authority in that chain. It is the user-facing Presentation/Interaction layer that projects outputs of existing features, services and platform authorities.

## Decision

CAPITAL-AI adopts the following frontend layering as the single consolidation direction:

```text
main.tsx
   -> src/app
   -> src/features/<domain>/ui
   -> src/shared
   -> existing Services / Platform / API contracts
```

### 1. `src/app` — Composition Layer

`src/app` owns application-shell concerns: composition, navigation, routing and global providers. It must not become a business-logic layer.

`src/App.tsx` remains the existing composition root during the strangler migration and is decomposed incrementally rather than replaced by a second root.

### 2. `src/features` — Value-Chain Vertical Slices

Existing feature directories are reused instead of introducing a parallel frontend hierarchy. UI surfaces are colocated under `<feature>/ui` while existing server/domain files remain intact.

Initial UI slices:

- `public` — landing/legal surfaces
- `users` — authentication/onboarding access
- `settings` — profile/security settings
- `screening` — asset discovery and universes
- `crypto`, `stocks` — asset-class-specific analysis surfaces
- `analytics` — chart/risk/visual analytics
- `news` — news/sentiment intelligence
- `portfolio` — watchlist/backtesting/performance
- `billing` — subscription and checkout surfaces
- `reporting` — export/report surfaces
- `social` — social-account and publishing surfaces
- `governance` — admin/supervisor/compliance/audit surfaces
- `registry` — existing registry feature logic; UI only when required

This creates a product-facing value flow without changing domain authority:

```text
Public / Access
   -> Screening & Discovery
   -> Analysis / Scoring / Intelligence
   -> Portfolio / Decision Support
   -> Reporting / Distribution
   -> Governance / Audit / Administration
```

### 3. `src/shared` — Fachneutral Shared Layer

`src/shared` contains only reusable, domain-neutral frontend building blocks:

- `shared/ui`
- `shared/branding`
- `shared/visuals`

Shared code must not import `src/features`, `src/app`, or business-specific legacy components.

The first physical migrations are:

- `StatusBadge` -> `src/shared/ui/StatusBadge.tsx`
- `CapitalAiLogo` -> `src/shared/branding/CapitalAiLogo.tsx`
- reusable neural decoration -> `src/shared/visuals/NeuralBackground.tsx`

Existing `src/components/StatusBadge.tsx` and `src/components/CapitalAiLogo.tsx` remain temporary compatibility exports so current consumers are not broken by a Big-Bang move.

### 4. `src/components` — Temporary Compatibility Zone

No new business UI is to be created directly under `src/components/`. Existing components are migrated slice by slice. Compatibility exports may remain only while needed by existing consumers.

The end state is removal of `src/components/` once no productive implementation remains there.

### 5. Dependency Direction

Allowed direction:

```text
app -> features -> shared
           |
           +-> services / platform / API contracts
```

Forbidden:

- `shared -> features`
- `shared -> app`
- `platform -> React UI`
- new parallel roots such as `src/frontend` or `src/ui`
- feature/domain logic inside `shared`

### 6. Architecture Gate

`scripts/automation/validateFrontendArchitecture.ts` is introduced and wired into `npm test` through `npm run frontend:architecture:check`.

The gate verifies the canonical roots, rejects parallel frontend roots, checks the shared-layer dependency direction and validates compatibility routing for migrated shared primitives.

## Consequences

### Positive

- Existing `src/features` becomes the cross-stack feature boundary instead of remaining a partially unused scaffold.
- No second architecture or duplicate platform authority is introduced.
- Feature ownership and product value flow become explicit.
- Shared design primitives gain a stable home and can be governed independently from business screens.
- `Dashboard.tsx` and other large screens can be decomposed incrementally without a risky Big-Bang rewrite.
- Architecture drift becomes machine-checkable.

### Trade-offs

- During migration, `src/components` and feature UI facades coexist temporarily.
- Some feature `ui/index.ts` files initially expose verified legacy implementations rather than owning the physical source file.
- Full value is reached only after large legacy screens are decomposed and remaining implementations are physically moved.

## Non-goals

This ADR does not:

- alter scoring, market-data, compliance or governance authority;
- introduce a new runtime event chain;
- change `src/platform` ownership;
- change authentication, billing or production mutation semantics;
- authorize a deployment or merge.

## Migration Sequence

1. Establish `app/features/shared` boundaries and architecture gate.
2. Physically migrate domain-neutral primitives with compatibility exports.
3. Route new feature UI through feature slices.
4. Decompose `Dashboard.tsx`, `LandingPage.tsx` and admin surfaces into slice-owned components.
5. Remove compatibility exports when all callers consume canonical paths.
6. Remove `src/components/` after the last productive implementation has moved.

## Validation

Required before merge:

```text
npm run lint
npm run frontend:architecture:check
npm test
npm run build
```

The Human Merge remains the authorization boundary. This ADR is proposed on the implementation branch and does not become effective merely by being committed.
