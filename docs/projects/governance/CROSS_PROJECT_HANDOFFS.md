# CAPITAL-AI-GOV — Cross-Project Handoff Register

**Source project:** `CAPITAL-AI-GOV`  
**Contract:** `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`  
**Correlation baseline:** `main@22c4b53f83313eb03090ef0867f8f793b98e5fcc`  
**Rule:** foreign execution is routed, never completed by GOV. Project-folder routing is organizational and non-authorizing.

Every current record below carries the structured routing fields required by the central contract. Where a cross-cutting target owns no productive PVC stage, `PVC-05` is used only as the Governance routing/correlation context and that limitation is stated explicitly.

## 1. Inbound Security — MFA/AAL lifecycle drift

### [SECURITY_HANDOFF -> CAPITAL-AI-GOV | VC-05]
### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05]

- **source_project:** `CAPITAL-AI-SEC`
- **source_pr:** `#631`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **target_project:** `CAPITAL-AI-GOV`
- **target_project_folder:** `docs/projects/governance/`
- **primary_owner:** `CAPITAL-AI-GOV`
- **target_roadmap_reference:** `docs/projects/governance/ROADMAP.md`
- **task:** correlate the Governance-side MFA/AAL lifecycle against current Identity/Owner gates and produce only PVC-05-owned remediation/evidence.
- **reason:** identity-assurance lifecycle drift can create ambiguity between Governance approval state and Security assurance expectations.
- **dependency:** current `/AGENTS.md`, Security traceability, Authority Registry, Control Catalog and accepted ADR/ESS identity/approval contracts.
- **required_evidence:** exact-candidate changed-file set, Authority/ADR/ESS/Control correlation, positive/negative lifecycle evidence, residual risk and unresolved dependencies.
- **verification_gate:** `CAPITAL-AI-SEC` independent verification.
- **status:** `REFERRED_NOT_EXECUTED`
- **detail:** `SECURITY_HANDOFF_CAPITAL_AI_SEC.md`

GOV may return `IMPLEMENTED` or `EVIDENCE_READY` for its own scope. Security `VERIFIED/CLOSED` remains CAPITAL-AI-SEC-only.

## 2. CLIENT — project-label migration

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-CLIENT | VC-01]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-01`
- **target_project:** `CAPITAL-AI-CLIENT`
- **target_project_folder:** `docs/projects/agent-client/`
- **primary_owner:** `CAPITAL-AI-CLIENT`
- **target_roadmap_reference:** `docs/projects/agent-client/ROADMAP.md`
- **task:** migrate project-owned unqualified `VC-01 Agent Client` labels to `PVC-01` without changing client behavior/contracts.
- **reason:** organizational project routing must use the qualified `PVC-*` namespace while technical financial `VC-*` semantics remain unchanged.
- **dependency:** current `/AGENTS.md`, `PROJECT_VALUE_CHAIN.md` and current CLIENT project surface.
- **required_evidence:** current-main CLIENT branch, changed-label inventory and no behavior change.
- **verification_gate:** CLIENT project/document validation.
- **status:** `REFERRED_NOT_EXECUTED`

## 3. OPS — DevelopmentChain project integration

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-02`
- **related_project_stages:** `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`
- **target_project:** `CAPITAL-AI-OPS`
- **target_project_folder:** `docs/projects/operations/`
- **primary_owner:** `CAPITAL-AI-OPS`
- **target_roadmap_reference:** `docs/projects/operations/ROADMAP.md`
- **task:** bind the recurring DevelopmentChain lifecycle to OPS organizational execution without replacing Governance policy authority or existing Supervisor/Version/Release/Production/EventMesh implementations.
- **reason:** controlled delivery execution is OPS scope; Governance retains the control/policy boundary.
- **dependency:** `PROJECT_EXECUTION_MODEL.md`, DevelopmentChain authorities and existing OPS runtime components.
- **required_evidence:** OPS project surface, migration matrix, preserved M0-M10 references and no second Release/EventMesh/Production chain.
- **verification_gate:** OPS + repository governance/document checks.
- **status:** `REFERRED`
- **return_evidence:** `docs/projects/operations/**` is present on current main; subsequent OPS technical/security remediation remains separately scoped.

