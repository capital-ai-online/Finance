# CAPITAL-AI Canonical Vocabulary & Wording

Authority: `ESS-0017` / `ESS-0017-CONTRACTS`  
Architecture decision: `ADR-0078`  
Financial parent authority: `SC-MD-SPT-0001` (read-only projection only)  
Implementation baseline: VW-0 through VW-5

## Purpose

`src/platform/Vocabulary` is CAPITAL-AI's canonical terminology and product-wording control plane. It owns stable Concept IDs and governed DE/EN wording contracts, but it does not own Financial Runtime, IAM, Billing, Compliance, EventMesh, Knowledge, Traceability, Release or Deployment decisions.

```text
Canonical Vocabulary Registry
        validates
UI Message Catalog
        -> React / PDF / E-Mail / SEO / Accessibility
        -> Wording Usage Index
        -> Documentary / Knowledge / Traceability Projection
        -> generated GitHub Wiki (VW-6, not yet active)
```

The governing architecture rule is **Projection, not Redefinition**.

## Implemented areas

### VW-0 — Supersession

The former phase-based Vocabulary migration/status architecture is superseded as the current architecture projection by `docs/architecture/VOCABULARY_WORDING_WIKI_ARCHITECTURE.md` after Human Merge. Historical phase documents remain Evidence until reference-safe archival.

### VW-1 — UI Message Catalog

- typed `UiMessageDefinition`;
- stable English message keys;
- DE/EN text;
- Concept-ID references;
- context, lifecycle and version;
- declared placeholders;
- fail-closed validation.

Example:

```ts
import {
  createDefaultUiMessageCatalog,
  createDefaultVocabularyRegistry,
} from './index';

const registry = createDefaultVocabularyRegistry();
const messages = createDefaultUiMessageCatalog(registry);

messages.get('screening.request.title')?.text.de; // Analyse starten
```

### VW-2 — FinTech value-chain wording projection

The component contains a read-only Concept/Message binding for all 18 current `SC-MD-SPT-0001` stages. Every binding explicitly sets:

```text
financialDecisionAuthority = false
mutationAuthority = false
```

The targeted validator checks the stage IDs against the existing Quality projection instead of creating a second financial runtime model.

### VW-3 — Wording Usage Index

`scanWordingUsages()` scans explicit stable Message-Key references in configured source roots and builds deterministic reverse-impact Evidence:

```text
Concept -> Message Keys -> Source Paths / Features -> Surfaces -> FinTech Stages
```

It does not infer usage from similar natural-language strings and does not mutate source files.

### VW-4 — Delivery adapters

Read-only adapters exist for React, PDF, E-Mail, SEO and Accessibility. Context mismatches, retired messages and missing declared placeholder values fail closed.

### VW-5 — Documentary / Knowledge / Traceability projection

`projectVocabularyGovernance()` produces a deterministic exact-commit-bound projection containing Documentary summary metadata, Knowledge nodes/relationships, Traceability edges and a SHA-256 checksum.

The projection is an interchange/handoff contract only. It does not persist a second Knowledge Graph or Traceability Store.

## Canonical Concept access

```ts
import { createDefaultVocabularyRegistry, VocabularyService } from './index';

const registry = createDefaultVocabularyRegistry();
const vocabulary = new VocabularyService(registry);

vocabulary.getCanonicalTerm('Abonnement'); // Subscription
vocabulary.getDisplayName('Subscription', 'de'); // Abonnement
```

## Validation

Targeted local check:

```text
npm run vocabulary:wording:check
```

Focused tests live under `src/platform/Vocabulary/Tests/` and cover:

- canonical Registry contracts;
- VW-1 Message Catalog;
- VW-2 complete 18-stage binding;
- VW-3 Usage Index;
- VW-4 Delivery Adapter boundaries;
- VW-5 deterministic projection.

## Boundaries

- no direct Financial Hotpath mutation dependency;
- no synthetic upgrade of `DATA_UNAVAILABLE`, DENY, partial or ineligible states;
- no autonomous legal/compliance approval;
- no second Event Bus, Knowledge Graph or Traceability Store;
- no Wiki back-propagation into Repository authorities;
- no automatic code rename outside the Safe Rename Gate;
- no Merge, Release, Deployment or production mutation authority.

## Next packages

- VW-6 — deterministic GitHub Wiki renderer and controlled one-way sync;
- VW-7 — incremental migration of hardcoded user-facing strings;
- VW-8 — continuous governance and release closure.
