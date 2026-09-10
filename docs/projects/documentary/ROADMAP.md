# CAPITAL-AI-DOC — Project Roadmap

**Project ID:** `CAPITAL-AI-DOC`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Role:** Human-readable project roadmap / non-authorizing execution projection  
**Project Value Chain ownership:** `PVC-03 — Documentary Engine`  
**Primary Owner:** `CAPITAL-AI-DOC`  
**Repository:** `capital-ai-online/Finance`  
**Repository trust root:** `/AGENTS.md`  
**Canonical project folder:** `docs/projects/documentary/`  
**Current main correlation:** `main@12ca12017916990e83ed213be781574c61808949`  
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

Current Git terminology is `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`. Historical branch/PR identities remain evidence only.

## 2. Roadmap operating model — outcome-driven confidence horizons

This Roadmap uses an outcome-driven planning model with confidence horizons instead of a feature calendar:

```text
Strategic Outcome
→ Initiative / Workstream
→ bounded Work Package
→ measurable Exit Gate
→ implementation / tests / evidence
→ Human/CODEOWNER merge
→ roadmap re-correlation
```

| Horizon | Meaning | Interpretation |
|---|---|---|
| **NOW** | highest-priority Documentary-owned problem with sufficient current evidence to start | correlation permits work to start; it is not merge/deploy authority |
| **NEXT** | validated likely follow-up whose order may change after NOW evidence | not a date commitment |
| **LATER** | lower-confidence strategic backlog or discovery area | no implementation commitment |
| **DEPENDENCY** | useful work owned by another project/PVC | consume/handoff evidence; do not absorb ownership |
| **DONE** | Human/CODEOWNER merged and correlated into current state | retain as concise evidence ledger |

These labels are local Roadmap presentation states only. They do not replace repository lifecycle states, Authority identities, ADR/ESS status, PR state or Human gates.

### Planning principles

1. **Outcome before output.** Planned work states the problem/outcome before the implementation shape.
2. **Evidence before confidence.** Missing evidence and `NOT RUN` remain explicit and never become PASS through roadmap wording.
3. **Few active priorities.** Documentary should normally have one primary NOW slice unless non-overlapping work is independently justified.
4. **Risk-adjusted ordering.** Security/data-integrity/governance and higher-severity contractual gaps outrank convenience work when readiness is comparable.
5. **Explicit dependencies.** Foreign productive work stays with its mapped Primary Owner/PVC.
6. **Flexible future.** NEXT/LATER express confidence, not fixed dates.
7. **Continuous improvement.** Every Human merge or material Authority/contract change triggers re-correlation before priority advances.

External roadmapping/documentation frameworks may inform presentation or user-needs analysis, but remain advisory and cannot override CAPITAL-AI Authority or existing Documentary contracts.

## 3. Current Documentary baseline

The productive component remains `src/platform/Documentary/` and is currently **Partial Implementation**, version `1.21.0`.

Implemented Documentary baseline includes:

- D0 version-authority separation;
- D1 discovery / semantic freshness;
- D2 core engine;
- D3 document models / provenance;
- D4 review and lifecycle governance;
- D5 Documentary-side traceability / event integration;
- D6 generators / renderers including deterministic Mermaid source projection;
- D7 Knowledge projection;
- D8 read-only migration planning;
- D9 bounded maintenance observability;
- Documentation Hygiene read-only validation;
- ESS-0012 documentation rules `GOV-DOC-001`, `002`, `003`, `004`, `005` and `006` as bounded read-only validators;
- ADR-0097 Documentary Maintenance Control Loop and bounded archive-retention planning.

Canonical supporting surfaces:

- `src/platform/Documentary/README.md` — current productive component scope/status;
- `src/platform/Documentary/manifest.json` — Documentary component-version authority;
- `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` — detailed technical workstream projection;
- `docs/governance/document-registry.json` — canonical document identity/registered path surface;
- `src/platform/Documentary/Governance/Services/DocumentationHygieneValidator.ts` — reusable read-only hygiene baseline;
- `ESS-0010` — Documentary Engine;
- `ESS-0012` / `ESS-0012-CONTRACTS` — Documentation Governance;
- `ESS-0017` / `ADR-0078` — Vocabulary Governance;
- `ESS-0009` — Enterprise Knowledge Platform;
- `ESS-0011` — Enterprise Traceability;
- `ADR-0097` — Documentary Maintenance Agent Control Loop.

