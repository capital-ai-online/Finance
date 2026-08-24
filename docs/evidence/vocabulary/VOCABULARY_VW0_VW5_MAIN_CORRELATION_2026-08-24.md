# Vocabulary VW-0–VW-5 Main Correlation and Hygiene Evidence

**Status:** VERIFIED ON BRANCH  
**Date:** 2026-08-24  
**Baseline:** `main@7afa86e24812e3de96e93882b9658d2b2e0311e7`  
**Implementation merge:** PR #477  
**Authorities:** `ESS-0017`, `ESS-0017-CONTRACTS`, `ADR-0078`, `SC-MD-SPT-0001`

## Result

| Package | Canonical implementation | Correlation result |
|---|---|---|
| VW-0 | Supersession package, architecture, ADR-0078 references | Complete; stale pre-merge lifecycle markers corrected |
| VW-1 | `src/platform/Vocabulary/Messages/*`, `Validators/UiMessageValidator.ts` | Complete; stable bilingual keys and fail-closed concept/placeholder validation |
| VW-2 | `Registry/seedConcepts.ts`, `ValueChain/*` | Complete; all 18 SC-MD-SPT-0001 stages, read-only and non-authorizing |
| VW-3 | `Usage/*` | Complete; explicit usage evidence and reverse concept impact |
| VW-4 | `Delivery/*` | Complete; React/PDF/E-Mail/SEO/Accessibility adapters with context isolation |
| VW-5 | `Projection/VocabularyWordingSnapshot.ts`, Documentary consumer | Complete; exact-commit snapshot and reuse of existing D7/Traceability contracts |

## Canonical paths

- Runtime control plane: `src/platform/Vocabulary/`
- Current architecture: `docs/architecture/VOCABULARY_WORDING_WIKI_ARCHITECTURE.md`
- Supersession: `docs/governance/vocabulary/VOCABULARY_WORDING_WIKI_SUPERSESSION_2026-08-21.md`
- Work packages: `docs/roadmaps/work-packages/VW-0_…` through `VW-8_…`
- Historical roadmap: `docs/architecture/VOCABULARY_GOVERNANCE_MIGRATION_ROADMAP.md` (non-authorizing)
- Authorities/contracts: `.ai/skills/ESS-0017-Vocabulary-Governance.md`, `.ai/skills/ESS-0017-Contracts.md`, `docs/adr/ADR-0078-vocabulary-governance-authority-and-namespace.md`

## Hygiene and supersession closure

- PR #477 is merged; the old exclusive work claim is released.
- Work packages and architecture no longer claim “pending human merge”.
- Supersession is explicitly effective on main; historical phase documents remain evidence.
- Closure validation rejects stale pre-merge markers and an unreleased PR #477 claim.
- No financial runtime, IAM, billing, scoring, ranking, Wiki publication or production mutation is introduced.

## Reuse decision

The existing typed TypeScript catalog, validators and Documentary projection satisfy the scope. FormatJS/i18next would add runtime dependencies and migration cost without closing a demonstrated gap, so no external library was introduced.
