# CAPITAL-AI-QM — Canonical Planning Roadmap

**Project:** `CAPITAL-AI-QM`  
**Folder:** `docs/projects/quality-management/`  
**Owner:** `CAPITAL-AI-QM` (cross-cutting; no productive PVC)  
**Status:** `PROPOSED — CANONICAL PLANNING ROADMAP; QM-V2 ACTIVATES ONLY AFTER ADR-0103 ACCEPTANCE / HUMAN MERGE`  
**Reconciliation:** 2026-09-22 — QM-PR900-01 independently assured against current main; owner-correct findings routed; QM-PR900-02 promoted as the single next execution-ready successor  
**Baseline:** `main@4c4a88e7f83150191c81134439e7bc9a1145ad4a`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation and authority rule

This file is the single canonical QM planning/status projection. It is consumed read-only by the existing Governance Roadmap automation and does not create a second queue, registry, status authority, productive PVC or remediation authority.

Current authority is deliberately split:

- `docs/projects/quality-management/README.md` keeps QM-V2 `PROPOSED — ACTIVATES AFTER ADR-0103 ACCEPTANCE / HUMAN MERGE`;
- `docs/adr/ADR-0103-quality-management-project-execution-authority.md` remains `proposed` and does not authorize itself;
- `.ai/skills/ESS-0005-Quality-Center.md` remains the active `Enterprise Approved` technical specification for the existing read-only Quality Center;
- `/AGENTS.md@current-main` controls branch, PR-create correlation, ordered automated Roadmap sequencing and Human/CODEOWNER merge;
- missing, stale, wrong-snapshot, incomplete, aborted or not-executed evidence is never `PASS`;
- Quality Gate evidence remains `PASS | FAIL | NOT_AVAILABLE`; `NOT RUN` is an execution fact, never a synthetic positive result;
- QM owns no productive PVC and does not implement foreign-domain remediation.

## Automated Roadmap execution contract

The existing current-main Roadmap automation may select QM work only from explicit execution-ready states in this file. Selection does not transfer authority and does not bypass Project/PVC/Owner, ADR/ESS, Security/Compliance, PR-create or Human/CODEOWNER boundaries.

Automation invariants:

1. re-read current `main`, open Pull Requests and relevant writers before each slice;
2. use a fresh `quality-management` scoped branch from then-current `main`;
3. preserve one ordered successor chain: a later QM item does not assume an unintegrated predecessor;
4. owner-route any implementation outside the active ESS-0005/QM boundary and verify only returned evidence;
5. create a Draft PR only after final `CREATE-CORRELATION = PASS` under then-current `/AGENTS.md`;
6. never promote branch-only, stale, historical or not-run evidence to current-main `PASS`;
7. do not duplicate the existing Governance Roadmap selector, PR classifier/planner, CI topology, Security provider workflow or Release authority.

## Deterministic QM successor order

`QM-PR900-01` reached a terminal assurance outcome on 2026-09-22. Exactly one successor is now execution-ready: `QM-PR900-02`. Later items remain `WAITING` until their predecessor reaches a terminal outcome and the Roadmap is re-correlated from then-current `main`.

### QM-PR900-01 — Deterministic PR-class matrix assurance

**Priority:** `5/5`.  
**State:** `DONE / ASSURANCE_COMPLETE_WITH_OWNER_HANDOFF`.  
**Dependencies:** none.

Revalidate the already materialized current-main PR classification and validation-planning chain rather than building a second classifier. Human-merged OPS/Security work already provides trusted-base changed-file planning, scoped validation profiles and provider-selection controls; QM independently assesses whether the resulting matrix is deterministic, risk-proportionate and evidence-truthful.

Assessment scope includes:

- documentation-only changes do not trigger inappropriate software/runtime validation;
- focused application/test slices receive the smallest sufficient checks;
- dependency, CI-control, Security, Runtime and unknown/high-risk changes escalate fail-closed;
- `NONE / FOCUSED / FULL` or equivalent planner states remain reproducible from trusted-base inputs;
- provider-specific optional checks do not become a second Required-Check or merge authority;
- skipped/not-selected/not-run checks remain distinguishable from `PASS`;
- any implementation defect is referred to its canonical GOV/OPS/SEC owner rather than repaired inside QM.

**Exit:** completed by [`evidence/QM_PR900_01_PR_CLASS_MATRIX_ASSURANCE_2026-09-22.md`](./evidence/QM_PR900_01_PR_CLASS_MATRIX_ASSURANCE_2026-09-22.md). The D/C/R + NONE/FOCUSED/FULL matrix remains fail-closed for high-risk/unknown/runtime-consumed scope; not-run evidence remains non-PASS. Current PR_FAST execution/preflight projection gaps are routed owner-correctly to `CAPITAL-AI-OPS` as Issue #1274 with an exact-head return gate.

