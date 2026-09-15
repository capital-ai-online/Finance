# CAPITAL-AI-FINTECH — Cross-Project Dependencies

**Baseline:** `main@8f11a360ce598100396562ad0eced04ca13b7372`  
**Project:** `CAPITAL-AI-FINTECH`  
**Canonical folder:** `docs/projects/fintech/`

Ownership is resolved only from `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Foreign implementation remains `REFERRED_NOT_EXECUTED` or another permitted external state; FINTECH does not mark foreign work `DONE`, Security `VERIFIED/CLOSED`, or Accepted Risk. The `primary_owner` field identifies productive PVC ownership and does not transfer Authority.

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
- verification_gate: CAPITAL-AI-SEC independent verification after FINTECH-owned implementation
- status: `IMPLEMENTED / EVIDENCE_READY / SECURITY_VERIFICATION_REQUESTED`

FINTECH does not set the parent Security finding to `VERIFIED` or `CLOSED`.

## Upstream DATA

### PVC-09 — UAI / Data Ingestion

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09]`
- project_namespace: `PVC`
- project_stage: `PVC-09`
- target_project: `CAPITAL-AI-DATA`
- target_project_folder: `docs/projects/data/`
- primary_owner: `CAPITAL-AI-DATA`
- task: provide canonical asset identity and validated ingress required by FINTECH feature contracts
- reason: provider-specific ingress must not become FINTECH-owned bypass logic
- dependency: existing UAI/provider authorities
- required_evidence: exact input identity, provider provenance and contract validation
- verification_gate: DATA-owned input contract; FINTECH consumes only accepted output
- status: `REFERRED_NOT_EXECUTED`

### PVC-10 — Evidence Management

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-10]`
- project_namespace: `PVC`
- project_stage: `PVC-10`
- target_project: `CAPITAL-AI-DATA`
- target_project_folder: `docs/projects/data/`
- primary_owner: `CAPITAL-AI-DATA`
- task: preserve evidence identity, provenance and freshness supplied to scoring
- reason: scoring cannot infer or manufacture missing evidence
- dependency: existing Evidence contracts and provider data plane
- required_evidence: evidence IDs, timestamps and provider lineage
- verification_gate: DATA evidence contract
- status: `REFERRED_NOT_EXECUTED`

### PVC-11 — Data Quality

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-11]`
- project_namespace: `PVC`
- project_stage: `PVC-11`
- target_project: `CAPITAL-AI-DATA`
- target_project_folder: `docs/projects/data/`
- primary_owner: `CAPITAL-AI-DATA`
- task: supply explicit DQ result/gate before FINTECH feature/scoring execution
- reason: missing/failed DQ must remain fail-closed
- dependency: DATA DQ authority
- required_evidence: DQ status and negative evidence for failed/insufficient inputs
- verification_gate: no FINTECH score path may bypass failed DQ
- status: `REFERRED_NOT_EXECUTED`

Current DATA-to-FINTECH handoff evidence confirms `ValidatedDataInput/1.0.0` exists and PVC-12 consumption belongs to FINTECH. This makes FIN-12 implementable, but does not move DATA ownership into FINTECH.

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
- dependency: existing EventMesh, Traceability and Supervisor authorities
- required_evidence: correlation/result lineage references and runtime evidence where applicable
- verification_gate: OPS transport/operations validation
- status: `REFERRED_NOT_EXECUTED`

## Frontend consumer work

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FE | VC-17]`
- project_namespace: `PVC`
- project_stage: `PVC-17`
- target_project: `CAPITAL-AI-FE`
- target_project_folder: `docs/projects/frontend/`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: remove browser-owned Top/Worst business ordering once FINTECH exposes the canonical rank/order result
- reason: FE is a presentation consumer and must not become a second productive Ranking authority
- dependency: FINTECH FIN-17 result contract/endpoint first
- required_evidence: FE consumes backend ordering; no local score/rank/comparability/eligibility calculation
- verification_gate: FINTECH contract compatibility plus FE project validation
- status: `REFERRED_NOT_EXECUTED`

Current-main recorrelation after FIN-SEC-03 makes `FIN-17` the single next FINTECH P1 slice because `RankingBoard` still performs browser-local READY-score ordering while a backend `CrossAssetRanking` implementation already exists.

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

The QM project surface is present on current `main`; it is no longer treated as an unmaterialized migration gap.

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
