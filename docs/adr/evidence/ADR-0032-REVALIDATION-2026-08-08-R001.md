# ADR-0032 Revalidation — R-001 Crypto/Meme Provenance Boundary

- **Date:** 2026-08-08
- **ADR:** ADR-0032 — Asset Catalog and Market Evidence Separation
- **Roadmap item:** R-001 — Enforce No-Demo Data + provenance truth
- **Scope:** Crypto and Meme-Coin scoring inputs
- **Execution:** repository code change only; no Supabase, Render or Stripe mutation

## Finding

The accepted ADR-0032 boundary was not fully enforced in the legacy Crypto/Meme scoring generators. `AssetRegistry` contains bootstrap numeric values used for catalog/compatibility behavior, but `generateCryptoInputsSync()` and `generateMemeCoinInputsSync()` converted selected registry fields into score inputs.

Affected fields included:

- `marketCap` + `volume24h` → Crypto `avg_daily_volume`;
- `circulatingSupply` + `maxSupply` → Crypto `supply_dynamics`;
- caller-provided/unverified `change24h` → Crypto `regime_bonus`;
- `marketCap` + `volume24h` → Meme-Coin `liquidity`.

Because the legacy registry values do not carry field-level provider provenance, these conversions violated the ADR-0032 invariant that catalog/bootstrap metadata must not become verified market evidence.

## Remediation

The synchronous Crypto and Meme-Coin generators are now fail-closed:

- `CryptoScoringService.generateCryptoInputsSync()` returns only the normalized `coin` identity;
- `MemeCoinScoringService.generateMemeCoinInputsSync()` returns only the normalized `coin` identity;
- registry `marketCap`, `volume24h`, supply values and unverified `change24h` no longer generate score factors;
- asynchronous history-derived technical factors remain permitted only when `assetRegistry.getHistory()` reports `source === 'live'`;
- liquidity, supply and regime factors remain `undefined` until a dedicated provider-evidence contract supplies verifiable observations.

## Regression contract

`tests/unit/r001CryptoProvenanceBoundary.test.ts` locks the following invariants:

1. BTC registry bootstrap values cannot create Crypto liquidity, supply or regime factors.
2. DOGE registry market cap/volume cannot create Meme-Coin liquidity.
3. A scoring request with no verified factors fails closed with score `0`, `data_quality=unknown`, and explicit missing-factor evidence.

## ADR status

ADR-0032 remains the accepted architecture decision. This change repairs implementation drift against that decision; it does not introduce a conflicting architecture.

The Crypto/Meme boundary can be considered revalidated for bootstrap-to-score separation once repository CI confirms type checks, unit tests and production build on the PR head.

## Follow-up

A future provider-neutral market observation contract may re-enable:

- Crypto/Meme liquidity from verified market-cap and volume observations;
- tokenomics/supply factors from verified supply observations;
- regime factors from verified current/24h price observations.

Such factors must carry provider identity, evidence ID, observed/retrieved timestamps and freshness state before entering canonical scoring.
