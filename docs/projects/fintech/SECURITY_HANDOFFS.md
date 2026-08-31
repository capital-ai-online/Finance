# CAPITAL-AI-FINTECH — Security Handoffs

**Source project:** `CAPITAL-AI-SEC`  
**Source PR:** `#631`  
**Security merge SHA:** `b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6`  
**Current-main correlation:** `6b1e7e5234604641449f304b5b251bd74151ddab`  
**Target project:** `CAPITAL-AI-FINTECH`  
**Target project folder:** `docs/projects/fintech`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Affected project stages:** `PVC-12..PVC-17`

## Boundary

CAPITAL-AI-SEC owns Security requirements, threats/control definitions, Security findings, negative-test expectations and independent Security verification.

CAPITAL-AI-FINTECH owns productive implementation and project-local evidence only where a concrete Security requirement or finding affects FINTECH-owned `PVC-12..17` code.

FINTECH cannot self-approve Accepted Risk and cannot mark its own remediation Security `VERIFIED` or `CLOSED`.

## Current finding correlation

The current Security routing matrix has **no concrete active finding directly routed to CAPITAL-AI-FINTECH**.

S1-R2-06 remains a conditional dependency. Its parent entitlement inventory is routed to `CAPITAL-AI-OPS / PVC-02`. Only if that inventory identifies FINTECH-owned productive protected-capability code does a child remediation handoff become FINTECH work.

Therefore this synchronization records the Security requirement baseline and return contract, but does not invent a Security finding or claim remediation execution.

## Stage-level Security requirement records

### PVC-12 — Feature Engineering

- security_marker: `[SECURITY_HANDOFF -> CAPITAL-AI-FINTECH | VC-12]`
- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-12]`
- project_namespace: `PVC`
- project_stage: `PVC-12`
- target_project: `CAPITAL-AI-FINTECH`
- target_project_folder: `docs/projects/fintech`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: preserve validated-input, feature-integrity and provenance boundaries in FINTECH feature engineering
- reason: untrusted, stale or provenance-incomplete input must not become trusted scoring features
- dependency: `CAPITAL-AI-DATA / PVC-09..11`; existing scoring/feature contracts
- required_evidence: feature-contract tests, missing/invalid-evidence negative tests, exact candidate lineage
- verification_gate: `CAPITAL-AI-SEC independent verification`
- status: `REFERRED_NOT_EXECUTED`
- source_security_finding: `NONE_CURRENTLY_ROUTED`

### PVC-13 — Scoring Models

- security_marker: `[SECURITY_HANDOFF -> CAPITAL-AI-FINTECH | VC-13]`
- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-13]`
- project_namespace: `PVC`
- project_stage: `PVC-13`
- target_project: `CAPITAL-AI-FINTECH`
- target_project_folder: `docs/projects/fintech`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: preserve model/registry integrity, controlled lifecycle state and least-privilege boundaries
- reason: model identity or lifecycle ambiguity could grant unintended productive scoring authority
- dependency: ADR-0087; `ScoringModelRegistry`; existing model tests
- required_evidence: registry uniqueness/lifecycle tests, challenger non-production negative tests, exact model/version lineage
- verification_gate: `CAPITAL-AI-SEC independent verification`
- status: `REFERRED_NOT_EXECUTED`
- source_security_finding: `NONE_CURRENTLY_ROUTED`

### PVC-14 — Scoring Orchestration

- security_marker: `[SECURITY_HANDOFF -> CAPITAL-AI-FINTECH | VC-14]`
- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-14]`
- project_namespace: `PVC`
- project_stage: `PVC-14`
- target_project: `CAPITAL-AI-FINTECH`
- target_project_folder: `docs/projects/fintech`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: preserve single-dispatcher/tool integrity and deny scoring bypass paths
- reason: alternate dispatch or untrusted tool selection could bypass governed model/evidence controls
- dependency: ADR-0087; `ScoringDispatcher`; registered executors
- required_evidence: dispatcher tests, unknown/ambiguous-model denial tests, no-bypass structural evidence
- verification_gate: `CAPITAL-AI-SEC independent verification`
- status: `REFERRED_NOT_EXECUTED`
- source_security_finding: `NONE_CURRENTLY_ROUTED`

### PVC-15 — Domain Analysis / Executor

- security_marker: `[SECURITY_HANDOFF -> CAPITAL-AI-FINTECH | VC-15]`
- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-15]`
- project_namespace: `PVC`
- project_stage: `PVC-15`
- target_project: `CAPITAL-AI-FINTECH`
- target_project_folder: `docs/projects/fintech`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: preserve provider/tool/domain execution boundaries and canonical executor contracts
- reason: provider-specific or tool-specific execution must not bypass DATA or create independent scoring authority
- dependency: DATA ingress/evidence/DQ; registered executor adapters; ProviderMatrix capability mapping
- required_evidence: executor contract tests, unsupported-scope denial, provider-bypass negative tests where applicable
- verification_gate: `CAPITAL-AI-SEC independent verification`
- status: `REFERRED_NOT_EXECUTED`
- source_security_finding: `NONE_CURRENTLY_ROUTED`

### PVC-16 — Canonical Scoring

- security_marker: `[SECURITY_HANDOFF -> CAPITAL-AI-FINTECH | VC-16]`
- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-16]`
- project_namespace: `PVC`
- project_stage: `PVC-16`
- target_project: `CAPITAL-AI-FINTECH`
- target_project_folder: `docs/projects/fintech`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: preserve CanonicalScoreResult integrity, lineage and fail-closed unavailable semantics
- reason: malformed, synthetic or lineage-free results could become trusted decision inputs
- dependency: `src/types/scoringIntegrity.ts`; dispatcher/model/executor lineage
- required_evidence: scoring-integrity/lineage tests and unavailable-result negative tests
- verification_gate: `CAPITAL-AI-SEC independent verification`
- status: `REFERRED_NOT_EXECUTED`
- source_security_finding: `NONE_CURRENTLY_ROUTED`

### PVC-17 — Ranking / Decision Support

- security_marker: `[SECURITY_HANDOFF -> CAPITAL-AI-FINTECH | VC-17]`
- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-17]`
- project_namespace: `PVC`
- project_stage: `PVC-17`
- target_project: `CAPITAL-AI-FINTECH`
- target_project_folder: `docs/projects/fintech`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: preserve protected decision-input integrity and fail-closed ranking admission
- reason: unverified score, comparability, governance or operations evidence must not influence productive ranking
- dependency: CanonicalScoreResult; ranking contracts/services; FE remains consumer only
- required_evidence: ranking/eligibility tests, missing-comparability/governance evidence negative tests, exact score/rank lineage
- verification_gate: `CAPITAL-AI-SEC independent verification`
- status: `REFERRED_NOT_EXECUTED`
- source_security_finding: `NONE_CURRENTLY_ROUTED`

## Conditional S1-R2-06 child-handoff rule

If OPS identifies a protected FINTECH capability during S1-R2-06 inventory:

1. map it to the exact FINTECH `PVC-12..17` stage;
2. use a FINTECH-owned work claim/branch;
3. change only FINTECH-owned implementation;
4. run directly relevant positive and negative Security tests;
5. bind evidence to exact candidate/runtime identity;
6. return evidence to CAPITAL-AI-SEC;
7. leave Security `VERIFIED/CLOSED` to independent Security review.

Until that condition occurs, no S1-R2-06 FINTECH remediation is claimed.

## Required return contract

For an actual implementation/evidence item, FINTECH returns:

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

Allowed FINTECH completion state is `IMPLEMENTED` or `EVIDENCE_READY`; Security verification remains external.