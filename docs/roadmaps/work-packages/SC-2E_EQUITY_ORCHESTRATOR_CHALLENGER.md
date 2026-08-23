# SC-2E — Equity Orchestrator Challenger

**Parent:** `SC-MD-SPT-0001` / `SC-2 Model Registry & UAI`  
**Authority:** ADR-0087 — one canonical scoring architecture  
**Status:** P0 IMPLEMENTED — P1 EVIDENCE/SEC/COMPARABLE FEATURES IMPLEMENTED — NORMALIZATION/BACKTESTING OPEN  
**Priority:** P0/P1  
**Branch:** `feature/equity-orchestrator-p0-challenger-2026-08-23`  
**Original baseline:** `main@800b05261c1792fed5138a8125cf6a00b1f5af07`  
**Latest main sync:** `main@deaf7a5411efdc4aa4638757b7d6958a75c094cc`  
**Source input:** Google Drive `1r49r3Eo72wfXlTTorx2uuqNUjaWtNhtm`

## Goal

Introduce a stock-specific Equity domain model without creating a second scoring architecture. Equity may own a dedicated feature contract, classification/profile model and deterministic scoring logic, but productive execution authority remains:

`UAI -> Evidence Acquisition -> Evidence/DQ -> Feature Contract -> ScoringModelRegistry -> ScoringDispatcher -> Domain Executor -> CanonicalScoreResult -> Ranking/Eligibility -> Traceability/Supervisor`.

The implementation remains a **research challenger only**. Productive `stock` routing stays on `traditional-scoring@2.1.0` until a separate Owner-approved promotion gate is satisfied.

## Current Version State

| Contract / Runtime | Current branch version | Authority |
|---|---|---|
| Equity model | `equity-multifactor@0.2.0` | challenger / research-only |
| Equity feature contract | `equity-multifactor-features/0.2.0` | research-only |
| Equity classification | `equity-classification/0.1.0` | classification metadata |
| Equity research runtime | `equity-research-runtime/0.4.0` | non-public application adapter |
| Market Evidence DQ | `market-evidence-dq/1.0.0` | existing canonical DQ |
| Productive stock model | `traditional-scoring@2.1.0` | canonical/champion |

Equity 0.1.0 is retained only as the historical P0 foundation. The 0.2.0 version is required because comparable filing features, Capital Allocation evidence and additional Quality/Valuation features can alter research family scores and replay fingerprints.

## P0 — Challenger Foundation — IMPLEMENTED

- [x] fresh branch from current `main` at branch creation
- [x] exclusive work claim with protected authority boundaries
- [x] `equity-classification/0.1.0`: industry metadata, size bucket, multi-valued style tags and exactly one Primary Scoring Profile
- [x] six top-level factor families: Quality, Valuation, Growth, Momentum, Financial Strength, Capital Allocation
- [x] anti-correlation rules: individual metrics are composed inside one family and cannot be re-added independently at top level
- [x] profile-specific research weights for Compounder, Quality Growth, Value, Cyclical Value, Momentum, Income, Turnaround/Special Situation, Financial, Platform/Software, Semiconductor/AI Infrastructure, Healthcare Innovator and Energy/Commodity Producer
- [x] deterministic `EquityResearchScoring` with existing `market-evidence-dq/1.0.0`
- [x] minimum four admitted factor families and minimum 70% nominal-weight coverage
- [x] profile-semantic required-family gates
- [x] effective-feature/effective-weight fingerprint reuse
- [x] Equity orchestration boundary with stock-only and evidence-identity guards
- [x] productive stock champion remains `traditional-scoring@2.1.0`
- [x] no Regime/Sentiment/Pattern score impact

## P1 — Evidence / Feature Construction

### P1.1 Existing provider evidence expansion — IMPLEMENTED

- [x] reuse Alpha Vantage `OVERVIEW`; no additional request for the first expansion
- [x] Price-to-Book
- [x] Operating Margin TTM
- [x] Return on Equity TTM
- [x] Quarterly Revenue Growth YoY
- [x] Quarterly Earnings Growth YoY
- [x] retain P/E, Dividend Yield, Profit Margin and EPS evidence
- [x] retain bounded FMP enrichment for leverage/free-cash-flow-per-share
- [x] financial `observedAt` is never fabricated from retrieval time

### P1.2 Base Equity feature composer — IMPLEMENTED

