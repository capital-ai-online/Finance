# P1 — Deterministic Portfolio Allocation / Position-Sizing Foundation

**Date:** 2026-08-24  
**Status:** IMPLEMENTED ON MAIN-SYNC BRANCH / PRE-PR VALIDATION PENDING  
**Branch:** `feat/fintech-core-p1-portfolio-allocation-main-sync-2026-08-24`  
**Base:** `main@14e4f3c8a309faae63fb336a432aac38ab08ceda`  
**Claim:** `FINTECH-CORE-P1-PORTFOLIO-ALLOCATION-PROVIDER-GAPS-2026-08-24`  
**Architecture authority:** ADR-0099  
**Protected scoring authority:** ADR-0087

## 1. Main synchronization decision

The predecessor branch `feat/fintech-core-p1-portfolio-allocation-provider-gaps-2026-08-23` was revalidated before continuation.

At resumption:

```text
current main = 14e4f3c8a309faae63fb336a432aac38ab08ceda
legacy P1 branch ahead = 23 commits
legacy P1 branch behind = 81 commits
legacy merge base = 800b05261c1792fed5138a8125cf6a00b1f5af07
open pull requests = 0
```

The old branch was therefore retained only as traceable implementation evidence. P1 was selectively ported to a fresh branch from current `main`; stale ADR, roadmap, registry and provider projections are not copied blindly.

## 2. Owner / reference requirement

The P1 priority closes the missing deterministic portfolio-allocation / position-sizing stage between an externally governed strategy/target allocation and FT-5 Risk/Compliance.

The Owner-provided Google Drive reference `FinTech Enterprise Orchestration Modell_1881859777413601727.pdf` (file ID `15TtZwH1be6si8mEuo7Xc6inq_e21brfa`) describes the logical chain as approximately:

```text
research / signal context
  -> governed portfolio target
  -> deterministic constraints / sizing
  -> target-vs-current delta
  -> deterministic risk
  -> compliance
  -> OrderIntent
```

The Drive document is architecture/research input, not runtime authority. CAPITAL-AI keeps ADR-0087, ADR-0099, FT-5 and FT-6B authoritative.

## 3. Reuse-first decision

P1 reuses:

- `FinTechCoreWorkflowContext` for run/trace/correlation/strategy/portfolio/decision identity;
- `FinTechCoreFixedPoint` (`atoms:string + scale:number`) for every financial notional;
- existing external/versioned policy-snapshot pattern;
- existing Evidence/Data-Quality and attributable evidence conventions;
- FT-5 `FinTechCoreRiskEvidenceSnapshot` as the risk input contract;
- `evaluateDeterministicRiskGates(...)` as the only Risk decision authority;
- FT-6B as the only canonical OrderIntent binding authority;
- `ProviderMatrix` as the single provider inventory.

No new scoring, strategy, suitability, risk-approval, provider-registry, queue, persistence, execution or custody authority is introduced.

## 4. Open-source assessment

P1 reviewed established portfolio-optimization libraries before custom implementation.

| Candidate | Fit | License / maintenance | Integration assessment | Decision |
|---|---|---|---|---|
| PyPortfolioOpt | broad optimizer set | MIT / active | Python numerical runtime is unnecessary for bounded deterministic policy/constraint evaluation | not integrated |
| Riskfolio-Lib | broad portfolio/risk optimization | BSD-3-Clause / active | Python/CVXPY/scientific dependency surface is disproportionate for this P1 contract | not integrated |
| cvxportfolio | strong multi-period optimization | GPLv3 / maintained | Python runtime and GPL integration/licensing surface are unnecessary here | not integrated |

P1 deliberately does **not** reimplement an optimizer. It consumes explicit, governed target weights and only validates/sizes them deterministically. A future optimizer can sit upstream behind a separately reviewed strategy/suitability authority while reusing the same P1 contract.

## 5. Allocation contract

Contract:

```text
fintech-core/portfolio-allocation/0.1.0
```

Files:

```text
src/platform/FinTechCore/Portfolio/PortfolioAllocationContracts.ts
src/platform/FinTechCore/Portfolio/DeterministicPortfolioAllocator.ts
```

Inputs:

```text
FinTechCoreWorkflowContext
+ versioned allocation policy
+ complete portfolio valuation evidence
+ explicit target weights
  + targetAuthorityId
  + targetAuthorityVersion
  + evidenceRefs
```

Output:

```text
PROPOSED
+ current/target weights
+ current/target/delta notionals
+ concentration/deployment/cash checks
+ deterministic replay hashes
+ evidence lineage
+ executionHandoffEligible=false
```

The proposal exposes `quoteScale` explicitly so downstream bounded projections cannot silently assume the financial scale.

## 6. Authority boundary

P1 is **not**:

- a second scoring engine;
- an optimizer or investment-strategy generator;
- a score-to-weight function;
- a client suitability/risk-tolerance engine;
- a Risk or Compliance approval engine;
- an OrderIntent authority;
- an execution gateway.

Target weights are explicit governed input. Every target carries authority ID/version and evidence references. FinTechCore never derives target weight from caller tier/confidence, LLM output, raw provider values, Meme/DeFi research score or `CanonicalScoreResult` without a separately governed strategy/allocation authority.

For regulated portfolio-management use, suitability, client knowledge/experience, investment objectives, risk tolerance and loss-bearing capacity remain upstream governed responsibilities. P1 only evaluates the supplied target plan against deterministic portfolio constraints.

## 7. P1 constraint model

Supported modes:

```text
RESEARCH
PAPER
```

Explicitly blocked:

```text
GUARDED_LIVE
PRODUCTION
EMERGENCY
```

Portfolio policy is initially:

```text
longOnly = true
leverageAllowed = false
```

Policy constraints:

