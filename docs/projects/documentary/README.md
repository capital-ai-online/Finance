# CAPITAL-AI — Documentary

**Project ID:** `CAPITAL-AI-DOC`  
**Display name:** CAPITAL-AI Documentary  
**Domain:** Documentary Engine / Documentation Governance / Document Models & Provenance / Vocabulary handoff / Knowledge & Wiki projection  
**Project Value Chain ownership:** `PVC-03`  
**Lifecycle:** `ACTIVE — CANONICAL ORGANIZATIONAL PROJECT SURFACE`  
**Canonical execution roadmap:** [`ROADMAP.md`](./ROADMAP.md)  
**Repository trust root:** `/AGENTS.md`

## Purpose

`docs/projects/documentary/` is the canonical organizational execution surface for `CAPITAL-AI-DOC`. It coordinates Documentary-owned planning, migration, evidence and cross-project dependencies for `PVC-03` without becoming a second technical Documentary architecture.

The productive Documentary implementation remains under `src/platform/Documentary/`. Existing ESS, ADR, Authority, Control, Document Registry, Vocabulary and Wiki contracts remain authoritative in their existing scopes.

## Ownership and namespace boundary

`docs/projects/PROJECT_VALUE_CHAIN.md` assigns exactly one organizational stage to this project:

- `PVC-03` — Documentary Engine — `CAPITAL-AI-DOC`.

`PVC-*` is the project-routing namespace. It does **not** renumber, replace or reinterpret technical `VC-*` stages governed by `SC-MD-SPT-0001`.

Project-folder routing is organizational and non-authorizing. The folder does not grant merge, release, deployment, production, EventMesh, Traceability-runtime, Platform-Version or foreign-project mutation authority.

## Reused Documentary architecture

This project surface references rather than duplicates the existing Documentary architecture:

- `src/platform/Documentary/README.md` — current productive component boundary and implementation status;
- `src/platform/Documentary/manifest.json` — Documentary component-version authority;
- `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` — existing Documentary technical roadmap and historical workstream detail;
- `docs/architecture/DOCUMENTARY_D0_BASELINE_VERSION_AUTHORITY.md` — component/schema/platform-version separation evidence;
- `docs/architecture/DOCUMENTARY_MAINTENANCE_CONTROL_LOOP.md` — ADR-0097 implementation projection;
- `docs/roadmaps/work-packages/DOCUMENTARY_MAINTENANCE_CONTROL_LOOP_2026-08-20.md` — existing maintenance work-package evidence;
- `docs/governance/document-registry.json` — canonical document identities;
- `src/platform/Documentary/Governance/Services/DocumentationHygieneValidator.ts` — reusable read-only Documentation Hygiene service.

No runtime component is relocated for project-folder symmetry.

## Existing authority and contract boundaries

The project consumes the current authorities; it does not restate or supersede them:

- `ESS-0010` — Documentary Engine;
- `ESS-0012` / `ESS-0012-CONTRACTS` — Documentation Governance, documentation-only scope;
- `ESS-0017` / `ADR-0078` — Vocabulary Governance;
- `ESS-0009` — Enterprise Knowledge Platform;
- `ESS-0011` — Enterprise Traceability;
- `ADR-0096` — repository Governance Control Plane boundary;
- `ADR-0097` — Documentary Maintenance Agent Control Loop;
- `/AGENTS.md` + current Authority Registry and Control Catalog — repository governance.

New `AUTH-*`, `CTRL-*`, ADR, ESS or `DOC-*` identities are not created by this organizational surface.

## Vocabulary, Knowledge and Wiki boundary

`docs/architecture/VOCABULARY_WORDING_WIKI_ARCHITECTURE.md` remains the canonical Vocabulary/Wording/Wiki architecture.

Documentary reuses its one-way contracts:

- Vocabulary emits a neutral, exact-commit-bound wording snapshot;
- Documentary consumes that snapshot through existing Documentary Document, Knowledge Projection and Traceability contracts;
- Documentary D7 projects governed documents toward the existing Knowledge Engine;
- Wiki output is a deterministic read-only projection whose repository remains authoritative;
- no second Vocabulary Registry, Knowledge Registry, Wiki architecture or back-propagating Wiki authority is introduced here.

## Owned project scope

CAPITAL-AI-DOC coordinates and evidences:

- Documentary document identity/model/lifecycle/provenance work;
- Documentary Engine and generator/renderer roadmap work within existing technical authorities;
- Documentation Hygiene and Documentation Governance implementation within the documentation-only boundary;
- Documentary maintenance/freshness/version-patch behavior under ADR-0097;
- Documentary-side Vocabulary consumption and bilingual projection;
- Documentary Knowledge/Wiki projection handoffs;
- Documentary-side traceability evidence and already-authorized Documentary event adapters, without owning the EventMesh/Traceability runtime;
- project migration, roadmap state, evidence references and Documentary-specific validation.

## Explicit non-goals / foreign ownership

CAPITAL-AI-DOC does not absorb:

- `CAPITAL-AI-GOV / PVC-05` Platform Director or repository Governance Control Plane ownership;
- `CAPITAL-AI-DATA / PVC-09..PVC-11` ingestion, evidence-management or Data Quality implementation;
- `CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-06, PVC-07, PVC-08, PVC-18` controlled implementation lifecycle, Supervisor execution, Platform Version Management, Release, Production, EventMesh/Traceability runtime;
- `CAPITAL-AI-FINTECH / PVC-12..PVC-17` feature engineering, scoring, orchestration, domain execution, canonical scoring or ranking;
- productive Knowledge, Vocabulary, Wiki, Governance, Release or EventMesh architectures that already have canonical owners/contracts.

Foreign implementation is routed through `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md` and remains `REFERRED_NOT_EXECUTED` until handled by its Primary Owner.

## Navigation

- [`ROADMAP.md`](./ROADMAP.md) — canonical CAPITAL-AI-DOC organizational roadmap, work packages, dependencies, evidence and Definition of Done.
- [`../README.md`](../README.md) — canonical project-folder mapping and project execution model.
- [`../PROJECT_VALUE_CHAIN.md`](../PROJECT_VALUE_CHAIN.md) — `PVC-03` ownership.
- [`../PROJECT_EXECUTION_MODEL.md`](../PROJECT_EXECUTION_MODEL.md) — DevelopmentChain relationship, including `DC-04 Documentary / Evidence`.
- [`../CROSS_PROJECT_HANDOFF_CONTRACT.md`](../CROSS_PROJECT_HANDOFF_CONTRACT.md) — foreign-project routing contract.

## Migration rule

Use the repository migration order:

1. correlate logical Documentary ownership;
2. correct project references and routing without redefining technical authority;
3. validate evidence and dependencies;
4. relocate productive files only where an independently proven duplicate architecture, wrong-owner implementation, bypass, invalid dependency cycle or safely removable compatibility path requires it.

Historical and superseded Documentary evidence remains discoverable and is never rewritten merely to normalize project layout.
