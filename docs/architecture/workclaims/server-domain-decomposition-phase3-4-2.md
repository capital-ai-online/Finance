# Work Claim — ADR-0014 Phase 3.4.2

Status: ACTIVE
Owner scope: server market-data coordination
Base: main after PR #115

## Claimed paths

- `server/marketData/**`
- `tests/server/marketDataCoordinator.contract.test.ts`

## Explicitly protected / not modified

- `server.application.ts`
- `server/validateRuntimeSecrets.ts`
- `server/stockFundamentals.ts`
- `server/fmpIndices.ts`
- `src/lib/assetRegistry.ts`
- crypto/meme/traditional scoring services
- Stripe ingress/durable inbox
- Render/Docker/runtime-artifact guard configuration

## Intent

Extract the orchestration semantics of `fetchLiveMarketData()` before moving provider-specific implementations. Provider order, fail-open fallback behavior, provenance labels and best-effort snapshot persistence must remain behavior-preserving during the later cutover.
