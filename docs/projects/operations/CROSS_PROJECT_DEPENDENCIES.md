# CAPITAL-AI-OPS Cross-Project Dependencies

**Project:** `CAPITAL-AI-OPS`  
**Owner mapping:** `docs/projects/README.md` + `docs/projects/PROJECT_VALUE_CHAIN.md`

## Inbound — Governance

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-02` spanning OPS-owned PVC-04/06/07/08/18 lifecycle integration
- **source_project:** `CAPITAL-AI-GOV`
- **task:** materialize `docs/projects/operations/` and integrate the existing DevelopmentChain as project execution lifecycle.
- **status:** accepted into OPS project planning; implementation evidence is this project surface.
- **authority:** Repository execution resolves exclusively through `/AGENTS.md@CURRENT_MAIN`; `DevelopmentChain` is a lifecycle/projection term only and does not create a standalone instruction surface.

## Inbound — Security

CAPITAL-AI-SEC PR #631 provides direct findings for OPS at PVC-02/04/06/08. Detailed records: `SECURITY_HANDOFFS.md`.

Security does not transfer Security verification authority. Returned evidence uses `[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]`.

`S1-R2-06` parent protected-capability inventory is evidence-ready in `controlled-implementation/OPS_02_SEC_06_ENTITLEMENT_CAPABILITY_INVENTORY.md`; target-owner child remediation remains `REFERRED_NOT_EXECUTED`.

## Outbound — Documentary

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DOC | VC-03]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-03`
- **target_project:** `CAPITAL-AI-DOC`
- **task:** Documentary/evidence lifecycle where DOC ownership is required.
- **status:** dependency; OPS does not implement DOC-owned semantics.

## Outbound — Governance / Platform Director

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **target_project:** `CAPITAL-AI-GOV`
- **task:** protected Platform Director/Governance decision and policy reconciliation.
- **status:** dependency.

## Outbound — R2-06 FINTECH canonical scoring

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-16]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-16`
- **target_project:** `CAPITAL-AI-FINTECH`
- **target_project_folder:** `docs/projects/fintech/`
- **primary_owner:** `CAPITAL-AI-FINTECH`
- **task:** make all productive canonical verified-score/context/batch paths consume the accepted `verified_screening` entitlement/quota boundary.
- **reason:** current canonical registry scoring routes bypass the shared server screening quota while legacy scoring routes consume it.
- **dependency:** ADR-0034, existing FINTECH Registry/Dispatcher/CanonicalScoreResult chain, server quota contract.
- **required_evidence:** plan/quota positive cases plus browser-tier escalation, forged identity, missing/invalid identity where applicable, stale entitlement and direct alternate-route DENY evidence.
- **verification_gate:** CAPITAL-AI-SEC independent S1-R2-06 verification.
- **status:** `REFERRED_NOT_EXECUTED`.

## Outbound — R2-06 FINTECH protected analysis

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-15]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-15`
- **target_project:** `CAPITAL-AI-FINTECH`
- **target_project_folder:** `docs/projects/fintech/`
- **primary_owner:** `CAPITAL-AI-FINTECH`
- **task:** establish one authoritative entitlement boundary for Backtest and Monte Carlo, bind `full_ai_analysis` to an explicit productive financial-domain contract, and preserve Buffett server authority while routing any required consumer integration downstream.
- **reason:** current Backtest/Monte-Carlo paths execute without paid server authority; `full_ai_analysis` is not productively bound; Buffett server authority is fail-closed at the current browser caller because the bearer-aware client contract is not used.
- **dependency:** ADR-0034 and DATA validated/history inputs where applicable.
- **required_evidence:** Free/Starter DENY; verified paid-tier ALLOW; forged/missing-bearer/stale-entitlement DENY; automatic/direct alternate-path DENY; exact full-AI capability binding; Buffett authorized consumer path evidence.
- **verification_gate:** CAPITAL-AI-SEC independent S1-R2-06 verification.
- **status:** `REFERRED_NOT_EXECUTED`.

## Outbound — R2-06 FINTECH Newsfeed ingress

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-09]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-09`
- **target_project:** `CAPITAL-AI-FINTECH`
- **target_project_folder:** `docs/projects/fintech/`
- **primary_owner:** `CAPITAL-AI-FINTECH`
- **task:** reconcile public `/api/news*` evidence ingress with the accepted Pro/Enterprise `realtime_ai_newsfeed` entitlement while preserving the canonical FINTECH PVC-09..11 provider/evidence semantics.
- **reason:** current public server route and presentation-only tier display permit direct use without the accepted paid-plan boundary.
- **dependency:** ADR-0034; current news provider/evidence boundary; presentation consumers must not define access authority.
- **required_evidence:** direct Free/Starter DENY and entitled ALLOW if the paid classification remains effective; forged/missing bearer, stale entitlement and all `/api/news*` alternate-route cases covered, or an explicit higher-authority product reclassification.
- **verification_gate:** CAPITAL-AI-SEC independent S1-R2-06 verification.
- **status:** `REFERRED_NOT_EXECUTED`.

## Conditional outbound — R2-06 future child remediation

If later remediation correlation identifies additional foreign productive code:

- Agent Client code → `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-CLIENT | VC-01]`, `project_stage: PVC-01`.
- Provider/data/evidence/DQ and FinTech code → target appropriate `CAPITAL-AI-FINTECH / PVC-09..17`.

OPS records the dependency and does not absorb the implementation merely because the parent Security finding is routed through PVC-02.

## R2-11 boundary

`S1-R2-11` is currently `CAPITAL-AI-FINTECH / PVC-10` primary work. OPS must not implement it unless a separate owner mapping identifies concrete OPS-owned PR/trace tooling code. Until then it remains an external dependency only.
