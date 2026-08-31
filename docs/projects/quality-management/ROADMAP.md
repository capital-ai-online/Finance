# CAPITAL-AI-QM — Canonical Quality Assurance Roadmap

**Project ID:** `CAPITAL-AI-QM`  
**Prompt:** `CAPITAL-AI-QM-V2` v2.1  
**Status:** `PROPOSED — CONSOLIDATION BRANCH`  
**Activation:** after ADR-0103 acceptance / Human Merge  
**Project contract:** `docs/projects/quality-management/PROJECT_CONTRACT_V2.md`  
**Technical authority:** `ESS-0005 Quality Center`  
**Contract basis:** `ESS-0001-CONTRACTS Chapter 12`  
**Governance boundary:** `ADR-0096`

This roadmap is the operational source for **QM assurance work only**. Domain implementation/remediation state remains with the Primary Owner project.

## Non-negotiable ownership boundary

```text
primary_value_chain_ownership: []
executes_as_primary_owner: []
observes: VC-01..VC-18
remediation_execution_local: false
```

QM may identify, specify, prioritize and verify remediation. It MUST NOT implement foreign-domain remediation.

## Primary Owner routing

| VC | Primary Owner | VC | Primary Owner |
|---|---|---|---|
| VC-01 | `CAPITAL-AI-CLIENT` | VC-10 | `CAPITAL-AI-DATA` |
| VC-02 | `CAPITAL-AI-OPS` | VC-11 | `CAPITAL-AI-DATA` |
| VC-03 | `CAPITAL-AI-DOC` | VC-12 | `CAPITAL-AI-FINTECH` |
| VC-04 | `CAPITAL-AI-OPS` | VC-13 | `CAPITAL-AI-FINTECH` |
| VC-05 | `CAPITAL-AI-GOV` | VC-14 | `CAPITAL-AI-FINTECH` |
| VC-06 | `CAPITAL-AI-OPS` | VC-15 | `CAPITAL-AI-FINTECH` |
| VC-07 | `CAPITAL-AI-OPS` | VC-16 | `CAPITAL-AI-FINTECH` |
| VC-08 | `CAPITAL-AI-OPS` | VC-17 | `CAPITAL-AI-FINTECH` |
| VC-09 | `CAPITAL-AI-DATA` | VC-18 | `CAPITAL-AI-OPS` |

## Finding lifecycle

```text
DISCOVERED
-> TRIAGED
-> CONFIRMED
-> REFERRED
-> REMEDIATING
-> EVIDENCE_READY
-> VERIFIED
-> CLOSED
```

Every confirmed finding requires: `finding_id`, `affected_vc_stage`, `target_project`, `severity`, `evidence`, `required_remediation`, `verification_gate`, `status`.

Cross-project referral marker:

```text
[QUALITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]
```

---

## QM-01 — Quality Criteria

**State:** `IN_PROGRESS`

### Scope
- correlate applicable existing criteria from ESS/ADR/contracts;
- maintain a measurable criterion catalogue without inventing foreign domain rules;
- map every criterion to evidence source, VC stage and governing authority;
- distinguish normative CAPITAL-AI criteria from advisory external benchmarks.

### Exit gate
- every active criterion has authority/source and measurable evidence semantics;
- no duplicate Security, Compliance, Data, Scoring, Release or Product criterion authority exists in QM.

---

## QM-02 — Quality Gates

**State:** `READY`

### Scope
- execute/reuse existing Quality gates and validators;
- preserve `PASS | FAIL | NOT_AVAILABLE` semantics;
- verify gate inputs are current and correctly bound;
- issue findings when an authoritative gate fails or evidence is incomplete.

### Boundary
QM does not redefine CI required checks, release gates or domain authorization. Existing gates remain under their current authorities.

### Exit gate
- gate result has authoritative input evidence and exact identity;
- missing or wrong-snapshot evidence remains `NOT_AVAILABLE`.

---

## QM-03 — Quality Measurement

**State:** `READY`

