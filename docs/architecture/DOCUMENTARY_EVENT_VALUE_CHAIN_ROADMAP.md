# CAPITAL-AI Documentary Engine & Event-Driven Value Chain Roadmap

**Status:** ACTIVE — CURRENT-STATE CORRELATED  
**Initial baseline:** 2026-08-10  
**Last Documentary correlation:** 2026-09-10  
**Current main:** `6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`  
**Primary Authority:** ESS-0010 Documentary Engine  
**Related Authorities:** ESS-0009 Knowledge, ESS-0011 Traceability, ESS-0012 Documentation Governance, ESS-0017 Vocabulary Governance, ADR-0096 Governance Control Plane, ADR-0097 Documentary Maintenance Control Loop  
**Project execution surface:** `docs/projects/documentary/ROADMAP.md`  
**Project routing:** `CAPITAL-AI-DOC / PVC-03`

This roadmap is a non-authorizing technical Documentary projection. Current implementation status is resolved from current code, manifests, accepted authorities and Human-merged evidence before historical roadmap text.

## 1. Ownership boundary

Documentary derives governed documentation from code, architecture, event, version and release evidence, produces deterministic document models/projections and evaluates documentation freshness/hygiene.

Productive Documentary implementation remains `src/platform/Documentary/`. This roadmap does not create a second EventMesh, Traceability, Governance, Knowledge, Vocabulary, Version, Release or Registry architecture.

### Documentary-owned scope — CAPITAL-AI-DOC / PVC-03

- document identity, models, schema/provenance and lifecycle;
- Code Discovery and semantic freshness;
- Documentary Core Engine;
- Documentary-side EventMesh adapters and traceability records;
- renderers/generators and bilingual projection contracts;
- Documentation Hygiene implementation inside the documentation-only boundary;
- Documentary Maintenance Control Loop and bounded maintenance observability;
- Documentary-side Knowledge/Vocabulary/Wiki projections;
- read-only migration planning and separately gated Documentary migration-execution design;
- Documentary-owned roadmap/evidence correlation.

### Foreign productive ownership retained

- `CAPITAL-AI-OPS / PVC-02,04,06,07,08,18`: controlled implementation lifecycle, Supervisor execution lifecycle, Platform Version Management, Release, Production, EventMesh and central Traceability runtime;
- `CAPITAL-AI-GOV / PVC-05`: Platform Director decisions and repository-wide Governance Control Plane;
- `CAPITAL-AI-DATA / PVC-09..11`: ingestion, evidence management and Data Quality semantics;
- `CAPITAL-AI-FINTECH / PVC-12..17`: feature engineering, scoring, orchestration, eligibility and ranking;
- Security/Compliance/Quality owners retain requirements, findings and independent verification responsibilities.

Foreign productive implementation remains `REFERRED_NOT_EXECUTED` from this roadmap.

## 2. Current Documentary baseline

The original 2026-08-10 target snapshot is historical. Current `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a` shows:

- Documentary component version `1.21.0` in `src/platform/Documentary/manifest.json` and component README;
- component-version authority: `src/platform/Documentary/manifest.json#version`;
- document-schema-version authority: `Versioning/DocumentaryVersion.ts#DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`;
- platform-version authority: repository `package.json#version`, consumed through the Release control plane;
- implemented areas: Agents, ArchiveRetention, Contracts, Discovery, Documentation, Engine, Events, Generators, Governance, Interfaces, Knowledge, Lifecycle, Mermaid, Migration planning, Models, Observability maintenance slice, Orchestration, Traceability and Versioning;
- bounded Documentation Governance rules `GOV-DOC-001` through `GOV-DOC-006` are Human-merged on main;
- `GOV-DOC-007` is implemented only on `agent/documentary-wp-doc-13-gov-doc-007-20260910`; the branch deliberately keeps component/document version fields unchanged because version advancement requires separate Version authority/Human resolution;
- planned/partial areas remain physical/semantic Migration Execution, Plugins and evidence-backed additional Architecture/runtime/quality hardening.

The component therefore remains **Partial Implementation**.

## 3. Workstream D — Documentary Engine

### D0 — Baseline, Manifest and Version Authority

**State:** IMPLEMENTED BASELINE

Component, document-schema and platform versions remain semantically separated. Documentary consumes platform version from Release and does not establish a second Version authority. Agent implementation may record version impact but does not autonomously choose a new version.

### D1 — Code Integration & Discovery

**State:** IMPLEMENTED BASELINE

`Discovery/CodeEvidence.ts`, status-event evidence/drift contracts and semantic freshness provide the current read-only discovery baseline.

### D2 — Documentary Core Engine

**State:** IMPLEMENTED BASELINE

