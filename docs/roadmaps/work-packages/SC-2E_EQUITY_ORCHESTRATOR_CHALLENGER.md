# SC-2E — Equity Orchestrator Challenger

**Parent:** `SC-MD-SPT-0001` / `SC-2 Model Registry & UAI`  
**Authority:** ADR-0087 — one canonical scoring architecture  
**Status:** P0 IMPLEMENTED — P1 EVIDENCE/FEATURE CONSTRUCTION IN PROGRESS  
**Priority:** P0/P1  
**Branch:** `feature/equity-orchestrator-p0-challenger-2026-08-23`  
**Baseline:** `main@800b05261c1792fed5138a8125cf6a00b1f5af07`  
**Source input:** Google Drive `1r49r3Eo72wfXlTTorx2uuqNUjaWtNhtm`

## Goal

Introduce a stock-specific Equity domain model without creating a second scoring architecture. Equity may own a dedicated feature contract, classification/profile model and deterministic scoring logic, but productive execution authority remains:

`UAI -> Evidence Acquisition -> Evidence/DQ -> Feature Contract -> ScoringModelRegistry -> ScoringDispatcher -> Domain Executor -> CanonicalScoreResult -> Ranking/Eligibility -> Traceability/Supervisor`.

The implementation remains a **research challenger only**. Productive `stock` routing stays on `traditional-scoring@2.1.0` until a separate Owner-approved promotion gate is satisfied.

## P0 — Challenger Foundation

- [x] fresh branch from current `main`
- [x] exclusive work claim with protected authority boundaries
- [x] `equity-classification/0.1.0` contract: industry metadata, size bucket, multi-valued style tags and exactly one Primary Scoring Profile
- [x] `equity-multifactor-features/0.1.0` contract
- [x] six top-level factor families: Quality, Valuation, Growth, Momentum, Financial Strength, Capital Allocation
- [x] anti-correlation rules: individual metrics are composed inside one family and cannot be re-added independently at top level
- [x] profile-specific research weights for Compounder, Quality Growth, Value, Cyclical Value, Momentum, Income, Turnaround/Special Situation, Financial, Platform/Software, Semiconductor/AI Infrastructure, Healthcare Innovator and Energy/Commodity Producer
- [x] deterministic `EquityResearchScoring` with existing `market-evidence-dq/1.0.0`
- [x] minimum four admitted factor families and minimum 70% nominal-weight coverage
- [x] effective-feature/effective-weight fingerprint reuse
- [x] Equity orchestration boundary with stock-only and evidence-identity guards
- [x] `equity-multifactor@0.1.0` registered as `challenger`, `research-only`, `scoreEligible=false`
- [x] productive stock champion remains `traditional-scoring@2.1.0`
- [x] no Regime/Sentiment/Pattern score impact in Equity 0.1.0

## P1 — Evidence / Feature Construction

### P1.1 Existing provider evidence expansion — IMPLEMENTED IN BRANCH

- [x] reuse Alpha Vantage `OVERVIEW`; no additional request for the first expansion
- [x] extract and attribute `priceToBookRatio`
- [x] extract and attribute `operatingMarginPct`
- [x] extract and attribute `returnOnEquityPct`
- [x] extract and attribute `quarterlyRevenueGrowthPct`
- [x] extract and attribute `quarterlyEarningsGrowthPct`
- [x] retain existing P/E, dividend yield, profit margin and EPS evidence
- [x] retain bounded FMP enrichment for leverage/free-cash-flow-per-share
- [x] never substitute `retrievedAt` as financial `observedAt`; FMP observed date is bound only when present in the provider payload

### P1.2 Equity feature composer — IMPLEMENTED IN BRANCH

- [x] `EquityFeatureComposer` converts already acquired evidence into factor-family inputs
- [x] existing `MarketEvidenceQualityRecord` is reused; no Equity-local DQ authority
- [x] fundamental evidence freshness is explicit and fail-closed
- [x] 12-1 and 6-1 momentum candidates require at least 252 real history points
- [x] momentum evidence freshness is explicit and fail-closed
- [x] Quality composes profitability/operating-margin/ROE observations inside one family
- [x] Valuation composes P/E and price-to-book observations inside one family
- [x] Growth composes quarterly revenue/earnings growth inside one family
- [x] Financial Strength consumes attributable debt-to-equity evidence
- [x] Capital Allocation is deliberately **not** synthesized from dividend yield alone
- [x] research-only bounded absolute normalization is explicitly marked `promotionReady=false`

### P1.3 Profile semantic gates — IMPLEMENTED IN BRANCH

Coverage alone must not make a profile READY while its defining family is absent.

Examples:

- `quality-growth` requires `quality + growth`
- `value` requires `valuation + financialStrength`
- `momentum` requires `momentum + financialStrength`
- `income` requires `quality + financialStrength + capitalAllocation`
- `financial` requires `quality + valuation + financialStrength`
- `semiconductor-ai-infrastructure` requires `growth + momentum + financialStrength`

Missing required families force `NOT_COMPUTABLE` even when generic family-count or weight-coverage thresholds are otherwise satisfied.

### P1.4 Remaining Evidence Gaps — NEXT

