# FE-UPSTREAM-RUNTIME-PROMOTION-BOUNDARY-01 — Alert/Sentiment Presentation Boundary — 2026-09-24

## Routing

- Trust root: `/AGENTS.md@CURRENT_MAIN`
- Baseline: `main@881ac00bddc21d79c2a2356628971026d7f9b574`
- Project: `CAPITAL-AI-FE`
- Project folder: `docs/projects/frontend/`
- Relationship: cross-cutting presentation; no productive PVC
- Foreign productive owner: `CAPITAL-AI-FINTECH / PVC-09..17`

## Human direction

Separate the newer FRONTEND presentation from non-graphical demo/runtime behavior before any productive promotion. Reuse current Finance contracts instead of promoting mock market data, synthetic sentiment, browser persistence, simulated triggers or upstream analytics/SEO.

## Current-state correlation

Already owner-correct on CURRENT_MAIN:

- `src/features/public/ui/runtime/AssetLogo.tsx` is a presentation-only adapter.
- `src/features/public/ui/runtime/MarketSentimentPresentation.tsx` consumes the FINTECH sentiment projection and does not generate a local score/history.
- `GET /api/news/sentiment-projection` exposes the governed FINTECH research projection.

Not yet owner-correct for the new Price Alert presentation:

- `src/components/PriceAlert.tsx` consumes verified quotes, but alert state is still browser-persisted through `src/lib/alertStore.ts`.
- `server/alerts.ts` is a score-alert contract (`score_above | score_below`, threshold 0..10), not a price-threshold contract.
- therefore the new upstream `PriceAlertsContext`, `PriceAlertsModal` and `PriceAlertToast` cannot be mounted directly.

## Bounded FE implementation

This slice changes only promotion metadata/contract evidence and regression coverage:

1. add the new Price Alert source artifacts to `source-lock.json.deferredSourceArtifacts`;
2. document the exact presentation-vs-domain boundary in the upstream source contract;
3. add a regression test proving:
   - landing runtime does not import the upstream alert context/modal/toast;
   - Market Sentiment stays on the FINTECH projection without synthetic history/trigger logic;
   - the existing server alert endpoint is score-based and therefore cannot be silently repurposed as a price-alert backend.

No productive runtime component, route, provider, server handler, database schema or FINTECH scoring contract is changed.

## Foreign-owner handover

**Correlation ID:** `FE-PRICE-ALERT-BACKEND-HANDOVER-20260924`

Source Owner: `CAPITAL-AI-FE`  
Target Owner: `CAPITAL-AI-FINTECH / PVC-09..17`

Required target outcome:

- one canonical evidence-backed **price-threshold** alert contract;
- authenticated durable persistence rather than browser-only storage;
- verified quote evidence IDs/provider/observedAt/correlationId carried into alert state;
- fail-closed stale/unavailable/conflict handling;
- idempotent trigger/delivery lifecycle;
- read/create/update/disable API suitable for the FE modal/toast.

The existing score-alert API is retained for score alerts and is not overloaded.

## Exit evidence

- source lock explicitly defers all non-presentation upstream alert behavior;
- source contract states the FINTECH/backend dependency;
- regression test blocks direct PriceAlertsContext/localStorage/simulation promotion;
- Market Sentiment adapter remains bound to the FINTECH projection;
- no productive runtime file changes in this slice;
- exact-head repository checks pass;
- Human/CODEOWNER merge.
