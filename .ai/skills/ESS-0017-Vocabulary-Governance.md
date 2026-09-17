---
skill:
  id: ESS-0017
  name: Vocabulary Governance
  version: 1.0.0
  status: Proposed
  maturity: Foundation
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
  role: Spezifikation der Canonical Vocabulary Governance
  contractAuthority: ESS-0001-CONTRACTS
  ownContracts: ESS-0017-CONTRACTS
  note: >
    Dieses Dokument spezifiziert ausschließlich Vocabulary-, Terminology- und
    Naming-Governance. Globale Repository-, Event-, Layer- und Release-Regeln
    verbleiben in ESS-0001-CONTRACTS. Documentation Governance verbleibt unter ESS-0012.

authority:
  controls:
    - Canonical Vocabulary Registry
    - Technical Naming Governance
    - Product Wording Governance
    - Terminology Lifecycle
    - Alias and Forbidden-Term Governance
    - Bilingual Terminology Mapping
  collaborates:
    - Documentary Engine
    - Documentation Governance
    - Enterprise Knowledge Platform
    - Enterprise Traceability
    - Enterprise Event Mesh
    - Supervisor
    - Platform Director
    - Quality Center
    - Security & Compliance
    - Version Manager
    - Release Center
  cannot_modify:
    - Enterprise Specifications without approved governance flow
    - Architecture Decision Records without approved governance flow
    - Runtime code names without Safe Rename Gate
    - API contracts without impact validation
    - Environment keys without impact validation
    - Event names without EventMesh compatibility validation

crossReference:
  dependsOn:
    - ESS-0001-CONTRACTS
    - ESS-0012
    - ESS-0013
  relatedEss:
    - ESS-0003
    - ESS-0005
    - ESS-0006
    - ESS-0009
    - ESS-0010
    - ESS-0011
    - ESS-0012-CONTRACTS
    - ESS-0013-CONTRACTS
  relatedAdr:
    - ADR-0046
  relatedComponents:
    - src/platform/Vocabulary
    - src/platform/Documentary
    - src/platform/Knowledge
    - src/platform/Traceability
    - src/platform/EventMesh
  relatedDocs:
    - docs/architecture/VOCABULARY_GOVERNANCE_MIGRATION_ROADMAP.md
    - docs/architecture/VOCABULARY_GOVERNANCE_PHASE_1_5_BASELINE.md
    - docs/architecture/LEGACY_DOCUMENTATION_CONSOLIDATION_2026-08-09.md

created: 2026-08-09
---

# ESS-0017 — Vocabulary Governance

## 1. Enterprise Purpose

ESS-0017 defines the canonical governance model for names, terms, wording and bilingual terminology across CAPITAL-AI.

It does not replace Documentation Governance, the Enterprise Knowledge Platform, Enterprise Traceability or the Enterprise Event Mesh. It provides a dedicated terminology authority that integrates with those components through existing contracts and events.

## 2. Normative Principles

1. Technical code identifiers are English.
2. Enterprise documentation is maintained in German and English.
3. Human-facing pull request information is German.
4. Canonical concepts have stable, language-neutral identities.
5. German and English labels map to the same concept identity.
6. Aliases are explicit; forbidden terms are explicit.
7. Active code renames require a Safe Rename Gate before implementation.
8. Legacy documentation is not a canonical terminology source unless revalidated against current code and current authorities.
9. Vocabulary changes are traceable to ESS, ADR, events and evidence.
10. Vocabulary lifecycle actions integrate into the CAPITAL-AI event-driven value chain without bypassing human approval boundaries.

## 3. Component Boundary

Planned implementation location:

```text
src/platform/Vocabulary/
  Domain/
  Registry/
  Services/
  Validators/
  Events/
  Interfaces/
  Types/
  Tests/
```

The component may depend only on approved shared contracts and public interfaces. It must not introduce a second Event Bus, second Knowledge Graph or second Traceability store.

## 4. Canonical Concept Model

Every canonical concept contains at minimum:

- `id`
- `canonicalCodeTerm`
- `displayNameDE`
- `displayNameEN`
- `definitionDE`
- `definitionEN`
- `aliases`
- `forbiddenTerms`
- `category`
- `status`
- `essReferences`
- `adrReferences`
- `traceabilityReferences`
- `version`

Concept IDs are stable and language-neutral. Labels may evolve under version control without changing identity.

## 5. Lifecycle

Allowed concept states:

```text
draft -> proposed -> approved -> deprecated -> retired
```

A deprecated or retired concept remains resolvable for historical evidence and traceability. Its ID is never reused.

## 6. Naming Domains

Vocabulary Governance separates at least:

- code and component naming;
- file and directory naming;
- API and schema naming;
- event naming;
- product terminology;
- UI wording;
- documentation terminology;
- compliance and governance terminology.

A UI translation must never change a technical identifier implicitly.

## 7. Safe Rename Boundary

No active rename is authorized solely by a vocabulary decision. The later Safe Rename Gate must validate at minimum repository references, imports/exports, dynamic imports, routes/APIs/schemas, configuration/environment references, regex/naming policies, filesystem casing, TypeScript/lint, tests, production build and deployment readiness.

Classification is `SAFE`, `CONDITIONAL` or `BLOCKED`.

## 8. Event-Driven Integration

Vocabulary Governance produces and consumes only registered Enterprise Events through public EventMesh interfaces. Direct implementation coupling to EventMesh internals is prohibited.

Planned vocabulary lifecycle events are defined in ESS-0017-CONTRACTS and must be checked against the canonical Event Catalog before registration.

Downstream integration targets include Documentary, Knowledge, Traceability, Quality, Security/Compliance, Supervisor, Platform Director, Version Manager and Release.

## 9. Bilingual Documentation

German and English documentation derive terminology from the same concept IDs. Language variants may differ stylistically, but they must remain semantically equivalent for governed terms.

Missing or diverging translations are governance findings and later event-producing conditions.

## 10. Pull Request Wording

Human-facing PR title/body information is German. Machine-readable identifiers and stable technical keys remain English where required for deterministic automation.

## 11. Legacy Documentation Rule

Documents classified by PR #142 as historical, superseded or evidence snapshots may seed review candidates only. They cannot automatically establish canonical terminology.

## 12. Success Criteria

ESS-0017 is implemented when:

- the Canonical Vocabulary Registry exists as a single terminology source;
- concepts are typed, versioned and collision-checked;
- DE/EN mappings are deterministic;
- aliases and forbidden terms are validated;
- EventMesh integration uses canonical registered events;
- Traceability links concepts to ESS/ADR/components/evidence;
- Documentation Governance can validate terminology usage;
- active renames cannot bypass the Safe Rename Gate;
- no duplicate terminology authority exists elsewhere in the platform.
