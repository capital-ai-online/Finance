# CAPITAL-AI Documentary Engine & Event-Driven Value Chain Roadmap

**Status:** ACTIVE — CURRENT-STATE CORRELATED  
**Initial baseline:** 2026-08-10  
**Last Documentary correlation:** 2026-09-01  
**Primary Authority:** ESS-0010 Documentary Engine  
**Related Authorities:** ESS-0009 Knowledge, ESS-0011 Traceability, ESS-0012 Documentation Governance, ESS-0017 Vocabulary Governance, ADR-0096 Governance Control Plane, ADR-0097 Documentary Maintenance Control Loop  
**Project execution surface:** `docs/projects/documentary/ROADMAP.md` / `WP-DOC-04`  
**Project routing:** `CAPITAL-AI-DOC / PVC-03`

This roadmap is a non-authorizing Documentary execution projection. Current implementation status is resolved from current code, manifests, registries and accepted authorities before this roadmap. The original 2026-08-10 baseline remains historical context and is not allowed to override newer implementation evidence.

## 1. Zielbild und Ownership-Grenze

Documentary derives governed documentation from code, architecture, event, version and release evidence, produces deterministic document models and projections, and continuously evaluates documentation freshness and hygiene.

The productive Documentary component remains `src/platform/Documentary/`. This roadmap does not create a second EventMesh, Traceability, Governance, Knowledge, Vocabulary, Version or Release architecture.

### Documentary-owned scope — CAPITAL-AI-DOC / PVC-03

- Documentary document identity, models, schemas, provenance and lifecycle;
- Documentary Code Discovery and semantic freshness analysis;
- Documentary Core Engine, Documentary event adapters and Documentary traceability records;
- Documentary renderers/generators and bilingual projection contracts;
- Documentation Hygiene implementation inside the documentation-only boundary;
- Documentary Maintenance Control Loop and its bounded maintenance observability;
- Documentary-side Knowledge/Vocabulary/Wiki projection contracts;
- roadmap/evidence correlation for Documentary-owned implementation.

### Foreign productive ownership retained

- `CAPITAL-AI-OPS / PVC-02,04,06,07,08,18`: controlled implementation lifecycle, Supervisor execution lifecycle, Platform Version Management, Release, Production, EventMesh and central Traceability runtime;
- `CAPITAL-AI-GOV / PVC-05`: Platform Director decisions and repository-wide Governance Control Plane;
- `CAPITAL-AI-DATA / PVC-09..11`: ingestion, evidence management and Data Quality semantics;
- `CAPITAL-AI-FINTECH / PVC-12..17`: feature engineering, scoring, orchestration, eligibility and ranking;
- cross-cutting Security/Compliance/Quality owners retain their own requirements, findings and independent verification responsibilities.

Foreign implementation is routed using `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md` and remains `REFERRED_NOT_EXECUTED` from this Documentary roadmap.

## 2. Current Documentary baseline

The 2026-08-10 roadmap baseline described Documentary as mostly target structure and reported README/manifest version drift. That description is now **historical**.

Current repository evidence shows:

- Documentary component version `1.13.0` in `src/platform/Documentary/manifest.json` and the component README;
- component-version authority: `src/platform/Documentary/manifest.json#version`;
- document-schema-version authority: `src/platform/Documentary/Versioning/DocumentaryVersion.ts#DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`;
- platform-version authority: repository `package.json#version`, consumed through the Release control plane; Documentary does not own platform-version mutation;
- implemented areas: Agents, ArchiveRetention, Contracts, Discovery, Documentation, Engine, Events, Generators, Governance (documentation-only), Interfaces, Knowledge, Lifecycle, Models, Observability (maintenance slice), Orchestration, Traceability and Versioning;
- planned/partial areas remain Mermaid, Migration, Plugins, additional Architecture-runtime functions and additional ESS-0012 validators.

The current implementation remains intentionally classified as **Partial Implementation**. “Partial” no longer means “only the bilingual layer exists”; it means the established Documentary baseline is implemented while explicitly listed future slices remain open.

## 3. Workstream D — Documentary Engine

### D0 — Baseline, Manifest and Version Authority

**State:** IMPLEMENTED BASELINE

Implemented evidence:

- README and manifest agree on Documentary component version `1.13.0`;
- component, document-schema and platform versions are semantically separated;
- Documentary consumes platform version from the existing Release control plane and does not reactivate a second Version Manager authority;
- `Architecture/documentary-baseline.json` and dedicated D0 evidence remain implementation references.

Remaining Documentary work is maintenance of this separation when component/schema contracts change. Platform Version Management and Release implementation remain OPS-owned.

### D1 — Code Integration & Discovery

**State:** IMPLEMENTED BASELINE

