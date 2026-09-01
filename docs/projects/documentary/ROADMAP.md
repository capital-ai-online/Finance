# CAPITAL-AI-DOC — Canonical Documentary Project Roadmap

**Project ID:** `CAPITAL-AI-DOC`  
**Status:** `ACTIVE — CANONICAL PROJECT SURFACE`  
**Project Value Chain ownership:** `PVC-03`  
**Primary Owner:** `CAPITAL-AI-DOC`  
**Repository trust root:** `/AGENTS.md`  
**Canonical project folder:** `docs/projects/documentary/`  
**Project-folder slug:** `documentary`

This roadmap is the organizational execution projection for CAPITAL-AI-DOC. It is non-authorizing and does not replace ESS, ADR, AUTH, CTRL, Document Registry or technical runtime contracts.

## 1. Architecture baseline

The current Documentary architecture is reused in place:

- productive component: `src/platform/Documentary/`;
- technical component scope/status: `src/platform/Documentary/README.md`;
- technical Documentary workstream detail: `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md`;
- D0/version-separation evidence: `docs/architecture/DOCUMENTARY_D0_BASELINE_VERSION_AUTHORITY.md`;
- Documentary Maintenance authority/projection: ADR-0097 + `docs/architecture/DOCUMENTARY_MAINTENANCE_CONTROL_LOOP.md`;
- document identity: `docs/governance/document-registry.json`;
- Documentation Governance: ESS-0012, documentation-only;
- Vocabulary/Wording/Wiki architecture: ESS-0017 / ADR-0078 + `docs/architecture/VOCABULARY_WORDING_WIKI_ARCHITECTURE.md`;
- Knowledge and Traceability integrations reuse ESS-0009 and ESS-0011 respectively.

Where older technical roadmap prose conflicts with the current component README, registries or accepted authorities, the newer/current authoritative implementation evidence is correlated before any future roadmap-status edit. Historical evidence is preserved rather than silently rewritten.

## 2. Namespace and ownership invariants

- `PVC-03` is the organizational Documentary Engine stage and remains owned by `CAPITAL-AI-DOC`.
- `PVC-*` project routing stays distinct from technical `VC-*` stages governed by `SC-MD-SPT-0001`.
- `docs/projects/documentary/` coordinates project execution only; it does not become technical Authority.
- Documentary remains a read-only documentation/evidence sidecar wherever the financial value chain is referenced.
- No project-folder symmetry requires moving productive runtime components.

## 3. Work packages

### WP-DOC-00 — Canonical project surface

**State:** `IMPLEMENTED — MERGED / VALIDATED ON MAIN`

Work:

- materialize exactly one canonical CAPITAL-AI-DOC project surface at `docs/projects/documentary/`;
- expose project scope, PVC-03 ownership, roadmap, dependencies, evidence and validation;
- reuse the current project execution model and current Documentary authorities;
- avoid new registry/authority identities for organizational navigation.

Closure evidence:

- implementation candidate head: `f7c1d9569832c8f21db8904e2eeeee4a3e2b758a`;
- Human/CODEOWNER merge: PR `#645` on 2026-09-01;
- merge commit: `22c4b53f83313eb03090ef0867f8f793b98e5fcc`;
- hosted PR Governance, CI and Container Security workflows completed successfully on the exact candidate before merge;
- current `main@e71f37127194ab34ed3c2594846c8b5449c20926` contains both `docs/projects/documentary/README.md` and this `ROADMAP.md`;
- `docs/projects/README.md` records the CAPITAL-AI-DOC surface as `present via PR #645`, while the Documentary README identifies it as `ACTIVE — CANONICAL ORGANIZATIONAL PROJECT SURFACE`;
- current-main correlation finds no competing Documentary project folder, no Documentary branch and no open-PR changed-file overlap on `docs/projects/documentary/**`.

Exit status:

