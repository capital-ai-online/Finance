# CAPITAL-AI-QM — Canonical Quality Management Roadmap

**Project ID:** `CAPITAL-AI-QM`  
**Status:** `PROPOSED — CONSOLIDATION BRANCH`  
**Activation:** after ADR-0103 acceptance / Human Merge  
**Portfolio authority:** `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md`  
**Technical authority:** `ESS-0005 Quality Center`  
**Contract basis:** `ESS-0001-CONTRACTS Chapter 12`  
**Governance boundary:** `ADR-0096`

Operational QM state MUST be maintained here only after takeover. Domain implementation state remains in the source domain roadmap.

## State model

`PROPOSED | READY | IN_PROGRESS | BLOCKED | DONE | NOT_AVAILABLE`

Evidence result semantics are separately constrained to `PASS | FAIL | NOT_AVAILABLE`.

---

## QM-0 — Authority & Repository Baseline

**State:** `IN_PROGRESS`

### Work
- bind observations to the exact current `main` commit;
- correlate open PRs and parallel work claims;
- revalidate ESS-0005 against the actual codebase;
- confirm ESS-0001-CONTRACTS Chapter 12 and ADR-0096 boundaries;
- inventory Quality, Performance, Test, CI and Evidence artifacts;
- prevent creation of a second Quality authority.

### Exit
- baseline documented;
- no authority collision;
- existing QM artifacts inventoried.

---

## QM-1 — Cross-Roadmap Quality Takeover

**State:** `IN_PROGRESS`

Classify every candidate as `DOMAIN_IMPLEMENTATION`, `QUALITY_EXECUTION`, `MIXED` or `NOT_QM`. Transfer only quality execution. Mixed work retains the domain part at source.

### Sources
- Roadmap Consolidation Master Index;
- DEVELOPMENT Chain;
- Integrated Development/Systemadmin Roadmap;
- S1 Security Hardening;
- frontend/performance work packages;
- Compliance/Governance work packages;
- Release/CI work packages;
- Value Chain Coverage and Hardening roadmap;
- other active domain roadmaps discovered during review.

### Exit
- TAKEOVER_INDEX complete for active discovered items;
- no parallel QM status maintenance;
- source/domain relationship is traceable.

---

## QM-2 — Quality Center Baseline

**State:** `READY`

Verify and reuse, never duplicate:
- ValidatorRegistry;
- 16 Mandatory Validators;
- Chapter12ValidatorRunner;
- RepositoryQualityCoordinator;
- QualityGateRunner;
- QualityScoreCalculator;
- CoverageCollector;
- TechnicalDebtRegister;
- DocumentationConsistencyValidator;
- FintechValueChainQualityProjection;
- QualityCenterOrchestrator.

Existing Quality Gates and EventMesh are reused. Missing evidence is `NOT_AVAILABLE`, never synthetic `PASS`.

### Exit
Implementation status is evidenced against ESS-0005 and the Quality Center remains read-only.

---

## QM-3 — Authentication & Session Runtime Quality

**State:** `READY`

### Baseline findings
`refresh_token_not_found`, `session_not_found`, repeated `/auth/v1/user` calls, Post-OAuth bootstrap and Onboarding -> AAL/MFA -> Application bootstrap are quality/performance observation targets.

### Measure
- deterministic session initialization;
- redundant Auth request count;
- session recovery behavior;
- bootstrap latency and critical path;
- error classification;
- regression evidence.

No IAM/MFA policy mutation. Findings requiring policy or implementation changes are handed to the responsible Security/Auth domain.

---

## QM-4 — Frontend Runtime & Performance Quality

**State:** `READY`

### Scope
Route stalls on `/` and `/sources`, public/login bundle boundary, lazy loading, chunking, React bundle boundaries, initial rendering and blocking bootstrap dependencies.

`tests/unit/securityPerformancePriorityRemediation.test.ts` is an existing baseline and MUST be reused. It protects heavy-route lazy loading and the absence of a parallel `vendor-react` boundary.

### Exit
- stall attribution: network vs JavaScript vs rendering vs auth bootstrap;
- regression boundary documented;
- no second Public Shell, Router or `vendor-react` architecture;
- performance evidence bound to a reproducible runtime identity.

External performance recommendations are advisory until adopted by an existing authority; QM cannot invent normative thresholds.

---

## QM-5 — CI, Build & Regression Quality

**State:** `READY`

CI topology and required checks remain under ADR-0073/ADR-0047. QM consumes evidence only.

Verify exact-head binding for Build, Unit, Integration, Contract, Architecture, Security, Performance, E2E, Coverage and Runtime Release Manifest evidence.

- `PASS` = complete commit-bound positive evidence.
- `FAIL` = real negative evidence.
- `NOT_AVAILABLE` = missing, incomplete, skipped or wrong-commit evidence.

File existence MUST NOT be interpreted as a passed test.

---

## QM-6 — Documentation Quality & Technical Debt

**State:** `READY`

Check Quality documentation against code, roadmap/evidence consistency, baseline drift, duplicated QM work and technical debt traceability. Resolution requires resolution evidence.

ESS-0012 retains Documentation Governance authority.

---

## QM-7 — Cross-Domain Quality Projection

**State:** `READY`

Read-only quality projection across all 18 canonical value-chain stages and domain boundaries.

QM answers only:
- Is required evidence present?
- Is it current?
- Is it bound to the correct commit?
- Was the relevant test actually executed?
- Is there a regression?
- Is the existing Quality Contract fulfilled?

QM does not decide domain policy, feature semantics or production authorization.

---

## QM-8 — Quality Release Readiness

**State:** `READY`

Produces one non-authorizing snapshot:
- `QUALITY READY`
- `QUALITY BLOCKED`
- `QUALITY EVIDENCE INCOMPLETE`

Snapshot includes Contract, Architecture, Version, Documentation, Test, Security-quality evidence, Compliance-quality evidence, Build, technical debt, known regressions and missing evidence.

`QUALITY READY` is not merge/deployment approval.

---

## QM-9 — Drift & Continuous Quality Review

**State:** `READY`

Recurring append-only review of roadmap, documentation, contract, test/build, coverage, debt, parallel architecture, duplicate validators, stale evidence and cross-roadmap QM duplication.

### Exit rule
Findings are evidence; domain mutation follows a handoff to the authoritative project.