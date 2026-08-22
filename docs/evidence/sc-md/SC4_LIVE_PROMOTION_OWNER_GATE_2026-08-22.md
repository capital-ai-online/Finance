# SC4 — LIVE Promotion Owner Gate

Status: proposal / not executed
Date: 2026-08-22

## Security-relevant change requested

The Owner requested Meme, DeFi and other crypto categories to be set to live. The current architecture distinguishes three non-equivalent states:

1. `LIVE_DATA`: fresh provider evidence may be displayed in production UI.
2. `LIVE_SCORING`: a category model is promoted from research/challenger to productive scoring through the existing ScoringModelRegistry/ScoringDispatcher.
3. `LIVE_EXECUTION`: real orders/exchange/custody execution are permitted.

## Proposed safe supersession

### Option A — recommended
- Enable `LIVE_DATA` category-by-category after provider key, licensing, DQ, freshness and page-governance gates are satisfied.
- Keep Meme/DeFi and other category models research/challenger until model-specific coverage/backtest/formal-audit promotion gates pass.
- Keep `LIVE_EXECUTION` blocked under FT-7+.

### Option B — controlled LIVE_SCORING promotion
- Same LIVE_DATA gates as Option A.
- Promote only categories with complete required evidence, negative tests, backtest/OOS validation, correlation controls, effective-feature/effective-weight fingerprints and explicit Owner model-promotion approval.
- Missing/stale required evidence remains NOT_COMPUTABLE/BLOCKED.
- No broker/exchange execution.

### Option C — LIVE_EXECUTION
Not part of this work package. Requires separate FT-7+ architecture/security decision, custody/exchange adapters, IAM/step-up authorization, pre-trade controls, reconciliation, incident/runbook and explicit Owner approval.

## Required Owner approval

Repository preparation may proceed without changing the runtime authority. Any mutation that changes a model from research/challenger to productive `LIVE_SCORING`, or that enables real execution, requires an explicit Owner approval after this proposal is reviewed.
