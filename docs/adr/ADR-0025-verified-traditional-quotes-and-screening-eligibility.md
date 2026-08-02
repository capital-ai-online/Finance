# ADR-0025 — Verified Traditional Quotes & Screening Eligibility

- Status: Proposed / implementation in PR
- Date: 2026-08-02
- Scope: Stock, Forex, Index screening and price-alert boundaries

## Context

After the P0 data-integrity hardening, registry bootstrap values are intentionally no longer exposed as verified market prices. Crypto already has an evidence-preserving spot-consensus path. Traditional assets require a separate quote boundary so screening and alerts do not regress to bootstrap or simulated prices.

At the same time, `screening-eligibility/1.0.0` exists as a reusable contract but must be applied directly at bulk screening boundaries rather than only inside clients.

## Decision

1. Introduce `traditional-quote/1.0.0` as the verified quote contract for traditional assets.
2. Stock and Forex current quotes use Twelve Data because a server-side `TWELVEDATA_API_KEY` and a live quote endpoint are available.
3. Index current quotes use the existing FMP quote adapter and its approved index mapping.
4. EODHD remains EOD/historical/reference evidence. It MUST NOT masquerade as an intraday alert quote.
5. Quote responses contain provider, observation time, retrieval time, source path, evidence IDs and explicit alert eligibility.
6. `executionPriceEligible` remains false. These quotes are screening/alert reference evidence, not an execution venue feed.
7. Missing provider configuration or provider failure returns an explicit unavailable state with `price: null`; no bootstrap/default price is substituted.
8. The bulk verified-score endpoint evaluates every result through `screening-eligibility/1.0.0` and exposes both READY and ELIGIBLE counts.
9. Screening eligibility is separate from canonical score computation. It may exclude a score from a screening/ranking result but may not alter the score itself.

## Consequences

- Traditional price alerts can be enabled only after their clients consume this contract.
- Provider-specific quote semantics remain visible.
- EOD and intraday data cannot be silently mixed.
- Bulk screening becomes auditable through a versioned eligibility decision.
- Hard market-integrity/SLA blocking remains disabled until runtime thresholds are calibrated and reviewed.

## Security and operations

- API keys remain server-side only.
- No Render, Supabase or Stripe mutation is part of this ADR.
- Provider outcomes continue to feed the central runtime routing/health telemetry.
- Quote contract and eligibility behavior require regression tests and green CI before merge.
