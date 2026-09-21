# CAPITAL-AI-FINTECH — Cross-Project Dependencies

**Baseline:** `main@2c6b29102333baf86b3acf8f1c1012b0cc9ac9e6`  
**Project:** `CAPITAL-AI-FINTECH`  
**Canonical folder:** `docs/projects/fintech/`

Ownership is resolved only from `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Foreign implementation remains outside FINTECH execution authority; FINTECH does not mark foreign work `DONE`, Security `VERIFIED/CLOSED`, or Accepted Risk. The `primary_owner` field identifies productive PVC ownership and does not transfer Authority.

## Inbound OPS Security child handoffs

Merged OPS PR #694 completed `OPS-02-SEC-06` and routed concrete `S1-R2-06` child remediation to FINTECH.

### PVC-16 — canonical verified-screening alternate routes

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-16]`
- project_namespace: `PVC`
- project_stage: `PVC-16`
- target_project: `CAPITAL-AI-FINTECH`
- target_project_folder: `docs/projects/fintech/`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: make every productive canonical verified-score/context/batch path consume the accepted `verified_screening` entitlement/quota boundary without creating a second scoring or entitlement authority
- reason: canonical registry score routes required the accepted server-side entitlement boundary
- dependency: ADR-0034; existing ScoringModelRegistry/ScoringDispatcher/CanonicalScoreResult chain; server quota contract
- required_evidence: Free/Starter/Pro/Enterprise quota-positive cases plus browser-tier escalation, forged identity, missing/invalid identity where applicable, stale-entitlement and direct alternate-route DENY evidence
- verification_gate: CAPITAL-AI-SEC independent verification of returned S1-R2-06 boundary
- status: `IMPLEMENTED / EVIDENCE_READY / SECURITY_VERIFICATION_REQUESTED`

### PVC-15 — financial analysis entitlement boundary

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-15]`
- project_namespace: `PVC`
- project_stage: `PVC-15`
- target_project: `CAPITAL-AI-FINTECH`
- target_project_folder: `docs/projects/fintech/`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: define one authoritative entitlement boundary for Backtest and Monte Carlo; bind `full_ai_analysis` to an explicit productive financial-domain execution contract; preserve the existing Buffett server authority
- reason: S1-R2-06 confirmed Backtest and Monte Carlo lacked a paid server grant and `full_ai_analysis` lacked an explicit productive entitlement binding
- dependency: ADR-0034; DATA validated/history inputs where applicable; Frontend remains a consumer and must not invent entitlement semantics
- required_evidence: verified-principal/server-entitlement decision; Free/Starter DENY; forged/missing-bearer DENY; direct/automatic alternate-path DENY; explicit `full_ai_analysis` binding; fail-closed executor-unavailable behavior
- implementation: `server/middleware/paidAnalysisEntitlement.ts`; `server/quota.ts`; protected Backtest/Monte Carlo/full-AI consumers and routes
- return_evidence: `docs/projects/fintech/evidence/FIN_SEC_03_PAID_ANALYSIS_ENTITLEMENT_2026-09-15.md`
- merge_evidence: `PR #929`; merge SHA `103689c2f30536e573b7958f63b503ca428f69cf`
- verification_gate: CAPITAL-AI-SEC independent verification after FINTECH-owned implementation
- status: `IMPLEMENTED / EVIDENCE_READY / SECURITY_VERIFICATION_REQUESTED`

FINTECH does not set the parent Security finding to `VERIFIED` or `CLOSED`.

## Internal FINTECH PVC-09..11 → PVC-12 dependency

The former cross-project DATA return is retired. `CAPITAL-AI-FINTECH` owns `PVC-09..17`; provider/data ingress, evidence/provenance/freshness and Data Quality are internal upstream FINTECH stages for FIN-12.

### PVC-09 — UAI / Data Ingestion

- repository_marker: `[INTERNAL_FINTECH_DEPENDENCY | PVC-09 -> PVC-12]`
- project_stage: `PVC-09`
- owner: `CAPITAL-AI-FINTECH`
- canonical_project_folder: `docs/projects/fintech/`
- task: preserve the existing canonical ingress and provide the provider-neutral field/history capability needed by productive FINTECH feature inputs without creating a second provider plane
- dependency: existing UAI/provider authorities; ADR-0041 / ESS-0016
- exit_evidence: exact input identity, provider provenance, correlation, contract validation and capability semantics
- status: `INTERNAL_UPSTREAM_DEPENDENCY`

### PVC-10 — Evidence Management

- repository_marker: `[INTERNAL_FINTECH_DEPENDENCY | PVC-10 -> PVC-12]`
- project_stage: `PVC-10`
- owner: `CAPITAL-AI-FINTECH`
- canonical_project_folder: `docs/projects/fintech/`
- task: preserve evidence identity, field-level provenance and freshness for productive crypto/traditional fields and validated history/value contracts
- exit_evidence: evidence IDs, timestamps, provider lineage, correlation and explicit missing/stale/conflicting disposition
- status: `INTERNAL_UPSTREAM_DEPENDENCY`

### PVC-11 — Data Quality