If a secondary technical roadmap or historical evidence contains older status/version wording, current code/manifest plus this current-main-correlated project Roadmap determine execution planning within the applicable Authority model.

## 4. Strategic outcomes and measurable health

### OUTCOME-DOC-01 — Evidence-backed documentation governance coverage

**Intent:** Complete remaining ESS-0012 documentation-only rule coverage incrementally without activating unrelated validator areas, scoring, event publication, release authority or mutation authority.

Current measurable baseline:

- implemented Documentary documentation rules: **6 / 7** (`001`, `002`, `003`, `004`, `005`, `006`);
- remaining documentation rules: **1 / 7** (`007`);
- findings without permitted evidence: **target 0**;
- validator mutation of inspected documentation: **target 0**;
- deterministic result for identical repository state: **required**.

Target state:

- `GOV-DOC-007` has a bounded, deterministic, read-only implementation with targeted evidence/tests;
- reaching 7/7 documentation-rule coverage does **not** implicitly activate the wider ESS-0012 rule catalog or repository-wide release gates.

### OUTCOME-DOC-02 — Safe migration and lifecycle evolution

**Intent:** Move from D8 read-only migration planning toward a separately authorized execution contract without losing identity, provenance, history or ownership boundaries.

Health conditions:

- D8 remains `mutationPerformed=false` until separately authorized execution work exists;
- Authorities, Evidence, Security/Compliance material and foreign-owner content remain fail-closed;
- stable document identity survives path changes;
- dry-run, rollback/abort and verification gates exist before physical mutation.

### OUTCOME-DOC-03 — Measurable Documentary quality and operability

**Intent:** Extend bounded D9 maintenance metrics into a small, privacy-preserving Documentary quality/SLO model before adding broad observability complexity.

Candidate Documentary-owned indicators, subject to contract/evidence correlation before implementation:

- registry coverage;
- freshness ratio;
- orphan rate;
- documentation-rule coverage;
- unresolved-reference rate;
- deterministic-render / reproducibility checks;
- maintenance candidate → planned patch → applied document funnel counts.

Document bodies, prompts, secrets and user identifiers are not required for these aggregate metrics.

### OUTCOME-DOC-04 — Safe extensibility without parallel frameworks

**Intent:** Define a Documentary plugin/extension model only where it reuses existing provider, agent, event, lifecycle and governance boundaries.

Target conditions:

- no second provider/agent framework;
- no second EventMesh, Knowledge, Registry or approval plane;
- extension contract is deterministic, least-privilege and testable;
- security/ownership boundaries are explicit before productive capability is enabled.

## 5. Current priority board

| Horizon | Work package | Outcome | Why this priority | Primary exit signal |
|---|---|---|---|---|
| **NOW** | `WP-DOC-13 — GOV-DOC-007 unresolved reference` | OUTCOME-DOC-01 | final remaining bounded ESS-0012 documentation rule; closes the documentation-rule sequence | deterministic bounded reference-resolution contract with evidence-backed tests |
| **NEXT** | `WP-DOC-14 — D8 Migration Execution contract & dry-run design` | OUTCOME-DOC-02 | transforms the known planning gap into a safe execution contract before physical mutation | owner-bounded dry-run/identity/rollback/verification design; no bulk migration implied |
| **LATER** | `WP-DOC-15 — Documentary quality/SLO model` | OUTCOME-DOC-03 | current D9 metrics exist but broader actionable quality targets remain open | small measurable Documentary-owned health contract |
| **LATER** | `WP-DOC-16 — Plugin extension model` | OUTCOME-DOC-04 | valuable only after core governance coverage and migration safety are clearer | extension design reuses existing frameworks and passes security/ownership review |
| **LATER** | `WP-DOC-17 — Consumer retry/idempotency hardening` | OUTCOME-DOC-03 | should be implemented only where Documentary-side failure evidence exists | reproducible failure evidence + minimal deterministic remediation |

## 6. Standard Work Package blueprint

Every new Documentary work package SHOULD be expressed in this compact form before implementation:

