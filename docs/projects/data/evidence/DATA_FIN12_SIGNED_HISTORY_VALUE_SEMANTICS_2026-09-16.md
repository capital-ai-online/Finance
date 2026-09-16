# DATA → FIN-12 signed history/value semantics

**Date:** 2026-09-16  
**Project:** `CAPITAL-AI-DATA`  
**Folder:** `docs/projects/data/`  
**Primary Owner:** `CAPITAL-AI-DATA`  
**Primary PVC:** `PVC-09..PVC-11`  
**Roadmap scope:** `DATA-14` provider validation + `DATA-15` data-contract testing; upstream return for FINTECH `FIN-12`  
**Branch:** `agent/data-fin12-history-semantics-20260916`  
**Initial baseline:** `main@c58f662deee989f270d6968881644d284435d5bd`  
**Current resync baseline:** `main@1780264d567f307c31fab149433969a8c359bcd1`  
**State:** `IMPLEMENTED_ON_BRANCH / CREATE_CORRELATION_PENDING`

## Current-main finding

`FIN_12_VALIDATED_FEATURE_BOUNDARY_RECORRELATION_2026-09-16.md` identifies a DATA-owned contract gap: `buildValidatedHistoryInput()` and `validateProviderHistoryInput()` apply positive-price semantics to every history point, while productive sovereign-yield evidence can legitimately contain finite negative values.

FINTECH must not weaken that rule locally because provider/value validation belongs to DATA/PVC-09..11.

## Change

The canonical DATA provider-input contract now exposes an explicit value-semantics discriminator:

- `POSITIVE_PRICE` — default; every value must remain finite and `> 0`;
- `SIGNED_VALUE` — explicit opt-in; every value must remain finite but may be negative, zero or positive.

`buildValidatedHistoryInput()` returns the selected `valueSemantics` and passes it through the same existing identity, correlation, evidence, provenance and freshness gates.

There is no asset-class heuristic that automatically turns Bond or Macro history into signed data. A caller must request `SIGNED_VALUE` explicitly, which keeps price histories fail-closed and prevents a broad relaxation of the canonical DATA gate.

## Contract effects

- `provider-input-validation` is advanced from `1.0.0` to `1.1.0` for the additive semantics field.
- Snapshot validation is unchanged and still requires a positive finite price.
- Default history behavior remains `POSITIVE_PRICE`; existing callers that provide no option retain previous behavior.
- Signed history still rejects `NaN`, infinities, malformed timestamps, absent evidence, wrong/missing provider identity and missing correlation IDs.
- Provenance/freshness evaluation remains the existing DATA implementation; no parallel DQ plane is introduced.

## Focused regression coverage

`tests/unit/validatedHistoryValueSemantics.test.ts` materializes four cases:

1. a negative history value with default semantics fails;
2. the same finite signed observations pass only with explicit `SIGNED_VALUE`;
3. non-finite signed values remain rejected;
4. provider-input validation exposes the `1.1.0` contract and signed admissibility reason.

Existing positive-price history consumers remain covered by their current tests and continue to call `buildValidatedHistoryInput(asset, history)` without a semantics override.

Fresh current-main type correlation confirms `CanonicalMarketDataHistory.currency` is `string | null`, `bond` is a canonical `MarketDataAssetClass`, and current Scoring contracts contain productive bond handling; the focused fixture therefore does not require a parallel data shape.

## FINTECH handoff impact

This closes only one of the four current FIN-12 upstream requirements: explicit validated value semantics for legitimate signed observations such as sovereign yields.

Still DATA-owned and open before FIN-12 can be fully released:

1. validated crypto snapshot dimensions (market-cap / volume / supply) with field-level provenance/freshness/DQ;
2. validated traditional fundamentals with field-level provenance;
3. a canonical validated-history bridge/contract for all productive crypto/traditional history consumers.

FINTECH remains prohibited from creating local provider normalization or Data Quality logic while these returns are pending.

## Re-sync and production correlation

During this run, Human/CODEOWNER merge of FE PR #1011 first advanced `main` to `bea9373811202aef98f3ad8ffd53dba99d37c453`. During final create-correlation, Human/CODEOWNER merge of FINTECH PR #1012 then advanced current `main` again to `1780264d567f307c31fab149433969a8c359bcd1`. The DATA branch was re-synchronized after both changes and consumes #1012 only as current-main upstream/downstream contract state.

Final post-resync correlation established:

- trust-root blob remains unchanged (`AGENTS.md` blob `197ea507ee112e450cf24ebaae26cd2103077b84`, Control Plane `2.11.0`);
- merge base equals current main `1780264d567f307c31fab149433969a8c359bcd1` and the branch is `0 behind`;
- PR #1012 is `MERGED / CURRENT_MAIN`; its FINTECH category/model/scoring-lineage implementation consumes DATA contracts and explicitly retains missing real category observations as a DATA/PVC-09..11 dependency; no #1012 file is overwritten by this branch;
- PR #1013 remains open and FE-owned; its appearance/token/shared-UI files have no DATA MarketData, provider, DQ, schema or ownership overlap with this package;
- the semantic relationship to merged #1012 is owner-compatible: DATA supplies validated value semantics while FINTECH remains downstream and does not gain provider/DQ authority;
- diff remains limited to two DATA MarketData contract files, one focused DATA test and this DATA evidence file;
- no FINTECH runtime file, Frontend file, Supabase schema, provider credential, Render configuration, Auth, billing or entitlement file is modified.

At the final correlation point, production `Finance` still reports `main@bea9373811202aef98f3ad8ffd53dba99d37c453` while current main is `1780264d567f307c31fab149433969a8c359bcd1`; the production commit is an ancestor of current main and the canonical PR production baseline records the exact drift rather than treating undeployed main commits as production evidence.

## Validation truth

- focused Vitest: `NOT RUN` pre-PR — the GitHub connector does not expose a dependency-complete repository test executor;
- TypeScript: `NOT RUN` pre-PR;
- full DATA contract suite: `NOT RUN` pre-PR;
- Production Build: `NOT RUN` pre-PR;
- hosted CI: deferred until after Draft PR creation according to current lifecycle/cost policy.

`NOT RUN` is not `PASS`.

## External systems

No provider credentials, provider activation, Supabase schema, Auth configuration, Render runtime, secret, entitlement, paid license or production mutation is performed by this package.

## Exit gate for this bounded slice

- positive price history remains positive-only by default;
- explicitly signed finite history is representable without local FINTECH validation forks;
- all identity/evidence/provenance/freshness gates remain active;
- focused positive/negative tests are materialized;
- exact-head correlation and hosted validation remain required before Human/CODEOWNER merge.

Repository materialization and current-main re-sync are complete. Draft-PR creation is permitted only if the immediately following exact-head/current-main/open-PR readback remains unchanged and the canonical Production-Baseline block is valid.
