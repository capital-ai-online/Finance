# VW-5 — Documentary / Knowledge / Traceability Handoff

**Status:** IMPLEMENTED / MERGED VIA PR #477 / ACTIVE BASELINE ON MAIN
**Authorities:** `ESS-0017`, `ESS-0010`, `ESS-0009`, `ESS-0011`  
**Boundary:** neutral Vocabulary snapshot -> existing Documentary contracts

## Scope

- build an exact-commit-bound deterministic Vocabulary Wording Snapshot;
- carry Concepts, Messages, actual Source usages, all 18 FinTech stages and Authority references;
- preserve `financialDecisionAuthority=false` and `mutationAuthority=false`;
- let Documentary consume the snapshot through its existing `DocumentaryDocument`, D7 Knowledge and Traceability contracts;
- do not create a parallel Knowledge/Traceability model or persistence layer;
- do not publish to GitHub Wiki before VW-6.

## Implementation

- `src/platform/Vocabulary/Projection/VocabularyWordingSnapshot.ts`
- `src/platform/Documentary/Knowledge/VocabularyWordingDocumentaryProjection.ts`
- existing `src/platform/Documentary/Models/DocumentaryDocument.ts`
- existing `src/platform/Documentary/Knowledge/DocumentaryKnowledgeProjection.ts`
- existing `src/platform/Documentary/Traceability/DocumentaryTraceability.ts`
- `scripts/automation/validateVocabularyWordingGovernance.ts`
- `npm run vocabulary:wording:test`
- `npm run vocabulary:wording:check`

## Acceptance

- [x] exact 40-character source commit required before snapshot creation
- [x] deterministic snapshot checksum for identical input
- [x] Vocabulary keeps no direct Documentary/Knowledge/Traceability dependency
- [x] Documentary creates the canonical `DocumentaryDocument`
- [x] D7 `projectDocumentaryKnowledge()` is reused
- [x] `buildDocumentaryTraceabilityRecord()` is reused
- [x] all 18 FinTech stages included in the snapshot/handoff
- [x] no second graph/store/event authority
- [x] no persistence or external mutation
- [x] focused unit tests
