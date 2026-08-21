---
skill:
  id: ESS-0017
  name: Vocabulary Governance
  version: 1.8.0
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
    Traceability, Release, Deployment or production decisions.

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
    - Controlled wording migration contract
  cannot_modify:
    - Financial runtime decisions
    - Market data or evidence
    - Scoring confidence ranking or eligibility
    - IAM entitlement billing or compliance decisions
    - Enterprise Specifications without approved governance flow
    - Architecture Decision Records without approved governance flow
    - Runtime code names without Safe Rename Gate
    - API contracts without impact validation
    - Merge release deployment or production state

crossReference:
  dependsOn:
    - ESS-0001-CONTRACTS
    - ESS-0012
    - ESS-0013
  relatedEss:
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
  relatedDocs:
    - docs/architecture/VOCABULARY_WORDING_WIKI_ARCHITECTURE.md
    - docs/governance/vocabulary/VOCABULARY_WORDING_WIKI_SUPERSESSION_2026-08-21.md

created: 2026-08-09
updated: 2026-08-21
---

# ESS-0017 — Vocabulary Governance

## 1. Enterprise Purpose

ESS-0017 is the canonical governance model for concepts, terminology, bilingual product wording, controlled wording migration and generated human-readable vocabulary documentation across CAPITAL-AI.

It does not replace Documentation Governance, Documentary, Knowledge, Traceability, EventMesh, Security/Compliance or a financial domain authority. The governing rule is **Projection, not Redefinition**.

## 2. Normative principles

1. Technical identifiers and stable Message Keys are English.
2. Canonical Concepts have stable language-neutral IDs.
3. DE/EN labels and messages resolve to the same governed Concept identities.
4. Aliases and forbidden terms are explicit and collision-checked.
5. Active code renames remain behind the Safe Rename Gate.
6. Human-facing phrases belong to the UI Message Catalog, not to a second Vocabulary Registry.
7. Usage records are read-only Evidence and never authorize source mutation.
8. GitHub Wiki is a deterministic one-way projection and never an authority source.
9. Wording may describe financial/security states but cannot upgrade or mutate them.
10. Newer files, translations or Wiki pages do not supersede higher authority by date alone.
11. Existing hardcoded wording is migrated incrementally through explicit source/literal/key mappings; blind repository-wide replacements are prohibited.
12. Human Merge remains required for this specification to become effective.

## 3. Canonical architecture

```text
Canonical Vocabulary Registry
        validates
UI Message Catalog
        -> React / PDF / E-Mail / SEO / Accessibility
        -> Wording Usage Index
        -> neutral Vocabulary Wording Snapshot
        -> existing DocumentaryDocument / D7 Knowledge / DocumentaryTraceability
        -> deterministic GitHub Wiki projection
        -> controlled incremental source migration
        -> existing repository quality / PR validation chain
```

No second Event Bus, Knowledge Graph, Traceability Store, financial runtime or release authority is introduced.

## 4. VW-0 through VW-5 baseline

VW-0 through VW-5 establish:

- authority/supersession consolidation around `ADR-0078`;
- typed Canonical Vocabulary and DE/EN UI Message Catalog;
- read-only wording projection across all 18 current `SC-MD-SPT-0001` stages;
- Wording Usage Index and reverse-impact evidence;
- surface-specific read-only delivery adapters;
- exact-commit-bound neutral Vocabulary snapshot consumed by the existing Documentary D7/Traceability contracts.

Every financial stage binding remains:

```text
financialDecisionAuthority = false
mutationAuthority = false
```

## 5. VW-6 — generated GitHub Wiki projection

VW-6 renders a deterministic set of managed Markdown pages from canonical repository state. The projection:

- requires an exact source commit SHA;
- contains no model-generated free text or timestamp-driven nondeterminism;
- carries checksums and explicit non-authority metadata;
- is Dry-Run by default;
- may target only an existing `Finance.wiki.git` checkout;
- requires explicit `--apply` for local Wiki mutation and separate `--push` for publication;
- never back-propagates Wiki edits into Registry, ESS, ADR or Message Catalog.

No Wiki publication is part of this branch before PR creation.

## 6. VW-7 — controlled wording migration

VW-7 establishes a migration contract rather than a blind mass rewrite. Each candidate has an exact source path, current literal, stable Message Key and `automaticApplyAllowed: false`.

Migration states are:

```text
OPEN      governed hardcoded wording remains queued
MIGRATED  source uses the stable Message Key and no longer embeds the literal
DRIFT     source/message relation is ambiguous or broken
```

`OPEN` is measurable technical debt and is permitted for incremental feature migration. `DRIFT` fails closed. The first baseline governs five current `MarketScreener` strings without claiming that all repository UI wording has already been migrated.

## 7. VW-8 — continuous governance and release closure

VW-8 integrates the Vocabulary control plane into the existing repository validation chain rather than creating a new CI architecture.

The local/read-only closure verifies at minimum:

- Vocabulary component and ESS Registry versions;
- completion metadata for VW-0 through VW-8;
- 18-stage financial projection coverage;
- non-authorizing financial/mutation flags;
- deterministic Wiki projection and explicit publish gates;
- zero `DRIFT` in controlled migration mappings;
- required architecture/work-package artifacts;
- Documentary/Knowledge/Traceability reuse boundaries.

The existing repository test path invokes the Vocabulary governance check. GitHub-hosted CI remains post-PR according to repository cost governance.

## 8. Security / Compliance / Data Integrity Boundary

Vocabulary/Wording must never:

- convert `DATA_UNAVAILABLE`, DENY, partial or ineligible into a more favorable state;
- synthesize financial values, Evidence or Provenance;
- alter classification, scoring, confidence, ranking or eligibility;
- bypass IAM, Entitlement or Billing decisions;
- approve Legal/Compliance wording without its parent authority;
- authorize Merge, Release, Deployment, Wiki publication or production mutation.

## 9. Supersession

`VOCABULARY-WORDING-WIKI-SUPERSESSION-0001` replaces the former phase-based Vocabulary migration/status documents as the current architecture projection after Human Merge. Historical documents remain non-authorizing Evidence until reference-safe archival.

## 10. Implementation status

Implemented on the branch through VW-8:

- VW-0 authority/supersession consolidation;
- VW-1 UI Message Catalog;
- VW-2 complete 18-stage FinTech wording baseline;
- VW-3 Wording Usage Index;
- VW-4 Delivery Adapters;
- VW-5 canonical Documentary D7/Traceability handoff;
- VW-6 deterministic GitHub Wiki renderer and controlled sync path;
- VW-7 controlled incremental migration baseline with explicit OPEN/DRIFT/MIGRATED states;
- VW-8 continuous governance and closure validation integrated into the existing repository test chain.

The remaining OPEN VW-7 source candidates are normal incremental migration debt, not a second architecture and not an assertion that all user-facing strings have already been migrated.
