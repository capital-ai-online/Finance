# ADR-0032 — Asset Catalog and Market Evidence Separation

- **Status:** Accepted
- **Date:** 2026-08-02
- **Scope:** CAPITAL-AI Multi-Asset Registry / Search / Data Integrity
- **Platform Version:** `0.6.0`
- **Governance ID:** `DATA-ASSET-CATALOG-001`
- **Related:** ADR-0025, ADR-0030
- **Integrity Contract:** `asset-catalog-integrity/1.0.0`

## 1. Context

CAPITAL-AI maintains a multi-asset registry used by search, screening and supporting workflows. The legacy `AssetRegistry` combines instrument metadata with bootstrap numeric fields. Those bootstrap fields are already intentionally suppressed by the public registry API because they do not carry field-level provider provenance and therefore must not be represented as verified market observations.

The asset universe is being expanded by up to 100 additional instruments for each supported class:

- crypto;
- stock;
- forex;
- commodity;
- index;
- bond.

Growing the catalog by populating required legacy numeric fields with deterministic, estimated or otherwise non-provider-backed values would violate the CAPITAL-AI no-demo-data and provenance requirements. Catalog membership therefore needs an explicit architectural boundary from financial observations and canonical scoring.

## 2. Decision

CAPITAL-AI separates **instrument catalog metadata** from **verified market evidence**.

### 2.1 Catalog layer

The search catalog may contain only descriptive instrument metadata required to discover and address an instrument, including:

- canonical symbol;
- display name;
- asset class;
- optional aliases;
- instrument kind;
- catalog source declaration;
- screening-contract classification;
- origin (`legacy-registry` or `catalog-expansion`).

Catalog presence does **not** imply that a current price, historical series, score, ranking, recommendation or screening eligibility exists.

### 2.2 Market-evidence layer

Financial values become usable only after the existing provider, freshness, provenance and scoring-integrity controls accept them.

The following rules remain mandatory:

1. Catalog metadata must never be converted into price or score evidence.
2. Provider failures remain fail-closed.
3. Simulated/bootstrap history must not be accepted as verified scoring history.
4. Missing provider mappings produce `DATA_UNAVAILABLE`, `SOURCE_UNAVAILABLE`, `UNSUPPORTED_ASSET` or `SCORE_NOT_COMPUTABLE` rather than fallback financial values.
5. Catalog integrity has `scoreImpactEnabled: false`.

## 3. Expansion policy

The target is **100 additional unique canonical assets per supported asset class**, provided the candidate universe contains at least that many suitable instruments.

The implementation deliberately provides more candidates than the target where necessary so legacy symbols and aliases can be skipped without lowering the target.

A candidate counts toward the target only when:

- its canonical symbol is not already present in the merged catalog;
- symbol and name pass structural validation;
- its type is one of the six supported classes;
- it contains a catalog-source declaration;
- compatibility aliases are not counted as independent assets.

The expansion process does not overwrite an existing legacy instrument solely to reach a target count.

## 4. Screening contracts by class

### Crypto

New crypto catalog entries are classified `crypto-provenance`. A selected symbol may enter the existing crypto provider/scoring pipeline. A score is emitted only if the provider-backed technical and integrity gates succeed.

### Stocks and Forex

New stock and forex entries are classified `traditional-provenance`. They may enter the existing verified history/fundamentals/quote paths. TwelveData, EODHD, Stooq, Alpha Vantage or another approved provider must supply the required evidence. Unsupported or unavailable symbols fail closed.

### Indices

Index entries are classified `traditional-provenance`, but the current canonical index scoring path remains restricted to explicitly approved provider mappings such as `INDEX_FMP_TICKERS`. An index without an approved mapping remains catalog-searchable but returns `SCORE_NOT_COMPUTABLE` rather than a fabricated score.

### Commodities and Bonds

The expanded commodity and bond catalogs are classified `catalog-only` until their own production-approved provenance-backed screening contracts are activated. They are searchable and countable but cannot receive synthetic screening scores merely because they exist in the catalog.

## 5. Asset search inventory

The Market Screener must display the **current loaded catalog count** directly below the asset search field for:

- Krypto;
- Aktien;
- Forex;
- Rohstoffe;
- Indizes;
- Anleihen;
- Gesamt.

These values are calculated from the catalog response received by the UI. They must not be hardcoded to planned targets, because the displayed value represents the actual runtime search universe.

Aliases may participate in search matching but do not increase the asset count.

## 6. Data-integrity integration

The new contract `asset-catalog-integrity/1.0.0` validates the merged catalog independently of financial scoring.

It checks at minimum:

- global canonical-symbol uniqueness;
- symbol syntax;
- non-empty names;
- supported asset classes;
- catalog-source presence;
- expansion count against target per class;
- separation of catalog-only and provider-verifiable assets.

The registry exposes a read-only catalog-integrity endpoint for operational inspection. A degraded catalog-integrity result is not allowed to silently become a market-data or scoring fallback.

Automated unit tests enforce:

- exactly 100 successful additions per class for the current expansion;
- 600 total expansion entries;
- no duplicate symbols;
- correct actual counts per class;
- no market-value fields on expansion catalog entries;
- catalog-only status for commodity/bond expansion entries;
- provenance-backed runtime classification for crypto/stock/forex entries.

## 7. Manual mutation boundary

Existing legacy assets retain the existing privileged admin update path subject to IAM controls.

A newly introduced catalog-only entry that has no legacy `RegistryAsset` record must not accept manual price, volatility, expected-return, market-cap or score-like bootstrap enrichment through that legacy path. Such a request is rejected with `CATALOG_ONLY_ASSET`.

Future authoritative catalog-management writes require a separately reviewed contract rather than reusing the legacy market-parameter mutation endpoint.

## 8. Operational consequences

### Positive

- The searchable asset universe can grow without inventing financial data.
- Asset count is transparent in the UI and derived from runtime state.
- Existing scoring-integrity and provider-provenance controls remain authoritative.
- Unsupported newly cataloged assets fail closed instead of receiving placeholder scores.
- The catalog has a dedicated versioned integrity contract and regression tests.

### Trade-offs

- Catalog coverage can exceed immediately scoreable coverage.
- Some newly searchable indices, commodities and bonds will intentionally show unavailable/non-computable states until approved provider contracts exist.
- Provider rate limits and symbol coverage determine runtime evidence availability and must not be hidden by catalog metadata.

## 9. Release lifecycle

ADR-0030 remains authoritative for version changes. This implementation does **not** by itself modify `package.json#version`; the platform remains `0.6.0` until the release gate classifies and versions the associated release train.

Because the change materially expands an end-user multi-asset capability, it is a candidate for a future **MINOR** release classification when promoted as part of an accepted production release train. The actual version decision is made only at the ADR-0030 Release Version Gate.

## 10. Acceptance criteria

The change is accepted only when:

1. all six classes receive 100 new unique catalog entries;
2. the catalog-integrity contract reports `READY`;
3. unit/type/build checks pass;
4. the search UI derives and displays class counts from the returned catalog;
5. expansion entries contain no invented financial observation fields;
6. unsupported provider paths remain fail-closed;
7. no existing scoring contract is weakened to increase apparent asset coverage.

**Decision:** Accepted.
