# CAPITAL-AI-FINTECH — Cross-Project Dependencies

**Baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
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

## Upstream DATA — FIN-12 current return required

Current DATA-to-FINTECH evidence confirms that the validated exit exists and PVC-12 consumption belongs to FINTECH. The 2026-09-16 current-main re-correlation in `evidence/FIN_12_VALIDATED_FEATURE_BOUNDARY_RECORRELATION_2026-09-16.md` narrows the remaining dependency: the existing snapshot/history contracts are necessary but do not yet cover every productive champion feature input.

### PVC-09 — UAI / Data Ingestion

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09]`
- project_namespace: `PVC`
- project_stage: `PVC-09`
- target_project: `CAPITAL-AI-DATA`
- target_project_folder: `docs/projects/data/`
- primary_owner: `CAPITAL-AI-DATA`
- task: preserve the existing canonical ingress and add/return only the provider-neutral field/history capability needed to express all productive FINTECH feature inputs; no FINTECH-owned provider adapter or direct provider-schema bypass
- reason: productive crypto snapshot dimensions, traditional fundamentals and productive history consumers cannot be made fully validated by inventing normalization inside PVC-12
- dependency: existing UAI/provider authorities; ADR-0041 / ESS-0016
- required_evidence: exact input identity, provider provenance, correlation, contract validation and capability semantics for the returned fields/history
- verification_gate: DATA-owned validated contract on then-current main; FINTECH consumes accepted output only
- status: `RETURN_REQUIRED_FOR_FIN-12`

### PVC-10 — Evidence Management

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-10]`
- project_namespace: `PVC`
- project_stage: `PVC-10`
- target_project: `CAPITAL-AI-DATA`
- target_project_folder: `docs/projects/data/`
- primary_owner: `CAPITAL-AI-DATA`
- task: preserve evidence identity, field-level provenance and freshness for the additional productive crypto/traditional fields and validated history/value contracts supplied to FINTECH
- reason: scoring/feature engineering cannot infer or manufacture missing evidence
- dependency: existing Evidence contracts and provider data plane
- required_evidence: evidence IDs, timestamps, provider lineage, correlation and explicit missing/stale/conflicting disposition
- verification_gate: DATA evidence contract; no missing evidence promoted to numeric FINTECH feature input
- status: `RETURN_REQUIRED_FOR_FIN-12`

### PVC-11 — Data Quality

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-11]`
- project_namespace: `PVC`
- project_stage: `PVC-11`
- target_project: `CAPITAL-AI-DATA`
- target_project_folder: `docs/projects/data/`
- primary_owner: `CAPITAL-AI-DATA`
- task: extend/return canonical validated semantics so productive crypto market-cap/volume/supply fields, traditional fundamentals and productive history consumers are explicit; distinguish positive price-series validation from legitimate signed observations such as sovereign benchmark yields
- reason: the current positive-price history validation cannot safely represent valid negative government yields, while FINTECH must not weaken DATA DQ locally
- dependency: DATA DQ authority; current `ValidatedDataInput/1.0.0` and validated-history boundary
- required_evidence: fail-closed DQ status and negative tests for missing/stale/conflicting/invalid inputs; signed value semantics where the domain permits negative values
- verification_gate: no FINTECH feature/score path bypasses failed DQ and no legitimate signed yield is rejected merely by price-only semantics
- status: `RETURN_REQUIRED_FOR_FIN-12`

Required DATA return for FIN-12, without prescribing foreign implementation details:

1. canonical validated coverage for productive crypto snapshot dimensions used by `crypto-technical-features/0.7.0`, including market-cap/volume and supply fields;
2. canonical validated fundamentals coverage for the productive traditional stock fields used by `traditional-features/2.1.0`;
3. a canonical validated-history bridge or equivalent accepted DATA contract for productive crypto/traditional history consumers; and
4. explicit value/history semantics capable of preserving legitimate signed sovereign-yield observations.

No synthetic/default values, second provider plane or FINTECH-local DQ authority is permitted as a workaround.

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