`Discovery/CodeEvidence.ts`, status-event evidence/detection/update contracts and semantic freshness analysis provide the current read-only Documentary discovery baseline. Future discovery expansion must remain read-only and evidence-bound.

### D2 — Documentary Core Engine

**State:** IMPLEMENTED BASELINE

`Engine/DocumentaryEngine.ts` implements structured document-model orchestration and produces the controlled `generated` lifecycle state. It does not approve protected documents or mutate source-code contracts.

### D3 — Document Models, Schemas & Provenance

**State:** IMPLEMENTED BASELINE

`Models/DocumentaryDocument.ts` and `Models/DocumentaryProvenance.ts` provide the current typed model/provenance baseline, including source identity and deterministic fingerprint/provenance relationships.

### D4 — Review & Lifecycle Governance

**State:** IMPLEMENTED BASELINE

The current D4 identity is **Review & Lifecycle Governance**, superseding the original roadmap numbering that used D4 for generators. `Lifecycle/DocumentaryLifecycle.ts` implements controlled `generated -> reviewed -> approved` semantics plus supersession/archive transitions. Repository-wide governance authority remains outside Documentary.

### D5 — Documentary Traceability & Event Integration

**State:** IMPLEMENTED DOCUMENTARY SIDE / CENTRAL RUNTIME REUSED

`Traceability/DocumentaryTraceability.ts` and the Documentary event producer/consumer contracts bind document evidence to correlation/causation/provenance data. Documentary uses the existing EventMesh and central Traceability contracts; it does not own those runtimes.

### D6 — Generators & Renderers

**State:** IMPLEMENTED BASELINE

The current D6 identity is **Generators & Renderers**. `Generators/DocumentaryRenderer.ts` renders governed `DocumentaryDocument` models for supported document profiles. It does not grant approval, persist a second document store or publish independent event authority.

Bilingual rendering continues to reuse the existing Vocabulary/Wording contracts. Model-driven Mermaid generation remains planned.

### D7 — Knowledge Integration

**State:** IMPLEMENTED DOCUMENTARY PROJECTION

The current D7 identity is **Knowledge Integration**. `Knowledge/DocumentaryKnowledgeProjection.ts` emits a deterministic projection contract toward the existing Knowledge Engine. It does not persist a second Knowledge Registry or establish back-propagating Wiki authority.

### D8 — Migration & Legacy Compatibility

**State:** PLANNED / PARTIAL SUPPORT ONLY

Current implementation provides controlled status-drift updates, registry-backed identity and bounded archive-retention planning, but a general Documentary Migration runtime is not implemented. Future work may:

- classify canonical/generated/evidence/legacy/archive documents;
- remove hard-coded paths in favor of stable document identity where justified;
- preserve redirects/aliases where compatibility requires them;
- preserve historical evidence without rewriting history.

Compliance-owned documents, foreign runtime paths and foreign project migrations must be handed off to their respective owners rather than moved by Documentary for layout symmetry.

### D9 — Documentary Observability

**State:** IMPLEMENTED MAINTENANCE SLICE / BROADER OBSERVABILITY OPEN

`Observability/DocumentaryMaintenanceObservability.ts` provides commit/correlation-bound aggregate maintenance health metrics. It intentionally does not claim the central Observability platform or a complete event-runtime observability implementation.

## 4. Remaining Documentary-owned improvement backlog

The stale 2026-08-10 gap list is replaced by the following current backlog:

1. model-driven Mermaid/architecture diagram generation;
2. general Documentary Migration support with safe compatibility handling;
3. plugin extension model without introducing a second provider/agent framework;
4. additional ESS-0012 documentation-only validators where current policy requires them;
5. broader Documentary quality/SLO definitions beyond the implemented maintenance observability slice;
6. additional generator profiles only when backed by existing document models, provenance and lifecycle contracts;
7. further deterministic retry/idempotency hardening inside Documentary-owned consumers where evidence demonstrates a gap;
8. sensitive-document classification consumption from Security/Compliance contracts without acquiring Security/Compliance decision authority.

Historical 2026-08-10 gaps such as “Engine fehlt”, “Models fehlen”, “Generators fehlen”, “Knowledge-Projektion fehlt” or README/manifest version drift are closed by current implementation evidence and must not be reopened merely because the original roadmap text remains in Git history.

## 5. Workstream E — Event-Driven Value Chain

Workstream E is retained as an integration/dependency projection. **EventMesh and central Traceability runtime implementation are CAPITAL-AI-OPS-owned.** Documentary only owns its bounded adapters, records and projections.