- [x] `EquityFeatureComposer` converts already acquired evidence into factor-family inputs
- [x] existing `MarketEvidenceQualityRecord` reused; no Equity-local DQ authority
- [x] fundamental evidence freshness explicit and fail-closed
- [x] 12-1 and 6-1 Momentum require at least 252 dated real-history points
- [x] Momentum uses existing provider-ranked TwelveData/EODHD history only when provider/source/retrieval provenance exists
- [x] `AssetRegistry` simulated history is not a dependency
- [x] Quality composes Profit Margin / Operating Margin / ROE inside one family
- [x] Valuation composes P/E and Price-to-Book inside one family
- [x] initial Growth composes vendor Revenue/Earnings YoY inside one family
- [x] Financial Strength may consume attributable Debt/Equity fallback evidence
- [x] Dividend Yield alone does not manufacture Capital Allocation
- [x] bounded absolute normalization marked research-only / `promotionReady=false`

### P1.3 Profile semantic gates — IMPLEMENTED

Coverage alone must not make a profile READY while its defining family is absent.

Examples:

- `quality-growth` requires `quality + growth`
- `value` requires `valuation + financialStrength`
- `momentum` requires `momentum + financialStrength`
- `income` requires `quality + financialStrength + capitalAllocation`
- `financial` requires `quality + valuation + financialStrength`
- `semiconductor-ai-infrastructure` requires `growth + momentum + financialStrength`

Missing required families force `NOT_COMPUTABLE` even when generic family-count or weight-coverage thresholds are otherwise satisfied.

### P1.4 Research runtime binding — IMPLEMENTED

- [x] `server/equityResearchRuntime.ts` binds existing Fundamentals + verified history to the pure Equity composers/orchestrator
- [x] no HTTP route
- [x] no persistence writer
- [x] no `CanonicalScoreResult`
- [x] `scoreEligible=false`, `executionEligible=false`, `publicRouteExposed=false`
- [x] provider I/O remains outside `EquityResearchScoring` and `EquityOrchestrator`
- [x] Traditional history projection preserves dated points, source path and retrieval time without a second provider authority

Evidence: `docs/evidence/sc-md/SC2_EQUITY_P1_EVIDENCE_RUNTIME_2026-08-23.md`.

### P1.5 SEC EDGAR CompanyFacts evidence — IMPLEMENTED END-TO-END

- [x] keyless server-side CompanyFacts adapter; no third-party SDK/dependency
- [x] ticker -> CIK only from SEC-published association; no guessing/fuzzy fallback
- [x] declared `SEC_EDGAR_USER_AGENT` required fail-closed
- [x] serialized request gap 150 ms by default, below SEC Fair Access 10 req/s ceiling
- [x] 24h ticker-map cache + 6h CompanyFacts cache
- [x] 10-Q/10-Q/A/10-K/10-K/A in v0.1.0
- [x] `filedAt <= asOf` look-ahead gate
- [x] filed date retained separately from accounting period end
- [x] deterministic Instant vs Periodic vs YTD XBRL context selection
- [x] provider-neutral SEC filing bridge
- [x] Current Ratio, Long-Term-Debt/Equity, Interest Coverage, FCF, Shareholder Distributions, Distribution Coverage and Reinvestment Intensity derived only from compatible periods
- [x] SEC Financial Strength replaces correlated vendor leverage only with sufficient independent filing components
- [x] AlphaVantage/FMP/SEC observations in the same correlation group are not additively stacked
- [x] no SEC raw/derived evidence receives productive score authority

Evidence: `docs/evidence/sc-md/SC2_EQUITY_P1_SEC_EDGAR_2026-08-23.md`.

### P1.6 Comparable filing + Quality/Valuation enrichment — IMPLEMENTED FOR INTERMEDIATE PR

#### Comparable SEC periods

- [x] bounded prior `asOf` generated from current verified filing period
- [x] same cached SEC CompanyFacts adapter reused; no second endpoint/authority
- [x] comparable period end separation constrained to roughly one fiscal year
- [x] context/unit equality required
- [x] periodic duration tolerance enforced
- [x] bridge-level defense-in-depth rejects misclassified 10-Q YTD durations
- [x] SEC Revenue YoY, Diluted EPS YoY and FCF YoY derived only from compatible verified periods
- [x] Share Count Change YoY derived from compatible instant observations
- [x] comparable SEC Growth replaces vendor quarterly Growth within the same correlation group when >=2 observations are admissible
- [x] Capital Allocation requires Share Count Change + Distribution Coverage; neither signal is sufficient alone
- [x] Reinvestment Intensity stays context-only pending peer/profile normalization

#### Quality / Valuation quick wins