## 4. Documentary — canonical project surface

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DOC | VC-03]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-03`
- **target_project:** `CAPITAL-AI-DOC`
- **target_project_folder:** `docs/projects/documentary/`
- **branch_project_slug:** `documentary`
- **primary_owner:** `CAPITAL-AI-DOC`
- **target_roadmap_reference:** `docs/projects/documentary/ROADMAP.md`
- **task:** maintain the Documentary project surface using the existing Documentary runtime/architecture instead of creating a second implementation.
- **reason:** Governance resolved the organizational Documentary folder without transferring Documentary implementation ownership to GOV.
- **dependency:** current `/AGENTS.md`, `docs/projects/README.md`, Documentary Authorities/registries/runtime and current open-PR/claim/writer state.
- **required_evidence:** owner-scoped Documentary project navigation, Documentary/Vocabulary validation and no foreign productive implementation.
- **verification_gate:** CAPITAL-AI-DOC project validation and normal repository PR gates.
- **status:** `REFERRED`
- **return_evidence:** PR `#645` merged `docs/projects/documentary/README.md` and `ROADMAP.md` into `main@22c4b53f83313eb03090ef0867f8f793b98e5fcc`; Documentary is no longer an open project-folder materialization gap.

## 5. DATA — project navigation / PVC adoption

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-09`
- **related_project_stages:** `PVC-10`, `PVC-11`
- **target_project:** `CAPITAL-AI-DATA`
- **target_project_folder:** `docs/projects/data/`
- **primary_owner:** `CAPITAL-AI-DATA`
- **target_roadmap_reference:** `docs/projects/data/ROADMAP.md`
- **task:** maintain DATA project navigation/PVC labels and participate owner-scoped in any separately approved FVC migration.
- **reason:** DATA owns ingestion/evidence/DQ project execution while the technical financial namespace remains separate.
- **dependency:** current DATA contracts, `PROJECT_VALUE_CHAIN.md` and technical financial-chain authorities.
- **required_evidence:** DATA project surface, contract validation and cross-project boundary review.
- **verification_gate:** DATA contracts/tests plus boundary validation.
- **status:** `REFERRED`
- **return_evidence:** `docs/projects/data/**` is present on current main and uses the qualified PVC model.

## 6. DATA — Documentary target-folder synchronization

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-09`
- **target_project:** `CAPITAL-AI-DATA`
- **target_project_folder:** `docs/projects/data/`
- **primary_owner:** `CAPITAL-AI-DATA`
- **target_roadmap_reference:** `docs/projects/data/ROADMAP.md`
- **task:** keep DATA-owned Documentary routing aligned to `docs/projects/documentary/`.
- **reason:** DATA owns its handoff record; GOV must not mutate DATA-owned routing files from a GOV branch.
- **dependency:** current `/AGENTS.md`, `docs/projects/README.md` and the central handoff contract.
- **required_evidence:** exact DATA-owned diff, no competing Documentary mapping and preserved PVC/technical-VC separation.
- **verification_gate:** CAPITAL-AI-DATA project validation.
- **status:** `REFERRED`
- **return_evidence:** DATA PR `#644` is merged; `docs/projects/data/HANDOFFS.md` points to `docs/projects/documentary/`.

## 7. FINTECH — project navigation / PVC adoption

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-12]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-12`
- **related_project_stages:** `PVC-13`, `PVC-14`, `PVC-15`, `PVC-16`, `PVC-17`
- **target_project:** `CAPITAL-AI-FINTECH`
- **target_project_folder:** `docs/projects/fintech/`
- **primary_owner:** `CAPITAL-AI-FINTECH`
- **target_roadmap_reference:** `docs/projects/fintech/ROADMAP.md`
- **technical_roadmap_reference:** `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md`
- **task:** maintain FINTECH PVC navigation and lead productive scoring/ranking participation in any separately approved FVC migration.
- **reason:** FINTECH owns PVC-12..17 while the current technical SPT chain retains separate authority/identifiers.
- **dependency:** current scoring/model/ranking contracts plus DATA/OPS boundaries.
- **required_evidence:** preserve `ScoringModelRegistry -> ScoringDispatcher -> Domain Executor -> CanonicalScoreResult` and targeted ranking tests.
- **verification_gate:** FINTECH scoring/ranking contract tests and repository governance checks.
- **status:** `REFERRED`
- **return_evidence:** `docs/projects/fintech/**` is present on current main and records the qualified PVC model.

## 8. Quality — cross-cutting dependency

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-QM | VC-05]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **routing_context:** Governance project-routing / quality coordination only; QM owns no productive PVC through this record.
- **target_project:** `CAPITAL-AI-QM`
- **target_project_folder:** `docs/projects/quality-management/`
- **primary_owner:** `CAPITAL-AI-GOV`
- **target_execution_owner:** `CAPITAL-AI-QM`
- **target_roadmap_reference:** `docs/projects/quality-management/ROADMAP.md`
- **task:** align project-chain references and coordinate independent Quality projection/test migration if P3 is approved.
- **reason:** Quality is a cross-cutting assessment project, not a productive PVC stage.
- **dependency:** current project/PVC model and applicable Quality authority.
- **required_evidence:** read-only project/contract assessment and no foreign implementation.
- **verification_gate:** QM independent Quality validation.
- **status:** `DEPENDENCY`

## 9. Admin Panel — CLIENT process graph

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-CLIENT | VC-01]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-01`
- **target_project:** `CAPITAL-AI-CLIENT`
- **target_project_folder:** `docs/projects/agent-client/`
- **primary_owner:** `CAPITAL-AI-CLIENT`
- **target_roadmap_reference:** `docs/projects/agent-client/ROADMAP.md`
- **task:** implement the Admin Panel process/dependency graph using the GOV PVC/DevelopmentChain semantic projection and evaluate maintained graph/flow libraries before custom rendering.
- **reason:** UI/presentation implementation is CLIENT scope; GOV owns semantic process/authority boundaries only.
- **dependency:** `PROJECT_VALUE_CHAIN.md`, `PROJECT_EXECUTION_MODEL.md`, `ADMIN_PANEL_PROCESS_GRAPH_HANDOFF.md`.
- **required_evidence:** no client-side authority duplication, accessible interaction, documented dependency/status source and state-of-the-art/open-source evaluation.
- **verification_gate:** CLIENT frontend architecture/tests plus Governance semantic review.
- **status:** `REFERRED_NOT_EXECUTED`

## 10. Admin Panel — OPS operational state

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-18`
- **target_project:** `CAPITAL-AI-OPS`
- **target_project_folder:** `docs/projects/operations/`
- **primary_owner:** `CAPITAL-AI-OPS`
- **target_roadmap_reference:** `docs/projects/operations/ROADMAP.md`
- **task:** expose/map approved read-only operational/traceability state for the Admin Panel without making EventMesh/Traceability an approval authority.
- **reason:** operational state and EventMesh/Traceability execution are OPS-owned while the Admin Panel is a consumer.
- **dependency:** existing OPS EventMesh/Traceability contracts and the GOV semantic graph handoff.
- **required_evidence:** read-only state contract, trace identity preservation and no decision authority in EventMesh.
- **verification_gate:** OPS operational/traceability validation plus Governance semantic review.
- **status:** `REFERRED_NOT_EXECUTED`

# Cross-cutting project-navigation migrations

The following five records resolve previously missing organizational project-folder identities. `PVC-05` is the Governance routing context only; none of the target projects acquires productive PVC ownership from these records.

## 11. Security project navigation

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-SEC | VC-05]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **routing_context:** project-folder correlation only; target owns no productive PVC through this record.
- **target_project:** `CAPITAL-AI-SEC`
- **target_project_folder:** `docs/projects/security/`
- **branch_project_slug:** `security`
- **primary_owner:** `CAPITAL-AI-GOV`
- **target_execution_owner:** `CAPITAL-AI-SEC`
- **target_roadmap_reference:** `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`
- **task:** materialize a thin Security project navigation surface referencing the existing Security runtime, roadmap, findings, tests and traceability; terminalize stale merged SEC writer metadata in SEC-owned scope.
- **reason:** Security is implemented and already uses `projectFolder: security` in merged repository work-claim evidence, but no `docs/projects/security/` navigation exists; the stale active SEC claim is a writer-integrity blocker for new SEC protected work.
- **dependency:** first Human-merged main containing this folder mapping, current `/AGENTS.md`, Security roadmap/traceability and `.ai/work-claims/CAPITAL-AI-SEC-PVC-HANDOFF-CORRELATION-2026-08-31.json`.
- **required_evidence:** fresh-main SEC branch using slug `security`, stale-claim terminalization preserving PR #631 evidence, README/roadmap/dependency/evidence navigation and no duplicate Security/Governance authority.
- **verification_gate:** SEC project/document validation + writer/claim integrity + normal repository PR gates.
- **status:** `REFERRED_NOT_EXECUTED`

## 12. Compliance project navigation

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-COMP | VC-05]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **routing_context:** project-folder correlation only; target owns no productive PVC through this record.
- **target_project:** `CAPITAL-AI-COMP`
- **target_project_folder:** `docs/projects/compliance/`
- **branch_project_slug:** `compliance`
- **primary_owner:** `CAPITAL-AI-GOV`
- **target_execution_owner:** `CAPITAL-AI-COMP`
- **target_roadmap_reference:** `docs/compliance/CAPITAL-AI-COMP/CAPITAL_AI_COMPLIANCE_ROADMAP.md`
- **task:** materialize `docs/projects/compliance/` as a non-authorizing project entrypoint referencing the existing Compliance package; do not move normative/legal artifacts solely for symmetry.
- **reason:** the Compliance project/domain package is already implemented but lacks the repository-standard organizational project navigation.
- **dependency:** first Human-merged main containing this mapping, current `/AGENTS.md`, current Compliance package and applicable legal/ADR/ESS authorities.
- **required_evidence:** fresh-main COMP branch using slug `compliance`, README/roadmap/dependencies/evidence navigation, no productive PVC acquisition and no duplicate Compliance authority.
- **verification_gate:** COMP project/document validation plus normal repository PR gates.
- **status:** `REFERRED_NOT_EXECUTED`
- **downstream_return:** after materialization, CAPITAL-AI-FINTECH must owner-scope any change of its existing COMP target from the domain path to the canonical project navigation while keeping the domain path as evidence/reference.

## 13. Frontend project navigation

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FE | VC-05]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **routing_context:** project-folder correlation only; target owns no productive PVC through this record.
- **target_project:** `CAPITAL-AI-FE`
- **target_project_folder:** `docs/projects/frontend/`
- **branch_project_slug:** `frontend`
- **primary_owner:** `CAPITAL-AI-GOV`
- **target_execution_owner:** `CAPITAL-AI-FE`
- **target_roadmap_reference:** `docs/frontend/FRONTEND_ROADMAP.md`
- **technical_architecture_reference:** `docs/frontend/FRONTEND_ARCH.md`
- **task:** materialize `docs/projects/frontend/` as the organizational Frontend entrypoint while preserving `docs/frontend/**` and runtime paths as the technical Frontend architecture; do not acquire FINTECH PVC-17 ranking authority.
- **reason:** Frontend is implemented and already receives a FINTECH consumer handoff but lacks the standard project navigation layer.
- **dependency:** first Human-merged main containing this mapping, current `/AGENTS.md`, Frontend architecture/roadmap, FINTECH ranking contracts and existing FE handoff.
- **required_evidence:** fresh-main FE branch using slug `frontend`, project navigation, explicit no-ranking-authority boundary and no runtime relocation solely for symmetry.
- **verification_gate:** FE project/frontend architecture validation plus normal repository PR gates.
- **status:** `REFERRED_NOT_EXECUTED`
- **downstream_return:** after materialization, CAPITAL-AI-FINTECH must owner-scope its current FE target from `docs/frontend` to `docs/projects/frontend/` while retaining `docs/frontend` as the technical architecture reference.

## 14. SEO project navigation

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-SEO | VC-05]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **routing_context:** project-folder correlation only; target owns no productive PVC through this record.
- **target_project:** `CAPITAL-AI-SEO`
- **target_project_folder:** `docs/projects/seo/`
- **branch_project_slug:** `seo`
- **primary_owner:** `CAPITAL-AI-GOV`
- **target_execution_owner:** `CAPITAL-AI-SEO`
- **target_roadmap_reference:** `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md`
- **task:** materialize a thin `docs/projects/seo/` project entrypoint referencing the single canonical SEO/Google-Marketing roadmap and existing `docs/seo/**` evidence/runtime documentation without duplicating SEO truth.
- **reason:** SEO is implemented and has a canonical consolidated roadmap but lacks repository-standard project navigation.
- **dependency:** first Human-merged main containing this mapping, current `/AGENTS.md`, accepted SEO ADRs and the consolidated SEO roadmap.
- **required_evidence:** fresh-main SEO branch using slug `seo`, single-roadmap reference, project dependencies/evidence navigation and no implicit productive PVC/second SEO architecture.
- **verification_gate:** SEO project/document validation plus normal repository PR gates.
- **status:** `REFERRED_NOT_EXECUTED`

## 15. Social project navigation

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-SOCIAL | VC-05]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **routing_context:** project-folder correlation only; target owns no productive PVC through this record.
- **target_project:** `CAPITAL-AI-SOCIAL`
- **target_project_folder:** `docs/projects/social-media/`
- **branch_project_slug:** `social-media`
- **primary_owner:** `CAPITAL-AI-GOV`
- **target_execution_owner:** `CAPITAL-AI-SOCIAL`
- **target_roadmap_reference:** `docs/social-media/CAPITAL-AI-SOCIAL/ROADMAP.md`
- **task:** materialize `docs/projects/social-media/` as the organizational Social entrypoint, reference the existing Social domain package and replace Social-owned `REQUIRES_CORRELATION` folder metadata only after this Governance mapping is Human-merged.
- **reason:** Social is implemented and explicitly fail-closed on unresolved project-folder identity; Governance resolves that identity without granting publication or productive PVC authority.
- **dependency:** first Human-merged main containing this mapping, current `/AGENTS.md`, current Social roadmap/mappings/handoffs and OPS/SEC/COMP/DOC/SEO boundaries.
- **required_evidence:** fresh-main Social branch using slug `social-media`, owner-scoped removal of stale `REQUIRES_CORRELATION`, project navigation, no provider/publication authority expansion and no implicit `PVC-19`.
- **verification_gate:** SOCIAL project/document validation plus normal repository PR gates.
- **status:** `REFERRED_NOT_EXECUTED`

## Invariant

`CAPITAL-AI-QM`, `CAPITAL-AI-SEC`, `CAPITAL-AI-COMP`, `CAPITAL-AI-FE`, `CAPITAL-AI-SEO` and `CAPITAL-AI-SOCIAL` remain cross-cutting and acquire no productive PVC stage through project-folder routing. Existing canonical runtime, normative, legal, architecture, roadmap and evidence artifacts remain in their delegated domain locations and are referenced rather than duplicated or moved solely for structural symmetry.
