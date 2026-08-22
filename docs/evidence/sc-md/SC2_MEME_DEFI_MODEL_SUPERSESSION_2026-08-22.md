# SC-2 Meme Coin & DeFi Model Supersession — 2026-08-22

**Package:** Supersession B  
**Branch:** `feat/fintech-value-chain-supersession-2026-08-22`  
**Base at start:** `main@571de76e4d5f1d33460bf129d2231885dfde9584`  
**Protected authority:** ADR-0087 / `ScoringModelRegistry -> ScoringDispatcher`  
**Related authorities:** ADR-0099, ADR-0100  
**Promotion performed:** No  
**External mutation:** No

## 1. Purpose

This package replaces ambiguous Meme/DeFi research-model projections with versioned, fail-closed challenger contracts inside the existing single scoring architecture. It does not create a second scorer, dispatcher, registry, evidence store, queue, persistence layer, orchestrator or ranking authority.

Canonical chain remains:

```text
UAI
  -> verified Evidence / DQ
  -> versioned Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> registered Domain Executor
  -> CanonicalScoreResult
  -> Ranking / Eligibility
```

Meme and DeFi remain outside productive scoring because their registry entries are `lifecycle=challenger`, `scoreEligible=false`, `evidencePolicy=research-only`, `executorKey=research-only:not-executable`.

## 2. Main correlation findings

### 2.1 Meme legacy formula

`src/services/memeCoinScoringService.ts` contains a historical 35/25/20/20 weighting across liquidity, trend structure, momentum and volatility quality. This formula is not a current canonical score authority:

- the productive HTTP compatibility route is already shadowed behind the canonical dispatcher route;
- the service has no manipulation/rug-pull/contract-risk evidence;
- trend, momentum and volatility are correlated observations of the same price path;
- the historical service can return a numeric zero when no factor is available, which is incompatible with current `SCORE_NOT_COMPUTABLE`/no-interpolation governance if interpreted as a canonical result.

Supersession action: the historical formula is **not copied** into the new model contract. `crypto-meme-integrity@0.2.0` contains no executable weights and requires contract-integrity/manipulation evidence before any future promotion.

### 2.2 DeFi scale/activity correlation

DeFi TVL, fees and revenue are valid raw protocol evidence but materially overlap as protocol scale/activity observations. Treating them as three independent positive weights would create latent double counting.

Supersession action: `crypto-defi-fundamental@0.2.0` binds all three to correlation group `defi-scale-activity`. A future executable model must derive a validated latent factor or otherwise prove de-correlation before independent additive weighting.

### 2.3 DeFiLlama authority

DeFiLlama remains an evidence provider only. Official API documentation was revalidated on 2026-08-22 from `https://api-docs.defillama.com/llms.txt`:

- Free API: `https://api.llama.fi`, no authentication;
- Pro API: `https://pro-api.llama.fi/{KEY}`, authenticated and separate;
- Free endpoints include `/protocol/{protocol}` and `/overview/fees`.

No Pro API, API key, secret, provider-to-score route or direct dispatcher wiring is introduced.

## 3. Superseded model contracts

### Meme

- model: `crypto-meme-integrity@0.2.0`
- feature contract: `crypto-meme-research-features/0.2.0`
- state: challenger / research-only / non-executable
- no executable weights
- price-path correlation group: trend + momentum + volatility quality
- liquidity remains separate from popularity/community/manipulation semantics
- hard promotion prerequisites include governed contract-integrity and market-manipulation evidence

### DeFi

- model: `crypto-defi-fundamental@0.2.0`
- feature contract: `crypto-defi-research-features/0.2.0`
- state: challenger / research-only / non-executable
- no executable weights
- protocol scale/activity correlation group: TVL + fees + revenue
- separate risk/tokenomics/liquidity-concentration observations
- hard-gate evidence remains `protocol.smartContractEvidenceVerified` and `risk.oracleRiskWithinPolicy`

## 4. Missing / stale / invalid semantics

No missing evidence becomes zero or PASS.

DeFi service contract is raised to `defi-protocol-evidence/1.1.0`:

- `READY`: all emitted evidence is `VERIFIED`;
- `PARTIAL`: at least one evidence item is verified, but the set is incomplete/nonverified;
- `STALE`: no item is verified and at least one item is stale;
- `SOURCE_UNAVAILABLE`: no verified/stale usable source state remains;
- `UNSUPPORTED_ASSET` and `DISABLED` remain explicit.

The FinTech Core category feature contract already accepts only `VERIFIED` evidence as usable for REQUIRED/HARD_GATE definitions. `STALE` therefore never satisfies score-admission semantics.

## 5. Fingerprint / promotion rule

No effective-weight fingerprint is fabricated for a model with no executable weights. A future promotion must introduce, in the same reviewed model version:

1. explicit executable feature weights;
2. nominal-weights version;
3. effective-feature fingerprint;
4. effective-weight fingerprint;
5. evidence-contract version binding;
6. deterministic missing-evidence renormalization semantics, if renormalization is allowed at all.

This follows ADR-0087 and reuses the existing `scoringFingerprint` authority rather than adding a parallel fingerprint mechanism.

## 6. Classification versus scoring

Category/classification labels remain descriptive routing metadata. They do not establish score eligibility. A Meme or DeFi classification cannot select a challenger as a productive fallback because `ScoringModelRegistry.resolve(...)` resolves only canonical champions.

The current crypto champion remains:

`crypto-technical-provenance@0.7.0`

Supersession B does not change its weights, result contract, provider precedence, ranking semantics or execution path.

## 7. Regression guards

Added/updated tests cover:

- both Meme/DeFi contracts remain challenger, `scoreEligible=false`, `executableWeights=false`;
- Meme trend/momentum/volatility share one correlation group;
- DeFi TVL/fees/revenue share one correlation group;
- registry versions are `0.2.0` and use the new research feature contracts;
- crypto resolution still returns `crypto-technical-provenance@0.7.0`;
- DeFi top-level Evidence status cannot be READY when stale evidence is present;
- an all-stale DeFi Evidence set is explicitly `STALE`;
- unavailable/invalid evidence is not converted to partial verified coverage.

## 8. ADR-0100 lifecycle normalization

ADR-0100 is normalized from stale `1.0.0 / proposed` projection to `1.1.0 / accepted` for the evidence-only provider authority. Acceptance does **not** promote the DeFi model. The ADR now explicitly encodes stale fail-closed semantics and the TVL/fees/revenue correlation boundary.

## 9. No duplicate architecture

This package adds no:

- second `ScoringModelRegistry`;
- second `ScoringDispatcher`;
- Meme or DeFi canonical route-local scorer;
- DeFiLlama-to-score bypass;
- new persistence schema/table/queue;
- new EventMesh or Supervisor authority;
- new provider gateway;
- live execution capability.

## 10. Remaining promotion blockers

Meme remains blocked for productive category scoring until governed evidence exists for contract integrity/manipulation risk and the model is independently validated.

DeFi remains blocked for productive category scoring until protocol/token identity, DQ/freshness, multi-chain/fork handling, double-counted TVL treatment, latent-factor de-correlation and out-of-sample validation are documented and approved.

These are model-promotion blockers, not reasons to create another architecture.

## 11. Rollback

All Supersession-B changes are repository code/document/test changes. `git revert` restores the prior state. DeFi evidence acquisition can additionally be disabled with existing provider/evidence kill switches. No database, Render, Stripe, secret or custody rollback is required.
