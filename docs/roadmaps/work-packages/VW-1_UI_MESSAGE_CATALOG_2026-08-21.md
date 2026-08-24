# VW-1 — UI Message Catalog

**Status:** IMPLEMENTED / MERGED VIA PR #477 / ACTIVE BASELINE ON MAIN
**Authority:** `ESS-0017` / `ESS-0017-CONTRACTS`  
**Traceability:** Owner priority 2026-08-21

## Scope

- typed stable Message Keys;
- DE/EN texts;
- Concept-ID references;
- context/status/version;
- declared placeholders;
- fail-closed structural and Concept-reference validation;
- no new localization runtime dependency.

## Implementation

- `src/platform/Vocabulary/Messages/UiMessage.ts`
- `src/platform/Vocabulary/Messages/UiMessageCatalog.ts`
- `src/platform/Vocabulary/Messages/seedMessages.ts`
- `src/platform/Vocabulary/Validators/UiMessageValidator.ts`

## Acceptance

- [x] stable keys and bilingual texts
- [x] unknown Concepts rejected
- [x] placeholder mismatch rejected
- [x] immutable catalog snapshots
- [x] focused unit tests