`Engine/DocumentaryEngine.ts` orchestrates structured Documentary models and creates only the governed `generated` state. It does not approve protected documents or mutate source-code contracts.

### D3 — Document Models, Schemas & Provenance

**State:** IMPLEMENTED BASELINE

`Models/DocumentaryDocument.ts` and `Models/DocumentaryProvenance.ts` provide typed identity, source and deterministic provenance/fingerprint relationships.

### D4 — Review & Lifecycle Governance

**State:** IMPLEMENTED BASELINE

`Lifecycle/DocumentaryLifecycle.ts` implements controlled `generated -> reviewed -> approved` semantics plus supersession/archive transitions. Repository-wide Governance remains outside Documentary.

### D5 — Documentary Traceability & Event Integration

**State:** IMPLEMENTED DOCUMENTARY SIDE / CENTRAL RUNTIME REUSED

Documentary traceability/event contracts preserve correlation, causation and provenance while reusing the existing EventMesh and central Traceability surfaces.

### D6 — Generators & Renderers

**State:** IMPLEMENTED BASELINE / ADDITIONAL PROFILES DEMAND-DRIVEN

`Generators/DocumentaryRenderer.ts` renders supported document profiles. `Mermaid/DocumentaryMermaidRenderer.ts` deterministically renders the existing Knowledge projection into source text with stable ordering and escaped labels; it executes no Mermaid code and creates no second graph/Knowledge registry.

Additional profiles are not an unconditional backlog item. They require a concrete existing Documentary model/provenance/lifecycle projection need.

### D7 — Knowledge Integration

**State:** IMPLEMENTED DOCUMENTARY PROJECTION

`Knowledge/DocumentaryKnowledgeProjection.ts` emits a deterministic contract toward the existing Knowledge Engine. It does not persist or authorize a second Knowledge Registry/Wiki authority.

### D8 — Migration & Legacy Compatibility

**State:** READ-ONLY PLANNING DONE / MIGRATION EXECUTION NEXT CONTRACT SLICE

`Migration/DocumentaryMigrationPlanner.ts` is Human-merged through PR #792 and deterministically classifies Documentary documentation as `canonical`, `generated`, `evidence`, `legacy`, `archive` or `unknown`, emitting `retain`, `migration-candidate`, `redirect-candidate`, `owner-review` or `blocked` dispositions.

Every result remains `mutationPerformed=false`. Physical/semantic execution is a separate work package and must first define stable identity, canonical target/compatibility, Primary Owner boundaries, protected classes, dry-run evidence, abort/rollback and deterministic post-condition verification. No bulk migration is implied.

### D9 — Documentary Observability

**State:** IMPLEMENTED MAINTENANCE SLICE / BROADER QUALITY-SLO MODEL LATER

`Observability/DocumentaryMaintenanceObservability.ts` provides commit/correlation-bound aggregate maintenance metrics including freshness, registry coverage and orphan rate. Broader quality/SLO work remains Documentary-local unless separately promoted by higher authority.

## 4. Workstream H — Documentation Governance and Hygiene

### H0 — Canonical Folder Policy

**State:** ACTIVE BASELINE / SHARED AUTHORITY BOUNDARY

Documentation Hygiene validates placement and registry/lifecycle policy read-only; repository-wide policy remains Governance-owned.

### H1 — Continuous Orphan/Stale Detection

**State:** IMPLEMENTED BASELINE

Semantic freshness analysis and Documentation Hygiene provide Documentary-side stale/orphan evidence.

### H2 — Archive Lifecycle

**State:** IMPLEMENTED BOUNDED PLANNING

Archive Retention classifies candidates and produces owner-gated deletion plans without physical deletion.

### H3 — Runtime Path Hygiene

**State:** DEPENDENCY / CASE-BY-CASE

Documentary may detect stale documentation paths and propose identity-based repairs. Foreign-domain/runtime rewiring remains with the mapped Primary Owner.

### H4 — Registry & Index

**State:** REUSED EXISTING REGISTRY

`docs/governance/document-registry.json` remains the canonical document identity/path surface. Documentary creates no second registry.

### H5 — Hygiene Gate

**State:** IMPLEMENTED VALIDATOR / EXISTING DELIVERY PIPELINE REUSED

`npm run docs:hygiene:check` uses the existing Documentation Hygiene service. Documentary creates no second CI pipeline.

### ESS-0012 Chapter 2.5 rule coverage

| Rule | Main state | Branch state |
|---|---|---|
| `GOV-DOC-001` | DONE | DONE |
| `GOV-DOC-002` | DONE | DONE |
| `GOV-DOC-003` | DONE | DONE |
| `GOV-DOC-004` | DONE | DONE |
| `GOV-DOC-005` | DONE via PR #866 | DONE |
| `GOV-DOC-006` | DONE | DONE |
| `GOV-DOC-007` unresolved reference | OPEN on main | implemented on `agent/documentary-wp-doc-13-gov-doc-007-20260910`; version/PR/Human merge gates pending |

