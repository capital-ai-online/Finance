# FT-2A Evidence — Crypto Category Profile Resolution

**Evidence-ID:** `FT2A-CRYPTO-CATEGORY-PROFILE-RESOLUTION-2026-08-20`  
**Date:** 2026-08-20  
**Branch:** `feat/fintech-core-crypto-module-01`  
**Synchronized main:** `a8d384154ff2eb1bfe74108eb4a4119cbab2a040`  
**Roadmap:** `FT-CORE-CRYPTO-01`  
**ADR:** `ADR-0098`

## Goal

Introduce the analytical multi-profile layer required by the Owner orchestration model without replacing the existing canonical `CryptoClassification` contract and without creating a second scoring authority.

## Implemented resolver

`src/platform/FinTechCore/Modules/Crypto/CryptoCategoryProfileResolver.ts`

Contract version:

`fintech-core.crypto/category-profile-resolver/0.1.0`

### Primary authority

The existing canonical classification remains the primary category authority.

The resolver maps `classification.category_main` to the corresponding analysis profile and marks the source as:

`CANONICAL_CLASSIFICATION`

No external or agent tag may replace the canonical primary profile in FT-2A.

### Secondary profile evidence

Secondary profile candidates support explicit source classes:

- `DETERMINISTIC_REGISTRY`
- `VERIFIED_EXTERNAL_TAXONOMY`
- `AGENT_RESEARCH`

Only deterministic registry evidence and verified external taxonomy evidence can promote a specialized secondary profile.

`AGENT_RESEARCH` is always rejected for profile promotion and remains research-only evidence.

### Evidence requirements

A secondary promotion requires at least one `evidenceRef`.

Missing evidence refs fail closed and do not produce an analysis profile.

### Conditional profile gates

Narrower profile mappings cannot be inferred from a broad category alone.

Initial examples:

- `AI / Data` -> `ai-depin` requires explicit `depin` qualifier evidence.
- `NFT / Creator` -> `nft` requires explicit `nft` or `collection` qualifier evidence.

Without those qualifiers, the candidate is retained only as rejected evidence and is not promoted.

### No double counting

Profile IDs are deduplicated.

If the primary category and a secondary evidence source resolve to the same analysis profile, the secondary candidate does not create a second profile instance or a second weight contribution.

### Unknown / unsupported profiles

A primary classification resolving to `generic/PENDING_EVIDENCE` produces:

`analysisReady = false`

No synthetic specialized profile is invented.

## Scoring boundary

Every resolution returns:

`scoreAuthority = SCORING_DISPATCHER_ONLY`

FT-2A does not calculate a canonical score, alter a canonical score, select a scoring model or invoke a domain scoring executor.

## Tests

`tests/unit/fintechCoreCryptoCategoryProfileResolver.test.ts`

Coverage includes:

- canonical primary profile ownership;
- verified secondary profile promotion;
- duplicate profile deduplication;
- agent-research non-promotion;
- evidence-reference requirement;
- conditional AI/DePIN qualifier gate;
- unknown/generic not-analysis-ready behavior.

`tests/architecture/fintechCoreAuthorityBoundary.test.ts` now includes the resolver in the direct-authority import boundary.

## External systems

No Supabase mutation.

No Render mutation or deploy.

No new provider dependency or plugin.

No new NPM dependency.

## Remaining FT-2A work

Before FT-2A can be considered complete rather than foundation-complete:

- bind real secondary deterministic/verified taxonomy evidence sources through explicit adapters;
- define field-level provenance for each promoted category/tag;
- reconcile category evidence with the existing ClassificationService without creating a second primary classifier;
- decide how profile selections enter the future verified feature contract without direct score mutation;
- execute TypeScript/Vitest/governance checks;
- synchronize roadmap/document registry at the next mandatory open-PR/main gate.
