# FT-2C Evidence — Technical Pattern Engine Foundation

**Evidence-ID:** `FT2C-PATTERN-ENGINE-FOUNDATION-2026-08-20`  
**Date:** 2026-08-20  
**Roadmap:** `FT-CORE-CRYPTO-01 / FT-2C`  
**ADR:** `ADR-0098`  
**Branch:** `feat/fintech-core-crypto-module-01`  
**Main baseline:** `0b8e4122ddaef6ad6671a219f262b17240d65500`

## Purpose

FT-2C introduces the technical-pattern **research foundation** required by the Owner-provided FinTech Enterprise Orchestration Model without creating a new scoring or trading authority.

The source requires pattern interpretation to depend on:

- higher vs. lower timeframe,
- pattern structure class,
- breakout quality,
- volume confirmation,
- support/resistance context,
- market regime,
- asset/timeframe-specific historical reliability,
- data quality,
- walk-forward/out-of-sample validation including realistic costs.

The implementation preserves these as distinct evidence dimensions. It intentionally does not invent a new weighted `finalScore` formula.

## Implemented components

### 1. Detector-agnostic contract

`src/platform/FinTechCore/Modules/Crypto/Pattern/PatternDetectionContracts.ts`

Contract version:

`fintech-core.crypto/pattern-detection/0.1.0`

Defines:

- provenance-backed OHLCV bars,
- asset/timeframe/regime/data-quality request identity,
- detector descriptor and supported-pattern declaration,
- research-only detection result,
- request validation for timestamps, OHLC geometry, volume and evidence references.

No TA-Lib or other detector implementation is bound in this phase.

### 2. Pattern Reliability Registry

`src/platform/FinTechCore/Modules/Crypto/Pattern/PatternReliabilityRegistry.ts`

Contract version:

`fintech-core.crypto/pattern-reliability-registry/0.1.0`

Reliability identity is exact across:

```text
assetId
+ analysisProfile
+ timeframe
+ marketRegime
+ patternId
+ validationVersion
```

There is deliberately no cross-asset, cross-timeframe or cross-regime fallback.

Metrics include:

- occurrence count,
- win rate,
- average win/loss,
- expectancy,
- profit factor,
- maximum drawdown,
- net PnL after costs,
- Sharpe,
- training and validation windows,
- walk-forward flag,
- fees/slippage/funding inclusion.

### Research validation defaults

The Owner-source values are implemented only under authority marker:

`RESEARCH_VALIDATION_NOT_PRODUCTION_POLICY`

Sufficiency requires at least:

- 100 occurrences,
- 730 training days,
- 180 validation days,
- walk-forward validation,
- fees included,
- slippage included,
- funding included,
- source-defined regime split.

After sufficiency, source research rejection conditions are:

- Sharpe < 0.5,
- expectancy < 0,
- max drawdown > 25%.

A forged `VALIDATED` record cannot be loaded into the Registry: the Registry recomputes the deterministic validation state and rejects a mismatch.

## 3. Pattern Signal Resolver

`src/platform/FinTechCore/Modules/Crypto/Pattern/PatternSignalResolver.ts`

Contract version:

`fintech-core.crypto/pattern-signal-resolver/0.1.0`

The resolver only accepts pattern evidence when:

- the pattern exists in the governed catalog,
- group and source start-weight match the catalog,
- evidence references and observation time are present,
- data quality is valid and at least the source research default 0.80,
- an exact Reliability Registry record exists,
- that exact record is `VALIDATED`.

Resolution is lexicographic, not a new scoring model:

1. higher timeframe,
2. governed pattern group/structure priority,
3. breakout evidence,
4. volume confirmation,
5. context/level evidence,
6. market-regime fit.

Opposing directions at the same precedence produce:

`CONFLICTING_EVIDENCE`

rather than an arbitrary direction.

Lower-precedence contradiction remains traceable under `suppressed` evidence.

Outputs are restricted to:

- `SUPPORTED_CONTEXT`,
- `CONFLICTING_EVIDENCE`,
- `NOT_COMPUTABLE`.

They never produce BUY/SELL, position size, CanonicalScoreResult or OrderIntent.

## 4. Pattern Research Engine

`src/platform/FinTechCore/Modules/Crypto/Pattern/PatternResearchEngine.ts`

Contract version:

`fintech-core.crypto/pattern-research-engine/0.1.0`

The engine:

- accepts one asset across one or more timeframe requests,
- validates governed OHLCV input,
- invokes an injected research-only detector,
- verifies detector identity and declared pattern support,
- verifies detector output matches asset/timeframe/regime,
- aggregates pattern evidence,
- resolves against the exact Reliability Registry.

The engine performs no:

- market-data provider fetch,
- score calculation,
- ScoringDispatcher invocation,
- OrderIntent creation,
- execution/custody call,
- Supabase/Render mutation.

All outputs remain:

```text
scoreEligible     = false
executionEligible = false
authority         = RESEARCH_CONTEXT_ONLY
```

## Open-source evaluation

TA-Lib remains the preferred later proof-of-concept candidate for standard indicator/candlestick detection primitives because it is actively maintained and exposes a broad pattern-recognition surface.

It is intentionally not installed in FT-2C foundation because:

1. the Owner model includes structure/breakout patterns beyond candlestick primitives;
2. detector implementation must not own reliability/context/governance;
3. Node/native Docker integration would widen dependency and build risk;
4. a detector PoC needs separate supply-chain/license/build/performance evidence.

No `technicalindicators` or Tulip runtime dependency is added either.

## Research evidence interpretation

Current external research supports treating candlestick/pattern effects as conditional and data-dependent rather than universal constants. This reinforces the exact-key Reliability Registry and the prohibition on hard-coded global win rates.

## Tests added

- `tests/unit/fintechCorePatternDetectionContracts.test.ts`
- `tests/unit/fintechCorePatternReliabilityRegistry.test.ts`
- `tests/unit/fintechCorePatternReliabilityIntegrity.test.ts`
- `tests/unit/fintechCorePatternSignalResolver.test.ts`
- `tests/unit/fintechCorePatternResearchEngine.test.ts`
- `tests/architecture/fintechCoreAuthorityBoundary.test.ts` extended

Negative/fail-closed cases include:

- invalid/out-of-order OHLCV,
- insufficient walk-forward/sample/cost evidence,
- weak research reliability,
- forged validated reliability status,
- missing exact reliability key,
- data quality below 0.80,
- equal-precedence direction contradiction,
- mixed-asset detector requests,
- detector identity mismatch,
- undeclared emitted patterns,
- direct productive scorer/database/exchange coupling,
- external TA runtime binding in the foundation.

## Parallel PR correlation

At this checkpoint:

- PR #459 affects frontend architecture only and does not overlap FinTechCore paths.
- PR #460 affects Documentary/Supervisor governance and both ADR/document registries.
- This workstream therefore performs no additional registry mutation until the next mandatory main/open-PR reconciliation.

## Validation status

Branch was synchronized to `main@0b8e4122ddaef6ad6671a219f262b17240d65500` with `behind_by=0` before FT-2B/FT-2C implementation.

No expensive GitHub CI was triggered. Connector-only execution cannot claim TypeScript, Vitest or production build PASS; these remain mandatory before PR merge readiness.
