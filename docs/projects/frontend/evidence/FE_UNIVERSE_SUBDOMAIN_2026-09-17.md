# CAPITAL-AI Universe Subdomain — Frontend Evidence

**Date:** 2026-09-17  
**Project:** `CAPITAL-AI-FE`  
**Project folder:** `docs/projects/frontend/`  
**Primary productive PVC:** `N/A` — Frontend remains presentation/interaction only  
**Primary Owner:** `CAPITAL-AI-FE`  
**Roadmap:** `FE-PR900-01 — Universe branding consumers` / `FE-CARRY-01`  
**Baseline:** `main@4310fa4007278e925272c23149337d0b90c7a061`  
**Branch:** `agent/frontend-universe-subdomain-20260917`  
**Target host:** `universe.capital-ai.online`  
**State:** `IMPLEMENTED_ON_BRANCH / PRODUCTION_DOMAIN_NOT_MUTATED`

## Objective

Materialize a dedicated CAPITAL-AI Universe surface from the existing 16.08 branding contract, canonical asset-catalog metadata, FINTECH orchestration boundaries and the existing public analysis workbench without creating a second scoring, provider, DATA, IAM or execution authority.

The implementation deliberately reuses the existing application deployment and contracts instead of introducing a second web stack.

## Implemented Frontend slice

1. `UniverseHostBoundary` recognizes exactly `universe.capital-ai.online` plus `universe.localhost` for local development.
2. Only `/` on the Universe host is intercepted. The normal application root, legal routes and existing application routing remain unchanged for the canonical portal host.
3. The Universe root is resolved before `SessionComposition`, so the public subdomain does not depend on a second-origin browser session bootstrap.
4. `UniversePortal` projects the existing 16.08 visual system:
   - charcoal canvas / Vader Black;
   - Capital Gold;
   - decorative Intelligence Cyan and Universe Purple;
   - productive asset-class semantic colors for Krypto, Aktien, Indizes, Forex and Rohstoffe.
5. The visible Universe inventory is derived from `getAssetClassCounts()` and `getAssetCatalogIntegrity()` rather than duplicated hard-coded counts.
6. Bond remains absent from visible asset-class presentation according to `FE-PR900-02`; technical catalog identifiers are not removed.
7. The existing `PublicAnalysisWorkbench` is embedded directly. The public Enterprise Scorer remains BTC-fixed and protected/disabled tools preserve their existing gates.
8. No new API route, provider client, scoring function, entitlement decision or local score computation is introduced.

## FINTECH / DATA authority boundary

The surface describes and consumes the existing repository boundaries only:

- **Asset Catalog:** descriptive discovery metadata only;
- **Verified Observation / Display Evidence:** provider-backed values with provenance/freshness;
- **Canonical Score:** FINTECH-owned scoring output projected read-only into Frontend.

The displayed orchestrator capabilities preserve current-main semantics:

- `CryptoOrchestrator` remains Research/Enrichment; canonical crypto score remains separate;
- `RawMaterialsOrchestrator` remains Research/Sandbox-oriented; verified commodity scoring remains separate;
- FINTECH Registry/Dispatcher/Scoring authority remains outside React and outside the subdomain surface.

## Render / subdomain target architecture

Read-only Render correlation on 2026-09-17 resolved the existing production service:

- workspace: `AICapital`;
- service: `Finance` / `srv-d91o1o9o3t8c73edi55g`;
- region: Frankfurt;
- runtime: Docker;
- branch: `main`;
- auto deploy: disabled;
- Render host: `finance-7clq.onrender.com`.

The intended production topology is therefore a host alias to the existing service, not a second service:

```text
universe.capital-ai.online
        |
        | CNAME
        v
finance-7clq.onrender.com
        |
        v
existing CAPITAL-AI application / same APIs / same FINTECH + DATA authorities
```

No Render custom-domain mutation, IONOS DNS mutation, TLS verification or production deploy is performed by this Frontend branch.

## Required owner-correct production handoff

`CAPITAL-AI-OPS` must separately perform the protected external mutation after the Frontend PR is integrated and production activation is authorized:

1. register `universe.capital-ai.online` as a custom domain on the existing Render `Finance` service;
2. create the IONOS DNS singleton `universe CNAME finance-7clq.onrender.com` and ensure no conflicting record exists;
3. verify Render domain ownership and TLS issuance;
4. deploy the integrated `main` through the existing production pipeline;
5. prove host identity, HTTPS, health, root rendering and rollback path.

A new Render service is not required for this architecture.

## SEO handoff before indexable production activation

Current-main route SEO is rooted at `https://capital-ai.online`. Before the Universe subdomain is made intentionally indexable, `CAPITAL-AI-SEO` / owner-correct Operations wiring must decide and materialize the subdomain-specific canonical/meta/prerender policy. Until that handoff is complete, production activation must not claim independent search indexing readiness for the Universe host.

This Frontend slice does not silently change SEO authority or the current prerender/public-route allowlist.

## Security / session considerations

A subdomain is a separate browser origin. Browser Web Storage therefore does not share the canonical portal's local/session storage automatically. The Universe root intentionally renders before `SessionComposition` and links authentication-sensitive journeys back to the main portal. No cross-subdomain token copying, storage bridge or widened cookie scope is introduced.

## Validation truth

- current-main baseline before writes: `4310fa4007278e925272c23149337d0b90c7a061`;
- branch correlation after implementation: `5 ahead / 0 behind` before this evidence commit, merge base exact baseline;
- changed application scope before evidence: `src/app/App.tsx`, `src/features/universe/ui/*`, `tests/unit/universeSubdomainSurface.test.ts`;
- focused Vitest: `NOT RUN` pre-PR — cost-bearing/local runtime execution intentionally deferred; `NOT RUN` is not `PASS`;
- TypeScript: `NOT RUN` pre-PR;
- production build: `NOT RUN` pre-PR;
- browser/mobile verification on `universe.capital-ai.online`: `NOT RUN` because the protected domain mutation has not occurred;
- Render/IONOS production mutation: `NOT RUN`.

## Frontend exit gate

The Frontend slice is technically complete when the final exact PR head proves:

- exact host binding for `universe.capital-ai.online` without changing canonical portal root behavior;
- the Universe surface uses current branding tokens and existing semantic asset-class colors;
- catalog counts/integrity are derived from the canonical catalog implementation;
- no Bond presentation is reintroduced;
- no direct API/provider/scoring authority is added to `UniversePortal`;
- the existing Public Analysis Workbench remains the interactive consumer surface;
- source tests, TypeScript, relevant Frontend architecture checks and production build pass on the final PR head.

Production subdomain readiness is a separate OPS/SEO gate and is not implied by this repository evidence.
