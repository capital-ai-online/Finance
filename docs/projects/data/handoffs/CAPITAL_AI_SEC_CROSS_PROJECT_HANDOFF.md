# CAPITAL-AI-SEC -> CAPITAL-AI-DATA Cross-Project Handoff

**Prompt ID:** `CAPITAL-AI-SEC-CROSS-PROJECT-HANDOFF`  
**Prompt version:** `1.0`  
**Source project:** `CAPITAL-AI-SEC`  
**Source PR:** `#631`  
**Security merge identity:** `b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6`  
**Current synchronization main:** `7fa5cfddcdb775078e1518bef4908af2e8706415`  
**Target project:** `CAPITAL-AI-DATA`  
**Target project folder:** `docs/projects/data/`  
**Affected project stage:** `PVC-10 — Evidence Management`  
**Security finding:** `S1-R2-11 — Evidence identity and stale-state automation`  
**Target roadmap:** `docs/projects/data/ROADMAP.md`  
**Target intake status:** `REFERRED_NOT_EXECUTED`  
**Security source status:** `WAITING_FOR_EVIDENCE`

This file is the resolved DATA-local projection of the Security handoff prompt. It does not copy Security authority into DATA and does not authorize a technical remediation beyond the DATA Primary Owner scope.

## Source references

- `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`
- `docs/roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md`
- `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md`
- `docs/projects/PROJECT_VALUE_CHAIN.md`
- `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`
- `docs/projects/operations/ROADMAP.md` for OPS-owned tooling remediation
- `docs/projects/fintech/ROADMAP.md` for the downstream DATA -> FINTECH boundary
- `docs/projects/quality-management/ROADMAP.md` for independent QM assessment

## Resolved target context

```yaml
target_context:
  target_project: "CAPITAL-AI-DATA"
  target_project_folder: "docs/projects/data/"
  affected_pvc:
    - "PVC-10"
  security_findings:
    - "S1-R2-11 — Evidence identity and stale-state automation"
  target_roadmap: "docs/projects/data/ROADMAP.md"
```

Security coverage also applies generally to DATA-owned `PVC-09` external-input validation and `PVC-11` fail-closed DQ, but the concrete merged finding in this handoff is routed to `PVC-10`.

## Purpose

CAPITAL-AI-SEC informs CAPITAL-AI-DATA about Security requirements, findings and verification gates whose productive implementation or domain evidence belongs to DATA as Primary Owner.

Security requirements are not an implicit transfer of DATA/PVC ownership.

## Precheck — final synchronization intake

- `/AGENTS.md` read from current main — PASS.
- Current main determined as `7fa5cfddcdb775078e1518bef4908af2e8706415` — PASS.
- Open pull requests checked — NONE at correlation.
- Active claims/writers checked — no DATA changed-file writer overlap found.
- Changed-file overlap — NONE.
- Semantic overlap — FOUND and correlated: PR #631 routes S1-R2-11 to DATA; PR #632 supplies OPS project surfaces; PR #635 supplies the downstream FINTECH project surface; PR #636 supplies the independent QM project surface; PR #637 adds Social-domain documentation only and introduces no DATA ownership or changed-file conflict.
- `PROJECT_VALUE_CHAIN.md` read — `PVC-09..11` confirmed as DATA-owned and `PVC-12` as FINTECH-owned.
- `CROSS_PROJECT_HANDOFF_CONTRACT.md` read — PVC namespace, target-folder and Primary-Owner fields confirmed.
- Security Traceability checked — S1-R2-11 target DATA/PVC-10 confirmed.
- Authority/ADR/ESS/control conflict — NONE identified for this documentation intake.
- Reuse before new architecture — existing UAI/MarketData/Evidence/DQ contracts remain the canonical implementation nucleus.
- Parallel architecture risk — NONE; this handoff adds no second data, Security, EventMesh, scoring, release or governance plane.

## Security boundary

### CAPITAL-AI-SEC owns

- Security Requirement;
- Threat / Control Definition;
- Security Finding;
- Negative-Test expectation;
- independent Security Verification.

### CAPITAL-AI-DATA owns

- productive implementation inside `PVC-09..11`;
- project-local technical changes;
- Runtime/Provider/Evidence data where DATA is Primary Owner;
- DATA roadmap/work-package integration;
- returned exact-candidate/runtime evidence for DATA-owned remediation.

### CAPITAL-AI-SEC does not own

- productive DATA implementation;
- DATA roadmap authority;
- Production Deployment Authority;
- Accepted Risk Authority;
- foreign PVC stages.

## Required handoff record

`[SECURITY_HANDOFF -> CAPITAL-AI-DATA | VC-10]`  
`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-10]`

- `project_namespace: PVC`
- `project_stage: PVC-10`
- `target_project: CAPITAL-AI-DATA`
- `target_project_folder: docs/projects/data/`
- `primary_owner: CAPITAL-AI-DATA`
- `task: own evidence identity/freshness semantics and return evidence that CURRENT, STALE, CURRENT_AFTER_REFRESH and STALE_RETRY_REQUIRED behave on current immutable identities without candidate self-authorization`
- `reason: stale or wrong-identity evidence must not authorize current state`
- `dependency: Security requirement/verification; OPS owns recurring DevelopmentChain/PR/trace tooling integration and any tooling-code remediation`
- `required_evidence: current immutable baseline/head identities and trusted refresh/retry observations`
- `verification_gate: CAPITAL-AI-SEC independent verification`
- `status: REFERRED_NOT_EXECUTED`

### Security source detail

- Severity: `P2 / MEDIUM`.
- Existing tooling evidence: `scripts/pr/updatePrProductionBaseline.mjs`.
- Required remediation: evidence-semantic correction only if verification exposes a DATA gap.
- Tooling corrections remain a separate OPS handoff under the applicable `PVC-02`/`PVC-18` stage. The current OPS project surface does not move that implementation into DATA.

## DATA execution rules

1. Verify the finding against then-current main and the exact DATA scope before technical remediation.
2. Reference the dependency in `ROADMAP.md` / `DATA-10`.
3. Use a DATA-owned claim and conforming DATA branch for technical remediation.
4. Change only DATA Primary Owner files.
5. Reuse existing UAI, MarketData, Evidence, freshness and DQ contracts before adding new components.
6. Run targeted positive and negative Security tests.
7. Bind evidence to the exact candidate/runtime identity.
8. Return evidence to CAPITAL-AI-SEC.
9. Do not set `Security VERIFIED` or `CLOSED` locally.

If required work belongs to OPS, FINTECH, GOV, DOC or another owner, DATA creates a separate handoff and leaves it `REFERRED_NOT_EXECUTED`.

## Required return contract

When DATA has actual implementation/evidence ready:

`[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]`

Required fields:

- `source_security_finding`
- `target_project`
- `project_stage`
- `implementation_status`
- `changed_files`
- `candidate_sha`
- `runtime_sha_if_applicable`
- `security_tests`
- `negative_tests`
- `evidence_paths`
- `known_residual_risk`
- `unresolved_dependencies`
- `verification_requested`

For this synchronization-only candidate, no technical remediation is claimed and no `EVIDENCE_READY` return is emitted.

## Completion and merge boundary

DATA may eventually report `IMPLEMENTED` or `EVIDENCE_READY`. Security `VERIFIED/CLOSED` requires independent CAPITAL-AI-SEC review.

- direct main edit: false;
- Human/CODEOWNER merge only;
- autonomous production mutation: false;
- Accepted Risk remains Human/Owner-controlled where applicable.
