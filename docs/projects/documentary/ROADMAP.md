# CAPITAL-AI-DOC — Project Roadmap

**Project ID:** `CAPITAL-AI-DOC`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Project Value Chain ownership:** `PVC-03 — Documentary Engine`  
**Primary Owner:** `CAPITAL-AI-DOC`  
**Repository trust root:** `/AGENTS.md`  
**Canonical project folder:** `docs/projects/documentary/`  
**Current main correlation:** `main@2a6909ead7dc4ed3299de3d07d84123ce53f9e46`  
**Correlation date:** `2026-09-10`

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

Merged lifecycle/hygiene synchronization evidence:

- PR **#838** — `GOV-RD-01 Document Registry und Hygiene synchronisieren`;
- merge SHA: `96119f958cacbf35614747380a066b87fdb1ee40`;
- merged at: `2026-09-07T19:58:49Z`;
- the Document Registry authority is synchronized to `docs/governance/control-plane/DOCUMENT_LIFECYCLE_POLICY.md`;
- the historical `DOCUMENTATION_HYGIENE_POLICY.md` remains a non-authorizing compatibility projection;
- `DocumentationHygieneValidator` remains read-only and validates the current registry/lifecycle authority without creating a second Governance authority.

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
- physical/semantic Migration Execution is **not** part of WP-DOC-06 and remains a separately scoped future work item.

## WP-DOC-07 — ESS-0012 Documentary freshness validation

**State:** `DONE — HUMAN-MERGED`

Merged implementation evidence:

- implementation PR: **#805** — GOV-DOC-003 Freshness Validation;
- merge SHA: `8618326db4d4a5af0fbecd65b83805ea7608109f`;
- component version on the merged slice is `1.16.0`.

## WP-DOC-08 — ESS-0012 GOV-DOC-006 generator marking

**State:** `DONE — HUMAN-MERGED`

Merged implementation evidence:

- implementation PR: **#813**;
- merge SHA: `0f83646839fcf1e7a6a55a3497bbb8efa81a0765`;
- component version on the merged slice is `1.17.0`.

## WP-DOC-09 — ESS-0012 GOV-DOC-001 document version

**State:** `DONE — HUMAN-MERGED`

Merged implementation evidence:

- implementation PR: **#815**;
- closeout PR: **#819**;
- component version on the merged slice is `1.18.0`.

## WP-DOC-10 — ESS-0012 GOV-DOC-002 ESS/ADR reference

**State:** `DONE — HUMAN-MERGED`

Merged implementation evidence:

- implementation PR: **#821** — WP-DOC-10 GOV-DOC-002 ESS/ADR-Referenz;
- merge SHA: `d952bd46129b2f86b60e119f6be3ac2b72b98faa`;
- merged at: `2026-09-07T10:24:04Z`;
- `collectGovDoc002Findings()` evaluates registered documents for explicit `ESS-NNNN` / `ADR-NNNN` identities in the document body;
- registry `authority` metadata alone does not satisfy the rule;
- the collector is not wired into the hygiene CLI gate;
- component version on the merged slice is `1.19.0`.

This closeout does not reopen WP-DOC-10 implementation and does not activate scoring, events, Migration Execution or Plugins.

## WP-DOC-11 — ESS-0012 GOV-DOC-004 document class structure

**State:** `DONE — HUMAN-MERGED`

Merged implementation evidence:

- implementation/closeout PR: **#826** — WP-DOC-10 Closeout und GOV-DOC-004 Validator;
- merge SHA: `8081608a1a14ba0ce6ea5f88e3a81afca8db6410`;
- merged at: `2026-09-07T12:43:23Z`;
- `collectGovDoc004Findings()` evaluates registered `architecture`, `component`, `api`, `runbook`, `release-evidence` and `handoff` documents;
- acceptance requires a Markdown heading plus a class marker from the Documentary renderer labels or the document-type token;
- unknown registry types, missing files and unregistered paths are skipped fail-closed because the bounded collector requires concrete FileReference evidence;
- targeted unit coverage extends `tests/unit/documentaryDocumentationValidator.test.ts`;
- component version on the merged slice is `1.20.0`;
- no scoring, event, hygiene-CLI, Migration Execution or Plugin authority was added.