| Slice | Current state | Documentary responsibility | Foreign-owner boundary |
|---|---|---|---|
| E0 Event Contract Inventory | DEPENDENCY | inventory Documentary producer/consumer contracts and evidence | global EventMesh inventory/runtime: OPS |
| E1 Documentary Event Integration | IMPLEMENTED DOC SIDE | existing Documentary producer/consumer integration, correlation preservation, evidence output | EventMesh transport/runtime: OPS; Platform decisions: GOV |
| E2 Idempotency / Ordering / Replay | DEPENDENCY | Documentary consumer-side deterministic behavior may be tested/hardened locally | EventMesh ordering/replay/DLQ runtime: OPS |
| E3 Version-Aware Events | DEPENDENCY | consume existing event/schema/version contracts without creating parallel versions | platform version/release and EventMesh contract runtime: OPS; normative decision where required: GOV |
| E4 End-to-End Traceability | IMPLEMENTED DOC RECORD SIDE | Documentary traceability record and document linkage | central Traceability runtime/storage: OPS |
| E5 Reliability & Observability | DEPENDENCY | Documentary maintenance metrics only | EventMesh/central runtime reliability and observability: OPS |
| E6 Governance Boundaries | REUSED | enforce no autonomous Documentary decision/release/production authority | Platform Director/Governance: GOV; Release/Production: OPS |

The earlier target chain remains a conceptual evidence flow only:

`Code/Architecture Change -> Supervisor Evidence -> Platform Decision -> EventMesh -> Documentary Impact -> Traceability -> Quality/Security/Compliance -> Version/Release Evidence`

It must not be interpreted as Documentary ownership of every node in that chain.

## 6. Workstream H — Documentation Hygiene

### H0 — Canonical Folder Policy

**State:** ACTIVE BASELINE / SHARED AUTHORITY BOUNDARY

Documentation Hygiene validates canonical placement and root policy read-only. Repository-wide governance policy remains under the current Governance Control Plane; Documentary implements documentation-domain validation only.

### H1 — Continuous Orphan/Stale Detection

**State:** IMPLEMENTED BASELINE

Semantic freshness analysis and Documentation Hygiene provide the current Documentary-side stale/orphan detection baseline. Additional thresholds/SLOs may be added in bounded Documentary work when backed by policy/evidence.

### H2 — Archive Lifecycle

**State:** IMPLEMENTED BOUNDED PLANNING

Archive Retention classifies bounded candidates and produces deletion plans without performing physical deletion. Historical/registered/authority/evidence material remains protected according to existing lifecycle contracts.

### H3 — Runtime Path Hygiene

**State:** DEPENDENCY / CASE-BY-CASE

Documentary may detect stale paths and propose document-identity-based repairs. Productive foreign-domain moves, Compliance-owned document relocation, runtime-code path rewiring, Release changes or deployment changes remain with their Primary Owner and require handoff.

### H4 — Registry & Index

**State:** REUSED EXISTING REGISTRY

`docs/governance/document-registry.json` is the canonical document identity surface. Documentary must reuse it and must not create a second Document Registry. Registry governance remains subject to repository Governance controls.

### H5 — Hygiene Gate

**State:** IMPLEMENTED VALIDATOR / EXISTING DELIVERY PIPELINE REUSED

`npm run docs:hygiene:check` uses the existing documentation-domain validator. Documentary does not create a second CI pipeline; delivery/CI execution remains within the existing repository lifecycle.

## 7. Current execution order

The original 2026-08-10 sequence is historical. Current Documentary sequencing is evidence-driven:

1. maintain D0–D7 implemented baselines without reintroducing duplicate authorities;
2. execute remaining DOC-owned Mermaid/Migration/Plugins/validator work only as separately scoped work packages;
3. extend D9 only inside Documentary scope unless a central observability change is handed off;
4. treat E0/E2/E3/E5 central runtime work as OPS dependencies/handoffs;
5. preserve GOV decision boundaries for Platform Director and repository Governance;
6. keep H3 foreign-domain/runtime moves as owner-specific handoffs;
7. run applicable Documentary/documentation/governance validation on every exact candidate before PR readiness.

## 8. Exit criteria for this roadmap projection

The Documentary roadmap is current when:

- implementation status reflects current code/manifests rather than the 2026-08-10 target-tree snapshot;
- D4/D6/D7 numbering matches the current implemented Documentary architecture;
- component/schema/platform version authorities remain separated;
- Documentary-owned work remains inside CAPITAL-AI-DOC / PVC-03;
- EventMesh/central Traceability runtime, Platform Version Management, Release and Production are not represented as Documentary implementation work;
- Platform Director/repository Governance decisions remain CAPITAL-AI-GOV-owned;
- no second Document, Vocabulary, Knowledge, Wiki, Event, Version, Release or Governance registry/authority is introduced;
- historical baseline information remains traceable and is explicitly non-current;
- remaining planned Documentary areas are accurately bounded and independently actionable.

Human/Owner PR-creation approval and Human/CODEOWNER merge remain separate repository lifecycle gates.