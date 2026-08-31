# CAPITAL-AI-GOV — Cross-Project Handoffs

**Source:** `CAPITAL-AI-GOV`  
**Rule:** foreign execution is referred, never locally completed.

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-CLIENT | VC-01]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-01`
- **task:** migrate project-owned unqualified `VC-01 Agent Client` labels in `docs/projects/agent-client/**` to `PVC-01` while preserving client contracts.
- **required_evidence:** current-main CLIENT branch, changed-label inventory, no behavior change.
- **status:** `REFERRED_NOT_EXECUTED`

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-02` plus `PVC-04/06/07/08/18`
- **task:** implement P2 under `docs/projects/operations/**`, reusing existing DevelopmentChain authorities and historical useful content.
- **required_evidence:** fresh-main OPS branch, DC migration matrix, preserved M0-M10 references, no second Release/EventMesh/Production chain.
- **status:** `REFERRED_NOT_EXECUTED`

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DOC | VC-03]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-03`
- **task:** establish Documentary project navigation and participate in any approved FVC migration while preserving historical evidence.
- **status:** `REFERRED_NOT_EXECUTED`

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-09..PVC-11`
- **task:** adopt PVC project labels/navigation and assess DATA technical consumers for any approved FVC migration.
- **status:** `REFERRED_NOT_EXECUTED`

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-12]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-12..PVC-17`
- **task:** adopt PVC project labels/navigation and lead productive SPT/Scoring/Ranking participation in any approved FVC migration.
- **required_evidence:** preserve `ScoringModelRegistry -> ScoringDispatcher -> Domain Executor -> CanonicalScoreResult` and targeted ranking tests.
- **status:** `REFERRED_NOT_EXECUTED`

## Cross-cutting Quality dependency

- **target_project:** `CAPITAL-AI-QM`
- **primary_pvc_ownership:** none
- **task:** align project-chain references and coordinate Quality projection/test migration if P3 is approved.
- **status:** `DEPENDENCY`

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-CLIENT | VC-01] — Admin Panel process graph

- **project_namespace:** `PVC`
- **project_stage:** `PVC-01`
- **target_project:** `CAPITAL-AI-CLIENT`
- **task:** implement the Admin Panel visual process/dependency graph using the GOV project/PVC/DevelopmentChain semantic projection; evaluate suitable maintained graph/flow libraries before custom rendering.
- **reason:** presentation/UI implementation is CLIENT scope; GOV owns only the semantic process/authority boundaries.
- **dependency:** `docs/projects/PROJECT_VALUE_CHAIN.md`, `docs/projects/PROJECT_EXECUTION_MODEL.md`, `ADMIN_PANEL_PROCESS_GRAPH_HANDOFF.md`.
- **required_evidence:** no client-side authority duplication; accessible interaction; dependency/status data source documented; state-of-the-art/open-source evaluation captured.
- **verification_gate:** CLIENT frontend architecture/tests and Governance semantic review.
- **status:** `REFERRED_NOT_EXECUTED`

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18] — Admin Panel operational state

- **project_namespace:** `PVC`
- **project_stage:** `PVC-18`
- **target_project:** `CAPITAL-AI-OPS`
- **task:** expose or map approved read-only operational/traceability state required by the Admin Panel process graph without turning EventMesh/Traceability into approval authority.
- **status:** `REFERRED_NOT_EXECUTED`

## Cross-cutting project navigation

`CAPITAL-AI-COMP`, `CAPITAL-AI-FE`, `CAPITAL-AI-SEO` and `CAPITAL-AI-SOCIAL` own no productive PVC stage. Their project navigation may converge on `docs/projects/<project>/` through their own owner-scoped migrations while normative/domain artifacts remain in canonical domain locations.
