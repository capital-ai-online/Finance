# Work Package SC-4 — Gateway Hardening & Provider Matrix

**SPT:** SC-MD-SPT-0001  
**Priority:** P1  
**Status:** PHASE A LANDED — matrix + per-provider RL + gateway→supervisor health  
**Date:** 2026-08-16

## Goal

Alle **bekannten** Live-Provider und ihre Control-Plane-Parameter (Rate-Limit, Circuit Breaker, Gateway-Status) sind in einer kanonischen Matrix dokumentiert und an den MarketDataGateway angebunden. Supervisor sieht Gateway-Outcomes als Provider-Health.

## Delivered (Phase A)

- [x] `src/platform/MarketData/ProviderMatrix.ts` — kanonische Matrix (TwelveData, FMP Index, Alpaca shadow, FMP History, CoinGecko/Stooq legacy)
- [x] `RateLimitBudget.perProvider` — capacity/window pro Provider-ID
- [x] Default-Gateway-Budget aus Matrix (`rateLimitOverridesFromMatrix`)
- [x] `CircuitBreaker.openedUntilIso` für Supervisor `circuitOpenUntil`
- [x] `MarketDataGateway` schreibt `recordProviderHealth` bei success / failure / rate-limit / circuit-open
- [x] `traditionalQuoteEvidence` nutzt Matrix-Budgets auf TwelveData- und FMP-Index-Gateway-Pfaden
- [x] Unit tests `tests/unit/providerMatrix.test.ts`
- [x] Evidence unter `docs/evidence/sc-md/`

## Explicitly NOT done (follow-ups)

- [ ] Crypto Live-Pfade (CoinGecko etc.) hinter Gateway migrieren → **SC-5**
- [ ] Alpaca role `primary` Promotion (ADR-0041 Owner gate + 14-day evidence)
- [ ] History-Gateway CB/RL parity (P3C activation still Owner-gated)
- [ ] Per-provider CircuitBreaker threshold from matrix at construction (global defaults remain; matrix documents intended values)
- [ ] MCP plane / Alpha Vantage adapter

## DoD Phase A

1. Matrix listet gateway-relevant providers mit RL/CB  
2. Behind-gateway providers (TwelveData, FMP Index) nutzen Matrix-Budgets  
3. Supervisor Health erhält Gateway-Outcomes ohne Provider-Payloads  
4. Legacy-off-gateway providers sind inventarisiert, nicht still migriert  
5. Tests grün; keine scoreImpact-/Scoring-Mutation

## Risk

Niedrig–mittel: engere Rate-Limits können bei Last häufiger `rate_limited`/`UNAVAILABLE` erzeugen — fail-closed, kein Synthetic Fallback.
