# VW-6 — GitHub Wiki Projection

**Status:** IMPLEMENTED ON BRANCH / PENDING HUMAN MERGE  
**Authority:** `ESS-0017` / `ESS-0017-CONTRACTS` / `ADR-0078`  
**Boundary:** one-way generated projection; Wiki is never authority

## Scope

- deterministic managed Wiki pages from canonical Vocabulary, Message Catalog and FinTech bindings;
- exact source-commit binding and SHA-256 checksums;
- no timestamps or model-generated free text in the deterministic projection;
- Dry-Run by default;
- controlled sync against an existing `Finance.wiki.git` checkout only;
- explicit `--apply` required for file mutation;
- separate `--push` required for network publication;
- no back-propagation from Wiki into Repository authorities.

## Implementation

- `src/platform/Vocabulary/Wiki/VocabularyWikiProjection.ts`
- `scripts/automation/renderVocabularyWiki.ts`
- `scripts/automation/syncVocabularyWiki.ts`
- `src/platform/Vocabulary/Tests/vocabularyWikiProjection.test.ts`

## Managed pages

- `Home.md`
- `Canonical-Vocabulary.md`
- `UI-Message-Catalog.md`
- `FinTech-Value-Chain.md`
- `Vocabulary-Governance-Boundary.md`

## Acceptance

- [x] deterministic rendering
- [x] exact 40-character source commit required
- [x] repository-authoritative flag is false
- [x] mutation authority is false
- [x] target remote must be `Finance.wiki.git`
- [x] dirty Wiki checkout fails closed
- [x] Dry-Run is default
- [x] `--push` cannot bypass `--apply`
- [x] no external Wiki publication executed before PR
