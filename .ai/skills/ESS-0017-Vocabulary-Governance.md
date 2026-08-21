---
skill:
  id: ESS-0017
  name: Vocabulary Governance
  version: 1.5.0
  status: Proposed
  maturity: Implementation Candidate
  owner: Platform Director
  category: Enterprise Architecture
  priority: High

capital_ai:
  platform: CAPITAL-AI Core
  repository: Finance
  architecture: Enterprise
  lifecycle: AI Native Development Lifecycle

classification:
  type: Technical Specification
  role: Canonical Vocabulary, Wording and generated Wiki Projection Governance
  contractAuthority: ESS-0001-CONTRACTS
  ownContracts: ESS-0017-CONTRACTS
  effectiveAfter: Human Merge
  note: >
    Vocabulary/Wording is cross-cutting presentation governance only. It does not
    own Financial Runtime, IAM, Billing, Compliance, EventMesh, Knowledge,
    Traceability, Release or Deployment decisions.

authority:
  controls:
    - Canonical Vocabulary Registry
    - Technical Naming Governance
    - Product Wording Governance
    - UI Message Catalog contracts
    - Wording Usage Index contracts
    - Bilingual terminology mapping
    - Alias and Forbidden-Term Governance
    - Generated Wiki projection contract
  collaborates:
    - Documentary Engine
    - Documentation Governance
    - Enterprise Knowledge Platform
    - Enterprise Traceability
    - Enterprise Event Mesh
    - Quality Center
    - Supervisor
    - Platform Director
    - Security & Compliance
    - Release Center
  cannot_modify:
    - Financial runtime decisions
    - Market data or evidence
    - Scoring confidence ranking or eligibility
    - IAM entitlement or billing decisions
    - Enterprise Specifications without approved governance flow
    - Architecture Decision Records without approved governance flow
    - Runtime code names without Safe Rename Gate
    - API contracts without impact validation
    - Event names without EventMesh compatibility validation

crossReference:
  dependsOn:
    - ESS-0001-CONTRACTS
    - ESS-0012
    - ESS-0013
  relatedEss:
    - ESS-0002
    - ESS-0003
    - ESS-0005
    - ESS-0009
    - ESS-0010
    - ESS-0011
    - ESS-0012-CONTRACTS
    - ESS-0013-CONTRACTS
  relatedAdr:
    - ADR-0078
  relatedAuthorities:
    - SC-MD-SPT-0001
  relatedComponents:
    - src/platform/Vocabulary
    - src/platform/Documentary
    - src/platform/Knowledge
    - src/platform/Traceability
    - src/platform/EventMesh
  relatedDocs:
    - docs/architecture/VOCABULARY_WORDING_WIKI_ARCHITECTURE.md
    - docs/governance/vocabulary/VOCABULARY_WORDING_WIKI_SUPERSESSION_2026-08-21.md

created: 2026-08-09
updated: 2026-08-21
---

# ESS-0017 — Vocabulary Governance

## 1. Enterprise Purpose

ESS-0017 is the canonical governance model for concepts, terminology, bilingual product wording and generated human-readable vocabulary documentation across CAPITAL-AI.

It does not replace Documentation Governance, Documentary, Knowledge, Traceability, EventMesh, Security/Compliance or any financial domain authority. It provides deterministic terminology and presentation contracts that those systems may consume through existing boundaries.

## 2. Normative principles

1. Technical identifiers and stable Message Keys are English.
2. Canonical Concepts have stable language-neutral IDs.
3. DE/EN preferred terms map to the same Concept ID.
4. Aliases and forbidden terms are explicit and collision-checked.
5. Active code renames require the existing Safe Rename Gate.
6. A concrete human-facing phrase belongs to the UI Message Catalog, not to a second Vocabulary Registry.
7. Message usages are read-only Evidence and never authorize source mutation.
8. GitHub Wiki is a generated one-way projection and never a source of authority.
9. Vocabulary/Wording may describe financial states but cannot change them.
10. Newer files or translations do not supersede higher authority by date alone.

## 3. Canonical architecture

```text
Canonical Vocabulary Registry
        validates
UI Message Catalog
        -> React / PDF / E-Mail / SEO / Accessibility
        -> Wording Usage Index
        -> neutral Vocabulary Wording Snapshot
        -> existing DocumentaryDocument / D7 Knowledge / DocumentaryTraceability
        -> generated GitHub Wiki
```

The architecture follows `Projection, not Redefinition`.

## 4. Canonical Concept Model

Every Concept contains at minimum:

- stable `id`;
- `canonicalCodeTerm`;
- `displayNameDE` and `displayNameEN`;
- DE/EN definitions;
- aliases and forbidden terms;
- category, lifecycle and version;
- ESS/ADR/Traceability references.

Concept lifecycle remains:

```text
draft -> proposed -> approved -> deprecated -> retired
```