- `README.md` and this `ROADMAP.md` form the bounded project navigation surface;
- no competing CAPITAL-AI-DOC project folder or project identity exists;
- no technical runtime, registry or authority is duplicated;
- the former project-surface migration candidate state is closed; future Documentary work continues through independently scoped WP-DOC work packages.

### WP-DOC-01 — Current Documentary baseline and document model correlation

**State:** `IMPLEMENTED — MERGED / VALIDATED ON MAIN`

Work:

- treat `src/platform/Documentary/README.md` and current code/manifests as implementation evidence;
- preserve component-version, document-schema-version and platform-version separation;
- reuse the existing Document Registry and Documentary model/provenance contracts;
- reconcile stale technical-roadmap status statements only in a separately scoped Documentary-owned change when evidence proves they are stale.

Closure evidence:

- implementation candidate head: `9d2d1fff975d26aadf818b996810092d7b9cd9d8`;
- Human/CODEOWNER merge: PR `#673` on 2026-09-01;
- merge commit and post-merge `main`: `c05b0e7eca59ae14a7030df464658626349b3612`;
- hosted PR Governance, CI and Container Security workflows completed successfully on the exact candidate before merge; a superseded duplicate Governance run was cancelled and does not replace the successful final run;
- both `agent/documentary-wp-doc-01-baseline-closure-20260901` and the accidental `__invalid_noop__` ref were removed after merge;
- current open PRs `#666`–`#669` have no changed-file or semantic overlap with `docs/projects/documentary/**` or the WP-DOC-01 baseline/registry/model boundary;
- the candidate was correlated against `main@2fa023bceb8646eaf7bd42c2a16cea5dc7be4522` after Human Merge of PR `#672`;
- `src/platform/Documentary/README.md` and `manifest.json` agree on component version `1.13.0` and retain the component as Partial Implementation with explicitly bounded planned areas;
- component-version authority remains `manifest.json#version`, document-schema authority remains `Versioning/DocumentaryVersion.ts#DOCUMENTARY_DOCUMENT_SCHEMA_VERSION` (`1.0.0`), and platform-version authority remains repository `package.json#version` through the existing Release control plane;
- `Models/DocumentaryDocument.ts` requires stable `documentId`, source commit and provenance, carries schema/component/platform versions and lifecycle metadata, and derives a deterministic SHA-256 fingerprint without creating a second registry;
- `Models/DocumentaryProvenance.ts` keeps evidence references explicit and fail-closed for code evidence without commit/path provenance;
- `docs/governance/document-registry.json` remains the canonical document-identity surface with stable `documentId`, lifecycle and current path represented as distinct fields; no registry mutation was required for this correlation-only work;
- `AUTH-GOV-DOCUMENT-LIFECYCLE` preserves stable document identity across supersession/archive and requires controlled registry updates or non-authorizing redirects for path moves;
- `DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` is already `ACTIVE — CURRENT-STATE CORRELATED`, records D0 and D3 as implemented baselines, reuses the existing registry at H4, and independently bounds remaining Mermaid/Migration/Plugins/validator work.

Exit status:

- project planning reflects the current Documentary component, model/provenance and version-authority baseline without creating a second implementation inventory;
- component, document-schema and platform versions remain distinct and independently authoritative in their existing scopes;
- document identity and lifecycle remain registry-backed and path-independent; path is mutable registry metadata rather than document identity;
- no Model, Document Registry, Lifecycle, Release or Governance authority is duplicated or transferred;
- remaining Documentary implementation areas continue as separately scoped work packages rather than being bundled into this baseline correlation;
- applicable hosted validation passed on the exact merged candidate and the former candidate/pending state is closed on current main.

### WP-DOC-02 — Documentary lifecycle, maintenance and Documentation Governance

**State:** `ACTIVE BASELINE / CONTINUOUS MAINTENANCE`

Work:

- reuse ADR-0097 Documentary Maintenance Control Loop and existing agents/orchestration/observability;
- keep Documentation Hygiene read-only and fail-closed;
- preserve `generated -> reviewed -> approved` and current supersession/archive semantics;
- keep protected-document mutation, PR creation, merge and production boundaries outside autonomous Documentary authority.

