# CAPITAL-AI-FINTECH — Security Handoffs

**Project:** `CAPITAL-AI-FINTECH`  
**Target project folder:** `docs/projects/fintech/`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**Affected project stages:** `PVC-12..PVC-17`  
**Current-main correlation:** `main@6ace37bffa7912ec4f224feb69dd62ff9c629192`  
**Current routed Security source:** `S1-R2-06 — Entitlement authority`, via merged OPS PR #694 / `OPS-02-SEC-06`

## Boundary

`CAPITAL-AI-SEC` owns Security requirements, threat/control definitions, finding identity, negative-test expectations and independent Security verification.

`CAPITAL-AI-FINTECH` owns productive implementation and project-local evidence only where a concrete Security requirement/finding affects FINTECH-owned `PVC-12..17` code.

FINTECH cannot self-approve Accepted Risk and cannot mark its own Security remediation `VERIFIED` or `CLOSED`. FINTECH completion states are limited to target-local states such as `IMPLEMENTED` or `EVIDENCE_READY`, followed by an explicit return to Security.

## Current finding correlation

The previous FINTECH project surface stated that no concrete active Security finding was directly routed to FINTECH and treated `S1-R2-06` as conditional on an OPS entitlement inventory. That condition is now satisfied.

Merged OPS PR #694 completed `OPS-02-SEC-06` and routed two concrete child remediations to FINTECH:

| FINTECH item | PVC | Security finding | Current state | Required outcome |
|---|---|---|---|---|
| `FIN-SEC-02` | PVC-16 | S1-R2-06 | REFERRED_NOT_EXECUTED / P1 HIGH | canonical verified-score/context/batch routes consume the accepted `verified_screening` server entitlement/quota boundary |
| `FIN-SEC-03` | PVC-15 | S1-R2-06 | REFERRED_NOT_EXECUTED / P1 HIGH | Backtest/Monte Carlo/full-AI protected financial analysis uses an authoritative verified-principal/server-entitlement boundary; Buffett server authority remains intact |

The parent OPS inventory remains coordination/evidence only. It does not implement FINTECH code and does not close the Security finding.

## Stage-level Security baseline

| PVC | FINTECH capability | Security requirement focus | Current direct remediation |
|---|---|---|---|
| PVC-12 | Feature Engineering | validated input, feature integrity, provenance, fail-closed DQ/evidence | none newly routed by OPS-02-SEC-06 |
| PVC-13 | Scoring Models | model/registry integrity, controlled lifecycle, least privilege | none newly routed by OPS-02-SEC-06 |
| PVC-14 | Scoring Orchestration | one dispatcher/tool boundary, no bypass | none newly routed by OPS-02-SEC-06 |
| PVC-15 | Domain Analysis / Executor | provider/tool/domain boundary plus protected-capability authorization | `FIN-SEC-03` |
| PVC-16 | Canonical Scoring | result integrity/lineage plus canonical verified-screening authorization | `FIN-SEC-02` |
| PVC-17 | Ranking / Decision Support | protected decision-input integrity and fail-closed ranking admission | no new direct S1-R2-06 child; existing baseline remains |

## FIN-SEC-02 — PVC-16 verified-screening alternate-route boundary

`[SECURITY_HANDOFF -> CAPITAL-AI-FINTECH | VC-16]`  
`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-16]`

- `project_namespace: PVC`
- `project_stage: PVC-16`
- `target_project: CAPITAL-AI-FINTECH`
- `target_project_folder: docs/projects/fintech/`
- `primary_owner: CAPITAL-AI-FINTECH`
- `source_security_finding: S1-R2-06`
- `task: make every productive canonical verified-score/context/batch path consume the accepted verified_screening entitlement/quota boundary without creating a second scoring or entitlement authority`
- `reason: canonical registry score routes currently bypass enforceScreeningQuota while legacy guarded scoring routes consume it`
- `dependency: ADR-0034; existing ScoringModelRegistry/ScoringDispatcher/CanonicalScoreResult chain; server quota contract`
- `required_evidence: Free/Starter/Pro/Enterprise quota-positive cases; browser-tier escalation DENY; forged identity DENY; missing/invalid identity DENY where applicable; stale-entitlement DENY; direct alternate-route DENY`
- `verification_gate: CAPITAL-AI-SEC independent verification`
- `status: REFERRED_NOT_EXECUTED`

### Security invariant

The remediation must reuse the accepted server entitlement/quota authority. It must not create a second scoring registry, dispatcher, CanonicalScoreResult family, browser-owned entitlement decision or FINTECH-local duplicate subscription authority.

## FIN-SEC-03 — PVC-15 financial-analysis entitlement boundary

`[SECURITY_HANDOFF -> CAPITAL-AI-FINTECH | VC-15]`  
`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-15]`

- `project_namespace: PVC`
- `project_stage: PVC-15`
- `target_project: CAPITAL-AI-FINTECH`
- `target_project_folder: docs/projects/fintech/`
- `primary_owner: CAPITAL-AI-FINTECH`
- `source_security_finding: S1-R2-06`
- `task: define one authoritative entitlement boundary for Backtest and Monte Carlo; bind full_ai_analysis to an explicit productive financial-domain execution contract; preserve the existing Buffett server authority while correcting its consumer integration through the proper downstream handoff`
- `reason: Backtest and Monte Carlo are currently executable without a paid server grant; full_ai_analysis is unbound; Buffett is fail-closed because the current browser caller does not use the bearer-aware client contract`
- `dependency: ADR-0034; DATA validated/history inputs where applicable; Frontend remains a consumer and must not invent business entitlement semantics`
- `required_evidence: authoritative verified-principal/server-entitlement decision; Free/Starter DENY; forged identity DENY; missing bearer DENY; stale-entitlement DENY; automatic/direct alternate-path DENY; exact full_ai_analysis capability binding; Buffett authorization success/failure through bearer-aware consumer path`
- `verification_gate: CAPITAL-AI-SEC independent verification after FINTECH-owned implementation and required downstream consumer handoff`
- `status: REFERRED_NOT_EXECUTED`

### Ownership split

FINTECH owns the financial-domain capability and authoritative execution contract. If browser/UI consumers require changes after that contract is defined, productive presentation work is routed to `CAPITAL-AI-FE / docs/projects/frontend/` and remains foreign implementation from the FINTECH chat.

DATA-owned history/evidence ingress remains `CAPITAL-AI-DATA / PVC-09..11`; FINTECH must not absorb provider or DQ authority while implementing the protected execution boundary.

## Baseline Security requirements for all PVC-12..17 work

FINTECH changes must preserve:

- validated input/evidence/DQ boundaries;
- one productive ScoringModelRegistry and one productive ScoringDispatcher;
- registered executor/provider boundaries;
- CanonicalScoreResult integrity, lineage and fail-closed unavailable semantics;
- protected ranking-input integrity;
- least privilege and verified-principal authorization for protected capabilities;
- no browser/local subscription tier as grant authority;
- no neutral/synthetic fallback for missing required evidence;
- no self-verification of Security findings.

When a concrete remediation changes code, directly relevant positive and negative Security tests are required and must be bound to the exact candidate/runtime identity.

## Required return contract

For actual FINTECH implementation/evidence work, return:

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
