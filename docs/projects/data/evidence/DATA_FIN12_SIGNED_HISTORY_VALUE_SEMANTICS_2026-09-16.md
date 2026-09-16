# DATA → FIN-12 signed history/value semantics

**Date:** 2026-09-16  
**Project:** `CAPITAL-AI-DATA`  
**Folder:** `docs/projects/data/`  
**Primary Owner:** `CAPITAL-AI-DATA`  
**Primary PVC:** `PVC-09..PVC-11`  
**Roadmap scope:** `DATA-14` provider validation + `DATA-15` data-contract testing; upstream return for FINTECH `FIN-12`  
**Branch:** `agent/data-fin12-signed-history-20260916`  
**Current-main baseline:** `main@1780264d567f307c31fab149433969a8c359bcd1`  
**State:** `IMPLEMENTED_ON_FRESH_CURRENT_MAIN_BRANCH / CREATE_CORRELATION_PENDING`

## Current-main finding

The current FIN-12 boundary identifies a DATA-owned contract gap: `buildValidatedHistoryInput()` and `validateProviderHistoryInput()` apply positive-price semantics to every history point, while productive sovereign-yield evidence can legitimately contain finite negative values.

FINTECH must not weaken that rule locally because provider/value validation belongs to `CAPITAL-AI-DATA / PVC-09..11`.

## Change

The canonical DATA provider-input contract exposes an explicit value-semantics discriminator:

- `POSITIVE_PRICE` — default; every value must remain finite and `> 0`;
- `SIGNED_VALUE` — explicit opt-in; every value must remain finite but may be negative, zero or positive.

`buildValidatedHistoryInput()` returns the selected `valueSemantics` and passes it through the same existing identity, correlation, evidence, provenance and freshness gates.

There is no asset-class heuristic that automatically turns Bond or Macro history into signed data. A caller must request `SIGNED_VALUE` explicitly, which keeps price histories fail-closed and prevents a broad relaxation of the canonical DATA gate.

## Contract effects

- `provider-input-validation` advances from `1.0.0` to `1.1.0` for the additive semantics field.
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

Existing positive-price history consumers continue to call `buildValidatedHistoryInput(asset, history)` without a semantics override.

## FINTECH handoff impact

This closes one bounded upstream FIN-12 requirement: explicit validated value semantics for legitimate signed observations such as sovereign yields.

Human-merged PR #1012 is part of this branch baseline. Its FINTECH Crypto Category / Model / Scoring Lineage contract consumes DATA-admitted observations, preserves DATA provenance and leaves missing/stale/conflicting evidence `NOT_COMPUTABLE`; it does not introduce a provider adapter or FINTECH-local DQ authority. The signed-history change therefore extends DATA semantics without overwriting or duplicating the integrated FINTECH contract.

Still DATA-owned and open before FIN-12 can be globally released are, at minimum:

1. validated crypto category/champion snapshot dimensions with field-level provider/feed/evidence/freshness/DQ lineage;
2. validated traditional fundamentals with field-level provenance;
3. a canonical validated-history bridge/contract for productive crypto/traditional history consumers.

FINTECH remains prohibited from creating local provider normalization or Data Quality logic while these returns are pending.

## Current writer correlation

At this materialization baseline:

- PR #1012 is `MERGED` and consumed through `main@1780264d567f307c31fab149433969a8c359bcd1`;
- PR #1013 is an open `CAPITAL-AI-FE` Appearance/Presentation writer and changes Frontend/UI/test/evidence surfaces, not `src/platform/MarketData/**`, this DATA evidence path or the focused DATA test;
- PR #1014 is an open `CAPITAL-AI-SOCIAL` detection/evidence writer and is docs-only outside `docs/projects/data/**`;
- no same-file, DATA namespace, Primary-Owner or provider-validation Authority conflict is identified by this snapshot.

Every later main/head/writer change invalidates this snapshot and requires final create-correlation again before Draft PR creation.

## Validation truth

- focused Vitest: `NOT RUN` pre-PR;
- TypeScript: `NOT RUN` pre-PR;
- full DATA contract suite: `NOT RUN` pre-PR;
- Production Build: `NOT RUN` pre-PR;
- hosted CI: intentionally deferred until after Draft PR creation according to current lifecycle/cost policy.

`NOT RUN` is not `PASS`.

## External systems

No provider credentials, provider activation, Supabase schema, Auth configuration, Render runtime, secret, entitlement, paid license or production mutation is performed by this package.

## Exit gate for this bounded slice

- `POSITIVE_PRICE` remains positive-only and fail-closed by default;
- `SIGNED_VALUE` is explicit opt-in and accepts only finite signed values;
- identity, provider/feed evidence, correlation, provenance and freshness gates remain active;
- focused positive/negative tests are materialized;
- no FINTECH-local DQ/provider fork is introduced;
- exact-head Hosted CI remains responsible for TypeScript/tests/build before Human/CODEOWNER merge.
