# CAPITAL-AI Vocabulary, Wording & Wiki Architecture

**Status:** Implementation Candidate — effective after Human Merge  
**Version:** 1.5.0  
**Date:** 2026-08-21  
**Authority:** `ESS-0017` / `ESS-0017-CONTRACTS` / `ADR-0078`  
**Financial parent authority:** `SC-MD-SPT-0001` — read-only projection only  
**Supersession:** `VOCABULARY-WORDING-WIKI-SUPERSESSION-0001`

## 1. Architecture

```text
┌──────────────────────────────────┐
│ Canonical Vocabulary Registry    │
│ Concept IDs / DE+EN / aliases    │
│ forbidden terms / authority      │
└──────────────┬───────────────────┘
               │ validates
               ▼
┌──────────────────────────────────┐
│ UI Message Catalog               │
│ stable key / DE+EN / Concepts    │
│ context / status / version       │
└──────────────┬───────────────────┘
               │
       ┌───────┼────────┬──────────┐
       ▼       ▼        ▼          ▼
     React    PDF     E-Mail       SEO
       │
       ▼
┌──────────────────────────────────┐
│ Wording Usage Index              │
│ key -> source/feature/surface     │
│     -> FinTech stage             │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Documentary / Knowledge /        │
│ Traceability Projection          │
└──────────────┬───────────────────┘
               │ VW-6 generated
               ▼
┌──────────────────────────────────┐
│ GitHub Wiki                      │
│ human-readable projection only   │
└──────────────────────────────────┘
```

**Projection, not Redefinition:** Vocabulary/Wording describes and validates terminology and presentation contracts. It never becomes a Financial Runtime, IAM, Billing, Compliance, Knowledge, Traceability, EventMesh, Release or Deployment authority.

## 2. Canonical Concept layer

`src/platform/Vocabulary/Registry/seedConcepts.ts` contains the current seed baseline. Existing Concepts remain stable; VW-2 adds Concepts covering each of the 18 current `SC-MD-SPT-0001` stages.

W3C SKOS is the reference model for future separation of preferred, alternative and hidden lexical labels. The current TypeScript registry remains authoritative; no RDF store is introduced.

## 3. UI Message Catalog — VW-1

Implementation:

- `Messages/UiMessage.ts`
- `Messages/UiMessageCatalog.ts`
- `Messages/seedMessages.ts`
- `Validators/UiMessageValidator.ts`

The Catalog validates stable keys, SemVer-like message versions, DE/EN content, Concept references and declared placeholders. Unknown Concepts or invalid contracts fail closed.

Message Format 2 is treated as a future interoperability target. VW-1 through VW-5 do not claim full MF2 runtime semantics and add no external localization dependency.

## 4. FinTech wording bindings — VW-2

Implementation:

- `ValueChain/FintechWordingBinding.ts`
- `ValueChain/fintechWordingBindings.ts`

All 18 current stages are represented exactly once. Every binding has:

```text
financialDecisionAuthority = false
mutationAuthority = false
```

The targeted validation command correlates these stage IDs against `src/platform/Quality/ValueChain/FintechValueChainQualityProjection.ts`; Vocabulary does not import or duplicate its runtime behavior.

## 5. Wording Usage Index — VW-3

Implementation:

- `Usage/WordingUsage.ts`
- `Usage/WordingUsageIndex.ts`

The scanner records only explicit stable Message-Key references in configured application/server source roots. It does not infer usage from similar natural-language text.

Reverse impact:

```text
Concept
 -> Message Keys
 -> Source Paths / Features / Routes
 -> Delivery Surfaces
 -> FinTech Stage References
```

This is read-only Evidence. Hardcoded UI wording migration remains VW-7.

## 6. Delivery adapters — VW-4

Implementation:

- `Delivery/MessageDeliveryAdapter.ts`
- `Delivery/createMessageDeliveryAdapters.ts`

Adapters exist for React, PDF, E-Mail, SEO and Accessibility. `shared` messages may cross surfaces; context-specific messages may not. Missing placeholder values and retired messages fail closed.

No adapter may upgrade a fail-closed financial/security state or authorize a legal/compliance claim.

## 7. Documentary / Knowledge / Traceability projection — VW-5

Implementation:

- `Projection/VocabularyGovernanceProjection.ts`

Input:

- exact source commit SHA;
- canonical Vocabulary Registry;
- UI Message Catalog;
- Wording Usage Index;
- 18-stage FinTech bindings.

Output:

- Documentary summary;
- Concept, Message, Source, FinTech-Stage and Authority nodes;
- `HAS_MESSAGE`, `USED_BY`, `PROJECTS_STAGE`, `GOVERNED_BY` relationships;
- Traceability edges;
- SHA-256 checksum;
- explicit non-authorizing flags.

The projection does not persist a second Knowledge Graph or Traceability Store. It is a deterministic handoff to the existing Documentary/Knowledge/Traceability architecture.

## 8. GitHub Wiki boundary

VW-6 will produce a one-way generated Wiki projection:

```text
Finance.git authorities
 -> deterministic generated Markdown
 -> controlled sync
 -> Finance.wiki.git
```

Manual Wiki content is non-authoritative and must never automatically back-propagate into Registry, ESS, ADR or Message Catalog.

## 9. Security and data-integrity invariants

Vocabulary/Wording must not:

- generate or alter Market Data;
- create Evidence or Provenance that did not exist;
- alter Classification, Scoring, Confidence, Ranking or Eligibility;
- bypass IAM, Entitlement or Billing DENY;
- turn `DATA_UNAVAILABLE`, partial or ineligible into a favorable state;
- authorize Compliance/Legal wording without the applicable parent authority;
- authorize Merge, Release, Deployment or production mutation.

## 10. Work-package status

| Package | Scope | Status on branch |
|---|---|---|
| VW-0 | Supersession / Authority cleanup | implemented |
| VW-1 | UI Message Catalog | implemented |
| VW-2 | 18-stage FinTech Concept baseline | implemented |
| VW-3 | Wording Usage Index | implemented |
| VW-4 | React/PDF/E-Mail/SEO adapters | implemented |
| VW-5 | Documentary/Knowledge/Traceability projection | implemented |
| VW-6 | Wiki renderer / controlled sync | pending |
| VW-7 | hardcoded UI wording migration | pending |
| VW-8 | continuous governance / release closure | pending |

## 11. Validation

Targeted cheap/local command:

```text
npm run vocabulary:wording:check
```

The command validates the Catalog, all 18 bindings, stage-ID correlation, actual key usages and a commit-bound projection. Hosted GitHub CI remains post-PR according to repository cost governance.
