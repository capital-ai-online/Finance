# CAPITAL-AI-DOC — Project Roadmap

**Project ID:** `CAPITAL-AI-DOC`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Role:** Human-readable project roadmap / non-authorizing execution projection  
**Project Value Chain ownership:** `PVC-03 — Documentary Engine`  
**Primary Owner:** `CAPITAL-AI-DOC`  
**Repository:** `capital-ai-online/Finance`  
**Repository trust root:** `/AGENTS.md`  
**Canonical project folder:** `docs/projects/documentary/`  
**Current main correlation:** `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`  
**Correlation date:** `2026-09-10`

## 1. Navigation and authority boundary

```text
PVC-03 Documentary Engine
→ this Roadmap
→ applicable ADR
→ applicable ESS
→ implementation / tests / evidence
```

This Roadmap coordinates Documentary-owned execution priority and completion state. It does **not** create a second Documentary runtime, registry, policy hierarchy or Authority. `/AGENTS.md`, accepted ADR/ESS, canonical registries and current code/tests remain authoritative in their respective scopes.

Current Git terminology is `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`. Historical branches, PRs and evidence are non-authorizing.

## 2. Current correlation

Current `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a` contains Human-merged Documentary work through PR #866 and the later Governance planning merge PR #868. The latter does not change Documentary productive files or PVC-03 ownership.

Correlation performed on 2026-09-10:

- open Pull Requests at the checked point: **none**;
- `WP-DOC-12 / GOV-DOC-005` is **DONE — HUMAN-MERGED** through PR #866 / merge `12ca12017916990e83ed213be781574c61808949`;
- `agent/documentary-roadmap-blueprint-20260910` is the bounded Documentary roadmap writer and is synchronized with current `main`;
- `agent/documentary-wp-doc-13-gov-doc-007-20260910` is the bounded implementation branch for `WP-DOC-13`; it is synchronized with current `main` and remains non-authorizing until PR/Human merge;
- no second Documentary roadmap writer, registry, Governance authority, EventMesh runtime or Knowledge runtime is introduced.

## 3. Outcome-driven planning model

```text
Strategic Outcome
→ bounded Work Package
→ measurable Exit Gate
→ implementation / tests / evidence
→ Human/CODEOWNER merge
→ roadmap re-correlation
```

| Horizon | Meaning |
|---|---|
| **NOW** | highest-priority Documentary-owned problem with sufficient evidence |
| **NEXT** | validated follow-up whose execution waits for the current NOW slice or a new priority decision |
| **LATER** | lower-confidence/evidence-dependent backlog |
| **DEPENDENCY** | useful work owned by another project/PVC |
| **DONE** | Human/CODEOWNER merged and correlated into current state |

These labels are planning projections only. They do not grant merge, deployment or protected-mutation authority.

## 4. Current Documentary baseline

The productive component remains `src/platform/Documentary/` and is `Partial Implementation`.

Current-main component version: `1.21.0`.

Implemented on current `main`:

- D0 version-authority separation;
- D1 discovery / semantic freshness;
- D2 core engine;
- D3 document models / provenance;
- D4 review and lifecycle governance;
- D5 Documentary-side traceability / EventMesh adapters;
- D6 generators/renderers including deterministic Mermaid source projection;
- D7 Knowledge projection;
- D8 read-only migration planning;
- D9 bounded maintenance observability;
- Documentation Hygiene read-only validation;
- bounded ESS-0012 documentation rules `GOV-DOC-001` through `GOV-DOC-006`;
- ADR-0097 Documentary Maintenance Control Loop and bounded Archive Retention planning.

Implemented on the current WP-DOC-13 branch but **not yet current main**:

- bounded `GOV-DOC-007` unresolved-reference validation;
- component and Documentation Governance version fields deliberately remain at their current values because ESS-0001-CONTRACTS does not permit an AI to autonomously choose the next version; version impact is a separate authority/Human gate.

## 5. Strategic outcomes

### OUTCOME-DOC-01 — Evidence-backed documentation governance coverage