- [x] `quality.freeCashFlowConversion` implemented from same-provider/same-observation TTM FCF/share and EPS provenance
- [x] merged AlphaVantage/FMP display values are never cross-mixed for FCF conversion
- [x] `valuation.freeCashFlowYield` implemented from attributable FCF/share plus latest fresh real history close
- [x] FCF Yield uses existing TwelveData/EODHD provenance-aware history; no separate quote path
- [x] both features enrich only already-existing Quality/Valuation families and cannot manufacture new family coverage
- [x] both remain under `equity-multifactor-features/0.2.0` and research-only normalization

### P1.7 Advanced Quality / Valuation evidence — NEXT AFTER INTERMEDIATE PR

- [ ] Earnings Variability/Stability from comparable point-in-time filing history
- [ ] ROIC only where NOPAT/invested-capital inputs can be reconstructed without fabricated tax/debt assumptions
- [ ] EV/EBIT or EV/FCF only with matching point-in-time enterprise-value evidence
- [ ] shareholder yield / buyback yield where market-cap and capital-action timing are aligned
- [ ] IFRS/20-F/40-F and broader non-US coverage strategy

### P1.8 Peer / Sector Normalization — BLOCKED UNTIL EVIDENCE COVERAGE

- [ ] define admissible peer-universe identity contract
- [ ] sector/industry-relative z-score policy
- [ ] winsorization/outlier policy
- [ ] minimum peer count and degraded-state semantics
- [ ] no proprietary GICS dataset redistribution without an applicable licence
- [ ] replace `research-bounded-absolute/0.1.0` before productive promotion

### P1.9 Validation / Backtesting — BLOCKED UNTIL NORMALIZATION

- [ ] survivorship-controlled universe snapshots
- [ ] point-in-time filing availability / look-ahead controls
- [ ] accession-level replay and post-acceptance-correction review for SEC evidence
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
- no provider I/O inside `EquityResearchScoring` or `EquityOrchestrator`
- no GICS dataset hardcoding or redistribution
- no productive stock cutover in this intermediate PR
- no `scoreImpact` or `rankingImpact` from regime, sentiment or pattern research
- no AssetRegistry simulated history as Equity evidence
- no SEC raw/derived fact directly promoted to productive score authority

## Classification Design

Structural industry classification and investment behavior are separated:

1. **Industry:** provider/internal classification; GICS only when upstream provider/licence authorizes usage.
2. **Size bucket:** mega/large/mid/small/micro/unknown.
3. **Style tags:** multi-valued descriptors such as quality, growth, value, momentum or income.
4. **Primary profile:** exactly one deterministic profile that selects the Equity research weight set.

## Factor-Family Design

Only the six families receive top-level model weights. Subfeatures are traceability/evidence inputs within the family.

| Family | Current research evidence | Anti-correlation boundary |
|---|---|---|
| Quality | profitability, ROE, aligned TTM FCF conversion | profitability observations and FCF conversion composed once inside Quality |
| Valuation | earnings yield/P-E, book-to-price/P-B, FCF yield | valuation observations composed once; no second value bonus |
| Growth | comparable SEC Revenue/EPS/FCF YoY; vendor fallback | filing history supersedes same-correlation vendor proxies, no stacking |
| Momentum | 12-1, 6-1 | one price-path family; no second trend/breakout bonus |
| Financial Strength | leverage, SEC liquidity/interest coverage | primary filing evidence may supersede vendor leverage within the same correlation group |
| Capital Allocation | share-count change + distribution coverage | no generic dividend/yield bonus; incomplete evidence stays absent |

## Evidence and Missing-Data Policy

A family is admitted only if:

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

The implementation reuses repository capabilities rather than introducing an external scoring framework:

- Alpha Vantage/FMP existing Fundamentals paths;
- TwelveData/EODHD existing Traditional history routing;
- SEC EDGAR CompanyFacts keyless filing evidence;
- existing Market Evidence DQ and Provider Health;
- existing ScoringModelRegistry, ScoringDispatcher and fingerprint contracts.

Primary methodology references used for design include MSCI factor-family separation and sector-relative standardization/winsorization patterns, SEC EDGAR developer/fair-access guidance and repository security/governance authorities.

No additional plugin or open-source dependency is required for this intermediate P1 scope.

## Evidence

- `docs/evidence/sc-md/SC2_EQUITY_ORCHESTRATOR_P0_CHALLENGER_2026-08-23.md`
- `docs/evidence/sc-md/SC2_EQUITY_P1_EVIDENCE_RUNTIME_2026-08-23.md`
- `docs/evidence/sc-md/SC2_EQUITY_P1_SEC_EDGAR_2026-08-23.md`
- ADR-0087 revalidation on 2026-08-23
