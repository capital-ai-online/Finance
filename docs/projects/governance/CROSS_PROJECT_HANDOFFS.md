# CAPITAL-AI-GOV — Cross-Project Handoffs

**Source:** `CAPITAL-AI-GOV`  
**Rule:** foreign execution is referred, never locally completed. Every handoff carries a target roadmap reference even when the target project must create that canonical roadmap as part of its migration.

## Inbound Security referral — PVC-05 Platform Director

### [SECURITY_HANDOFF -> CAPITAL-AI-GOV | VC-05]
### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05]

- **source_project:** `CAPITAL-AI-SEC`
- **source_pr:** `#631`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **target_project:** `CAPITAL-AI-GOV`
- **target_roadmap_reference:** `docs/projects/governance/ROADMAP.md`
- **security_finding:** `MFA/AAL lifecycle drift`
- **task:** correlate the Governance-side MFA/AAL lifecycle against current Identity/Owner gates and produce only PVC-05-owned remediation/evidence.
- **reason:** identity-assurance lifecycle drift can create ambiguity between Governance approval state and Security assurance expectations.
- **dependency:** `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md`, current `/AGENTS.md`, Authority Registry, Control Catalog and accepted ADR/ESS identity/approval contracts.
- **required_evidence:** exact-candidate changed-file set, Authority/ADR/ESS/Control correlation, targeted positive and negative lifecycle/gate evidence, residual-risk and unresolved-dependency record.
- **verification_gate:** `CAPITAL-AI-SEC independent verification`.
- **status:** `REFERRED_NOT_EXECUTED`
- **detail:** `SECURITY_HANDOFF_CAPITAL_AI_SEC.md`