Complete the seven Documentation rules from ESS-0012-CONTRACTS Chapter 2.5 incrementally without activating unrelated rule families, scoring, event publication, release authority or mutation authority.

Current state:

- current main: 6/7 bounded Documentation rules implemented;
- WP-DOC-13 branch: 7/7 bounded Documentation rules implemented;
- merge/current-main completion remains pending for the seventh rule.

### OUTCOME-DOC-02 — Safe migration and lifecycle evolution

Move from D8 read-only planning toward a separately authorized execution contract while preserving stable identity, provenance, compatibility, history and Primary Owner boundaries.

Physical/semantic mutation remains prohibited until an execution contract, dry-run evidence, rollback/abort semantics and the applicable Human/Owner gates exist.

### OUTCOME-DOC-03 — Measurable Documentary quality and operability

Extend current bounded maintenance metrics only where a small, privacy-preserving Documentary-owned quality/SLO model has sufficient evidence. Thresholds must not silently become repository-wide release gates.

### OUTCOME-DOC-04 — Safe extensibility without parallel frameworks

Define Documentary extensions/plugins only where existing provider, agent, lifecycle, EventMesh, Knowledge and Governance boundaries are reused. No external connector/plugin installation, connection or permission mutation is authorized by this Roadmap.

## 6. Current priority board

| Horizon | Work package | State | Primary exit signal |
|---|---|---|---|
| **NOW** | `WP-DOC-13 — GOV-DOC-007 unresolved reference` | `IMPLEMENTED ON BRANCH — LOCAL VALIDATION PASS / VERSION + PR + HUMAN MERGE GATES OPEN` | version impact resolved + exact-head validation + Human/CODEOWNER merge + main re-correlation |
| **NEXT** | `WP-DOC-14 — D8 Migration Execution contract & dry-run design` | `QUEUED AFTER WP-DOC-13` | owner-bounded dry-run/identity/rollback/verification contract; no bulk migration |
| **LATER** | `WP-DOC-15 — Documentary quality/SLO model` | `EVIDENCE / CONTRACT CORRELATION REQUIRED` | small measurable DOC-owned health contract |
| **LATER** | `WP-DOC-16 — Plugin extension model` | `REUSE / SECURITY / OWNERSHIP CORRELATION REQUIRED` | extension model reuses existing frameworks and least privilege |
| **LATER** | `WP-DOC-17 — Consumer retry/idempotency hardening` | `EVIDENCE-DRIVEN / NOT IMPLEMENTATION-READY` | reproducible Documentary-owned failure mode + minimal deterministic remediation |

## 7. WP-DOC-13 — GOV-DOC-007 unresolved reference

**Horizon:** `NOW`  
**State:** `IMPLEMENTED ON BRANCH — LOCAL VALIDATION PASS / VERSION + PR + HUMAN MERGE GATES OPEN`  
**Branch:** `agent/documentary-wp-doc-13-gov-doc-007-20260910`

Authority / contracts:

- `ESS-0012-CONTRACTS` Chapter 2.5: `GOV-DOC-007` — document with unresolved reference — `Low`;
- `ESS-0012` / ADR-0014: read-only, deterministic findings with concrete evidence;
- existing Document Registry remains the source set for registered document identities/paths;
- ESS-0001-CONTRACTS preserves separate Version authority: implementation does not autonomously choose a new component/document version.

Branch implementation:

- `src/platform/Documentary/Governance/Validators/GovDoc007Validator.ts`;
- only explicit inline Markdown link/image targets are interpreted as references;
- repository-local relative/root-relative targets resolve without network access;
- Markdown fragments resolve against deterministic heading slugs or explicit anchors;
- intentional external URI schemes are not crawled;
- repository escape, missing local files and missing local Markdown fragments emit `Low` `FileReference` findings;
- missing registered source files are skipped rather than converted into speculative reference findings because Document Hygiene already owns registered-target existence;
- results are deduplicated/sorted deterministically;
- no repair, registry mutation, scoring, event publication or hygiene-CLI wiring is added;
- manifest/Governance documentation describe the new branch-local capability without an autonomous version increase.