- repository_marker: `[INTERNAL_FINTECH_DEPENDENCY | PVC-11 -> PVC-12]`
- project_stage: `PVC-11`
- owner: `CAPITAL-AI-FINTECH`
- canonical_project_folder: `docs/projects/fintech/`
- task: preserve fail-closed validated semantics for productive crypto fields, traditional fundamentals and history consumers, including explicit signed-value semantics where required
- exit_evidence: negative tests for missing/stale/conflicting/invalid inputs plus accepted signed-value semantics
- status: `INTERNAL_UPSTREAM_DEPENDENCY`

No synthetic/default values, second provider plane or parallel Data Quality authority is permitted. Historical DATA handoff evidence remains archival provenance only.

## Downstream OPS

### PVC-18 — EventMesh / Traceability

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]`
- project_namespace: `PVC`
- project_stage: `PVC-18`
- target_project: `CAPITAL-AI-OPS`
- target_project_folder: `docs/projects/operations/`
- primary_owner: `CAPITAL-AI-OPS`
- task: transport and retain FINTECH score/ranking traceability through existing EventMesh/Traceability contracts
- reason: transport/operations must remain separate from financial decision authority
- dependency: existing EventMesh, Traceability and Supervisor authorities; complete FIN-12/FIN-20 lineage
- required_evidence: correlation/result lineage references and runtime evidence where applicable
- verification_gate: OPS transport/operations validation
- status: `REFERRED_NOT_EXECUTED`

## Frontend consumer work — FIN-17 terminal

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FE | VC-17]`
- project_namespace: `PVC`
- project_stage: `PVC-17`
- target_project: `CAPITAL-AI-FE`
- target_project_folder: `docs/projects/frontend/`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: consume the canonical FINTECH backend rank/order result without browser-local score/rank/comparability/eligibility authority
- result: Human-merged PR #951 consumes backend ordering in `RankingBoard`; prerequisite FINTECH backend authority was Human-merged through PR #946
- merge_evidence: FINTECH PR #946 `c8a88afc7f9cfad367b592e9567654451f81e436`; FE PR #951 `3aa41faa2742dfc2601339b000e660f271380cf1`
- verification_gate: bounded FIN-17 authority split complete; retain drift watch
- status: `DONE_MAIN / TERMINAL`

## Quality

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-QM | VC-12]`
- project_namespace: `PVC`
- project_stage: `PVC-12..PVC-17`
- target_project: `CAPITAL-AI-QM`
- target_project_folder: `docs/projects/quality-management/`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: validate FINTECH structural/evidence contracts read-only across PVC-12..17 without acquiring financial decision authority
- reason: quality projection must observe current project routing and technical contracts without redefining them
- dependency: FINTECH project surface + existing Quality authority
- required_evidence: read-only structure/contract validation
- verification_gate: QM independent quality validation
- status: `REFERRED_NOT_EXECUTED`

## Security

Security requirements and return rules are maintained in `SECURITY_HANDOFFS.md`. `CAPITAL-AI-SEC` owns finding identity, independent verification and any `VERIFIED/CLOSED` decision. FINTECH owns only FINTECH-target implementation/evidence.

## Compliance

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-COMP | VC-12]`
- project_namespace: `PVC`
- project_stage: `PVC-12..PVC-17`
- target_project: `CAPITAL-AI-COMP`
- target_project_folder: `docs/projects/compliance/`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: assess applicable compliance requirements across FINTECH model/score/ranking evidence without executing FINTECH remediation
- reason: compliance assessment is cross-cutting and non-authorizing
- dependency: model, feature, scoring and ranking lineage supplied by FINTECH
- required_evidence: IDs/versions/contracts/lineage and relevant implementation evidence
- verification_gate: CAPITAL-AI-COMP assessment; legal/Owner authority where applicable
- status: `REFERRED_NOT_EXECUTED`

## Cross-domain rule

If a FINTECH task discovers productive work owned by another Primary Owner, FINTECH stops local implementation for that foreign portion. Ownership is resolved from the folder-to-PVC mapping. No routing marker transfers underlying Authority.

## Landing-first shared program dependency

- correlation_id: `FIN-LF-01-20260921`
- source_project: `CAPITAL-AI-FINTECH`
- target_project: `CAPITAL-AI-FE`
- source_phase: `FIN-LF-01 / PREPARATION_ONLY`
- completed_scope: minimal FINTECH landing scoring consumer contract and authority boundaries documented; no productive integration activated
- remaining_scope: FE `LF-01_STATIC_VISUAL_LANDING_PASS`, then LF-02/LF-03 and dependency-ready LF-04 consumer integration
- dependency: `LF-01_STATIC_VISUAL_LANDING_PASS`
- evidence_reference: FE PR #1195 is open at correlation time and its exact-head build-and-test is not PASS; OPS PR #1200 is a separate owner-correct routing/lifecycle writer
- exit_gate: FINTECH productive landing scoring remains blocked until the shared gate and later SEC/QM prerequisites are evidenced
- continuation_condition: fresh CURRENT_MAIN correlation proves LF-01 PASS and no conflicting writer/authority overlap

This dependency does not transfer Frontend ownership to FINTECH or financial scoring authority to Frontend. `ScoringDispatcher` remains the sole productive scoring execution authority; the landing layer is a consumer only.