CAPITAL-AI-GOV may later return `IMPLEMENTED` or `EVIDENCE_READY` for its own scope. It must not mark the Security finding `VERIFIED` or `CLOSED`; that decision remains with CAPITAL-AI-SEC after independent review.

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-CLIENT | VC-01]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-01`
- **target_project:** `CAPITAL-AI-CLIENT`
- **target_roadmap_reference:** `docs/projects/agent-client/ROADMAP.md`
- **task:** migrate project-owned unqualified `VC-01 Agent Client` labels in `docs/projects/agent-client/**` to `PVC-01` while preserving client contracts.
- **required_evidence:** current-main CLIENT branch, changed-label inventory, no behavior change.
- **verification_gate:** CLIENT project/document validation.
- **status:** `REFERRED_NOT_EXECUTED`

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-02` plus `PVC-04/06/07/08/18`
- **target_project:** `CAPITAL-AI-OPS`
- **target_roadmap_reference:** `docs/projects/operations/ROADMAP.md` (target canonical project roadmap to create/refresh in OPS scope)
- **task:** implement P2 under `docs/projects/operations/**`, reusing existing DevelopmentChain authorities and historical useful content.
- **required_evidence:** fresh-main OPS branch, DC migration matrix, preserved M0-M10 references, no second Release/EventMesh/Production chain.
- **verification_gate:** OPS + repository governance/document checks.
- **status:** `REFERRED_NOT_EXECUTED`

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DOC | VC-03]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-03`
- **target_project:** `CAPITAL-AI-DOC`
- **target_project_folder:** `docs/projects/documentary/`
- **branch_project_slug:** `documentary`
- **primary_owner:** `CAPITAL-AI-DOC`
- **target_roadmap_reference:** `docs/projects/documentary/ROADMAP.md` (target project roadmap; materialization remains DOC-owned)
- **task:** resume Documentary project migration and PR preparation on a fresh current-main branch, selectively reusing the previously blocked DOC diff only after fresh correlation.
- **reason:** PVC-05 Governance correlation resolves the previously ambiguous CAPITAL-AI-DOC organizational project folder without transferring Documentary implementation ownership to GOV.
- **dependency:** first Human-merged `main` snapshot containing the canonical `CAPITAL-AI-DOC -> docs/projects/documentary/` mapping in `docs/projects/README.md`, plus the then-current `/AGENTS.md`.
- **required_evidence:** fresh current main, compliant DOC branch using the canonical `documentary` project-folder slug, exact candidate diff, open-PR/claim/writer/overlap correlation, and Documentary/Vocabulary validation.
- **verification_gate:** CAPITAL-AI-DOC project validation and normal repository PR gates.
- **status:** `REFERRED_NOT_EXECUTED`

The `documentary` slug is valid only after the GOV correlation is Human-merged into `main`; it is derived from the canonical folder basename, not guessed from `CAPITAL-AI-DOC`. CAPITAL-AI-GOV does not create `docs/projects/documentary/**` or execute the Documentary migration.

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-09..PVC-11`
- **target_project:** `CAPITAL-AI-DATA`
- **target_roadmap_reference:** `docs/projects/data/ROADMAP.md` (target project roadmap)
- **task:** adopt PVC project labels/navigation and assess DATA technical consumers for any approved FVC migration.
- **verification_gate:** DATA contracts/tests plus cross-project boundary review.
- **status:** `REFERRED_NOT_EXECUTED`

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09] — stale CAPITAL-AI-DOC folder projection

- **project_namespace:** `PVC`
- **project_stage:** `PVC-09`
- **target_project:** `CAPITAL-AI-DATA`
- **target_project_folder:** `docs/projects/data/`
- **primary_owner:** `CAPITAL-AI-DATA`
- **target_roadmap_reference:** `docs/projects/data/ROADMAP.md`
- **task:** after the GOV correlation is Human-merged, update the DATA-owned `docs/projects/data/HANDOFFS.md` CAPITAL-AI-DOC routing projection from `REQUIRES_CORRELATION` to the merged canonical `docs/projects/documentary/` folder and remove only the now-stale ambiguity wording.
- **reason:** the stale reference is owned by CAPITAL-AI-DATA and must not be silently mutated from a CAPITAL-AI-GOV branch.
- **dependency:** first Human-merged `main` snapshot containing the canonical Documentary project-folder mapping, plus current `/AGENTS.md` and `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`.
- **required_evidence:** fresh current main, DATA-owned exact diff, no competing CAPITAL-AI-DOC folder mapping, preserved PVC/technical-VC namespace separation, and normal DATA project/document validation.
- **verification_gate:** CAPITAL-AI-DATA project validation and normal repository PR gates.
- **status:** `REFERRED_NOT_EXECUTED`

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-12]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-12..PVC-17`
- **target_project:** `CAPITAL-AI-FINTECH`
- **target_roadmap_reference:** `docs/projects/fintech/ROADMAP.md` (target project roadmap) + `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` for the technical financial chain
- **task:** adopt PVC project labels/navigation and lead productive SPT/Scoring/Ranking participation in any approved FVC migration.
- **required_evidence:** preserve `ScoringModelRegistry -> ScoringDispatcher -> Domain Executor -> CanonicalScoreResult` and targeted ranking tests.
- **verification_gate:** FINTECH scoring/ranking contract tests and repository governance checks.
- **status:** `REFERRED_NOT_EXECUTED`

## Cross-cutting Quality dependency

- **target_project:** `CAPITAL-AI-QM`
- **target_roadmap_reference:** `docs/projects/quality-management/ROADMAP.md` (target project roadmap)
- **primary_pvc_ownership:** none
- **task:** align project-chain references and coordinate Quality projection/test migration if P3 is approved.
- **status:** `DEPENDENCY`

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-CLIENT | VC-01] — Admin Panel process graph

- **project_namespace:** `PVC`
- **project_stage:** `PVC-01`
- **target_project:** `CAPITAL-AI-CLIENT`
- **target_roadmap_reference:** `docs/projects/agent-client/ROADMAP.md`
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
- **target_roadmap_reference:** `docs/projects/operations/ROADMAP.md` (target canonical project roadmap)
- **task:** expose or map approved read-only operational/traceability state required by the Admin Panel process graph without turning EventMesh/Traceability into approval authority.
- **verification_gate:** OPS traceability/operational contract validation plus Governance semantic review.
- **status:** `REFERRED_NOT_EXECUTED`

## Cross-cutting project navigation

`CAPITAL-AI-COMP`, `CAPITAL-AI-FE`, `CAPITAL-AI-SEO` and `CAPITAL-AI-SOCIAL` own no productive PVC stage. Their project navigation may converge on `docs/projects/<project>/` through their own owner-scoped migrations while normative/domain artifacts remain in canonical domain locations.