Exit:

- Documentary maintenance remains branch-based, evidence-bound and non-authorizing;
- no repository-wide Governance authority is introduced under `src/platform/Documentary/Governance`.

### WP-DOC-03 — Vocabulary, Knowledge and Wiki projection

**State:** `ACTIVE BASELINE`

Work:

- consume the existing neutral Vocabulary/Wording snapshot contract;
- reuse Documentary Document, D7 Knowledge Projection and Documentary Traceability contracts;
- preserve deterministic Wiki projection and repository-authoritative semantics;
- keep Vocabulary, Knowledge and Wiki storage/authority one-way and non-duplicated.

Exit:

- no second Vocabulary Registry, Knowledge Registry, Wiki architecture or back-propagating Wiki authority exists;
- Documentary remains a consumer/projector under the existing contracts.

### WP-DOC-04 — Technical roadmap ownership reconciliation

**State:** `IMPLEMENTED — MERGED / VALIDATED ON MAIN`

Implemented correlation:

- correlated `DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` against current `src/platform/Documentary/README.md`, component manifest and current governance/project boundaries;
- replaced stale “mostly target structure” status with the current Partial Implementation baseline;
- aligned D4/D6/D7 roadmap identities with the current implemented architecture: D4 Review/Lifecycle, D6 Generators/Renderers, D7 Knowledge Integration;
- retained implemented Documentary-side D0–D7 capabilities as CAPITAL-AI-DOC scope without claiming complete platform implementation;
- retained D8 Migration and broader D9/Architecture/Mermaid/Plugins work as bounded remaining Documentary work;
- converted central E-workstream implementation into explicit integration/dependency boundaries rather than Documentary runtime ownership;
- routed EventMesh/central Traceability runtime, Platform Version Management, Release and Production implementation to CAPITAL-AI-OPS;
- retained Platform Director/repository Governance decisions in CAPITAL-AI-GOV;
- reused the canonical Document Registry and existing Vocabulary/Knowledge/Wiki contracts instead of creating parallel registries or authorities;
- preserved the 2026-08-10 roadmap baseline as historical context rather than silently treating it as current implementation truth.

Closure evidence:

- implementation candidate head: `5d833cfd020b66c5d94acee147d857ce4b94cf10`;
- Human/CODEOWNER merge: PR `#664` on 2026-09-01;
- merge commit and post-merge `main`: `1952a07ba40a543b570e8e48d98aeea209250dff`;
- hosted PR Governance, CI and Container Security workflows completed successfully on the exact candidate before merge;
- post-merge correlation confirms the technical roadmap and this project roadmap are present on current `main` with no additional Documentary writer or open-PR overlap.

Exit status:

- Documentary roadmap contains no foreign productive implementation ownership;
- no second EventMesh, Traceability, Release, Version or Governance architecture is implied;
- stale implementation gaps are not reopened when current code/manifests prove them implemented;
- remaining Documentary-owned work is independently bounded and actionable;
- applicable hosted documentation/governance validation passed on the exact merged candidate;
- Human/Owner PR-creation approval and Human/CODEOWNER merge gates were satisfied for PR #664; future changes re-enter the normal current-main lifecycle.

### WP-DOC-04 evidence note

The reconciliation intentionally did **not** mutate `docs/governance/document-registry.json`: the merged work changed roadmap status/ownership projection without moving the registered document, changing its stable identity, creating a second registry entry or executing the ADR-0097 autonomous maintenance-agent patch path. Registry/governance impact remained read-only.

### WP-DOC-05 — Deterministic Mermaid projection

**State:** `IMPLEMENTED — CANDIDATE; HUMAN MERGE + VALIDATION PENDING`

Work:

