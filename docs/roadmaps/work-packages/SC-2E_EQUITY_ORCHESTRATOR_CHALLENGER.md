# SC-2E — Equity Orchestrator Challenger

**Parent:** `SC-MD-SPT-0001` / `SC-2 Model Registry & UAI`  
**Authority:** ADR-0087 — one canonical scoring architecture  
**Status:** P0 IMPLEMENTATION  
**Priority:** P0  
**Branch:** `feature/equity-orchestrator-p0-challenger-2026-08-23`  
**Baseline:** `main@800b05261c1792fed5138a8125cf6a00b1f5af07`  
**Source input:** Google Drive `1r49r3Eo72wfXlTTorx2uuqNUjaWtNhtm`

## Goal

Introduce a stock-specific Equity domain model without creating a second scoring architecture. Equity may own a dedicated feature contract, classification/profile model and deterministic scoring logic, but productive execution authority remains:

`UAI -> Evidence Acquisition -> Evidence/DQ -> Feature Contract -> ScoringModelRegistry -> ScoringDispatcher -> Domain Executor -> CanonicalScoreResult -> Ranking/Eligibility -> Traceability/Supervisor`.

The P0 implementation is a **research challenger only**. Productive `stock` routing remains `traditional-scoring@2.1.0` until a separate Owner-approved promotion gate is satisfied.

## P0 Scope

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
- [ ] focused TypeScript/unit validation on exact branch head
- [ ] final main/open-PR correlation review before PR

## Non-goals / Protected Boundaries

- no second `ScoringModelRegistry`
- no second `ScoringDispatcher`
- no new public score route
- no new ranking or eligibility authority
- no new DQ/confidence authority
- no provider I/O inside the Equity scorer/orchestrator
- no GICS dataset hardcoding or redistribution
- no productive stock cutover in P0
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
- every supporting record is admissible `VERIFIED` evidence with provenance and valid freshness.

Missing/stale/conflicting/unverified data remains missing. No zero fill, neutral fill, PASS substitution or synthetic confidence is permitted.

## Promotion Gate (P1+)

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

P0 uses existing repository capabilities rather than introducing an external scoring framework. Primary reference inputs reviewed for design are:

- MSCI Global Industry Classification Standard methodology (classification hierarchy; licensing remains external-governance relevant)
- MSCI Factor Advanced methodology (factor families, sector-relative standardization/winsorization patterns)
- SEC EDGAR XBRL APIs (candidate P1 point-in-time fundamental evidence for US issuers)
- NIST SP 800-218 / SP 800-218A (secure SDLC baseline already mapped by repository governance)

No additional plugin or open-source dependency is required for P0.

## Evidence

- `docs/evidence/sc-md/SC2_EQUITY_ORCHESTRATOR_P0_CHALLENGER_2026-08-23.md`
- ADR-0087 revalidation on 2026-08-23