```text
WP-DOC-XX — <problem / outcome>
Horizon: NOW | NEXT | LATER
Outcome: OUTCOME-DOC-XX
State: <current factual state>

Problem / evidence:
- <current-main evidence proving the gap>

Authority / contracts:
- <applicable ADR / ESS / policy>

In scope:
- <bounded Documentary-owned surfaces>

Out of scope:
- <foreign ownership / non-goals>

Dependencies / decisions:
- <owner, contract or evidence dependencies>

Success metrics:
- <measurable conditions>

Validation:
- <targeted tests / validators / evidence>

Exit gate:
- <objective completion conditions including Human merge + roadmap sync>
```

A work package is not implementation-ready merely because it appears in NOW/NEXT. Current `main`, open PRs, changed-file/semantic overlap, applicable ADR/ESS, reuse options and ownership still require re-correlation before protected work.

## 7. NOW detail — WP-DOC-13 GOV-DOC-007

**Horizon:** `NOW`  
**State:** `READY FOR CURRENT-CONTRACT CORRELATION — IMPLEMENTATION NOT STARTED`  
**Outcome:** `OUTCOME-DOC-01`

### Problem / evidence

`ESS-0012-CONTRACTS` defines:

- `GOV-DOC-007` — document with unresolved reference — `Low` severity.

Current Documentary code on `main@12ca12017916990e83ed213be781574c61808949` implements `GOV-DOC-001/002/003/004/005/006`; `GOV-DOC-007` remains the only unimplemented bounded Documentation rule in Chapter 2.5.

### Mandatory design questions

Before implementation, resolve explicitly:

- which reference schemes are within Documentary scope;
- which references are repository-local vs intentionally external;
- whether anchors/fragments, registry IDs and relative paths have distinct resolution semantics;
- what qualifies as concrete `FileReference` or other permitted evidence;
- how to avoid network crawling as an implicit validator side effect;
- how to avoid treating arbitrary prose tokens as references.

### In scope

- bounded read-only `GOV-DOC-007` implementation using existing Documentary identity/reference contracts;
- deterministic sorting/deduplication;
- targeted unit tests for valid, invalid, missing and intentionally external references;
- component metadata/roadmap synchronization only when implementation is actually merged.

### Out of scope

- autonomous reference repair;
- external web crawling as a hidden validation dependency;
- Document Registry mutation;
- scoring, event publication or release gating;
- Migration Execution or Plugins;
- activation of unrelated ESS-0012 rule areas.

### Exit gate

- supported reference schemes and resolution semantics are explicit;
- every emitted violation carries permitted concrete evidence;
- identical repository state produces deterministic findings;
- validator remains read-only;
- existing Hygiene and `GOV-DOC-001/002/003/004/005/006` behavior does not regress;
- applicable Documentary/unit/documentation/governance checks pass on the exact final PR head;
- Human/CODEOWNER merge completes;
- this Roadmap is synchronized to resulting current `main`.

## 8. NEXT/LATER discovery

### WP-DOC-14 — D8 Migration Execution contract & dry-run design

**Horizon:** `NEXT` after the bounded documentation-rule sequence unless new risk evidence changes priority.

The first slice is contract/dry-run design, **not bulk migration**. It must define stable document identity preservation, canonical-target/compatibility rules, owner-boundary checks, protected classes, dry-run evidence, rollback/abort semantics, authorized lifecycle/registry transitions and deterministic verification before physical mutation.

### WP-DOC-15 — Documentary quality/SLO model

**Horizon:** `LATER`.

Prefer a small set of actionable Documentary-owned indicators over a large metric catalog. Thresholds require evidence and must not silently become repository-wide release gates.

### WP-DOC-16 — Plugin extension model

**Horizon:** `LATER`.

Discovery begins with the repository reuse order: existing native capability → existing connected/platform capability → suitable specialized component/plugin → maintained security-/license-compatible open source → custom implementation only if needed. This Roadmap authorizes no install/connect/permission mutation.

### WP-DOC-17 — Consumer retry/idempotency hardening

**Horizon:** `LATER / EVIDENCE-DRIVEN`.

Do not add generic retry complexity speculatively. First prove a Documentary-owned consumer failure mode, then implement the smallest deterministic hardening inside the existing EventMesh boundary.

## 9. Completed work ledger