- [ ] durable Capital Allocation evidence: dividend coverage, buyback/share-count change, shareholder yield, reinvestment efficiency
- [ ] richer Financial Strength evidence: interest coverage and liquidity/current-ratio evidence
- [ ] richer Quality evidence: FCF conversion, earnings quality/variability, ROIC where directly reconstructable from verified filings
- [ ] richer Valuation evidence: FCF yield and enterprise-value based measures with matching point-in-time market value
- [ ] richer Growth evidence: multi-period revenue/EPS/FCF growth instead of quarterly-only proxies
- [ ] SEC EDGAR/XBRL adapter for US issuers, behind existing Evidence/DQ boundaries
- [ ] provider/country coverage strategy for non-US equities

### P1.5 Peer / Sector Normalization — BLOCKED UNTIL EVIDENCE COVERAGE

- [ ] define admissible peer-universe identity contract
- [ ] sector/industry-relative z-score policy
- [ ] winsorization/outlier policy
- [ ] minimum peer count and degraded-state semantics
- [ ] no proprietary GICS dataset redistribution without an applicable licence
- [ ] replace `research-bounded-absolute/0.1.0` before any productive promotion

### P1.6 Validation / Backtesting — BLOCKED UNTIL FEATURE COVERAGE

- [ ] survivorship-controlled universe snapshots
- [ ] point-in-time filing availability / look-ahead controls
- [ ] rolling and out-of-sample evaluation
- [ ] sector and market-cap stratification
- [ ] turnover/stability analysis
- [ ] subfeature and family correlation matrix
- [ ] profile-specific false-positive/false-negative review
- [ ] golden replay fixtures bound to effective-feature/effective-weight fingerprints

## Non-goals / Protected Boundaries

- no second `ScoringModelRegistry`
- no second `ScoringDispatcher`
- no new public score route
- no new ranking or eligibility authority
- no new DQ/confidence authority
- no provider I/O inside the Equity scorer/orchestrator
- no GICS dataset hardcoding or redistribution
- no productive stock cutover in P0/P1 research work
- no `scoreImpact` or `rankingImpact` from regime, sentiment or pattern research

## Classification Design

Structural industry classification and investment behavior are separated:

1. **Industry:** provider/internal classification; GICS is permitted only when the upstream provider/licence authorizes usage.
2. **Size bucket:** mega/large/mid/small/micro/unknown.
3. **Style tags:** multi-valued descriptors such as quality, growth, value, momentum or income.
4. **Primary profile:** exactly one deterministic profile that selects the Equity research weight set.

This avoids ambiguous routing such as one issuer simultaneously being a Mega Cap Compounder, Quality Growth company, Momentum Leader and Semiconductor/AI Infrastructure company.

## Factor-Family Design

Only the six families receive top-level model weights. Subfeatures are traceability/evidence inputs within the family.

| Family | Example evidence | Anti-correlation boundary |
|---|---|---|
| Quality | profitability, ROIC, FCF conversion, earnings quality | profitability observations composed once |
| Valuation | earnings yield, FCF yield, book-to-price, EV/EBIT | valuation observations composed once |
| Growth | revenue/EPS/FCF growth | growth observations composed once |
| Momentum | 12-1, 6-1, relative strength | one price-path family; no second trend/breakout bonus |
| Financial Strength | leverage, interest coverage, liquidity | balance-sheet resilience composed once |
| Capital Allocation | shareholder yield, dividend coverage, buybacks, reinvestment | no duplicate generic dividend/yield bonus |

## Evidence and Missing-Data Policy

The challenger consumes the existing `MarketEvidenceQualityRecord` contract. A family is admitted only if:

- its normalized family score is finite in `0..1`;
- component keys are explicit;
- evidence is present;
- every supporting record is admissible `VERIFIED` evidence with provenance and valid freshness;
- profile-specific required families are present.

Missing/stale/conflicting/unverified data remains missing. No zero fill, neutral fill, PASS substitution or synthetic confidence is permitted.

## Promotion Gate

A productive Equity champion requires all of the following in a separate reviewed change:

1. point-in-time verified evidence coverage for promoted factor families;
2. peer/sector-relative normalization and outlier policy;
3. survivorship- and look-ahead-controlled out-of-sample/rolling backtests;
4. documented subfeature/family correlation review;
5. effective feature/weight lineage on production inputs;
6. explicit Owner approval;
7. atomic registry cutover: add canonical Equity stock champion and remove `stock` from the Traditional champion in the same change;
8. `ScoringDispatcher` executor binding and `CanonicalScoreResult` regression coverage;
9. final main/open-PR correlation gate before PR/merge.

## Reuse / External Review

The implementation uses existing repository capabilities rather than introducing an external scoring framework. Primary reference inputs reviewed for design are:

- MSCI factor methodology: separate Value/Quality/Momentum factor families and sector-relative standardization/winsorization patterns
- Alpha Vantage Fundamental Data: existing `OVERVIEW` plus Income Statement, Balance Sheet and Cash Flow capabilities
- SEC EDGAR XBRL APIs: authentication-free Company Facts/XBRL candidate for later US point-in-time evidence
- FMP TTM ratios: existing bounded provider path; filing/as-of provenance remains mandatory before admission
- NIST SP 800-218 / SP 800-218A: secure SDLC baseline already mapped by repository governance

No additional plugin or open-source dependency is required for the implemented P1 step.

## Evidence

- `docs/evidence/sc-md/SC2_EQUITY_ORCHESTRATOR_P0_CHALLENGER_2026-08-23.md`
- ADR-0087 revalidation on 2026-08-23
