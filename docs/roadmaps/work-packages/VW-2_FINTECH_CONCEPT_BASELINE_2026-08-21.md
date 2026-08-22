# VW-2 — FinTech Concept Baseline

**Status:** IMPLEMENTED ON BRANCH / PENDING HUMAN MERGE  
**Authorities:** `ESS-0017`, `SC-MD-SPT-0001` (parent, read-only)

## Scope

- add one canonical Concept baseline for each of the 18 current FinTech stages;
- bind each stage to governed Message Keys;
- require `financialDecisionAuthority=false` and `mutationAuthority=false`;
- correlate stage IDs against the existing Quality projection instead of introducing a second runtime model.

## Implementation

- `src/platform/Vocabulary/Registry/seedConcepts.ts`
- `src/platform/Vocabulary/ValueChain/FintechWordingBinding.ts`
- `src/platform/Vocabulary/ValueChain/fintechWordingBindings.ts`

## Acceptance

- [x] 24 total seed Concepts: 6 existing + 18 FinTech baseline
- [x] all 18 Stage IDs covered exactly once
- [x] every Stage binding references existing Concepts and Messages
- [x] no Financial Runtime import/dependency
- [x] focused unit tests
