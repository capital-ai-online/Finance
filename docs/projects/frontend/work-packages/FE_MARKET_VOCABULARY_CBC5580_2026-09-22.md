# FE-MARKET-VOCABULARY-CBC5580 — FRONTEND sync and canonical Vocabulary binding

**Project:** `CAPITAL-AI-FE`  
**Primary Owner:** `CAPITAL-AI-FE`  
**Project/PVC relation:** cross-cutting presentation; no productive PVC ownership  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Branch base:** `main@1d3fd33c9c58e13de2df5348de2f386107c0218e`  
**Design source:** `SvenKulessa/FRONTEND@cbc558019ae6785f44079fe6fca3403460774df3`  
**Source tree:** `41afaf9797754efc760af682b1d1c2ecf67e49ef`  
**Status:** IMPLEMENTED_ON_BRANCH / EXACT_HEAD_EVIDENCE_PENDING

## Goal

Promote the latest owner-selected FRONTEND presentation generation without creating new Finance, Vocabulary, Compliance or market-data truth. The new Market Vocabulary experience is exposed publicly and reuses the existing canonical `LearningVocabulary` projection over `src/platform/Vocabulary`.

## Scope

- synchronize the inert allowlisted FRONTEND presentation snapshot to `cbc5580…`;
- pin the productive presentation source lock and Landing metadata to the same commit;
- remove the remaining drawer `System Online` chrome in line with the new source;
- expose `Market Vocabulary` in the Sideboard;
- add canonical public route `/vocabulary` plus source-compatible aliases;
- adapt the new graphical Vocabulary shell to the existing Finance `LearningVocabulary` component;
- preserve mobile-first behavior and the existing >=1024px desktop website adapter.

## Owner-correct boundaries

### Vocabulary

`src/platform/Vocabulary` / ESS-0017 remains the only terminology authority. The upstream `src/data/vocabularyData.ts` is deliberately not promoted.

### FINTECH

The new upstream asset fixture files are not promoted into productive market truth. Existing verified hydration and CAPITAL-AI-FINTECH ownership of asset/data/scoring semantics remain unchanged.

### Compliance

`KrakenReferralBanner.tsx` is mirrored as inert source evidence only. Productive referral/affiliate presentation remains blocked until CAPITAL-AI-COMP completes the applicable legal/regulatory review.

### Auth / Legal / Branding

Finance auth/session, CAPITAL-AI-COMP legal content and Finance branding tokens remain authoritative. No upstream sample auth/legal/domain logic is promoted.

## Dependencies and blockers

- Human/CODEOWNER merge is required.
- Exact-head repository checks must pass.
- Productive referral surface remains a separate COMP dependency.
- Expanded asset universe remains a separate FINTECH data-binding dependency.

## Exit evidence

- source snapshot manifest and runtime source lock both identify `cbc5580…`;
- `MarketVocabularyModal` imports and renders `LearningVocabulary`, not `vocabularyData`;
- `/vocabulary` renders the canonical Vocabulary projection;
- source-compatible aliases redirect to `/vocabulary`;
- Sideboard has `Market Vocabulary` and no `System Online`, `System v6.0 Online` or raw `#8D26FF` status panel;
- cbc5580 `ModuleDetailModal` interaction is exact-source locked;
- desktop responsive adapter remains intact;
- relevant exact-head tests/build/governance are green.

## Acceptance criteria

1. No second Vocabulary registry or fixture-backed terminology truth exists in productive runtime.
2. No unverified referral, asset universe, scoring or market-data fixture is promoted.
3. User can reach the canonical Vocabulary from the Sideboard and through `/vocabulary`.
4. Mobile and desktop layouts remain supported.
5. Source provenance is hash-verifiable.
6. Human/CODEOWNER merge remains the final production gate.
