# Phase 3.3 — AI Analysis Route Extraction Note

**Status:** Implementing  
**Date:** 2026-08-08  
**Parent decision:** [ADR-0083 — Server Runtime Architecture Consolidation](../adr/ADR-0083-server-runtime-architecture-consolidation.md)

> Formerly titled `ADR-0014 Phase 3.3`. The ADR-0014 number is reserved for Documentation Governance Validator. Parent is ADR-0083.

## Scope

This note records the Phase 3.3 implementation boundary under ADR-0083. It does not supersede ADR-0083.

The following compatibility-owned endpoints are extracted into canonical route factories under `server/routes/`:

- `GET /api/market-sentiment`
- `POST /api/market-sentiment/simulate-shock`
- `POST /api/portfolio-review`

## Provider invariants

`GET /api/market-sentiment` remains Gemini-specific because it uses Google Search Grounding. It MUST NOT be normalized into the generic multi-provider fallback chain unless the grounding architecture itself is changed by a separate decision.

The shock simulation and portfolio review remain structured-reasoning workloads on the established Anthropic -> OpenAI -> Gemini fallback chain through `generateStructuredWithFallback`.

## Parallel-work protection

This extraction does not modify `server.application.ts`, Render deployment configuration, Secret File validation, Stripe ingress, runtime artifact guards or scoring services. The later cutover that removes the equivalent inline handlers from `server.application.ts` must be performed from a freshly verified `main` head.

## Next step

After this additive extraction passes TypeScript, tests, production build and deployment-readiness gates, mount the new routers through the canonical application route composition and remove only the equivalent inline compatibility handlers. Then continue with market-data/provider adapter extraction.
