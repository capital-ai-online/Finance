# FINTECH Evidence — Altcoin Pattern Research Profile

**Evidence-ID:** `FINTECH-ALTCOIN-PATTERN-RESEARCH-2026-09-18`  
**Date:** 2026-09-18  
**Project / Owner:** `CAPITAL-AI-FINTECH`  
**PVC:** `PVC-12..PVC-16` (feature/research/scoring boundary)  
**Baseline:** `main@cb2063ce7ac738ac0a6dcfece84d9e1089f4f82b`  
**Source:** Owner-provided research export supplied in the active ChatGPT work context.

## Purpose

The Owner reference describes an Altcoin PatternScorer centered on 4h/1d pattern recognition,
multi-factor confirmation and a source-defined reference score. This slice maps that source into the
existing FT-2C pattern architecture instead of creating a second detector, provider ingress, registry,
dispatcher or canonical scoring authority.

The resulting chain is:

```text
governed OHLCV evidence
  -> PatternDetectionContract
  -> PatternResearchEngine
  -> PatternReliabilityRegistry (exact asset/profile/timeframe/regime validation)
  -> PatternSignalResolver
  -> AltcoinPatternResearchScorer (Owner-reference comparison only)
  -> CryptoOrchestrator research projection
  -> Frontend read-only visualization handover
```

`CanonicalScoreResult`, ranking/eligibility and execution remain outside this reference scorer.

## Source-to-code mapping

### Source-defined scored patterns

The reference configuration supplies complete base-score/boost rules for:

| Pattern | Source reference base | Supported reference timeframes | Source confirmation boosts |
|---|---:|---|---|
| Inverse Head & Shoulders | 85 | 4h, 1d | volume breakout ratio >= 1.3 (+10), RSI14 cross above 50 (+8), near major support (+7) |
| Head & Shoulders | 82 | 4h, 1d | volume breakout ratio >= 1.3 (+10), RSI14 cross below 50 (+8) |
| Double Bottom | 82 | 4h, 1d | second-low volume condition (+6), MACD histogram turns positive (+7) |

The supplied formula is represented literally as:

```text
referenceScore = min(100, referenceBaseScore + sum(met source confirmation boosts))
referenceThreshold = 75
```

The threshold is exposed only as `referenceThresholdMet`. It is **not** called a signal and cannot
authorize ranking, trading or execution.

### Source-mentioned patterns without complete scoring formula

The reference also highlights flags, channels, triangles, pennants, range/compression breakouts and
similar structures. CAPITAL-AI already contains matching catalog families. Because the supplied
reference does not define a complete scoring rule for these patterns, the new profile records them as
`catalogOnlyPatternIds`; the evaluator returns `NOT_COMPUTABLE` instead of inventing weights.

### Confirmation layer

The reference emphasizes volume, RSI, support/resistance and MACD confirmation. The new confirmation
contract carries only source-defined inputs needed by the scored patterns and requires:

- exact pattern/timeframe identity;
- valid observation timestamp;
- at least one evidence reference;
- no missing-to-positive substitution.

Missing optional boost evidence contributes zero and remains visible in
`missingConfirmationFields`.

## Reliability boundary

The numerical values in the supplied reference are treated as **reference priors/configuration**, not
as validated CAPITAL-AI asset-specific hit rates. Before this evaluator can return `READY`, the
existing `PatternSignalResolver` must already have a `SUPPORTED_CONTEXT` primary candidate, which
in turn requires an exact `PatternReliabilityRegistry` record for:

```text
assetId + profileId + timeframe + marketRegime + patternId + validationVersion
```

This preserves the FT-2C rule that general literature/backtest claims cannot replace exact
asset/timeframe/regime reliability evidence.

## CryptoOrchestrator extension

`CryptoOrchestrator.analyzeAltcoinPatternResearch(...)` delegates to the FINTECH evaluator. The
orchestrator does not duplicate the formula and does not acquire scoring authority.

Returned authority markers are fixed:

```text
scoreEligible=false
executionEligible=false
canonicalScoreImpact=NONE
authority=RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE
```

## Provider / data-source decision

No new Binance, CoinGecko, CoinPaprika or DEX adapter is introduced by this slice. The repository
already owns provider/evidence paths and validated-data boundaries. The source document's low-budget
provider suggestions remain research input only; creating a second market-data ingress for this
feature would violate the current one-authority design.

## Frontend handover

Frontend may render this assessment only as read-only research context. Required presentation rules:

- Krypto semantic color uses the canonical `Krypto Purple` token.
- Source/reference score is labeled **Pattern Research Score**, never `Canonical Score`.
- `scoreEligible=false`, `executionEligible=false` and unavailable/missing evidence are visible.
- 4h and 1d are the primary reference lanes.
- Pattern details may expose the source confirmation factors and evidence count.
- No browser-side score calculation and no fallback value when the FINTECH assessment is absent.

## Validation

Added unit coverage proves:

1. the complete Inverse-H&S source formula is applied deterministically and capped at 100;
2. catalog-only patterns without a complete source formula fail closed with `referenceScore=null`;
3. pattern/timeframe identity mismatch fails closed;
4. missing confirmation inputs are not silently interpreted as positive evidence.

Hosted build/test evidence is intentionally deferred until Pull Request creation under repository
cost-control policy.

## Model-risk benchmark

As an engineering benchmark, the April 17, 2026 Federal Reserve/OCC/FDIC Revised Guidance on Model
Risk Management emphasizes intended use, limitations, validation and ongoing monitoring when model
use is extended. No claim is made that the guidance is legally applicable to CAPITAL-AI. This slice
uses the benchmark only to reinforce the existing research-vs-production promotion boundary.
