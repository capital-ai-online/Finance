# Phase 3.4.4 — Crypto/Stooq Provider Stages

**Status:** Implementing  
**Parent decision:** [ADR-0083 — Server Runtime Architecture Consolidation](../adr/ADR-0083-server-runtime-architecture-consolidation.md)

> Formerly titled `ADR-0014 Phase 3.4.4`. Parent is ADR-0083.

This phase wires the already extracted crypto provider chain behind the canonical `MarketDataProviderStage` contract and extracts Stooq into the same stage model.

Invariants:

- Crypto provider priority remains Binance -> Kraken -> Coinbase -> explicit static fallback.
- Stooq remains the authoritative HTTP provider for stocks, forex and mapped commodities in this compatibility path.
- Missing Stooq volume is not synthesized; existing fallback metadata may be retained, but the provider stage does not fabricate new market evidence.
- FMP index coordination remains a separate stage and separate change.
- R-001 score provenance, R-002 runtime immutability, R-003 Stripe ownership and the temporary TOTP secret diagnostics from PR #118 are outside this workstream.
- `server.application.ts` is not modified in this phase. Its compatibility cutover remains a separately validated change after all provider stages exist.
