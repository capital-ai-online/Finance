# CAPITAL-AI Vocabulary, Wording & Wiki Architecture

**Status:** ACTIVE BASELINE ON MAIN — merged via PR #477  
**Version:** 1.8.0  
**Date:** 2026-08-21  
**Authority:** `ESS-0017` / `ESS-0017-CONTRACTS` / `ADR-0078`  
**Financial parent authority:** `SC-MD-SPT-0001` — read-only projection only  
**Supersession:** `VOCABULARY-WORDING-WIKI-SUPERSESSION-0001`

## 1. Architecture

```text
Canonical Vocabulary Registry
        validates
UI Message Catalog
        -> React / PDF / E-Mail / SEO / Accessibility
        -> Wording Usage Index
        -> neutral Vocabulary Wording Snapshot
        -> existing DocumentaryDocument / D7 Knowledge / DocumentaryTraceability
        -> deterministic generated Wiki pages
        -> controlled Wiki sync (dry-run by default)
        -> explicit incremental source migration plan
        -> existing Repository Quality / test chain
```

**Projection, not Redefinition:** Vocabulary/Wording validates terminology and presentation contracts. It never becomes Financial Runtime, IAM, Billing, Compliance, Knowledge, Traceability, EventMesh, CI, Release, Deployment or production authority.

## 2. Canonical concepts and messages — VW-1/VW-2

`src/platform/Vocabulary/Registry/seedConcepts.ts` remains the canonical Concept baseline. It includes Concepts covering all 18 current `SC-MD-SPT-0001` stages. `Messages/UiMessageCatalog.ts` validates stable DE/EN Message Keys, Concept references, contexts, versions and declared placeholder contracts.

W3C SKOS remains the reference model for future preferred/alternative/hidden lexical-label separation. Unicode MessageFormat 2 remains an interoperability target; no RDF store or localization runtime dependency is introduced by VW-0 through VW-8.

Every FinTech wording binding remains:

```text
financialDecisionAuthority = false
mutationAuthority = false
```

## 3. Usage and delivery — VW-3/VW-4

`WordingUsageIndex` records only explicit stable Message-Key references and provides reverse-impact evidence:

```text
Concept -> Message Key -> Source/Feature/Route -> Surface -> FinTech Stage
```

Read-only delivery adapters exist for React, PDF, E-Mail, SEO and Accessibility. Context mismatches, retired messages and invalid placeholder values fail closed.

## 4. Documentary handoff — VW-5

Vocabulary defines no second Knowledge/Traceability model. `createVocabularyWordingSnapshot()` emits an exact-commit-bound neutral snapshot. `src/platform/Documentary/Knowledge/VocabularyWordingDocumentaryProjection.ts` consumes it and reuses:

1. `createDocumentaryDocument()`;
2. D7 `projectDocumentaryKnowledge()`;
3. `buildDocumentaryTraceabilityRecord()`.

Vocabulary itself retains no Documentary dependency.

## 5. GitHub Wiki projection — VW-6

`Wiki/VocabularyWikiProjection.ts` deterministically renders five managed pages:

- `Home.md`
- `Canonical-Vocabulary.md`
- `UI-Message-Catalog.md`
- `FinTech-Value-Chain.md`
- `Vocabulary-Governance-Boundary.md`

Properties:

- exact source commit SHA required;
- stable SHA-256 checksums;
- no generated timestamps or model prose;
- every page states that the Finance repository remains authoritative;
- `repositoryAuthoritative=false` and `mutationAuthority=false`.

`renderVocabularyWiki.ts` is check-only by default. `syncVocabularyWiki.ts` requires an existing clean Git checkout whose origin resolves to `Finance.wiki.git`; `--apply` is required before local mutation and `--push` before network publication. No Wiki publication is executed by this PR-preparation scope.

## 6. Controlled wording migration — VW-7

VW-7 deliberately avoids a repository-wide blind replacement. Existing copy is first captured unchanged in `migrationMessages.ts`, then mapped through `WordingMigrationPlan.ts` using exact source path, literal and Message Key.

States:

```text
OPEN      governed hardcoded literal remains queued
MIGRATED  source uses the stable Message Key
DRIFT     mapping is ambiguous or broken
```

`OPEN` remains accepted incremental debt. `DRIFT` blocks governance. The initial baseline contains five real `MarketScreener` wordings; it does **not** claim that every hardcoded UI string has already been migrated.

The browser resolver imports only browser-safe Vocabulary modules and introduces no Node polyfill or external dependency.

## 7. Continuous governance / release closure — VW-8

The existing repository validation architecture is reused. No second workflow or CI control plane is introduced.

Commands:

```text
npm run vocabulary:wording:test
npm run vocabulary:governance:check
npm run vocabulary:governance:prepr
```

The governance chain checks Catalog/bindings, Wiki determinism, migration drift and VW-0…VW-8 closure metadata. `test:raw` invokes the read-only governance check. Hosted GitHub CI remains post-PR according to repository cost policy.

## 8. Security and data-integrity invariants

Vocabulary/Wording must not:

- generate or alter Market Data;
- create Evidence or Provenance that did not exist;
- alter Classification, Scoring, Confidence, Ranking or Eligibility;
- bypass IAM, Entitlement or Billing DENY;
- turn `DATA_UNAVAILABLE`, partial or ineligible into a favorable state;
- authorize Compliance/Legal wording without the applicable parent authority;
- back-propagate Wiki edits into repository authorities;
- automatically mutate OPEN VW-7 source candidates;
- authorize Merge, Release, Deployment, Wiki publication or production mutation.

## 9. Work-package status

| Package | Scope | Current status |
|---|---|---|
| VW-0 | Supersession / Authority cleanup | active on main |
| VW-1 | UI Message Catalog | active on main |
| VW-2 | 18-stage FinTech Concept baseline | active on main |
| VW-3 | Wording Usage Index | active on main |
| VW-4 | React/PDF/E-Mail/SEO adapters | active on main |
| VW-5 | Documentary D7 / Traceability handoff | active on main |
| VW-6 | deterministic Wiki renderer / controlled sync | implemented; not externally published |
| VW-7 | controlled incremental wording migration baseline | implemented; OPEN candidates remain |
| VW-8 | continuous governance / release closure | active on main |

## 10. Governance and rollback

ESS Registry is synchronized in place; no second registry is created. The human merge of PR #477 made the implementation baseline effective on `main`; formal ESS/ADR lifecycle labels remain governed by their canonical registries. Rollback is repository-level `git revert`; this branch performs no Supabase, Render, Stripe, IAM, Wiki or production mutation.