- `maxAssetWeightBps`;
- `maxPortfolioDeploymentBps`;
- `minCashReserveBps`;
- `rebalanceThresholdBps`;
- explicit quote asset / `quoteScale`;
- policy ID/version/evidence.

Fail-closed conditions include invalid workflow identity/time, missing/mismatched portfolio ID, invalid policy/evidence, future portfolio evidence, duplicate assets, quote-asset conflicts, invalid Fixed Point, accounting imbalance, missing target authority/evidence, invalid BPS, concentration/deployment/cash-reserve breach and unsupported short/leverage semantics.

## 8. Deterministic financial arithmetic

All financial values remain `FinTechCoreFixedPoint`.

```text
targetNotionalAtoms = floor(totalEquityAtoms * targetWeightBps / 10000)
deltaNotionalAtoms  = targetNotionalAtoms - currentNotionalAtoms
```

Flooring is deterministic and conservative. Rounding residual remains in derived cash reserve rather than being silently assigned to another asset.

Equivalent target ordering is normalized before hashing.

## 9. Bounded FT-5 portfolio-risk projection

New contract:

```text
fintech-core/portfolio-risk-projection/0.1.0
```

File:

```text
src/platform/FinTechCore/Portfolio/PortfolioRiskEvidenceProjection.ts
```

The projection intentionally produces only the portfolio-derived fields already required by FT-5:

```text
projectedGrossExposure
currentEquity
portfolioEvidenceAuthorityId
portfolioEvidenceRefs
```

It does **not** produce:

```text
orderNotional
peakEquity
availableLiquidity
market freshness evidence
counterparty evidence
Risk decision
Compliance decision
```

Those fields remain independent evidence inputs under existing FT-5 policies/authorities.

The projection requires its own explicit `projectionAuthorityId` / version / evidence and records the underlying portfolio-valuation authority separately. FT-5 can therefore bind `riskPolicy.portfolioEvidenceAuthorityId` to the governed projection authority instead of accepting an unreviewed caller substitution.

## 10. Projection integrity

Before projection:

- proposal / portfolio IDs and quote identity must match;
- allocation input/output hashes must have canonical SHA-256 lineage form;
- proposal, valuation and position evidence must be attributable;
- projection time may not precede source evidence;
- all target notionals and current equity must use the proposal quote scale;
- target-weight + cash-weight must equal 10,000 bps;
- target notionals + reserved cash must exactly equal current equity.

`projectionHash` binds:

- projection contract version;
- run/trace/correlation/portfolio/decision identity;
- projection authority ID/version;
- underlying portfolio-valuation authority;
- source allocation input/output hashes;
- projected FT-5 fields;
- projection timestamp.

The source allocation hashes are replay-lineage identifiers, not digital signatures. The projection independently rechecks the financial aggregate and authority/evidence invariants relevant to FT-5 gross-exposure evidence.

## 11. FT-5 integration behavior

Regression coverage composes the P1 projection with independent order, peak-equity, liquidity, market and counterparty evidence and passes the completed `FinTechCoreRiskEvidenceSnapshot` to the existing `evaluateDeterministicRiskGates(...)`.

Only FT-5 may return `APPROVED`/`REJECTED`/`NOT_COMPUTABLE`/`REVIEW_REQUIRED` for Risk.

A negative test deliberately changes the FT-5 expected portfolio authority to the raw valuation authority. The existing FT-5 `GROSS_EXPOSURE` gate then returns `NOT_COMPUTABLE`, proving P1 cannot bypass the versioned authority binding.

P1 itself always remains:

```text
executionHandoffEligible=false
```

## 12. Persistence / EventMesh decision

P1 introduces **no new table, queue, journal or speculative event type**.

Reason:

- the P1 result is a RESEARCH/PAPER proposal/evidence artifact, not an execution command;
- no current durable consumer requires a new portfolio-allocation ledger;
- `fintech_core` persistence and `public.outbox_jobs` already have protected authority boundaries;
- adding a new durable contract without a concrete consumer/replay requirement would create unnecessary architecture.

If durable portfolio-allocation projection becomes required before FT-7, the design must reuse the existing FinTechCore persistence/domain-event boundary through an explicit versioned contract and separate review; no parallel portfolio ledger is authorized by P1.

## 13. Security / compliance effects

P1 creates no external platform mutation and no credential surface:

- no Exchange/Broker/Wallet/Custody credential;
- no Supabase/Render/Stripe mutation;
- no database migration;
- no live capital capability;
- no LLM approval authority;
- no suitability assumption hardcoded in FinTechCore;
- no relaxation of FT-5 or FT-6B gates.

## 14. Regression scope

Focused tests cover:

- deterministic target/current/notional deltas;
- cash reserve and quote-scale lineage;
- replay stability independent of target order;
- target authority/evidence changes changing replay identity;
- rebalance threshold behavior;
- invalid workflow time;
- portfolio accounting mismatch;
- missing target authority/evidence;
- concentration and deployment breaches;
- Guarded-Live/Production/Emergency denial;
- leverage denial;
- bounded portfolio-risk projection;
- exact FT-5 integration through existing Risk gate;
- wrong portfolio-evidence authority -> FT-5 `NOT_COMPUTABLE`;
- source-hash/accounting tamper -> projection fail closed.

Hosted CI has not been triggered before PR in accordance with repository cost policy.

## 15. Next bounded work

1. current ProviderMatrix / Meme/DeFi evidence gaps remain inventory-only in this P1 package;
2. hard-gate provider adapters should be delivered as separate correlation-safe evidence packages;
3. P2 backtest/stress/correlation validation remains a separate work package;
4. model promotion remains Owner-gated through the existing ScoringModelRegistry/ScoringDispatcher path;
5. FT-7 remains blocked pending separate architecture/security decision.
