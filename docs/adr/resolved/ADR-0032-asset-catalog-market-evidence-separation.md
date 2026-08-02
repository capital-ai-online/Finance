# ADR-0032 — Asset Catalog and Market Evidence Separation

- **Status:** Accepted
- **Implementation-Status:** ✅ COMPLETE (verifiziert 2026-08-02)
- **Date:** 2026-08-02
- **Scope:** CAPITAL-AI Multi-Asset Registry / Search / Data Integrity
- **Platform Version:** `0.6.0`
- **Governance ID:** `DATA-ASSET-CATALOG-001`
- **Related:** ADR-0025, ADR-0030, ADR-0033
- **Integrity Contract:** `asset-catalog-integrity/1.0.0`

## 1. Context

CAPITAL-AI maintains a multi-asset registry used by search, screening and supporting workflows. The legacy `AssetRegistry` combines instrument metadata with bootstrap numeric fields. Those bootstrap fields are intentionally suppressed by the public registry API because they do not carry field-level provider provenance and therefore must not be represented as verified market observations.

The asset universe was expanded by 100 additional instruments for each supported class:

- crypto;
- stock;
- forex;
- commodity;
- index;
- bond.

Growing the catalog by populating required legacy numeric fields with deterministic, estimated or otherwise non-provider-backed values would violate the CAPITAL-AI no-demo-data and provenance requirements. Catalog membership therefore has an explicit architectural boundary from financial observations and canonical scoring.

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

Financial values become usable only after provider, freshness, provenance and scoring-integrity controls accept them.

The following rules remain mandatory:

1. Catalog metadata must never be converted into price or score evidence.
2. Provider failures remain fail-closed.
3. Simulated/bootstrap history must not be accepted as verified scoring history.
4. Missing provider mappings produce `DATA_UNAVAILABLE`, `SOURCE_UNAVAILABLE`, `UNSUPPORTED_ASSET` or `SCORE_NOT_COMPUTABLE` rather than fallback financial values.
5. Catalog integrity has `scoreImpactEnabled: false`.

## 3. Expansion policy

The target was **100 additional unique canonical assets per supported asset class**. The implementation deliberately provides more candidates than the target where necessary so legacy symbols and aliases can be skipped without lowering the target.

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

New stock and forex entries are classified `traditional-provenance`. They may enter the existing verified history/fundamentals/quote paths. An approved provider must supply the required evidence. Unsupported or unavailable symbols fail closed.

### Indices

Index entries are classified `traditional-provenance`. ADR-0033 subsequently introduced the approved `index-provider-mapping/1.0.0` contract with FMP priority and TwelveData runtime identity verification. This is an implementation evolution of the boundary established here: a catalog entry still does not become verified evidence merely because it exists.

### Commodities and Bonds

At the time of this ADR, expanded commodity and bond entries were intentionally `catalog-only` pending dedicated contracts. ADR-0033 subsequently approved `commodity-evidence-scoring/1.0.0` and the narrowly scoped `sovereign-benchmark-yield-scoring/1.0.0`. That later activation does not supersede the catalog/evidence separation: READY still requires approved provider evidence, identity, freshness and scoring gates. General individual/corporate bond scoring remains locked under ADR-0022/ADR-0029.

## 5. Asset search inventory

The Market Screener displays the **current loaded catalog count** directly below the asset search field for:

- Krypto;
- Aktien;
- Forex;
- Rohstoffe;
- Indizes;
- Anleihen;
- Gesamt.

These values are calculated from the catalog response received by the UI and are not hardcoded to planned targets. Aliases may participate in search matching but do not increase the asset count.

## 6. Data-integrity integration

The contract `asset-catalog-integrity/1.0.0` validates the merged catalog independently of financial scoring.

It checks at minimum:

- global canonical-symbol uniqueness;
- symbol syntax;
- non-empty names;
- supported asset classes;
- catalog-source presence;
- expansion count against target per class;
- separation of catalog-only and provider-verifiable assets.

The registry exposes a read-only catalog-integrity endpoint for operational inspection. A degraded catalog-integrity result is not allowed to silently become a market-data or scoring fallback.

Automated tests enforce exactly 100 successful additions per class, 600 total expansion entries, uniqueness, real class counts, absence of financial observation fields on catalog entries and valid screening-contract classification.

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
- Provider rate limits, entitlements and symbol coverage determine runtime evidence availability and must not be hidden by catalog metadata.

## 9. Release lifecycle

ADR-0030 remains authoritative for version changes. This implementation did **not** by itself modify `package.json#version`; the platform remained `0.6.0` during implementation.

Because the change materially expands an end-user multi-asset capability, it is eligible for a future **MINOR** release classification when promoted as part of an accepted production release train. The actual version decision occurs only at the ADR-0030 Release Version Gate.

## 10. Acceptance criteria — verified

Verified on 2026-08-02:

1. all six classes receive exactly 100 new unique catalog entries;
2. the catalog-integrity contract reports `READY` under tests;
3. dependency audit, TypeScript, Vitest, production build and H7 deployment-readiness passed;
4. the search UI derives and displays class counts from the returned catalog;
5. expansion entries contain no invented financial observation fields;
6. unsupported provider paths remain fail-closed;
7. existing scoring contracts were not weakened to increase apparent asset coverage.

Implementation evidence:

- PR #54, merged as `cd34febd13213635b97322c398bb10c83c188a58`;
- `src/data/assetCatalogExpansion.ts`;
- `src/lib/assetSearchCatalog.ts`;
- `src/services/assetCatalogIntegrity.ts`;
- `tests/unit/assetSearchCatalog.test.ts`;
- `src/components/MarketScreener.tsx`.

**Decision:** Accepted and implementation verified.
