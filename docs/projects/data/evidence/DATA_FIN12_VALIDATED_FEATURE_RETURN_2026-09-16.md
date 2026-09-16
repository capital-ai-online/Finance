# DATA FIN-12 validated feature return — Crypto fields, Fundamentals and History Handoff

**Date:** 2026-09-16  
**Project:** `CAPITAL-AI-DATA`  
**Folder:** `docs/projects/data/`  
**Primary Owner / PVC:** `CAPITAL-AI-DATA / PVC-09, PVC-10, PVC-11`  
**Branch:** `agent/data-fin12-validated-feature-return-20260916`  
**Initial current-main baseline:** `7c177a86fae05efc95bafee5967a9e4b3cb0ff3c`  
**Roadmap correlation:** `DATA-10`, `DATA-12`, `DATA-13`, `DATA-14`, `DATA-15`, `DATA-16`; downstream dependency `FIN-12`  
**Architecture:** `ADR-0041` + `ESS-0016`

## Purpose

Materialize the remaining DATA-owned contract return required by FINTECH `FIN-12` without creating a second provider, Data Quality, feature, scoring or ranking authority. DATA and FINTECH remain serially integrated: this DATA contract must first reach `main`; only then may a fresh FINTECH branch bind productive champion features to it.

## Crypto snapshot return

The canonical CoinGecko `MarketDataGateway` provider already returns one canonical snapshot containing price plus `marketCapUsd`, `volume24hUsd`, `circulatingSupply`, `maxSupply` and `totalSupply`. The previous validated DATA composition exposed only `price`.

`ValidatedDataInput/1.1.0` now materializes the additional crypto fields as field-addressable observations using the same canonical provider payload/evidence identity. `price` remains required. Extended market/supply fields are optional because provider truth can legitimately omit a field such as uncapped `maxSupply`.

An optional missing field remains `MISSING` with `value=null`; it does not become zero and does not invalidate otherwise admissible fields. Stale/invalid/wrong-identity input remains fail-closed.

## Field-level handoff semantics

`FintechDataHandoff` now distinguishes required and optional observations:

- aggregate DATA status is recomputed only from required observations;
- optional non-admissible observations are omitted rather than converted to numeric defaults;
- admissible optional numeric observations may cross `PVC-11 -> PVC-12` with provider/feed, evidence, observed/retrieved timestamps, freshness and correlation intact;
- duplicate field identities block the complete numeric handoff because feature identity would otherwise be ambiguous.

This preserves the existing fail-closed price behavior while allowing one canonical snapshot to carry the additional FIN-12 dimensions.

## Traditional fundamentals return

`server/stockFundamentals.ts` remains the existing DATA-owned provider compatibility facade for Alpha Vantage `OVERVIEW` and FMP `ratios-ttm`; foreign-owner consumers are not rewritten on this DATA branch. The facade now exposes `getValidatedStockFundamentalsInput()` as the canonical scoring-facing DATA bridge.

The validated fundamentals contract treats `peRatio`, `dividendYieldPct` and `profitMarginPct` as the productive required fields currently used by `traditional-features/2.1.0`. Additional supported fields remain optional.

Per-field provider candidates preserve exact provider/feed, evidence identity, source/reporting timestamp, retrieval timestamp and correlation. Differences between provider candidates are not averaged. Without an accepted tolerance/selection policy, differing values remain `UNKNOWN` and non-admissible.

The compatibility merge was tightened so its legacy returned value carries only the provenance of the provider value actually selected; concatenating unrelated provenance from both providers is no longer allowed.

Alpha Vantage `LatestQuarter` is preserved as source/reporting-period evidence. Local retrieval time is not substituted when a provider source timestamp is absent. The current FMP `ratios-ttm` compatibility path therefore remains non-admissible for the strict validated FINTECH exit when no provider observation timestamp exists.

## Fundamentals freshness

`data-freshness/1.1.0` introduces the `fundamentals` capability. Its default source-period maximum age is 180 days. This is a conservative DATA default for quarterly-style source evidence, not an assertion about any provider entitlement or guaranteed update cadence. A later owner-correct DATA-13 provider override may narrow it without creating a FINTECH-local freshness rule.

## Validated history return

The Signed-History semantics Human-merged through PR #1015 are projected through a new DATA-owned `projectValidatedHistoryInputForFintech()` boundary. `POSITIVE_PRICE` remains positive-only; `SIGNED_VALUE` retains finite negative/zero/positive values. Invalid identity, missing evidence, incomplete provenance or blocking status exports zero history points.

## Legacy convergence / Strangler disposition

Current main still has direct consumers of `src/services/cryptoSnapshotProvider.ts` and the compatibility API of `server/stockFundamentals.ts`. They are not deleted here because several consumers belong to FINTECH/Frontend scopes.

Disposition:

- canonical crypto replacement: `MarketDataGateway -> CoinGeckoMarketDataProvider -> CanonicalMarketDataSnapshot -> ValidatedDataInput`;
- `cryptoSnapshotProvider.ts`: `LEGACY_MIGRATION_REQUIRED / COMPATIBILITY_SHIM_STRANGLER` until owner-correct consumers cut over;
- `stockFundamentals.ts` provider compatibility facade: `COMPATIBILITY_SHIM_STRANGLER`; new scoring integration must use its validated DATA bridge, not raw `StockFundamentals`;
- raw provider payloads must not be introduced into FINTECH or Frontend.

A later transport-level fundamentals convergence must reuse the existing ProviderMatrix/shared provider transport or an accepted canonical fundamentals gateway; it must not manufacture another bespoke transport stack.

## Negative invariants

- no missing field -> zero conversion;
- no retrieval timestamp -> synthetic observed timestamp conversion;
- no cross-provider averaging;
- no FINTECH-local provider request or DQ fork;
- no Frontend scoring authority;
- no second scoring registry/dispatcher;
- no provider credential, subscription, deployment or production mutation in this work package.

## Validation truth

Focused source-level TypeScript syntax validation is performed in the execution host before PR creation. Full dependency-aware TypeScript, Vitest, lint, build and hosted checks remain `NOT RUN` pre-PR unless an actual runner becomes available. `NOT RUN` is never reported as `PASS`.

## Exit gate

This DATA return is complete when current exact-head evidence proves:

1. crypto market/supply fields are available as fail-closed validated observations;
2. traditional scoring fundamentals can be projected through the same validated DATA contract with exact field provenance;
3. signed validated history can cross the DATA -> FINTECH boundary without weakening value semantics;
4. missing/stale/conflicting/invalid/incomplete-provenance inputs export no affected numeric feature input;
5. no parallel provider/DQ/scoring authority is introduced.

The next FINTECH work package starts only after Human/CODEOWNER merge from the resulting then-current `main` and binds champion feature contracts to these DATA outputs.