Validation evidence on synchronized branch content:

- isolated strict TypeScript check for validator + targeted test source: **PASS**;
- deterministic local resolver smoke test: **PASS**;
- full repository Vitest/TypeScript/Documentation Hygiene/Governance/build: **NOT RUN** in the connector-only repository environment;
- hosted GitHub checks: **NOT RUN** before PR creation.

Exit gate:

- resolve version impact through the repository's Version authority/Human decision;
- synchronize again to then-current `main` immediately before PR approval;
- run all applicable exact-head checks that are available;
- Human/Owner explicitly approves PR creation for exact main/head SHAs;
- Human/CODEOWNER merges;
- Roadmap is synchronized to resulting current `main`.

## 8. Remaining Documentary-owned work

### WP-DOC-14 — D8 Migration Execution contract & dry-run design

**State:** `NEXT / QUEUED AFTER WP-DOC-13`.

The first execution slice is contract/dry-run design, **not bulk migration**. It must define:

- stable `DOC-*` identity preservation across path changes;
- canonical target and compatibility/redirect semantics;
- exact Primary Owner checks and foreign-owner blocking;
- protected authority/evidence/Security/Compliance/archive classes;
- dry-run evidence bound to source/target and content identity;
- abort and rollback semantics;
- allowed lifecycle/registry transition proposals without granting mutation authority;
- deterministic post-condition verification.

No physical move/delete/rewrite/registry mutation is authorized by the planning state.

### WP-DOC-15 — Documentary quality/SLO model

**State:** `LATER / EVIDENCE + CONTRACT CORRELATION REQUIRED`.

Candidate DOC-owned indicators include registry coverage, freshness ratio, orphan rate, documentation-rule coverage, unresolved-reference rate, deterministic render/reproducibility checks and maintenance funnel counts. Existing D9 already provides core aggregate freshness/coverage/orphan metrics; this package therefore requires a target/SLO contract rather than a duplicate metrics implementation. Thresholds require evidence and must remain Documentary-local unless a higher authority separately promotes them.

### WP-DOC-16 — Plugin extension model

**State:** `LATER / REUSE + SECURITY + OWNERSHIP CORRELATION REQUIRED`.

Discovery order is the repository reuse order: existing repository/native capability → already-connected suitable platform/plugin capability → specialized plugin → maintained security-/license-compatible open source → custom implementation only when needed. ESS-0001-CONTRACTS already defines enterprise Plugin/Extension contracts and registry expectations, so Documentary must consume those boundaries rather than creating a parallel registry/framework. No connector/app installation, connection, enablement or permission mutation is authorized here.

### WP-DOC-17 — Consumer retry/idempotency hardening

**State:** `LATER / EVIDENCE-DRIVEN / NOT IMPLEMENTATION-READY`.

Do not add speculative retries. Current Documentary consumer contracts already validate supported trigger names and correlation/causation identifiers. A new retry/idempotency mechanism requires reproducible Documentary-owned failure evidence first; EventMesh ordering/replay/DLQ runtime remains CAPITAL-AI-OPS-owned.

### Additional generator profiles

**State:** `LATER / DEMAND-DRIVEN`.

Add only when an existing Documentary model/provenance/lifecycle contract has a concrete missing projection. Do not create speculative renderer profiles or a second document model.

### Sensitive-document classification consumption

**State:** `LATER / SECURITY-COMPLIANCE DEPENDENCY`.

Documentary may consume an existing stable Security/Compliance classification contract when one is correlated for this use. Current correlation found compliance/security classification material but no Documentary-owned stable document-classification contract that can safely be invented locally. Documentary must not create classification semantics or acquire Security/Compliance decision authority.

### Continuous maintained work

- `WP-DOC-02` — lifecycle, maintenance and Documentation Governance: `ACTIVE / CONTINUOUS`;
- `WP-DOC-03` — Vocabulary, Knowledge and Wiki projection: `ACTIVE BASELINE / CONTINUOUS`.

These are maintenance obligations, not one-off incomplete implementation claims.