Deprecated or retired IDs remain resolvable for historical evidence and are never reused.

### Label evolution

W3C SKOS is the reference model for future separation of preferred, alternative and hidden lexical labels. CAPITAL-AI keeps its TypeScript contract and does not require an RDF store. Hidden labels are search/migration aids and are distinct from forbidden terms.

## 5. UI Message Catalog — VW-1

Concrete user-facing messages use stable keys and carry:

- DE text;
- EN text;
- referenced Concept IDs;
- delivery context;
- lifecycle status and semantic version;
- declared placeholders;
- additional authority references where required.

Implemented contexts:

```text
react | pdf | email | seo | accessibility | shared
```

The Catalog validates Concept references and fails closed on invalid keys, versions, translations or placeholder contracts.

Runtime interpolation currently implements only deterministic declared placeholders. Full Unicode MessageFormat 2 support is a future adapter concern and is not claimed by VW-1 through VW-5.

## 6. FinTech Value-Chain Baseline — VW-2

`SC-MD-SPT-0001` remains the parent financial authority. Vocabulary contains a read-only wording projection for all 18 current stages:

1. Request Intake
2. Identity / Access
3. Entitlement / Usage Gate
4. Asset Discovery / Universal Asset Identity
5. Orchestration / Runtime Guard
6. Market-Data / Evidence Acquisition
7. Data Validation / Provenance / DQ
8. Verified Display / Research Lane
9. Classification + Feature Contract
10. ScoringModelRegistry
11. ScoringDispatcher
12. Domain Executor Adapter
13. CanonicalScoreResult + execution lineage
14. Confidence / DQ Composite
15. Ranking comparability gate
16. Ranking / Eligibility / SLO
17. EventMesh / Traceability / Supervisor
18. API / UI / Alerts / downstream evidence

Every binding is explicitly:

```text
financialDecisionAuthority = false
mutationAuthority = false
```

Stage IDs are checked against the existing Quality projection instead of introducing a second financial runtime model.

## 7. Wording Usage Index — VW-3

The Usage Index scans only explicit stable Message-Key references in configured source roots. It does not infer or fabricate usage from similar natural-language strings.

Reverse impact supports:

```text
Concept
 -> Message Keys
 -> source paths / features / routes
 -> delivery surfaces
 -> FinTech stage references
```

Hardcoded legacy UI strings are intentionally not mass-migrated before VW-7.

## 8. Delivery adapters — VW-4

The catalog exposes read-only adapters for React, PDF, E-Mail, SEO and Accessibility. A context-specific message cannot be delivered through another surface; `shared` messages may be reused across surfaces. Retired messages and missing placeholders fail closed.

These adapters do not grant legal, compliance, financial or security authority to message text.

## 9. Documentary / Knowledge / Traceability Handoff — VW-5

VW-5 deliberately avoids a parallel Knowledge-/Traceability model.

Vocabulary produces an exact-commit-bound `VocabularyWordingSnapshot` containing Concepts, Messages, actual Usage records, 18-stage bindings, authority references, checksum and explicit non-authorizing flags.

The Documentary adapter `Knowledge/VocabularyWordingDocumentaryProjection.ts` then reuses the existing canonical platform contracts:

1. `createDocumentaryDocument()`;
2. D7 `projectDocumentaryKnowledge()`;
3. `buildDocumentaryTraceabilityRecord()`.

Vocabulary therefore retains no direct dependency on Documentary, Knowledge or Traceability, while the existing Documentary layer remains the sole Knowledge-/Traceability handoff. No Wiki publishing occurs before VW-6.

## 10. Security / Compliance / Data Integrity Boundary

Vocabulary/Wording must never:

- convert `DATA_UNAVAILABLE`, DENY, partial or ineligible into a more favorable state;
- synthesize financial values or missing Evidence;
- alter scoring, confidence, ranking or eligibility;
- bypass IAM/Entitlement/Billing decisions;
- approve legal/compliance wording without its parent authority;
- authorize Merge, Release, Deployment or production mutation.

## 11. Supersession

`VOCABULARY-WORDING-WIKI-SUPERSESSION-0001` supersedes the former phase-based Vocabulary migration/status documents as the current architecture projection after Human Merge. Historical phase documents remain non-authorizing Evidence until reference-safe archival.

## 12. Implementation status

Implemented on the current branch through VW-5:

- VW-0 Supersession and architecture consolidation;
- VW-1 typed UI Message Catalog and validator;
- VW-2 18-stage FinTech Concept/Message bindings;
- VW-3 Wording Usage Index and source scanner;
- VW-4 delivery adapters;
- VW-5 neutral Vocabulary snapshot plus canonical Documentary D7/Traceability handoff;
- targeted tests and local validation entrypoint.

Not yet implemented by this scope:

- VW-6 Wiki renderer/sync;
- VW-7 migration of all hardcoded user-facing strings;
- VW-8 full continuous governance/release closure.
