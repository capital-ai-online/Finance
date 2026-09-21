# FRONTEND upstream presentation-source contract

**Project:** `CAPITAL-AI-FE`  
**Source repository:** `SvenKulessa/FRONTEND`  
**Source ref:** `main`  
**Finance execution authority:** `/AGENTS.md@CURRENT_MAIN`  
**Status:** presentation-source contract; no productive domain authority

## Purpose

The public `SvenKulessa/FRONTEND` repository is the leading upstream source for graphical components, visual slices and the presentation composition blueprint. Finance consumes that source without importing a second business/runtime authority.

## What the hourly sync may copy

The allowlist in `.github/frontend-upstream-sync.json` is intentionally narrow:

- graphical React components under `src/components/`;
- future UI-only feature slices under `src/features/<slice>/ui/`;
- shared UI, branding and visual primitives;
- visual image assets;
- `src/App.tsx` as a non-executable composition blueprint;
- `src/index.css` as a non-executable style blueprint.

The generated copy lives only under `docs/frontend/upstream-source/SvenKulessa-FRONTEND/`. TypeScript/CSS sources are stored with a `.source` suffix where applicable and are not imported by the Finance runtime.

## What the sync must never copy or activate

The sync does not copy upstream data, service/API, provider, auth, billing/Stripe, scoring, entitlement, server/runtime, package/dependency or environment/configuration authority. It does not install upstream dependencies and never runs upstream scripts.

A presentation file may reference mock/demo data in the upstream repository. Such a file can be mirrored as an inert design reference, but the manifest marks the file runtime-promotion-blocked. Finance must replace that dependency with an owner-correct adapter before any separately reviewed runtime promotion.

## Promotion boundary

Hourly sync means **source convergence, not automatic production mutation**.

Any later promotion from the inert mirror into `src/` requires a separate Finance PR that:

1. resolves the current Product/Owner/PVC boundaries from `CURRENT_MAIN`;
2. removes mock/demo/business authority from the component;
3. consumes canonical Finance contracts through adapters;
4. preserves Security/Compliance/QM gates;
5. passes exact-head Frontend architecture, TypeScript, tests and build checks;
6. remains Human/CODEOWNER merge-gated.

This contract deliberately prevents the public design repository from becoming a second auth, data, scoring, billing, provider or deployment authority.
