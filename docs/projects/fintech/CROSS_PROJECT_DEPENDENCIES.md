# CAPITAL-AI-FINTECH — Cross-Project Dependencies

Baseline: `main@6b1e7e5234604641449f304b5b251bd74151ddab`

All records use `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`. Foreign implementation remains `REFERRED_NOT_EXECUTED` or another allowed external state; FINTECH does not mark foreign work DONE/VERIFIED/CLOSED. The `primary_owner` field names the productive PVC owner and does not imply that every cross-cutting target project owns that PVC stage.

## Upstream DATA

### PVC-09 — UAI / Data Ingestion

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09]`
- project_namespace: `PVC`
- project_stage: `PVC-09`
- target_project: `CAPITAL-AI-DATA`
- target_project_folder: `docs/projects/data`
- primary_owner: `CAPITAL-AI-DATA`
- task: provide canonical asset identity / validated ingress required by FINTECH feature contracts
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
- target_project_folder: `docs/projects/data`
- primary_owner: `CAPITAL-AI-DATA`
- task: preserve evidence identity, provenance and freshness supplied to scoring
- reason: scoring cannot infer or manufacture missing evidence
- dependency: existing Evidence contracts and provider data plane
- required_evidence: evidence IDs, timestamps, provider lineage
- verification_gate: DATA evidence contract
- status: `REFERRED_NOT_EXECUTED`

### PVC-11 — Data Quality

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-11]`
- project_namespace: `PVC`
- project_stage: `PVC-11`
- target_project: `CAPITAL-AI-DATA`
- target_project_folder: `docs/projects/data`
- primary_owner: `CAPITAL-AI-DATA`
- task: supply explicit DQ result/gate before FINTECH feature/scoring execution
- reason: missing/failed DQ must remain fail-closed
- dependency: DATA DQ authority
- required_evidence: DQ status and negative evidence for failed/insufficient inputs
- verification_gate: no FINTECH score path may bypass failed DQ
- status: `REFERRED_NOT_EXECUTED`

## Downstream OPS

### PVC-18 — EventMesh / Traceability

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]`
- project_namespace: `PVC`
- project_stage: `PVC-18`
- target_project: `CAPITAL-AI-OPS`
- target_project_folder: `docs/projects/operations`
- primary_owner: `CAPITAL-AI-OPS`
- task: transport and retain FINTECH score/ranking traceability through existing EventMesh/Traceability contracts
- reason: transport/operations must remain separate from financial decision authority
- dependency: existing EventMesh, Traceability and Supervisor authorities
- required_evidence: correlation/result lineage references and runtime evidence where applicable
- verification_gate: OPS transport/operations validation
- status: `REFERRED_NOT_EXECUTED`

## Frontend consumer cleanup

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FE | VC-17]`
- project_namespace: `PVC`
- project_stage: `PVC-17`
- target_project: `CAPITAL-AI-FE`
- target_project_folder: `docs/frontend`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: remove browser-owned Top/Worst business ordering once FINTECH exposes the canonical rank/order result
- reason: FE is a presentation consumer and must not become a second productive Ranking authority
- dependency: FINTECH FIN-17 result contract/endpoint first
- required_evidence: FE consumes backend ordering; no local score/rank/comparability/eligibility calculation
- verification_gate: FINTECH contract compatibility plus FE project validation
- status: `REFERRED_NOT_EXECUTED`

`PVC-17` remains Primary-owned by CAPITAL-AI-FINTECH; this handoff is limited to the FE consumer surface and transfers no PVC ownership.

## Quality

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-QM | VC-12]`
- project_namespace: `PVC`
- project_stage: `PVC-12`
- target_project: `CAPITAL-AI-QM`
- target_project_folder: `docs/projects/quality-management`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: validate FINTECH structural/evidence contracts read-only across PVC-12..17 without acquiring financial decision authority
- reason: quality projection must observe current project routing and technical contracts without redefining them
- dependency: FINTECH project surface + existing Quality authority
- required_evidence: read-only structure/contract validation
- verification_gate: QM independent quality validation
- status: `REFERRED_NOT_EXECUTED`

The `docs/projects/quality-management` path is the current Governance-declared target project folder; absence of a mature target surface remains a QM migration dependency and does not authorize FINTECH to create QM implementation.

## Security

Security handoffs for each FINTECH stage are defined in `SECURITY_HANDOFFS.md`; Security owns verification, not FINTECH implementation authority.

## Compliance

- repository_marker: `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-COMP | VC-12]`
- project_namespace: `PVC`
- project_stage: `PVC-12`
- target_project: `CAPITAL-AI-COMP`
- target_project_folder: `docs/compliance/CAPITAL-AI-COMP`
- primary_owner: `CAPITAL-AI-FINTECH`
- task: assess applicable compliance requirements across FINTECH model/score/ranking evidence without executing FINTECH remediation
- reason: compliance assessment is cross-cutting and non-authorizing
- dependency: model, feature, scoring and ranking lineage supplied by FINTECH
- required_evidence: IDs/versions/contracts/lineage and relevant implementation evidence
- verification_gate: CAPITAL-AI-COMP assessment; legal/Owner authority where applicable
- status: `REFERRED_NOT_EXECUTED`

## Cross-domain rule

If a FINTECH task discovers work owned by another Primary Owner, FINTECH stops local implementation for that foreign portion and creates a separate handoff. No project-routing marker transfers underlying Authority. Current `CTRL-SDLC-CHAT-HANDOFF-001` additionally requires a visible foreign-project switch and complete copyable target-project prompt when such productive foreign work becomes the next required step.