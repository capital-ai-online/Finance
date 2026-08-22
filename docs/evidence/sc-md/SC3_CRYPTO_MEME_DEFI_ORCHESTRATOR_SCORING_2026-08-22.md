# SC-3 — Crypto Meme/DeFi Orchestrator Research Scoring & Added Feature Kit

**Date:** 2026-08-22  
**Status:** IMPLEMENTATION IN BRANCH  
**Branch:** `feat/crypto-meme-defi-orchestrator-scoring-2026-08-22`  
**Base:** `main@c1a81db2f75d9fbb0fb17ce4e6440967189ad6be` (PR #484 merged)  
**Claim:** `CRYPTO-MEME-DEFI-ORCHESTRATOR-SCORING-2026-08-22`

## 1. Source inputs

The implementation is grounded in two Owner-provided Google Drive PDFs:

1. `Fintech_meme_defi_tools` — file ID `1oydV1IUGJ1HKlnPoikuwFpJq2tZ_NLck`
   - DeFi utilization, revenue, liquidity, contract-security, oracle and tokenomics models;
   - Meme liquidity, market-structure, holder/distribution, rug/contract and social models;
   - sentiment aggregation, momentum model and regime examples;
   - provider/tool inventory and stress/risk concepts.
2. `erstelle ein Kit für den Enterprise Krypto Orchest3.pdf` — file ID `1Dfqwv0oVaCnL34AXHduHY-PpfzjW5Fo8`
   - trigger/structure/context timeframes;
   - regime-aware signal fusion;
   - multi-timeframe pattern confluence;
   - extended sentiment and momentum inputs;
   - L1-L4 kill-switch model and research risk limits;
   - production/live deployment examples.

Source material is requirements/research input, not an independent runtime authority.

## 2. Baseline correlation

Before implementation:

- PR #484 was confirmed merged;
- current `main` was `c1a81db2f75d9fbb0fb17ce4e6440967189ad6be`;
- open PR count was 0;
- branch was created exactly from that SHA;
- existing protected authorities were retained:
  - `ScoringModelRegistry`;
  - `ScoringDispatcher`;
  - `CanonicalScoreResult`;
  - `PatternResearchEngine` / `PatternSignalResolver`;
  - ADR-0100 DeFiLlama evidence-only boundary;
  - FT-5 Risk/Compliance decisions;
  - FT-6 PAPER-only and FT-7 live-execution block.

No second dispatcher, model registry, regime authority, pattern authority, queue or persistence authority was created.

## 3. Model stage and authority boundary

Meme and DeFi move from feature-inventory-only challenger `0.2.0` to source-backed research-model `0.3.0`.

Registry state remains:

```text
alias=challenger
lifecycle=challenger
evidencePolicy=research-only
executor=research-only:not-executable
scoreEligible=false
```

The deterministic evaluators calculate **research assessments**, not `CanonicalScoreResult`.
`CryptoOrchestrator.analyzeCategoryResearchModels(...)` delegates to the Scoring platform and returns only `scoreEligible=false` / `executionEligible=false` research context.

Productive model promotion remains a separate Owner-approved ADR-0087 model-governance step after provider coverage, backtesting, correlation review and regression evidence.

## 4. DeFi research model

### Top-level source weights

```text
fundamentals      0.20
utilization       0.18
liquidity         0.17
contractSecurity  0.15
governance        0.12
tokenomics        0.10
ecosystem         0.08
```

### Utilization

```text
activeUsers30d       0.25
transactionCount30d  0.20
organicVolume30d     0.20
tvlStability90d      0.15
retention30d         0.10
developerActivity    0.10
```

### Revenue/fundamental quality

```text
protocolFees30d          0.35
protocolRevenue30d       0.25
feeGrowth30d             0.20
revenueDiversification   0.20
```

TVL, fees and revenue remain grouped as `defi-scale-activity`; they are not promoted to three independent top-level weights.

### Liquidity

```text
poolDepth100k             0.25
volumeToLiquidityRatio    0.20
slippage100kQuality       0.20
liquidityPersistence30d   0.15
marketCount               0.10
liquidityDiversification  0.10
```

### Contract security

The source-defined factor weights are implemented for verified source, multiple audits, formal verification, immutable core, timelocked admin, multisig, exploit history, upgradeability, dependency risk and emergency-pause design.

Hard blockers include:

- smart-contract evidence not verified;
- oracle risk outside policy;
- unknown admin mint capability;
- unresolved exploit.

`unrestrictedPauseFunction` produces `RESTRICTED`; single-wallet upgrade authority remains an explicit warning.

### Oracle and tokenomics

Oracle source diversity, market depth, liveness, deviation protection, manipulation resistance and fallback quality are modeled separately from contract security.

Tokenomics covers unlock pressure, circulating-supply quality, value accrual, holder concentration, treasury runway and staking sustainability.

### Risk model

```text
contract      0.22
liquidity     0.16
oracle        0.15
governance    0.12
fundamentals  0.15
tokenomics    0.10
bridge        0.10
```

The source does not establish one universally governed top-level risk-penalty coefficient. Therefore `riskAdjustedScore` remains `null` unless an explicit research `riskPenaltyWeight` is supplied. No hidden default is invented.

## 5. Meme research model

### Top-level source weights

```text
liquidity        0.25
marketStructure  0.20
sentiment        0.18
narrative        0.15
distribution     0.12
exchangeAccess   0.10
```

### Liquidity/execution

```text
liquidityUsdQuality   0.30
slippage25kQuality    0.25
volumeConsistency7d   0.20
spreadQuality         0.15
liquidityLockQuality  0.10
```

### Market structure

```text
return1hQuality            0.25
return24hQuality           0.20
volumeAcceleration         0.20
relativeStrengthVsSector   0.15
breakoutQuality            0.10
fundingQuality             0.10
```

### Holder/distribution risk

Top-10, Top-50, team wallets, exchange concentration, sniper wallets and dormant-whale supply are composed once in the `meme-holder-distribution` family. The resulting distribution quality is `1 - holderRisk` and is not re-added as generic manipulation risk.

### Rug/contract risk

Mint authority, blacklist authority, tax-change authority, liquidity unlock, proxy upgrade, deployer concentration and honeypot simulation are one contract/rug family.

Hard blockers include:

- buy simulation failure;
- sell simulation failure;
- liquidity-lock policy failure;
- transfer-tax policy failure;
- contract-integrity evidence failure;
- manipulation evidence outside policy.

### Social authenticity

Unique authors, engagement quality, mention velocity, sentiment consensus, influencer diversity and bot resistance form one social-authenticity factor.

The source rule requiring at least **two independent market confirmations** is fail-closed: fewer than two confirmations produce `NOT_COMPUTABLE`, not a neutral/default score.

### Risk model

```text
liquidity      0.25
concentration  0.18
contract       0.18
market         0.17
sentiment      0.12
tokenomics     0.07
regulatory     0.03
```

## 6. Added feature kit

### Sentiment

`crypto-sentiment-research/0.1.0` extends the source decay model with the added-kit fields:

- polarity;
- intensity;
- novelty;
- credibility;
- bot probability;
- age/recency decay `exp(-0.045 * ageHours)`;
- source weight;
- mention intensity;
- regime adjustment;
- evidence references.

The source example returned `50` when no weighted denominator existed. CAPITAL-AI explicitly supersedes that behavior: absent/non-informative evidence yields `NOT_COMPUTABLE` and `score=null`.

### Momentum

`crypto-momentum-research/0.1.0` implements the source trend/flow model:

- H1/H4/D1 returns;
- trend strength;
- relative strength;
- volume ratio;
- volume acceleration;
- open-interest change;
- liquidity change;
- RSI/funding/liquidity overheat penalties.

Missing open-interest evidence is not replaced with zero. The flow weights are deterministically renormalized and the missing field remains explicit.

The added-kit features MACD histogram, ADX, trend slope, ATR percentage and volume expansion are now inventoried in the model output. The supplied material does not provide one authoritative weight vector for these five fields, so they remain **unweighted telemetry** until a governed model revision defines their contribution.

### Regime

No second market-regime taxonomy was introduced. Source phases are projected onto the existing `MarketRegime` contract:

```text
TREND_UP      -> BULL
TREND_DOWN    -> BEAR
ACCUMULATION  -> RANGE + phase annotation
PANIC         -> STRESS
ILLIQUID      -> STRESS
DISTRIBUTION  -> UNKNOWN + transition=true
VOLATILE      -> HIGH_VOLATILITY only when caller supplies a governed threshold
NEUTRAL       -> RANGE
```

### Pattern confluence

The added-kit pattern requirement reuses `PatternResearchEngine` and `PatternSignalResolver`; no new detector/authority is created.

Research confluence requires:

- `SUPPORTED_CONTEXT` from the existing resolver;
- at least two same-direction timeframes;
- at least one higher-timeframe confirmation (`>=4h`).

Pattern quality is an aggregation of already validated pattern evidence and remains research-only.

### Signal fusion

The source-defined research fusion is implemented as:

```text
regimeFit        0.30
momentum         0.25
patternQuality   0.20
sentiment        0.15
executionQuality 0.10
```

Source thresholds `tradeScore >= 70` and `regimeFit >= 60` are exposed only as `sourceThresholdsMet`. They **never** authorize an order and do not alter FT-5/FT-6/FT-7 controls.

### Kill-switch telemetry

The L1-L4 hierarchy is modeled as read-only research/risk telemetry:

- L1 soft pause;
- L2 session halt;
- L3 broker disconnect;
- L4 hard kill.

The evaluator returns recommended actions and `manualUnlockRequired`, but `executionEligible=false` and no order, broker, Render, Supabase, IAM or runtime mutation occurs.

The numeric limits from the added kit are retained as `RESEARCH_DEFAULT_NOT_PRODUCTION_POLICY`; they are not promoted into production risk policy.

## 7. Explicitly rejected / deferred source behavior

The added kit contains examples with `deployment.environment=production` and `mode=live`.
Those values are **not adopted**.

Current CAPITAL-AI invariant remains:

```text
RESEARCH      real=false simulated=false newOrders=false
PAPER         real=false simulated=true  newOrders=true
GUARDED_LIVE  real=false simulated=false newOrders=false
PRODUCTION    real=false simulated=false newOrders=false
EMERGENCY     real=false simulated=false newOrders=false
```

FT-7 remains blocked and requires a separate Owner-approved architecture/security decision.

FinBERT, additional social/news providers, order-book/derivatives providers, contract scanners, holder clustering, honeypot simulation, oracle/audit/governance evidence and alert transports are **feature/provider requirements**, not silently implemented external integrations in this branch. They must enter through the existing ProviderMatrix/Evidence/DQ architecture and be validated before model promotion.

## 8. Regression guards

Added/updated tests cover:

- exact source-defined Meme/DeFi composites;
- no implicit risk-penalty default;
- DeFi exploit/security hard blockers;
- invalid/missing normalized features -> `NOT_COMPUTABLE`;
- Meme market-confirmation requirement;
- Meme honeypot/contract hard blockers;
- sentiment no-evidence -> no neutral 50;
- momentum missing OI -> effective-weight renormalization;
- source-regime mapping into existing taxonomy;
- existing PatternSignalResolver confluence reuse;
- signal fusion remains non-executable;
- L4 kill-switch precedence;
- `CryptoOrchestrator` does not gain CanonicalScoreResult/Dispatcher authority;
- crypto canonical champion remains `crypto-technical-provenance@0.7.0`.

## 9. Promotion gap / next bounded work

Research implementation is not equivalent to productive model promotion. Remaining prerequisites include:

1. real provider adapters and DQ/freshness contracts for each required Meme/DeFi feature family;
2. protocol/token identity resolution for DeFi;
3. contract/holder/honeypot/oracle/audit/governance evidence adapters;
4. market/order-book/derivatives evidence coverage;
5. governed social/news sentiment evidence and model calibration;
6. correlation analysis across category score vs momentum/pattern/sentiment/regime;
7. out-of-sample/backtest/stress validation;
8. explicit Owner-approved promotion through the existing `ScoringModelRegistry -> ScoringDispatcher` path.

Until those gates are satisfied, Meme/DeFi remain research challengers and the crypto technical champion remains unchanged.