## WP-DOC-12 — ESS-0012 GOV-DOC-005 documentation path exception

**State:** `IMPLEMENTED ON BRANCH — VALIDATION / PR / HUMAN MERGE PENDING`

Priority correlation:

- ESS-0012-CONTRACTS Chapter 2.5 defines `GOV-DOC-005` — documentation outside `docs/` without a registered exception — with `High` severity;
- it is the highest-severity remaining bounded Documentation rule after Human-merged `GOV-DOC-001`/`002`/`003`/`004`/`006`;
- the existing Document Registry remains the only exception registration surface for this slice.

Current branch implementation:

- branch: `agent/documentary-wp-doc-12-gov-doc-005-20260910`;
- synchronized baseline: `main@2a6909ead7dc4ed3299de3d07d84123ce53f9e46`;
- `Governance/Validators/GovDoc005Validator.ts` consumes an explicit caller-supplied set of candidate documentation paths and does **not** introduce a repository scanner;
- Markdown under `docs/` is accepted directly;
- Markdown outside `docs/` is accepted only when its exact normalized repository-relative path exists in the canonical `docs/governance/document-registry.json`;
- an existing regular non-symlink Markdown file outside `docs/` without that exact registry exception produces a deterministic `High` `GOV-DOC-005` finding with `FileReference` evidence;
- missing, non-Markdown, path-escaping or otherwise unverifiable candidates do not produce speculative findings;
- targeted unit coverage is isolated in `tests/unit/documentaryGovDoc005Validator.test.ts`;
- component version projection advances to `1.21.0` on this branch.

Explicit non-scope retained:

- no broader 57-rule suite activation;
- no scoring, events or hygiene-CLI wiring;
- no `GOV-DOC-007` implementation;
- no Document Registry mutation or new exception registration;
- no Migration Execution or Plugins.

Exit gate:

- `GOV-DOC-005` behavior is proven on the exact final PR head by targeted unit coverage and applicable required checks;
- every emitted violation carries concrete `FileReference` evidence and no missing registry exception is inferred from an unverified path;
- existing Hygiene and GOV-DOC-001/002/003/004/006 behavior remains unchanged;
- Human/CODEOWNER merge completes and this Roadmap is synchronized to the resulting current `main`.

## Remaining Documentary work

The following areas remain separate Roadmap work and must not be bundled merely because prior Documentary slices are complete:

- **current:** WP-DOC-12 incremental ESS-0012 `GOV-DOC-005` documentation-path exception validation through validation, PR and Human merge;
- next after WP-DOC-12: ESS-0012 `GOV-DOC-007` unresolved-reference validation as its own bounded slice;
- physical/semantic Migration Execution beyond the read-only D8 planning slice;
- Plugins;
- broader Documentary architecture/runtime gaps still marked planned;
- additional ESS-0012 validation coverage beyond the implemented bounded Documentary rules;
- ongoing lifecycle/maintenance quality improvements.

Before starting any item, re-read current `main`, this Roadmap, applicable ADR/ESS and the current component README/manifest.

## Dependencies

| Dependency | Owner / PVC | Documentary relationship |
|---|---|---|
| Governance / Platform Director | `CAPITAL-AI-GOV / PVC-05` | consume governance decisions; do not implement GOV scope |
| Supervisor / Version / Release / Production / EventMesh-Traceability runtime | `CAPITAL-AI-OPS / PVC-02,04,06,07,08,18` | evidence/integration dependency only |
| Data ingestion / Evidence / DQ | `CAPITAL-AI-DATA / PVC-09..11` | consume validated evidence where required |
| Feature Engineering through Ranking | `CAPITAL-AI-FINTECH / PVC-12..17` | read-only documentation/evidence projection |

Foreign productive implementation is performed from the target owner's Project Value Chain stage and Roadmap.

## Definition of Done

A Documentary Roadmap item is complete only when:

- PVC-03 ownership is respected;
- applicable ADR/ESS are identified and reused;
- implementation is bounded to Documentary-owned surfaces;
- required tests/evidence pass on the final PR head;
- no duplicate registry/runtime/authority is introduced;
- Human/CODEOWNER performs merge;
- this Roadmap is updated to the resulting current state.