- close the explicitly recorded model-driven Mermaid gap as exactly one Documentary-owned D6 implementation slice;
- reuse `Knowledge/DocumentaryKnowledgeProjection.ts` as the sole node/relationship input contract rather than defining a second graph model;
- render deterministic Mermaid source text only under `src/platform/Documentary/Mermaid/`;
- keep the generator pure/read-only: no Mermaid execution, browser rendering, persistence, event publication, lifecycle transition or approval;
- neutralize evidence-controlled labels and prohibit generated `click`, literal URL, HTML/script or external-resource directives;
- advance only the Documentary component version (`1.13.0 -> 1.14.0`); document-schema and platform-version authorities remain unchanged.

Candidate evidence:

- correlated against `main@190f319ec8026d8141601b69a8bb4d97470ec5ea` after the Human Merge of WP-DOC-01 closure PR `#674`;
- the technical roadmap and component README/manifest all identify Mermaid as a Documentary-owned planned gap before this candidate;
- `DocumentaryKnowledgeProjection` already supplies deterministic nodes, directed relationships and a projection checksum, so no parallel Diagram/Graph/Knowledge registry or contract is required;
- `DocumentaryMermaidRenderer.ts` uses SHA-256-derived node aliases, stable sorting, fixed D7 relationship types and escaped labels;
- targeted unit coverage checks deterministic output, source-evidence binding, malformed identity fail-closed behavior and neutralization of directive/URL-shaped evidence;
- existing `documentaryVersionAuthority.test.ts` requires each implemented area to contain runtime code; the new `Mermaid/` namespace satisfies that invariant rather than merely flipping manifest metadata;
- open PR `#669` changes only a Governance work-claim file and has no changed-file or semantic overlap with this WP-DOC-05 writer set;
- no Document Registry, AUTH, CTRL, ADR, ESS, EventMesh, Release, Platform Version, Vocabulary, Knowledge persistence or foreign-project implementation is changed.

Exit candidate:

- exactly one formerly planned Documentary gap—deterministic Mermaid source projection—is implemented;
- Mermaid consumes existing D7 semantics and creates no second graph/diagram/Knowledge authority or registry;
- output is deterministic text only and cannot authorize or perform execution, merge, release, deployment or production mutation;
- component, document-schema and platform-version authorities remain separated;
- `Migration`, `Plugins`, broader Architecture runtime and additional ESS-0012 validators remain separately scoped backlog and are not bundled into WP-DOC-05;
- targeted and repository-required validation must pass on the exact candidate before Human/CODEOWNER merge.

## 4. Dependencies and handoffs

| Dependency | Owner / Stage | Documentary relationship | Status |
|---|---|---|---|
| Governance Control Plane / Platform Director | `CAPITAL-AI-GOV / PVC-05` | consume current Authority/Control/decision boundaries; do not implement GOV scope | `DEPENDENCY` |
| Controlled implementation / Supervisor / Version / Release / Production / EventMesh-Traceability runtime | `CAPITAL-AI-OPS / PVC-02,04,06,07,08,18` | Documentary produces/consumes evidence only within existing contracts | `REFERRED_NOT_EXECUTED` for foreign implementation |
| Data ingestion / evidence management / Data Quality | `CAPITAL-AI-DATA / PVC-09..11` | consume validated evidence when required; no DATA mutation from DOC | `DEPENDENCY` |
| Feature engineering through ranking | `CAPITAL-AI-FINTECH / PVC-12..17` | read-only documentation/evidence projection; no scoring/ranking ownership | `DEPENDENCY` |
| Vocabulary/Wording governance | existing `ESS-0017 / ADR-0078` | Documentary consumes the governed snapshot and projection contracts | `REUSED` |
| Knowledge/Wiki projection | existing Knowledge + Vocabulary/Wiki contracts | deterministic projection only; repository remains authoritative | `REUSED` |

Any future productive foreign work uses `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md` and remains `REFERRED_NOT_EXECUTED` in this project until completed by the target Primary Owner.

## 5. Evidence references

Current evidence and technical sources include:

