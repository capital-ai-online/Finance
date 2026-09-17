# CAPITAL-AI Universe Route — Frontend Evidence

**Date:** 2026-09-17  
**Project:** `CAPITAL-AI-FE`  
**Project folder:** `docs/projects/frontend/`  
**Primary productive PVC:** `N/A` — Frontend remains presentation/interaction only  
**Primary Owner:** `CAPITAL-AI-FE`  
**Roadmap:** `FE-PR900-01 — Universe branding consumers`  
**Baseline:** `main@4310fa4007278e925272c23149337d0b90c7a061`  
**Branch:** `agent/frontend-universe-subdomain-20260917`  
**Canonical URL:** `https://capital-ai.online/universe`  
**State:** `IMPLEMENTED_ON_BRANCH / PRODUCTION_NOT_DEPLOYED`

## Objective

Expose the CAPITAL-AI Universe surface at the canonical same-origin path `https://capital-ai.online/universe` using the existing 16.08 branding contract, canonical asset-catalog metadata, FINTECH orchestration boundaries and public analysis workbench without creating a second scoring, provider, data-quality, IAM or execution authority.

The earlier subdomain design in this branch has been superseded before merge. No custom-domain, DNS, TLS or cross-origin setup is required for the requested route.

## Implemented route slice

1. `UniversePathBoundary` recognizes exactly `/universe` and renders `UniversePortal` before session composition.
2. The canonical portal root `/` and all existing routes retain their current behavior.
3. `UniversePortal` projects the existing visual system: charcoal/Vader Black, Capital Gold, decorative Cyan/Purple and the productive semantic asset colors for Krypto, Aktien, Indizes, Forex and Rohstoffe.
4. Visible Universe inventory uses `getAssetClassCounts()` and `getAssetCatalogIntegrity()`; no duplicated asset-count authority is introduced.
5. Bond remains absent from visible Universe presentation according to `FE-PR900-02`; technical identifiers remain untouched.
6. The existing `PublicAnalysisWorkbench` remains the interactive tool surface. The public Enterprise Scorer stays BTC-fixed and existing protected/disabled tools preserve their gates.
7. No direct API, provider, scoring or entitlement logic is added to `UniversePortal`.

## FINTECH data boundary

The page keeps the three canonical concerns separate:

- **Asset Catalog:** descriptive discovery metadata only;
- **Verified Observation / Display Evidence:** provider-backed values with provenance/freshness;
- **Canonical Score:** FINTECH-owned scoring output projected read-only into Frontend.

`CryptoOrchestrator`, `RawMaterialsOrchestrator` and FINTECH Registry/Dispatcher/Scoring remain upstream authorities. PVC-09..11 data-ingress/evidence/DQ ownership is part of `CAPITAL-AI-FINTECH` under the current ownership supersession. The Universe route is a presentation consumer only.

## Production route wiring

The same-origin public URL is wired through all current public-route surfaces:

```text
https://capital-ai.online/universe
        |
        +--> UniversePathBoundary -> UniversePortal
        +--> routeSeo canonical/meta
        +--> PUBLIC_SPA_PATHS
        +--> production SPA fallback
        +--> dist/universe/index.html prerender
        +--> public/sitemap.xml
```

This removes the need for the previously proposed `universe.capital-ai.online` DNS/CNAME/custom-domain path. The existing Render service and normal `capital-ai.online` TLS/domain configuration are reused unchanged.

## SEO behavior

`/universe` is explicitly public/indexable and receives:

- canonical URL `https://capital-ai.online/universe`;
- route-specific title and description;
- OpenGraph/Twitter URL projection;
- prerendered `dist/universe/index.html` shell;
- sitemap entry;
- trailing-slash normalization through the existing server policy.

The existing `tests/unit/seoPublicRouteSitemap.test.ts` requires route inventory parity across route SEO, sitemap, prerender, server allowlist and public HTML fallback.

## Security / session behavior

Because `/universe` is same-origin with `capital-ai.online`, no cross-subdomain Web Storage, cookie-domain, token-copy or CORS bridge is required. The route is resolved before `SessionComposition`, preserving a fast public surface while existing authenticated journeys remain on the same origin.

## Validation truth

- current-main baseline before the original slice: `4310fa4007278e925272c23149337d0b90c7a061`;
- current main remained unchanged during this route pivot;
- source regression was updated to require `/universe` across the client, server, prerender and sitemap surfaces;
- focused tests: `NOT RUN` locally; post-PR CI is authoritative and `NOT RUN` is not `PASS`;
- TypeScript: `NOT RUN` locally;
- production build/prerender: `NOT RUN` locally;
- production/browser readback at `https://capital-ai.online/universe`: pending integration and deployment.

## Historical activation boundary

This evidence does not activate or preserve a work item by itself. `historical/non-terminal != active`. Any continuation requires a currently active canonical identity from `CURRENT_MAIN` or fresh Human/Owner direction in the current interaction.

## Exit gate

The route slice is ready for Human/CODEOWNER consideration only when the final exact PR head proves:

- `/universe` renders the Universe surface directly;
- direct production navigation is allowed and does not soft-404;
- route SEO, prerender, server public inventory and sitemap remain equal;
- current branding and five visible asset-class semantics are preserved;
- no Bond presentation or local scoring/provider authority is introduced;
- relevant unit, TypeScript, Frontend architecture, SEO route-consistency, security/CSP and production build checks pass on the final PR head.

Production availability still requires normal Human/CODEOWNER merge followed by the existing production deployment control. No DNS or custom-domain mutation is required.