The bounded Chapter 2.5 sequence does not implicitly activate the wider historical ESS-0012 rule suite, scoring, production thresholds, event publication or Governance decisions.

## 5. Workstream E — Event-Driven Value Chain

Workstream E is an integration/dependency projection. EventMesh and central Traceability runtime remain CAPITAL-AI-OPS-owned.

| Slice | Current state | Documentary responsibility | Foreign-owner boundary |
|---|---|---|---|
| E0 Event Contract Inventory | DEPENDENCY | inventory Documentary producer/consumer evidence | global EventMesh inventory/runtime: OPS |
| E1 Documentary Event Integration | IMPLEMENTED DOC SIDE | existing producer/consumer integration and correlation preservation | EventMesh transport/runtime: OPS |
| E2 Idempotency / Ordering / Replay | DEPENDENCY / DOC HARDENING EVIDENCE-DRIVEN | harden Documentary consumer behavior only after reproducible local failure evidence | ordering/replay/DLQ runtime: OPS |
| E3 Version-Aware Events | DEPENDENCY | consume existing event/schema/version contracts | platform version/release/EventMesh runtime: OPS; normative decisions: GOV |
| E4 End-to-End Traceability | IMPLEMENTED DOC RECORD SIDE | Documentary traceability record/document linkage | central runtime/storage: OPS |
| E5 Reliability & Observability | DEPENDENCY | Documentary maintenance/quality metrics only | central reliability/observability: OPS |
| E6 Governance Boundaries | REUSED | no autonomous Documentary decision/release/production authority | Platform Director/Governance: GOV; Release/Production: OPS |

## 6. Remaining Documentary-owned backlog

Ordered by current project Roadmap:

1. **WP-DOC-13 — GOV-DOC-007 unresolved reference**: implemented on synchronized branch; version-impact resolution, exact-head repository validation, PR approval, Human merge and main re-correlation remain open.
2. **WP-DOC-14 — Migration Execution contract & dry-run design**: NEXT after WP-DOC-13; contract-first only, no physical mutation.
3. **WP-DOC-15 — Documentary quality/SLO model**: LATER; D9 already exposes the core maintenance ratios, so evidence and a target/SLO contract are required rather than a duplicate metrics subsystem.
4. **WP-DOC-16 — Plugin extension model**: LATER; ESS-0001-CONTRACTS already defines enterprise Plugin/Extension contracts and registry expectations; reuse/security/ownership pre-check is required and a parallel Documentary plugin registry is prohibited.
5. **WP-DOC-17 — Consumer retry/idempotency hardening**: LATER / evidence-driven; do not implement speculative retries.
6. **Additional generator profiles**: demand-driven only when an existing model requires a missing projection.
7. **Sensitive-document classification consumption**: dependency on a stable Security/Compliance contract; Documentary does not invent classification semantics.

Continuous maintained baselines remain WP-DOC-02 lifecycle/maintenance/Documentation Governance and WP-DOC-03 Vocabulary/Knowledge/Wiki projection.

## 7. Current execution order

1. close WP-DOC-13 through version-impact resolution, exact-head validation, PR gate and Human merge;
2. re-correlate then-current main/Roadmap/ADR/ESS;
3. if still highest priority, execute WP-DOC-14 contract/dry-run slice on a fresh branch;
4. keep WP-DOC-15/16/17 and conditional generator/security-consumption work behind their explicit evidence/dependency gates;
5. treat E0/E2/E3/E5 central runtime work and H3 foreign-runtime moves as owner handoffs, not DOC implementation;
6. preserve Human/CODEOWNER merge and separate protected production/external-mutation controls.

## 8. Roadmap exit criteria

This technical projection is current when:

- implementation status reflects current code/manifests/Human merges rather than the 2026-08-10 target snapshot;
- component/schema/platform version authorities remain separated;
- Documentary-owned work remains inside CAPITAL-AI-DOC / PVC-03;
- EventMesh/central Traceability, Platform Version Management, Release and Production are not represented as Documentary-owned implementation;
- Platform Director/repository Governance decisions remain CAPITAL-AI-GOV-owned;
- no second Document, Vocabulary, Knowledge, Wiki, Event, Diagram, Version, Release or Governance registry/authority is introduced;
- historical baseline information remains explicitly non-current;
- planned areas remain bounded by evidence, ownership and objective exit gates;
- `NOT RUN` is never projected as PASS.

Human/Owner PR-creation approval and Human/CODEOWNER merge remain separate repository lifecycle gates.