### QM-PR900-02 — Exact-snapshot Quality evidence

**Priority:** `5/5`.  
**State:** `READY_FOR_EXECUTION`.  
**Dependencies:** QM-PR900-01 — terminal assurance outcome reached 2026-09-22.

Complete exact-identity binding for Quality execution evidence. Required ESS-0001-CONTRACTS Chapter-12 / ESS-0005 gates must report `PASS`, `FAIL` or `NOT_AVAILABLE`; wrong-head, stale, incomplete, skipped or not-executed evidence cannot satisfy a gate.

Historical implementation branches previously associated with Quality execution are no longer present as active branches and are search/evidence hints only. Any needed implementation must be re-derived from then-current main under the canonical technical owner; QM must not resurrect or fast-forward a stale implementation branch.

**Exit:** Quality evidence binds source/main or PR-head identity, executed validator/test identity and evidence provenance reproducibly; missing or mismatched identity yields `NOT_AVAILABLE`; focused exact-head verification is real rather than inferred; no second Quality/Governance execution authority is introduced.

### QM-PR900-03 — Enterprise Actions efficiency assurance

**Priority:** `4/5`.  
**State:** `WAITING / DEPENDS_ON_QM-PR900-02`.  
**Dependencies:** QM-PR900-02.

Reassess GitHub Actions/check efficiency from current owner evidence, including the current selective validation profiles, artifact/cache/retention behavior and applicable Enterprise controls. Reuse OPS/GOV/SEC implementation and provider evidence; QM remains assurance-only.

**Exit:** avoidable hosted work and retention/storage cost are identified with reproducible evidence while exact-SHA, Security, Recovery, Release and Deployment evidence remain intact. Provider or workflow mutations are owner-routed and separately authorized where required.

### QM-PR900-04 — Cross-project readiness evidence

**Priority:** `4/5`.  
**State:** `WAITING / DEPENDS_ON_QM-PR900-03`.  
**Dependencies:** QM-PR900-03.

Expose reproducible cross-project Quality/readiness evidence without becoming a second project-status authority. Consume owner-produced exact-snapshot evidence only and keep missing runtime/provider/independent-verification inputs visible.

**Exit:** every published readiness state traces to a current owner source, exact identity and verification status; incomplete evidence remains `NOT_AVAILABLE`; no synthetic aggregate percentage or synthetic project `PASS` is produced.

## Carried-forward QM assurance workstreams

These workstreams remain the long-lived assurance model, not separate execution-ready Roadmap targets. Their status therefore intentionally avoids bare `READY` tokens that could be mistaken for an executable automation item.

| ID | Assurance state |
|---|---|
| QM-01 Quality Criteria | `IN_PROGRESS / ASSURANCE_STREAM` |
| QM-02 Quality Gates | `ESS-0005_BOUND / ASSURANCE_STREAM` |
| QM-03 Quality Measurement | `ESS-0005_BOUND / ASSURANCE_STREAM` |
| QM-04 Findings | `ADR-0103_ACTIVATION_PENDING / ASSURANCE_STREAM` |
| QM-05 Regression | `ESS-0005_BOUND / ASSURANCE_STREAM` |
| QM-06 Technical Debt | `ESS-0005_BOUND / ASSURANCE_STREAM` |
| QM-07 Evidence | `ESS-0005_BOUND / ASSURANCE_STREAM` |
| QM-08 Continuous Improvement | `CONTINUOUS / ASSURANCE_STREAM` |

The proposed QM-V2 Finding/Referral lifecycle remains planning input until ADR-0103 acceptance. Existing ESS-0005 Quality-Center behavior remains active independently of that proposed lifecycle.

## Dependencies and owner boundaries

- `CAPITAL-AI-GOV / PVC-05`: repository Governance, Roadmap selection and policy/correlation authority;
- `CAPITAL-AI-OPS`: CI, hosted validation, release/runtime and Enterprise Actions implementation/evidence;
- `CAPITAL-AI-SEC`: independent Security assurance and Security-provider boundaries;
- `CAPITAL-AI-COMP`: independent Compliance assessment where applicable;
- productive project Primary Owners: technical remediation and exact-head domain evidence;
- ADR-0103 Human Merge / acceptance before proposed QM-V2 coordination authority becomes effective.

A foreign-owner dependency never authorizes QM to mutate that owner's Roadmap, runtime, provider settings or production state.

## Project exit gate

One canonical QM planning Roadmap is lifecycle-consistent with the proposed README/ADR and active ESS-0005 boundary; exactly one QM successor is execution-ready at a time; current-main classifier/check behavior is independently assured before exact-snapshot Quality evidence proceeds; subsequent efficiency/readiness work is dependency-held; stale or not-run evidence never becomes `PASS`; and QM creates no second Roadmap, Owner/PVC, Governance, Security, Compliance, Release or Production authority.