### Scope
Measure all 18 VC stages where evidence exists, including:
- runtime/session behavior;
- frontend latency and blocking attribution;
- test/coverage/build evidence;
- architecture and documentation consistency;
- evidence freshness/completeness;
- value-chain continuity.

### Rules
- no synthetic scores;
- no new business-domain measurement formula without authority;
- use evidence adapters rather than duplicating domain logic;
- no direct Quality dependency in productive hot paths.

### Exit gate
Every reported measurement contains source, environment/snapshot identity and known limitations.

---

## QM-04 — Findings

**State:** `READY`

### Scope
- discover and triage quality deviations;
- confirm them against reproducible evidence;
- assign `affected_vc_stage` and `target_project`;
- specify required remediation and verification gate;
- refer remediation to the Primary Owner.

### Referral rule
A confirmed finding requiring implementation MUST transition to `REFERRED` with:

```text
[QUALITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]
```

The target project performs remediation in its own roadmap/branch/PR. QM tracks the finding lifecycle but not the target project's technical implementation authority.

### Exit gate
No confirmed finding is unowned.

---

## QM-05 — Regression

**State:** `READY`

### Scope
- maintain reproducible before/after evidence;
- reuse existing tests before adding new Quality-specific regression evidence;
- verify auth/session, frontend/runtime, CI/build and value-chain regressions;
- attribute regressions to the responsible VC stage/Primary Owner.

Existing baseline examples such as `tests/unit/securityPerformancePriorityRemediation.test.ts` are reused. QM creates no second Public Shell, Router, `vendor-react`, CI or Runtime architecture.

### Exit gate
Regression verdict is evidence-bound and any required remediation is referred to the target project.

---

## QM-06 — Technical Debt

**State:** `READY`

### Scope
- record quality debt with cause, impact, evidence, VC stage and Primary Owner;
- prioritize debt by severity/risk using existing authority semantics;
- require resolution evidence before closure;
- prevent silent debt closure.

### Boundary
QM owns the debt record and verification, not foreign-domain code remediation.

### Exit gate
Every active debt item has a target project or an explicit `NOT_AVAILABLE` dependency preventing assignment.

---

## QM-07 — Evidence

**State:** `READY`

### Scope
- collect/correlate authoritative test, build, runtime and quality evidence;
- bind evidence to exact commit/runtime/environment identities;
- maintain evidence lifecycle and known limitations;
- expose missing evidence as `NOT_AVAILABLE`;
- avoid copying large generated artifacts into Git when authoritative stores already exist.

### Exit gate
Every `PASS`, `FAIL`, `VERIFIED` or closure decision is traceable to authoritative evidence.

---

## QM-08 — Continuous Improvement

**State:** `READY`

### Scope
- review quality trend, recurring findings, debt and regression patterns;
- detect duplicate architecture, duplicate validators and stale assurance documentation;
- track improvement actions and verify outcomes;
- keep the Quality Center sidecar/read-only;
- periodically revalidate the VC-01..VC-18 Owner routing and evidence coverage.

### Exit gate
- no foreign technical execution retained in QM;
- no confirmed finding without remediation owner;
- no productive hot-path Quality authority;
- Quality Center remains read-only/non-authorizing.

---

## Validation invariants

1. QM remains independent.
2. QM owns zero productive VC stages.
3. All findings have a target project once confirmed.
4. All 18 stages are measurable where evidence exists.
5. Missing evidence remains `NOT_AVAILABLE`.
6. QM has no DATA ownership.
7. Remediation implementation occurs in the target project's PR.
8. `QUALITY READY` is not merge/release/deployment authorization.
9. Human/CODEOWNER merge remains mandatory.
10. Direct `main` edits are prohibited.

## Completion

This V2 migration is complete when the QM roadmap references relevant Primary Owner projects, old foreign-execution semantics have been removed, every finding uses explicit owner routing, the eight workstreams are canonical, and ESS-0005/ADR-0103 describe QM as independent read-only assurance rather than a foreign-domain remediation executor.