# Evidence — SC-4 Phase A Gateway Hardening & Provider Matrix

**Date:** 2026-08-16  
**SPT:** SC-MD-SPT-0001  
**Claim:** `SC4-GATEWAY-HARDENING-PROVIDER-MATRIX-2026-08-16`

## What changed

| Area | Before | After |
|---|---|---|
| Rate limits | Global capacity for all provider IDs | `RateLimitBudget.perProvider` + matrix overrides |
| Provider inventory | Implicit in adapters | `ProviderMatrix` with gateway status |
| Supervisor health | Caller-side only (e.g. traditionalQuote) | Gateway also records snapshot outcomes |
| Circuit open metadata | Internal only | `openedUntilIso` → `circuitOpenUntil` |

## Gateway adoption (Phase A)

| Provider ID | Status |
|---|---|
| twelvedata | behind_gateway |
| fmp-index | behind_gateway |
| alpaca | shadow_only (not promoted) |
| fmp-index-history | history_gateway_only |
| coingecko | legacy_off_gateway (SC-5) |
| stooq | legacy_off_gateway (SC-5) |

## Invariants preserved

- No Demo Data / no synthetic prices on failure
- Alpaca remains shadow unless `includeShadow`
- scoreImpact / rankingImpact unchanged (`false`)
- No crypto scoring path migration in this WP

## Tests

- `tests/unit/providerMatrix.test.ts` — matrix, RL overrides, circuit ISO, health on success/rate-limit
- Existing `tests/unit/marketDataGateway.test.ts` remains authoritative for CB/cache/coalesce semantics

## Follow-up

SC-5 live coverage expansion for crypto + remaining traditional paths; Alpaca promotion remains ADR-0041 Owner gate.