## 9. Foreign-owner dependencies — not Documentary implementation work

| Dependency | Owner / PVC | Documentary relationship |
|---|---|---|
| Governance / Platform Director | `CAPITAL-AI-GOV / PVC-05` | consume decisions; do not implement GOV scope |
| Supervisor / Version / Release / Production / EventMesh / central Traceability | `CAPITAL-AI-OPS / PVC-02,04,06,07,08,18` | evidence/integration dependency only |
| Data ingestion / Evidence / DQ | `CAPITAL-AI-DATA / PVC-09..11` | consume validated evidence where required |
| Feature Engineering through Ranking | `CAPITAL-AI-FINTECH / PVC-12..17` | read-only documentation/evidence projection |
| Security / Compliance / Quality | cross-cutting owners | consume stable requirements/findings; no ownership transfer |

E0/E2/E3/E5 central EventMesh/replay/reliability implementation and H3 foreign-domain/runtime path rewiring are therefore not DOC-owned roadmap implementation.

## 10. Completed work ledger

| Work package | State | Primary evidence |
|---|---|---|
| `WP-DOC-00` Canonical project surface | `DONE — HUMAN-MERGED` | PR #645 |
| `WP-DOC-01` Baseline / document model correlation | `DONE — HUMAN-MERGED` | PR #673/#674 sequence |
| `WP-DOC-04` Technical roadmap ownership reconciliation | `DONE — HUMAN-MERGED` | PR #664 |
| `WP-DOC-05` Deterministic Mermaid projection | `DONE — HUMAN-MERGED / CLAIM RELEASED` | PR #679; closeout #700 |
| `WP-DOC-06` D8 read-only migration planning | `DONE — HUMAN-MERGED` | PR #792 / merge `12b5ec1886984fb6815ba111108f7f353496de7d` |
| `WP-DOC-07` `GOV-DOC-003` freshness | `DONE — HUMAN-MERGED` | PR #805 |
| `WP-DOC-08` `GOV-DOC-006` generator marking | `DONE — HUMAN-MERGED` | PR #813 |
| `WP-DOC-09` `GOV-DOC-001` document version | `DONE — HUMAN-MERGED` | PR #815 + #819 |
| `WP-DOC-10` `GOV-DOC-002` ESS/ADR reference | `DONE — HUMAN-MERGED` | PR #821 |
| `WP-DOC-11` `GOV-DOC-004` document class structure | `DONE — HUMAN-MERGED` | PR #826 |
| `WP-DOC-12` `GOV-DOC-005` documentation path exception | `DONE — HUMAN-MERGED` | PR #866 / merge `12ca12017916990e83ed213be781574c61808949` |

## 11. Roadmap health checks

This Roadmap is current only when:

- its main baseline reflects the latest correlated main SHA;
- merged work is not left as branch/PR pending;
- active branches and open PRs are distinguished from current authority;
- NOW represents the highest-priority ready Documentary-owned slice;
- NEXT/LATER do not imply implementation authority or dates;
- current code/manifests/tests outweigh historical roadmap descriptions;
- foreign-owner dependencies stay explicit;
- `NOT RUN` remains distinct from PASS;
- no duplicate registry/runtime/authority is introduced.

Re-correlation is mandatory after every Human merge affecting Documentary scope, material `/AGENTS.md`/ADR/ESS/registry change, new overlapping PR/writer, or completion/blocking of the current NOW item.

## 12. Definition of Done

A Documentary Roadmap item is complete only when:

- PVC-03 ownership is respected;
- applicable current ADR/ESS are identified and reused;
- implementation is bounded to Documentary-owned surfaces;
- reuse/security/compliance pre-checks are performed where material;
- measurable exit conditions are satisfied;
- required tests/evidence pass on the exact final PR head;
- version impact is resolved through the applicable Version authority rather than invented by an AI;
- `NOT RUN` checks are reported truthfully;
- no duplicate registry/runtime/authority or hidden foreign-owner implementation is introduced;
- Human/CODEOWNER performs merge;
- this Roadmap is updated to the resulting current state.