- `src/platform/Documentary/README.md`;
- `src/platform/Documentary/manifest.json`;
- `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md`;
- `docs/architecture/DOCUMENTARY_D0_BASELINE_VERSION_AUTHORITY.md`;
- `docs/architecture/DOCUMENTARY_MAINTENANCE_CONTROL_LOOP.md`;
- `docs/roadmaps/work-packages/DOCUMENTARY_MAINTENANCE_CONTROL_LOOP_2026-08-20.md`;
- `docs/architecture/VOCABULARY_WORDING_WIKI_ARCHITECTURE.md`;
- `docs/governance/document-registry.json`;
- `docs/governance/authority-registry.json`;
- `docs/governance/control-catalog.json`;
- `docs/adr/registry.json`;
- `.ai/registry/ess-registry.json`.

Exact branch/main SHAs and validation outputs are execution evidence and are reported with the concrete candidate rather than treated as durable roadmap Authority.

## 6. Validation / Definition of Done

For documentation-only Documentary roadmap/project changes:

- `npm run docs:hygiene:check` passes;
- `npm run governance:control-plane` passes where the exact candidate touches or depends on governance/document-registry invariants;
- `npm run documentary:maintenance:validate` is required only where the ADR-0097 maintenance-claim/branch contract applies; it is not a substitute for generic documentation validation;
- `npm run vocabulary:governance:check` is run when Vocabulary/Wiki contracts are modified, and may be used as a read-only correlation check for cross-boundary changes;
- no runtime/build validation is added merely for breadth when the exact diff contains no runtime code;
- final current-main, open-PR, active-writer, changed-file and semantic-overlap correlation is repeated on the exact candidate before PR-creation approval is requested.

For WP-DOC-04 specifically, validation must additionally confirm:

- the technical roadmap matches current component README/manifest implementation evidence;
- EventMesh/central Traceability, Platform Version, Release and Production remain foreign productive scope;
- Platform Director/repository Governance remain GOV-owned;
- no duplicate document identity/registry or parallel architecture is introduced;
- the exact diff remains documentation-only.

For WP-DOC-05 specifically, validation must additionally confirm:

- targeted Mermaid renderer tests pass and output is deterministic under input reordering;
- malformed projection identity fails closed;
- evidence-controlled labels cannot become emitted `click`, literal URL, HTML/script or external-resource directives;
- `Mermaid` is backed by real runtime code when declared implemented in Documentary baseline/manifest metadata;
- Documentary component version changes independently while document-schema and platform versions remain unchanged;
- no Diagram/Graph/Knowledge registry, EventMesh, Release, Platform Version or foreign-owner implementation appears in the exact diff.

## 7. Negative tests

The candidate must fail closed if any of the following is observed:

- a second CAPITAL-AI-DOC project identity or canonical project folder;
- duplicate Documentary runtime architecture;
- duplicate document identity introduced by the project surface;
- a second Vocabulary, Knowledge, Wiki or Diagram/Graph authority/registry;
- transfer of `PVC-03` Primary Ownership away from `CAPITAL-AI-DOC`;
- conflation of organizational `PVC-03` with technical `VC-*` namespaces;
- DATA-, GOV-, OPS- or FINTECH-owned productive implementation bundled into the DOC branch;
- project-folder routing used as merge, release, deployment or technical Authority;
- historical evidence rewritten merely to normalize the project layout.

## 8. Project exit gate

CAPITAL-AI-DOC project migration reaches this surface-level exit when:

1. exactly one canonical project surface exists at `docs/projects/documentary/`;
2. `PVC-03` remains assigned to CAPITAL-AI-DOC;
3. the surface is traceable to existing Documentary authorities, registries and runtime architecture;
4. no parallel Documentary, Vocabulary, Knowledge, Wiki, Governance, EventMesh, Traceability, Version or Release architecture is introduced;
5. foreign-owner work is explicitly retained as dependency/handoff rather than implemented locally;
6. applicable repository/document validation passes on a candidate synchronized with current main.

PR creation remains a separate Human/Owner-gated action. Human/CODEOWNER merge remains mandatory.
