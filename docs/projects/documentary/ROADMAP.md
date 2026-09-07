# CAPITAL-AI-DOC — Project Roadmap

**Project ID:** `CAPITAL-AI-DOC`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Project Value Chain ownership:** `PVC-03 — Documentary Engine`  
**Primary Owner:** `CAPITAL-AI-DOC`  
**Repository trust root:** `/AGENTS.md`  
**Canonical project folder:** `docs/projects/documentary/`

## How to use this roadmap

```text
PVC-03 Documentary Engine
→ this Roadmap
→ applicable ADR
→ applicable ESS
→ implementation / tests / evidence
```

Current Git terminology is `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`. Historical branch/PR identities remain valid evidence, but Candidate-Head lifecycle terminology is not used for current work.

## Architecture baseline

Reuse the existing Documentary architecture in place:

- productive component: `src/platform/Documentary/`;
- component scope/status: `src/platform/Documentary/README.md`;
- technical workstream detail: `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md`;
- Documentary Maintenance: ADR-0097;
- Documentation Governance: ESS-0012;
- Documentary Engine: ESS-0010;
- Vocabulary/Wording: ESS-0017 / ADR-0078;
- Knowledge and Traceability: ESS-0009 / ESS-0011;
- document identity: `docs/governance/document-registry.json`.

The project Roadmap coordinates work; it does not create a second Documentary runtime, registry or authority.

## WP-DOC-00 — Canonical project surface

**State:** `DONE — HUMAN-MERGED`

- project surface materialized through PR #645;
- Human/CODEOWNER merge completed;
- no competing Documentary project identity is required.

## WP-DOC-01 — Documentary baseline and document model correlation

**State:** `DONE — HUMAN-MERGED`

- baseline/model/version-authority correlation completed through the merged Documentary work sequence including PR #673/#674;
- component version, document-schema version and platform version remain separate authorities;
- Document Registry remains the canonical document-identity surface.

## WP-DOC-02 — Lifecycle, maintenance and Documentation Governance

**State:** `ACTIVE / CONTINUOUS`

- reuse ADR-0097 Documentary Maintenance Control Loop;
- keep Documentation Hygiene read-only and fail-closed;
- preserve review/approval and supersession/archive semantics;
- no autonomous merge or production mutation.

## WP-DOC-03 — Vocabulary, Knowledge and Wiki projection

**State:** `ACTIVE BASELINE`

- consume existing Vocabulary/Wording and Knowledge contracts;
- preserve deterministic one-way projection;
- no second Vocabulary, Knowledge or Wiki authority.

## WP-DOC-04 — Technical roadmap ownership reconciliation

**State:** `DONE — HUMAN-MERGED`

- completed through PR #664;
- Documentary-owned work remains in Documentary;
- EventMesh/central Traceability runtime, Release, Version and Production remain with their Primary Owners;
- no second Governance or platform architecture was introduced.

## WP-DOC-05 — Deterministic Mermaid projection

**State:** `DONE — HUMAN-MERGED / CLAIM RELEASED`

GitHub correlation confirms:

- implementation PR: **#679** — WP-DOC-05 Mermaid Projection;
- deterministic `DocumentaryMermaidRenderer` implementation and tests were merged;
- subsequent PR **#700** terminalized the fulfilled WP-DOC-05 work claim.

Architecture invariants:

- Mermaid consumes the existing `DocumentaryKnowledgeProjection` contract;
- output remains deterministic text projection;
- no second graph/diagram/Knowledge registry;
- no browser execution, persistence, approval, deployment or production mutation authority;
- component/document-schema/platform-version authorities remain separate.

## WP-DOC-06 — D8 Migration planning and legacy compatibility

**State:** `DONE — HUMAN-MERGED / READ-ONLY PLANNING SLICE`

Merged implementation evidence:

- implementation PR: **#792** — D8 Migration Planning;
- merge SHA: `12b5ec1886984fb6815ba111108f7f353496de7d`;
- `Migration/DocumentaryMigrationPlanner.ts` classifies Documentary documentation as `canonical`, `generated`, `evidence`, `legacy`, `archive` or `unknown`;
- planning dispositions are bounded to `retain`, `migration-candidate`, `redirect-candidate`, `owner-review` or `blocked`;
- generated migration candidates require a known canonical target and proven reproducibility;
- authority, evidence, referenced, Security/Compliance and archive material remains retained;
- foreign-project ownership and unsafe/non-documentation paths fail closed as `blocked`;
- the planner always reports `mutationPerformed=false` and performs no move, delete, rewrite, registry mutation or redirect creation;
- targeted unit coverage for deterministic planning and negative/fail-closed cases is part of the merged D8 slice;
- final validated PR #792 head: `b3f15f9ef6ee92fd420800e539f5ce2f7004ddd2`; final pre-merge main: `993bd2bdf8f9d03f5b59c546c3f6ef1ecfdd7729` (3 ahead / 0 behind);
- [PR #792 hosted build-and-test](https://github.com/SvenKulessa/Finance/actions/runs/34063736365/job/101568862108): `success` on that exact head; repository integrity, TypeScript, unit tests, production build, CSP and predeploy passed;
- [PR #792 Governance](https://github.com/SvenKulessa/Finance/actions/runs/34063736332/job/101568834910): `success` on the same head before Human/CODEOWNER merge;
- these are historical exact-head results for the merged D8 slice, not fresh validation of this roadmap update or a production-deployment claim; the PR deployment check was `skipped`;
- the technical Documentary roadmap and component metadata project `Migration/` as the implemented read-only planning slice.

Separate remaining boundary:

- physical/semantic Migration Execution is **not** part of WP-DOC-06 and remains a separately scoped future work item;
- any execution requires fresh current-main correlation, owner-bounded authorization, applicable lifecycle/governance gates and no foreign-owner mutation by Documentary.

## WP-DOC-07 — ESS-0012 Documentary freshness validation

**State:** `IMPLEMENTED ON BRANCH — VALIDATION / PR / HUMAN MERGE PENDING`

Priority correlation:

- ESS-0012 defines `DocumentationValidator` as a Documentary Governance validation area;
- ESS-0012-CONTRACTS defines `GOV-DOC-003` — documentation older than the last changed referenced component — with `Medium` severity;
- the existing `DocumentationHygieneValidator` remains the canonical read-only registry/hygiene service and is not duplicated;
- `Discovery/SemanticFreshnessAnalyzer.ts` remains the single deterministic, commit/correlation-bound freshness discovery source for this slice.

Current branch implementation:

- branch: `agent/documentary-ess0012-gov-doc-003-20260907`;
- synchronized baseline: `main@eee9a8af3f3d2532a213154dd61f678454a2200b`;
- `Governance/Validators/DocumentationValidator.ts` implements the canonical `GOV-DOC-003` rule identity with `Medium` severity and `FileReference` evidence;
- the validator consumes the existing `SemanticFreshnessReport` and does not perform repository-wide freshness discovery itself;
- findings require a changed `src/platform/<Component>/...` path from the correlated source-change set plus an explicit matching reference in the current document body, while the document itself must be unchanged in the same correlated change set;
- the analyzer-provided content hash is revalidated before a finding is emitted, providing a fail-closed TOCTOU guard;
- each evidence item binds document path, line, referenced source path, source commit and correlation ID;
- synchronized documents, semantic-only candidates, stale hashes, missing/unreadable documents and periodic full-scan candidates without concrete changed-component evidence are discarded rather than promoted to findings;
- result and evidence ordering are deterministic and the validator performs no mutation;
- targeted unit coverage in `tests/unit/documentaryDocumentationValidator.test.ts` covers positive, negative/fail-closed, synchronized-document and deterministic mapping cases;
- `src/platform/Documentary/Governance/README.md` documents the bounded slice and preserves the global Governance boundary.

Explicit non-scope retained:

- no broader 57-rule suite activation;
- no Governance/Repository Health scoring or production-release thresholds;
- no second scanner, freshness engine, registry, event authority or Governance runtime;
- no global Governance, Supervisor, Platform Director, Version, Release, Production, Security or Compliance decision authority.

Exit gate:

- `GOV-DOC-003` coverage is proven on the exact final PR head;
- freshness evidence is reused from the existing Documentary analyzer without parallel architecture;
- no finding is emitted without concrete evidence and no mutation is performed;
- existing Documentation Hygiene behavior remains unchanged;
- applicable Documentary, TypeScript, unit, documentation and governance checks pass;
- Human/CODEOWNER merge completes and roadmap/component documentation is synchronized to the resulting state.

## Remaining Documentary work

The following areas remain separate Roadmap work and must not be bundled merely because prior Documentary slices are complete:

- **current:** WP-DOC-07 incremental ESS-0012 `GOV-DOC-003` Documentary freshness validation through validation, PR and Human merge;
- physical/semantic Migration Execution beyond the read-only D8 planning slice, only where separately authorized and owner-bounded;
- Plugins;
- broader Documentary architecture/runtime gaps explicitly still marked planned by current component/technical documentation;
- additional ESS-0012 validation coverage beyond the bounded WP-DOC-07 slice;
- ongoing lifecycle/maintenance quality improvements.

Before starting any item, re-read current `main`, this Roadmap, applicable ADR/ESS and the current component README/manifest.

## Dependencies

| Dependency | Owner / PVC | Documentary relationship |
|---|---|---|
| Governance / Platform Director | `CAPITAL-AI-GOV / PVC-05` | consume governance decisions; do not implement GOV scope |
| Supervisor / Version / Release / Production / EventMesh-Traceability runtime | `CAPITAL-AI-OPS / PVC-02,04,06,07,08,18` | evidence/integration dependency only |
| Data ingestion / Evidence / DQ | `CAPITAL-AI-DATA / PVC-09..11` | consume validated evidence where required |
| Feature Engineering through Ranking | `CAPITAL-AI-FINTECH / PVC-12..17` | read-only documentation/evidence projection |

Foreign productive implementation is performed from the target owner's Project Value Chain stage and Roadmap. A separate post-PVC handoff policy overlay is not required for ordinary planning.

## Definition of Done

A Documentary Roadmap item is complete only when:

- PVC-03 ownership is respected;
- applicable ADR/ESS are identified and reused;
- implementation is bounded to Documentary-owned surfaces;
- required tests/evidence pass on the final PR head;
- no duplicate registry/runtime/authority is introduced;
- Human/CODEOWNER performs merge;
- this Roadmap is updated to the resulting current state.