| Work package | State | Primary evidence |
|---|---|---|
| `WP-DOC-00` Canonical project surface | `DONE — HUMAN-MERGED` | PR #645 |
| `WP-DOC-01` Baseline / document model correlation | `DONE — HUMAN-MERGED` | merged Documentary baseline sequence incl. PR #673/#674 |
| `WP-DOC-04` Technical roadmap ownership reconciliation | `DONE — HUMAN-MERGED` | PR #664 |
| `WP-DOC-05` Deterministic Mermaid projection | `DONE — HUMAN-MERGED / CLAIM RELEASED` | PR #679; claim terminalized by PR #700 |
| `WP-DOC-06` D8 read-only migration planning | `DONE — HUMAN-MERGED` | PR #792 / merge `12b5ec1886984fb6815ba111108f7f353496de7d` |
| `WP-DOC-07` `GOV-DOC-003` freshness | `DONE — HUMAN-MERGED` | PR #805 / merge `8618326db4d4a5af0fbecd65b83805ea7608109f` |
| `WP-DOC-08` `GOV-DOC-006` generator marking | `DONE — HUMAN-MERGED` | PR #813 / merge `0f83646839fcf1e7a6a55a3497bbb8efa81a0765` |
| `WP-DOC-09` `GOV-DOC-001` document version | `DONE — HUMAN-MERGED` | PR #815 + closeout #819 |
| `WP-DOC-10` `GOV-DOC-002` ESS/ADR reference | `DONE — HUMAN-MERGED` | PR #821 / merge `d952bd46129b2f86b60e119f6be3ac2b72b98faa` |
| `WP-DOC-11` `GOV-DOC-004` document class structure | `DONE — HUMAN-MERGED` | PR #826 / merge `8081608a1a14ba0ce6ea5f88e3a81afca8db6410` |
| `WP-DOC-12` `GOV-DOC-005` documentation path exception | `DONE — HUMAN-MERGED` | PR #866 / merge `12ca12017916990e83ed213be781574c61808949` |

Continuous maintained workstreams:

- `WP-DOC-02` lifecycle, maintenance and Documentation Governance; includes merged GOV-RD-01 synchronization evidence from PR #838;
- `WP-DOC-03` Vocabulary, Knowledge and Wiki projection.

## 10. Dependencies and ownership

| Dependency | Owner / PVC | Documentary relationship |
|---|---|---|
| Governance / Platform Director | `CAPITAL-AI-GOV / PVC-05` | consume governance decisions; do not implement GOV scope |
| Supervisor / Version / Release / Production / EventMesh-Traceability runtime | `CAPITAL-AI-OPS / PVC-02,04,06,07,08,18` | evidence/integration dependency only |
| Data ingestion / Evidence / DQ | `CAPITAL-AI-DATA / PVC-09..11` | consume validated evidence where required |
| Feature Engineering through Ranking | `CAPITAL-AI-FINTECH / PVC-12..17` | read-only documentation/evidence projection |
| Security / Compliance / Quality | cross-cutting owners | requirements/findings/independent verification; no ownership transfer |

Foreign productive implementation stays with the target owner's Project Value Chain stage and Roadmap unless an effective delegated execution authority explicitly applies without ownership transfer.

## 11. Roadmap health checks

The Roadmap is current only when:

- correlation baseline is refreshed before starting a Documentary slice;
- open PRs and overlapping writers are checked;
- merged work is not left as `pending`;
- NOW reflects the highest-priority ready Documentary-owned problem;
- NEXT/LATER do not imply dates or authorization;
- each remaining gap maps to an outcome and objective exit gate;
- current component/contract evidence, not historical roadmap text, determines implementation status;
- foreign-owner dependencies remain explicit;
- `NOT RUN` remains distinct from PASS;
- no duplicate registry/runtime/authority is introduced.

Re-correlation is mandatory after every Human merge affecting Documentary scope, material `/AGENTS.md`/ADR/ESS/registry change, new overlapping PR/writer, evidence that invalidates priority, or completion/blocking of the current NOW item.

## 12. Definition of Done for a Documentary Roadmap item

A Documentary Roadmap item is complete only when:

- PVC-03 ownership is respected;
- applicable current ADR/ESS are identified and reused;
- implementation is bounded to Documentary-owned surfaces;
- reuse/security/compliance pre-checks are performed where material;
- measurable success/exit conditions are satisfied;
- required tests/evidence pass on the exact final PR head;
- `NOT RUN` checks are reported truthfully;
- no duplicate registry/runtime/authority or hidden foreign-owner implementation is introduced;
- Human/CODEOWNER performs merge;
- this Roadmap is updated to the resulting current state.

Detailed branch-local planning text should not remain presented as current active work after the corresponding Human merge; completed items move to the concise evidence ledger.
